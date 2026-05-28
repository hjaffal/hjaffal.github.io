/**
 * Unit tests for the sendNewsletter Cloud Function (task 5.1).
 * Tests GET handler for listing posts from RSS feed.
 */

// Mock firebase-admin
jest.mock("firebase-admin", () => ({
  firestore: jest.fn(),
  initializeApp: jest.fn(),
  auth: jest.fn(() => ({
    verifyIdToken: jest.fn().mockResolvedValue({ uid: "admin-user" }),
  })),
}));

// Mock firebase-functions
jest.mock("firebase-functions/v2/https", () => ({
  onRequest: (opts, handler) => handler,
}));

jest.mock("firebase-functions/params", () => ({
  defineSecret: () => ({ value: () => "mock-secret" }),
}));

const {
  sendNewsletter,
  parseRSSFeed,
  parseItem,
  extractTag,
  extractCategories,
  stripHtml,
  truncateExcerpt,
  formatDate,
} = require("./send");

// Sample RSS feed XML for testing
const SAMPLE_RSS_FEED = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Hasan Jaffal</title>
    <link>https://hasanjaffal.com</link>
    <description>AI, risk, operations</description>
    <item>
      <title>AI Job Risk Is Not About Your Title</title>
      <link>https://hasanjaffal.com/2026-05-24-ai-job-risk/</link>
      <pubDate>Fri, 24 May 2026 00:00:00 +0000</pubDate>
      <description>Your job title does not determine your AI risk. Your tasks do.</description>
      <category>ai-job-risk</category>
      <category>risk-intelligence</category>
    </item>
    <item>
      <title>Why Dashboards Fail Under Pressure</title>
      <link>https://hasanjaffal.com/2026-05-20-dashboard-failures/</link>
      <pubDate>Tue, 20 May 2026 00:00:00 +0000</pubDate>
      <description>Most dashboards report what happened. Few help you decide what to do next.</description>
      <category>ai-decision-operations</category>
    </item>
    <item>
      <title>Older Post About Operations</title>
      <link>https://hasanjaffal.com/2026-04-10-operations/</link>
      <pubDate>Thu, 10 Apr 2026 00:00:00 +0000</pubDate>
      <description>Operations need clarity, not more tools.</description>
      <category>ai-decision-operations</category>
    </item>
  </channel>
</rss>`;

const SAMPLE_ATOM_FEED = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Hasan Jaffal</title>
  <link href="https://hasanjaffal.com"/>
  <entry>
    <title>Atom Post Title</title>
    <link href="https://hasanjaffal.com/atom-post/"/>
    <published>2026-06-01T10:00:00Z</published>
    <summary>This is an Atom feed post summary.</summary>
    <category term="ai-job-risk"/>
  </entry>
</feed>`;

