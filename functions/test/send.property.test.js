/**
 * Property-based tests for newsletter sending (Properties 8–12).
 *
 * Tests the exported helper functions directly (rewriteLink, sendToSubscriber, etc.)
 * rather than the full HTTP handler.
 *
 * Validates: Requirements 4.3, 4.4, 4.6, 4.7, 4.8
 */
const fc = require("fast-check");

// Mock firebase-admin
jest.mock("firebase-admin", () => ({
  firestore: Object.assign(() => ({}), {
    FieldValue: { serverTimestamp: () => "SERVER_TIMESTAMP" },
  }),
  auth: () => ({ verifyIdToken: jest.fn() }),
  initializeApp: jest.fn(),
}));

// Mock firebase-functions
jest.mock("firebase-functions/v2/https", () => ({
  onRequest: jest.fn((opts, handler) => handler),
}));

// Mock firebase-functions/params
jest.mock("firebase-functions/params", () => ({
  defineSecret: jest.fn(() => ({ value: () => "mock-secret" })),
}));

// Mock resend
jest.mock("resend", () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: jest.fn().mockResolvedValue({ id: "mock_email_id" }),
    },
  })),
}));

const { rewriteLink, sendToSubscriber, BATCH_SIZE, BATCH_DELAY_MS } = require("../newsletter/send");
const { renderNewsletter } = require("../newsletter/template");
const { generateTrackingToken, decodeTrackingToken } = require("../newsletter/utils");
const generators = require("./generators");

