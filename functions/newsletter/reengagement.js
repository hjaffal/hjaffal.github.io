const { onSchedule } = require("firebase-functions/v2/scheduler");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");
const { Resend } = require("resend");

const { renderVocabReminder } = require("../email/portal");

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
  return renderVocabReminder({ name, xp, wordsLearned });
}
