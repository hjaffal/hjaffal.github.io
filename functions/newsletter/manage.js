const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const { verifyAdminToken } = require("./auth");
const { validateEmail, normalizeEmail, generateUnsubscribeToken } = require("./utils");

/**
 * manageSubscribers Cloud Function
 * GET/POST handler for admin subscriber management.
 *
 * - GET action=list: return subscribers filtered by optional status, sorted by subscribedAt descending
 * - POST action=add: create subscriber with status "active", both segments, utm_source "admin_added"
 * - POST action=deactivate: set status to "unsubscribed", record timestamp
 * - POST action=delete: permanently remove subscriber doc and all associated events
 *
 * All actions require Firebase ID token verification.
 *
 * Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7, 10.4, 11.3
 */
const manageSubscribers = onRequest(
  { region: "europe-west1", cors: true },
  async (req, res) => {
    // Verify admin authentication
    try {
      await verifyAdminToken(req);
    } catch (err) {
      res.status(err.statusCode || 401).json({ error: err.message || "Unauthorized" });
      return;
    }

    // Action comes from query string or body
    let action;
    if (req.method === "GET") {
      action = req.query.action;
    } else if (req.method === "POST") {
      const body = req.body.data || req.body;
      action = req.query.action || body.action;
    }

    if (req.method === "GET" && action === "list") {
      await handleList(req, res);
    } else if (req.method === "POST" && action === "add") {
      await handleAdd(req, res);
    } else if (req.method === "POST" && action === "deactivate") {
      await handleDeactivate(req, res);
    } else if (req.method === "POST" && action === "delete") {
      await handleDelete(req, res);
    } else if (req.method === "POST" && action === "update") {
      await handleUpdate(req, res);
    } else {
      res.status(400).json({ error: "Invalid action or method" });
    }
  }
);

/**
 * Lists subscribers filtered by optional status, sorted by subscribedAt descending.
 * Query params: status (optional) - "active", "unsubscribed", "bounced", "complained"
 */
async function handleList(req, res) {
  const db = admin.firestore();
  const statusFilter = req.query.status;

  try {
    let query = db.collection("subscribers").orderBy("subscribedAt", "desc");

    if (statusFilter) {
      query = db
        .collection("subscribers")
        .where("status", "==", statusFilter)
        .orderBy("subscribedAt", "desc");
    }

    const snapshot = await query.get();

    const subscribers = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        email: data.email,
        name: data.name || "",
        status: data.status,
        segments: data.segments || [],
        utmSource: data.utmSource || "",
        pageUrl: data.pageUrl || "",
        subscribedAt: data.subscribedAt ? data.subscribedAt.toDate().toISOString() : null,
      };
    });

    res.status(200).json({
      subscribers,
      total: subscribers.length,
    });
  } catch (err) {
    console.error("Error listing subscribers:", err);
    res.status(500).json({ error: "Failed to list subscribers" });
  }
}

/**
 * Adds a new subscriber with status "active", both segments, utm_source "admin_added".
 * Returns 409 if email already exists.
 * Body: { "email": "new@example.com" }
 */
