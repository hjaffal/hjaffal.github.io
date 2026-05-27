const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const { verifyAdminToken } = require("./auth");

const db = admin.firestore();

/**
 * listAssessments Cloud Function
 * Returns job risk assessment submissions for the admin panel.
 */
const listAssessments = onRequest(
  { region: "europe-west1", cors: true },
  async (req, res) => {
    if (req.method !== "GET") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    try {
      await verifyAdminToken(req);
    } catch (err) {
      res.status(err.statusCode || 401).json({ error: err.message || "Unauthorized" });
      return;
    }

    try {
      const snapshot = await db.collection("job_risk_submissions")
        .orderBy("submittedAt", "desc")
        .limit(200)
        .get();

      const assessments = [];
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        assessments.push({
          id: doc.id,
          name: data.name || "—",
          email: data.email || "—",
          jobTitle: data.jobTitle || "—",
          country: data.country || "—",
          seniority: data.seniority || "—",
          riskScore: data.result ? data.result.risk_score : null,
          riskLevel: data.result ? data.result.risk_level : null,
          submittedAt: data.submittedAt ? data.submittedAt.toDate().toISOString() : null,
          tokenHash: data.tokenHash || null,
          reportToken: data.reportToken || null,
        });
      });

      res.status(200).json({ assessments });
    } catch (err) {
      console.error("listAssessments error:", err.message);
      res.status(500).json({ error: "Failed to fetch assessments" });
    }
  }
);

module.exports = { listAssessments };
