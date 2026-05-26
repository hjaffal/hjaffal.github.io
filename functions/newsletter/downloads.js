const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const { verifyAdminToken } = require("./auth");

const db = admin.firestore();
const COLLECTION = "download_events";

/**
 * trackDownload Cloud Function
 * Tracks file downloads and provides admin analytics.
 *
 * Public actions (no auth):
 *   track — Record a download event
 *
 * Admin actions (auth required):
 *   list — List files with download counts
 *   detail — List who downloaded a specific file
 */
const trackDownload = onRequest(
  { region: "europe-west1", cors: true },
  async (req, res) => {
    const action = req.query.action || req.body.action;

    try {
      if (action === "track") {
        await handleTrack(req, res);
      } else if (action === "list") {
        await verifyAdminToken(req);
        await handleList(req, res);
      } else if (action === "detail") {
        await verifyAdminToken(req);
        await handleDetail(req, res);
      } else {
        res.status(400).json({ error: "Invalid action. Use: track, list, detail" });
      }
    } catch (err) {
      if (err.statusCode === 401) {
        res.status(401).json({ error: err.message });
      } else {
        console.error("trackDownload error:", err.message);
        res.status(500).json({ error: err.message || "Internal error" });
      }
    }
  }
);

/**
 * Record a download event (public, no auth required).
 */
async function handleTrack(req, res) {
  const { email, file } = req.body;

  if (!file) {
    res.status(400).json({ error: "file is required" });
    return;
  }

  await db.collection(COLLECTION).add({
    email: email || "anonymous",
    file: file,
    fileName: file.split("/").pop(),
    downloadedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  res.status(200).json({ result: "success" });
}

/**
 * List all files with download counts (admin only).
 */
async function handleList(_req, res) {
  const snapshot = await db.collection(COLLECTION).get();

  const fileCounts = {};
  snapshot.docs.forEach(doc => {
    const data = doc.data();
    const file = data.file || "unknown";
    if (!fileCounts[file]) {
      fileCounts[file] = { file, fileName: data.fileName || file.split("/").pop(), count: 0 };
    }
    fileCounts[file].count++;
  });

  const files = Object.values(fileCounts).sort((a, b) => b.count - a.count);
  res.status(200).json({ files });
}

/**
 * List who downloaded a specific file (admin only).
 */
async function handleDetail(req, res) {
  const file = req.query.file || req.body.file;
  if (!file) {
    res.status(400).json({ error: "file query param is required" });
    return;
  }

  const snapshot = await db.collection(COLLECTION)
    .where("file", "==", file)
    .orderBy("downloadedAt", "desc")
    .limit(100)
    .get();

  const downloads = [];
  snapshot.docs.forEach(doc => {
    const data = doc.data();
    downloads.push({
      email: data.email,
      downloadedAt: data.downloadedAt ? data.downloadedAt.toDate().toISOString() : null,
    });
  });

  res.status(200).json({ file, downloads });
}

module.exports = { trackDownload };
