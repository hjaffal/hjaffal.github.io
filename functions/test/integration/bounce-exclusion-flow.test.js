/**
 * Integration test: Bounce → Exclusion Flow
 *
 * Tests the full flow:
 * 1. Seed an active subscriber
 * 2. Process a hard bounce webhook for that subscriber
 * 3. Verify subscriber status is now "bounced"
 * 4. Attempt to send a newsletter to the same segment
 * 5. Verify the bounced subscriber is NOT included in the recipients
 *
 * The key assertion is that after a bounce, the subscriber is excluded from
 * the next newsletter send (the send function queries `status == "active"`).
 *
 * **Validates: Requirements 7.1, 7.3**
 */

const { createMockFirestore } = require("../helpers/mock-firestore");

// --- Mock setup ---
let mockDb;

// Mock firebase-admin
jest.mock("firebase-admin", () => {
  const mockAdmin = {
    firestore: () => mockDb,
    auth: () => ({
      verifyIdToken: jest.fn().mockResolvedValue({ uid: "admin-user-123" }),
    }),
    initializeApp: jest.fn(),
  };
  mockAdmin.firestore.FieldValue = {
    serverTimestamp: () => "SERVER_TIMESTAMP",
  };
  return mockAdmin;
});

// Mock firebase-functions/v2/https
jest.mock("firebase-functions/v2/https", () => ({
  onRequest: (opts, handler) => handler,
}));

// Mock firebase-functions/params
jest.mock("firebase-functions/params", () => ({
  defineSecret: (name) => ({ value: () => "mock_secret_value" }),
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

// Track emails sent via Resend (prefixed with "mock" to satisfy jest.mock scoping rules)
let mockSentEmails = [];
jest.mock("resend", () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: jest.fn().mockImplementation(async (params) => {
        mockSentEmails.push(params);
        return { id: `mock_email_${mockSentEmails.length}` };
      }),
    },
  })),
}));

const { handleBounce } = require("../../newsletter/bounce");
const { handlePost } = require("../../newsletter/send");

// Helper to create mock request for bounce webhook
function createBounceReq(payload) {
  return {
    method: "POST",
    body: payload,
    rawBody: Buffer.from(JSON.stringify(payload)),
    headers: {
      "svix-id": "msg_integration_test",
      "svix-timestamp": "1234567890",
      "svix-signature": "v1,valid_signature",
    },
  };
}

