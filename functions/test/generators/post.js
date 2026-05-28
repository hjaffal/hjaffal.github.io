/**
 * fast-check arbitraries for generating post metadata.
 */
const fc = require("fast-check");

/**
 * Generates a valid post date string (YYYY-MM-DD).
 */
const postDate = fc
  .tuple(
    fc.integer({ min: 2023, max: 2030 }),
    fc.integer({ min: 1, max: 12 }),
    fc.integer({ min: 1, max: 28 })
  )
  .map(([year, month, day]) => {
    const m = String(month).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    return `${year}-${m}-${d}`;
  });

/**
 * Generates a post title (non-empty string).
 */
const postTitle = fc.string({ minLength: 5, maxLength: 80 }).filter((s) => s.trim().length > 0);

/**
 * Generates a post excerpt (non-empty string).
 */
const postExcerpt = fc.string({ minLength: 10, maxLength: 200 }).filter((s) => s.trim().length > 0);

/**
 * Generates a valid URL path slug.
 */
const slug = fc
  .stringOf(fc.constantFrom(..."abcdefghijklmnopqrstuvwxyz0123456789-".split("")), {
    minLength: 3,
    maxLength: 40,
  })
  .filter((s) => !s.startsWith("-") && !s.endsWith("-"));

/**
 * Generates a post URL.
 */
const postUrl = slug.map((s) => `https://hasanjaffal.com/${s}/`);

/**
 * Generates post tags.
 */
const postTags = fc.subarray(
  ["ai-decision-operations", "ai-decision-operations", "risk-intelligence", "ai-job-risk", "sproochentest", "future-proof-skills", "books"],
  { minLength: 0, maxLength: 3 }
);

/**
 * Generates a post filename (YYYY-MM-DD-slug.md).
 */
const postFilename = fc
  .tuple(postDate, slug)
  .map(([date, s]) => `${date}-${s}.md`);

/**
 * Generates a complete post metadata object.
 */
const postMetadata = fc.record({
  filename: postFilename,
  title: postTitle,
  date: postDate,
  excerpt: postExcerpt,
  url: postUrl,
  tags: postTags,
});

/**
 * Generates a featured post object (for newsletter composition).
 */
const featuredPost = fc.record({
  title: postTitle,
  excerpt: postExcerpt,
  url: postUrl,
});

/**
 * Generates a tool invitation object.
 */
const toolInvitation = fc.record({
  name: fc.constantFrom("AI Job Risk Assessment", "Future-Proof Skills Assessment"),
  description: fc.string({ minLength: 10, maxLength: 100 }).filter((s) => s.trim().length > 0),
  url: postUrl,
});

module.exports = {
  postDate,
  postTitle,
  postExcerpt,
  postUrl,
  postTags,
  postFilename,
  postMetadata,
  featuredPost,
  toolInvitation,
  slug,
};
