const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");
const { Webhook } = require("svix");

const RESEND_WEBHOOK_SECRET = defineSecret("RESEND_WEBHOOK_SECRET");

/**
 * handleBounce Cloud Function
 * POST handler for processing Resend bounce/complaint webhooks.
 *
 * - Validates Svix webhook signature using RESEND_WEBHOOK_SECRET
 * - Hard bounce (email.bounced): sets subscriber status to "bounced", records reason and bouncedAt
 * - Complaint (email.complained): sets subscriber status to "complained", records complainedAt
 * - Soft bounce (email.delivery_delayed): increments softBounceCount, adds to softBounces array
 * - 3+ soft bounces in 30-day rolling window → sets status "bounced"
 * - Invalid signature: returns 401
 * - Subscriber not found: returns 200 (acknowledge webhook), logs warning
 *
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6
 */
const handleBounce = onRequest(
  { region: "europe-west1", cors: true, secrets: [RESEND_WEBHOOK_SECRET] },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    // Validate Svix webhook signature
    const secret = RESEND_WEBHOOK_SECRET.value();
    const headers = {
      "svix-id": req.headers["svix-id"],
      "svix-timestamp": req.headers["svix-timestamp"],
      "svix-signature": req.headers["svix-signature"],
    };

    let payload;
    try {
      const wh = new Webhook(secret);
      // req.rawBody is available in Firebase Cloud Functions v2 as a Buffer
      const rawBody = req.rawBody;
      payload = wh.verify(rawBody, headers);
    } catch (err) {
      console.error("Invalid webhook signature:", err.message);
      res.status(401).json({ error: "Invalid signature" });
      return;
    }

    // Extract event type and data
    const eventType = payload.type;
    const data = payload.data;

    if (!data || !data.to || !Array.isArray(data.to) || data.to.length === 0) {
      console.warn("Webhook payload missing recipient email:", JSON.stringify(payload));
      res.status(400).json({ error: "Malformed payload" });
      return;
    }

    const recipientEmail = data.to[0].toLowerCase().trim();

    // Look up subscriber by email
    const db = admin.firestore();
    const subscribersRef = db.collection("subscribers");
    const snapshot = await subscribersRef
      .where("email", "==", recipientEmail)
      .limit(1)
      .get();

    if (snapshot.empty) {
      console.warn(`Bounce webhook received for unknown subscriber: ${recipientEmail}`);
      res.status(200).json({ result: "acknowledged" });
      return;
    }

    const subscriberDoc = snapshot.docs[0];
    const subscriberRef = subscriberDoc.ref;

    try {
      if (eventType === "email.bounced") {
        // Hard bounce: set status to "bounced", record reason and timestamp
        await subscriberRef.update({
          status: "bounced",
          bounceReason: data.reason || "Hard bounce",
          bouncedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      } else if (eventType === "email.complained") {
        // Complaint: set status to "complained", record timestamp
        await subscriberRef.update({
          status: "complained",
          complainedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      } else if (eventType === "email.delivery_delayed") {
        // Soft bounce: increment counter, add to softBounces array
        const subscriberData = subscriberDoc.data();
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        // Get existing soft bounces and filter to 30-day window
        const existingSoftBounces = (subscriberData.softBounces || []).filter((entry) => {
          const entryTimestamp = entry.timestamp;
          // Handle Firestore Timestamp objects and plain Date/string
          const entryDate = entryTimestamp && entryTimestamp.toDate
            ? entryTimestamp.toDate()
            : new Date(entryTimestamp);
          return entryDate >= thirtyDaysAgo;
        });

        // Add the new soft bounce
        const newSoftBounce = {
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          reason: data.reason || "Delivery delayed",
        };

        const updatedSoftBounces = [...existingSoftBounces, newSoftBounce];
        const newSoftBounceCount = updatedSoftBounces.length;

        const updateData = {
          softBounceCount: newSoftBounceCount,
          softBounces: updatedSoftBounces,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        // 3+ soft bounces in 30-day rolling window → set status "bounced"
        if (newSoftBounceCount >= 3) {
          updateData.status = "bounced";
          updateData.bounceReason = "Too many soft bounces (3+ in 30 days)";
          updateData.bouncedAt = admin.firestore.FieldValue.serverTimestamp();
        }

        await subscriberRef.update(updateData);
      } else {
        // Unknown event type - acknowledge but don't process
        console.warn(`Unknown webhook event type: ${eventType}`);
      }

      res.status(200).json({ result: "processed" });
    } catch (err) {
      console.error("Error processing bounce webhook:", err);
      res.status(500).json({ error: "Processing failed" });
    }
  }
);

module.exports = { handleBounce };
