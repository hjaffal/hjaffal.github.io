const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const { decodeTrackingToken } = require("./utils");

// Smallest valid 1x1 transparent PNG (67 bytes)
const TRANSPARENT_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQI12NgAAIABQAB" +
    "Nl7pcQAAAABJRU5ErkJggg==",
  "base64"
);

/**
 * trackOpen Cloud Function
 * GET handler: decodes a base64url tracking token, records an open event
 * in Firestore (deduplicated by compound doc ID), and returns a 1x1 transparent PNG.
 *
 * - Always returns a valid PNG regardless of token validity
 * - Uses compound doc ID `{subscriberId}_{editionId}_open` for deduplication
 * - Invalid token: returns PNG without recording event
 */
const trackOpen = onRequest(
  { region: "europe-west1", cors: true },
  async (req, res) => {
    // Set response headers for the tracking pixel
    res.set("Content-Type", "image/png");
    res.set("Cache-Control", "no-store, no-cache, must-revalidate");

    const token = req.query.t;
    if (!token) {
      res.status(200).send(TRANSPARENT_PNG);
      return;
    }

    const decoded = decodeTrackingToken(token);
    if (!decoded) {
      res.status(200).send(TRANSPARENT_PNG);
      return;
    }

    const { subscriberId, editionId } = decoded;

    try {
      const db = admin.firestore();
      const docId = `${subscriberId}_${editionId}_open`;

      await db.collection("events").doc(docId).set(
        {
          type: "open",
          subscriberId,
          editionId,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          unique: true,
        },
        { merge: true }
      );

      // Update subscriber's lastOpenedAt for engagement tracking
      const subscriberSnapshot = await db.collection("subscribers")
        .where(admin.firestore.FieldPath.documentId(), "==", subscriberId)
        .limit(1)
        .get();

      if (!subscriberSnapshot.empty) {
        await subscriberSnapshot.docs[0].ref.update({
          lastOpenedAt: admin.firestore.FieldValue.serverTimestamp(),
          lastOpenedEdition: editionId,
          openCount: admin.firestore.FieldValue.increment(1),
        });
      }
    } catch (err) {
      // Log error but still return the PNG
      console.error("Failed to record open event:", err);
    }

    res.status(200).send(TRANSPARENT_PNG);
  }
);

/**
 * trackClick Cloud Function
 * GET handler: decodes a tracking token and base64url-encoded destination URL,
 * records a click event in Firestore, and returns a 302 redirect.
 *
 * - Click events use auto-generated doc IDs (not deduplicated)
 * - Invalid token: redirects to https://hasanjaffal.com without recording
 */
const trackClick = onRequest(
  { region: "europe-west1", cors: true },
  async (req, res) => {
    const FALLBACK_URL = "https://hasanjaffal.com";

    const token = req.query.t;
    const encodedUrl = req.query.url;

    // Decode the destination URL
    let destinationUrl = FALLBACK_URL;
    if (encodedUrl) {
      try {
        destinationUrl = Buffer.from(encodedUrl, "base64url").toString("utf8");
      } catch {
        destinationUrl = FALLBACK_URL;
      }
    }

    // If no token or invalid token, redirect without recording
    if (!token) {
      res.redirect(302, destinationUrl || FALLBACK_URL);
      return;
    }

    const decoded = decodeTrackingToken(token);
    if (!decoded) {
      res.redirect(302, FALLBACK_URL);
      return;
    }

    const { subscriberId, editionId } = decoded;

    try {
      const db = admin.firestore();

      await db.collection("events").add({
        type: "click",
        subscriberId,
        editionId,
        url: destinationUrl,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Update subscriber's engagement timestamp
      const subscriberSnapshot = await db.collection("subscribers")
        .where(admin.firestore.FieldPath.documentId(), "==", subscriberId)
        .limit(1)
        .get();

      if (!subscriberSnapshot.empty) {
        await subscriberSnapshot.docs[0].ref.update({
          lastClickedAt: admin.firestore.FieldValue.serverTimestamp(),
          lastOpenedAt: admin.firestore.FieldValue.serverTimestamp(),
          lastOpenedEdition: editionId,
          clickCount: admin.firestore.FieldValue.increment(1),
        });
      }
    } catch (err) {
      // Log error but still redirect
      console.error("Failed to record click event:", err);
    }

    res.redirect(302, destinationUrl);
  }
);

module.exports = { trackOpen, trackClick };
