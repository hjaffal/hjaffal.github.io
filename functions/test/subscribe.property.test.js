/**
 * Property-based tests for the subscribe function.
 * Tests Properties 1-5 from the design document.
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 2.3, 3.5
 */
const fc = require("fast-check");
const { createMockFirestore } = require("./helpers/mock-firestore");
const { createMockResend } = require("./helpers/mock-resend");
const { validEmail, invalidEmail } = require("./generators/email");
const { utmSource, activeSubscriber, unsubscribedSubscriber } = require("./generators/subscriber");

// --- Mock setup ---
let mockFirestoreInstance;
let mockResendInstance;

// Mock firebase-admin
jest.mock("firebase-admin", () => ({
  firestore: jest.fn(() => mockFirestoreInstance),
  initializeApp: jest.fn(),
}));

// Add FieldValue to the firestore function
const adminMock = require("firebase-admin");
adminMock.firestore.FieldValue = {
  serverTimestamp: jest.fn(() => ({ _isServerTimestamp: true })),
};

// Mock firebase-functions/v2/https
jest.mock("firebase-functions/v2/https", () => ({
  onRequest: jest.fn((options, handler) => handler),
}));

// Mock firebase-functions/params
jest.mock("firebase-functions/params", () => ({
  defineSecret: jest.fn(() => ({
    value: jest.fn(() => "mock-resend-api-key"),
  })),
}));

// Mock resend
jest.mock("resend", () => ({
  Resend: jest.fn().mockImplementation(() => mockResendInstance),
}));

// Now require the subscribe module (after mocks are set up)
const { subscribeNewsletter, sendWelcomeEmail } = require("../newsletter/subscribe");

// Helper to create a mock request/response pair
function createMockReqRes(body, method = "POST") {
  const req = {
    method,
    body: body,
  };
  const res = {
    _status: null,
    _json: null,
    status: jest.fn(function (code) {
      this._status = code;
      return this;
    }),
    json: jest.fn(function (data) {
      this._json = data;
      return this;
    }),
  };
  return { req, res };
}

