/**
 * Backfill openCount, clickCount, lastOpenedAt, lastClickedAt
 * on subscriber documents from existing events collection.
 *
 * Run: node scripts/backfill-engagement.cjs
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize with application default credentials
admin.initializeApp({ credential: admin.credential.applicationDefault(), projectId: 'hasanjaffal' });

const db = admin.firestore();

async function main() {
  console.log('Fetching all events...');
  const eventsSnapshot = await db.collection('events').get();
  console.log(`Found ${eventsSnapshot.size} events.`);

  // Aggregate counts per subscriber
  const stats = {}; // { subscriberId: { opens: 0, clicks: 0, lastOpen: null, lastClick: null } }

  eventsSnapshot.docs.forEach(doc => {
    const data = doc.data();
    const subId = data.subscriberId;
    if (!subId) return;

    if (!stats[subId]) {
      stats[subId] = { opens: 0, clicks: 0, lastOpen: null, lastClick: null };
    }

    if (data.type === 'open') {
      stats[subId].opens++;
      const ts = data.timestamp ? data.timestamp.toDate() : null;
      if (ts && (!stats[subId].lastOpen || ts > stats[subId].lastOpen)) {
        stats[subId].lastOpen = ts;
      }
    } else if (data.type === 'click') {
      stats[subId].clicks++;
      const ts = data.timestamp ? data.timestamp.toDate() : null;
      if (ts && (!stats[subId].lastClick || ts > stats[subId].lastClick)) {
        stats[subId].lastClick = ts;
      }
    }
  });

  const subscriberIds = Object.keys(stats);
  console.log(`Found engagement data for ${subscriberIds.length} subscribers.`);

  // Update each subscriber doc
  let updated = 0;
  let notFound = 0;

  for (const subId of subscriberIds) {
    const s = stats[subId];
    const docRef = db.collection('subscribers').doc(subId);
    const doc = await docRef.get();

    if (!doc.exists) {
      notFound++;
      continue;
    }

    const updateData = {
      openCount: s.opens,
      clickCount: s.clicks,
    };
    if (s.lastOpen) updateData.lastOpenedAt = admin.firestore.Timestamp.fromDate(s.lastOpen);
    if (s.lastClick) updateData.lastClickedAt = admin.firestore.Timestamp.fromDate(s.lastClick);

    await docRef.update(updateData);
    updated++;

    if (updated % 10 === 0) {
      console.log(`  Updated ${updated}/${subscriberIds.length}...`);
    }
  }

  console.log(`\nDone! Updated: ${updated}, Not found: ${notFound}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
