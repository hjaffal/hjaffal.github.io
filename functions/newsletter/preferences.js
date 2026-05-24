const { onRequest } = require("firebase-functions/v2/https");
const crypto = require("crypto");
const admin = require("firebase-admin");
const { maskEmail } = require("./utils");

const VALID_SEGMENTS = ["main_website", "sproochentest_prep", "testing"];

/**
 * newsletterPreferences Cloud Function
 * GET/POST handler for managing subscriber newsletter preferences.
 *
 * GET: Accept `token` query param, hash it, look up subscriber by unsubscribeTokenHash,
 *      return masked email and current segments.
 *
 * POST: Accept `token` and `segments` array in body, update subscriber segments.
 *       If empty segments → set status "unsubscribed" + unsubscribedAt.
 *       If non-empty → keep status "active".
 *       Supports RFC 8058 one-click unsubscribe: POST with empty body unsubscribes from all.
 *
 * Invalid token: return 404 with generic error, no data leak.
 */
const newsletterPreferences = onRequest(
  { region: "europe-west1", cors: true },
  async (req, res) => {
    if (req.method === "GET") {
      await handleGet(req, res);
    } else if (req.method === "POST") {
      await handlePost(req, res);
    } else {
      res.status(405).json({ error: "Method not allowed" });
    }
  }
);

/**
 * GET handler: look up subscriber by token hash, return masked email and segments.
 */
async function handleGet(req, res) {
  const token = req.query.token;

  if (!token || typeof token !== "string") {
    res.status(404).json({ error: "not_found" });
    return;
  }

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const db = admin.firestore();

  try {
    const snapshot = await db
      .collection("subscribers")
      .where("unsubscribeTokenHash", "==", tokenHash)
      .limit(1)
      .get();

    if (snapshot.empty) {
      res.status(404).json({ error: "not_found" });
      return;
    }

    const subscriber = snapshot.docs[0].data();
    res.status(200).json({
      email: maskEmail(subscriber.email),
      segments: subscriber.segments || [],
      name: subscriber.name || "",
    });
  } catch (err) {
    console.error("Preferences GET error:", err);
    res.status(500).json({ error: "Internal error" });
  }
}

/**
 * POST handler: update subscriber segments based on token.
 * Supports RFC 8058 one-click unsubscribe (empty body = unsubscribe from all).
 */
async function handlePost(req, res) {
  const body = req.body || {};
  const token = body.token || req.query.token;

  if (!token || typeof token !== "string") {
    res.status(404).json({ error: "not_found" });
    return;
  }

  // RFC 8058 one-click unsubscribe: if body is empty or has no segments field,
  // treat as "unsubscribe from all"
  let segments;
  if (!body.segments || !Array.isArray(body.segments)) {
    segments = [];
  } else {
    // Filter to only valid segments
    segments = body.segments.filter((s) => VALID_SEGMENTS.includes(s));
  }

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const db = admin.firestore();

  try {
    const snapshot = await db
      .collection("subscribers")
      .where("unsubscribeTokenHash", "==", tokenHash)
      .limit(1)
      .get();

    if (snapshot.empty) {
      res.status(404).json({ error: "not_found" });
      return;
    }

    const subscriberDoc = snapshot.docs[0];
    const updateData = {
      segments: segments,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (body.name !== undefined) {
      updateData.name = body.name.trim();
    }

    if (segments.length === 0) {
      // Unsubscribe from all
      updateData.status = "unsubscribed";
      updateData.unsubscribedAt = admin.firestore.FieldValue.serverTimestamp();
    } else {
      // Keep active with selected segments
      updateData.status = "active";
    }

    await subscriberDoc.ref.update(updateData);

    res.status(200).json({
      result: "success",
      status: updateData.status,
    });
  } catch (err) {
    console.error("Preferences POST error:", err);
    res.status(500).json({ error: "Internal error" });
  }
}

module.exports = { newsletterPreferences };
