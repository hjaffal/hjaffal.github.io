/**
 * Property-based tests for the bounce handler function.
 * Tests Properties 17-21 from the design document.
 *
 * Validates: Requirements 7.1, 7.2, 7.4, 7.5, 7.6
 */
const fc = require("fast-check");
const { createMockFirestore } = require("./helpers/mock-firestore");
const { validEmail } = require("./generators/email");
const { activeSubscriber } = require("./generators/subscriber");
const {
  hardBouncePayload,
  complaintPayload,
  softBouncePayload,
  svixHeaders,
} = require("./generators/webhook");

// --- Mock setup ---
let mockDb;

// Mock firebase-admin
jest.mock("firebase-admin", () => ({
  firestore: () => mockDb,
  initializeApp: jest.fn(),
}));

const adminMock = require("firebase-admin");
adminMock.firestore.FieldValue = {
  serverTimestamp: () => "SERVER_TIMESTAMP",
};

// Mock firebase-functions/v2/https
jest.mock("firebase-functions/v2/https", () => ({
  onRequest: (opts, handler) => handler,
}));

// Mock firebase-functions/params
jest.mock("firebase-functions/params", () => ({
  defineSecret: (name) => ({ value: () => "whsec_test_secret_key" }),
}));

// Mock svix - control verify behavior per test
let mockVerifyResult = null;
let mockVerifyError = null;
jest.mock("svix", () => ({
  Webhook: jest.fn().mockImplementation(() => ({
    verify: (rawBody, headers) => {
      if (mockVerifyError) {
        throw mockVerifyError;
      }
      return mockVerifyResult;
    },
  })),
}));

const { handleBounce } = require("../newsletter/bounce");

// Helper to create mock request
function createMockReq(body, headers = {}) {
  return {
    method: "POST",
    body: body,
    rawBody: Buffer.from(JSON.stringify(body)),
    headers: {
      "svix-id": "msg_test123",
      "svix-timestamp": "1234567890",
      "svix-signature": "v1,valid_signature",
      ...headers,
    },
  };
}

// Helper to create mock response
function createMockRes() {
  const res = {
    _status: null,
    _body: null,
    status(code) {
      res._status = code;
      return res;
    },
    json(body) {
      res._body = body;
      return res;
    },
  };
  return res;
}

