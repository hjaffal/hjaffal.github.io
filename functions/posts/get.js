const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const { verifyAdminToken } = require("../newsletter/auth");

const GITHUB_PAT = defineSecret("GITHUB_PAT");

const REPO_OWNER = "hjaffal";
const REPO_NAME = "hjaffal.github.io";
const REPO_BRANCH = "master";

/**
 * getPost Cloud Function
 * Fetches the raw markdown content of a post from the GitHub repo.
 *
 * Requires Firebase ID token authentication.
 * Method: GET
 * Region: europe-west1
 * Secrets: GITHUB_PAT
 *
 * Query params:
 *   slug (required) - The post slug (without date prefix or .md extension)
 *   date (optional) - The post date (YYYY-MM-DD) to help locate the file
 *
 * Response:
 *   { result: "success", filename, frontMatter, body, sha } on success
 *   { error: "message" } on failure
 */
const getPost = onRequest(
  { region: "europe-west1", cors: true, secrets: [GITHUB_PAT] },
  async (req, res) => {
    if (req.method !== "GET") {
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

    const { slug, date } = req.query;

    if (!slug || typeof slug !== "string") {
      res.status(400).json({ error: "slug query parameter is required" });
      return;
    }

    try {
      const { Octokit } = require("@octokit/rest");
      const octokit = new Octokit({ auth: GITHUB_PAT.value() });

      let fileContent = null;
      let filePath = null;
      let fileSha = null;

      // If date is provided, try the exact filename first
      if (date) {
        const exactPath = `_posts/${date}-${slug}.md`;
        try {
          const response = await octokit.repos.getContent({
            owner: REPO_OWNER,
            repo: REPO_NAME,
            path: exactPath,
            ref: REPO_BRANCH
          });
          fileContent = Buffer.from(response.data.content, "base64").toString("utf-8");
          filePath = exactPath;
          fileSha = response.data.sha;
        } catch (e) {
          // File not found at exact path, fall through to search
          console.log("Exact path not found:", exactPath, e.status);
        }
      }

      // If not found by exact path, search for the file by slug using Git Trees API
      // (more reliable than getContent for large directories)
      if (!fileContent) {
        try {
          // Get the tree for _posts directory
          const { data: refData } = await octokit.git.getRef({
            owner: REPO_OWNER,
            repo: REPO_NAME,
            ref: "heads/" + REPO_BRANCH
          });
          const commitSha = refData.object.sha;

          const { data: commitData } = await octokit.git.getCommit({
            owner: REPO_OWNER,
            repo: REPO_NAME,
            commit_sha: commitSha
          });

          const { data: rootTree } = await octokit.git.getTree({
            owner: REPO_OWNER,
            repo: REPO_NAME,
            tree_sha: commitData.tree.sha
          });

          const postsEntry = rootTree.tree.find(t => t.path === "_posts" && t.type === "tree");
          if (!postsEntry) {
            res.status(404).json({ error: "_posts directory not found in repository" });
            return;
          }

          const { data: postsTree } = await octokit.git.getTree({
            owner: REPO_OWNER,
            repo: REPO_NAME,
            tree_sha: postsEntry.sha
          });

          const matchingFile = postsTree.tree.find(f =>
            f.path.endsWith(`-${slug}.md`) || f.path.endsWith(`-${slug}.markdown`)
          );

          if (!matchingFile) {
            res.status(404).json({ error: `Post not found: ${slug}` });
            return;
          }

          // Fetch the file content
          const response = await octokit.repos.getContent({
            owner: REPO_OWNER,
            repo: REPO_NAME,
            path: `_posts/${matchingFile.path}`,
            ref: REPO_BRANCH
          });

          fileContent = Buffer.from(response.data.content, "base64").toString("utf-8");
          filePath = `_posts/${matchingFile.path}`;
          fileSha = response.data.sha;
        } catch (treeErr) {
          console.error("Tree search error:", treeErr.message);
          res.status(500).json({ error: "Failed to search for post in repository" });
          return;
        }
      }

      // Parse front matter and body
      const { frontMatter, body } = parseFrontMatter(fileContent);

      res.status(200).json({
        result: "success",
        filename: filePath,
        frontMatter,
        body,
        sha: fileSha
      });
    } catch (err) {
      console.error("GitHub fetch error:", err.message, err.status);
      res.status(500).json({ error: "Failed to fetch post: " + (err.message || "Unknown error") });
    }
  }
);

/**
 * Parse a Jekyll markdown file into front matter object and body string.
 * @param {string} content - Raw file content
 * @returns {{ frontMatter: object, body: string }}
 */
function parseFrontMatter(content) {
  const frontMatter = {};
  let body = content;

  if (content.startsWith("---")) {
    const endIndex = content.indexOf("---", 3);
    if (endIndex !== -1) {
      const fmBlock = content.substring(3, endIndex).trim();
      body = content.substring(endIndex + 3).trim();

      // Simple YAML parser for flat key-value pairs and arrays
      let currentKey = null;
      let inArray = false;

      for (const line of fmBlock.split("\n")) {
        const trimmed = line.trim();

        if (inArray && trimmed.startsWith("- ")) {
          frontMatter[currentKey].push(trimmed.substring(2).trim());
          continue;
        } else if (inArray) {
          inArray = false;
        }

        const colonIdx = trimmed.indexOf(":");
        if (colonIdx === -1) continue;

        const key = trimmed.substring(0, colonIdx).trim();
        const value = trimmed.substring(colonIdx + 1).trim();

        if (value === "") {
          // Could be start of an array
          currentKey = key;
          frontMatter[key] = [];
          inArray = true;
        } else {
          // Remove surrounding quotes if present
          frontMatter[key] = value.replace(/^["']|["']$/g, "");
        }
      }
    }
  }

  return { frontMatter, body };
}

module.exports = { getPost, parseFrontMatter };