describe("Subscribe Property Tests", () => {
  beforeEach(() => {
    mockFirestoreInstance = createMockFirestore();
    mockResendInstance = createMockResend();
    jest.clearAllMocks();
  });

  /**
   * Property 1: Subscribe creates correct record
   *
   * For any valid email address and utm_source string, calling the subscribe function
   * SHALL create a subscriber document with status "active", the provided utm_source,
   * segments ["main_website", "sproochentest_prep"], a non-null subscribedAt timestamp,
   * and a non-null unsubscribeTokenHash.
   *
   * **Validates: Requirements 1.1**
   */
  describe("Property 1: Subscribe creates correct record", () => {
    it("creates a subscriber with correct fields for any valid email and utm_source", async () => {
      await fc.assert(
        fc.asyncProperty(
          validEmail,
          fc.option(utmSource, { nil: undefined }),
          async (email, source) => {
            // Reset state for each iteration
            mockFirestoreInstance.reset();
            mockResendInstance.reset();

            const body = { email };
            if (source !== undefined) {
              body.utm_source = source;
            }

            const { req, res } = createMockReqRes(body);
            await subscribeNewsletter(req, res);

            // Should return 200 success
            expect(res._status).toBe(200);
            expect(res._json).toEqual({ result: "success" });

            // Verify subscriber was created in Firestore
            const allSubscribers = mockFirestoreInstance.getAll("subscribers");
            const docs = Object.values(allSubscribers);
            expect(docs.length).toBe(1);

            const subscriber = docs[0];
            expect(subscriber.status).toBe("active");
            expect(subscriber.email).toBe(email.trim().toLowerCase());
            expect(subscriber.utmSource).toBe(source || "website");
            expect(subscriber.segments).toEqual(["main_website", "sproochentest_prep"]);
            expect(subscriber.subscribedAt).not.toBeNull();
            expect(subscriber.unsubscribeTokenHash).toBeDefined();
            expect(subscriber.unsubscribeTokenHash).not.toBeNull();
            expect(typeof subscriber.unsubscribeTokenHash).toBe("string");
            expect(subscriber.unsubscribeTokenHash.length).toBe(64);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Property 2: Subscribe is idempotent for active subscribers
   *
   * For any email address that already exists in the subscribers collection with
   * status "active", calling subscribe again SHALL NOT create a new document,
   * SHALL NOT modify the existing document's subscribedAt or unsubscribeTokenHash,
   * and SHALL return a success response.
   *
   * **Validates: Requirements 1.2**
   */
  describe("Property 2: Subscribe is idempotent for active subscribers", () => {
    it("does not modify existing active subscriber on re-subscribe", async () => {
      await fc.assert(
        fc.asyncProperty(activeSubscriber, async (existingSubscriber) => {
          // Reset state for each iteration
          mockFirestoreInstance.reset();
          mockResendInstance.reset();

          const email = existingSubscriber.email;

          // Seed the existing active subscriber
          mockFirestoreInstance.seedDoc("subscribers", "existing_doc_1", existingSubscriber);

          const originalSubscribedAt = existingSubscriber.subscribedAt;
          const originalTokenHash = existingSubscriber.unsubscribeTokenHash;

          const { req, res } = createMockReqRes({ email });
          await subscribeNewsletter(req, res);

          // Should return 200 success
          expect(res._status).toBe(200);
          expect(res._json).toEqual({ result: "success" });

          // Verify no new document was created
          const allSubscribers = mockFirestoreInstance.getAll("subscribers");
          expect(Object.keys(allSubscribers).length).toBe(1);

          // Verify existing document was NOT modified
          const doc = mockFirestoreInstance.getDoc("subscribers", "existing_doc_1");
          expect(doc.subscribedAt).toBe(originalSubscribedAt);
          expect(doc.unsubscribeTokenHash).toBe(originalTokenHash);
          expect(doc.status).toBe("active");

          // No welcome email should be sent for idempotent case
          expect(mockResendInstance.getSendCount()).toBe(0);
        }),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Property 3: Reactivation transitions unsubscribed to active
   *
   * For any subscriber with status "unsubscribed", calling subscribe with their
   * email SHALL update their status to "active", set a non-null reactivatedAt
   * timestamp, and preserve their original subscribedAt.
   *
   * **Validates: Requirements 1.3**
   */
  describe("Property 3: Reactivation transitions unsubscribed to active", () => {
    it("reactivates unsubscribed subscriber to active with reactivatedAt", async () => {
      await fc.assert(
        fc.asyncProperty(unsubscribedSubscriber, async (existingSubscriber) => {
          // Reset state for each iteration
          mockFirestoreInstance.reset();
          mockResendInstance.reset();

          const email = existingSubscriber.email;
          const originalSubscribedAt = existingSubscriber.subscribedAt;

          // Seed the existing unsubscribed subscriber
          mockFirestoreInstance.seedDoc("subscribers", "unsub_doc_1", existingSubscriber);

          const { req, res } = createMockReqRes({ email });
          await subscribeNewsletter(req, res);

          // Should return 200 success
          expect(res._status).toBe(200);
          expect(res._json).toEqual({ result: "success" });

          // Verify subscriber was reactivated
          const doc = mockFirestoreInstance.getDoc("subscribers", "unsub_doc_1");
          expect(doc.status).toBe("active");
          expect(doc.reactivatedAt).not.toBeNull();
          expect(doc.reactivatedAt).toBeDefined();

          // Original subscribedAt should be preserved
          expect(doc.subscribedAt).toBe(originalSubscribedAt);
        }),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Property 4: Invalid emails are rejected
   *
   * For any string that does not match the email format regex ^[^\s@]+@[^\s@]+\.[^\s@]+$,
   * calling subscribe SHALL return a 400 status code and SHALL NOT create or modify
   * any subscriber document.
   *
   * **Validates: Requirements 1.4**
   */
  describe("Property 4: Invalid emails are rejected", () => {
    it("returns 400 and creates no subscriber for invalid emails", async () => {
      await fc.assert(
        fc.asyncProperty(invalidEmail, async (email) => {
          // Reset state for each iteration
          mockFirestoreInstance.reset();
          mockResendInstance.reset();

          const { req, res } = createMockReqRes({ email });
          await subscribeNewsletter(req, res);

          // Should return 400 error
          expect(res._status).toBe(400);
          expect(res._json).toEqual({ error: "Invalid email" });

          // No subscriber should be created
          const allSubscribers = mockFirestoreInstance.getAll("subscribers");
          expect(Object.keys(allSubscribers).length).toBe(0);

          // No email should be sent
          expect(mockResendInstance.getSendCount()).toBe(0);
        }),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Property 5: All sent emails contain personalized unsubscribe link
   *
   * For any email sent by the system (welcome), the HTML body SHALL contain an
   * unsubscribe URL that includes the subscriber's raw unsubscribe token, and
   * the email headers SHALL include List-Unsubscribe and List-Unsubscribe-Post headers.
   *
   * **Validates: Requirements 2.3, 3.5**
   */
  describe("Property 5: All sent emails contain personalized unsubscribe link", () => {
    it("welcome email contains personalized unsubscribe link and headers", async () => {
      await fc.assert(
        fc.asyncProperty(validEmail, async (email) => {
          // Reset state for each iteration
          mockFirestoreInstance.reset();
          mockResendInstance.reset();

          const { req, res } = createMockReqRes({ email });
          await subscribeNewsletter(req, res);

          // Should succeed
          expect(res._status).toBe(200);

          // A welcome email should have been sent
          expect(mockResendInstance.getSendCount()).toBe(1);

          const sentEmail = mockResendInstance.getLastSentEmail();

          // The HTML body should contain the unsubscribe URL with a token
          expect(sentEmail.html).toContain("https://hasanjaffal.com/newsletter/preferences/?token=");

          // Extract the token from the unsubscribe URL in the HTML
          const tokenMatch = sentEmail.html.match(
            /https:\/\/hasanjaffal\.com\/newsletter\/preferences\/\?token=([a-f0-9]+)/
          );
          expect(tokenMatch).not.toBeNull();
          const token = tokenMatch[1];
          expect(token.length).toBe(64); // 32 bytes hex = 64 chars

          // Headers should include List-Unsubscribe with the same token
          expect(sentEmail.headers["List-Unsubscribe"]).toContain(token);
          expect(sentEmail.headers["List-Unsubscribe"]).toContain(
            "https://hasanjaffal.com/newsletter/preferences/?token="
          );

          // Headers should include List-Unsubscribe-Post for RFC 8058
          expect(sentEmail.headers["List-Unsubscribe-Post"]).toBe("List-Unsubscribe=One-Click");
        }),
        { numRuns: 50 }
      );
    });
  });
});
