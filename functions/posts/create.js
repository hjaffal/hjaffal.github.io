const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const { verifyAdminToken } = require("../newsletter/auth");

const GITHUB_PAT = defineSecret("GITHUB_PAT");

const VALID_TAGS = ["ai-operations", "decision-authority", "risk-intelligence", "ai-and-work"];
const REPO_OWNER = "hjaffal";
const REPO_NAME = "hjaffal.github.io";
const REPO_BRANCH = "master";

/**
 * createPost Cloud Function
 * Creates a new Jekyll blog post by committing a markdown file to the GitHub repo.
 *
 * Requires Firebase ID token authentication.
 * Method: POST
 * Region: europe-west1
 * Secrets: GITHUB_PAT
 *
 * Request body:
 *   title (required, max 150 chars)
 *   body (required, markdown content)
 *   slug (optional, max 80 chars, auto-generated from title if missing)
 *   author (optional, default "Hasan J.")
 *   tags (optional, array of canonical position tags)
 *   status (optional, "draft" or "published")
 *   date (optional, YYYY-MM-DD format)
 *   excerpt (optional, max 300 chars)
 *   shareTitle (optional, max 70 chars)
 *   shareDescription (optional, max 160 chars)
 *   featuredImage (optional, image path)
 *
 * Response:
 *   { result: "success", filename, url } on success
 *   { error: "message" } on failure
 */
const createPost = onRequest(
  { region: "europe-west1", cors: true, secrets: [GITHUB_PAT] },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    // Verify Firebase Auth token (admin only)
    try {
      await verifyAdminToken(req);
    } catch (err) {
      res.status(err.statusCode || 401).json({ error: err.message || "Unauthorized" });
      return;
    }

    const { title, slug, author, tags, status, date, excerpt, shareTitle, shareDescription, featuredImage, body } = req.body;

    // Validate required fields
    if (!title || typeof title !== "string" || title.trim().length === 0) {
      res.status(400).json({ error: "Title is required" });
      return;
    }
    if (title.length > 150) {
      res.status(400).json({ error: "Title must be 150 characters or less" });
      return;
    }
    if (!body || typeof body !== "string" || body.trim().length === 0) {
      res.status(400).json({ error: "Body content is required" });
      return;
    }

    // Validate tags
    if (tags && Array.isArray(tags)) {
      for (const tag of tags) {
        if (!VALID_TAGS.includes(tag)) {
          res.status(400).json({ error: `Invalid tag: ${tag}. Must be one of: ${VALID_TAGS.join(", ")}` });
          return;
        }
      }
    }

    // Validate optional field character limits
    if (excerpt && excerpt.length > 300) {
      res.status(400).json({ error: "Excerpt must be 300 characters or less" });
      return;
    }
    if (shareTitle && shareTitle.length > 70) {
      res.status(400).json({ error: "Meta title must be 70 characters or less" });
      return;
    }
    if (shareDescription && shareDescription.length > 160) {
      res.status(400).json({ error: "Meta description must be 160 characters or less" });
      return;
    }

    // Generate slug from title if not provided
    const postSlug = slug || slugify(title);
    if (postSlug.length > 80) {
      res.status(400).json({ error: "Slug must be 80 characters or less" });
      return;
    }

    // Generate filename
    const postDate = date || new Date().toISOString().split("T")[0];
    const filename = `_posts/${postDate}-${postSlug}.md`;
    const publicUrl = `/${postDate}-${postSlug}/`;

    // Build front matter
    const frontMatter = buildFrontMatter({
      title: title.trim(),
      shareTitle,
      shareDescription,
      tags,
      author: author || "Hasan J.",
      featuredImage,
      status
    });

    const fileContent = frontMatter + body.trim() + "\n";

    // Commit to GitHub
    try {
      const { Octokit } = require("@octokit/rest");
      const octokit = new Octokit({ auth: GITHUB_PAT.value() });

      await octokit.repos.createOrUpdateFileContents({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        path: filename,
        message: `Add post: ${title.trim()}`,
        content: Buffer.from(fileContent).toString("base64"),
        branch: REPO_BRANCH
      });

      res.status(200).json({ result: "success", filename, url: publicUrl });
    } catch (err) {
      console.error("GitHub commit error:", err.message);
      res.status(500).json({ error: "Failed to save post to repository" });
    }
  }
);

/**
 * Converts a title string to a URL-safe slug.
 * Lowercase, spaces to hyphens, remove non-alphanumeric except hyphens,
 * collapse consecutive hyphens, trim leading/trailing hyphens.
 *
 * @param {string} title - The post title
 * @returns {string} URL-safe slug
 */
function slugify(title) {
  return title
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Builds Jekyll front matter YAML from post metadata.
 * Escapes double quotes in YAML string values.
 *
 * @param {object} params - Post metadata
 * @returns {string} Front matter block including opening/closing ---
 */
function buildFrontMatter({ title, shareTitle, shareDescription, tags, author, featuredImage, status }) {
  function yamlEscape(value) {
    if (!value) return "";
    return value.replace(/"/g, '\\"');
  }

  let fm = "---\n";
  fm += "layout: post\n";
  fm += `title: "${yamlEscape(title)}"\n`;

  if (shareTitle) {
    fm += `share-title: "${yamlEscape(shareTitle)}"\n`;
  }
  if (shareDescription) {
    fm += `share-description: "${yamlEscape(shareDescription)}"\n`;
  }

  if (tags && tags.length > 0) {
    fm += "tags:\n";
    for (const tag of tags) {
      fm += `  - ${tag}\n`;
    }
  }

  fm += `author: ${author}\n`;

  if (featuredImage) {
    fm += `thumbnail-img: ${featuredImage}\n`;
    fm += `share-img: ${featuredImage}\n`;
  }

  if (status === "draft") {
    fm += "published: false\n";
  }

  fm += "---\n\n";
  return fm;
}

module.exports = { createPost, slugify, buildFrontMatter, VALID_TAGS };
