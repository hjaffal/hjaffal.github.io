const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const { verifyAdminToken } = require("./auth");

/**
 * getAnalytics Cloud Function
 * GET handler for newsletter analytics data.
 *
 * - type=editions: return all editions sorted by sentAt descending with open/click rates
 * - type=edition&id=...: return full edition detail including clicked links
 * - type=overview: aggregate subscriber counts by status, segment, and utm_source
 *
 * All endpoints require Firebase ID token verification.
 * Returns null rates for editions with zero recipients.
 *
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 11.1
 */
const getAnalytics = onRequest(
  { region: "europe-west1", cors: true },
  async (req, res) => {
    if (req.method !== "GET") {
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

    const type = req.query.type;

    if (type === "editions") {
      await handleEditionsList(req, res);
    } else if (type === "edition") {
      await handleEditionDetail(req, res);
    } else if (type === "overview") {
      await handleOverview(req, res);
    } else if (type === "subscriberGrowth") {
      await handleSubscriberGrowth(req, res);
    } else {
      res.status(400).json({ error: "Invalid type parameter. Use: editions, edition, overview, or subscriberGrowth" });
    }
  }
);

/**
 * Returns all editions sorted by sentAt descending with calculated open/click rates.
 * Open rate = (uniqueOpens / recipientCount) * 100
 * Click rate = (uniqueClicks / recipientCount) * 100
 * If recipientCount === 0, both rates are null.
 */
async function handleEditionsList(_req, res) {
  const db = admin.firestore();

  try {
    // Get all editions sorted by sentAt descending
    const editionsSnapshot = await db
      .collection("editions")
      .orderBy("sentAt", "desc")
      .get();

    const editions = [];

    for (const doc of editionsSnapshot.docs) {
      const data = doc.data();
      const editionId = doc.id;
      const recipientCount = data.recipientCount || 0;

      // Count unique opens for this edition (open events use compound doc ID)
      const opensSnapshot = await db
        .collection("events")
        .where("editionId", "==", editionId)
        .where("type", "==", "open")
        .get();
      const uniqueOpens = opensSnapshot.size;

      // Count unique clicks for this edition (unique by subscriberId)
      const clicksSnapshot = await db
        .collection("events")
        .where("editionId", "==", editionId)
        .where("type", "==", "click")
        .get();

      // Deduplicate clicks by subscriberId for unique click count
      const uniqueClickSubscribers = new Set();
      clicksSnapshot.docs.forEach((clickDoc) => {
        uniqueClickSubscribers.add(clickDoc.data().subscriberId);
      });
      const uniqueClicks = uniqueClickSubscribers.size;

      // Calculate rates
      let openRate = null;
      let clickRate = null;
      if (recipientCount > 0) {
        openRate = (uniqueOpens / recipientCount) * 100;
        clickRate = (uniqueClicks / recipientCount) * 100;
      }

      editions.push({
        id: editionId,
        subject: data.subject || "",
        segment: data.segment || "",
        recipientCount,
        uniqueOpens,
        uniqueClicks,
        openRate,
        clickRate,
        sentAt: data.sentAt ? data.sentAt.toDate().toISOString() : null,
      });
    }

    res.status(200).json({ editions });
  } catch (err) {
    console.error("Error fetching editions list:", err);
    res.status(500).json({ error: "Failed to fetch editions" });
  }
}

/**
 * Returns full edition detail including clicked links aggregated from events.
 */
async function handleEditionDetail(req, res) {
  const db = admin.firestore();
  const editionId = req.query.id;

  if (!editionId) {
    res.status(400).json({ error: "Edition id is required" });
    return;
  }

  try {
    // Get the edition document
    const editionDoc = await db.collection("editions").doc(editionId).get();

    if (!editionDoc.exists) {
      res.status(404).json({ error: "Edition not found" });
      return;
    }

    const data = editionDoc.data();
    const recipientCount = data.recipientCount || 0;

    // Count unique opens
    const opensSnapshot = await db
      .collection("events")
      .where("editionId", "==", editionId)
      .where("type", "==", "open")
      .get();
    const uniqueOpens = opensSnapshot.size;

    // Get all click events for this edition
    const clicksSnapshot = await db
      .collection("events")
      .where("editionId", "==", editionId)
      .where("type", "==", "click")
      .get();

    // Deduplicate clicks by subscriberId for unique click count
    const uniqueClickSubscribers = new Set();
    // Aggregate clicked links
    const linkClickCounts = {};

    clicksSnapshot.docs.forEach((clickDoc) => {
      const clickData = clickDoc.data();
      uniqueClickSubscribers.add(clickData.subscriberId);

      const url = clickData.url || "";
      if (url) {
        linkClickCounts[url] = (linkClickCounts[url] || 0) + 1;
      }
    });

    const uniqueClicks = uniqueClickSubscribers.size;

    // Calculate rates
    let openRate = null;
    let clickRate = null;
    if (recipientCount > 0) {
      openRate = (uniqueOpens / recipientCount) * 100;
      clickRate = (uniqueClicks / recipientCount) * 100;
    }

    // Build clicked links array sorted by clicks descending
    const clickedLinks = Object.entries(linkClickCounts)
      .map(([url, clicks]) => ({ url, clicks }))
      .sort((a, b) => b.clicks - a.clicks);

    res.status(200).json({
      editionId,
      subject: data.subject || "",
      segment: data.segment || "",
      posts: data.posts || [],
      featuredPost: data.featuredPost || null,
      toolInvitation: data.toolInvitation || null,
      sentAt: data.sentAt ? data.sentAt.toDate().toISOString() : null,
      totalRecipients: recipientCount,
      uniqueOpens,
      uniqueClicks,
      openRate,
      clickRate,
      clickedLinks,
      failedSends: data.failedSends || 0,
    });
  } catch (err) {
    console.error("Error fetching edition detail:", err);
    res.status(500).json({ error: "Failed to fetch edition detail" });
  }
}

/**
 * Aggregates subscriber counts by status, segment, and utm_source.
 */
async function handleOverview(_req, res) {
  const db = admin.firestore();

  try {
    const subscribersSnapshot = await db.collection("subscribers").get();

    let totalActive = 0;
    let totalUnsubscribed = 0;
    let totalBounced = 0;
    let totalComplained = 0;
    const bySegment = {};
    const byUtmSource = {};

    subscribersSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      const status = data.status;

      // Count by status
      if (status === "active") {
        totalActive++;
      } else if (status === "unsubscribed") {
        totalUnsubscribed++;
      } else if (status === "bounced") {
        totalBounced++;
      } else if (status === "complained") {
        totalComplained++;
      }

      // Count by segment (only active subscribers)
      if (status === "active" && Array.isArray(data.segments)) {
        data.segments.forEach((segment) => {
          bySegment[segment] = (bySegment[segment] || 0) + 1;
        });
      }

      // Count by utm_source (only active subscribers)
      if (status === "active" && data.utmSource) {
        byUtmSource[data.utmSource] = (byUtmSource[data.utmSource] || 0) + 1;
      }
    });

    res.status(200).json({
      totalActive,
      totalUnsubscribed,
      totalBounced,
      totalComplained,
      bySegment,
      byUtmSource,
    });
  } catch (err) {
    console.error("Error fetching subscriber overview:", err);
    res.status(500).json({ error: "Failed to fetch overview" });
  }
}

