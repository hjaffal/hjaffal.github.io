const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");
const { Resend } = require("resend");
const { verifyAdminToken } = require("./auth");
const { generateTrackingToken } = require("./utils");
const { renderNewsletter } = require("./template");

const RESEND_API_KEY = defineSecret("RESEND_API_KEY");

const RSS_FEED_URL = "https://hasanjaffal.com/feed.xml";

const CLICK_PROXY_BASE = "https://trackclick-vgheoh5xza-ew.a.run.app";
const TRACKING_PIXEL_BASE = "https://trackopen-vgheoh5xza-ew.a.run.app";
const UNSUBSCRIBE_BASE = "https://hasanjaffal.com/newsletter/preferences/";

const BATCH_SIZE = 10;
const BATCH_DELAY_MS = 1000;
const MAX_RETRIES = 3;

/**
 * sendNewsletter Cloud Function
 * GET handler: list posts from site RSS feed (action=listPosts)
 * POST handler: compose and send newsletter edition (task 5.2)
 *
 * Requires Firebase ID token authentication for all actions.
 */
const sendNewsletter = onRequest(
  { region: "europe-west1", cors: true, secrets: [RESEND_API_KEY] },
  async (req, res) => {
    if (req.method === "GET") {
      await handleGet(req, res);
    } else if (req.method === "POST") {
      await handlePost(req, res);
    } else {
      res.status(405).json({ error: "Method not allowed" });
    }
  }
);

/**
 * POST handler: compose and send a newsletter edition.
 * Validates admin auth, input, queries subscribers, renders emails,
 * sends in batches with rate limiting, and records the edition in Firestore.
 */
async function handlePost(req, res) {
  // Verify admin authentication
  try {
    await verifyAdminToken(req);
  } catch (err) {
    res.status(err.statusCode || 401).json({ error: err.message || "Unauthorized" });
    return;
  }

  const { subject, introHtml, posts, featuredPost, toolInvitation, segment } = req.body || {};

  // Validate required fields
  if (!subject || typeof subject !== "string" || subject.trim().length === 0) {
    res.status(400).json({ error: "Subject is required and must be non-empty" });
    return;
  }

  const hasIntro = introHtml && typeof introHtml === "string" && introHtml.trim().length > 0;
  const hasPosts = posts && Array.isArray(posts) && posts.length > 0;

  if (!hasIntro && !hasPosts) {
    res.status(400).json({ error: "Add intro text or select at least one post" });
    return;
  }

  const validSegments = ["main_website", "sproochentest_prep", "testing"];
  if (!segment || !validSegments.includes(segment)) {
    res.status(400).json({ error: "Invalid segment. Must be one of: main_website, sproochentest_prep, testing" });
    return;
  }

  const db = admin.firestore();

  try {
    // Query active subscribers for the target segment
    const subscribersSnapshot = await db
      .collection("subscribers")
      .where("status", "==", "active")
      .where("segments", "array-contains", segment)
      .get();

    const subscribers = subscribersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    if (subscribers.length === 0) {
      res.status(200).json({ result: "success", editionId: null, recipientCount: 0 });
      return;
    }

    // Create edition document with status "sending"
    const editionData = {
      subject: subject.trim(),
      introHtml: hasIntro ? introHtml.trim() : null,
      posts: hasPosts ? posts : [],
      featuredPost: featuredPost || null,
      toolInvitation: toolInvitation || null,
      segment: segment,
      recipientCount: subscribers.length,
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
      sendCompletedAt: null,
      failedSends: 0,
      status: "sending",
    };

    const editionRef = await db.collection("editions").add(editionData);
    const editionId = editionRef.id;

    // Send emails in batches
    const resend = new Resend(RESEND_API_KEY.value());
    let failedSends = 0;

    const batches = [];
    for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
      batches.push(subscribers.slice(i, i + BATCH_SIZE));
    }

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];

      // Add delay between batches (not before the first one)
      if (batchIndex > 0) {
        await sleep(BATCH_DELAY_MS);
      }

      // Send each email in the batch concurrently
      const sendPromises = batch.map((subscriber) =>
        sendToSubscriber(resend, subscriber, editionId, subject, hasIntro ? introHtml.trim() : null, hasPosts ? posts : [], featuredPost, toolInvitation)
      );

      const results = await Promise.allSettled(sendPromises);

      for (const result of results) {
        if (result.status === "rejected" || (result.status === "fulfilled" && result.value === false)) {
          failedSends++;
        }
      }
    }

    // Update edition doc with final status
    const finalStatus = failedSends === subscribers.length ? "failed" : "sent";
    await editionRef.update({
      status: finalStatus,
      failedSends: failedSends,
      sendCompletedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(200).json({
      result: "success",
      editionId: editionId,
      recipientCount: subscribers.length,
    });
  } catch (err) {
    console.error("Newsletter send error:", err);
    res.status(500).json({ error: "Failed to send newsletter" });
  }
}

