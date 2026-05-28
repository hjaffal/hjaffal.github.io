const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const { verifyAdminToken } = require("../newsletter/auth");

const GEMINI_API_KEY = defineSecret("GEMINI_API_KEY");

// The 4 canonical positions — each post must use exactly one
const POSITIONS = [
  {
    tag: "ai-decision-operations",
    position: "AI exposes weak operations and slow decisions",
    thesis: "AI does not repair unclear ownership or slow approval chains. It exposes them faster and at scale. Signals need authority — detection without decision power is expensive noise.",
    angles: [
      "A specific failure where AI amplified a broken process instead of fixing it",
      "How to audit your operating model before deploying AI",
      "The difference between AI-ready and AI-dependent organizations",
      "Why AI projects fail in operations: the process gap nobody talks about",
      "What happens when you deploy a model into a team with no escalation path",
      "The operating model checklist: what must be true before AI adds value",
      "How strong teams use AI as a stress test for their workflows",
      "Why the best AI teams spend 80% of their time on process, not models",
      "The hidden cost of deploying AI into unclear ownership structures",
      "How to design AI-assisted operations that degrade gracefully under pressure",
      "How to pre-commit decision rights before the next crisis",
      "The anatomy of a slow decision: where organizations lose time under risk",
      "Why dashboards create the illusion of control without the reality of action",
      "How to design a decision system that works at 2am with no manager online",
      "The cost of one extra approval step during a live fraud attack",
      "How to measure decision latency and why it matters more than model accuracy",
      "The difference between a status update and a decision meeting",
      "Why the person who sees the signal should be the person who pulls the lever",
    ],
  },
  {
    tag: "risk-intelligence",
    position: "Reporting is not intelligence",
    thesis: "Reporting explains what happened. Intelligence changes what happens next. If metrics do not trigger action, they are decoration.",
    angles: [
      "How to convert a weekly report into an intelligence product",
      "The 3 questions every metric must answer to qualify as intelligence",
      "Why most dashboards are museums: pretty, historical, and useless under pressure",
      "How to build a risk intelligence function from a reporting team",
      "The difference between a metric that informs and a metric that triggers",
      "How to kill metrics that nobody acts on without losing organizational trust",
      "The intelligence loop: from signal to action to feedback in under 5 minutes",
      "Why your best analysts are wasted on reporting and how to fix it",
      "How to present risk intelligence to leaders who only understand dashboards",
    ],
  },
  {
    tag: "ai-job-risk",
    position: "AI is changing the skill floor",
    thesis: "AI exposes people who only operate tools. The safer skillset is judgment: setting thresholds, owning trade-offs, and knowing when to escalate.",
    angles: [
      "The specific tasks AI is removing from analyst roles right now",
      "What 'judgment work' actually looks like in practice — concrete examples",
      "How to transition from tool operator to decision shaper in 6 months",
      "Why the middle layer of knowledge work is the most exposed to AI",
      "The new career moat: owning outcomes, not outputs",
      "How AI changes what 'senior' means in analytics and operations",
      "What hiring managers actually look for now that AI handles the basics",
      "The uncomfortable conversation: which roles on your team are exposed",
      "How to build a career around judgment when AI handles execution",
      "Why the best operators will use AI as leverage, not as a replacement for thinking",
    ],
  },
];

const ARTICLE_FORMS = [
  "Answer a specific reader question with one example",
  "Challenge one weak assumption and explain the better view",
  "Explain one workplace failure pattern and one fix",
  "Compare the common mistake with the stronger behavior",
  "Give one practical decision rule the reader can use this week",
  "Explain one risk signal people usually miss",
  "Write a short field note from an operator's perspective",
];

const TONES = [
  "Direct and practical, but not heavy",
  "Sharp but readable",
  "Calm, useful, and concise",
  "Operator-style field note",
  "Question-led and human",
  "Light but still authoritative",
];

const VALID_TAGS = ["ai-decision-operations", "risk-intelligence", "ai-job-risk"];

/**
 * Extract fields manually from malformed JSON using regex.
 * Handles cases where the body field contains unescaped characters.
 */
function extractFieldsManually(text) {
  function extractField(name) {
    // Match "fieldName": "value" — handle multiline values by being greedy up to the next field or closing brace
    const patterns = [
      new RegExp('"' + name + '"\\s*:\\s*"([^"]*(?:\\\\.[^"]*)*)"', 's'),
      new RegExp('"' + name + '"\\s*:\\s*"([\\s\\S]*?)(?:"\\s*[,}])', 's'),
    ];
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
      }
    }
    return '';
  }

  // For body, use a special extraction since it's the longest field and likely the one breaking JSON
  function extractBody() {
    const bodyStart = text.indexOf('"body"');
    if (bodyStart === -1) return '';
    const colonPos = text.indexOf(':', bodyStart);
    if (colonPos === -1) return '';
    const quoteStart = text.indexOf('"', colonPos + 1);
    if (quoteStart === -1) return '';

    // Find the closing quote — it's the last " before the final } or before "tags"
    // Walk backwards from the end
    let end = text.lastIndexOf('}');
    let quoteEnd = text.lastIndexOf('"', end);
    if (quoteEnd <= quoteStart) quoteEnd = text.length - 2;

    const raw = text.substring(quoteStart + 1, quoteEnd);
    return raw.replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
  }

  return {
    title: extractField('title'),
    subtitle: extractField('subtitle'),
    share_description: extractField('share_description'),
    meta_title: extractField('meta_title'),
    excerpt: extractField('excerpt'),
    body: extractBody(),
  };
}