describe("sendNewsletter - GET handler", () => {
  let res;

  beforeEach(() => {
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe("Method validation", () => {
    it("returns 405 for unsupported methods", async () => {
      const req = { method: "PUT" };
      await sendNewsletter(req, res);
      expect(res.status).toHaveBeenCalledWith(405);
      expect(res.json).toHaveBeenCalledWith({ error: "Method not allowed" });
    });

    it("returns 401 for POST without valid auth", async () => {
      const req = {
        method: "POST",
        headers: { authorization: "Bearer valid-token" },
        body: {},
      };
      await sendNewsletter(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Subject is required and must be non-empty" });
    });
  });

  describe("Authentication", () => {
    it("returns 401 when no Authorization header is provided", async () => {
      const req = { method: "GET", headers: {}, query: { action: "listPosts" } };
      await sendNewsletter(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("returns 401 when Authorization header is malformed", async () => {
      const req = {
        method: "GET",
        headers: { authorization: "InvalidFormat" },
        query: { action: "listPosts" },
      };
      await sendNewsletter(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe("Action validation", () => {
    it("returns 400 for invalid action", async () => {
      // Mock verifyAdminToken to succeed
      const auth = require("./auth");
      jest.spyOn(auth, "verifyAdminToken").mockResolvedValue({ uid: "admin" });

      const req = {
        method: "GET",
        headers: { authorization: "Bearer valid-token" },
        query: { action: "invalidAction" },
      };
      await sendNewsletter(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Invalid action. Supported: listPosts" });
    });

    it("returns 400 when no action is provided", async () => {
      const auth = require("./auth");
      jest.spyOn(auth, "verifyAdminToken").mockResolvedValue({ uid: "admin" });

      const req = {
        method: "GET",
        headers: { authorization: "Bearer valid-token" },
        query: {},
      };
      await sendNewsletter(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});

describe("RSS Feed Parsing", () => {
  describe("parseRSSFeed", () => {
    it("parses RSS 2.0 feed correctly", () => {
      const posts = parseRSSFeed(SAMPLE_RSS_FEED);
      expect(posts).toHaveLength(3);
      expect(posts[0].title).toBe("AI Job Risk Is Not About Your Title");
      expect(posts[0].url).toBe("https://hasanjaffal.com/2026-05-24-ai-job-risk/");
      expect(posts[0].date).toBe("2026-05-24");
      expect(posts[0].excerpt).toBe("Your job title does not determine your AI risk. Your tasks do.");
      expect(posts[0].tags).toEqual(["ai-job-risk", "risk-intelligence"]);
    });

    it("returns posts sorted by date descending", () => {
      const posts = parseRSSFeed(SAMPLE_RSS_FEED);
      expect(posts[0].date).toBe("2026-05-24");
      expect(posts[1].date).toBe("2026-05-20");
      expect(posts[2].date).toBe("2026-04-10");
    });

    it("parses Atom feed correctly", () => {
      const posts = parseRSSFeed(SAMPLE_ATOM_FEED);
      expect(posts).toHaveLength(1);
      expect(posts[0].title).toBe("Atom Post Title");
      expect(posts[0].url).toBe("https://hasanjaffal.com/atom-post/");
      expect(posts[0].date).toBe("2026-06-01");
      expect(posts[0].excerpt).toBe("This is an Atom feed post summary.");
      expect(posts[0].tags).toEqual(["ai-job-risk"]);
    });

    it("returns empty array for empty feed", () => {
      const xml = `<?xml version="1.0"?><rss><channel></channel></rss>`;
      const posts = parseRSSFeed(xml);
      expect(posts).toEqual([]);
    });
  });

  describe("extractTag", () => {
    it("extracts simple tag content", () => {
      const xml = "<title>Hello World</title>";
      expect(extractTag(xml, "title")).toBe("Hello World");
    });

    it("extracts CDATA content", () => {
      const xml = "<description><![CDATA[Some <b>HTML</b> content]]></description>";
      expect(extractTag(xml, "description")).toBe("Some <b>HTML</b> content");
    });

    it("returns empty string for missing tag", () => {
      const xml = "<title>Hello</title>";
      expect(extractTag(xml, "description")).toBe("");
    });

    it("strips HTML from regular content", () => {
      const xml = "<description><p>Hello <strong>world</strong></p></description>";
      expect(extractTag(xml, "description")).toBe("Hello world");
    });
  });

  describe("extractCategories", () => {
    it("extracts RSS categories", () => {
      const xml = "<category>ai-job-risk</category><category>risk</category>";
      expect(extractCategories(xml, false)).toEqual(["ai-job-risk", "risk"]);
    });

    it("extracts Atom categories from term attribute", () => {
      const xml = `<category term="ai-job-risk"/><category term="ops"/>`;
      expect(extractCategories(xml, true)).toEqual(["ai-job-risk", "ops"]);
    });

    it("returns empty array when no categories", () => {
      const xml = "<title>No categories here</title>";
      expect(extractCategories(xml, false)).toEqual([]);
    });

    it("handles CDATA in RSS categories", () => {
      const xml = "<category><![CDATA[ai-job-risk]]></category>";
      expect(extractCategories(xml, false)).toEqual(["ai-job-risk"]);
    });
  });

  describe("stripHtml", () => {
    it("removes HTML tags", () => {
      expect(stripHtml("<p>Hello <b>world</b></p>")).toBe("Hello world");
    });

    it("decodes HTML entities", () => {
      expect(stripHtml("&amp; &lt; &gt; &quot; &#39;")).toBe("& < > \" '");
    });

    it("handles empty string", () => {
      expect(stripHtml("")).toBe("");
    });
  });

  describe("truncateExcerpt", () => {
    it("returns text as-is when under 200 chars", () => {
      const short = "This is a short excerpt.";
      expect(truncateExcerpt(short)).toBe(short);
    });

    it("truncates text over 200 chars with ellipsis", () => {
      const long = "A".repeat(250);
      const result = truncateExcerpt(long);
      expect(result.length).toBe(200);
      expect(result.endsWith("...")).toBe(true);
    });

    it("strips HTML before truncating", () => {
      const html = "<p>" + "A".repeat(250) + "</p>";
      const result = truncateExcerpt(html);
      expect(result).not.toContain("<p>");
      expect(result.length).toBe(200);
    });
  });

  describe("formatDate", () => {
    it("formats ISO date to YYYY-MM-DD", () => {
      expect(formatDate("2026-05-24T10:00:00Z")).toBe("2026-05-24");
    });

    it("formats RFC 2822 date to YYYY-MM-DD", () => {
      expect(formatDate("Fri, 24 May 2026 00:00:00 +0000")).toBe("2026-05-24");
    });

    it("returns original string for invalid date", () => {
      expect(formatDate("not-a-date")).toBe("not-a-date");
    });

    it("handles empty string", () => {
      expect(formatDate("")).toBe("");
    });
  });
});
