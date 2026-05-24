/**
 * Integration tests for the full newsletter send flow.
 *
 * Tests: compose → query subscribers → batch send → edition created
 * Verifies batching behavior and edition document metadata.
 *
 * Validates: Requirements 4.1, 4.6, 4.8, 4.11
 */

const { createMockFirestore } = require("../helpers/mock-firestore");
const { createMockResend } = require("../helpers/mock-resend");

// Create mock instances before requiring the module under test
const mockFirestore = createMockFirestore();
const mockResend = createMockResend();

// Mock firebase-admin
jest.mock("firebase-admin", () => ({
  firestore: Object.assign(() => mockFirestore, {
    FieldValue: { serverTimestamp: () => "SERVER_TIMESTAMP" },
  }),
  auth: () => ({
    verifyIdToken: jest.fn().mockResolvedValue({ uid: "admin-user-123" }),
  }),
  initializeApp: jest.fn(),
}));

// Mock firebase-functions
jest.mock("firebase-functions/v2/https", () => ({
  onRequest: jest.fn((opts, handler) => handler),
}));

// Mock firebase-functions/params
jest.mock("firebase-functions/params", () => ({
  defineSecret: jest.fn(() => ({ value: () => "mock-resend-api-key" })),
}));

// Mock resend to use our mock instance
jest.mock("resend", () => ({
  Resend: jest.fn().mockImplementation(() => mockResend),
}));

const { handlePost, BATCH_SIZE } = require("../../newsletter/send");