/**
 * generatePost Cloud Function
 * POST handler for AI post generation using Gemini.
 *
 * Accepts a positionTag, builds a prompt mirroring scripts/generate_post.py,
 * calls Gemini gemini-2.5-flash, and returns generated post content.
 *
 * Requirements: 8.8, 8.9, 8.10, 8.11
 */
const generatePost = onRequest(
  {
    region: "europe-west1",
    cors: true,
    timeoutSeconds: 120,
    memory: "512MiB",
    secrets: [GEMINI_API_KEY],
  },
  async (req, res) => {
    if (req.method !== "POST") {
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

    const body = req.body.data || req.body;
    const { positionTag, existingTitles, angle: requestedAngle, articleForm: requestedForm, tone: requestedTone } = body;

    // Validate positionTag
    if (!positionTag || !VALID_TAGS.includes(positionTag)) {
      res.status(400).json({ error: "Invalid positionTag. Must be one of: " + VALID_TAGS.join(", ") });
      return;
    }

    // Look up position data
    const selectedPosition = POSITIONS.find((p) => p.tag === positionTag);

    // Pick an angle that hasn't been covered yet (based on existing titles)
    // Use fuzzy matching: if an existing title contains key words from an angle, skip it
    let availableAngles = selectedPosition.angles.slice();
    if (Array.isArray(existingTitles) && existingTitles.length > 0) {
      const titlesLower = existingTitles.map(t => (t || '').toLowerCase());
      availableAngles = selectedPosition.angles.filter(function(angle) {
        // Extract key phrases from the angle (words > 4 chars)
        const keywords = angle.toLowerCase().split(/\s+/).filter(w => w.length > 4);
        // If 3+ keywords from this angle appear in any existing title, consider it used
        return !titlesLower.some(function(title) {
          const matches = keywords.filter(kw => title.includes(kw));
          return matches.length >= 3;
        });
      });
      // If all angles are used, reset to full list
      if (availableAngles.length === 0) availableAngles = selectedPosition.angles.slice();
    }

    const selectedAngle = requestedAngle || availableAngles[Math.floor(Math.random() * availableAngles.length)];
    const selectedForm = requestedForm || ARTICLE_FORMS[Math.floor(Math.random() * ARTICLE_FORMS.length)];
    const selectedTone = requestedTone || TONES[Math.floor(Math.random() * TONES.length)];

    // Build recent titles list from client-provided data
    const recentTitlesText = (Array.isArray(existingTitles) && existingTitles.length > 0)
      ? existingTitles.slice(0, 30).map(t => '- ' + t).join('\n')
      : "None";

    // Build the prompt
    const prompt = `
Write one original short blog post for Hasan Jaffal.

POSITION: ${selectedPosition.position}
THESIS: ${selectedPosition.thesis}
ANGLE: ${selectedAngle}
FORM: ${selectedForm}
TONE: ${selectedTone}
TAG (use exactly this): ${selectedPosition.tag}

EXISTING POSTS — do NOT repeat these topics or similar titles:
${recentTitlesText}

AUDIENCE:
Leaders and professionals in AI, data, analytics, operations, risk, and decision-making.

VOICE:
Hasan Jaffal — data and business intelligence leader writing from real operational experience. Sharp, practical, direct. Not a consultant. Not performative.

INTERNAL PLANNING (choose before writing, do not include in output):
- articleFormat: pick one from the formats below
- readerQuestion: the real question this answers
- mainTension: the uncomfortable truth
- concreteExample: one specific workplace scene
- practicalAction: one thing the reader can do this week
- writingTechniques: pick 2-4 from the techniques list
- CTA wording: vary from previous posts

ARTICLE FORMAT (pick one, do not use the same as recent posts):
1. Question Answer — reader question, direct answer, then nuance
2. Myth vs Reality — challenge a belief, show why it breaks, give the better view
3. Mistake and Fix — one common mistake, why it happens, how to fix it
4. Short Guide — compact explanation with 3-4 points (not a listicle)
5. Contrarian Take — sharp position against a common assumption, defended with an example

WRITING TECHNIQUES (use 2-4 per article, naturally):
- Analogy: explain a complex idea through a familiar comparison
- Contrast: show the weak way versus the stronger way side by side
- Strong verbs: replace weak verbs (make, do, use, have) with precise action verbs
- Imagery: add one concrete scene — a dashboard review, escalation meeting, risk review, status call
- Repetition: repeat one key phrase only if it helps the point land
- Clear writing: remove filler, cut abstract explanations, say it in fewer words
- Sentence variation: mix short punches with medium explanatory sentences
- Point of view: use "you" to bring the reader closer, or "I" for field notes

ARTICLE STRUCTURE:
1. Start with **Key takeaways:** in bulleted points (see rules below)
2. Open with a real reader question or workplace tension
3. Give the short answer early
4. Explain the main idea with one concrete example
5. Show the common mistake
6. Show what stronger operators do differently
7. One practical action for this week
8. Short natural CTA near the end

KEY TAKEAWAYS:
- Body MUST begin with: **Key takeaways:** followed by 2-3 sentences
- Summarize: main answer, why it matters, what to do
- Under 90 words. No bullets. Direct and useful.

LENGTH:
- Target: 500-600 words
- Absolute max: 700 words
- If over 700, rewrite shorter before returning

STYLE:
- Less explaining. Less buildup. No long philosophical sections.
- Paragraphs of 2-4 sentences. No blocks over 5 sentences.
- No repeated one-line paragraph pattern.
- Plain language. Fast pace.
- No hype. No buzzwords. No motivational language. No generic AI phrases.
- No labels like "Hook," "Insight," "Takeaway."
- Avoid repeating the same idea in different words.
- Avoid long conclusions.
- Do not feel like a rigid template. Vary shape across articles.
- Human like writing, not perfect robotic style

HEADLINE:
- Question or strong reader-centric statement
- Good: "Will AI Replace Data Analysts?" / "Why Reporting Does Not Make You a Decision Maker"
- Bad: "The Future of AI" / "Understanding AI Transformation"

CTA:
- One CTA only, near the end
- For AI Job Risk topics: "If you want to see where your own work is exposed, [take the AI Job Risk Assessment](/tools/ai-job-risk-assessment/)."
- Otherwise link to a related article or newsletter
- Keep it natural

QUALITY CHECKS:
- 500-600 words, under 7000?
- Starts with **Key takeaways:**?
- Answers a real question?
- Uses 2-4 writing techniques naturally?
- Does not feel templated?
- Does not repeat ideas?
- CTA appears once, feels natural?
- Correct position tag?
- Readable in 3-4 minutes?

Return ONLY valid JSON:

{
  "title": "",
  "subtitle": "",
  "share_description": "",
  "meta_title": "",
  "excerpt": "",
  "tags": ["${selectedPosition.tag}"],
  "body": ""
}

JSON RULES:
- Return ONLY the JSON object
- Escape newlines as \\n and quotes as \\"
- Body contains Markdown with proper escaping

FIELD RULES:
- "title": Question-led or reader-centric. SEO-friendly. Max 150 chars.
- "subtitle": One-line subtitle.
- "share_description": Social description. Max 160 chars.
- "meta_title": SEO title. Max 70 chars.
- "excerpt": 1-2 sentence teaser. Max 300 chars.
- "body": Markdown, 600-900 words, max 1,000. First paragraph: "**Key takeaways:**"
`;

    try {
      const { GoogleGenerativeAI } = require("@google/generative-ai");
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY.value());
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: {
          responseMimeType: "application/json"
        }
      });

      const result = await model.generateContent(prompt);
      const raw = result.response.text().trim();

      // Parse JSON response
      let jsonStr = raw;
      if (jsonStr.startsWith("```")) {
        jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
      }

      let data;
      try {
        data = JSON.parse(jsonStr);
      } catch (parseErr) {
        // Try to extract JSON from the response
        const match = jsonStr.match(/\{[\s\S]*\}/);
        if (match) {
          try {
            data = JSON.parse(match[0]);
          } catch (e) {
            // JSON is malformed (usually because body has unescaped chars)
            // Extract fields manually using regex
            data = extractFieldsManually(match[0] || jsonStr);
          }
        } else {
          data = extractFieldsManually(jsonStr);
        }
        if (!data || (!data.title && !data.body)) {
          throw new Error("Model did not return valid JSON: " + parseErr.message);
        }
      }

      // Force tags to [positionTag] regardless of model output
      const title = (data.title || "").trim();
      const subtitle = (data.subtitle || "").trim();
      const shareDescription = (data.share_description || data.shareDescription || "").trim();
      const metaTitle = (data.meta_title || data.metaTitle || "").trim();
      const excerpt = (data.excerpt || "").trim();
      const body = (data.body || "").trim();

      if (!title || !body) {
        throw new Error("Generated content is missing title or body");
      }

      res.status(200).json({
        title,
        subtitle,
        shareDescription,
        metaTitle,
        excerpt,
        tags: [positionTag],
        body,
      });
    } catch (err) {
      console.error("generatePost error:", err.message);
      res.status(500).json({ error: "Failed to generate post. Please try again." });
    }
  }
);

module.exports = { generatePost };
