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
      } else if (action === "seed") {
        await verifyAdminToken(req);
        await handleSeed(req, res);
      } else {
        res.status(400).json({ error: "Invalid action. Use: track, list, detail, seed" });
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
 * Also auto-registers the file in downloadable_materials if not already there.
 */
async function handleTrack(req, res) {
  const { email, file } = req.body;

  if (!file) {
    res.status(400).json({ error: "file is required" });
    return;
  }

  // Record the download event
  await db.collection(COLLECTION).add({
    email: email || "anonymous",
    file: file,
    fileName: file.split("/").pop(),
    downloadedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Auto-register in downloadable_materials if not exists
  const docId = file.replace(/[\/ ]/g, "_").replace(/^_/, "");
  const matRef = db.collection("downloadable_materials").doc(docId);
  const matDoc = await matRef.get();
  if (!matDoc.exists) {
    await matRef.set({
      file: file,
      fileName: file.split("/").pop(),
      title: file.split("/").pop().replace(/\.pdf$/i, ""),
      category: "other",
      downloads: 0
    });
  }

  res.status(200).json({ result: "success" });
}

/**
 * List all files with download counts (admin only).
 * Reads from downloadable_materials collection (seeded) and merges with actual download counts.
 */
async function handleList(_req, res) {
  // Get all registered materials
  const materialsSnapshot = await db.collection("downloadable_materials").get();
  const fileCounts = {};

  materialsSnapshot.docs.forEach(doc => {
    const data = doc.data();
    fileCounts[data.file] = {
      file: data.file,
      fileName: data.fileName || data.file.split("/").pop(),
      title: data.title || data.fileName,
      category: data.category || "other",
      count: 0
    };
  });

  // Count actual downloads
  const downloadsSnapshot = await db.collection(COLLECTION).get();
  downloadsSnapshot.docs.forEach(doc => {
    const data = doc.data();
    const file = data.file || "unknown";
    if (fileCounts[file]) {
      fileCounts[file].count++;
    } else {
      fileCounts[file] = {
        file,
        fileName: data.fileName || file.split("/").pop(),
        title: data.fileName || file.split("/").pop(),
        category: "other",
        count: 1
      };
    }
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

/**
 * Seed the downloadable_materials collection with all known files.
 */
async function handleSeed(_req, res) {
  const materials = [
    { file: "/assets/pdf/Sproochentest Adjective Guide.pdf", fileName: "Sproochentest Adjective Guide.pdf", title: "Adjective Declension Guide", category: "sproochentest", downloads: 0 },
    { file: "/assets/pdf/Sproochentest Articles and Prepositions Guide.pdf", fileName: "Sproochentest Articles and Prepositions Guide.pdf", title: "Articles & Prepositions Guide", category: "sproochentest", downloads: 0 },
    { file: "/assets/pdf/Sproochentest Picture Description Guide.pdf", fileName: "Sproochentest Picture Description Guide.pdf", title: "Picture Description Master Sheet", category: "sproochentest", downloads: 0 },
    { file: "/assets/pdf/ai-dashboard-review-template.pdf", fileName: "ai-dashboard-review-template.pdf", title: "AI Dashboard Review Template", category: "templates", downloads: 0 },
    { file: "/assets/pdf/ai-root-cause-analysis-template.pdf", fileName: "ai-root-cause-analysis-template.pdf", title: "AI Root Cause Analysis Template", category: "templates", downloads: 0 },
    { file: "/assets/pdf/ai-weekly-business-review-template.pdf", fileName: "ai-weekly-business-review-template.pdf", title: "AI Weekly Business Review Template", category: "templates", downloads: 0 },
    { file: "/assets/pdf/future-proof-skills-guide.pdf", fileName: "future-proof-skills-guide.pdf", title: "Future-Proof Skills Guide", category: "tools", downloads: 0 }
  ];

  for (const mat of materials) {
    const docId = mat.file.replace(/[\/ ]/g, "_").replace(/^_/, "");
    await db.collection("downloadable_materials").doc(docId).set(mat, { merge: true });
  }

  res.status(200).json({ result: "success", count: materials.length });
}
