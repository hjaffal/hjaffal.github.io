const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const crypto = require("crypto");
const { verifyAdminToken } = require("./auth");

const db = admin.firestore();

/**
 * backfillTokens Cloud Function (one-time use)
 *
 * Accepts an array of raw report tokens, hashes each with SHA-256,
 * finds the matching document in job_risk_submissions by tokenHash,
 * and updates it with the reportToken field.
 *
 * POST body: { tokens: ["raw_token_1", "raw_token_2", ...] }
 */
const backfillTokens = onRequest(
  { region: "europe-west1", cors: true },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    try {
      await verifyAdminToken(req);
    } catch (err) {
      res.status(err.statusCode || 401).json({ error: err.message || "Unauthorized" });
      return;
    }

    const { tokens } = req.body;
    if (!tokens || !Array.isArray(tokens) || tokens.length === 0) {
      res.status(400).json({ error: "tokens array is required" });
      return;
    }

    const results = [];

    for (const rawToken of tokens) {
      const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

      try {
        const snapshot = await db.collection("job_risk_submissions")
          .where("tokenHash", "==", tokenHash)
          .limit(1)
          .get();

        if (snapshot.empty) {
          results.push({ token: rawToken.substring(0, 8) + "...", status: "not_found", tokenHash });
        } else {
          const doc = snapshot.docs[0];
          await doc.ref.update({ reportToken: rawToken });
          results.push({
            token: rawToken.substring(0, 8) + "...",
            status: "updated",
            docId: doc.id,
            name: doc.data().name || "—"
          });
        }
      } catch (err) {
        results.push({ token: rawToken.substring(0, 8) + "...", status: "error", error: err.message });
      }
    }

    const updated = results.filter(r => r.status === "updated").length;
    const notFound = results.filter(r => r.status === "not_found").length;

    res.status(200).json({
      result: "done",
      summary: { total: tokens.length, updated, notFound },
      details: results
    });
  }
);

module.exports = { backfillTokens };