// Helper to create mock request for newsletter send
function createSendReq(body) {
  return {
    method: "POST",
    body: body,
    headers: {
      authorization: "Bearer valid-firebase-token",
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

describe("Integration: Bounce → Exclusion Flow", () => {
  const subscriberEmail = "bounced-user@example.com";
  const subscriberId = "sub_bounce_test_1";

  beforeEach(() => {
    mockDb = createMockFirestore();
    mockVerifyResult = null;
    mockVerifyError = null;
    mockSentEmails = [];
  });

  it("bounced subscriber is excluded from the next newsletter send", async () => {
    // --- Step 1: Seed an active subscriber ---
    mockDb.seedDoc("subscribers", subscriberId, {
      email: subscriberEmail,
      status: "active",
      segments: ["main_website", "sproochentest_prep"],
      utmSource: "homepage_form",
      unsubscribeTokenHash: "abc123hash",
      unsubscribeToken: "raw_token_abc",
      subscribedAt: "2025-01-01T00:00:00Z",
      softBounceCount: 0,
      softBounces: [],
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
    });

    // Also seed a second active subscriber who should still receive emails
    mockDb.seedDoc("subscribers", "sub_active_2", {
      email: "active-user@example.com",
      status: "active",
      segments: ["main_website", "sproochentest_prep"],
      utmSource: "homepage_form",
      unsubscribeTokenHash: "def456hash",
      unsubscribeToken: "raw_token_def",
      subscribedAt: "2025-01-02T00:00:00Z",
      softBounceCount: 0,
      softBounces: [],
      createdAt: "2025-01-02T00:00:00Z",
      updatedAt: "2025-01-02T00:00:00Z",
    });

    // --- Step 2: Process a hard bounce webhook for the subscriber ---
    mockVerifyResult = {
      type: "email.bounced",
      data: {
        to: [subscriberEmail],
        bounce_type: "hard",
        reason: "550 Mailbox not found",
      },
    };

    const bounceReq = createBounceReq(mockVerifyResult);
    const bounceRes = createMockRes();

    await handleBounce(bounceReq, bounceRes);

    // Bounce webhook should be processed successfully
    expect(bounceRes._status).toBe(200);
    expect(bounceRes._body).toEqual({ result: "processed" });

    // --- Step 3: Verify subscriber status is now "bounced" ---
    const bouncedSubscriber = mockDb.getDoc("subscribers", subscriberId);
    expect(bouncedSubscriber.status).toBe("bounced");
    expect(bouncedSubscriber.bounceReason).toBe("550 Mailbox not found");
    expect(bouncedSubscriber.bouncedAt).toBeDefined();

    // --- Step 4: Attempt to send a newsletter to the same segment ---
    mockSentEmails = []; // Reset sent emails tracker

    const sendReq = createSendReq({
      subject: "The Second Mind #15 — Integration Test",
      posts: [
        {
          title: "Test Post",
          excerpt: "This is a test post excerpt.",
          url: "https://hasanjaffal.com/test-post/",
          filename: "2025-06-01-test-post.md",
        },
      ],
      featuredPost: null,
      toolInvitation: null,
      segment: "main_website",
    });
    const sendRes = createMockRes();

    await handlePost(sendReq, sendRes);

    // --- Step 5: Verify the bounced subscriber is NOT included in recipients ---
    expect(sendRes._status).toBe(200);
    expect(sendRes._body.result).toBe("success");

    // Only the active subscriber should receive the email (recipientCount = 1)
    expect(sendRes._body.recipientCount).toBe(1);

    // Verify no email was sent to the bounced subscriber
    const emailsToBouncedUser = mockSentEmails.filter(
      (email) => email.to === subscriberEmail
    );
    expect(emailsToBouncedUser).toHaveLength(0);

    // Verify the active subscriber DID receive the email
    const emailsToActiveUser = mockSentEmails.filter(
      (email) => email.to === "active-user@example.com"
    );
    expect(emailsToActiveUser).toHaveLength(1);
  });

  it("complained subscriber is also excluded from the next newsletter send", async () => {
    // Seed an active subscriber
    mockDb.seedDoc("subscribers", subscriberId, {
      email: subscriberEmail,
      status: "active",
      segments: ["main_website"],
      utmSource: "website",
      unsubscribeTokenHash: "abc123hash",
      unsubscribeToken: "raw_token_abc",
      subscribedAt: "2025-01-01T00:00:00Z",
      softBounceCount: 0,
      softBounces: [],
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
    });

    // Seed a second active subscriber
    mockDb.seedDoc("subscribers", "sub_active_2", {
      email: "still-active@example.com",
      status: "active",
      segments: ["main_website"],
      utmSource: "website",
      unsubscribeTokenHash: "def456hash",
      unsubscribeToken: "raw_token_def",
      subscribedAt: "2025-01-02T00:00:00Z",
      softBounceCount: 0,
      softBounces: [],
      createdAt: "2025-01-02T00:00:00Z",
      updatedAt: "2025-01-02T00:00:00Z",
    });

    // Process a complaint webhook
    mockVerifyResult = {
      type: "email.complained",
      data: {
        to: [subscriberEmail],
      },
    };

    const bounceReq = createBounceReq(mockVerifyResult);
    const bounceRes = createMockRes();

    await handleBounce(bounceReq, bounceRes);

    expect(bounceRes._status).toBe(200);

    // Verify status is "complained"
    const complainedSubscriber = mockDb.getDoc("subscribers", subscriberId);
    expect(complainedSubscriber.status).toBe("complained");

    // Attempt to send newsletter
    mockSentEmails = [];

    const sendReq = createSendReq({
      subject: "The Second Mind #16 — Complaint Test",
      posts: [
        {
          title: "Another Post",
          excerpt: "Another test excerpt.",
          url: "https://hasanjaffal.com/another-post/",
          filename: "2025-06-02-another-post.md",
        },
      ],
      featuredPost: null,
      toolInvitation: null,
      segment: "main_website",
    });
    const sendRes = createMockRes();

    await handlePost(sendReq, sendRes);

    // Only the active subscriber should receive the email
    expect(sendRes._status).toBe(200);
    expect(sendRes._body.recipientCount).toBe(1);

    // No email to the complained subscriber
    const emailsToComplainedUser = mockSentEmails.filter(
      (email) => email.to === subscriberEmail
    );
    expect(emailsToComplainedUser).toHaveLength(0);

    // Active subscriber received the email
    const emailsToActiveUser = mockSentEmails.filter(
      (email) => email.to === "still-active@example.com"
    );
    expect(emailsToActiveUser).toHaveLength(1);
  });

  it("subscriber bounced via soft bounce threshold is excluded from next send", async () => {
    const now = new Date();

    // Seed subscriber with 2 existing soft bounces in the 30-day window
    mockDb.seedDoc("subscribers", subscriberId, {
      email: subscriberEmail,
      status: "active",
      segments: ["main_website"],
      utmSource: "website",
      unsubscribeTokenHash: "abc123hash",
      unsubscribeToken: "raw_token_abc",
      subscribedAt: "2025-01-01T00:00:00Z",
      softBounceCount: 2,
      softBounces: [
        { timestamp: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(), reason: "Delay 1" },
        { timestamp: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(), reason: "Delay 2" },
      ],
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
    });

    // Seed a second active subscriber
    mockDb.seedDoc("subscribers", "sub_active_2", {
      email: "healthy-user@example.com",
      status: "active",
      segments: ["main_website"],
      utmSource: "website",
      unsubscribeTokenHash: "ghi789hash",
      unsubscribeToken: "raw_token_ghi",
      subscribedAt: "2025-01-02T00:00:00Z",
      softBounceCount: 0,
      softBounces: [],
      createdAt: "2025-01-02T00:00:00Z",
      updatedAt: "2025-01-02T00:00:00Z",
    });

    // Process a third soft bounce (triggers threshold → status "bounced")
    mockVerifyResult = {
      type: "email.delivery_delayed",
      data: {
        to: [subscriberEmail],
        reason: "Delay 3 - mailbox full",
      },
    };

    const bounceReq = createBounceReq(mockVerifyResult);
    const bounceRes = createMockRes();

    await handleBounce(bounceReq, bounceRes);

    expect(bounceRes._status).toBe(200);

    // Verify subscriber is now bounced due to soft bounce threshold
    const bouncedSubscriber = mockDb.getDoc("subscribers", subscriberId);
    expect(bouncedSubscriber.status).toBe("bounced");
    expect(bouncedSubscriber.softBounceCount).toBe(3);

    // Attempt to send newsletter
    mockSentEmails = [];

    const sendReq = createSendReq({
      subject: "The Second Mind #17 — Soft Bounce Threshold Test",
      posts: [
        {
          title: "Threshold Post",
          excerpt: "Testing soft bounce threshold exclusion.",
          url: "https://hasanjaffal.com/threshold-post/",
          filename: "2025-06-03-threshold-post.md",
        },
      ],
      featuredPost: null,
      toolInvitation: null,
      segment: "main_website",
    });
    const sendRes = createMockRes();

    await handlePost(sendReq, sendRes);

    // Only the healthy subscriber should receive the email
    expect(sendRes._status).toBe(200);
    expect(sendRes._body.recipientCount).toBe(1);

    // No email to the bounced subscriber
    const emailsToBouncedUser = mockSentEmails.filter(
      (email) => email.to === subscriberEmail
    );
    expect(emailsToBouncedUser).toHaveLength(0);

    // Healthy subscriber received the email
    const emailsToHealthyUser = mockSentEmails.filter(
      (email) => email.to === "healthy-user@example.com"
    );
    expect(emailsToHealthyUser).toHaveLength(1);
  });
});
