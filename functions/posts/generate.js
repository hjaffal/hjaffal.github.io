const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const { verifyAdminToken } = require("../newsletter/auth");

const GEMINI_API_KEY = defineSecret("GEMINI_API_KEY");

// The 4 canonical positions — each post must use exactly one
const POSITIONS = [
  {
    tag: "ai-operations",
    position: "AI exposes weak operations",
    thesis: "AI does not repair unclear ownership, slow escalation, or broken workflows. It exposes them faster and at scale.",
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
    ],
  },
  {
    tag: "decision-authority",
    position: "Signals need authority",
    thesis: "A risk signal has no value if nobody can act on it. The best model loses when approval chains move slower than the threat.",
    angles: [
      "A real incident where detection worked but decision authority failed",
      "How to pre-commit decision rights before the next crisis",
      "The anatomy of a slow decision: where organizations lose time under risk",
      "Why dashboards create the illusion of control without the reality of action",
      "How to design a decision system that works at 2am with no manager online",
      "The cost of one extra approval step during a live fraud attack",
      "What military decision-making teaches us about operational risk response",
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
      "What loss prevention teams can teach data teams about actionable intelligence",
      "How to kill metrics that nobody acts on without losing organizational trust",
      "The intelligence loop: from signal to action to feedback in under 5 minutes",
      "Why your best analysts are wasted on reporting and how to fix it",
      "How to present risk intelligence to leaders who only understand dashboards",
    ],
  },
  {
    tag: "ai-and-work",
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
  "Tell a specific story from the field, then extract the principle",
  "Challenge a popular belief with a concrete counter-example",
  "Compare what average teams do vs what strong teams do — be specific",
  "Describe a decision framework and show how to apply it under pressure",
  "Explain the hidden cost of getting this wrong — use numbers or timelines",
  "Write a practical playbook: 5-7 steps an operator can follow this week",
  "Analyze a common failure pattern and explain the systemic root cause",
  "Make a prediction about what will change in the next 12 months and why",
  "Explain what leaders must stop doing immediately and what to do instead",
  "Describe the minimum viable version of a system that actually works",
];

const TONES = [
  "Direct and blunt. No softening. Say the uncomfortable thing.",
  "Analytical and precise. Use structure. Show the logic.",
  "Narrative-driven. Start with a scene. Make the reader feel the pressure.",
  "Practical and operator-focused. Every paragraph must be actionable.",
  "Contrarian. Take the opposite position from conventional wisdom.",
];

