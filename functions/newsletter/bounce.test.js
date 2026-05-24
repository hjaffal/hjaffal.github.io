/**
 * Unit tests for handleBounce Cloud Function (task 9.1).
 */

const { createMockFirestore } = require("../test/helpers/mock-firestore");

// Mock firebase-admin
let mockDb;
jest.mock("firebase-admin", () => ({
  firestore: () => mockDb,
  initializeApp: jest.fn(),
}));

const adminMock = require("firebase-admin");
adminMock.firestore.FieldValue = {
  serverTimestamp: () => "SERVER_TIMESTAMP",
};

// Mock firebase-functions
jest.mock("firebase-functions/v2/https", () => ({
  onRequest: (opts, handler) => handler,
}));

jest.mock("firebase-functions/params", () => ({
  defineSecret: (name) => ({ value: () => "whsec_test_secret_key" }),
}));

// Mock svix - we control verification behavior per test
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

const { handleBounce } = require("./bounce");

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

describe("handleBounce", () => {
  beforeEach(() => {
    mockDb = createMockFirestore();
    mockVerifyResult = null;
    mockVerifyError = null;
  });

  describe("signature validation", () => {
    it("returns 401 when webhook signature is invalid", async () => {
      mockVerifyError = new Error("Invalid signature");

      const req = createMockReq({ type: "email.bounced", data: { to: ["test@example.com"] } });
      const res = createMockRes();

      await handleBounce(req, res);

      expect(res._status).toBe(401);
      expect(res._body).toEqual({ error: "Invalid signature" });
    });

    it("returns 405 for non-POST requests", async () => {
      const req = { method: "GET", headers: {} };
      const res = createMockRes();

      await handleBounce(req, res);

      expect(res._status).toBe(405);
      expect(res._body).toEqual({ error: "Method not allowed" });
    });
  });

  describe("hard bounce (email.bounced)", () => {
    it("sets subscriber status to bounced with reason and timestamp", async () => {
      mockDb.seedDoc("subscribers", "sub1", {
        email: "user@example.com",
        status: "active",
        softBounceCount: 0,
        softBounces: [],
      });

      mockVerifyResult = {
        type: "email.bounced",
        data: {
          to: ["user@example.com"],
          bounce_type: "hard",
          reason: "Mailbox does not exist",
        },
      };

      const req = createMockReq(mockVerifyResult);
      const res = createMockRes();

      await handleBounce(req, res);

      expect(res._status).toBe(200);
      expect(res._body).toEqual({ result: "processed" });

      const subscriber = mockDb.getDoc("subscribers", "sub1");
      expect(subscriber.status).toBe("bounced");
      expect(subscriber.bounceReason).toBe("Mailbox does not exist");
      expect(subscriber.bouncedAt).toBe("SERVER_TIMESTAMP");
      expect(subscriber.updatedAt).toBe("SERVER_TIMESTAMP");
    });

    it("uses default reason when none provided", async () => {
      mockDb.seedDoc("subscribers", "sub1", {
        email: "user@example.com",
        status: "active",
      });

      mockVerifyResult = {
        type: "email.bounced",
        data: {
          to: ["user@example.com"],
          bounce_type: "hard",
        },
      };

      const req = createMockReq(mockVerifyResult);
      const res = createMockRes();

      await handleBounce(req, res);

      const subscriber = mockDb.getDoc("subscribers", "sub1");
      expect(subscriber.status).toBe("bounced");
      expect(subscriber.bounceReason).toBe("Hard bounce");
    });
  });

  describe("complaint (email.complained)", () => {
    it("sets subscriber status to complained with timestamp", async () => {
      mockDb.seedDoc("subscribers", "sub1", {
        email: "user@example.com",
        status: "active",
      });

      mockVerifyResult = {
        type: "email.complained",
        data: {
          to: ["user@example.com"],
        },
      };

      const req = createMockReq(mockVerifyResult);
      const res = createMockRes();

      await handleBounce(req, res);

      expect(res._status).toBe(200);
      expect(res._body).toEqual({ result: "processed" });

      const subscriber = mockDb.getDoc("subscribers", "sub1");
      expect(subscriber.status).toBe("complained");
      expect(subscriber.complainedAt).toBe("SERVER_TIMESTAMP");
      expect(subscriber.updatedAt).toBe("SERVER_TIMESTAMP");
    });
  });

  describe("soft bounce (email.delivery_delayed)", () => {
    it("increments softBounceCount and adds to softBounces array", async () => {
      mockDb.seedDoc("subscribers", "sub1", {
        email: "user@example.com",
        status: "active",
        softBounceCount: 0,
        softBounces: [],
      });

      mockVerifyResult = {
        type: "email.delivery_delayed",
        data: {
          to: ["user@example.com"],
          reason: "Temporary failure",
        },
      };

      const req = createMockReq(mockVerifyResult);
      const res = createMockRes();

      await handleBounce(req, res);

      expect(res._status).toBe(200);

      const subscriber = mockDb.getDoc("subscribers", "sub1");
      expect(subscriber.status).toBe("active");
      expect(subscriber.softBounceCount).toBe(1);
      expect(subscriber.softBounces).toHaveLength(1);
      expect(subscriber.softBounces[0].reason).toBe("Temporary failure");
    });

    it("sets status to bounced when 3+ soft bounces in 30-day window", async () => {
      const now = new Date();
      const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
      const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);

      mockDb.seedDoc("subscribers", "sub1", {
        email: "user@example.com",
        status: "active",
        softBounceCount: 2,
        softBounces: [
          { timestamp: tenDaysAgo.toISOString(), reason: "Delay 1" },
          { timestamp: fiveDaysAgo.toISOString(), reason: "Delay 2" },
        ],
      });

      mockVerifyResult = {
        type: "email.delivery_delayed",
        data: {
          to: ["user@example.com"],
          reason: "Delay 3",
        },
      };

      const req = createMockReq(mockVerifyResult);
      const res = createMockRes();

      await handleBounce(req, res);

      expect(res._status).toBe(200);

      const subscriber = mockDb.getDoc("subscribers", "sub1");
      expect(subscriber.status).toBe("bounced");
      expect(subscriber.bounceReason).toBe("Too many soft bounces (3+ in 30 days)");
      expect(subscriber.bouncedAt).toBe("SERVER_TIMESTAMP");
      expect(subscriber.softBounceCount).toBe(3);
    });

    it("does not count soft bounces older than 30 days toward threshold", async () => {
      const now = new Date();
      const fortyDaysAgo = new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000);
      const fiftyDaysAgo = new Date(now.getTime() - 50 * 24 * 60 * 60 * 1000);

      mockDb.seedDoc("subscribers", "sub1", {
        email: "user@example.com",
        status: "active",
        softBounceCount: 2,
        softBounces: [
          { timestamp: fiftyDaysAgo.toISOString(), reason: "Old bounce 1" },
          { timestamp: fortyDaysAgo.toISOString(), reason: "Old bounce 2" },
        ],
      });

      mockVerifyResult = {
        type: "email.delivery_delayed",
        data: {
          to: ["user@example.com"],
          reason: "New bounce",
        },
      };

      const req = createMockReq(mockVerifyResult);
      const res = createMockRes();

      await handleBounce(req, res);

      const subscriber = mockDb.getDoc("subscribers", "sub1");
      // Only 1 bounce in the 30-day window (the new one), so status stays active
      expect(subscriber.status).toBe("active");
      expect(subscriber.softBounceCount).toBe(1);
      expect(subscriber.softBounces).toHaveLength(1);
    });
  });

  describe("subscriber not found", () => {
    it("returns 200 and acknowledges webhook when subscriber not found", async () => {
      mockVerifyResult = {
        type: "email.bounced",
        data: {
          to: ["unknown@example.com"],
          reason: "Mailbox not found",
        },
      };

      const req = createMockReq(mockVerifyResult);
      const res = createMockRes();

      await handleBounce(req, res);

      expect(res._status).toBe(200);
      expect(res._body).toEqual({ result: "acknowledged" });
    });
  });

  describe("malformed payload", () => {
    it("returns 400 when payload has no recipient", async () => {
      mockVerifyResult = {
        type: "email.bounced",
        data: {},
      };

      const req = createMockReq(mockVerifyResult);
      const res = createMockRes();

      await handleBounce(req, res);

      expect(res._status).toBe(400);
      expect(res._body).toEqual({ error: "Malformed payload" });
    });

    it("returns 400 when data.to is empty array", async () => {
      mockVerifyResult = {
        type: "email.bounced",
        data: { to: [] },
      };

      const req = createMockReq(mockVerifyResult);
      const res = createMockRes();

      await handleBounce(req, res);

      expect(res._status).toBe(400);
      expect(res._body).toEqual({ error: "Malformed payload" });
    });
  });

  describe("email normalization", () => {
    it("normalizes email to lowercase for lookup", async () => {
      mockDb.seedDoc("subscribers", "sub1", {
        email: "user@example.com",
        status: "active",
      });

      mockVerifyResult = {
        type: "email.bounced",
        data: {
          to: ["USER@EXAMPLE.COM"],
          reason: "Bounce",
        },
      };

      const req = createMockReq(mockVerifyResult);
      const res = createMockRes();

      await handleBounce(req, res);

      expect(res._status).toBe(200);
      expect(res._body).toEqual({ result: "processed" });

      const subscriber = mockDb.getDoc("subscribers", "sub1");
      expect(subscriber.status).toBe("bounced");
    });
  });
});
