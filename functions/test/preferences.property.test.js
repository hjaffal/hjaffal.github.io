/**
 * Property-based tests for newsletterPreferences Cloud Function.
 *
 * Property 6: Preference update correctly sets segments
 * Property 7: Invalid tokens don't leak info or mutate state
 *
 * **Validates: Requirements 3.2, 3.3, 3.6, 8.5**
 */

const fc = require("fast-check");
const crypto = require("crypto");
const { createMockFirestore } = require("./helpers/mock-firestore");
const { segmentArray } = require("./generators/subscriber");

// Mock firebase-admin
let mockDb;

const mockFieldValue = {
  serverTimestamp: () => "SERVER_TIMESTAMP",
};

const firestoreFn = () => mockDb;
firestoreFn.FieldValue = mockFieldValue;

jest.mock("firebase-admin", () => ({
  firestore: firestoreFn,
  initializeApp: jest.fn(),
}));

// Mock firebase-functions
jest.mock("firebase-functions/v2/https", () => ({
  onRequest: (opts, handler) => handler,
}));

const { newsletterPreferences } = require("../newsletter/preferences");

describe("newsletterPreferences - Property Tests", () => {
  let res;

  beforeEach(() => {
    mockDb = createMockFirestore();
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  /**
   * Property 6: Preference update correctly sets segments
   *
   * For any valid token and any subset of ["main_website", "sproochentest_prep"]
   * (including empty), submitting preferences SHALL update the subscriber's
   * segments to exactly that subset. Empty segments → status "unsubscribed".
   * Non-empty → status "active".
   *
   * **Validates: Requirements 3.2, 3.3, 8.5**
   */
  describe("Property 6: Preference update correctly sets segments", () => {
    it("updating segments sets exactly the provided subset and correct status", async () => {
      await fc.assert(
        fc.asyncProperty(
          segmentArray,
          fc.hexaString({ minLength: 32, maxLength: 64 }),
          async (segments, rawToken) => {
            // Reset mocks for each iteration
            mockDb = createMockFirestore();
            res = {
              status: jest.fn().mockReturnThis(),
              json: jest.fn().mockReturnThis(),
            };

            const tokenHash = crypto
              .createHash("sha256")
              .update(rawToken)
              .digest("hex");

            // Seed a subscriber with the token
            mockDb.seedDoc("subscribers", "prop6_sub", {
              email: "prop6@example.com",
              status: "active",
              segments: ["main_website", "sproochentest_prep"],
              unsubscribeTokenHash: tokenHash,
            });

            const req = {
              method: "POST",
              body: { token: rawToken, segments },
              query: {},
            };

            await newsletterPreferences(req, res);

            // Should always succeed
            expect(res.status).toHaveBeenCalledWith(200);

            const updatedDoc = mockDb.getDoc("subscribers", "prop6_sub");

            // Segments should be exactly the valid subset provided
            const validSegments = segments.filter((s) =>
              ["main_website", "sproochentest_prep"].includes(s)
            );
            expect(updatedDoc.segments).toEqual(validSegments);

            // Status depends on whether segments are empty
            if (validSegments.length === 0) {
              expect(updatedDoc.status).toBe("unsubscribed");
              expect(updatedDoc.unsubscribedAt).toBe("SERVER_TIMESTAMP");
            } else {
              expect(updatedDoc.status).toBe("active");
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 7: Invalid tokens don't leak info or mutate state
   *
   * For any string that doesn't match a valid token hash, the endpoint
   * returns 404 with generic error and no subscriber docs are modified.
   *
   * **Validates: Requirements 3.6**
   */
  describe("Property 7: Invalid tokens don't leak info or mutate state", () => {
    it("invalid tokens return 404 with generic error and no subscriber is modified", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.subarray(["main_website", "sproochentest_prep"], {
            minLength: 0,
            maxLength: 2,
          }),
          async (invalidToken, segments) => {
            // Reset mocks for each iteration
            mockDb = createMockFirestore();
            res = {
              status: jest.fn().mockReturnThis(),
              json: jest.fn().mockReturnThis(),
            };

            // Use a known token hash that won't match any generated invalidToken
            const realTokenHash = crypto
              .createHash("sha256")
              .update("known_real_token_that_wont_be_generated_randomly_xyz123")
              .digest("hex");

            // Seed existing subscribers that should NOT be modified
            mockDb.seedDoc("subscribers", "existing_sub_1", {
              email: "existing1@example.com",
              status: "active",
              segments: ["main_website", "sproochentest_prep"],
              unsubscribeTokenHash: realTokenHash,
            });

            mockDb.seedDoc("subscribers", "existing_sub_2", {
              email: "existing2@example.com",
              status: "active",
              segments: ["main_website"],
              unsubscribeTokenHash: "another_fixed_hash_value_abc",
            });

            // Snapshot state before request
            const beforeSub1 = { ...mockDb.getDoc("subscribers", "existing_sub_1") };
            const beforeSub2 = { ...mockDb.getDoc("subscribers", "existing_sub_2") };

            // The invalid token's hash should not match any seeded subscriber
            const invalidTokenHash = crypto
              .createHash("sha256")
              .update(invalidToken)
              .digest("hex");

            // Skip if by extreme coincidence the random token matches our known token
            if (invalidToken === "known_real_token_that_wont_be_generated_randomly_xyz123") {
              return;
            }

            const req = {
              method: "POST",
              body: { token: invalidToken, segments },
              query: {},
            };

            await newsletterPreferences(req, res);

            // Should return 404 with generic error
            expect(res.status).toHaveBeenCalledWith(404);
            const responseBody = res.json.mock.calls[0][0];
            expect(responseBody).toEqual({ error: "not_found" });

            // Response should not contain any email or subscriber data
            const responseStr = JSON.stringify(responseBody);
            expect(responseStr).not.toContain("existing1@example.com");
            expect(responseStr).not.toContain("existing2@example.com");
            expect(responseStr).not.toContain("segments");

            // No subscriber docs should be modified
            const afterSub1 = mockDb.getDoc("subscribers", "existing_sub_1");
            const afterSub2 = mockDb.getDoc("subscribers", "existing_sub_2");
            expect(afterSub1).toEqual(beforeSub1);
            expect(afterSub2).toEqual(beforeSub2);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("invalid tokens on GET also return 404 with no data leak", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 100 }),
          async (invalidToken) => {
            // Reset mocks for each iteration
            mockDb = createMockFirestore();
            res = {
              status: jest.fn().mockReturnThis(),
              json: jest.fn().mockReturnThis(),
            };

            const realTokenHash = crypto
              .createHash("sha256")
              .update("fixed_real_token_for_get_test_never_generated")
              .digest("hex");

            mockDb.seedDoc("subscribers", "get_sub", {
              email: "secret@private.org",
              status: "active",
              segments: ["main_website", "sproochentest_prep"],
              unsubscribeTokenHash: realTokenHash,
            });

            // Snapshot state before request
            const beforeDoc = { ...mockDb.getDoc("subscribers", "get_sub") };

            // Skip if token matches our known token
            if (invalidToken === "fixed_real_token_for_get_test_never_generated") {
              return;
            }

            const req = {
              method: "GET",
              query: { token: invalidToken },
            };

            await newsletterPreferences(req, res);

            // Should return 404 with generic error
            expect(res.status).toHaveBeenCalledWith(404);
            const responseBody = res.json.mock.calls[0][0];
            expect(responseBody).toEqual({ error: "not_found" });

            // Response should not leak any subscriber info
            const responseStr = JSON.stringify(responseBody);
            expect(responseStr).not.toContain("secret@private.org");
            expect(responseStr).not.toContain("email");

            // No subscriber docs should be modified
            const afterDoc = mockDb.getDoc("subscribers", "get_sub");
            expect(afterDoc).toEqual(beforeDoc);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
