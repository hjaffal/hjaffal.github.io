const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const { verifyAdminToken } = require("./auth");
const { validateEmail, normalizeEmail, generateUnsubscribeToken } = require("./utils");

/**
 * importSubscribers Cloud Function
 * POST handler for bulk importing subscribers (e.g., from Beehiiv export).
 *
 * Request body:
 * {
 *   "subscribers": [
 *     { "email": "user@example.com", "status": "active", "subscribedAt": "2024-01-15T10:00:00Z" },
 *     ...
 *   ]
 * }
 *
 * Response:
 * { "imported": 120, "skipped": 5, "rejected": 2 }
 *
 * Logic:
 * 1. Verify admin auth
 * 2. Validate request body has a subscribers array
 * 3. For each subscriber record:
 *    - Validate email format → if invalid, increment rejected
 *    - Normalize email
 *    - Check if email already exists in Firestore → if exists, increment skipped
 *    - If new: create subscriber doc, increment imported
 * 4. Return summary
 *
 * Uses batched Firestore writes (up to 500 docs per batch) for efficiency.
 *
 * Requirements: 12.1, 12.2, 12.3, 12.4, 11.1
 */
const importSubscribers = onRequest(
  { region: "europe-west1", cors: true },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    // Verify admin authentication
    try {
      await verifyAdminToken(req);
    } catch (err) {
      res.status(err.statusCode || 401).json({ error: err.message || "Unauthorized" });
      return;
    }

    const body = req.body.data || req.body;
    const { subscribers } = body;

    // Validate request body
    if (!subscribers || !Array.isArray(subscribers)) {
      res.status(400).json({ error: "Request body must contain a 'subscribers' array" });
      return;
    }

    const db = admin.firestore();
    let imported = 0;
    let skipped = 0;
    let rejected = 0;

    // Process subscribers in chunks for batched writes (max 500 per batch)
    const BATCH_SIZE = 500;
    const toImport = [];

    // Phase 1: Validate and check for duplicates
    for (const record of subscribers) {
      const email = record.email;

      // Validate email format
      if (!validateEmail(email)) {
        rejected++;
        continue;
      }

      const normalizedEmailAddr = normalizeEmail(email);

      // Check if email already exists in Firestore
      const existingSnapshot = await db
        .collection("subscribers")
        .where("email", "==", normalizedEmailAddr)
        .limit(1)
        .get();

      if (!existingSnapshot.empty) {
        skipped++;
        continue;
      }

      // Prepare subscriber data for import
      const { token, hash } = generateUnsubscribeToken();

      // Parse subscribedAt or use server timestamp
      let subscribedAt;
      if (record.subscribedAt) {
        const parsedDate = new Date(record.subscribedAt);
        if (!isNaN(parsedDate.getTime())) {
          subscribedAt = admin.firestore.Timestamp.fromDate(parsedDate);
        } else {
          subscribedAt = admin.firestore.FieldValue.serverTimestamp();
        }
      } else {
        subscribedAt = admin.firestore.FieldValue.serverTimestamp();
      }

      toImport.push({
        email: normalizedEmailAddr,
        status: record.status || "active",
        segments: ["main_website"],
        utmSource: "beehiiv",
        unsubscribeToken: token,
        unsubscribeTokenHash: hash,
        subscribedAt,
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
      });
    }

    // Phase 2: Batch write all valid new subscribers
    try {
      for (let i = 0; i < toImport.length; i += BATCH_SIZE) {
        const chunk = toImport.slice(i, i + BATCH_SIZE);
        const batch = db.batch();

        for (const subscriberData of chunk) {
          const newDocRef = db.collection("subscribers").doc();
          batch.set(newDocRef, subscriberData);
        }

        await batch.commit();
        imported += chunk.length;
      }
    } catch (err) {
      console.error("Error during batch import:", err);
      res.status(500).json({
        error: "Import partially failed",
        imported,
        skipped,
        rejected,
      });
      return;
    }

    res.status(200).json({ imported, skipped, rejected });
  }
);

module.exports = { importSubscribers };
