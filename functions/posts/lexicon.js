const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const { verifyAdminToken } = require("../newsletter/auth");
const admin = require("firebase-admin");

const GEMINI_API_KEY = defineSecret("GEMINI_API_KEY");
const GITHUB_PAT = defineSecret("GITHUB_PAT");
const db = admin.firestore();
const COLLECTION = "lexicon_terms";
const REPO_OWNER = "hjaffal";
const REPO_NAME = "hjaffal.github.io";
const REPO_BRANCH = "master";

/**
 * manageLexicon Cloud Function
 * CRUD + AI generation for lexicon terms.
 *
 * Actions (via ?action= query param):
 *   list     — List all terms
 *   get      — Get a single term by slug
 *   save     — Create or update a term
 *   delete   — Delete a term
 *   generate — Generate new term ideas using AI
 *   expand   — Generate full term page from an idea
 */
const manageLexicon = onRequest(
  {
    region: "europe-west1",
    cors: true,
    timeoutSeconds: 60,
    memory: "512MiB",
    secrets: [GEMINI_API_KEY, GITHUB_PAT],
  },
  async (req, res) => {
    try {
      await verifyAdminToken(req);
    } catch (err) {
      res.status(err.statusCode || 401).json({ error: err.message || "Unauthorized" });
      return;
    }

    const action = req.query.action || req.body.action;

    try {
      switch (action) {
        case "list": await handleList(req, res); break;
        case "get": await handleGet(req, res); break;
        case "save": await handleSave(req, res); break;
        case "delete": await handleDelete(req, res); break;
        case "publish": await handlePublish(req, res); break;
        case "seed": await handleSeed(req, res); break;
        case "generate": await handleGenerate(req, res); break;
        case "expand": await handleExpand(req, res); break;
        case "alternatives": await handleAlternatives(req, res); break;
        case "sharpen": await handleSharpen(req, res); break;
        case "seo": await handleSEO(req, res); break;
        case "linkedin": await handleLinkedIn(req, res); break;
        case "note": await handleSubstackNote(req, res); break;
        default: res.status(400).json({ error: "Invalid action" });
      }
    } catch (err) {
      console.error("manageLexicon error:", err.message);
      res.status(500).json({ error: err.message || "Internal error" });
    }
  }
);

async function handleList(_req, res) {
  const snapshot = await db.collection(COLLECTION).orderBy("name").get();
  const terms = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  res.status(200).json({ terms });
}

async function handleGet(req, res) {
  const slug = req.query.slug || req.body.slug;
  if (!slug) { res.status(400).json({ error: "slug required" }); return; }
  const snapshot = await db.collection(COLLECTION).where("slug", "==", slug).limit(1).get();
  if (snapshot.empty) { res.status(404).json({ error: "Term not found" }); return; }
  res.status(200).json({ term: { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } });
}

