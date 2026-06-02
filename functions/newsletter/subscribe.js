const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");
const { Resend } = require("resend");
const { validateEmail, normalizeEmail, generateUnsubscribeToken, detectBot } = require("./utils");

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
 * Build the welcome email for the main website (The Second Mind) segment.
 */
function buildMainWebsiteWelcome(unsubscribeUrl) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Welcome to The Second Mind</title></head>
<body style="margin:0;padding:0;background:#F4F7FB;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<div style="background:#F4F7FB;padding:0;margin:0;">
<table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#F4F7FB;">
<tr><td align="center" style="padding:24px 16px;">
<table cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;width:100%;background:#FFFFFF;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(15,23,42,0.06);">

<!-- Header -->
<tr><td style="background:#0F172A;padding:28px 32px;border-bottom:3px solid #9333EA;">
  <p style="margin:0 0 4px;font-size:11px;font-weight:600;letter-spacing:0.15em;text-transform:uppercase;color:#9333EA;">HASAN JAFFAL</p>
  <p style="margin:0;font-size:22px;font-weight:800;color:#F8FAFC;letter-spacing:0.02em;">THE SECOND MIND</p>
</td></tr>

<!-- Welcome -->
<tr><td style="padding:32px 32px 24px;">
  <p style="margin:0 0 16px;font-size:18px;font-weight:700;color:#0F172A;">Welcome — you're in.</p>
  <p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.7;">I write about where AI, dashboards, data signals, and leadership fail in real operations. Sharp, practical, no filler. Expect writing every week.</p>
</td></tr>

<!-- Positions -->
<tr><td style="padding:0 32px 24px;">
  <p style="margin:0 0 12px;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#64748B;">WHAT I WRITE ABOUT</p>
  <table cellpadding="0" cellspacing="0" border="0" width="100%">
    <tr><td style="padding:0 0 10px;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;">
        <tr><td style="padding:14px 18px;">
          <p style="margin:0 0 4px;font-size:14px;font-weight:700;color:#0F172A;">AI & Decision Operations</p>
          <p style="margin:0;font-size:13px;color:#475569;line-height:1.5;">AI exposes weak operations and slow decisions. Signals need authority to become action.</p>
        </td></tr>
      </table>
    </td></tr>
    <tr><td style="padding:0 0 10px;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;">
        <tr><td style="padding:14px 18px;">
          <p style="margin:0 0 4px;font-size:14px;font-weight:700;color:#0F172A;">Risk Intelligence</p>
          <p style="margin:0;font-size:13px;color:#475569;line-height:1.5;">Reporting explains what happened. Intelligence changes what happens next.</p>
        </td></tr>
      </table>
    </td></tr>
    <tr><td style="padding:0 0 10px;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;">
        <tr><td style="padding:14px 18px;">
          <p style="margin:0 0 4px;font-size:14px;font-weight:700;color:#0F172A;">AI Job Risk</p>
          <p style="margin:0;font-size:13px;color:#475569;line-height:1.5;">AI exposes people who only operate tools. The safer skillset is judgment.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</td></tr>

<!-- Tool CTA -->
<tr><td style="padding:0 32px 32px;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#FAF5FF;border:2px solid #9333EA;border-radius:10px;">
    <tr><td style="padding:24px 24px;">
      <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#9333EA;">FREE TOOL</p>
      <p style="margin:0 0 8px;font-size:16px;font-weight:700;color:#0F172A;">AI Job Risk Analyzer</p>
      <p style="margin:0 0 16px;font-size:14px;color:#475569;line-height:1.6;">Get a personalized AI risk report for your role. See which tasks are exposed, identify skill gaps, and get a 30-day action plan.</p>
      <a href="https://hasanjaffal.com/ai-job-risk-analyzer/" style="display:inline-block;padding:12px 24px;background:#9333EA;color:#ffffff;font-size:14px;font-weight:700;border-radius:6px;text-decoration:none;">Analyze my role →</a>
    </td></tr>
  </table>
</td></tr>

<!-- Start reading -->
<tr><td style="padding:0 32px 32px;text-align:center;">
  <a href="https://hasanjaffal.com/writing/" style="font-size:14px;font-weight:600;color:#9333EA;text-decoration:none;">Start reading →</a>
</td></tr>

<!-- Footer -->
<tr><td style="padding:28px 32px;border-top:1px solid #E2E8F0;text-align:center;background:#F8FAFC;">
  <p style="margin:0 0 12px;font-size:12px;color:#64748B;line-height:1.6;">You subscribed to The Second Mind by Hasan Jaffal.</p>
  <p style="margin:0 0 12px;font-size:12px;">
    <a href="${unsubscribeUrl}" style="color:#9333EA;font-weight:600;text-decoration:none;">Unsubscribe</a>
    <span style="color:#CBD5E1;margin:0 8px;">|</span>
    <a href="${unsubscribeUrl}" style="color:#9333EA;font-weight:600;text-decoration:none;">Manage preferences</a>
  </p>
  <p style="margin:0;font-size:11px;color:#94A3B8;">Hasan Jaffal · hasanjaffal.com · Luxembourg</p>
