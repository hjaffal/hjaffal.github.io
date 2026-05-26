const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const { verifyAdminToken } = require("../newsletter/auth");
const admin = require("firebase-admin");
const { buildFrontMatter, slugify, VALID_TAGS } = require("./create");

const GITHUB_PAT = defineSecret("GITHUB_PAT");
const REPO_OWNER = "hjaffal";
const REPO_NAME = "hjaffal.github.io";
const REPO_BRANCH = "master";

const db = admin.firestore();
const COLLECTION = "posts_drafts";

/**
 * manageDrafts Cloud Function
 * Handles all draft CRUD operations via query param ?action=
 *
 * Actions:
 *   save    — Create or update a draft in Firestore
 *   get     — Get a single draft by ID
 *   list    — List all drafts
 *   delete  — Delete a draft
 *   publish — Validate, commit to GitHub, update status
 *
 * All actions require Firebase Auth (admin only).
 */
const manageDrafts = onRequest(
  { region: "europe-west1", cors: true, secrets: [GITHUB_PAT], timeoutSeconds: 60 },
  async (req, res) => {
    // Verify admin auth
    try {
      await verifyAdminToken(req);
    } catch (err) {
      res.status(err.statusCode || 401).json({ error: err.message || "Unauthorized" });
      return;
    }

    const action = req.query.action || req.body.action;

    try {
      switch (action) {
        case "save":
          await handleSave(req, res);
          break;
        case "get":
          await handleGet(req, res);
          break;
        case "list":
          await handleList(req, res);
          break;
        case "delete":
          await handleDelete(req, res);
          break;
        case "publish":
          await handlePublish(req, res);
          break;
        case "checkDeployment":
          await handleCheckDeployment(req, res);
          break;
        case "deletePublished":
          await handleDeletePublished(req, res);
          break;
        default:
          res.status(400).json({ error: "Invalid action. Use: save, get, list, delete, publish, checkDeployment, deletePublished" });
      }
    } catch (err) {
      console.error("manageDrafts error:", err.message);
      res.status(500).json({ error: err.message || "Internal error" });
    }
  }
);

/**
 * Save or update a draft.
 */
async function handleSave(req, res) {
  const data = req.body;
  const { id, title, slug, content, tags, excerpt, metaTitle, metaDescription,
    featuredImage, publishDate, position } = data;

  if (!title || !title.trim()) {
    res.status(400).json({ error: "Title is required" });
    return;
  }

  const now = admin.firestore.FieldValue.serverTimestamp();
  const postSlug = slug || slugify(title);

  const draftData = {
    title: title.trim(),
    slug: postSlug,
    content: content || "",
    tags: tags || [],
    position: position || (tags && tags[0]) || "",
    excerpt: excerpt || "",
    metaTitle: metaTitle || "",
    metaDescription: metaDescription || "",
    featuredImage: featuredImage || "",
    publishDate: publishDate || new Date().toISOString().split("T")[0],
    status: "draft",
    updatedAt: now,
  };

  let docRef;
  if (id) {
    // Update existing draft
    docRef = db.collection(COLLECTION).doc(id);
    await docRef.update(draftData);
  } else {
    // Create new draft
    draftData.createdAt = now;
    draftData.lastPublishedAt = null;
    draftData.githubPath = null;
    draftData.publicUrl = null;
    docRef = await db.collection(COLLECTION).add(draftData);
  }

  res.status(200).json({ result: "success", id: id || docRef.id });
}

/**
 * Get a single draft by ID.
 */
async function handleGet(req, res) {
  const id = req.query.id || req.body.id;
  if (!id) {
    res.status(400).json({ error: "id is required" });
    return;
  }

  const doc = await db.collection(COLLECTION).doc(id).get();
  if (!doc.exists) {
    res.status(404).json({ error: "Draft not found" });
    return;
  }

  const data = doc.data();
  res.status(200).json({
    id: doc.id,
    ...data,
    createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : null,
    updatedAt: data.updatedAt ? data.updatedAt.toDate().toISOString() : null,
    lastPublishedAt: data.lastPublishedAt ? data.lastPublishedAt.toDate().toISOString() : null,
  });
}

/**
 * List all drafts, ordered by updatedAt descending.
 */
async function handleList(req, res) {
  const snapshot = await db.collection(COLLECTION)
    .orderBy("updatedAt", "desc")
    .limit(100)
    .get();

  const drafts = [];
  snapshot.forEach(doc => {
    const data = doc.data();
    // Exclude published items from the drafts list
    if (data.status === "published") return;

    drafts.push({
      id: doc.id,
      title: data.title,
      slug: data.slug,
      status: data.status,
      tags: data.tags,
      position: data.position,
      publishDate: data.publishDate,
      updatedAt: data.updatedAt ? data.updatedAt.toDate().toISOString() : null,
      createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : null,
      lastPublishedAt: data.lastPublishedAt ? data.lastPublishedAt.toDate().toISOString() : null,
      githubPath: data.githubPath,
      publicUrl: data.publicUrl,
      deploymentStatus: data.deploymentStatus,
      githubCommitUrl: data.githubCommitUrl,
    });
  });

  res.status(200).json({ drafts });
}

