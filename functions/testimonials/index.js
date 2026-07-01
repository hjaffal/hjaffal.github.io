const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

const db = admin.firestore();

/**
 * testimonials Cloud Function
 * Handles testimonial submission and listing for Sproochentest community board.
 *
 * POST ?action=submit — Submit a new testimonial (public or private)
 * GET  ?action=list  — List approved public testimonials
 */
const testimonials = onRequest(
  { region: "europe-west1", cors: true },
  async (req, res) => {
    const action = req.query.action;

    if (req.method === "POST" && action === "submit") {
      return handleSubmit(req, res);
    }

    if (req.method === "GET" && action === "list") {
      return handleList(req, res);
    }

    res.status(400).json({ error: "Invalid action or method" });
  }
);

/**
 * Handle testimonial submission.
 * Body: { name, message, rating, type, honeypot }
 */
async function handleSubmit(req, res) {
  const body = req.body.data || req.body;
  const { name, message, rating, type, honeypot } = body;

  // Bot detection: reject if honeypot has a value
  if (honeypot) {
    res.status(200).json({ result: "success" });
    return;
  }

  // Validate name
  if (!name || typeof name !== "string" || name.trim().length < 2 || name.length > 200) {
    res.status(400).json({ error: "Invalid name" });
    return;
  }

  // Validate message
  if (!message || typeof message !== "string" || message.trim().length < 5 || message.length > 2000) {
    res.status(400).json({ error: "Invalid message" });
    return;
  }

  // Validate rating (1-5)
  const ratingInt = parseInt(rating);
  if (isNaN(ratingInt) || ratingInt < 1 || ratingInt > 5) {
    res.status(400).json({ error: "Invalid rating (must be 1-5)" });
    return;
  }

  // Validate type
  const validTypes = ["public", "private"];
  if (!validTypes.includes(type)) {
    res.status(400).json({ error: "Invalid type" });
    return;
  }

  // Determine status based on type
  const status = type === "public" ? "pending" : "received";

  // Get IP from request
  const ip = req.headers["x-forwarded-for"] || req.ip || "";

  try {
    await db.collection("sproochentest_testimonials").add({
      name: name.trim(),
      message: message.trim(),
      rating: ratingInt,
      type: type,
      status: status,
      ip: typeof ip === "string" ? ip.split(",")[0].trim() : "",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(200).json({ result: "success" });
  } catch (err) {
    console.error("Testimonial submit error:", err.message);
    res.status(500).json({ error: "Failed to submit testimonial" });
  }
}

/**
 * Handle listing approved public testimonials.
 * Returns array of { name, message, rating, createdAt }
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
        message: data.message,
        rating: data.rating,
        createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : null,
      };
    });

    res.status(200).json({ testimonials });
  } catch (err) {
    console.error("Testimonial list error:", err.message);
    res.status(500).json({ error: "Failed to load testimonials" });
  }
}

module.exports = { testimonials };
