/**
 * Property-based tests for the importSubscribers function.
 * Tests Property 26 from the design document.
 *
 * **Validates: Requirements 12.1, 12.2, 12.3, 12.4**
 */
const fc = require("fast-check");
const { createMockFirestore } = require("./helpers/mock-firestore");
const { validEmail, invalidEmail } = require("./generators/email");

// --- Mock setup ---
let mockFirestoreInstance;

// Mock batch class for Firestore batched writes
class MockBatch {
  constructor(store) {
    this._store = store;
    this._ops = [];
  }

  set(docRef, data) {
    this._ops.push({ type: "set", ref: docRef, data });
  }

  async commit() {
    for (const op of this._ops) {
      if (op.type === "set") {
        await op.ref.set(op.data);
      }
    }
  }
}

// Mock firebase-admin
jest.mock("firebase-admin", () => {
  const firestoreFn = () => mockFirestoreInstance;
  firestoreFn.FieldValue = {
    serverTimestamp: () => "SERVER_TIMESTAMP",
  };
  firestoreFn.Timestamp = {
    fromDate: (date) => ({ _isTimestamp: true, toDate: () => date }),
  };

  return {
    firestore: firestoreFn,
    initializeApp: jest.fn(),
    auth: () => ({
      verifyIdToken: jest.fn().mockResolvedValue({ uid: "admin-user" }),
    }),
  };
});

// Mock firebase-functions/v2/https
jest.mock("firebase-functions/v2/https", () => ({
  onRequest: jest.fn((options, handler) => handler),
}));

// Mock firebase-functions/params
jest.mock("firebase-functions/params", () => ({
  defineSecret: jest.fn(() => ({
    value: jest.fn(() => "mock-secret"),
  })),
}));

// Now require the import module (after mocks are set up)
const { importSubscribers } = require("../newsletter/import");