async function handleAdd(req, res) {
  const db = admin.firestore();
  const body = req.body.data || req.body;
  const { email, name } = body;

  // Validate email
  if (!validateEmail(email)) {
    res.status(400).json({ error: "Invalid email" });
    return;
  }

  const normalizedEmailAddr = normalizeEmail(email);

  try {
    // Check if subscriber already exists
    const existingSnapshot = await db
      .collection("subscribers")
      .where("email", "==", normalizedEmailAddr)
      .limit(1)
      .get();

    if (!existingSnapshot.empty) {
      res.status(409).json({ error: "Subscriber already exists" });
      return;
    }

    // Generate unsubscribe token
    const { token, hash } = generateUnsubscribeToken();

    const subscriberData = {
      email: normalizedEmailAddr,
      name: (name && typeof name === "string") ? name.trim() : "",
      status: "active",
      segments: ["main_website"],
      utmSource: "admin_added",
      unsubscribeToken: token,
      unsubscribeTokenHash: hash,
      subscribedAt: admin.firestore.FieldValue.serverTimestamp(),
      reactivatedAt: null,
      unsubscribedAt: null,
      welcomeEmailFailed: false,
      softBounceCount: 0,
      softBounces: [],
      bounceReason: null,
      bouncedAt: null,
      complainedAt: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const newDocRef = await db.collection("subscribers").add(subscriberData);

    res.status(200).json({ result: "success", id: newDocRef.id });
  } catch (err) {
    console.error("Error adding subscriber:", err);
    res.status(500).json({ error: "Failed to add subscriber" });
  }
}

/**
 * Deactivates a subscriber by setting status to "unsubscribed" and recording timestamp.
 * No notification is sent.
 * Body: { "id": "doc_id" }
 */
async function handleDeactivate(req, res) {
  const db = admin.firestore();
  const body = req.body.data || req.body;
  const { id } = body;

  if (!id) {
    res.status(400).json({ error: "Subscriber id is required" });
    return;
  }

  try {
    const subscriberRef = db.collection("subscribers").doc(id);
    const subscriberDoc = await subscriberRef.get();

    if (!subscriberDoc.exists) {
      res.status(404).json({ error: "Subscriber not found" });
      return;
    }

    await subscriberRef.update({
      status: "unsubscribed",
      unsubscribedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(200).json({ result: "success" });
  } catch (err) {
    console.error("Error deactivating subscriber:", err);
    res.status(500).json({ error: "Failed to deactivate subscriber" });
  }
}

/**
 * Permanently removes a subscriber doc and all associated events from Firestore.
 * Body: { "id": "doc_id" }
 */
async function handleDelete(req, res) {
  const db = admin.firestore();
  const body = req.body.data || req.body;
  const { id } = body;

  if (!id) {
    res.status(400).json({ error: "Subscriber id is required" });
    return;
  }

  try {
    const subscriberRef = db.collection("subscribers").doc(id);
    const subscriberDoc = await subscriberRef.get();

    if (!subscriberDoc.exists) {
      res.status(404).json({ error: "Subscriber not found" });
      return;
    }

    // Delete all associated events where subscriberId matches
    const eventsSnapshot = await db
      .collection("events")
      .where("subscriberId", "==", id)
      .get();

    // Use batched writes for efficient deletion
    const batch = db.batch();

    eventsSnapshot.docs.forEach((eventDoc) => {
      batch.delete(eventDoc.ref);
    });

    // Delete the subscriber document
    batch.delete(subscriberRef);

    await batch.commit();

    res.status(200).json({ result: "success" });
  } catch (err) {
    console.error("Error deleting subscriber:", err);
    res.status(500).json({ error: "Failed to delete subscriber" });
  }
}

/**
 * Updates a subscriber's name and/or segments.
 * Body: { "id": "doc_id", "name": "New Name", "segments": ["main_website"] }
 */
async function handleUpdate(req, res) {
  const db = admin.firestore();
  const body = req.body.data || req.body;
  const { id, name, segments } = body;

  if (!id) {
    res.status(400).json({ error: "Subscriber id is required" });
    return;
  }

  try {
    const subscriberRef = db.collection("subscribers").doc(id);
    const subscriberDoc = await subscriberRef.get();

    if (!subscriberDoc.exists) {
      res.status(404).json({ error: "Subscriber not found" });
      return;
    }

    const updateData = { updatedAt: admin.firestore.FieldValue.serverTimestamp() };
    if (name !== undefined) updateData.name = name.trim();
    if (segments !== undefined && Array.isArray(segments)) {
      const validSegments = segments.filter(s => ["main_website", "sproochentest_prep", "testing"].includes(s));
      updateData.segments = validSegments;
    }

    await subscriberRef.update(updateData);
    res.status(200).json({ result: "success" });
  } catch (err) {
    console.error("Error updating subscriber:", err);
    res.status(500).json({ error: "Failed to update subscriber" });
  }
}

module.exports = { manageSubscribers };
