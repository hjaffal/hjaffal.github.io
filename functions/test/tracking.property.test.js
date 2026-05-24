/**
 * Property-based tests for trackOpen and trackClick Cloud Functions.
 * Tests Properties 14, 15, 16 from the design document.
 *
 * Validates: Requirements 5.1, 5.2, 6.1, 6.2, 6.3
 */
const fc = require("fast-check");
const { createMockFirestore } = require("./helpers/mock-firestore");
const { generateTrackingToken, decodeTrackingToken } = require("../newsletter/utils");

// --- Mock setup ---
let mockDb;

jest.mock("firebase-admin", () => ({
  firestore: () => mockDb,
  initializeApp: jest.fn(),
}));

const adminMock = require("firebase-admin");
adminMock.firestore.FieldValue = {
  serverTimestamp: () => "SERVER_TIMESTAMP",
};

jest.mock("firebase-functions/v2/https", () => ({
  onRequest: (opts, handler) => handler,
}));

const { trackOpen, trackClick } = require("../newsletter/tracking");

// --- Generators ---

/**
 * Generates a valid subscriber ID (alphanumeric, non-empty).
 */
const subscriberId = fc.stringOf(
  fc.constantFrom(..."abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_"),
  { minLength: 1, maxLength: 30 }
);

/**
 * Generates a valid edition ID (alphanumeric, non-empty).
 */
const editionId = fc.stringOf(
  fc.constantFrom(..."abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_"),
  { minLength: 1, maxLength: 30 }
);

/**
 * Generates a valid destination URL.
 */
const destinationUrl = fc
  .tuple(
    fc.constantFrom("https://hasanjaffal.com", "https://example.com", "https://blog.test.org"),
    fc.stringOf(fc.constantFrom(..."abcdefghijklmnopqrstuvwxyz0123456789-/"), { minLength: 1, maxLength: 40 })
  )
  .map(([base, path]) => `${base}/${path}`);

/**
 * Generates an invalid tracking token (non-empty strings that cannot decode to valid JSON with s and e fields).
 * Excludes empty string since the implementation treats empty/missing token as "no token" (different path).
 */
const invalidToken = fc.oneof(
  fc.constant("not-a-valid-token!!!"),
  fc.constant("===="),
  fc.constant("{}"),
  // Valid base64url but missing required fields
  fc.constant(Buffer.from(JSON.stringify({ x: "no-s-or-e" })).toString("base64url")),
  fc.constant(Buffer.from(JSON.stringify({ s: "only-s" })).toString("base64url")),
  fc.constant(Buffer.from(JSON.stringify({ e: "only-e" })).toString("base64url")),
  // Random garbage strings (non-empty)
  fc.stringOf(fc.constantFrom(..."!@#$%^&*()[]{}|<>?"), { minLength: 1, maxLength: 20 })
);

// --- Helpers ---

function createMockReq(query = {}) {
  return { query };
}

function createMockRes() {
  const res = {
    _status: null,
    _body: null,
    _headers: {},
    _redirectUrl: null,
    _redirectStatus: null,
    status(code) {
      res._status = code;
      return res;
    },
    send(body) {
      res._body = body;
      return res;
    },
    set(key, value) {
      res._headers[key] = value;
      return res;
    },
    redirect(status, url) {
      res._redirectStatus = status;
      res._redirectUrl = url;
      return res;
    },
  };
  return res;
}

// PNG magic bytes for validation
const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47];

