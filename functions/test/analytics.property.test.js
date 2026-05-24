/**
 * Property-based tests for getAnalytics Cloud Function.
 * Tests Properties 23, 24, and 25 from the design document.
 *
 * Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5, 11.1
 */
const fc = require("fast-check");
const { createMockFirestore } = require("./helpers/mock-firestore");

// --- Mock setup ---
let mockDb;
let mockVerifyIdToken;

jest.mock("firebase-admin", () => {
  return {
    firestore: () => mockDb,
    auth: () => ({
      verifyIdToken: (...args) => mockVerifyIdToken(...args),
    }),
  };
});

jest.mock("firebase-functions/v2/https", () => ({
  onRequest: (_opts, handler) => handler,
}));

// Import after mocks are set up
const { getAnalytics } = require("../newsletter/analytics");

// Helper to create mock request
function createMockReq(query = {}, headers = {}) {
  return {
    method: "GET",
    query,
    headers: { authorization: "Bearer valid-token", ...headers },
  };
}

// Helper to create mock response
function createMockRes() {
  const res = {
    _status: null,
    _json: null,
    status(code) {
      res._status = code;
      return res;
    },
    json(data) {
      res._json = data;
      return res;
    },
    set() {
      return res;
    },
  };
  return res;
}

// --- Generators ---

/**
 * Generates a non-negative integer for recipient counts, opens, and clicks.
 */
const nonNegativeInt = fc.integer({ min: 0, max: 1000 });

/**
 * Generates a positive integer for totalRecipients > 0 scenarios.
 */
const positiveInt = fc.integer({ min: 1, max: 1000 });

/**
 * Generates a subscriber status.
 */
const subscriberStatus = fc.constantFrom("active", "unsubscribed", "bounced", "complained");

/**
 * Generates a segment array (subsets of the two supported segments).
 */
const segmentArray = fc.subarray(["main_website", "sproochentest_prep"], { minLength: 0, maxLength: 2 });

/**
 * Generates a UTM source string.
 */
const utmSource = fc.constantFrom(
  "homepage_form",
  "skills_assessment",
  "contact_form",
  "admin_added",
  "beehiiv",
  "website"
);

/**
 * Generates a subscriber document for overview testing.
 */
const subscriberForOverview = fc.record({
  status: subscriberStatus,
  segments: segmentArray,
  utmSource: utmSource,
});

