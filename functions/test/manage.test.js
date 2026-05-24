/**
 * Unit tests for manageSubscribers Cloud Function
 * Tests all 4 actions: list, add, deactivate, delete.
 *
 * Validates: Requirements 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7
 */

const { createMockFirestore } = require("./helpers/mock-firestore");

let mockDb;

// Mock batch operations
class MockBatch {
  constructor() {
    this._ops = [];
  }
  delete(ref) {
    this._ops.push({ type: "delete", ref });
  }
  async commit() {
    for (const op of this._ops) {
      if (op.type === "delete") {
        await op.ref.delete();
      }
    }
  }
}

const firestoreFn = () => mockDb;
firestoreFn.FieldValue = {
  serverTimestamp: () => "SERVER_TIMESTAMP",
};

jest.mock("firebase-admin", () => ({
  firestore: firestoreFn,
  auth: () => ({
    verifyIdToken: jest.fn().mockResolvedValue({ uid: "admin-user" }),
  }),
}));

jest.mock("firebase-functions/v2/https", () => ({
  onRequest: (_opts, handler) => handler,
}));

// Helper to create mock request
function createMockReq({ method = "GET", query = {}, body = {}, headers = {} } = {}) {
  return {
    method,
    query,
    body,
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
  };
  return res;
}

// Import after mocks are set up
const { manageSubscribers } = require("../newsletter/manage");

