const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");
const { Resend } = require("resend");
const { validateEmail, normalizeEmail, generateUnsubscribeToken, detectBot } = require("./utils");

const { buildMainWebsiteWelcome, buildSproochentestWelcome } = require("../email/welcome");

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

  const htmlBody = isSproochentest
    ? buildSproochentestWelcome(unsubscribeUrl)
    : buildMainWebsiteWelcome(unsubscribeUrl);

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
    const { email, utm_source, name, page_url } = body;

    // Bot prevention: honeypot + role-based prefix check
    const botCheck = detectBot(body);
    if (botCheck.isBot) {
      // Return fake success to not tip off the bot
      res.status(200).json({ result: "success" });
      return;
    }

    // Validate email format
    if (!validateEmail(email)) {
      res.status(400).json({ error: "Invalid email" });
      return;
    }

    const normalizedEmailAddr = normalizeEmail(email);

    // Block disposable/temporary email domains
    const blockedDomains = ["maildrop.cc"];
    const emailDomain = normalizedEmailAddr.split("@")[1] || "";
    if (blockedDomains.includes(emailDomain.toLowerCase())) {
      res.status(400).json({ error: "Please use a different email address." });
      return;
    }

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
            : ["main_website"];
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
          : ["main_website"];
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
        : ["main_website"];

      const subscriberData = {
        email: normalizedEmailAddr,
        name: (name && typeof name === "string") ? name.trim() : "",
        status: "active",
        segments: segments,
        utmSource: utmSource,
        pageUrl: page_url || "",
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