/**
 * Sends a newsletter email to a single subscriber with personalized tracking and unsubscribe links.
 * Retries on 429 (rate limit) with exponential backoff.
 *
 * @param {Resend} resend - Resend client instance
 * @param {Object} subscriber - Subscriber document data with id
 * @param {string} editionId - The edition document ID
 * @param {string} subject - Email subject line
 * @param {Array} posts - Array of post objects
 * @param {Object|null} featuredPost - Featured post object or null
 * @param {Object|null} toolInvitation - Tool invitation object or null
 * @returns {Promise<boolean>} true if sent successfully, false otherwise
 */
async function sendToSubscriber(resend, subscriber, editionId, subject, introHtml, posts, featuredPost, toolInvitation) {
  try {
    const trackingToken = generateTrackingToken(subscriber.id, editionId);

    // Build personalized unsubscribe URL using the raw token stored on the subscriber doc
    const rawUnsubscribeToken = subscriber.unsubscribeToken || subscriber.id;
    const unsubscribeUrl = `${UNSUBSCRIBE_BASE}?token=${rawUnsubscribeToken}`;

    // Build tracking pixel URL
    const trackingPixelUrl = `${TRACKING_PIXEL_BASE}?t=${trackingToken}`;

    // Rewrite all post links through click proxy
    const rewrittenPosts = (posts || []).map((post) => ({
      ...post,
      url: rewriteLink(post.url, trackingToken),
    }));

    // Rewrite featured post link if present
    const rewrittenFeaturedPost = featuredPost
      ? { ...featuredPost, url: rewriteLink(featuredPost.url, trackingToken) }
      : null;

    // Rewrite tool invitation link if present
    const rewrittenToolInvitation = toolInvitation
      ? { ...toolInvitation, url: rewriteLink(toolInvitation.url, trackingToken) }
      : null;

    // Render the HTML email
    const html = renderNewsletter({
      subject,
      introHtml: rewriteLinksInHtml(introHtml, trackingToken),
      posts: rewrittenPosts,
      featuredPost: rewrittenFeaturedPost,
      toolInvitation: rewrittenToolInvitation,
      unsubscribeUrl,
      trackingPixelUrl,
    });

    // Send with retry on 429
    await sendWithRetry(resend, {
      from: "Hasan Jaffal <hasan@hasanjaffal.com>",
      to: subscriber.email,
      subject: subject,
      html: html,
      headers: {
        "List-Unsubscribe": `<${unsubscribeUrl}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    });

    return true;
  } catch (err) {
    console.error(`Failed to send to ${subscriber.email}:`, err.message || err);
    return false;
  }
}

/**
 * Rewrites a URL through the click proxy for tracking.
 * The destination URL is base64url-encoded as a query parameter.
 *
 * @param {string} url - The original destination URL
 * @param {string} trackingToken - The tracking token for this subscriber-edition
 * @returns {string} The click proxy URL
 */
function rewriteLink(url, trackingToken) {
  const encodedUrl = Buffer.from(url).toString("base64url");
  return `${CLICK_PROXY_BASE}?t=${trackingToken}&url=${encodedUrl}`;
}

/**
 * Rewrites all <a href="..."> links in an HTML string through the click proxy.
 * Skips unsubscribe/preferences links to keep them direct.
 *
 * @param {string} html - The HTML content with links
 * @param {string} trackingToken - The tracking token for this subscriber-edition
 * @returns {string} HTML with rewritten links
 */
function rewriteLinksInHtml(html, trackingToken) {
  if (!html) return html;
  return html.replace(/href="(https?:\/\/[^"]+)"/g, function(match, url) {
    // Don't rewrite unsubscribe/preferences links
    if (url.includes('/newsletter/preferences') || url.includes('unsubscribe')) {
      return match;
    }
    return 'href="' + rewriteLink(url, trackingToken) + '"';
  });
}

/**
 * Sends an email via Resend with exponential backoff retry on 429 (rate limit).
 * Max 3 retries with delays of 1s, 2s, 4s.
 *
 * @param {Resend} resend - Resend client instance
 * @param {Object} emailOptions - The email options to pass to resend.emails.send()
 */
async function sendWithRetry(resend, emailOptions) {
  let lastError;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await resend.emails.send(emailOptions);
      if (result.error) {
        // Resend SDK returns errors in the response object
        if (result.error.statusCode === 429 && attempt < MAX_RETRIES) {
          const delay = Math.pow(2, attempt) * 1000;
          await sleep(delay);
          lastError = result.error;
          continue;
        }
        throw new Error(result.error.message || "Resend send failed");
      }
      return result;
    } catch (err) {
      // Check if it's a rate limit error (429)
      if ((err.statusCode === 429 || err.status === 429) && attempt < MAX_RETRIES) {
        const delay = Math.pow(2, attempt) * 1000;
        await sleep(delay);
        lastError = err;
        continue;
      }
      throw err;
    }
  }

  throw lastError || new Error("Max retries exceeded");
}

/**
 * Utility: sleep for a given number of milliseconds.
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * GET handler: list posts from site RSS feed.
 * Requires action=listPosts query parameter.
 * Returns posts sorted by date descending with title, date, excerpt, url, tags.
 */
async function handleGet(req, res) {
  // Verify admin authentication
  try {
    await verifyAdminToken(req);
  } catch (err) {
    res.status(err.statusCode || 401).json({ error: err.message || "Unauthorized" });
    return;
  }

  const action = req.query.action;

  if (action !== "listPosts") {
    res.status(400).json({ error: "Invalid action. Supported: listPosts" });
    return;
  }

  try {
    const posts = await fetchPostsFromRSS();
    res.status(200).json({ posts });
  } catch (err) {
    console.error("Error fetching posts:", err);
    res.status(500).json({ error: "Failed to fetch posts" });
  }
}

/**
 * Fetches and parses the site RSS feed to extract post metadata.
 * Returns posts sorted by date descending.
 *
 * @returns {Promise<Array<{title: string, date: string, excerpt: string, url: string, tags: string[]}>>}
 */
async function fetchPostsFromRSS() {
  const response = await fetch(RSS_FEED_URL);

  if (!response.ok) {
    throw new Error(`RSS feed fetch failed with status ${response.status}`);
  }

  const xml = await response.text();
  return parseRSSFeed(xml);
}

/**
 * Parses RSS/Atom XML feed and extracts post metadata.
 * Supports both RSS 2.0 (<item>) and Atom (<entry>) formats.
 *
 * @param {string} xml - The raw XML string
 * @returns {Array<{title: string, date: string, excerpt: string, url: string, tags: string[]}>}
 */
function parseRSSFeed(xml) {
  const posts = [];

  // Determine feed format (Atom uses <entry>, RSS uses <item>)
  const isAtom = xml.includes("<feed") && xml.includes("<entry>");
  const itemTag = isAtom ? "entry" : "item";

  // Split by item/entry tags
  const itemRegex = new RegExp(`<${itemTag}[^>]*>([\\s\\S]*?)<\\/${itemTag}>`, "g");
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];
    const post = parseItem(itemXml, isAtom);
    if (post) {
      posts.push(post);
    }
  }

  // Sort by date descending
  posts.sort((a, b) => new Date(b.date) - new Date(a.date));

  return posts;
}

/**
 * Parses a single RSS item or Atom entry XML fragment.
 *
 * @param {string} itemXml - The XML content of a single item/entry
 * @param {boolean} isAtom - Whether the feed is Atom format
 * @returns {{title: string, date: string, excerpt: string, url: string, tags: string[]}|null}
 */
function parseItem(itemXml, isAtom) {
  const title = extractTag(itemXml, "title");
  if (!title) return null;

  // Extract URL
  let url;
  if (isAtom) {
    // Atom uses <link href="..." />
    const linkMatch = itemXml.match(/<link[^>]*href=["']([^"']+)["'][^>]*\/?\s*>/);
    url = linkMatch ? linkMatch[1] : "";
  } else {
    url = extractTag(itemXml, "link");
  }

  // Extract date
  let date;
  if (isAtom) {
    const published = extractTag(itemXml, "published") || extractTag(itemXml, "updated");
    date = published ? formatDate(published) : "";
  } else {
    const pubDate = extractTag(itemXml, "pubDate");
    date = pubDate ? formatDate(pubDate) : "";
  }

  // Extract excerpt/description
  const excerpt = extractExcerpt(itemXml, isAtom);

  // Extract tags/categories
  const tags = extractCategories(itemXml, isAtom);

  // Derive thumbnail image from URL slug
  // Posts use pattern: /assets/img/posts/{slug}.webp
  let thumbnailImg = "";
  if (url) {
    const slug = url.replace(/^https?:\/\/[^/]+\//, "").replace(/\/$/, "");
    if (slug) {
      thumbnailImg = `/assets/img/posts/${slug}.webp`;
    }
  }

  return { title, date, excerpt, url, tags, thumbnailImg };
}

/**
 * Extracts text content from an XML tag.
 *
 * @param {string} xml - The XML string to search
 * @param {string} tagName - The tag name to extract
 * @returns {string} The text content or empty string
 */
function extractTag(xml, tagName) {
  // Handle CDATA sections
  const cdataRegex = new RegExp(`<${tagName}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*<\\/${tagName}>`, "i");
  const cdataMatch = xml.match(cdataRegex);
  if (cdataMatch) {
    return cdataMatch[1].trim();
  }

  // Handle regular content
  const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i");
  const match = xml.match(regex);
  if (match) {
    return stripHtml(match[1].trim());
  }

  return "";
}

/**
 * Extracts the excerpt/description from an item.
 * Tries description first, then summary, then content:encoded.
 *
 * @param {string} itemXml - The item XML
 * @param {boolean} isAtom - Whether Atom format
 * @returns {string} The excerpt text
 */
function extractExcerpt(itemXml, isAtom) {
  if (isAtom) {
    const summary = extractTag(itemXml, "summary");
    if (summary) return truncateExcerpt(summary);
    const content = extractTag(itemXml, "content");
    if (content) return truncateExcerpt(content);
  } else {
    const description = extractTag(itemXml, "description");
    if (description) return truncateExcerpt(description);
    // Try content:encoded for RSS feeds
    const contentEncoded = extractTag(itemXml, "content:encoded");
    if (contentEncoded) return truncateExcerpt(contentEncoded);
  }
  return "";
}

/**
 * Extracts category/tag values from an item.
 *
 * @param {string} itemXml - The item XML
 * @param {boolean} isAtom - Whether Atom format
 * @returns {string[]} Array of tag strings
 */
function extractCategories(itemXml, isAtom) {
  const tags = [];

  if (isAtom) {
    // Atom uses <category term="..." />
    const catRegex = /<category[^>]*term=["']([^"']+)["'][^>]*\/?>/g;
    let catMatch;
    while ((catMatch = catRegex.exec(itemXml)) !== null) {
      tags.push(catMatch[1]);
    }
  } else {
    // RSS uses <category>text</category>
    const catRegex = /<category[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/category>/gi;
    let catMatch;
    while ((catMatch = catRegex.exec(itemXml)) !== null) {
      const tag = catMatch[1].trim();
      if (tag) tags.push(tag);
    }
  }

  return tags;
}

/**
 * Strips HTML tags from a string.
 *
 * @param {string} html - String potentially containing HTML
 * @returns {string} Plain text
 */
function stripHtml(html) {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .trim();
}

/**
 * Truncates excerpt to a reasonable length (200 chars).
 *
 * @param {string} text - The text to truncate
 * @returns {string} Truncated text
 */
function truncateExcerpt(text) {
  const plain = stripHtml(text);
  if (plain.length <= 200) return plain;
  return plain.substring(0, 197) + "...";
}

/**
 * Formats a date string to YYYY-MM-DD format.
 *
 * @param {string} dateStr - A date string (ISO, RFC 2822, etc.)
 * @returns {string} Formatted date string (YYYY-MM-DD)
 */
function formatDate(dateStr) {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  } catch {
    return dateStr;
  }
}

module.exports = {
  sendNewsletter,
  // Exported for testing
  parseRSSFeed,
  parseItem,
  extractTag,
  extractExcerpt,
  extractCategories,
  stripHtml,
  truncateExcerpt,
  formatDate,
  fetchPostsFromRSS,
  handlePost,
  sendToSubscriber,
  rewriteLink,
  sendWithRetry,
  sleep,
  BATCH_SIZE,
  BATCH_DELAY_MS,
  MAX_RETRIES,
};