describe("manageSubscribers", () => {
  beforeEach(() => {
    mockDb = createMockFirestore();
    // Add batch support to the mock
    mockDb.batch = () => new MockBatch();
  });

  describe("authentication (Requirement 13.7)", () => {
    it("should return 401 when no Authorization header is provided", async () => {
      // Override auth mock to throw
      const admin = require("firebase-admin");
      const originalAuth = admin.auth;
      admin.auth = () => ({
        verifyIdToken: jest.fn().mockRejectedValue(new Error("Invalid token")),
      });

      const req = createMockReq({
        method: "GET",
        query: { action: "list" },
        headers: { authorization: undefined },
      });
      // Remove the authorization header entirely
      delete req.headers.authorization;
      const res = createMockRes();

      await manageSubscribers(req, res);

      expect(res._status).toBe(401);
      expect(res._json.error).toBeDefined();

      // Restore
      admin.auth = originalAuth;
    });

    it("should return 401 when token is invalid", async () => {
      const admin = require("firebase-admin");
      const originalAuth = admin.auth;
      admin.auth = () => ({
        verifyIdToken: jest.fn().mockRejectedValue(new Error("Invalid token")),
      });

      const req = createMockReq({
        method: "GET",
        query: { action: "list" },
        headers: { authorization: "Bearer invalid-token" },
      });
      const res = createMockRes();

      await manageSubscribers(req, res);

      expect(res._status).toBe(401);

      // Restore
      admin.auth = originalAuth;
    });
  });

  describe("action=list (Requirements 13.1, 13.2)", () => {
    it("should return all subscribers sorted by subscribedAt descending", async () => {
      mockDb.seedDoc("subscribers", "s1", {
        email: "alice@example.com",
        status: "active",
        segments: ["main_website", "sproochentest_prep"],
        utmSource: "homepage_form",
        subscribedAt: { toDate: () => new Date("2026-01-10T10:00:00Z") },
      });
      mockDb.seedDoc("subscribers", "s2", {
        email: "bob@example.com",
        status: "active",
        segments: ["main_website"],
        utmSource: "skills_assessment",
        subscribedAt: { toDate: () => new Date("2026-02-15T10:00:00Z") },
      });
      mockDb.seedDoc("subscribers", "s3", {
        email: "charlie@example.com",
        status: "unsubscribed",
        segments: [],
        utmSource: "contact_form",
        subscribedAt: { toDate: () => new Date("2026-03-20T10:00:00Z") },
      });

      const req = createMockReq({ method: "GET", query: { action: "list" } });
      const res = createMockRes();

      await manageSubscribers(req, res);

      expect(res._status).toBe(200);
      expect(res._json.subscribers).toHaveLength(3);
      expect(res._json.total).toBe(3);

      // Should be sorted by subscribedAt descending (most recent first)
      expect(res._json.subscribers[0].email).toBe("charlie@example.com");
      expect(res._json.subscribers[1].email).toBe("bob@example.com");
      expect(res._json.subscribers[2].email).toBe("alice@example.com");

      // Check correct format
      const sub = res._json.subscribers[0];
      expect(sub).toHaveProperty("id");
      expect(sub).toHaveProperty("email");
      expect(sub).toHaveProperty("status");
      expect(sub).toHaveProperty("segments");
      expect(sub).toHaveProperty("utmSource");
      expect(sub).toHaveProperty("subscribedAt");
    });

    it("should filter subscribers by status when status query param is provided", async () => {
      mockDb.seedDoc("subscribers", "s1", {
        email: "active1@example.com",
        status: "active",
        segments: ["main_website"],
        utmSource: "homepage_form",
        subscribedAt: { toDate: () => new Date("2026-01-10T10:00:00Z") },
      });
      mockDb.seedDoc("subscribers", "s2", {
        email: "active2@example.com",
        status: "active",
        segments: ["main_website"],
        utmSource: "homepage_form",
        subscribedAt: { toDate: () => new Date("2026-02-15T10:00:00Z") },
      });
      mockDb.seedDoc("subscribers", "s3", {
        email: "unsub@example.com",
        status: "unsubscribed",
        segments: [],
        utmSource: "contact_form",
        subscribedAt: { toDate: () => new Date("2026-03-20T10:00:00Z") },
      });

      const req = createMockReq({ method: "GET", query: { action: "list", status: "active" } });
      const res = createMockRes();

      await manageSubscribers(req, res);

      expect(res._status).toBe(200);
      expect(res._json.subscribers).toHaveLength(2);
      expect(res._json.total).toBe(2);
      expect(res._json.subscribers.every((s) => s.status === "active")).toBe(true);
    });

    it("should return empty array when no subscribers exist", async () => {
      const req = createMockReq({ method: "GET", query: { action: "list" } });
      const res = createMockRes();

      await manageSubscribers(req, res);

      expect(res._status).toBe(200);
      expect(res._json.subscribers).toEqual([]);
      expect(res._json.total).toBe(0);
    });
  });

  describe("action=add (Requirements 13.3, 13.4)", () => {
    it("should create a subscriber with correct defaults", async () => {
      const req = createMockReq({
        method: "POST",
        query: { action: "add" },
        body: { email: "new@example.com" },
      });
      const res = createMockRes();

      await manageSubscribers(req, res);

      expect(res._status).toBe(200);
      expect(res._json.result).toBe("success");
      expect(res._json.id).toBeDefined();

      // Verify the record was created correctly
      const allSubs = mockDb.getAll("subscribers");
      const subIds = Object.keys(allSubs);
      expect(subIds).toHaveLength(1);

      const sub = allSubs[subIds[0]];
      expect(sub.email).toBe("new@example.com");
      expect(sub.status).toBe("active");
      expect(sub.segments).toEqual(["main_website", "sproochentest_prep"]);
      expect(sub.utmSource).toBe("admin_added");
      expect(sub.subscribedAt).toBe("SERVER_TIMESTAMP");
    });

    it("should return 409 when email already exists", async () => {
      mockDb.seedDoc("subscribers", "existing", {
        email: "existing@example.com",
        status: "active",
        segments: ["main_website"],
        utmSource: "homepage_form",
        subscribedAt: { toDate: () => new Date("2026-01-10T10:00:00Z") },
      });

      const req = createMockReq({
        method: "POST",
        query: { action: "add" },
        body: { email: "existing@example.com" },
      });
      const res = createMockRes();

      await manageSubscribers(req, res);

      expect(res._status).toBe(409);
      expect(res._json.error).toBe("Subscriber already exists");
    });

    it("should return 400 for invalid email", async () => {
      const req = createMockReq({
        method: "POST",
        query: { action: "add" },
        body: { email: "not-an-email" },
      });
      const res = createMockRes();

      await manageSubscribers(req, res);

      expect(res._status).toBe(400);
      expect(res._json.error).toBe("Invalid email");
    });

    it("should normalize email to lowercase", async () => {
      const req = createMockReq({
        method: "POST",
        query: { action: "add" },
        body: { email: "User@Example.COM" },
      });
      const res = createMockRes();

      await manageSubscribers(req, res);

      expect(res._status).toBe(200);

      const allSubs = mockDb.getAll("subscribers");
      const subIds = Object.keys(allSubs);
      const sub = allSubs[subIds[0]];
      expect(sub.email).toBe("user@example.com");
    });
  });

  describe("action=deactivate (Requirement 13.5)", () => {
    it("should set subscriber status to unsubscribed", async () => {
      mockDb.seedDoc("subscribers", "sub123", {
        email: "user@example.com",
        status: "active",
        segments: ["main_website"],
        utmSource: "homepage_form",
        subscribedAt: { toDate: () => new Date("2026-01-10T10:00:00Z") },
      });

      const req = createMockReq({
        method: "POST",
        query: { action: "deactivate" },
        body: { id: "sub123" },
      });
      const res = createMockRes();

      await manageSubscribers(req, res);

      expect(res._status).toBe(200);
      expect(res._json.result).toBe("success");

      // Verify the status was updated
      const sub = mockDb.getDoc("subscribers", "sub123");
      expect(sub.status).toBe("unsubscribed");
      expect(sub.unsubscribedAt).toBe("SERVER_TIMESTAMP");
      expect(sub.updatedAt).toBe("SERVER_TIMESTAMP");
    });

    it("should return 404 when subscriber does not exist", async () => {
      const req = createMockReq({
        method: "POST",
        query: { action: "deactivate" },
        body: { id: "nonexistent" },
      });
      const res = createMockRes();

      await manageSubscribers(req, res);

      expect(res._status).toBe(404);
      expect(res._json.error).toBe("Subscriber not found");
    });

    it("should return 400 when id is missing", async () => {
      const req = createMockReq({
        method: "POST",
        query: { action: "deactivate" },
        body: {},
      });
      const res = createMockRes();

      await manageSubscribers(req, res);

      expect(res._status).toBe(400);
      expect(res._json.error).toBe("Subscriber id is required");
    });
  });

  describe("action=delete (Requirement 13.6)", () => {
    it("should remove subscriber and all associated events", async () => {
      mockDb.seedDoc("subscribers", "sub456", {
        email: "delete-me@example.com",
        status: "active",
        segments: ["main_website"],
        utmSource: "homepage_form",
        subscribedAt: { toDate: () => new Date("2026-01-10T10:00:00Z") },
      });
      // Seed associated events
      mockDb.seedDoc("events", "evt1", {
        type: "open",
        subscriberId: "sub456",
        editionId: "ed1",
        timestamp: { toDate: () => new Date("2026-02-01T10:00:00Z") },
      });
      mockDb.seedDoc("events", "evt2", {
        type: "click",
        subscriberId: "sub456",
        editionId: "ed1",
        url: "https://example.com",
        timestamp: { toDate: () => new Date("2026-02-01T11:00:00Z") },
      });
      // Seed an event for a different subscriber (should NOT be deleted)
      mockDb.seedDoc("events", "evt3", {
        type: "open",
        subscriberId: "other-sub",
        editionId: "ed1",
        timestamp: { toDate: () => new Date("2026-02-01T12:00:00Z") },
      });

      const req = createMockReq({
        method: "POST",
        query: { action: "delete" },
        body: { id: "sub456" },
      });
      const res = createMockRes();

      await manageSubscribers(req, res);

      expect(res._status).toBe(200);
      expect(res._json.result).toBe("success");

      // Verify subscriber was deleted
      expect(mockDb.getDoc("subscribers", "sub456")).toBeNull();

      // Verify associated events were deleted
      expect(mockDb.getDoc("events", "evt1")).toBeNull();
      expect(mockDb.getDoc("events", "evt2")).toBeNull();

      // Verify other subscriber's events remain
      expect(mockDb.getDoc("events", "evt3")).not.toBeNull();
    });

    it("should return 404 when subscriber does not exist", async () => {
      const req = createMockReq({
        method: "POST",
        query: { action: "delete" },
        body: { id: "nonexistent" },
      });
      const res = createMockRes();

      await manageSubscribers(req, res);

      expect(res._status).toBe(404);
      expect(res._json.error).toBe("Subscriber not found");
    });

    it("should return 400 when id is missing", async () => {
      const req = createMockReq({
        method: "POST",
        query: { action: "delete" },
        body: {},
      });
      const res = createMockRes();

      await manageSubscribers(req, res);

      expect(res._status).toBe(400);
      expect(res._json.error).toBe("Subscriber id is required");
    });
  });

  describe("invalid action", () => {
    it("should return 400 for unknown action", async () => {
      const req = createMockReq({ method: "GET", query: { action: "unknown" } });
      const res = createMockRes();

      await manageSubscribers(req, res);

      expect(res._status).toBe(400);
      expect(res._json.error).toBe("Invalid action or method");
    });

    it("should return 400 when action is missing", async () => {
      const req = createMockReq({ method: "GET", query: {} });
      const res = createMockRes();

      await manageSubscribers(req, res);

      expect(res._status).toBe(400);
      expect(res._json.error).toBe("Invalid action or method");
    });
  });
});
