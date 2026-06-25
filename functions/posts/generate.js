const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const { verifyAdminToken } = require("../newsletter/auth");
const { buildPrompt, checkForbiddenPhrases, checkWordCount, countInternalLinks } = require("./prompt-builder");

const GEMINI_API_KEY = defineSecret("GEMINI_API_KEY");

// Positions with Layer 2 topics
const POSITIONS = [
  {
    tag: "ai-decision-operations",
    position: "AI exposes weak operations and slow decisions",
    thesis: "AI does not repair unclear ownership or slow approval chains. It exposes them faster and at scale. Signals need authority — detection without decision power is expensive noise.",
    topics: [
      { slug: "ai-theater", name: "AI Theater", keywords: ["AI transformation failure", "fake AI adoption", "AI theater"] },
      { slug: "fake-ai-transformation", name: "Fake AI Transformation", keywords: ["digital transformation failure", "AI hype cycle"] },
      { slug: "slow-decision-cultures", name: "Slow Decision Cultures", keywords: ["slow decisions", "decision latency", "approval chains"] },
      { slug: "ai-accountability-vacuum", name: "AI Accountability Vacuum", keywords: ["AI accountability", "AI ownership gap"] },
      { slug: "automation-failure-loops", name: "Automation Failure Loops", keywords: ["automation failure", "AI amplifying problems"] },
      { slug: "human-bottleneck-myth", name: "Human Bottleneck Myth", keywords: ["human in the loop", "AI bottleneck"] },
      { slug: "ai-governance-bureaucracy", name: "AI Governance Bureaucracy", keywords: ["AI governance", "AI committee", "AI red tape"] },
      { slug: "meeting-driven-operations", name: "Meeting-Driven Operations", keywords: ["too many meetings", "meeting culture"] },
      { slug: "escalation-collapse", name: "Escalation Collapse", keywords: ["escalation failure", "escalation path", "risk escalation"] },
      { slug: "operational-cowardice", name: "Operational Cowardice", keywords: ["operational cowardice", "avoiding decisions"] },
    ],
  },
  {
    tag: "risk-intelligence",
    position: "Reporting is not intelligence",
    thesis: "Reporting explains what happened. Intelligence changes what happens next. If metrics do not trigger action, they are decoration.",
    topics: [
      { slug: "dashboard-addiction", name: "Dashboard Addiction", keywords: ["dashboard problems", "too many dashboards", "dashboard overload"] },
      { slug: "kpi-theater", name: "KPI Theater", keywords: ["vanity metrics", "KPI problems", "useless KPIs"] },
      { slug: "reporting-bureaucracy", name: "Reporting Bureaucracy", keywords: ["reporting overhead", "too many reports"] },
      { slug: "alert-spam", name: "Alert Spam", keywords: ["alert fatigue", "too many alerts", "false positives"] },
      { slug: "data-without-ownership", name: "Data Without Ownership", keywords: ["data ownership", "data accountability"] },
      { slug: "false-confidence-metrics", name: "False Confidence Metrics", keywords: ["misleading metrics", "false confidence"] },
      { slug: "vanity-analytics", name: "Vanity Analytics", keywords: ["vanity analytics", "useless analytics"] },
      { slug: "intelligence-vs-reporting", name: "Intelligence vs Reporting", keywords: ["reporting vs intelligence", "actionable intelligence"] },
      { slug: "data-team-irrelevance", name: "Data Team Irrelevance", keywords: ["data team value", "analytics team relevance"] },
      { slug: "metric-manipulation", name: "Metric Manipulation", keywords: ["gaming metrics", "Goodhart's law"] },
    ],
  },
  {
    tag: "ai-job-risk",
    position: "AI is changing the skill floor",
    thesis: "AI exposes people who only operate tools. The safer skillset is judgment: setting thresholds, owning trade-offs, and knowing when to escalate.",
    topics: [
      { slug: "white-collar-automation", name: "White-Collar Automation", keywords: ["AI replacing office jobs", "white collar automation"] },
      { slug: "fake-ai-safety-advice", name: "Fake AI Safety Advice", keywords: ["AI career advice", "AI proof career"] },
      { slug: "productivity-trap", name: "Productivity Trap", keywords: ["productivity trap", "AI efficiency trap"] },
      { slug: "middle-management-exposure", name: "Middle Management Exposure", keywords: ["middle management AI", "AI replacing managers"] },
      { slug: "collapse-of-busy-work", name: "The Collapse of Busy Work", keywords: ["busy work disappearing", "routine work automation"] },
      { slug: "prompt-engineer-hype", name: "Prompt Engineer Hype", keywords: ["prompt engineering", "prompt engineer career"] },
      { slug: "knowledge-worker-oversupply", name: "Knowledge Worker Oversupply", keywords: ["too many analysts", "knowledge worker surplus"] },
      { slug: "credential-irrelevance", name: "Credential Irrelevance", keywords: ["degrees losing value", "credentials vs skills"] },
      { slug: "ai-career-delusion", name: "AI Career Delusion", keywords: ["AI career planning", "career delusion"] },
      { slug: "death-of-information-work", name: "The Death of Information Work", keywords: ["information work dying", "AI replacing information workers"] },
    ],
  },
];