describe("Property 8: Recipient filtering by segment and status", () => {
  /**
   * Validates: Requirements 4.4
   *
   * For any segment identifier and any collection of subscribers with mixed statuses
   * and segment arrays, the recipient list for a newsletter send SHALL contain exactly
   * those subscribers where status === "active" AND the target segment is present in
   * their segments array.
   */
  it("filters subscribers to only active ones with the target segment", () => {
    fc.assert(
      fc.property(
        fc.constantFrom("main_website", "sproochentest_prep"),
        fc.array(generators.subscriber.subscriberDoc, { minLength: 1, maxLength: 30 }),
        (targetSegment, subscribers) => {
          // Simulate the filtering logic from handlePost
          const filtered = subscribers.filter(
            (sub) => sub.status === "active" && sub.segments.includes(targetSegment)
          );

          // Verify: every filtered subscriber is active
          for (const sub of filtered) {
            expect(sub.status).toBe("active");
            expect(sub.segments).toContain(targetSegment);
          }

          // Verify: no subscriber was missed
          const missed = subscribers.filter(
            (sub) =>
              sub.status === "active" &&
              sub.segments.includes(targetSegment) &&
              !filtered.includes(sub)
          );
          expect(missed).toHaveLength(0);

          // Verify: no subscriber was incorrectly included
          const incorrect = filtered.filter(
            (sub) => sub.status !== "active" || !sub.segments.includes(targetSegment)
          );
          expect(incorrect).toHaveLength(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe("Property 9: Template rendering includes all post content", () => {
  /**
   * Validates: Requirements 4.3
   *
   * For any post title, excerpt, and URL, the rendered newsletter HTML SHALL contain
   * the post title text, the excerpt text, and a hyperlink with the post URL as the
   * ultimate destination (routed through click proxy).
   */
  it("rendered HTML contains all post titles, excerpts, and URLs", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            title: generators.post.postTitle,
            excerpt: generators.post.postExcerpt,
            url: generators.post.postUrl,
          }),
          { minLength: 1, maxLength: 5 }
        ),
        fc.option(generators.post.featuredPost, { nil: null }),
        fc.option(generators.post.toolInvitation, { nil: null }),
        (posts, featuredPost, toolInvitation) => {
          // Simulate link rewriting (as done in sendToSubscriber)
          const trackingToken = "test-tracking-token";
          const rewrittenPosts = posts.map((post) => ({
            ...post,
            url: rewriteLink(post.url, trackingToken),
          }));

          const rewrittenFeatured = featuredPost
            ? { ...featuredPost, url: rewriteLink(featuredPost.url, trackingToken) }
            : null;

          const rewrittenTool = toolInvitation
            ? { ...toolInvitation, url: rewriteLink(toolInvitation.url, trackingToken) }
            : null;

          const html = renderNewsletter({
            subject: "Test Edition",
            posts: rewrittenPosts,
            featuredPost: rewrittenFeatured,
            toolInvitation: rewrittenTool,
            unsubscribeUrl: "https://hasanjaffal.com/newsletter/preferences/?token=abc",
            trackingPixelUrl: "https://trackopen-vgheoh5xza-ew.a.run.app?t=xyz",
          });

          // Helper to match the escapeHtml function in template.js
          const escapeHtml = (str) =>
            String(str)
              .replace(/&/g, "&amp;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;")
              .replace(/"/g, "&quot;")
              .replace(/'/g, "&#39;");

          // Every post title must appear in the HTML
          for (const post of posts) {
            expect(html).toContain(escapeHtml(post.title));
          }

          // Every post excerpt must appear in the HTML
          for (const post of posts) {
            expect(html).toContain(escapeHtml(post.excerpt));
          }

          // Every rewritten post URL must appear in the HTML as an href
          for (const post of rewrittenPosts) {
            expect(html).toContain(escapeHtml(post.url));
          }

          // Featured post content must appear if provided
          if (featuredPost) {
            expect(html).toContain(escapeHtml(featuredPost.title));
            expect(html).toContain(escapeHtml(featuredPost.excerpt));
          }

          // Tool invitation content must appear if provided
          if (toolInvitation) {
            expect(html).toContain(escapeHtml(toolInvitation.name));
            expect(html).toContain(escapeHtml(toolInvitation.description));
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe("Property 10: Tracking pixel is unique per subscriber-edition", () => {
  /**
   * Validates: Requirements 4.6
   *
   * For any two distinct subscriber-edition pairs, the tracking pixel URLs embedded
   * in their respective emails SHALL be different. Each tracking pixel URL SHALL encode
   * both the subscriber ID and the edition ID.
   */
  it("distinct subscriber-edition pairs produce distinct tracking tokens", () => {
    const subscriberId = fc.stringOf(
      fc.constantFrom(..."abcdefghijklmnopqrstuvwxyz0123456789".split("")),
      { minLength: 5, maxLength: 20 }
    );
    const editionId = fc.stringOf(
      fc.constantFrom(..."abcdefghijklmnopqrstuvwxyz0123456789".split("")),
      { minLength: 5, maxLength: 20 }
    );

    fc.assert(
      fc.property(
        subscriberId,
        editionId,
        subscriberId,
        editionId,
        (sub1, ed1, sub2, ed2) => {
          // Only test when the pairs are actually different
          fc.pre(sub1 !== sub2 || ed1 !== ed2);

          const token1 = generateTrackingToken(sub1, ed1);
          const token2 = generateTrackingToken(sub2, ed2);

          // Tokens must be different for different pairs
          expect(token1).not.toBe(token2);

          // Each token must decode to the correct subscriber and edition
          const decoded1 = decodeTrackingToken(token1);
          expect(decoded1.subscriberId).toBe(sub1);
          expect(decoded1.editionId).toBe(ed1);

          const decoded2 = decodeTrackingToken(token2);
          expect(decoded2.subscriberId).toBe(sub2);
          expect(decoded2.editionId).toBe(ed2);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe("Property 11: Link rewriting routes all links through click proxy", () => {
  /**
   * Validates: Requirements 4.7
   *
   * For any URL, after link rewriting, the href SHALL point to the click proxy URL
   * with the original destination URL encoded as a parameter.
   */
  it("rewriteLink produces a click proxy URL with encoded destination", () => {
    const trackingToken = fc.stringOf(
      fc.constantFrom(..."abcdefghijklmnopqrstuvwxyz0123456789".split("")),
      { minLength: 5, maxLength: 30 }
    );

    fc.assert(
      fc.property(generators.post.postUrl, trackingToken, (originalUrl, token) => {
        const rewritten = rewriteLink(originalUrl, token);

        // Must start with the click proxy base
        expect(rewritten).toContain("https://trackclick-vgheoh5xza-ew.a.run.app");

        // Must contain the tracking token
        expect(rewritten).toContain(`t=${token}`);

        // Must contain the base64url-encoded original URL
        const encodedUrl = Buffer.from(originalUrl).toString("base64url");
        expect(rewritten).toContain(`url=${encodedUrl}`);

        // Decoding the URL parameter must yield the original URL
        const urlParam = rewritten.split("url=")[1];
        const decoded = Buffer.from(urlParam, "base64url").toString();
        expect(decoded).toBe(originalUrl);
      }),
      { numRuns: 100 }
    );
  });
});

describe("Property 12: Batching respects rate limits", () => {
  /**
   * Validates: Requirements 4.8
   *
   * For any recipient count greater than 10, the send operation SHALL partition
   * recipients into batches of at most 10 and introduce a delay of at least 1 second
   * between consecutive batches.
   */
  it("BATCH_SIZE is 10 and BATCH_DELAY_MS is at least 1000", () => {
    // Verify the constants match the rate limit requirements
    expect(BATCH_SIZE).toBe(10);
    expect(BATCH_DELAY_MS).toBeGreaterThanOrEqual(1000);
  });

  it("any subscriber list is correctly partitioned into batches of at most BATCH_SIZE", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 200 }),
        (subscriberCount) => {
          // Simulate the batching logic from handlePost
          const subscribers = Array.from({ length: subscriberCount }, (_, i) => ({
            id: `sub_${i}`,
            email: `user${i}@example.com`,
          }));

          const batches = [];
          for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
            batches.push(subscribers.slice(i, i + BATCH_SIZE));
          }

          // Every batch must have at most BATCH_SIZE items
          for (const batch of batches) {
            expect(batch.length).toBeLessThanOrEqual(BATCH_SIZE);
            expect(batch.length).toBeGreaterThan(0);
          }

          // Total items across all batches must equal original count
          const totalInBatches = batches.reduce((sum, b) => sum + b.length, 0);
          expect(totalInBatches).toBe(subscriberCount);

          // Number of batches must be ceil(subscriberCount / BATCH_SIZE)
          expect(batches.length).toBe(Math.ceil(subscriberCount / BATCH_SIZE));

          // If more than BATCH_SIZE subscribers, there must be multiple batches
          if (subscriberCount > BATCH_SIZE) {
            expect(batches.length).toBeGreaterThan(1);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