/**
 * Delete a draft. If it has a githubPath (was published), also delete from GitHub.
 */
async function handleDelete(req, res) {
  const id = req.query.id || req.body.id;
  const deleteFromGithub = req.body.deleteFromGithub || false;
  if (!id) {
    res.status(400).json({ error: "id is required" });
    return;
  }

  const docRef = db.collection(COLLECTION).doc(id);
  const doc = await docRef.get();

  if (doc.exists && deleteFromGithub) {
    const data = doc.data();
    if (data.githubPath) {
      try {
        const { Octokit } = require("@octokit/rest");
        const octokit = new Octokit({ auth: GITHUB_PAT.value() });

        // Get current file SHA
        const { data: fileData } = await octokit.repos.getContent({
          owner: REPO_OWNER,
          repo: REPO_NAME,
          path: data.githubPath,
          ref: REPO_BRANCH
        });

        // Delete the file
        await octokit.repos.deleteFile({
          owner: REPO_OWNER,
          repo: REPO_NAME,
          path: data.githubPath,
          message: `Delete post: ${data.title || data.githubPath}`,
          sha: fileData.sha,
          branch: REPO_BRANCH
        });
      } catch (err) {
        // If file doesn't exist on GitHub, that's fine — continue with Firestore delete
        if (err.status !== 404) {
          console.error("GitHub delete error:", err.message);
          res.status(500).json({ error: "Failed to delete from GitHub: " + err.message });
          return;
        }
      }
    }
  }

  // Delete from Firestore (if it exists there)
  if (doc.exists) {
    await docRef.delete();
  }

  res.status(200).json({ result: "success" });
}

/**
 * Delete a published post by its GitHub path (for posts not in Firestore).
 */
async function handleDeletePublished(req, res) {
  const { githubPath, slug, date } = req.body;

  if (!githubPath && !slug) {
    res.status(400).json({ error: "githubPath or slug is required" });
    return;
  }

  const filePath = githubPath || `_posts/${date}-${slug}.md`;

  try {
    const { Octokit } = require("@octokit/rest");
    const octokit = new Octokit({ auth: GITHUB_PAT.value() });

    // Get current file SHA
    const { data: fileData } = await octokit.repos.getContent({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: filePath,
      ref: REPO_BRANCH
    });

    // Delete the file
    await octokit.repos.deleteFile({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: filePath,
      message: `Delete post: ${filePath}`,
      sha: fileData.sha,
      branch: REPO_BRANCH
    });

    res.status(200).json({ result: "success", message: "Post deleted. Site will rebuild." });
  } catch (err) {
    if (err.status === 404) {
      res.status(404).json({ error: "Post file not found on GitHub" });
    } else {
      console.error("Delete published error:", err.message);
      res.status(500).json({ error: "Failed to delete: " + err.message });
    }
  }
}

/**
 * Publish a draft: validate, build markdown, commit to GitHub, update status.
 */