async function handleSave(req, res) {
  const data = req.body;
  const { id, slug, name, pos, definition, category, explanation, example,
    why_it_matters, teams_get_wrong, strong_teams, related_terms, keywords, status } = data;

  if (!name || !slug) { res.status(400).json({ error: "name and slug required" }); return; }

  const termData = {
    slug, name, pos: pos || "n.", definition: definition || "",
    category: category || "ai-decision-operations",
    explanation: explanation || "", example: example || "",
    why_it_matters: why_it_matters || "", teams_get_wrong: teams_get_wrong || "",
    strong_teams: strong_teams || "", related_terms: related_terms || [],
    keywords: keywords || [], status: status || "draft",
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  if (id) {
    await db.collection(COLLECTION).doc(id).update(termData);
    res.status(200).json({ result: "updated", id });
  } else {
    termData.createdAt = admin.firestore.FieldValue.serverTimestamp();
    const docRef = await db.collection(COLLECTION).add(termData);
    res.status(200).json({ result: "created", id: docRef.id });
  }
}

async function handleDelete(req, res) {
  const id = req.body.id || req.query.id;
  if (!id) { res.status(400).json({ error: "id required" }); return; }
  await db.collection(COLLECTION).doc(id).delete();
  res.status(200).json({ result: "deleted" });
}

/**
 * Publish a term: commit its page to GitHub as a .md file.
 */
async function handlePublish(req, res) {
  const term = req.body;
  if (!term.name || !term.slug) { res.status(400).json({ error: "name and slug required" }); return; }

  const slug = term.slug;
  const keywordsYaml = (term.keywords || []).map(kw => `  - "${kw}"`).join("\n");
  const today = new Date().toISOString().split("T")[0];

  const fileContent = `---
layout: lexicon-term
title: "${(term.name || '').replace(/"/g, '\\"')} — AI Operations Lexicon"
share-title: "${(term.name || '').replace(/"/g, '\\"')} — AI Operations Lexicon"
share-description: "${(term.definition || '').replace(/"/g, '\\"')}"
permalink: /lexicon/${slug}/
term_name: "${(term.name || '').replace(/"/g, '\\"')}"
pos: "${term.pos || 'n.'}"
definition: "${(term.definition || '').replace(/"/g, '\\"')}"
category: "${term.category || ''}"
explanation: "${(term.explanation || '').replace(/"/g, '\\"')}"
example: "${(term.example || '').replace(/"/g, '\\"')}"
why_it_matters: "${(term.why_it_matters || '').replace(/"/g, '\\"')}"
teams_get_wrong: "${(term.teams_get_wrong || '').replace(/"/g, '\\"')}"
strong_teams: "${(term.strong_teams || '').replace(/"/g, '\\"')}"
keywords:
${keywordsYaml || '  - ""'}
updated_at: "${today}"
---
`;

  // Commit to GitHub
  const { Octokit } = require("@octokit/rest");
  const octokit = new Octokit({ auth: GITHUB_PAT.value() });
  const path = `lexicon/${slug}.md`;

  try {
    let sha = null;
    try {
      const existing = await octokit.repos.getContent({ owner: REPO_OWNER, repo: REPO_NAME, path, ref: REPO_BRANCH });
      sha = existing.data.sha;
    } catch (e) { /* file doesn't exist yet */ }

    await octokit.repos.createOrUpdateFileContents({
      owner: REPO_OWNER, repo: REPO_NAME, path,
      message: `Publish lexicon term: ${term.name}`,
      content: Buffer.from(fileContent).toString("base64"),
      branch: REPO_BRANCH,
      ...(sha ? { sha } : {}),
    });

    res.status(200).json({ result: "published", path });
  } catch (err) {
    console.error("Publish error:", err.message);
    res.status(500).json({ error: "Failed to publish: " + err.message });
  }
}

/**
 * Seed terms into Firestore (bulk create).
 */
async function handleSeed(req, res) {
  const { terms } = req.body;
  if (!terms || !Array.isArray(terms)) { res.status(400).json({ error: "terms array required" }); return; }

  const batch = db.batch();
  const now = admin.firestore.FieldValue.serverTimestamp();

  terms.forEach(term => {
    const docRef = db.collection(COLLECTION).doc();
    batch.set(docRef, {
      ...term,
      status: term.status || "published",
      createdAt: now,
      updatedAt: now,
    });
  });

  await batch.commit();
  res.status(200).json({ result: "seeded", count: terms.length });
}

async function handleGenerate(req, res) {
  const { topic, pillar, tone, audience, style, count } = req.body;

  const prompt = `You are creating original terms for the AI Operations Lexicon by Hasan Jaffal.

Generate exactly ${count || 10} new term ideas. Each term must name a real operational failure pattern related to AI, dashboards, risk intelligence, decision-making, automation, or job exposure.

INPUT:
- Topic/failure pattern: ${topic || "AI and operational decision-making failures"}
- Target pillar: ${pillar || "AI Decision Operations"}
- Tone: ${tone || "sharp"}
- Audience: ${audience || "operations leaders"}
- Style: ${style || "serious, memorable"}

RULES:
- Each term must be original (not existing AI jargon)
- Must connect to real operations, risk, decisions, dashboards, or accountability
- Must be useful, not just clever
- Reject anything too generic, too cute, too academic, or only funny
- Think: what would an operations leader call this failure pattern in a meeting?

Return ONLY valid JSON array:
[
  {
    "name": "Term Name",
    "pos": "n.",
    "definition": "One sentence, max 160 chars",
    "category": "ai-decision-operations",
    "why_it_works": "Why this name is effective",
    "risk": "Risk of being unclear or too cute",
    "seo_angle": "What people would search for",
    "slug": "term-slug"
  }
]`;

  const { GoogleGenerativeAI } = require("@google/generative-ai");
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY.value());
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash", generationConfig: { responseMimeType: "application/json" } });

  const result = await model.generateContent(prompt);
  let raw = result.response.text().trim();
  if (raw.startsWith("```")) raw = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");

  const ideas = JSON.parse(raw);
  res.status(200).json({ ideas });
}

async function handleExpand(req, res) {
  const { name, definition, category } = req.body;
  if (!name) { res.status(400).json({ error: "name required" }); return; }

  const prompt = `Expand this lexicon term into a full page for the AI Operations Lexicon by Hasan Jaffal.

TERM: ${name}
DEFINITION: ${definition || ""}
CATEGORY: ${category || "ai-decision-operations"}

Write a complete term page with these sections:
1. explanation (2-3 sentences expanding the definition)
2. example (a realistic operational scenario, fictional company allowed)
3. why_it_matters (1-2 sentences on business impact)
4. teams_get_wrong (1-2 sentences on the common mistake)
5. strong_teams (1-2 sentences on what good teams do differently)
6. related_terms (3-4 slugified term names that would relate)
7. keywords (3 SEO keywords)

VOICE: Sharp, operator-style, direct. Not academic. Not consultant-speak.

Return ONLY valid JSON:
{
  "explanation": "",
  "example": "",
  "why_it_matters": "",
  "teams_get_wrong": "",
  "strong_teams": "",
  "related_terms": ["slug-1", "slug-2", "slug-3"],
  "keywords": ["keyword 1", "keyword 2", "keyword 3"]
}`;

  const { GoogleGenerativeAI } = require("@google/generative-ai");
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY.value());
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash", generationConfig: { responseMimeType: "application/json" } });

  const result = await model.generateContent(prompt);
  let raw = result.response.text().trim();
  if (raw.startsWith("```")) raw = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");

  const expanded = JSON.parse(raw);
  res.status(200).json({ expanded });
}

