/**
 * Unit tests for getAnalytics Cloud Function
 * Tests the three analytics endpoints: editions list, edition detail, and overview.
 */

const { createMockFirestore } = require("./helpers/mock-firestore");

// Mock firebase-admin before requiring the module under test
let mockDb;

jest.mock("firebase-admin", () => {
  return {
    firestore: () => mockDb,
    auth: () => ({
      verifyIdToken: jest.fn().mockResolvedValue({ uid: "admin-user" }),
    }),
  };
});

jest.mock("firebase-functions/v2/https", () => ({
  onRequest: (_opts, handler) => handler,
}));

// Helper to create mock request/response
function createMockReq(query = {}, headers = {}) {
  return {
    method: "GET",
    query,
    headers: { authorization: "Bearer valid-token", ...headers },
  };
}

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

// Import after mocks are set up
const { getAnalytics } = require("../newsletter/analytics");

describe("getAnalytics", () => {
  beforeEach(() => {
    mockDb = createMockFirestore();
  });

  describe("authentication", () => {
    it("should reject non-GET requests with 405", async () => {
      const req = { method: "POST", query: {}, headers: { authorization: "Bearer valid-token" } };
      const res = createMockRes();

      await getAnalytics(req, res);

      expect(res._status).toBe(405);
      expect(res._json.error).toBe("Method not allowed");
    });

    it("should reject requests without auth token with 401", async () => {
      // Override the auth mock to throw
      const admin = require("firebase-admin");
      admin.auth = () => ({
        verifyIdToken: jest.fn().mockRejectedValue(new Error("Invalid token")),
      });

      const req = { method: "GET", query: { type: "editions" }, headers: {} };
      const res = createMockRes();

      await getAnalytics(req, res);

      expect(res._status).toBe(401);

      // Restore
      admin.auth = () => ({
        verifyIdToken: jest.fn().mockResolvedValue({ uid: "admin-user" }),
      });
    });
  });

  describe("type=editions", () => {
    it("should return empty editions array when no editions exist", async () => {
      const req = createMockReq({ type: "editions" });
      const res = createMockRes();

      await getAnalytics(req, res);

      expect(res._status).toBe(200);
      expect(res._json).toEqual({ editions: [] });
    });

    it("should return editions sorted by sentAt descending with rates", async () => {
      // Seed editions
      mockDb.seedDoc("editions", "ed1", {
        subject: "Edition 1",
        segment: "main_website",
        recipientCount: 100,
        sentAt: { toDate: () => new Date("2026-05-20T10:00:00Z") },
      });
      mockDb.seedDoc("editions", "ed2", {
        subject: "Edition 2",
        segment: "main_website",
        recipientCount: 50,
        sentAt: { toDate: () => new Date("2026-05-24T10:00:00Z") },
      });

      // Seed open events for ed1 (3 unique opens)
      mockDb.seedDoc("events", "sub1_ed1_open", { type: "open", editionId: "ed1", subscriberId: "sub1" });
      mockDb.seedDoc("events", "sub2_ed1_open", { type: "open", editionId: "ed1", subscriberId: "sub2" });
      mockDb.seedDoc("events", "sub3_ed1_open", { type: "open", editionId: "ed1", subscriberId: "sub3" });

      // Seed click events for ed1 (2 unique clickers)
      mockDb.seedDoc("events", "click1", { type: "click", editionId: "ed1", subscriberId: "sub1", url: "https://example.com/a" });
      mockDb.seedDoc("events", "click2", { type: "click", editionId: "ed1", subscriberId: "sub1", url: "https://example.com/b" });
      mockDb.seedDoc("events", "click3", { type: "click", editionId: "ed1", subscriberId: "sub2", url: "https://example.com/a" });

      const req = createMockReq({ type: "editions" });
      const res = createMockRes();

      await getAnalytics(req, res);

      expect(res._status).toBe(200);
      expect(res._json.editions).toHaveLength(2);

      // ed2 should be first (more recent sentAt)
      expect(res._json.editions[0].id).toBe("ed2");
      expect(res._json.editions[1].id).toBe("ed1");

      // Check ed1 rates
      const ed1 = res._json.editions[1];
      expect(ed1.uniqueOpens).toBe(3);
      expect(ed1.uniqueClicks).toBe(2);
      expect(ed1.openRate).toBe(3);  // (3/100)*100
      expect(ed1.clickRate).toBe(2); // (2/100)*100
    });

    it("should return null rates for editions with zero recipients", async () => {
      mockDb.seedDoc("editions", "ed_empty", {
        subject: "Empty Edition",
        segment: "main_website",
        recipientCount: 0,
        sentAt: { toDate: () => new Date("2026-05-24T10:00:00Z") },
      });

      const req = createMockReq({ type: "editions" });
      const res = createMockRes();

      await getAnalytics(req, res);

      expect(res._status).toBe(200);
      const edition = res._json.editions[0];
      expect(edition.openRate).toBeNull();
      expect(edition.clickRate).toBeNull();
    });
  });

  describe("type=edition", () => {
    it("should return 400 when id is missing", async () => {
      const req = createMockReq({ type: "edition" });
      const res = createMockRes();

      await getAnalytics(req, res);

      expect(res._status).toBe(400);
      expect(res._json.error).toBe("Edition id is required");
    });

    it("should return 404 when edition does not exist", async () => {
      const req = createMockReq({ type: "edition", id: "nonexistent" });
      const res = createMockRes();

      await getAnalytics(req, res);

      expect(res._status).toBe(404);
      expect(res._json.error).toBe("Edition not found");
    });

    it("should return full edition detail with clicked links", async () => {
      mockDb.seedDoc("editions", "ed1", {
        subject: "The Second Mind #12",
        segment: "main_website",
        recipientCount: 150,
        posts: [{ title: "Post 1", url: "https://hasanjaffal.com/post-1/" }],
        featuredPost: { title: "Featured", url: "https://hasanjaffal.com/featured/" },
        toolInvitation: { name: "AI Tool", url: "https://hasanjaffal.com/tool/" },
        sentAt: { toDate: () => new Date("2026-05-24T10:00:00Z") },
        failedSends: 2,
      });

      // Seed open events
      mockDb.seedDoc("events", "sub1_ed1_open", { type: "open", editionId: "ed1", subscriberId: "sub1" });
      mockDb.seedDoc("events", "sub2_ed1_open", { type: "open", editionId: "ed1", subscriberId: "sub2" });

      // Seed click events
      mockDb.seedDoc("events", "click1", { type: "click", editionId: "ed1", subscriberId: "sub1", url: "https://hasanjaffal.com/post-1/" });
      mockDb.seedDoc("events", "click2", { type: "click", editionId: "ed1", subscriberId: "sub2", url: "https://hasanjaffal.com/post-1/" });
      mockDb.seedDoc("events", "click3", { type: "click", editionId: "ed1", subscriberId: "sub1", url: "https://hasanjaffal.com/tool/" });

      const req = createMockReq({ type: "edition", id: "ed1" });
      const res = createMockRes();

      await getAnalytics(req, res);

      expect(res._status).toBe(200);
      expect(res._json.editionId).toBe("ed1");
      expect(res._json.subject).toBe("The Second Mind #12");
      expect(res._json.segment).toBe("main_website");
      expect(res._json.totalRecipients).toBe(150);
      expect(res._json.uniqueOpens).toBe(2);
      expect(res._json.uniqueClicks).toBe(2); // 2 unique subscribers clicked
      expect(res._json.openRate).toBeCloseTo((2 / 150) * 100);
      expect(res._json.clickRate).toBeCloseTo((2 / 150) * 100);
      expect(res._json.failedSends).toBe(2);
      expect(res._json.posts).toHaveLength(1);
      expect(res._json.featuredPost.title).toBe("Featured");
      expect(res._json.toolInvitation.name).toBe("AI Tool");

      // Clicked links should be sorted by clicks descending
      expect(res._json.clickedLinks).toHaveLength(2);
      expect(res._json.clickedLinks[0].url).toBe("https://hasanjaffal.com/post-1/");
      expect(res._json.clickedLinks[0].clicks).toBe(2);
      expect(res._json.clickedLinks[1].url).toBe("https://hasanjaffal.com/tool/");
      expect(res._json.clickedLinks[1].clicks).toBe(1);
    });

    it("should return null rates for edition with zero recipients", async () => {
      mockDb.seedDoc("editions", "ed_zero", {
        subject: "Zero Recipients",
        segment: "main_website",
        recipientCount: 0,
        sentAt: { toDate: () => new Date("2026-05-24T10:00:00Z") },
        failedSends: 0,
      });

      const req = createMockReq({ type: "edition", id: "ed_zero" });
      const res = createMockRes();

      await getAnalytics(req, res);

      expect(res._status).toBe(200);
      expect(res._json.openRate).toBeNull();
      expect(res._json.clickRate).toBeNull();
    });
  });

  describe("type=overview", () => {
    it("should return correct counts by status", async () => {
      mockDb.seedDoc("subscribers", "s1", { status: "active", segments: ["main_website"], utmSource: "homepage_form" });
      mockDb.seedDoc("subscribers", "s2", { status: "active", segments: ["main_website", "sproochentest_prep"], utmSource: "homepage_form" });
      mockDb.seedDoc("subscribers", "s3", { status: "active", segments: ["sproochentest_prep"], utmSource: "skills_assessment" });
      mockDb.seedDoc("subscribers", "s4", { status: "unsubscribed", segments: [], utmSource: "homepage_form" });
      mockDb.seedDoc("subscribers", "s5", { status: "bounced", segments: ["main_website"], utmSource: "contact_form" });

      const req = createMockReq({ type: "overview" });
      const res = createMockRes();

      await getAnalytics(req, res);

      expect(res._status).toBe(200);
      expect(res._json.totalActive).toBe(3);
      expect(res._json.totalUnsubscribed).toBe(1);
      expect(res._json.totalBounced).toBe(1);

      // bySegment counts only active subscribers
      expect(res._json.bySegment.main_website).toBe(2);
      expect(res._json.bySegment.sproochentest_prep).toBe(2);

      // byUtmSource counts only active subscribers
      expect(res._json.byUtmSource.homepage_form).toBe(2);
      expect(res._json.byUtmSource.skills_assessment).toBe(1);
    });

    it("should return zeros when no subscribers exist", async () => {
      const req = createMockReq({ type: "overview" });
      const res = createMockRes();

      await getAnalytics(req, res);

      expect(res._status).toBe(200);
      expect(res._json.totalActive).toBe(0);
      expect(res._json.totalUnsubscribed).toBe(0);
      expect(res._json.totalBounced).toBe(0);
      expect(res._json.bySegment).toEqual({});
      expect(res._json.byUtmSource).toEqual({});
    });
  });

  describe("invalid type", () => {
    it("should return 400 for invalid type parameter", async () => {
      const req = createMockReq({ type: "invalid" });
      const res = createMockRes();

      await getAnalytics(req, res);

      expect(res._status).toBe(400);
      expect(res._json.error).toContain("Invalid type parameter");
    });

    it("should return 400 when type is missing", async () => {
      const req = createMockReq({});
      const res = createMockRes();

      await getAnalytics(req, res);

      expect(res._status).toBe(400);
    });
  });
});
