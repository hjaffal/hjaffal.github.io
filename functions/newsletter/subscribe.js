const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");
const { Resend } = require("resend");
const { validateEmail, normalizeEmail, generateUnsubscribeToken } = require("./utils");

const RESEND_API_KEY = defineSecret("RESEND_API_KEY");

/**
 * Sends a welcome email to a new or reactivated subscriber.
 * On failure, logs the error and sets welcomeEmailFailed flag on the subscriber doc.
 *
 * @param {string} email - The subscriber's email address
 * @param {string} rawToken - The raw unsubscribe token (not the hash)
 * @param {string} apiKey - The Resend API key value
 * @param {FirebaseFirestore.DocumentReference|null} subscriberRef - Reference to subscriber doc for failure flagging
 * @param {string} segment - The segment context ("sproochentest" or default)
 */
async function sendWelcomeEmail(email, rawToken, apiKey, subscriberRef, segment) {
  const unsubscribeUrl = `https://hasanjaffal.com/newsletter/preferences/?token=${rawToken}`;

  const isSproochentest = segment === "sproochentest";

  const subject = isSproochentest
    ? "Welcome to Sproochentest Prep"
    : "Welcome to The Second Mind";

  const heading = isSproochentest
    ? "SPROOCHENTEST PREP"
    : "THE SECOND MIND";

  const byline = "by Hasan Jaffal";

  const bodyContent = isSproochentest
    ? `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#374151;">Welcome — you're in.</p>
        <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#374151;">You'll receive updates, new topics, and practice materials to help you prepare for the <strong>Sproochentest</strong> — the Luxembourgish language test.</p>
        <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#374151;">Expect new listening exercises, vocabulary lists, grammar tips, and exam strategies as I add them.</p>
        <p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#374151;">Vill Gléck!<br>Hasan</p>`
    : `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#374151;">Welcome — you're in.</p>
        <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#374151;">The Second Mind is where I share sharp, practical thinking on <strong>AI, risk, operations, and decision-making</strong> — the stuff that actually moves the needle when systems get complex.</p>
        <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#374151;">Expect weekly writing. No filler, no fluff — just ideas you can use.</p>
        <p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#374151;">Talk soon,<br>Hasan</p>`;

  const footerText = isSproochentest
    ? "You're receiving this because you subscribed to Sproochentest Prep updates."
    : "You're receiving this because you subscribed to The Second Mind.";

  const htmlBody = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background-color:#f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <tr>
      <td style="background-color:#ffffff;border-radius:8px;padding:40px;">
        <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#111827;">${heading}</h1>
        <p style="margin:0 0 24px;font-size:14px;color:#6b7280;">${byline}</p>

        ${bodyContent}

        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">

        <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
          ${footerText}<br>
          <a href="${unsubscribeUrl}" style="color:#6b7280;text-decoration:underline;">Manage preferences or unsubscribe</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;

  try {
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from: "Hasan Jaffal <hasan@hasanjaffal.com>",
      to: email,
      subject: subject,
      html: htmlBody,
      headers: {
        "List-Unsubscribe": `<${unsubscribeUrl}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    });
  } catch (err) {
    console.error(`Welcome email failed for ${email}:`, err);
    if (subscriberRef) {
      try {
        await subscriberRef.update({ welcomeEmailFailed: true });
      } catch (updateErr) {
        console.error(`Failed to set welcomeEmailFailed flag for ${email}:`, updateErr);
      }
    }
  }
}

/**
 * subscribeNewsletter Cloud Function
 * POST handler for subscribing to the newsletter.
 * Replaces the existing Beehiiv-based subscribe function.
 *
 * - Validates and normalizes email
 * - Checks for existing subscriber in Firestore
 * - If new: creates subscriber doc with status "active", both segments, unsubscribe token hash
 * - If active: returns success (idempotent)
 * - If unsubscribed: reactivates (sets status "active", records reactivatedAt)
 * - Sends welcome email on new creation or reactivation (implemented in task 2.2)
 */
const subscribeNewsletter = onRequest(
  { region: "europe-west1", cors: true, secrets: [RESEND_API_KEY] },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    const body = req.body.data || req.body;
    const { email, utm_source, name } = body;

    // Validate email format
    if (!validateEmail(email)) {
      res.status(400).json({ error: "Invalid email" });
      return;
    }

    const normalizedEmailAddr = normalizeEmail(email);
    const utmSource = utm_source || "website";

    // Determine if this is a sproochentest-related subscription
    const isSproochentest = utmSource === "sproochentest" ||
      utmSource === "sproochentest_gate" ||
      utmSource === "materials_download";

    const db = admin.firestore();

    try {
      // Check if subscriber already exists
      const subscribersRef = db.collection("subscribers");
      const existingSnapshot = await subscribersRef
        .where("email", "==", normalizedEmailAddr)
        .limit(1)
        .get();

      if (!existingSnapshot.empty) {
        const existingDoc = existingSnapshot.docs[0];
        const existingData = existingDoc.data();

        if (existingData.status === "active") {
          // Idempotent: already active, return success without modification
          res.status(200).json({ result: "success" });
          return;
        }

        if (existingData.status === "unsubscribed") {
          // Reactivate: set status back to "active", generate new token, record reactivatedAt
          const { token: reactivationToken, hash: reactivationHash } = generateUnsubscribeToken();
          const reactivationSegments = isSproochentest
            ? ["sproochentest_prep"]
            : ["main_website", "sproochentest_prep"];
          await existingDoc.ref.update({
            status: "active",
            segments: reactivationSegments,
            unsubscribeToken: reactivationToken,
            unsubscribeTokenHash: reactivationHash,
            reactivatedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });

          // Send welcome email on reactivation
          await sendWelcomeEmail(normalizedEmailAddr, reactivationToken, RESEND_API_KEY.value(), existingDoc.ref, isSproochentest ? "sproochentest" : utmSource);

          res.status(200).json({ result: "success" });
          return;
        }

        // For other statuses (bounced, complained), still reactivate
        const { token: reactivationToken2, hash: reactivationHash2 } = generateUnsubscribeToken();
        const reactivationSegments2 = isSproochentest
          ? ["sproochentest_prep"]
          : ["main_website", "sproochentest_prep"];
        await existingDoc.ref.update({
          status: "active",
          segments: reactivationSegments2,
          unsubscribeToken: reactivationToken2,
          unsubscribeTokenHash: reactivationHash2,
          reactivatedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Send welcome email on reactivation
        await sendWelcomeEmail(normalizedEmailAddr, reactivationToken2, RESEND_API_KEY.value(), existingDoc.ref, isSproochentest ? "sproochentest" : utmSource);

        res.status(200).json({ result: "success" });
        return;
      }

      // New subscriber: generate unsubscribe token and create record
      const { token, hash } = generateUnsubscribeToken();

      // Determine segments based on source
      const segments = isSproochentest
        ? ["sproochentest_prep"]
        : ["main_website", "sproochentest_prep"];

      const subscriberData = {
        email: normalizedEmailAddr,
        name: (name && typeof name === "string") ? name.trim() : "",
        status: "active",
        segments: segments,
        utmSource: utmSource,
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

      const newDocRef = await subscribersRef.add(subscriberData);

      // Send welcome email to new subscriber
      await sendWelcomeEmail(normalizedEmailAddr, token, RESEND_API_KEY.value(), newDocRef, isSproochentest ? "sproochentest" : utmSource);

      res.status(200).json({ result: "success" });
    } catch (err) {
      console.error("Subscribe error:", err);
      res.status(500).json({ error: "Subscription failed" });
    }
  }
);

module.exports = { subscribeNewsletter, sendWelcomeEmail };
