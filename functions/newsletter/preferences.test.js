/**
 * Unit tests for the newsletterPreferences Cloud Function (task 4.1).
 * Tests GET and POST handlers for managing subscriber preferences.
 */

const crypto = require("crypto");
const { createMockFirestore } = require("../test/helpers/mock-firestore");

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

const { newsletterPreferences } = require("./preferences");

describe("newsletterPreferences", () => {
  let res;

  beforeEach(() => {
    mockDb = createMockFirestore();
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe("Method validation", () => {
    it("returns 405 for unsupported methods", async () => {
      const req = { method: "PUT" };
      await newsletterPreferences(req, res);
      expect(res.status).toHaveBeenCalledWith(405);
      expect(res.json).toHaveBeenCalledWith({ error: "Method not allowed" });
    });

    it("returns 405 for DELETE method", async () => {
      const req = { method: "DELETE" };
      await newsletterPreferences(req, res);
      expect(res.status).toHaveBeenCalledWith(405);
    });
  });

  describe("GET handler", () => {
    it("returns 404 when no token is provided", async () => {
      const req = { method: "GET", query: {} };
      await newsletterPreferences(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "not_found" });
    });

    it("returns 404 when token is empty string", async () => {
      const req = { method: "GET", query: { token: "" } };
      await newsletterPreferences(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "not_found" });
    });

    it("returns 404 when token does not match any subscriber", async () => {
      const req = { method: "GET", query: { token: "nonexistent_token" } };
      await newsletterPreferences(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "not_found" });
    });

    it("returns masked email and segments for valid token", async () => {
      const rawToken = "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2";
      const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

      mockDb.seedDoc("subscribers", "sub1", {
        email: "user@example.com",
        status: "active",
        segments: ["main_website", "sproochentest_prep"],
        unsubscribeTokenHash: tokenHash,
      });

      const req = { method: "GET", query: { token: rawToken } };
      await newsletterPreferences(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        email: "u***@example.com",
        segments: ["main_website", "sproochentest_prep"],
      });
    });

    it("returns only subscribed segments", async () => {
      const rawToken = "token_for_partial_sub";
      const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

      mockDb.seedDoc("subscribers", "sub2", {
        email: "partial@test.com",
        status: "active",
        segments: ["main_website"],
        unsubscribeTokenHash: tokenHash,
      });

      const req = { method: "GET", query: { token: rawToken } };
      await newsletterPreferences(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        email: "p***@test.com",
        segments: ["main_website"],
      });
    });

    it("does not leak subscriber email (returns masked version)", async () => {
      const rawToken = "secure_token_test";
      const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

      mockDb.seedDoc("subscribers", "sub3", {
        email: "sensitive@private.org",
        status: "active",
        segments: ["sproochentest_prep"],
        unsubscribeTokenHash: tokenHash,
      });

      const req = { method: "GET", query: { token: rawToken } };
      await newsletterPreferences(req, res);

      const response = res.json.mock.calls[0][0];
      expect(response.email).not.toContain("sensitive");
      expect(response.email).toBe("s***@private.org");
    });
  });

  describe("POST handler", () => {
    it("returns 404 when no token is provided", async () => {
      const req = { method: "POST", body: { segments: ["main_website"] }, query: {} };
      await newsletterPreferences(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "not_found" });
    });

    it("returns 404 when token does not match any subscriber", async () => {
      const req = {
        method: "POST",
        body: { token: "invalid_token", segments: ["main_website"] },
        query: {},
      };
      await newsletterPreferences(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "not_found" });
    });

    it("updates segments when valid token and segments provided", async () => {
      const rawToken = "valid_post_token";
      const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

      mockDb.seedDoc("subscribers", "sub4", {
        email: "user@example.com",
        status: "active",
        segments: ["main_website", "sproochentest_prep"],
        unsubscribeTokenHash: tokenHash,
      });

      const req = {
        method: "POST",
        body: { token: rawToken, segments: ["main_website"] },
        query: {},
      };
      await newsletterPreferences(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ result: "success", status: "active" });

      const updatedDoc = mockDb.getDoc("subscribers", "sub4");
      expect(updatedDoc.segments).toEqual(["main_website"]);
      expect(updatedDoc.status).toBe("active");
    });

    it("sets status to unsubscribed when empty segments array", async () => {
      const rawToken = "unsub_token";
      const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

      mockDb.seedDoc("subscribers", "sub5", {
        email: "leaving@example.com",
        status: "active",
        segments: ["main_website", "sproochentest_prep"],
        unsubscribeTokenHash: tokenHash,
      });

      const req = {
        method: "POST",
        body: { token: rawToken, segments: [] },
        query: {},
      };
      await newsletterPreferences(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ result: "success", status: "unsubscribed" });

      const updatedDoc = mockDb.getDoc("subscribers", "sub5");
      expect(updatedDoc.segments).toEqual([]);
      expect(updatedDoc.status).toBe("unsubscribed");
      expect(updatedDoc.unsubscribedAt).toBe("SERVER_TIMESTAMP");
    });

    it("handles RFC 8058 one-click unsubscribe (empty body)", async () => {
      const rawToken = "rfc8058_token";
      const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

      mockDb.seedDoc("subscribers", "sub6", {
        email: "oneclick@example.com",
        status: "active",
        segments: ["main_website", "sproochentest_prep"],
        unsubscribeTokenHash: tokenHash,
      });

      // RFC 8058: POST with token in query, empty body
      const req = {
        method: "POST",
        body: {},
        query: { token: rawToken },
      };
      await newsletterPreferences(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ result: "success", status: "unsubscribed" });

      const updatedDoc = mockDb.getDoc("subscribers", "sub6");
      expect(updatedDoc.segments).toEqual([]);
      expect(updatedDoc.status).toBe("unsubscribed");
    });

    it("handles RFC 8058 one-click unsubscribe (body with no segments field)", async () => {
      const rawToken = "rfc8058_token_2";
      const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

      mockDb.seedDoc("subscribers", "sub7", {
        email: "oneclick2@example.com",
        status: "active",
        segments: ["main_website"],
        unsubscribeTokenHash: tokenHash,
      });

      const req = {
        method: "POST",
        body: { token: rawToken },
        query: {},
      };
      await newsletterPreferences(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ result: "success", status: "unsubscribed" });

      const updatedDoc = mockDb.getDoc("subscribers", "sub7");
      expect(updatedDoc.segments).toEqual([]);
      expect(updatedDoc.status).toBe("unsubscribed");
    });

    it("filters out invalid segments", async () => {
      const rawToken = "filter_token";
      const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

      mockDb.seedDoc("subscribers", "sub8", {
        email: "filter@example.com",
        status: "active",
        segments: ["main_website", "sproochentest_prep"],
        unsubscribeTokenHash: tokenHash,
      });

      const req = {
        method: "POST",
        body: { token: rawToken, segments: ["main_website", "invalid_segment", "hacked"] },
        query: {},
      };
      await newsletterPreferences(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const updatedDoc = mockDb.getDoc("subscribers", "sub8");
      expect(updatedDoc.segments).toEqual(["main_website"]);
    });

    it("unsubscribes when all provided segments are invalid", async () => {
      const rawToken = "all_invalid_token";
      const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

      mockDb.seedDoc("subscribers", "sub9", {
        email: "allinvalid@example.com",
        status: "active",
        segments: ["main_website"],
        unsubscribeTokenHash: tokenHash,
      });

      const req = {
        method: "POST",
        body: { token: rawToken, segments: ["fake_segment", "another_fake"] },
        query: {},
      };
      await newsletterPreferences(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ result: "success", status: "unsubscribed" });

      const updatedDoc = mockDb.getDoc("subscribers", "sub9");
      expect(updatedDoc.segments).toEqual([]);
      expect(updatedDoc.status).toBe("unsubscribed");
    });

    it("accepts token from body over query param", async () => {
      const bodyToken = "body_token";
      const queryToken = "query_token";
      const bodyTokenHash = crypto.createHash("sha256").update(bodyToken).digest("hex");

      mockDb.seedDoc("subscribers", "sub10", {
        email: "body@example.com",
        status: "active",
        segments: ["main_website", "sproochentest_prep"],
        unsubscribeTokenHash: bodyTokenHash,
      });

      const req = {
        method: "POST",
        body: { token: bodyToken, segments: ["sproochentest_prep"] },
        query: { token: queryToken },
      };
      await newsletterPreferences(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ result: "success", status: "active" });
    });

    it("does not modify subscriber when token is invalid (no data leak)", async () => {
      mockDb.seedDoc("subscribers", "sub11", {
        email: "safe@example.com",
        status: "active",
        segments: ["main_website", "sproochentest_prep"],
        unsubscribeTokenHash: "some_real_hash",
      });

      const req = {
        method: "POST",
        body: { token: "wrong_token", segments: [] },
        query: {},
      };
      await newsletterPreferences(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      // Verify subscriber was not modified
      const doc = mockDb.getDoc("subscribers", "sub11");
      expect(doc.status).toBe("active");
      expect(doc.segments).toEqual(["main_website", "sproochentest_prep"]);
    });
  });
});