describe("Tracking Property Tests", () => {
  beforeEach(() => {
    mockDb = createMockFirestore();
  });

  /**
   * Property 14: Open tracking is idempotent
   *
   * For any subscriber-edition pair, calling trackOpen multiple times results in
   * exactly one open event document. Always returns valid PNG.
   *
   * **Validates: Requirements 5.1, 5.2**
   */
  describe("Property 14: Open tracking is idempotent", () => {
    it("multiple trackOpen calls for same subscriber-edition produce exactly one event and always return valid PNG", async () => {
      await fc.assert(
        fc.asyncProperty(
          subscriberId,
          editionId,
          fc.integer({ min: 2, max: 5 }),
          async (subId, edId, callCount) => {
            mockDb.reset();

            const token = generateTrackingToken(subId, edId);

            // Call trackOpen multiple times
            for (let i = 0; i < callCount; i++) {
              const req = createMockReq({ t: token });
              const res = createMockRes();

              await trackOpen(req, res);

              // Every call must return a valid PNG
              expect(res._status).toBe(200);
              expect(Buffer.isBuffer(res._body)).toBe(true);
              expect(res._body[0]).toBe(PNG_MAGIC[0]);
              expect(res._body[1]).toBe(PNG_MAGIC[1]);
              expect(res._body[2]).toBe(PNG_MAGIC[2]);
              expect(res._body[3]).toBe(PNG_MAGIC[3]);
              expect(res._headers["Content-Type"]).toBe("image/png");
              expect(res._headers["Cache-Control"]).toBe("no-store, no-cache, must-revalidate");
            }

            // After all calls, there should be exactly one event document
            const allEvents = mockDb.getAll("events");
            const eventKeys = Object.keys(allEvents);
            expect(eventKeys).toHaveLength(1);

            // The document should have the correct compound ID
            const expectedDocId = `${subId}_${edId}_open`;
            expect(allEvents[expectedDocId]).toBeDefined();
            expect(allEvents[expectedDocId].type).toBe("open");
            expect(allEvents[expectedDocId].subscriberId).toBe(subId);
            expect(allEvents[expectedDocId].editionId).toBe(edId);
            expect(allEvents[expectedDocId].unique).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 15: Click tracking records event and redirects
   *
   * For any valid tracking token encoding a subscriber-edition pair and any
   * destination URL, trackClick creates a click event document with the correct
   * subscriberId, editionId, URL, and timestamp, and returns a 302 redirect
   * to the destination.
   *
   * **Validates: Requirements 6.1, 6.2**
   */
  describe("Property 15: Click tracking records event and redirects", () => {
    it("trackClick records click event and returns 302 redirect to destination for any valid token and URL", async () => {
      await fc.assert(
        fc.asyncProperty(subscriberId, editionId, destinationUrl, async (subId, edId, destUrl) => {
          mockDb.reset();

          const token = generateTrackingToken(subId, edId);
          const encodedUrl = Buffer.from(destUrl).toString("base64url");
          const req = createMockReq({ t: token, url: encodedUrl });
          const res = createMockRes();

          await trackClick(req, res);

          // Should redirect with 302 to the destination URL
          expect(res._redirectStatus).toBe(302);
          expect(res._redirectUrl).toBe(destUrl);

          // Should have recorded exactly one click event
          const allEvents = mockDb.getAll("events");
          const eventDocs = Object.values(allEvents);
          expect(eventDocs).toHaveLength(1);

          const event = eventDocs[0];
          expect(event.type).toBe("click");
          expect(event.subscriberId).toBe(subId);
          expect(event.editionId).toBe(edId);
          expect(event.url).toBe(destUrl);
          expect(event.timestamp).toBe("SERVER_TIMESTAMP");
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 16: Invalid click tokens redirect to homepage
   *
   * For any invalid tracking token, trackClick redirects to homepage
   * without recording an event.
   *
   * **Validates: Requirements 6.3**
   */
  describe("Property 16: Invalid click tokens redirect to homepage", () => {
    it("trackClick redirects to homepage and records no event for any invalid token", async () => {
      await fc.assert(
        fc.asyncProperty(invalidToken, destinationUrl, async (badToken, destUrl) => {
          mockDb.reset();

          const encodedUrl = Buffer.from(destUrl).toString("base64url");
          const req = createMockReq({ t: badToken, url: encodedUrl });
          const res = createMockRes();

          await trackClick(req, res);

          // Should redirect with 302 to homepage
          expect(res._redirectStatus).toBe(302);
          expect(res._redirectUrl).toBe("https://hasanjaffal.com");

          // No event should be recorded
          const allEvents = mockDb.getAll("events");
          expect(Object.keys(allEvents)).toHaveLength(0);
        }),
        { numRuns: 100 }
      );
    });
  });
});