const VALID_TAGS = ["ai-decision-operations", "risk-intelligence", "ai-job-risk"];

const ARCHETYPES = [
  { id: "contrarian", instruction: "Attack a common belief with a concrete counter-example. State what most people believe, then disagree with evidence." },
  { id: "framework", instruction: "Create a named, original framework (give it a memorable name like 'The 4-Lever System' or 'The Threshold Control Model'). Structure it as a precise decision tool — NOT general guidelines. MUST include: (1) A clear, branded name for the framework. (2) A markdown table showing inputs, conditions, or decision criteria with specific values/thresholds. (3) Numbered steps with exact actions (not vague advice). (4) At least one 'if X then Y' decision rule. (5) A concrete before/after contrast showing weak approach vs. this framework applied. The reader should be able to print this and use it in their next meeting." },
  { id: "breakdown", instruction: "Analyze a real or fictional operational failure. Start with the scene, show what went wrong, extract the principle." },
  { id: "prediction", instruction: "Predict organizational or workforce shifts. Make a specific claim about what will change in the next 12 months and why." },
  { id: "listicle", instruction: "Structure the article as a numbered list (5-10 items). Each item gets a bold heading, a 2-3 sentence explanation, and one concrete example or consequence. The list must have a unifying thesis — not just a collection. Open with why the list matters, close with a forced-choice question. Title format: 'N [Things/Signs/Reasons/Ways] ...' — the number sets reader expectations and improves CTR." },
];

const CONTENT_MIX = [
  { id: "confrontation", instruction: "Aggressive, provocative, challenges the reader directly. Makes them uncomfortable." },
  { id: "practical", instruction: "Useful, actionable, operator-focused. Every paragraph must be actionable." },
  { id: "predictive", instruction: "Forward-looking, trend-based, makes specific predictions about what changes next." },
  { id: "humor", instruction: "Light, observational, dry sarcasm about workplace absurdity. Still makes a point." },
];

const TONES = [
  "Direct and blunt. No softening. Say the uncomfortable thing.",
  "Analytical and precise. Use structure. Show the logic.",
  "Narrative-driven. Start with a scene. Make the reader feel the pressure.",
  "Practical and operator-focused. Every paragraph must be actionable.",
  "Contrarian. Take the opposite position from conventional wisdom.",
  "Light but still authoritative. Dry humor with a sharp point.",
];

/**
 * Extract fields manually from malformed JSON using regex.
 */
