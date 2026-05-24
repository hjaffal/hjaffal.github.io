/**
 * Integration tests for the full subscribe → welcome email flow.
 * Tests the complete end-to-end flow: POST to subscribe → subscriber created
 * in Firestore → welcome email sent via Resend with correct content.
 *
 * Validates: Requirements 1.1, 1.6, 2.1, 2.2, 2.3
 */
const { createMockFirestore } = require("../helpers/mock-firestore");
const { createMockResend } = require("../helpers/mock-resend");

// --- Mock setup ---
let mockFirestoreInstance;
let mockResendInstance;

// Mock firebase-admin
jest.mock("firebase-admin", () => ({
  firestore: jest.fn(() => mockFirestoreInstance),
  initializeApp: jest.fn(),
}));

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
    value: jest.fn(() => "test-resend-api-key"),
  })),
}));

// Mock resend
jest.mock("resend", () => ({
  Resend: jest.fn().mockImplementation(() => mockResendInstance),
}));

const { subscribeNewsletter } = require("../../newsletter/subscribe");

// Helper to create mock request/response
function createMockReqRes(body, method = "POST") {
  const req = { method, body };
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

describe("Integration: Subscribe → Welcome Email Flow", () => {
  beforeEach(() => {
    mockFirestoreInstance = createMockFirestore();
    mockResendInstance = createMockResend();
    jest.clearAllMocks();
  });

  describe("New subscriber flow", () => {
    it("creates subscriber doc and sends welcome email on new subscription", async () => {
      const { req, res } = createMockReqRes({
        email: "newuser@example.com",
        utm_source: "homepage_form",
      });

      await subscribeNewsletter(req, res);

      // Verify success response
      expect(res._status).toBe(200);
      expect(res._json).toEqual({ result: "success" });

      // Verify subscriber doc created in Firestore
      const allSubscribers = mockFirestoreInstance.getAll("subscribers");
      const docs = Object.values(allSubscribers);
      expect(docs.length).toBe(1);

      const subscriber = docs[0];
      expect(subscriber.email).toBe("newuser@example.com");
      expect(subscriber.status).toBe("active");
      expect(subscriber.segments).toEqual(["main_website", "sproochentest_prep"]);
      expect(subscriber.utmSource).toBe("homepage_form");
      expect(subscriber.subscribedAt).toEqual({ _isServerTimestamp: true });
      expect(subscriber.unsubscribeTokenHash).toBeDefined();
      expect(subscriber.unsubscribeTokenHash.length).toBe(64);
      expect(subscriber.welcomeEmailFailed).toBe(false);
      expect(subscriber.softBounceCount).toBe(0);

      // Verify welcome email was sent
      expect(mockResendInstance.getSendCount()).toBe(1);
    });

    it("sends welcome email from correct sender address", async () => {
      const { req, res } = createMockReqRes({ email: "test@example.com" });

      await subscribeNewsletter(req, res);

      const sentEmail = mockResendInstance.getLastSentEmail();
      // Validates: Requirement 2.1 - from "Hasan Jaffal <hasan@hasanjaffal.com>"
      expect(sentEmail.from).toBe("Hasan Jaffal <hasan@hasanjaffal.com>");
      expect(sentEmail.to).toBe("test@example.com");
    });

    it("welcome email contains The Second Mind branding and content description", async () => {
      const { req, res } = createMockReqRes({ email: "reader@example.com" });

      await subscribeNewsletter(req, res);

      const sentEmail = mockResendInstance.getLastSentEmail();
      // Validates: Requirement 2.2 - newsletter name, content topics, frequency
      expect(sentEmail.html).toContain("THE SECOND MIND");
      expect(sentEmail.html).toContain("AI, risk, operations, and decision-making");
      expect(sentEmail.html).toContain("weekly");
      expect(sentEmail.subject).toBe("Welcome to The Second Mind");
    });

    it("welcome email contains personalized unsubscribe link with token", async () => {
      const { req, res } = createMockReqRes({ email: "subscriber@example.com" });

      await subscribeNewsletter(req, res);

      const sentEmail = mockResendInstance.getLastSentEmail();
      // Validates: Requirement 2.3 - unsubscribe link with subscriber token
      const unsubscribeUrlPattern =
        /https:\/\/hasanjaffal\.com\/newsletter\/preferences\/\?token=([a-f0-9]{64})/;
      expect(sentEmail.html).toMatch(unsubscribeUrlPattern);

      // Extract token from email body
      const bodyMatch = sentEmail.html.match(unsubscribeUrlPattern);
      const token = bodyMatch[1];

      // Verify the token in the subscriber doc matches (hash of the token in the email)
      const allSubscribers = mockFirestoreInstance.getAll("subscribers");
      const subscriber = Object.values(allSubscribers)[0];
      expect(subscriber.unsubscribeToken).toBe(token);
    });

    it("welcome email includes List-Unsubscribe and List-Unsubscribe-Post headers", async () => {
      const { req, res } = createMockReqRes({ email: "headers@example.com" });

      await subscribeNewsletter(req, res);

      const sentEmail = mockResendInstance.getLastSentEmail();
      // Validates: Requirement 2.3 - RFC 8058 headers
      expect(sentEmail.headers).toBeDefined();
      expect(sentEmail.headers["List-Unsubscribe"]).toContain(
        "https://hasanjaffal.com/newsletter/preferences/?token="
      );
      expect(sentEmail.headers["List-Unsubscribe-Post"]).toBe("List-Unsubscribe=One-Click");
    });

    it("normalizes email to lowercase before storing", async () => {
      const { req, res } = createMockReqRes({ email: "User@EXAMPLE.COM" });

      await subscribeNewsletter(req, res);

      expect(res._status).toBe(200);
      const allSubscribers = mockFirestoreInstance.getAll("subscribers");
      const subscriber = Object.values(allSubscribers)[0];
      expect(subscriber.email).toBe("user@example.com");
    });

    it("defaults utm_source to 'website' when not provided", async () => {
      const { req, res } = createMockReqRes({ email: "notrack@example.com" });

      await subscribeNewsletter(req, res);

      const allSubscribers = mockFirestoreInstance.getAll("subscribers");
      const subscriber = Object.values(allSubscribers)[0];
      expect(subscriber.utmSource).toBe("website");
    });
  });

  describe("Reactivation flow", () => {
    it("reactivates unsubscribed subscriber and sends welcome email", async () => {
      // Seed an unsubscribed subscriber
      mockFirestoreInstance.seedDoc("subscribers", "unsub_user_1", {
        email: "returning@example.com",
        status: "unsubscribed",
        segments: ["main_website"],
        utmSource: "homepage_form",
        unsubscribeToken: "old_token_abc",
        unsubscribeTokenHash: "a".repeat(64),
        subscribedAt: "2024-01-01T00:00:00Z",
        reactivatedAt: null,
        unsubscribedAt: "2024-06-01T00:00:00Z",
      });

      const { req, res } = createMockReqRes({ email: "returning@example.com" });

      await subscribeNewsletter(req, res);

      // Verify success
      expect(res._status).toBe(200);
      expect(res._json).toEqual({ result: "success" });

      // Verify subscriber was reactivated
      const doc = mockFirestoreInstance.getDoc("subscribers", "unsub_user_1");
      expect(doc.status).toBe("active");
      expect(doc.reactivatedAt).toEqual({ _isServerTimestamp: true });
      // Original subscribedAt preserved
      expect(doc.subscribedAt).toBe("2024-01-01T00:00:00Z");

      // Verify welcome email sent on reactivation
      expect(mockResendInstance.getSendCount()).toBe(1);
      const sentEmail = mockResendInstance.getLastSentEmail();
      expect(sentEmail.to).toBe("returning@example.com");
      expect(sentEmail.html).toContain("THE SECOND MIND");
    });

    it("generates new unsubscribe token on reactivation", async () => {
      const oldToken = "b".repeat(64);
      mockFirestoreInstance.seedDoc("subscribers", "reactivate_1", {
        email: "reactivate@example.com",
        status: "unsubscribed",
        segments: [],
        utmSource: "website",
        unsubscribeToken: oldToken,
        unsubscribeTokenHash: "c".repeat(64),
        subscribedAt: "2024-01-01T00:00:00Z",
        reactivatedAt: null,
      });

      const { req, res } = createMockReqRes({ email: "reactivate@example.com" });

      await subscribeNewsletter(req, res);

      const doc = mockFirestoreInstance.getDoc("subscribers", "reactivate_1");
      // New token should be different from old one
      expect(doc.unsubscribeToken).not.toBe(oldToken);
      expect(doc.unsubscribeToken.length).toBe(64);
      expect(doc.unsubscribeTokenHash.length).toBe(64);
    });
  });

  describe("Idempotent active subscriber flow", () => {
    it("returns success without sending email for already active subscriber", async () => {
      mockFirestoreInstance.seedDoc("subscribers", "active_user_1", {
        email: "active@example.com",
        status: "active",
        segments: ["main_website", "sproochentest_prep"],
        utmSource: "website",
        unsubscribeToken: "d".repeat(64),
        unsubscribeTokenHash: "e".repeat(64),
        subscribedAt: "2024-01-01T00:00:00Z",
      });

      const { req, res } = createMockReqRes({ email: "active@example.com" });

      await subscribeNewsletter(req, res);

      // Should return success
      expect(res._status).toBe(200);
      expect(res._json).toEqual({ result: "success" });

      // No welcome email should be sent
      expect(mockResendInstance.getSendCount()).toBe(0);

      // Subscriber doc should not be modified
      const doc = mockFirestoreInstance.getDoc("subscribers", "active_user_1");
      expect(doc.subscribedAt).toBe("2024-01-01T00:00:00Z");
    });
  });

  describe("Welcome email failure handling", () => {
    it("still returns success when welcome email fails but flags the subscriber", async () => {
      // Configure Resend to fail
      mockResendInstance.setFailure("Resend API timeout");

      const { req, res } = createMockReqRes({ email: "failmail@example.com" });

      await subscribeNewsletter(req, res);

      // Should still return success (subscription succeeded)
      expect(res._status).toBe(200);
      expect(res._json).toEqual({ result: "success" });

      // Subscriber should be created
      const allSubscribers = mockFirestoreInstance.getAll("subscribers");
      const docs = Object.values(allSubscribers);
      expect(docs.length).toBe(1);

      // welcomeEmailFailed flag should be set
      const subscriber = docs[0];
      expect(subscriber.welcomeEmailFailed).toBe(true);
    });
  });

  describe("Sproochentest segment handling", () => {
    it("assigns only sproochentest_prep segment when utm_source is sproochentest", async () => {
      const { req, res } = createMockReqRes({
        email: "lux@example.com",
        utm_source: "sproochentest",
      });

      await subscribeNewsletter(req, res);

      const allSubscribers = mockFirestoreInstance.getAll("subscribers");
      const subscriber = Object.values(allSubscribers)[0];
      expect(subscriber.segments).toEqual(["sproochentest_prep"]);
    });
  });

  describe("Error handling", () => {
    it("returns 400 for invalid email", async () => {
      const { req, res } = createMockReqRes({ email: "not-an-email" });

      await subscribeNewsletter(req, res);

      expect(res._status).toBe(400);
      expect(res._json).toEqual({ error: "Invalid email" });

      // No subscriber created, no email sent
      const allSubscribers = mockFirestoreInstance.getAll("subscribers");
      expect(Object.keys(allSubscribers).length).toBe(0);
      expect(mockResendInstance.getSendCount()).toBe(0);
    });

    it("returns 405 for non-POST requests", async () => {
      const { req, res } = createMockReqRes({ email: "test@example.com" }, "GET");

      await subscribeNewsletter(req, res);

      expect(res._status).toBe(405);
      expect(res._json).toEqual({ error: "Method not allowed" });
    });
  });
});
