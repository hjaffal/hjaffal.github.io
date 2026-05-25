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

CONTENT RULES:
- The article must explore the ANGLE specifically. Do not write a generic piece about the position.
- Include one concrete workplace example or scenario (not hypothetical — make it feel real).
- Include one uncomfortable trade-off that the reader must face.
- Explain what strong teams do differently from average teams.
- End with one forced-position question that makes the reader choose a side.
- Do NOT repeat the same structure as previous posts. Vary your opening, your examples, and your conclusions.

WRITING RULES:
- 700 to 1000 words.
- Short paragraphs (2-4 sentences max).
- No hype. No corporate buzzwords. No invented statistics.
- No labels like "Hook," "Insight," "Takeaway," or "Key Point."
- Use simple English. Write like an operator, not a consultant.
- The title must clearly state the argument. Make it SEO-friendly and specific.
- Bad title: "The Future of AI in Operations"
- Good title: "Why AI Projects Fail When Nobody Owns the Escalation Path"

DIVERSITY INSTRUCTIONS:
- If the tone is narrative, start with a scene or moment.
- If the tone is analytical, start with a claim and immediately support it.
- If the tone is contrarian, start by stating what most people believe, then disagree.
- If the tone is practical, start with the action and explain why after.
- Vary sentence length. Mix short punches with longer explanations.
- Do NOT use the same opening pattern as previous posts.

Return ONLY valid JSON:

{
  "title": "",
  "subtitle": "",
  "share_description": "",
  "tags": ["${selectedPosition.tag}"],
  "body": ""
}
`;

    try {
      const { GoogleGenerativeAI } = require("@google/generative-ai");
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY.value());
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const result = await model.generateContent(prompt);
      const raw = result.response.text().trim();

      // Parse JSON response (handle potential markdown fences)
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
        if (!match) {
          throw new Error("Model did not return valid JSON");
        }
        data = JSON.parse(match[0]);
      }

      // Force tags to [positionTag] regardless of model output
      const title = (data.title || "").trim();
      const subtitle = (data.subtitle || "").trim();
      const shareDescription = (data.share_description || data.shareDescription || "").trim();
      const body = (data.body || "").trim();

      if (!title || !body) {
        throw new Error("Generated content is missing title or body");
      }

      res.status(200).json({
        title,
        subtitle,
        shareDescription,
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