/**
 * Generate alternative names for a term.
 */
async function handleAlternatives(req, res) {
  const { name, definition } = req.body;
  if (!name) { res.status(400).json({ error: "name required" }); return; }

  const prompt = `Generate 5 alternative names for this AI Operations Lexicon term.

CURRENT NAME: ${name}
DEFINITION: ${definition || ""}

Rules:
- Each alternative must be memorable, sharp, and operational
- Not too cute, not too academic
- Must clearly evoke the failure pattern
- Include a mix: some serious, some slightly ironic, some metaphorical

Return ONLY valid JSON array of strings: ["Alternative 1", "Alternative 2", ...]`;

  const result = await callGemini(prompt);
  res.status(200).json({ alternatives: result });
}

/**
 * Generate a sharper definition for a term.
 */
async function handleSharpen(req, res) {
  const { name, definition } = req.body;
  if (!name) { res.status(400).json({ error: "name required" }); return; }

  const prompt = `Rewrite this lexicon term definition to be sharper, more memorable, and under 160 characters.

TERM: ${name}
CURRENT DEFINITION: ${definition || ""}

Generate 3 alternative definitions. Each must:
- Be under 160 characters
- Be a single sentence
- Sound like something an operator would say, not a textbook
- Create immediate recognition of the failure pattern

Return ONLY valid JSON array of strings: ["def 1", "def 2", "def 3"]`;

  const result = await callGemini(prompt);
  res.status(200).json({ definitions: result });
}

/**
 * Generate SEO title and meta description for a term.
 */
async function handleSEO(req, res) {
  const { name, definition, category } = req.body;
  if (!name) { res.status(400).json({ error: "name required" }); return; }

  const prompt = `Generate SEO metadata for this AI Operations Lexicon term page.

TERM: ${name}
DEFINITION: ${definition || ""}
CATEGORY: ${category || ""}

Generate:
1. SEO title (max 60 chars, include the term name)
2. Meta description (max 155 chars, compelling for search results)
3. 5 target keywords

Return ONLY valid JSON:
{"title": "", "description": "", "keywords": ["", "", "", "", ""]}`;

  const result = await callGemini(prompt);
  res.status(200).json({ seo: result });
}

/**
 * Generate a LinkedIn teaser post from a term.
 */
async function handleLinkedIn(req, res) {
  const { name, definition, explanation } = req.body;
  if (!name) { res.status(400).json({ error: "name required" }); return; }

  const prompt = `Write a LinkedIn post promoting this AI Operations Lexicon term by Hasan Jaffal.

TERM: ${name}
DEFINITION: ${definition || ""}
EXPLANATION: ${explanation || ""}

LINKEDIN RULES:
- Max 100 words
- First person ("I coined this term because...")
- Hook: bold, thought-provoking opening
- White space ladder: 1-2 sentences per paragraph, double-spaced
- Short lines (<12 words)
- Use 1-2 emojis sparingly
- End with a question that invites engagement
- 3-5 specific hashtags at the bottom
- Do NOT include any links (user adds in comments)
- Candid, confrontational, operator tone

Return ONLY valid JSON: {"post": "full linkedin post text with \\n for line breaks"}`;

  const result = await callGemini(prompt);
  res.status(200).json({ linkedin: result });
}

/**
 * Generate a Substack/newsletter note from a term.
 */
async function handleSubstackNote(req, res) {
  const { name, definition, explanation, example } = req.body;
  if (!name) { res.status(400).json({ error: "name required" }); return; }

  const prompt = `Write a short newsletter note (Substack Notes style) introducing this AI Operations Lexicon term by Hasan Jaffal.

TERM: ${name}
DEFINITION: ${definition || ""}
EXPLANATION: ${explanation || ""}
EXAMPLE: ${example || ""}

RULES:
- 50-80 words max
- Conversational, first person
- Sharp and direct
- End with "Full definition: hasanjaffal.com/lexicon/${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}/"
- No hashtags

Return ONLY valid JSON: {"note": "full note text"}`;

  const result = await callGemini(prompt);
  res.status(200).json({ note: result });
}

/**
 * Helper: call Gemini and parse JSON response.
 */
async function callGemini(prompt) {
  const { GoogleGenerativeAI } = require("@google/generative-ai");
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY.value());
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash", generationConfig: { responseMimeType: "application/json" } });
  const result = await model.generateContent(prompt);
  let raw = result.response.text().trim();
  if (raw.startsWith("```")) raw = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  return JSON.parse(raw);
}

module.exports = { manageLexicon };