describe("Bounce Handler Property Tests", () => {
  beforeEach(() => {
    mockDb = createMockFirestore();
    mockVerifyResult = null;
    mockVerifyError = null;
  });

  /**
   * Property 17: Hard bounce transitions subscriber to bounced
   *
   * For any active subscriber, processing a valid hard bounce webhook for their
   * email SHALL set their status to "bounced", record the bounce reason, and set
   * a non-null bouncedAt timestamp.
   *
   * **Validates: Requirements 7.1**
   */
  describe("Property 17: Hard bounce transitions subscriber to bounced", () => {
    it("sets status to bounced with reason and bouncedAt for any active subscriber", async () => {
      await fc.assert(
        fc.asyncProperty(activeSubscriber, async (subscriber) => {
          // Reset state
          mockDb.reset();
          mockVerifyError = null;

          const email = subscriber.email;

          // Seed the active subscriber
          mockDb.seedDoc("subscribers", "sub1", {
            ...subscriber,
            email: email,
            status: "active",
          });

          // Generate a hard bounce payload targeting this subscriber
          const bounceReason = "550 Mailbox does not exist";
          mockVerifyResult = {
            type: "email.bounced",
            data: {
              to: [email],
              bounce_type: "hard",
              reason: bounceReason,
            },
          };

          const req = createMockReq(mockVerifyResult);
          const res = createMockRes();

          await handleBounce(req, res);

          // Should return 200 processed
          expect(res._status).toBe(200);
          expect(res._body).toEqual({ result: "processed" });

          // Verify subscriber status changed to bounced
          const updatedSubscriber = mockDb.getDoc("subscribers", "sub1");
          expect(updatedSubscriber.status).toBe("bounced");
          expect(updatedSubscriber.bounceReason).toBe(bounceReason);
          expect(updatedSubscriber.bouncedAt).not.toBeNull();
          expect(updatedSubscriber.bouncedAt).toBeDefined();
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 18: Complaint transitions subscriber to complained
   *
   * For any active subscriber, processing a valid complaint webhook for their
   * email SHALL set their status to "complained" and set a non-null complainedAt
   * timestamp.
   *
   * **Validates: Requirements 7.2**
   */
  describe("Property 18: Complaint transitions subscriber to complained", () => {
    it("sets status to complained with complainedAt for any active subscriber", async () => {
      await fc.assert(
        fc.asyncProperty(activeSubscriber, async (subscriber) => {
          // Reset state
          mockDb.reset();
          mockVerifyError = null;

          const email = subscriber.email;

          // Seed the active subscriber
          mockDb.seedDoc("subscribers", "sub1", {
            ...subscriber,
            email: email,
            status: "active",
          });

          // Generate a complaint payload targeting this subscriber
          mockVerifyResult = {
            type: "email.complained",
            data: {
              to: [email],
            },
          };

          const req = createMockReq(mockVerifyResult);
          const res = createMockRes();

          await handleBounce(req, res);

          // Should return 200 processed
          expect(res._status).toBe(200);
          expect(res._body).toEqual({ result: "processed" });

          // Verify subscriber status changed to complained
          const updatedSubscriber = mockDb.getDoc("subscribers", "sub1");
          expect(updatedSubscriber.status).toBe("complained");
          expect(updatedSubscriber.complainedAt).not.toBeNull();
          expect(updatedSubscriber.complainedAt).toBeDefined();
          expect(updatedSubscriber.updatedAt).not.toBeNull();
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 19: Invalid webhook signatures are rejected
   *
   * For any webhook payload where the Svix signature does not match the expected
   * HMAC, the bounce handler SHALL return a 401 status and SHALL NOT modify any
   * subscriber document.
   *
   * **Validates: Requirements 7.4**
   */
  describe("Property 19: Invalid webhook signatures are rejected", () => {
    it("returns 401 and does not modify subscribers for invalid signatures", async () => {
      await fc.assert(
        fc.asyncProperty(
          activeSubscriber,
          fc.string({ minLength: 5, maxLength: 50 }),
          async (subscriber, errorMessage) => {
            // Reset state
            mockDb.reset();

            const email = subscriber.email;

            // Seed the active subscriber
            mockDb.seedDoc("subscribers", "sub1", {
              ...subscriber,
              email: email,
              status: "active",
            });

            // Simulate invalid signature
            mockVerifyError = new Error(errorMessage);
            mockVerifyResult = null;

            const payload = {
              type: "email.bounced",
              data: {
                to: [email],
                reason: "Bounce",
              },
            };

            const req = createMockReq(payload);
            const res = createMockRes();

            await handleBounce(req, res);

            // Should return 401
            expect(res._status).toBe(401);
            expect(res._body).toEqual({ error: "Invalid signature" });

            // Subscriber should NOT be modified
            const unchangedSubscriber = mockDb.getDoc("subscribers", "sub1");
            expect(unchangedSubscriber.status).toBe("active");
            expect(unchangedSubscriber.email).toBe(email);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 20: Soft bounce increments counter without status change
   *
   * For any active subscriber with <3 soft bounces in the last 30 days, a soft
   * bounce increments softBounceCount by 1 and adds an entry to softBounces
   * array, without changing their status from "active".
   *
   * **Validates: Requirements 7.5**
   */
  describe("Property 20: Soft bounce increments counter without status change", () => {
    it("increments softBounceCount without changing status for subscribers with <3 recent bounces", async () => {
      await fc.assert(
        fc.asyncProperty(
          activeSubscriber,
          fc.integer({ min: 0, max: 1 }),
          fc.constantFrom(
            "421 Try again later",
            "450 Requested mail action not taken",
            "451 Temporary service unavailable"
          ),
          async (subscriber, existingBounceCount, reason) => {
            // Reset state
            mockDb.reset();
            mockVerifyError = null;

            const email = subscriber.email;
            const now = new Date();

            // Create existing soft bounces within the 30-day window
            const recentBounces = [];
            for (let i = 0; i < existingBounceCount; i++) {
              const daysAgo = new Date(now.getTime() - (i + 1) * 24 * 60 * 60 * 1000);
              recentBounces.push({
                timestamp: daysAgo.toISOString(),
                reason: `Previous bounce ${i + 1}`,
              });
            }

            // Seed the active subscriber with existing bounces
            mockDb.seedDoc("subscribers", "sub1", {
              ...subscriber,
              email: email,
              status: "active",
              softBounceCount: existingBounceCount,
              softBounces: recentBounces,
            });

            // Generate a soft bounce payload
            mockVerifyResult = {
              type: "email.delivery_delayed",
              data: {
                to: [email],
                reason: reason,
              },
            };

            const req = createMockReq(mockVerifyResult);
            const res = createMockRes();

            await handleBounce(req, res);

            // Should return 200
            expect(res._status).toBe(200);

            // Verify subscriber status remains active
            const updatedSubscriber = mockDb.getDoc("subscribers", "sub1");
            expect(updatedSubscriber.status).toBe("active");

            // Verify softBounceCount incremented
            expect(updatedSubscriber.softBounceCount).toBe(existingBounceCount + 1);

            // Verify softBounces array grew
            expect(updatedSubscriber.softBounces).toHaveLength(existingBounceCount + 1);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 21: Three soft bounces in 30 days triggers bounce status
   *
   * For any subscriber who accumulates 3 or more soft bounces with timestamps
   * all within the most recent 30-day window, the bounce handler SHALL set their
   * status to "bounced". Soft bounces older than 30 days SHALL NOT count toward
   * the threshold.
   *
   * **Validates: Requirements 7.6**
   */
  describe("Property 21: Three soft bounces in 30 days triggers bounce status", () => {
    it("sets status to bounced when third soft bounce occurs within 30-day window", async () => {
      await fc.assert(
        fc.asyncProperty(
          activeSubscriber,
          fc.integer({ min: 1, max: 25 }),
          fc.integer({ min: 1, max: 25 }),
          async (subscriber, daysAgo1, daysAgo2) => {
            // Reset state
            mockDb.reset();
            mockVerifyError = null;

            const email = subscriber.email;
            const now = new Date();

            // Create 2 existing soft bounces within the 30-day window
            const bounce1Date = new Date(now.getTime() - daysAgo1 * 24 * 60 * 60 * 1000);
            const bounce2Date = new Date(now.getTime() - daysAgo2 * 24 * 60 * 60 * 1000);

            const existingBounces = [
              { timestamp: bounce1Date.toISOString(), reason: "Delay 1" },
              { timestamp: bounce2Date.toISOString(), reason: "Delay 2" },
            ];

            // Seed the active subscriber with 2 recent soft bounces
            mockDb.seedDoc("subscribers", "sub1", {
              ...subscriber,
              email: email,
              status: "active",
              softBounceCount: 2,
              softBounces: existingBounces,
            });

            // Generate a third soft bounce
            mockVerifyResult = {
              type: "email.delivery_delayed",
              data: {
                to: [email],
                reason: "Delay 3",
              },
            };

            const req = createMockReq(mockVerifyResult);
            const res = createMockRes();

            await handleBounce(req, res);

            // Should return 200
            expect(res._status).toBe(200);

            // Verify subscriber status changed to bounced
            const updatedSubscriber = mockDb.getDoc("subscribers", "sub1");
            expect(updatedSubscriber.status).toBe("bounced");
            expect(updatedSubscriber.bounceReason).toBe("Too many soft bounces (3+ in 30 days)");
            expect(updatedSubscriber.bouncedAt).not.toBeNull();
            expect(updatedSubscriber.bouncedAt).toBeDefined();
            expect(updatedSubscriber.softBounceCount).toBe(3);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
