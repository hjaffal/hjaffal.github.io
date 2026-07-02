const { onSchedule } = require("firebase-functions/v2/scheduler");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");
const { Resend } = require("resend");

const RESEND_API_KEY = defineSecret("RESEND_API_KEY");

/**
 * Weekly re-engagement email for inactive vocab learners.
 * Runs every Monday at 9:00 CET (8:00 UTC).
 * Targets users whose lastUpdated in vocab_progress is older than 5 days.
 */
exports.weeklyVocabReengagement = onSchedule(
  {
    schedule: "every monday 08:00",
    timeZone: "Europe/Luxembourg",
    secrets: [RESEND_API_KEY],
  },
  async (event) => {
    const db = admin.firestore();
    const auth = admin.auth();

    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

    // Get inactive vocab users
    const snapshot = await db
      .collection("vocab_progress")
      .where("lastUpdated", "<", fiveDaysAgo)
      .get();

    if (snapshot.empty) {
      console.log("No inactive users found.");
      return;
    }

    // Get unsubscribed emails to exclude
    const unsubSnapshot = await db
      .collection("subscribers")
      .where("status", "==", "unsubscribed")
      .get();

    const unsubscribedEmails = new Set();
    unsubSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.email) unsubscribedEmails.add(data.email.toLowerCase());
    });

    const resend = new Resend(RESEND_API_KEY.value());
    let sentCount = 0;
    let skippedCount = 0;

    for (const doc of snapshot.docs) {
      const uid = doc.id;
      const data = doc.data();
      const displayName = data.displayName || "Learner";
      const totalXp = (data.stats && data.stats.totalXp) || 0;
      const wordsLearned = data.words ? Object.keys(data.words).length : 0;

      // Get user email from Firebase Auth
      let userEmail;
      try {
        const userRecord = await auth.getUser(uid);
        userEmail = userRecord.email;
      } catch (err) {
        console.warn(`Could not get auth record for ${uid}:`, err.message);
        continue;
      }

      if (!userEmail) continue;
      if (unsubscribedEmails.has(userEmail.toLowerCase())) {
        skippedCount++;
        continue;
      }

      // Build and send email
      const html = buildReengagementEmail(displayName, totalXp, wordsLearned);

      try {
        await resend.emails.send({
          from: "Sproochentest Prep <hasan@hasanjaffal.com>",
          to: userEmail,
          subject: "Your words are waiting for you 📚",
          html: html,
        });
        sentCount++;
      } catch (err) {
        console.error(`Failed to send to ${userEmail}:`, err.message);
      }

      // Small delay to avoid rate limits
      await new Promise((r) => setTimeout(r, 200));
    }

    console.log(
      `Re-engagement complete: ${sentCount} sent, ${skippedCount} skipped (unsubscribed), ${snapshot.size} total inactive.`
    );
  }
);

function buildReengagementEmail(name, xp, wordsLearned) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:520px;margin:0 auto;padding:40px 24px;">
    <div style="background:#ffffff;border-radius:12px;padding:36px 32px;border:1px solid #e2e8f0;">
      
      <p style="font-size:15px;color:#0f172a;margin:0 0 16px;">Hi ${name},</p>
      
      <p style="font-size:15px;color:#334155;line-height:1.6;margin:0 0 16px;">
        It's been a few days since your last vocab session. Your progress is still saved — pick up where you left off:
      </p>

      <div style="background:#f1f5f9;border-radius:8px;padding:16px 20px;margin:0 0 20px;">
        <p style="margin:0;font-size:14px;color:#64748b;">
          <strong style="color:#0f172a;">${xp} XP</strong> earned · <strong style="color:#0f172a;">${wordsLearned} words</strong> learned
        </p>
      </div>

      <p style="font-size:15px;color:#334155;line-height:1.6;margin:0 0 24px;">
        5 minutes a day is enough to keep moving forward. Jump back in and learn 10 new words:
      </p>

      <div style="text-align:center;margin:0 0 24px;">
        <a href="https://hasanjaffal.com/sproochentest/vocab/" style="display:inline-block;padding:14px 28px;background:#9333ea;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:8px;">Continue learning →</a>
      </div>

      <p style="font-size:13px;color:#94a3b8;margin:0;text-align:center;">
        You're receiving this because you use the Sproochentest Vocab Engine.
      </p>
    </div>

    <p style="font-size:12px;color:#94a3b8;text-align:center;margin:20px 0 0;">
      <a href="https://hasanjaffal.com/sproochentest/" style="color:#94a3b8;">Sproochentest Prep</a> · Made in Luxembourg 🇱🇺
    </p>
  </div>
</body>
</html>`;
}
