const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const { Resend } = require("resend");
const admin = require("firebase-admin");
const { verifyAdminToken } = require("../newsletter/auth");

const db = admin.firestore();
const RESEND_API_KEY = defineSecret("RESEND_API_KEY");

/**
 * testimonials Cloud Function
 * Handles testimonial submission and listing for Sproochentest community board.
 *
 * POST ?action=submit      — Submit a new testimonial
 * GET  ?action=list        — List approved public testimonials
 * GET  ?action=admin-list  — List testimonials by status (admin, requires auth)
 * POST ?action=admin-update — Approve, reject, or delete a testimonial (admin, requires auth)
 */
const testimonials = onRequest(
  { region: "europe-west1", cors: true, secrets: [RESEND_API_KEY] },
  async (req, res) => {
    const action = req.query.action;

    if (req.method === "POST" && action === "submit") {
      return handleSubmit(req, res);
    }

    if (req.method === "GET" && action === "list") {
      return handleList(req, res);
    }

    if (req.method === "GET" && action === "admin-list") {
      return handleAdminList(req, res);
    }

    if (req.method === "POST" && action === "admin-update") {
      return handleAdminUpdate(req, res);
    }

    res.status(400).json({ error: "Invalid action or method" });
  }
);

/**
 * Character labels for email display.
 */
const CHARACTER_LABELS = {
  love: "Love it! 🤩",
  meh: "It's okay 🤷",
  grumpy: "Needs work 😤",
  student: "De Student (Still learning)",
  exam: "Am Examen (Exam ready)",
  passed: "Bestoungen! (Passed)",
};

/**
 * Handle testimonial submission.
 * Body: { character, name, experience, improvement, type, honeypot }
 */
async function handleSubmit(req, res) {
  const body = req.body.data || req.body;
  const { character, name, experience, improvement, type, honeypot } = body;

  // Bot detection: reject silently if honeypot has a value
  if (honeypot) {
    res.status(200).json({ result: "success" });
    return;
  }

  // Validate character
  const validCharacters = ["love", "meh", "grumpy", "student", "exam", "passed"];
  if (!character || !validCharacters.includes(character)) {
    res.status(400).json({ error: "Invalid character" });
    return;
  }

  // Validate name
  if (!name || typeof name !== "string" || name.trim().length < 2 || name.length > 200) {
    res.status(400).json({ error: "Invalid name" });
    return;
  }

  // Validate experience
  if (!experience || typeof experience !== "string" || experience.trim().length < 5 || experience.length > 2000) {
    res.status(400).json({ error: "Invalid experience" });
    return;
  }

  // Validate improvement (optional but max length)
  if (improvement && (typeof improvement !== "string" || improvement.length > 2000)) {
    res.status(400).json({ error: "Invalid improvement field" });
    return;
  }

  // Validate type
  const validTypes = ["public", "private"];
  if (!validTypes.includes(type)) {
    res.status(400).json({ error: "Invalid type" });
    return;
  }

  // Get IP from request
  const ip = req.headers["x-forwarded-for"] || req.ip || "";

  try {
    const docRef = await db.collection("sproochentest_testimonials").add({
      character: character,
      name: name.trim(),
      experience: experience.trim(),
      improvement: improvement ? improvement.trim() : "",
      type: type,
      status: "pending",
      ip: typeof ip === "string" ? ip.split(",")[0].trim() : "",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Send notification email via Resend
    try {
      const resend = new Resend(RESEND_API_KEY.value());
      const charLabel = CHARACTER_LABELS[character] || character;
      const firestoreUrl = `https://console.firebase.google.com/project/hasanjaffal/firestore/databases/-default-/data/sproochentest_testimonials/${docRef.id}`;

      await resend.emails.send({
        from: "Sproochentest <hasan@hasanjaffal.com>",
        to: "jaftalks@gmail.com",
        subject: `New Sproochentest Testimonial from ${name.trim()}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
            <h2 style="color: #0F172A; margin-bottom: 24px;">New Testimonial Submitted</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #64748B; width: 120px;">Character:</td>
                <td style="padding: 8px 0; color: #0F172A;">${charLabel}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #64748B;">Name:</td>
                <td style="padding: 8px 0; color: #0F172A;">${name.trim()}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #64748B; vertical-align: top;">Experience:</td>
                <td style="padding: 8px 0; color: #0F172A;">${experience.trim()}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #64748B; vertical-align: top;">Improvement:</td>
                <td style="padding: 8px 0; color: #0F172A;">${improvement ? improvement.trim() : "<em>Not provided</em>"}</td>
              </tr>
            </table>
            <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #E2E8F0;">
              <a href="${firestoreUrl}" style="display: inline-block; padding: 10px 20px; background: #9333EA; color: #FFFFFF; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">Approve in Firestore</a>
            </div>
            <p style="margin-top: 16px; font-size: 12px; color: #94A3B8;">Change status from "pending" to "approved" to display on the community board.</p>
          </div>
        `,
      });
    } catch (emailErr) {
      // Don't fail the submission if email fails
      console.error("Testimonial email notification failed:", emailErr.message);
    }

    res.status(200).json({ result: "success" });
  } catch (err) {
    console.error("Testimonial submit error:", err.message);
    res.status(500).json({ error: "Failed to submit testimonial" });
  }
}

/**
 * Handle listing approved public testimonials.
 * Returns array of { name, character, experience, createdAt }
 */
async function handleList(req, res) {
  try {
    const snapshot = await db
      .collection("sproochentest_testimonials")
      .where("type", "==", "public")
      .where("status", "==", "approved")
      .orderBy("createdAt", "desc")
      .limit(20)
      .get();

    const testimonials = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        name: data.name,
        character: data.character || "student",
        experience: data.experience || data.message || "",
        createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : null,
      };
    });

    res.status(200).json({ testimonials });
  } catch (err) {
    console.error("Testimonial list error:", err.message);
    res.status(500).json({ error: "Failed to load testimonials" });
  }
}