const VALID_TAGS = ["ai-operations", "decision-authority", "risk-intelligence", "ai-and-work"];

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
    const { positionTag } = body;

    // Validate positionTag
    if (!positionTag || !VALID_TAGS.includes(positionTag)) {
      res.status(400).json({ error: "Invalid positionTag. Must be one of: " + VALID_TAGS.join(", ") });
      return;
    }

    // Look up position data
    const selectedPosition = POSITIONS.find((p) => p.tag === positionTag);

    // Randomly select angle, form, tone
    const selectedAngle = selectedPosition.angles[Math.floor(Math.random() * selectedPosition.angles.length)];
    const selectedForm = ARTICLE_FORMS[Math.floor(Math.random() * ARTICLE_FORMS.length)];
    const selectedTone = TONES[Math.floor(Math.random() * TONES.length)];

    // Recent titles — Cloud Functions don't have filesystem access to _posts/
    const recentTitlesText = "None";

    // Build the prompt (identical structure to generate_post.py)
    const prompt = `
Write one original blog post for Hasan Jaffal.

POSITION: ${selectedPosition.position}
THESIS: ${selectedPosition.thesis}
ANGLE: ${selectedAngle}
FORM: ${selectedForm}
TONE: ${selectedTone}

TAG (use exactly this): ${selectedPosition.tag}

AVOID these recent titles — do NOT repeat similar ideas:
${recentTitlesText}

AUDIENCE:
Leaders and professionals in AI, data, analytics, operations, risk, security, loss prevention, and decision-making.

VOICE AND IDENTITY:
You are writing as Hasan Jaffal — a data and business intelligence leader who writes from real operational experience. Not a consultant. Not a thought leader performing insight. Someone who has sat in the meetings, built the dashboards, watched the decisions fail, and learned what actually works.

CONTENT RULES:
- The article must explore the ANGLE specifically. Do not write a generic piece about the position.
- Include one concrete workplace moment — a meeting, a dashboard review, a failed escalation, a report nobody read. Make it feel lived, not invented.
- Include one uncomfortable trade-off that the reader must face.
- Show what stronger teams or operators do differently.
- End with a practical takeaway and a natural call to action (not a slogan).
- Do NOT repeat the same structure as previous posts.

ARTICLE FLOW:
1. Open with a concrete workplace observation — something you noticed, something that went wrong, something that surprised you.
2. Show why the common view is incomplete or wrong.
3. Make the sharper argument — the thing most people avoid saying.
4. Use one specific example from analytics, dashboards, AI, operations, risk, meetings, reports, decisions, or leadership.
5. Explain the hidden failure point — the thing that breaks when nobody is watching.
6. Show what stronger people or teams do differently.
7. End with a practical takeaway and a natural CTA.

WRITING STYLE — HASAN JAFFAL:
- Direct, calm, and sharp. Never loud. Never performative.
- Practical before philosophical. Show the work before the principle.
- Uses tension between systems and people. Technology fails because of humans, not despite them.
- Often challenges the common belief first, then builds the real argument.
- Prefers "what actually happens at work" over theory.
- Characteristic phrases (use sparingly and naturally, not in every post):
  - "That is the weak point."
  - "The title is not the risk. The task shape is."
  - "Busy is not the same as protected."
  - "The dashboard is not the decision."
  - "AI does not remove the need for judgment. It exposes where judgment was missing."

WRITING RULES:
- 700 to 1000 words.
- Paragraphs of 3-5 sentences mostly. Allow occasional shorter paragraphs (1-2 sentences) for emphasis, but do not overuse them.
- Natural variation in sentence length. Mix short punches with longer explanatory sentences. Do not make every sentence the same length.
- Avoid mechanical paragraph rhythm. Not every paragraph should be the same size or follow the same pattern.
- Avoid repeated paragraph openings. Do not start consecutive paragraphs with the same word or structure.
- Avoid list-heavy writing unless the idea genuinely requires a list.
- No hype. No corporate buzzwords. No invented statistics.
- No labels like "Hook," "Insight," "Takeaway," or "Key Point."
- No motivational language. No consultant-style filler.
- No generic AI phrases like "in today's rapidly evolving landscape" or "it's important to note that."
- Use plain language. Write like someone explaining something to a sharp colleague, not presenting to a board.
- Include small moments of uncertainty, tension, or self-correction. Show the thinking process, not only the conclusion.
- The title must clearly state the argument. Make it SEO-friendly and specific.
  - Bad title: "The Future of AI in Operations"
  - Good title: "Why AI Projects Fail When Nobody Owns the Escalation Path"
- ALWAYS start the body with a concrete observation or moment that hooks the reader. Not a definition. Not a question. A scene, a tension, or a claim that makes them lean in.

REVISION PASS (apply before returning):
After drafting, revise once to:
- Remove any generic phrases that could appear in any article.
- Replace abstract statements with concrete examples.
- Smooth paragraph flow — no two paragraphs should feel like they were written independently.
- Reduce slogan-like one-line statements. If a short paragraph exists, it should earn its space.
- Make sure the article reads like it was written by someone with 10+ years of operational experience, not by someone summarizing a topic.
- Keep SEO terms natural, not forced.

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

CRITICAL JSON RULES:
- Return ONLY the JSON object. No text before or after.
- All string values must have newlines escaped as \\n
- All double quotes inside string values must be escaped as \\"
- The body field contains Markdown — escape all newlines and quotes properly.

FIELD RULES:
- "title": The post title. Clear, specific, SEO-friendly. Max 150 chars.
- "subtitle": A one-line subtitle expanding on the title. Used as share description if share_description is empty.
- "share_description": Social media / newsletter description. Max 160 chars. Punchy and curiosity-driven.
- "meta_title": SEO meta title for the page. Max 70 chars. Can differ from title — optimized for search.
- "excerpt": A 1-2 sentence teaser shown in post listings. Max 300 chars. Should make the reader want to click.
- "body": The full post in Markdown. 700-1000 words. Must follow the writing style and article flow above.
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
