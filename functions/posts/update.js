const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const { verifyAdminToken } = require("../newsletter/auth");
const { buildFrontMatter, VALID_TAGS } = require("./create");

const GITHUB_PAT = defineSecret("GITHUB_PAT");

const REPO_OWNER = "hjaffal";
const REPO_NAME = "hjaffal.github.io";
const REPO_BRANCH = "master";

/**
 * updatePost Cloud Function
 * Updates an existing Jekyll blog post by committing changes to the GitHub repo.
 *
 * Requires Firebase ID token authentication.
 * Method: POST
 * Region: europe-west1
 * Secrets: GITHUB_PAT
 *
 * Request body:
 *   filename (required) - The path to the file in the repo (e.g., "_posts/2024-01-15-my-post.md")
 *   sha (required) - The current SHA of the file (for conflict detection)
 *   title (required, max 150 chars)
 *   body (required, markdown content)
 *   slug (optional, max 80 chars)
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
const updatePost = onRequest(
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

    const { filename, sha, title, slug, author, tags, status, date, excerpt, shareTitle, shareDescription, featuredImage, body } = req.body;

    // Validate required fields
    if (!filename || typeof filename !== "string") {
      res.status(400).json({ error: "filename is required" });
      return;
    }
    if (!sha || typeof sha !== "string") {
      res.status(400).json({ error: "sha is required (for conflict detection)" });
      return;
    }
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
    if (shareDescription && shareDescription.length > 300) {
      res.status(400).json({ error: "Meta description must be 300 characters or less" });
      return;
    }

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

    // Commit to GitHub (update existing file using SHA)
    try {
      const { Octokit } = require("@octokit/rest");
      const octokit = new Octokit({ auth: GITHUB_PAT.value() });

      await octokit.repos.createOrUpdateFileContents({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        path: filename,
        message: `Update post: ${title.trim()}`,
        content: Buffer.from(fileContent).toString("base64"),
        sha: sha,
        branch: REPO_BRANCH
      });

      // Derive public URL from filename
      const basename = filename.replace("_posts/", "").replace(".md", "").replace(".markdown", "");
      const publicUrl = `/${basename}/`;

      res.status(200).json({ result: "success", filename, url: publicUrl });
    } catch (err) {
      console.error("GitHub commit error:", err.message);
      if (err.status === 409) {
        res.status(409).json({ error: "Conflict: the file was modified since you loaded it. Please reload and try again." });
      } else {
        res.status(500).json({ error: "Failed to update post in repository" });
      }
    }
  }
);

module.exports = { updatePost };