async function handlePublish(req, res) {
  const id = req.body.id;
  if (!id) {
    res.status(400).json({ error: "id is required" });
    return;
  }

  // Get the draft
  const docRef = db.collection(COLLECTION).doc(id);
  const doc = await docRef.get();
  if (!doc.exists) {
    res.status(404).json({ error: "Draft not found" });
    return;
  }

  const draft = doc.data();

  // Validate required fields
  if (!draft.title || !draft.title.trim()) {
    res.status(400).json({ error: "Title is required to publish" });
    return;
  }
  if (!draft.content || !draft.content.trim()) {
    res.status(400).json({ error: "Content is required to publish" });
    return;
  }

  // Update status to publishing
  await docRef.update({ status: "publishing" });

  // Build the markdown file
  const postDate = draft.publishDate || new Date().toISOString().split("T")[0];
  const postSlug = draft.slug || slugify(draft.title);
  const filename = `_posts/${postDate}-${postSlug}.md`;
  const publicUrl = `/${postDate}-${postSlug}/`;

  const frontMatter = buildFrontMatter({
    title: draft.title.trim(),
    shareTitle: draft.metaTitle || "",
    shareDescription: draft.metaDescription || "",
    tags: draft.tags || [],
    author: "Hasan J.",
    featuredImage: draft.featuredImage || "",
    status: "published"
  });

  const fileContent = frontMatter + draft.content.trim() + "\n";

  // Commit to GitHub
  try {
    const { Octokit } = require("@octokit/rest");
    const octokit = new Octokit({ auth: GITHUB_PAT.value() });

    // Check if file already exists (for updates) — check both githubPath and the target filename
    let existingSha = null;
    const pathsToCheck = [draft.githubPath, filename].filter(Boolean);
    for (const pathToCheck of pathsToCheck) {
      if (existingSha) break;
      try {
        const existing = await octokit.repos.getContent({
          owner: REPO_OWNER,
          repo: REPO_NAME,
          path: pathToCheck,
          ref: REPO_BRANCH
        });
        existingSha = existing.data.sha;
        console.log("Found existing file at:", pathToCheck, "SHA:", existingSha);
      } catch (e) {
        console.log("File not found at:", pathToCheck, "status:", e.status);
      }
    }

    console.log("Publishing to:", filename, "existingSha:", existingSha);

    const commitParams = {
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: filename,
      message: existingSha ? `Update post: ${draft.title.trim()}` : `Add post: ${draft.title.trim()}`,
      content: Buffer.from(fileContent).toString("base64"),
      branch: REPO_BRANCH
    };

    if (existingSha) {
      commitParams.sha = existingSha;
    }

    const commitResult = await octokit.repos.createOrUpdateFileContents(commitParams);

    // Capture commit SHA
    const commitSha = commitResult.data.commit.sha;
    const commitUrl = commitResult.data.commit.html_url;

    // Update Firestore with saved_to_github status and commit details
    await docRef.update({
      status: "saved_to_github",
      githubPath: filename,
      publicUrl: publicUrl,
      githubCommitSha: commitSha,
      githubCommitUrl: commitUrl,
      deploymentStatus: "saved_to_github",
      deploymentConclusion: null,
      deploymentUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
      lastPublishedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(200).json({
      result: "success",
      id,
      filename,
      publicUrl,
      commitSha,
      status: "saved_to_github",
      message: "Saved to GitHub. Site is rebuilding."
    });

  } catch (err) {
    console.error("Publish error:", err.message, "status:", err.status, "response:", JSON.stringify(err.response?.data || {}));
    await docRef.update({ status: "publish_failed", deploymentStatus: "publish_failed" });

    if (err.status === 409) {
      res.status(409).json({ error: "Conflict: file was modified. Try publishing again." });
    } else {
      res.status(500).json({ error: "Failed to publish: " + err.message });
    }
  }
}

/**
 * Check deployment status.
 * Uses a simple approach: check if the public URL returns 200.
 * If yes, mark as published. If not, check GitHub deployments.
 */
async function handleCheckDeployment(req, res) {
  const id = req.query.id || req.body.id;
  if (!id) {
    res.status(400).json({ error: "id is required" });
    return;
  }

  const docRef = db.collection(COLLECTION).doc(id);
  const doc = await docRef.get();
  if (!doc.exists) {
    res.status(404).json({ error: "Draft not found" });
    return;
  }

  const draft = doc.data();

  if (!draft.publicUrl) {
    res.status(400).json({ error: "No public URL. Post may not have been published yet." });
    return;
  }

  try {
    // Check if the public URL is live
    const siteUrl = "https://hasanjaffal.com" + draft.publicUrl;
    const response = await fetch(siteUrl, { method: "HEAD", redirect: "follow" });

    if (response.ok) {
      // Post is live — mark as published
      await docRef.update({
        status: "published",
        deploymentStatus: "published",
        deploymentConclusion: "success",
        deploymentUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      res.status(200).json({ id, status: "published", message: "Post is live!" });
      return;
    }
  } catch (e) {
    // URL check failed — fall through to deployment API check
  }

  // If URL isn't live yet, check GitHub deployments
  try {
    const { Octokit } = require("@octokit/rest");
    const octokit = new Octokit({ auth: GITHUB_PAT.value() });

    const { data: deployments } = await octokit.repos.listDeployments({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      environment: "github-pages",
      per_page: 3
    });

    if (deployments.length === 0) {
      res.status(200).json({ id, status: "saved_to_github", message: "No deployment found yet." });
      return;
    }

    const latest = deployments[0];
    const { data: statuses } = await octokit.repos.listDeploymentStatuses({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      deployment_id: latest.id,
      per_page: 1
    });

    let adminStatus = "saved_to_github";
    if (statuses.length > 0) {
      const state = statuses[0].state;
      if (state === "success" || state === "inactive") adminStatus = "published";
      else if (state === "in_progress" || state === "pending") adminStatus = "build_running";
      else if (state === "queued") adminStatus = "build_queued";
      else if (state === "failure" || state === "error") adminStatus = "publish_failed";
    }

    await docRef.update({
      status: adminStatus,
      deploymentStatus: adminStatus,
      deploymentUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(200).json({ id, status: adminStatus, message: adminStatus === "published" ? "Post is live!" : "Build in progress…" });

  } catch (err) {
    console.error("Check deployment error:", err.message);
    res.status(500).json({ error: "Failed to check status: " + err.message });
  }
}
module.exports = { manageDrafts };
