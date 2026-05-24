/**
 * Unit tests for newsletter email template rendering.
 *
 * Validates: Requirements 4.2, 4.3, 10.1, 10.2
 */
const fc = require("fast-check");
const { renderNewsletter, escapeHtml } = require("../newsletter/template");
const generators = require("./generators");

// Helper to build a minimal valid input for renderNewsletter
function buildInput(overrides = {}) {
  return {
    subject: "The Second Mind #12 — AI Job Risk",
    posts: [
      { title: "Post One", excerpt: "Excerpt for post one.", url: "https://proxy/click?url=aHR0cHM6Ly9oYXNhbmphZmZhbC5jb20vcG9zdC1vbmUv" },
      { title: "Post Two", excerpt: "Excerpt for post two.", url: "https://proxy/click?url=aHR0cHM6Ly9oYXNhbmphZmZhbC5jb20vcG9zdC10d28v" },
    ],
    featuredPost: null,
    toolInvitation: null,
    unsubscribeUrl: "https://hasanjaffal.com/newsletter/preferences/?token=abc123",
    trackingPixelUrl: "https://us-central1-project.cloudfunctions.net/trackOpen?t=xyz",
    ...overrides,
  };
}

describe("Template Rendering", () => {
  describe("Post cards", () => {
    it("renders all post titles in the output", () => {
      const html = renderNewsletter(buildInput());
      expect(html).toContain("Post One");
      expect(html).toContain("Post Two");
    });

    it("renders all post excerpts in the output", () => {
      const html = renderNewsletter(buildInput());
      expect(html).toContain("Excerpt for post one.");
      expect(html).toContain("Excerpt for post two.");
    });

    it("renders post URLs as hyperlinks", () => {
      const html = renderNewsletter(buildInput());
      expect(html).toContain('href="https://proxy/click?url=aHR0cHM6Ly9oYXNhbmphZmZhbC5jb20vcG9zdC1vbmUv"');
      expect(html).toContain('href="https://proxy/click?url=aHR0cHM6Ly9oYXNhbmphZmZhbC5jb20vcG9zdC10d28v"');
    });

    it("renders Read more link for each post", () => {
      const html = renderNewsletter(buildInput());
      // Two "Read more" links for two posts
      const matches = html.match(/Read more/g);
      expect(matches).not.toBeNull();
      expect(matches.length).toBe(2);
    });
  });

  describe("Featured post", () => {
    it("renders featured post with highlighted CTA when provided", () => {
      const html = renderNewsletter(buildInput({
        featuredPost: {
          title: "Featured Title Here",
          excerpt: "Featured excerpt content.",
          url: "https://proxy/click?url=featured",
        },
      }));
      expect(html).toContain("Featured Title Here");
      expect(html).toContain("Featured excerpt content.");
      expect(html).toContain("FEATURED");
      expect(html).toContain('href="https://proxy/click?url=featured"');
      expect(html).toContain("Read the full article");
    });

    it("does not render featured section when featuredPost is null", () => {
      const html = renderNewsletter(buildInput({ featuredPost: null }));
      expect(html).not.toContain("FEATURED");
      expect(html).not.toContain("Read the full article");
    });
  });

  describe("Tool invitation", () => {
    it("renders tool invitation with correct link when provided", () => {
      const html = renderNewsletter(buildInput({
        toolInvitation: {
          name: "AI Job Risk Assessment",
          description: "Find out how exposed your role is.",
          url: "https://proxy/click?url=tool-link",
        },
      }));
      expect(html).toContain("AI Job Risk Assessment");
      expect(html).toContain("Find out how exposed your role is.");
      expect(html).toContain('href="https://proxy/click?url=tool-link"');
      expect(html).toContain("TRY THIS TOOL");
      expect(html).toContain("Try it free");
    });

    it("does not render tool section when toolInvitation is null", () => {
      const html = renderNewsletter(buildInput({ toolInvitation: null }));
      expect(html).not.toContain("TRY THIS TOOL");
      expect(html).not.toContain("Try it free");
    });
  });

  describe("Footer compliance", () => {
    it("contains physical address (Luxembourg)", () => {
      const html = renderNewsletter(buildInput());
      expect(html).toContain("Luxembourg");
    });

    it("contains unsubscribe link in footer", () => {
      const html = renderNewsletter(buildInput());
      expect(html).toContain("Unsubscribe");
      expect(html).toContain('href="https://hasanjaffal.com/newsletter/preferences/?token=abc123"');
    });

    it("contains manage preferences link", () => {
      const html = renderNewsletter(buildInput());
      expect(html).toContain("Manage preferences");
    });

    it("contains sender identification", () => {
      const html = renderNewsletter(buildInput());
      expect(html).toContain("Hasan Jaffal");
      expect(html).toContain("hasanjaffal.com");
    });
  });

  describe("Tracking pixel", () => {
    it("embeds tracking pixel image at the bottom", () => {
      const html = renderNewsletter(buildInput());
      expect(html).toContain('src="https://us-central1-project.cloudfunctions.net/trackOpen?t=xyz"');
      expect(html).toContain('width="1"');
      expect(html).toContain('height="1"');
    });
  });

  describe("escapeHtml", () => {
    it("escapes HTML special characters", () => {
      expect(escapeHtml('<script>alert("xss")</script>')).toBe(
        "&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;"
      );
    });

    it("escapes ampersands", () => {
      expect(escapeHtml("A & B")).toBe("A &amp; B");
    });

    it("escapes single quotes", () => {
      expect(escapeHtml("it's")).toBe("it&#39;s");
    });

    it("returns empty string for null/undefined", () => {
      expect(escapeHtml(null)).toBe("");
      expect(escapeHtml(undefined)).toBe("");
    });
  });

  describe("Property 9: Template rendering includes all post content", () => {
    /**
     * **Validates: Requirements 4.2, 4.3**
     *
     * For any post title, excerpt, and URL, the rendered newsletter HTML
     * SHALL contain the post title text, the excerpt text, and a hyperlink
     * with the post URL as the ultimate destination (routed through click proxy).
     */
    it("every post title and excerpt appears in the rendered HTML", () => {
      fc.assert(
        fc.property(
          // Generate 1-5 posts with non-empty title and excerpt
          fc.array(
            fc.record({
              title: generators.post.postTitle,
              excerpt: generators.post.postExcerpt,
              url: generators.post.postUrl,
            }),
            { minLength: 1, maxLength: 5 }
          ),
          (posts) => {
            const html = renderNewsletter({
              subject: "Test Edition",
              posts,
              featuredPost: null,
              toolInvitation: null,
              unsubscribeUrl: "https://hasanjaffal.com/newsletter/preferences/?token=test",
              trackingPixelUrl: "https://example.com/pixel",
            });

            for (const post of posts) {
              // Title must appear (HTML-escaped)
              if (!html.includes(escapeHtml(post.title))) return false;
              // Excerpt must appear (HTML-escaped)
              if (!html.includes(escapeHtml(post.excerpt))) return false;
              // URL must appear as an href (HTML-escaped)
              if (!html.includes(escapeHtml(post.url))) return false;
            }
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it("featured post title, excerpt, and URL appear in rendered HTML when provided", () => {
      fc.assert(
        fc.property(
          generators.post.featuredPost,
          (featured) => {
            const html = renderNewsletter({
              subject: "Test Edition",
              posts: [{ title: "Regular Post", excerpt: "Regular excerpt.", url: "https://hasanjaffal.com/regular/" }],
              featuredPost: featured,
              toolInvitation: null,
              unsubscribeUrl: "https://hasanjaffal.com/newsletter/preferences/?token=test",
              trackingPixelUrl: "https://example.com/pixel",
            });

            return (
              html.includes(escapeHtml(featured.title)) &&
              html.includes(escapeHtml(featured.excerpt)) &&
              html.includes(escapeHtml(featured.url))
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it("tool invitation name, description, and URL appear in rendered HTML when provided", () => {
      fc.assert(
        fc.property(
          generators.post.toolInvitation,
          (tool) => {
            const html = renderNewsletter({
              subject: "Test Edition",
              posts: [{ title: "Regular Post", excerpt: "Regular excerpt.", url: "https://hasanjaffal.com/regular/" }],
              featuredPost: null,
              toolInvitation: tool,
              unsubscribeUrl: "https://hasanjaffal.com/newsletter/preferences/?token=test",
              trackingPixelUrl: "https://example.com/pixel",
            });

            return (
              html.includes(escapeHtml(tool.name)) &&
              html.includes(escapeHtml(tool.description)) &&
              html.includes(escapeHtml(tool.url))
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