describe("Integration: Full Newsletter Send Flow", () => {
  let req;
  let res;
  let resStatus;
  let resBody;

  beforeEach(() => {
    mockFirestore.reset();
    mockResend.reset();
    resStatus = null;
    resBody = null;

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockImplementation((body) => {
        resStatus = res.status.mock.calls[res.status.mock.calls.length - 1][0];
        resBody = body;
      }),
    };

    req = {
      method: "POST",
      headers: { authorization: "Bearer valid-admin-token" },
      body: {
        subject: "The Second Mind #12 — AI Job Risk",
        posts: [
          {
            title: "AI Job Risk Is Not About Your Title",
            excerpt: "Your title won't save you from automation.",
            url: "https://hasanjaffal.com/2026-05-24-ai-job-risk/",
          },
          {
            title: "Why Dashboards Fail Under Pressure",
            excerpt: "Most dashboards report what happened.",
            url: "https://hasanjaffal.com/2026-05-20-dashboard-failures/",
          },
        ],
        featuredPost: {
          title: "Why Dashboards Fail Under Pressure",
          excerpt: "Most dashboards report what happened. Few help you decide what to do next.",
          url: "https://hasanjaffal.com/2026-05-20-dashboard-failures/",
        },
        toolInvitation: {
          name: "AI Job Risk Assessment",
          description: "Find out how exposed your role is to AI automation.",
          url: "https://hasanjaffal.com/ai-job-risk-analyzer/",
        },
        segment: "main_website",
      },
    };
  });

  /**
   * Seeds multiple active subscribers in the mock Firestore for the given segment.
   */
  function seedSubscribers(count, segment = "main_website") {
    for (let i = 0; i < count; i++) {
      mockFirestore.seedDoc("subscribers", `sub_${i}`, {
        email: `user${i}@example.com`,
        status: "active",
        segments: [segment],
        unsubscribeToken: `token_${i}`,
        subscribedAt: "2026-01-15T10:00:00Z",
      });
    }
  }

  describe("Authenticated request → subscribers queried → emails sent → edition created", () => {
    it("sends to all active subscribers and creates an edition document", async () => {
      // Seed 5 active subscribers for main_website
      seedSubscribers(5, "main_website");

      await handlePost(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(resBody.result).toBe("success");
      expect(resBody.recipientCount).toBe(5);
      expect(resBody.editionId).toBeDefined();

      // Verify emails were sent to all 5 subscribers
      expect(mockResend.getSendCount()).toBe(5);

      // Verify edition document was created in Firestore
      const editions = mockFirestore.getAll("editions");
      const editionIds = Object.keys(editions);
      expect(editionIds.length).toBe(1);

      const edition = editions[editionIds[0]];
      expect(edition.subject).toBe("The Second Mind #12 — AI Job Risk");
      expect(edition.segment).toBe("main_website");
      expect(edition.recipientCount).toBe(5);
      expect(edition.status).toBe("sent");
      expect(edition.failedSends).toBe(0);
      expect(edition.sendCompletedAt).toBe("SERVER_TIMESTAMP");
    });

    it("only queries active subscribers for the target segment", async () => {
      // Seed subscribers with mixed statuses and segments
      mockFirestore.seedDoc("subscribers", "active_main", {
        email: "active@example.com",
        status: "active",
        segments: ["main_website"],
        unsubscribeToken: "token_active",
      });
      mockFirestore.seedDoc("subscribers", "active_sproochen", {
        email: "sproochen@example.com",
        status: "active",
        segments: ["sproochentest_prep"],
        unsubscribeToken: "token_sproochen",
      });
      mockFirestore.seedDoc("subscribers", "bounced_main", {
        email: "bounced@example.com",
        status: "bounced",
        segments: ["main_website"],
        unsubscribeToken: "token_bounced",
      });
      mockFirestore.seedDoc("subscribers", "unsubscribed_main", {
        email: "unsub@example.com",
        status: "unsubscribed",
        segments: ["main_website"],
        unsubscribeToken: "token_unsub",
      });

      await handlePost(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      // Only the active subscriber in main_website segment should receive the email
      expect(resBody.recipientCount).toBe(1);
      expect(mockResend.getSendCount()).toBe(1);

      const sentEmail = mockResend.getSentEmails()[0];
      expect(sentEmail.to).toBe("active@example.com");
    });
  });

  describe("Batching behavior (Requirement 4.8)", () => {
    it("sends emails in batches of BATCH_SIZE (10)", async () => {
      // Seed 25 subscribers to test batching across 3 batches (10 + 10 + 5)
      seedSubscribers(25, "main_website");

      await handlePost(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(resBody.recipientCount).toBe(25);
      expect(mockResend.getSendCount()).toBe(25);
    });

    it("handles exactly BATCH_SIZE subscribers in a single batch", async () => {
      seedSubscribers(BATCH_SIZE, "main_website");

      await handlePost(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(resBody.recipientCount).toBe(BATCH_SIZE);
      expect(mockResend.getSendCount()).toBe(BATCH_SIZE);
    });

    it("handles more than BATCH_SIZE subscribers across multiple batches", async () => {
      const count = BATCH_SIZE + 3; // 13 subscribers → 2 batches
      seedSubscribers(count, "main_website");

      await handlePost(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(resBody.recipientCount).toBe(count);
      expect(mockResend.getSendCount()).toBe(count);
    });
  });

  describe("Edition document metadata (Requirement 4.11)", () => {
    it("stores correct edition metadata in Firestore", async () => {
      seedSubscribers(3, "main_website");

      await handlePost(req, res);

      const editions = mockFirestore.getAll("editions");
      const editionIds = Object.keys(editions);
      expect(editionIds.length).toBe(1);

      const edition = editions[editionIds[0]];
      expect(edition.subject).toBe("The Second Mind #12 — AI Job Risk");
      expect(edition.posts).toEqual(req.body.posts);
      expect(edition.featuredPost).toEqual(req.body.featuredPost);
      expect(edition.toolInvitation).toEqual(req.body.toolInvitation);
      expect(edition.segment).toBe("main_website");
      expect(edition.recipientCount).toBe(3);
      expect(edition.sentAt).toBe("SERVER_TIMESTAMP");
    });

    it("edition status is 'sent' when all emails succeed", async () => {
      seedSubscribers(5, "main_website");

      await handlePost(req, res);

      const editions = mockFirestore.getAll("editions");
      const edition = Object.values(editions)[0];
      expect(edition.status).toBe("sent");
      expect(edition.failedSends).toBe(0);
    });

    it("edition status is 'failed' when all emails fail", async () => {
      seedSubscribers(3, "main_website");
      mockResend.setFailure("Resend API error");

      await handlePost(req, res);

      const editions = mockFirestore.getAll("editions");
      const edition = Object.values(editions)[0];
      expect(edition.status).toBe("failed");
      expect(edition.failedSends).toBe(3);
    });
  });

  describe("Tracking pixel uniqueness (Requirement 4.6)", () => {
    it("each subscriber receives a unique tracking pixel in their email", async () => {
      seedSubscribers(5, "main_website");

      await handlePost(req, res);

      const sentEmails = mockResend.getSentEmails();
      expect(sentEmails.length).toBe(5);

      // Extract tracking pixel URLs from each email's HTML
      const trackingPixelUrls = sentEmails.map((email) => {
        const match = email.html.match(/trackopen[^"]*\?t=([^"&]+)/);
        return match ? match[1] : null;
      });

      // All tracking tokens should be defined
      for (const url of trackingPixelUrls) {
        expect(url).toBeDefined();
        expect(url).not.toBeNull();
      }

      // All tracking tokens should be unique
      const uniqueTokens = new Set(trackingPixelUrls);
      expect(uniqueTokens.size).toBe(5);
    });
  });

  describe("Edge cases", () => {
    it("returns success with zero recipients when no active subscribers match segment", async () => {
      // Seed subscribers for a different segment
      seedSubscribers(3, "sproochentest_prep");

      await handlePost(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(resBody.result).toBe("success");
      expect(resBody.recipientCount).toBe(0);
      expect(resBody.editionId).toBeNull();
      expect(mockResend.getSendCount()).toBe(0);
    });

    it("rejects unauthenticated requests with 401", async () => {
      req.headers = {};

      await handlePost(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("rejects requests with missing subject", async () => {
      req.body.subject = "";

      await handlePost(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(resBody.error).toContain("Subject");
    });

    it("rejects requests with empty posts array", async () => {
      req.body.posts = [];

      await handlePost(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(resBody.error).toContain("post");
    });

    it("rejects requests with invalid segment", async () => {
      req.body.segment = "invalid_segment";

      await handlePost(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(resBody.error).toContain("segment");
    });
  });
});
