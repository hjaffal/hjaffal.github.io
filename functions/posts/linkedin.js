const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const { verifyAdminToken } = require("../newsletter/auth");
const admin = require("firebase-admin");

const GEMINI_API_KEY = defineSecret("GEMINI_API_KEY");
const db = admin.firestore();
const COLLECTION = "linkedin_posts";

/**
 * generateLinkedInPosts Cloud Function
 * Generates 5 LinkedIn post variations for a given article.
 * Stores them in Firestore linked to the article slug.
 *
 * POST body: { slug, title, excerpt, body, tags }
 * GET with ?action=get&slug=... returns stored posts
 */
const generateLinkedInPosts = onRequest(
  {
    region: "europe-west1",
    cors: true,
    timeoutSeconds: 60,
    memory: "512MiB",
    secrets: [GEMINI_API_KEY],
  },
  async (req, res) => {
    try {
      await verifyAdminToken(req);
    } catch (err) {
      res.status(err.statusCode || 401).json({ error: err.message || "Unauthorized" });
      return;
    }

    const action = req.query.action || req.body.action;

    if (action === "get") {
      // Return stored LinkedIn posts for a slug
      const slug = req.query.slug || req.body.slug;
      if (!slug) { res.status(400).json({ error: "slug required" }); return; }

      const doc = await db.collection(COLLECTION).doc(slug).get();
      if (!doc.exists) {
        res.status(200).json({ posts: [], slug });
        return;
      }
      res.status(200).json({ posts: doc.data().posts || [], slug });
      return;
    }

    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    const { slug, title, excerpt, body, tags } = req.body;
    if (!slug || !title) {
      res.status(400).json({ error: "slug and title are required" });
      return;
    }

    // Build the prompt
    const articleContext = `Title: ${title}\nExcerpt: ${excerpt || ""}\nTags: ${(tags || []).join(", ")}\n\nArticle body (first 500 words):\n${(body || "").substring(0, 2000)}`;

    const prompt = `You are writing LinkedIn posts for Hasan Jaffal — a data and business intelligence leader who writes about AI, risk, operations, and decision-making.

Generate exactly 5 different LinkedIn post variations promoting this article. Each post must be DIFFERENT in angle, hook, and structure.

ARTICLE:
${articleContext}

LINKEDIN POST RULES:
- Max 100 words per post. Short and concise.
- First person voice ("I", "my", "I've been thinking...")
- Tone: LinkedIn-friendly, candid, slightly confrontational
- Hook: Bold, contrasting, or thought-provoking opening statement. One-liners that pull the reader down before the "see more" truncation.
- Format: White space ladder — 1-2 short sentences per paragraph, double-spaced between them. Short lines (<12 words each).
- Use emojis sparingly for bullet points and visual breaks. Don't overdo.
- Use bullet points or numbered lists where natural.
- NO Unicode fancy fonts (no bold/italic unicode). Plain text only.
- Include 3-5 highly specific hashtags at the very bottom.
- Do NOT include any links in the post body. The user will add links in comments.
- End with a question or call-to-action that invites engagement (comment, share opinion).

VARIATION REQUIREMENTS:
- Post 1: Start with a controversial/contrarian statement
- Post 2: Start with a personal observation or "I noticed..."
- Post 3: Start with a statistic or bold claim
- Post 4: Start with a question
- Post 5: Start with a short story or scenario

Return ONLY valid JSON array with exactly 5 strings:
["post 1 text", "post 2 text", "post 3 text", "post 4 text", "post 5 text"]

Each string should use \\n for line breaks between paragraphs (double \\n\\n for spacing).`;

    try {
      const { GoogleGenerativeAI } = require("@google/generative-ai");
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY.value());
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: { responseMimeType: "application/json" }
      });

      const result = await model.generateContent(prompt);
      let raw = result.response.text().trim();

      // Parse JSON
      if (raw.startsWith("```")) {
        raw = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
      }

      let posts;
      try {
        posts = JSON.parse(raw);
      } catch (e) {
        const match = raw.match(/\[[\s\S]*\]/);
        if (match) {
          posts = JSON.parse(match[0]);
        } else {
          throw new Error("Failed to parse LinkedIn posts from AI response");
        }
      }

      if (!Array.isArray(posts) || posts.length === 0) {
        throw new Error("AI did not return an array of posts");
      }

      // Store in Firestore
      const timestamp = new Date().toISOString();
      const storedPosts = posts.map((text, i) => ({
        id: `${slug}-${timestamp}-${i}`,
        text: text,
        generatedAt: timestamp,
      }));

      // Get existing posts and append
      const docRef = db.collection(COLLECTION).doc(slug);
      const existing = await docRef.get();
      const existingPosts = existing.exists ? (existing.data().posts || []) : [];
      const allPosts = [...storedPosts, ...existingPosts];

      await docRef.set({
        slug,
        title,
        posts: allPosts,
        lastGeneratedAt: timestamp,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      res.status(200).json({ posts: storedPosts, total: allPosts.length });
    } catch (err) {
      console.error("generateLinkedInPosts error:", err.message);
      res.status(500).json({ error: "Failed to generate LinkedIn posts. " + err.message });
    }
  }
);

module.exports = { generateLinkedInPosts };