describe("Analytics Property Tests", () => {
  beforeEach(() => {
    mockDb = createMockFirestore();
    mockVerifyIdToken = jest.fn().mockResolvedValue({ uid: "admin-user" });
  });

  /**
   * Property 23: Analytics rate calculations
   *
   * For any edition with totalRecipients > 0, openRate = (uniqueOpens / totalRecipients) * 100
   * and clickRate = (uniqueClicks / totalRecipients) * 100.
   * When totalRecipients === 0, both rates are null.
   *
   * **Validates: Requirements 9.1, 9.3, 9.4, 9.5**
   */
  describe("Property 23: Analytics rate calculations", () => {
    it("computes correct open and click rates when totalRecipients > 0", async () => {
      await fc.assert(
        fc.asyncProperty(
          positiveInt,
          fc.integer({ min: 0, max: 500 }),
          fc.integer({ min: 0, max: 500 }),
          async (recipientCount, uniqueOpens, uniqueClickerCount) => {
            mockDb.reset();

            // Seed an edition
            mockDb.seedDoc("editions", "ed1", {
              subject: "Test Edition",
              segment: "main_website",
              recipientCount,
              sentAt: { toDate: () => new Date("2026-05-24T10:00:00Z") },
            });

            // Seed open events (one per unique opener)
            for (let i = 0; i < uniqueOpens; i++) {
              mockDb.seedDoc("events", `sub${i}_ed1_open`, {
                type: "open",
                editionId: "ed1",
                subscriberId: `sub${i}`,
              });
            }

            // Seed click events (one per unique clicker)
            for (let i = 0; i < uniqueClickerCount; i++) {
              mockDb.seedDoc("events", `click_sub${i}`, {
                type: "click",
                editionId: "ed1",
                subscriberId: `clicker${i}`,
                url: `https://example.com/link${i}`,
              });
            }

            const req = createMockReq({ type: "editions" });
            const res = createMockRes();

            await getAnalytics(req, res);

            expect(res._status).toBe(200);
            expect(res._json.editions).toHaveLength(1);

            const edition = res._json.editions[0];
            const expectedOpenRate = (uniqueOpens / recipientCount) * 100;
            const expectedClickRate = (uniqueClickerCount / recipientCount) * 100;

            expect(edition.openRate).toBeCloseTo(expectedOpenRate, 10);
            expect(edition.clickRate).toBeCloseTo(expectedClickRate, 10);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("returns null rates when totalRecipients === 0", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 0, max: 50 }),
          fc.integer({ min: 0, max: 50 }),
          async (uniqueOpens, uniqueClicks) => {
            mockDb.reset();

            // Seed an edition with 0 recipients
            mockDb.seedDoc("editions", "ed_zero", {
              subject: "Zero Recipients Edition",
              segment: "main_website",
              recipientCount: 0,
              sentAt: { toDate: () => new Date("2026-05-24T10:00:00Z") },
            });

            // Seed some events (shouldn't matter for rate calculation)
            for (let i = 0; i < uniqueOpens; i++) {
              mockDb.seedDoc("events", `sub${i}_ed_zero_open`, {
                type: "open",
                editionId: "ed_zero",
                subscriberId: `sub${i}`,
              });
            }

            for (let i = 0; i < uniqueClicks; i++) {
              mockDb.seedDoc("events", `click_sub${i}_ed_zero`, {
                type: "click",
                editionId: "ed_zero",
                subscriberId: `clicker${i}`,
                url: `https://example.com/link${i}`,
              });
            }

            const req = createMockReq({ type: "editions" });
            const res = createMockRes();

            await getAnalytics(req, res);

            expect(res._status).toBe(200);
            expect(res._json.editions).toHaveLength(1);

            const edition = res._json.editions[0];
            expect(edition.openRate).toBeNull();
            expect(edition.clickRate).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });

    it("computes correct rates for edition detail endpoint", async () => {
      await fc.assert(
        fc.asyncProperty(
          positiveInt,
          fc.integer({ min: 0, max: 500 }),
          fc.integer({ min: 0, max: 500 }),
          async (recipientCount, uniqueOpens, uniqueClickerCount) => {
            mockDb.reset();

            // Seed an edition
            mockDb.seedDoc("editions", "ed_detail", {
              subject: "Detail Edition",
              segment: "main_website",
              recipientCount,
              posts: [],
              featuredPost: null,
              toolInvitation: null,
              sentAt: { toDate: () => new Date("2026-05-24T10:00:00Z") },
              failedSends: 0,
            });

            // Seed open events
            for (let i = 0; i < uniqueOpens; i++) {
              mockDb.seedDoc("events", `sub${i}_ed_detail_open`, {
                type: "open",
                editionId: "ed_detail",
                subscriberId: `sub${i}`,
              });
            }

            // Seed click events (unique per subscriber)
            for (let i = 0; i < uniqueClickerCount; i++) {
              mockDb.seedDoc("events", `click_sub${i}_ed_detail`, {
                type: "click",
                editionId: "ed_detail",
                subscriberId: `clicker${i}`,
                url: `https://example.com/link${i}`,
              });
            }

            const req = createMockReq({ type: "edition", id: "ed_detail" });
            const res = createMockRes();

            await getAnalytics(req, res);

            expect(res._status).toBe(200);

            const expectedOpenRate = (uniqueOpens / recipientCount) * 100;
            const expectedClickRate = (uniqueClickerCount / recipientCount) * 100;

            expect(res._json.openRate).toBeCloseTo(expectedOpenRate, 10);
            expect(res._json.clickRate).toBeCloseTo(expectedClickRate, 10);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 24: Subscriber overview counts are correct
   *
   * For any collection of subscriber documents, the overview returns correct counts
   * by status, segment, and utmSource.
   *
   * **Validates: Requirements 9.2**
   */
  describe("Property 24: Subscriber overview counts are correct", () => {
    it("returns correct counts by status, segment, and utmSource for any subscriber set", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(subscriberForOverview, { minLength: 0, maxLength: 50 }),
          async (subscribers) => {
            mockDb.reset();

            // Seed all subscribers
            subscribers.forEach((sub, idx) => {
              mockDb.seedDoc("subscribers", `sub_${idx}`, sub);
            });

            // Compute expected values
            let expectedActive = 0;
            let expectedUnsubscribed = 0;
            let expectedBounced = 0;
            let expectedComplained = 0;
            const expectedBySegment = {};
            const expectedByUtmSource = {};

            subscribers.forEach((sub) => {
              if (sub.status === "active") {
                expectedActive++;
                // Segments counted only for active subscribers
                if (Array.isArray(sub.segments)) {
                  sub.segments.forEach((seg) => {
                    expectedBySegment[seg] = (expectedBySegment[seg] || 0) + 1;
                  });
                }
                // utmSource counted only for active subscribers
                if (sub.utmSource) {
                  expectedByUtmSource[sub.utmSource] = (expectedByUtmSource[sub.utmSource] || 0) + 1;
                }
              } else if (sub.status === "unsubscribed") {
                expectedUnsubscribed++;
              } else if (sub.status === "bounced") {
                expectedBounced++;
              } else if (sub.status === "complained") {
                expectedComplained++;
              }
            });

            const req = createMockReq({ type: "overview" });
            const res = createMockRes();

            await getAnalytics(req, res);

            expect(res._status).toBe(200);
            expect(res._json.totalActive).toBe(expectedActive);
            expect(res._json.totalUnsubscribed).toBe(expectedUnsubscribed);
            expect(res._json.totalBounced).toBe(expectedBounced);
            expect(res._json.totalComplained).toBe(expectedComplained);
            expect(res._json.bySegment).toEqual(expectedBySegment);
            expect(res._json.byUtmSource).toEqual(expectedByUtmSource);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 25: Admin endpoints reject unauthenticated requests
   *
   * For any request without a valid Firebase ID token, analytics endpoints
   * return 401 without executing business logic.
   *
   * **Validates: Requirements 11.1**
   */
  describe("Property 25: Admin endpoints reject unauthenticated requests", () => {
    it("returns 401 for requests without Authorization header", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom("editions", "edition", "overview"),
          async (type) => {
            mockDb.reset();
            mockVerifyIdToken = jest.fn().mockRejectedValue(new Error("Invalid token"));

            // Seed some data that should NOT be returned
            mockDb.seedDoc("editions", "secret_ed", {
              subject: "Secret Edition",
              segment: "main_website",
              recipientCount: 100,
              sentAt: { toDate: () => new Date("2026-05-24T10:00:00Z") },
            });
            mockDb.seedDoc("subscribers", "secret_sub", {
              status: "active",
              segments: ["main_website"],
              utmSource: "homepage_form",
            });

            const query = { type };
            if (type === "edition") {
              query.id = "secret_ed";
            }

            // Request without auth header
            const req = {
              method: "GET",
              query,
              headers: {},
            };
            const res = createMockRes();

            await getAnalytics(req, res);

            expect(res._status).toBe(401);
            // Should not contain any edition or subscriber data
            if (res._json) {
              expect(res._json.editions).toBeUndefined();
              expect(res._json.totalActive).toBeUndefined();
              expect(res._json.editionId).toBeUndefined();
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("returns 401 for requests with invalid Bearer token", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom("editions", "edition", "overview"),
          fc.string({ minLength: 1, maxLength: 100 }),
          async (type, invalidToken) => {
            mockDb.reset();
            mockVerifyIdToken = jest.fn().mockRejectedValue(new Error("Invalid token"));

            // Seed data that should NOT be accessible
            mockDb.seedDoc("editions", "protected_ed", {
              subject: "Protected",
              segment: "main_website",
              recipientCount: 50,
              sentAt: { toDate: () => new Date("2026-05-24T10:00:00Z") },
            });

            const query = { type };
            if (type === "edition") {
              query.id = "protected_ed";
            }

            const req = {
              method: "GET",
              query,
              headers: { authorization: `Bearer ${invalidToken}` },
            };
            const res = createMockRes();

            await getAnalytics(req, res);

            expect(res._status).toBe(401);
            // Should not leak any data
            if (res._json) {
              expect(res._json.editions).toBeUndefined();
              expect(res._json.totalActive).toBeUndefined();
              expect(res._json.editionId).toBeUndefined();
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("returns 401 for requests with malformed Authorization header", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom("editions", "edition", "overview"),
          fc.string({ minLength: 0, maxLength: 100 }).filter((s) => !s.startsWith("Bearer ")),
          async (type, malformedAuth) => {
            mockDb.reset();
            mockVerifyIdToken = jest.fn().mockRejectedValue(new Error("Invalid token"));

            const query = { type };
            if (type === "edition") {
              query.id = "some_id";
            }

            const req = {
              method: "GET",
              query,
              headers: { authorization: malformedAuth },
            };
            const res = createMockRes();

            await getAnalytics(req, res);

            expect(res._status).toBe(401);
            // No business logic data should be returned
            if (res._json) {
              expect(res._json.editions).toBeUndefined();
              expect(res._json.totalActive).toBeUndefined();
              expect(res._json.editionId).toBeUndefined();
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