/**
 * Handle admin listing of testimonials by status.
 * GET ?action=admin-list&status=pending|approved|rejected|all
 * Requires Firebase Auth token.
 */
async function handleAdminList(req, res) {
  try {
    await verifyAdminToken(req);
  } catch (err) {
    res.status(err.statusCode || 401).json({ error: err.message });
    return;
  }

  const status = req.query.status || "pending";

  try {
    let query = db.collection("sproochentest_testimonials");

    if (status !== "all") {
      query = query.where("status", "==", status);
    }

    query = query.orderBy("createdAt", "desc").limit(50);
    const snapshot = await query.get();

    const testimonials = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || "",
        character: data.character || "student",
        experience: data.experience || data.message || "",
        improvement: data.improvement || "",
        type: data.type || "public",
        status: data.status || "pending",
        createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : null,
      };
    });

    res.status(200).json({ testimonials });
  } catch (err) {
    console.error("Admin testimonial list error:", err.message);
    res.status(500).json({ error: "Failed to load testimonials" });
  }
}

/**
 * Handle admin update (approve, reject, delete) of a testimonial.
 * POST ?action=admin-update
 * Body: { id, status } where status is "approved", "rejected", or "delete"
 * Requires Firebase Auth token.
 */
async function handleAdminUpdate(req, res) {
  try {
    await verifyAdminToken(req);
  } catch (err) {
    res.status(err.statusCode || 401).json({ error: err.message });
    return;
  }

  const body = req.body.data || req.body;
  const { id, status } = body;

  if (!id || typeof id !== "string") {
    res.status(400).json({ error: "Missing testimonial id" });
    return;
  }

  const validStatuses = ["approved", "rejected", "delete"];
  if (!status || !validStatuses.includes(status)) {
    res.status(400).json({ error: "Invalid status. Use: approved, rejected, or delete" });
    return;
  }

  try {
    const docRef = db.collection("sproochentest_testimonials").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      res.status(404).json({ error: "Testimonial not found" });
      return;
    }

    if (status === "delete") {
      await docRef.delete();
      res.status(200).json({ result: "deleted" });
    } else {
      await docRef.update({ status });
      res.status(200).json({ result: status });
    }
  } catch (err) {
    console.error("Admin testimonial update error:", err.message);
    res.status(500).json({ error: "Failed to update testimonial" });
  }
}

module.exports = { testimonials };