/**
 * Returns cumulative subscriber count per day for the last 30 days.
 * Derives from subscribedAt field on each subscriber document.
 */
async function handleSubscriberGrowth(_req, res) {
  const db = admin.firestore();

  try {
    const snapshot = await db.collection("subscribers").get();

    // Build a map of subscription dates
    const dailyCounts = {};
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      if (data.subscribedAt) {
        let dateStr;
        if (data.subscribedAt.toDate) {
          dateStr = data.subscribedAt.toDate().toISOString().split('T')[0];
        } else if (typeof data.subscribedAt === 'string') {
          dateStr = data.subscribedAt.split('T')[0];
        }
        if (dateStr) {
          dailyCounts[dateStr] = (dailyCounts[dateStr] || 0) + 1;
        }
      }
    });

    // Build last 365 days with cumulative totals
    const now = new Date();
    const days = [];
    let cumulative = 0;

    // Count all subscribers before the 365-day window
    const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    Object.keys(dailyCounts).sort().forEach(function(date) {
      if (new Date(date) < yearAgo) {
        cumulative += dailyCounts[date];
      }
    });

    // Build the 365-day series
    for (let i = 364; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().split('T')[0];
      cumulative += (dailyCounts[key] || 0);
      days.push({ date: key, total: cumulative, new: dailyCounts[key] || 0 });
    }

    res.status(200).json({ days });
  } catch (err) {
    console.error("Error fetching subscriber growth:", err);
    res.status(500).json({ error: "Failed to fetch subscriber growth" });
  }
}

module.exports = { getAnalytics };