function extractFieldsManually(text) {
  function extractField(name) {
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

  function extractBody() {
    const bodyStart = text.indexOf('"body"');
    if (bodyStart === -1) return '';
    const colonPos = text.indexOf(':', bodyStart);
    if (colonPos === -1) return '';
    const quoteStart = text.indexOf('"', colonPos + 1);
    if (quoteStart === -1) return '';
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
    topic: extractField('topic'),
    archetype: extractField('archetype'),
    body: extractBody(),
  };
}

/**
 * generatePost Cloud Function
 * Generates a blog post using Gemini with full writing guide enforcement.
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

    try {
      await verifyAdminToken(req);
    } catch (err) {
      res.status(err.statusCode || 401).json({ error: err.message || "Unauthorized" });
      return;
    }

    const body = req.body.data || req.body;
    const {
      positionTag,
      existingTitles,
      existingTopics,
      existingKeywords,
      topic: requestedTopic,
      archetype: requestedArchetype,
      contentMix: requestedContentMix,
      techniques: requestedTechniques,
      tone: requestedTone,
    } = body;

    // Validate positionTag
    if (!positionTag || !VALID_TAGS.includes(positionTag)) {
      res.status(400).json({ error: "Invalid positionTag. Must be one of: " + VALID_TAGS.join(", ") });
      return;
    }

    const selectedPosition = POSITIONS.find((p) => p.tag === positionTag);

    // Select topic (requested or random)
    let selectedTopic = null;
    if (requestedTopic) {
      selectedTopic = selectedPosition.topics.find(t => t.slug === requestedTopic);
    }
    if (!selectedTopic) {
      // Pick a topic not already heavily covered
      const availableTopics = selectedPosition.topics.filter(t => {
        return !(existingTopics || []).includes(t.slug);
      });
      const pool = availableTopics.length > 0 ? availableTopics : selectedPosition.topics;
      selectedTopic = pool[Math.floor(Math.random() * pool.length)];
    }

    // Select archetype
    let archetypeInstruction = "";
    if (requestedArchetype) {
      const found = ARCHETYPES.find(a => a.id === requestedArchetype);
      archetypeInstruction = found ? found.instruction : requestedArchetype;
    } else {
      const picked = ARCHETYPES[Math.floor(Math.random() * ARCHETYPES.length)];
      archetypeInstruction = picked.instruction;
    }

    // Select content mix
    let contentMixInstruction = "";
    if (requestedContentMix) {
      const found = CONTENT_MIX.find(c => c.id === requestedContentMix);
      contentMixInstruction = found ? found.instruction : requestedContentMix;
    } else {
      const picked = CONTENT_MIX[Math.floor(Math.random() * CONTENT_MIX.length)];
      contentMixInstruction = picked.instruction;
    }

    // Select tone
    const selectedTone = requestedTone || TONES[Math.floor(Math.random() * TONES.length)];

    // Select techniques
    const selectedTechniques = (requestedTechniques && requestedTechniques.length >= 2)
      ? requestedTechniques
      : [];

    // Build the prompt
    const prompt = buildPrompt({
      position: selectedPosition,
      topic: selectedTopic,
      archetype: archetypeInstruction,
      contentMix: contentMixInstruction,
      techniques: selectedTechniques,
      tone: selectedTone,
      existingTitles: existingTitles || [],
      existingTopics: existingTopics || [],
      existingKeywords: existingKeywords || [],
    });

    // Generate with retry for forbidden phrases
    let data = null;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      attempts++;

      try {
        const { GoogleGenerativeAI } = require("@google/generative-ai");
        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY.value());
        const model = genAI.getGenerativeModel({
          model: "gemini-2.5-flash",
          generationConfig: { responseMimeType: "application/json" }
        });

        const result = await model.generateContent(prompt);
        const raw = result.response.text().trim();

        // Parse JSON
        let jsonStr = raw;
        if (jsonStr.startsWith("```")) {
          jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
        }

        try {
          data = JSON.parse(jsonStr);
        } catch (parseErr) {
          const match = jsonStr.match(/\{[\s\S]*\}/);
          if (match) {
            try { data = JSON.parse(match[0]); } catch (e) {
              data = extractFieldsManually(match[0] || jsonStr);
            }
          } else {
            data = extractFieldsManually(jsonStr);
          }
          if (!data || (!data.title && !data.body)) {
            throw new Error("Model did not return valid JSON: " + parseErr.message);
          }
        }

        // Validate forbidden phrases
        const articleBody = (data.body || "").trim();
        const forbidden = checkForbiddenPhrases(articleBody);
        if (forbidden.length > 0 && attempts < maxAttempts) {
          console.warn(`Attempt ${attempts}: Found forbidden phrases: ${forbidden.join(", ")}. Retrying...`);
          data = null;
          continue;
        }

        break; // Success
      } catch (err) {
        if (attempts >= maxAttempts) {
          console.error("generatePost error:", err.message);
          res.status(500).json({ error: "Failed to generate post. Please try again." });
          return;
        }
      }
    }

    if (!data) {
      res.status(500).json({ error: "Failed to generate clean content after " + maxAttempts + " attempts." });
      return;
    }

    // Extract and validate
    const title = (data.title || "").trim();
    const articleBody = (data.body || "").trim();

    if (!title || !articleBody) {
      res.status(500).json({ error: "Generated content is missing title or body" });
      return;
    }

    // Word count and link checks (non-blocking, included in response)
    const wordCheck = checkWordCount(articleBody);
    const internalLinkCount = countInternalLinks(articleBody);

    res.status(200).json({
      title,
      subtitle: (data.subtitle || "").trim(),
      shareDescription: (data.share_description || data.shareDescription || "").trim(),
      metaTitle: (data.meta_title || data.metaTitle || "").trim(),
      excerpt: (data.excerpt || "").trim(),
      tldr: (data.tldr || "").trim(),
      tags: [positionTag],
      topic: data.topic || selectedTopic.slug,
      archetype: data.archetype || requestedArchetype || "",
      keywords: data.keywords || selectedTopic.keywords,
      body: articleBody,
      external_reference: data.external_reference || null,
      editorial_checklist: data.editorial_checklist || null,
      _meta: {
        wordCount: wordCheck.count,
        wordCountValid: wordCheck.valid,
        internalLinks: internalLinkCount,
        forbiddenPhrases: checkForbiddenPhrases(articleBody),
        attempts: attempts,
      },
    });
  }
);

module.exports = { generatePost };