// Helper to create a mock request/response pair
function createMockReqRes(body, method = "POST", headers = {}) {
  const req = {
    method,
    body,
    headers: {
      authorization: "Bearer valid-token",
      ...headers,
    },
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

/**
 * Generator for a batch of import subscriber records with a controlled mix of:
 * - valid emails (new, should be imported)
 * - invalid emails (should be rejected)
 * - duplicate emails (pre-seeded in Firestore, should be skipped)
 */
const importBatch = fc
  .record({
    validNewEmails: fc.array(validEmail, { minLength: 0, maxLength: 10 }),
    invalidEmails: fc.array(invalidEmail, { minLength: 0, maxLength: 5 }),
    duplicateEmails: fc.array(validEmail, { minLength: 0, maxLength: 5 }),
  })
  .filter(
    (batch) =>
      batch.validNewEmails.length +
        batch.invalidEmails.length +
        batch.duplicateEmails.length >
      0
  );

describe("Import Property Tests", () => {
  beforeEach(() => {
    mockFirestoreInstance = createMockFirestore();
    // Add batch support to the mock
    mockFirestoreInstance.batch = () => new MockBatch(mockFirestoreInstance);
    jest.clearAllMocks();
  });

  /**
   * Property 26: Import invariant
   *
   * For any batch of subscriber records to import, the sum of
   * imported + skipped + rejected SHALL equal the total number of input records.
   * Records with emails already in Firestore SHALL be counted as skipped.
   * Records with invalid email formats SHALL be counted as rejected.
   * All other records SHALL be counted as imported and have corresponding
   * documents in Firestore.
   *
   * **Validates: Requirements 12.1, 12.2, 12.3, 12.4**
   */
  describe("Property 26: Import invariant", () => {
    it("imported + skipped + rejected equals total input records", async () => {
      await fc.assert(
        fc.asyncProperty(importBatch, async (batch) => {
          // Reset state for each iteration
          mockFirestoreInstance.reset();
          mockFirestoreInstance.batch = () => new MockBatch(mockFirestoreInstance);

          const { validNewEmails, invalidEmails, duplicateEmails } = batch;

          // Normalize duplicate emails and seed them in Firestore
          const seededEmails = new Set();
          duplicateEmails.forEach((email, idx) => {
            const normalized = email.trim().toLowerCase();
            if (!seededEmails.has(normalized)) {
              seededEmails.add(normalized);
              mockFirestoreInstance.seedDoc("subscribers", `existing_${idx}`, {
                email: normalized,
                status: "active",
                segments: ["main_website", "sproochentest_prep"],
              });
            }
          });

          // Build the subscribers array for the import request
          const subscribers = [];

          // Add valid new emails (should be imported)
          for (const email of validNewEmails) {
            const normalized = email.trim().toLowerCase();
            // Only count as "new" if not already seeded as duplicate
            if (!seededEmails.has(normalized)) {
              subscribers.push({
                email,
                status: "active",
                subscribedAt: "2024-06-01T10:00:00Z",
              });
            } else {
              // If it happens to collide with a duplicate, treat it as a duplicate record
              subscribers.push({
                email,
                status: "active",
                subscribedAt: "2024-06-01T10:00:00Z",
              });
            }
          }

          // Add invalid emails (should be rejected)
          for (const email of invalidEmails) {
            subscribers.push({
              email,
              status: "active",
              subscribedAt: "2024-03-15T08:00:00Z",
            });
          }

          // Add duplicate emails (should be skipped)
          for (const email of duplicateEmails) {
            subscribers.push({
              email,
              status: "active",
              subscribedAt: "2024-01-01T00:00:00Z",
            });
          }

          const totalInput = subscribers.length;

          const { req, res } = createMockReqRes({ subscribers });
          await importSubscribers(req, res);

          // Should return 200
          expect(res._status).toBe(200);

          const result = res._json;

          // INVARIANT: imported + skipped + rejected === total input
          expect(result.imported + result.skipped + result.rejected).toBe(totalInput);
        }),
        { numRuns: 100 }
      );
    });

    it("records with emails already in Firestore are counted as skipped", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(validEmail, { minLength: 1, maxLength: 8 }),
          async (duplicateEmails) => {
            // Reset state for each iteration
            mockFirestoreInstance.reset();
            mockFirestoreInstance.batch = () => new MockBatch(mockFirestoreInstance);

            // Seed all emails as existing subscribers
            const seededNormalized = new Set();
            duplicateEmails.forEach((email, idx) => {
              const normalized = email.trim().toLowerCase();
              if (!seededNormalized.has(normalized)) {
                seededNormalized.add(normalized);
                mockFirestoreInstance.seedDoc("subscribers", `dup_${idx}`, {
                  email: normalized,
                  status: "active",
                  segments: ["main_website"],
                });
              }
            });

            const subscribers = duplicateEmails.map((email) => ({
              email,
              status: "active",
              subscribedAt: "2024-01-01T00:00:00Z",
            }));

            const { req, res } = createMockReqRes({ subscribers });
            await importSubscribers(req, res);

            expect(res._status).toBe(200);
            // All should be skipped (since they all exist)
            expect(res._json.skipped).toBe(subscribers.length);
            expect(res._json.imported).toBe(0);
            expect(res._json.rejected).toBe(0);
          }
        ),
        { numRuns: 50 }
      );
    });

    it("records with invalid email formats are counted as rejected", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(invalidEmail, { minLength: 1, maxLength: 8 }),
          async (badEmails) => {
            // Reset state for each iteration
            mockFirestoreInstance.reset();
            mockFirestoreInstance.batch = () => new MockBatch(mockFirestoreInstance);

            const subscribers = badEmails.map((email) => ({
              email,
              status: "active",
              subscribedAt: "2024-05-01T00:00:00Z",
            }));

            const { req, res } = createMockReqRes({ subscribers });
            await importSubscribers(req, res);

            expect(res._status).toBe(200);
            // All should be rejected
            expect(res._json.rejected).toBe(subscribers.length);
            expect(res._json.imported).toBe(0);
            expect(res._json.skipped).toBe(0);
          }
        ),
        { numRuns: 50 }
      );
    });

    it("valid new records are imported and have corresponding documents in Firestore", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(validEmail, { minLength: 1, maxLength: 8 }),
          async (newEmails) => {
            // Reset state for each iteration
            mockFirestoreInstance.reset();
            mockFirestoreInstance.batch = () => new MockBatch(mockFirestoreInstance);

            // Deduplicate emails (the import processes sequentially, so
            // if the same email appears twice, the second one will be skipped
            // after the first is imported)
            const subscribers = newEmails.map((email) => ({
              email,
              status: "active",
              subscribedAt: "2024-07-01T12:00:00Z",
            }));

            const { req, res } = createMockReqRes({ subscribers });
            await importSubscribers(req, res);

            expect(res._status).toBe(200);

            const result = res._json;

            // All valid new emails should be imported (accounting for
            // duplicates within the batch itself being skipped after first import)
            expect(result.imported + result.skipped).toBe(subscribers.length);
            expect(result.rejected).toBe(0);

            // Each imported record should have a corresponding document in Firestore
            const allDocs = mockFirestoreInstance.getAll("subscribers");
            const importedEmails = Object.values(allDocs).map((doc) => doc.email);

            // The number of unique normalized emails that were imported
            const uniqueNormalized = new Set(
              newEmails.map((e) => e.trim().toLowerCase())
            );
            expect(result.imported).toBe(uniqueNormalized.size);

            // Each unique email should have a document
            for (const normalizedEmail of uniqueNormalized) {
              expect(importedEmails).toContain(normalizedEmail);
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