</td></tr>

</table>
</td></tr>
</table>
</div>
</body>
</html>`;
}

/**
 * Build the welcome email for the Sproochentest Prep segment.
 */
function buildSproochentestWelcome(unsubscribeUrl) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Welcome to Sproochentest Prep</title></head>
<body style="margin:0;padding:0;background:#F4F7FB;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<div style="background:#F4F7FB;padding:0;margin:0;">
<table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#F4F7FB;">
<tr><td align="center" style="padding:24px 16px;">
<table cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;width:100%;background:#FFFFFF;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(15,23,42,0.06);">

<!-- Header -->
<tr><td style="background:#0F172A;padding:28px 32px;border-bottom:3px solid #D97706;">
  <p style="margin:0 0 4px;font-size:11px;font-weight:600;letter-spacing:0.15em;text-transform:uppercase;color:#D97706;">HASAN JAFFAL</p>
  <p style="margin:0;font-size:22px;font-weight:800;color:#F8FAFC;letter-spacing:0.02em;">SPROOCHENTEST PREP</p>
</td></tr>

<!-- Welcome -->
<tr><td style="padding:32px 32px 24px;">
  <p style="margin:0 0 16px;font-size:18px;font-weight:700;color:#0F172A;">Wëllkomm — you're in!</p>
  <p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.7;">You'll receive updates, new topics, and practice materials to help you prepare for the Sproochentest — the Luxembourgish language and citizenship test.</p>
</td></tr>

<!-- What's on the site -->
<tr><td style="padding:0 32px 24px;">
  <p style="margin:0 0 12px;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#64748B;">WHAT YOU'LL FIND ON THE SITE</p>
  <table cellpadding="0" cellspacing="0" border="0" width="100%">
    <tr><td style="padding:0 0 10px;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;">
        <tr><td style="padding:14px 18px;">
          <p style="margin:0 0 4px;font-size:14px;font-weight:700;color:#0F172A;">🗣️ Speaking Topics</p>
          <p style="margin:0;font-size:13px;color:#475569;line-height:1.5;">Practice questions organized by topic — family, work, hobbies, Luxembourg life, and more.</p>
        </td></tr>
      </table>
    </td></tr>
    <tr><td style="padding:0 0 10px;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;">
        <tr><td style="padding:14px 18px;">
          <p style="margin:0 0 4px;font-size:14px;font-weight:700;color:#0F172A;">🖼️ Image Description</p>
          <p style="margin:0;font-size:13px;color:#475569;line-height:1.5;">Framework and vocabulary for describing images — people, places, actions, and clothes.</p>
        </td></tr>
      </table>
    </td></tr>
    <tr><td style="padding:0 0 10px;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;">
        <tr><td style="padding:14px 18px;">
          <p style="margin:0 0 4px;font-size:14px;font-weight:700;color:#0F172A;">🎧 Listening Exercises</p>
          <p style="margin:0;font-size:13px;color:#475569;line-height:1.5;">Interactive quizzes with audio to train your ear for Luxembourgish comprehension.</p>
        </td></tr>
      </table>
    </td></tr>
    <tr><td style="padding:0 0 10px;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;">
        <tr><td style="padding:14px 18px;">
          <p style="margin:0 0 4px;font-size:14px;font-weight:700;color:#0F172A;">📄 Downloadable Materials</p>
          <p style="margin:0;font-size:13px;color:#475569;line-height:1.5;">PDF guides for adjectives, articles, prepositions, and picture descriptions.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</td></tr>

<!-- CTA -->
<tr><td style="padding:0 32px 32px;text-align:center;">
  <a href="https://hasanjaffal.com/sproochentest/" style="display:inline-block;padding:14px 28px;background:#D97706;color:#ffffff;font-size:14px;font-weight:700;border-radius:6px;text-decoration:none;">Start practicing →</a>
</td></tr>

<!-- Footer -->
<tr><td style="padding:28px 32px;border-top:1px solid #E2E8F0;text-align:center;background:#F8FAFC;">
  <p style="margin:0 0 12px;font-size:12px;color:#64748B;line-height:1.6;">You subscribed to Sproochentest Prep updates by Hasan Jaffal.</p>
  <p style="margin:0 0 12px;font-size:12px;">
    <a href="${unsubscribeUrl}" style="color:#D97706;font-weight:600;text-decoration:none;">Unsubscribe</a>
    <span style="color:#CBD5E1;margin:0 8px;">|</span>
    <a href="${unsubscribeUrl}" style="color:#D97706;font-weight:600;text-decoration:none;">Manage preferences</a>
  </p>
  <p style="margin:0;font-size:11px;color:#94A3B8;">Hasan Jaffal · hasanjaffal.com · Luxembourg</p>
</td></tr>

</table>
</td></tr>
</table>
</div>
</body>
</html>`;
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
