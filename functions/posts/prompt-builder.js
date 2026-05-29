"use strict";

/**
 * Prompt Builder Module
 *
 * Assembles the complete AI generation prompt from parameters and writing guide config.
 * Used by both the Cloud Function (generate.js) and can be adapted for the Python script.
 */

// Writing guide config (hardcoded here since Cloud Functions can't read Jekyll _data/ files)
const CONFIG = {
  signature_beliefs: [
    "Visibility is not action.",
    "AI exposes weak management.",
    "Busy work is disappearing.",
    "Dashboards delay accountability.",
    "Reporting is not intelligence.",
    "Automation scales weak processes.",
    "AI increases signal speed faster than organizations can react.",
  ],

  signature_metaphors: [
    "radar systems", "pressure leaks", "digital battlefields", "mission control",
    "tripwires", "chain reactions", "fault lines", "black boxes", "traffic jams", "wildfire spread",
  ],

  forbidden_phrases: [
    "leverage", "unlock", "digital transformation", "revolutionary",
    "synergize", "game changer", "AI-powered solution",
  ],

  newsletter_cta: "Weekly writing on AI, risk, and decisions. How to use AI in operations and risk — and how AI is reshaping the skills that matter at work.",

  internal_links: {
    tools: [
      { url: "/ai-job-risk-analyzer/", name: "AI Job Risk Analyzer" },
      { url: "/future-proof-skills-assessment/", name: "Future-Proof Skills Assessment" },
    ],
    positions: [
      { url: "/positions/ai-decision-operations/", name: "AI & Decision Operations" },
      { url: "/positions/risk-intelligence/", name: "Risk Intelligence" },
      { url: "/positions/ai-job-risk/", name: "AI Job Risk" },
    ],
  },

  editorial_checklist: [
    "Fits one position",
    "Fits one topic",
    "Attacks a belief",
    "Creates tension",
    "Contains a memorable line",
    "Feels conversational",
    "Sounds human",
    "Avoids corporate tone",
    "Includes one operational example",
    "Includes one recommendation",
    "Includes one forced-position question",
    "Includes CTA",
    "Includes internal links (minimum 2)",
    "Includes one external reference",
    "Keyword naturally included",
    "Emotionally engaging",
    "Avoids duplication",
  ],
};

/**
 * Builds the complete generation prompt.
 *
 * @param {Object} params
 * @param {Object} params.position - {tag, position, thesis}
 * @param {Object} params.topic - {slug, name, keywords} or null for random
 * @param {string} params.archetype - Archetype instruction or empty for random
 * @param {string} params.contentMix - Content mix instruction or empty for random
 * @param {string[]} params.techniques - Selected writing techniques (2-4) or empty for random
 * @param {string} params.tone - Tone instruction or empty for random
 * @param {string[]} params.existingTitles - Recent titles for dedup
 * @param {string[]} params.existingTopics - Topics already covered
 * @param {string[]} params.existingKeywords - Keywords already targeted
 * @returns {string} Complete prompt
 */
function buildPrompt(params) {
  const {
    position, topic, archetype, contentMix, techniques, tone,
    existingTitles, existingTopics, existingKeywords
  } = params;

  const recentTitlesText = (existingTitles && existingTitles.length > 0)
    ? existingTitles.slice(0, 30).map(t => "- " + t).join("\n")
    : "None";

  const existingTopicsText = (existingTopics && existingTopics.length > 0)
    ? existingTopics.join(", ")
    : "None";

  const existingKeywordsText = (existingKeywords && existingKeywords.length > 0)
    ? existingKeywords.join(", ")
    : "None";

  const topicSection = topic
    ? `LAYER 2 TOPIC: ${topic.name}\nTOPIC KEYWORDS (use naturally): ${topic.keywords.join(", ")}`
    : "LAYER 2 TOPIC: Choose the most relevant from the position's topics.";

  const archetypeSection = archetype || "Choose the best archetype for this angle.";
  const contentMixSection = contentMix || "Choose the appropriate content mix type.";
  const techniquesSection = (techniques && techniques.length > 0)
    ? techniques.join(", ")
    : "Choose 2-4 from the techniques list below.";
  const toneSection = tone || "Choose the most appropriate tone.";

  // Pick internal links relevant to this position
  const otherPositions = CONFIG.internal_links.positions.filter(p => !p.url.includes(position.tag));
  const tools = CONFIG.internal_links.tools;
  const availableLinks = [...otherPositions, ...tools].map(l => `[${l.name}](${l.url})`).join(", ");

  return `You are writing as Hasan Jaffal — a data and business intelligence leader who writes from real operational experience. You are a strategist, operator, and sharp observer.

=== CONTENT PARAMETERS ===

POSITION: ${position.position}
THESIS: ${position.thesis}
TAG: ${position.tag}
${topicSection}
ARCHETYPE: ${archetypeSection}
CONTENT MIX: ${contentMixSection}
TONE: ${toneSection}
WRITING TECHNIQUES TO USE: ${techniquesSection}

=== AUDIENCE ===

Primary readers: professionals worried AI may replace their work, managers adopting AI into operations, executives understanding operational AI risk, analytics professionals, operations leaders, risk professionals.
Mix: 20% beginners, 50% AI-aware professionals, 30% advanced operators.
Geography: United States, Europe.
Reader transformation goal: from passive information worker → to operational decision-maker in the AI era.

=== VOICE & BRAND ===

Voice: Provocative, emotionally charged, conversational, direct, humorous at times, aggressive toward weak thinking.
Allowed criticism targets: consultants, BI teams, reporting bureaucracy, AI theater, meeting culture, generic AI advice.

Conversational rules:
- Use contractions (don't, won't, it's, that's)
- Use simple language, not academic
- Ask questions directly to the reader
- Use "you" to address the reader
- Inject personality and dry sarcasm
- Use dark workplace humor
- Sound like an operator-strategist, not a consultant or marketer
- NEVER sound like polished corporate marketing

Controlled imperfection (CRITICAL):
- Allow occasional repetition, abrupt paragraphs, incomplete transitions, blunt statements
- Allow slightly messy conversational flow — this is thinking out loud, not a white paper
- FORBIDDEN: perfect rhythm, over-structured prose, excessive polish, AI-generated smoothness, professional ghostwriter tone
- The writing must feel human, slightly imperfect, and direct

=== SIGNATURE ELEMENTS ===

Weave in at least ONE of these beliefs naturally (don't force it):
${CONFIG.signature_beliefs.map(b => "- " + b).join("\n")}

Use at least ONE of these metaphors naturally:
${CONFIG.signature_metaphors.map(m => "- " + m).join("\n")}

=== ARTICLE STRUCTURE (follow this order) ===

1. HOOK — Opening that creates immediate tension or curiosity (1-2 sentences)
2. ANSWER BLOCK — 40-60 words that directly answer the article's core question. Clear, no fluff, keyword included. This helps AI systems extract a direct answer.
3. TENSION — The uncomfortable truth or conflict (why this matters, what most people get wrong)
4. CONSEQUENCE — What happens if the reader ignores this (make it concrete and operational)
5. RECOMMENDATION — What to do about it (one concrete operational example, fictional company/manager allowed)
6. FORCED-POSITION QUESTION — A question that makes the reader choose a side (no neutral answer possible)
7. CTA — Newsletter subscription: "${CONFIG.newsletter_cta}"

=== LENGTH & FORMATTING ===

- Target: 500-600 words. Absolute max: 700. If over 700, rewrite shorter.
- Short paragraphs: 2-4 sentences max. No blocks over 5 sentences.
- Use subheadings (##) to break up content — at least 2-3 subheadings
- Use bullet lists where they add clarity
- Include at least ONE comparison table or contrast block (e.g., "Weak teams do X. Strong teams do Y.")
- No dense text blocks. Highly scannable.

=== SEO REQUIREMENTS ===

- Include 1 primary keyword and 2-3 secondary keywords naturally
- Primary keyword MUST appear in: title, first paragraph, and at least one subheading
- Title structure: SEO + curiosity hybrid (e.g., "AI Is Replacing Reporting Jobs Faster Than Most Analysts Expect")
- Title must clearly state the argument. Max 150 chars.

=== INTERNAL LINKS (minimum 2) ===

Include at least 2 internal links as markdown links in the body:
Available links: ${availableLinks}
Choose the most relevant ones for this article's topic.

=== EXTERNAL REFERENCE (required) ===

Include exactly 1 external reference — a real study, report, news event, or credible source.
Preferred sources: workforce reports, AI adoption studies, operational failures, layoffs, governance failures, automation incidents, public company decisions.
Format as a markdown link in the body text. Use a real, verifiable source.

=== FICTIONAL EXAMPLES ===

You may use fictional companies, managers, incidents, meetings, and operational failures.
Make them feel realistic and operational. Do not repeat characters from previous posts.

=== DUPLICATION PREVENTION ===

Do NOT repeat these recent titles or similar arguments:
${recentTitlesText}

Topics already covered (avoid same topic): ${existingTopicsText}
Keywords already targeted (use different ones): ${existingKeywordsText}

If overlap exists with any of the above, force a completely new angle, keyword, and argument.

=== FORBIDDEN ===

NEVER use these phrases: ${CONFIG.forbidden_phrases.join(", ")}

NEVER write: coding tutorials, generic AI news, generic productivity advice, startup content, motivational content, generic leadership content, "AI will change everything" fluff, buzzword-heavy corporate writing.

=== WRITING TECHNIQUES (use 2-4 naturally) ===

- Contrast: show the weak way versus the stronger way
- Metaphors & Analogies: explain complex ideas through familiar comparisons
- Imagery: add one concrete scene (dashboard review, escalation meeting, risk review)
- Strong verbs: replace weak verbs (make, do, use, have) with precise action verbs
- Repetition: repeat one key phrase only if it helps the point land
- Foreshadowing: hint at what's coming
- Pattern interrupts: break expected rhythm with a short punch
- Narrative hooks: open with a scene that pulls the reader in
- Open loops: raise a question early, answer it later
- Tension escalation: build pressure toward a climax
- Short punch sentences: one sentence. Full stop. Impact.
- Counterintuitive claims: state something that sounds wrong but is defensible
- Story framing: wrap the insight inside a narrative
- Forced choice questions: ask a question requiring the reader to pick a side

=== QUALITY SELF-CHECK ===

After writing, evaluate the article against this 17-item editorial checklist.
Return pass/fail for each item in the editorial_checklist field:
${CONFIG.editorial_checklist.map((item, i) => (i + 1) + ". " + item).join("\n")}

=== OUTPUT FORMAT ===

Return ONLY valid JSON with this exact structure:

{
  "title": "SEO + curiosity hybrid title, max 150 chars",
  "subtitle": "One-line subtitle",
  "share_description": "Social sharing description, max 160 chars",
  "meta_title": "SEO title, max 70 chars",
  "excerpt": "1-2 sentence teaser, max 300 chars",
  "tags": ["${position.tag}"],
  "topic": "${topic ? topic.slug : ""}",
  "archetype": "${archetype ? archetype.split(' ')[0].toLowerCase() : ""}",
  "keywords": ["primary keyword", "secondary keyword 1", "secondary keyword 2"],
  "body": "Full markdown article body with internal links, external reference, comparison block, subheadings",
  "external_reference": {"title": "Source title", "url": "https://...", "source": "Organization name"},
  "editorial_checklist": {
    "score": "X/17",
    "items": [
      {"name": "Fits one position", "passed": true},
      {"name": "...", "passed": true}
    ]
  }
}

JSON RULES:
- Return ONLY the JSON object, no markdown fences
- Escape newlines as \\n and quotes as \\" in string values
- Body contains Markdown with proper escaping
- All 17 checklist items must be included in editorial_checklist.items`;
}

/**
 * Validates generated content against forbidden phrases.
 * @param {string} body - The generated article body
 * @returns {string[]} Array of found forbidden phrases (empty if clean)
 */
function checkForbiddenPhrases(body) {
  const bodyLower = body.toLowerCase();
  return CONFIG.forbidden_phrases.filter(phrase => bodyLower.includes(phrase.toLowerCase()));
}

/**
 * Validates word count is within bounds.
 * @param {string} body - The generated article body
 * @returns {{count: number, valid: boolean}}
 */
function checkWordCount(body) {
  const count = body.trim().split(/\s+/).length;
  return { count, valid: count >= 450 && count <= 750 };
}

/**
 * Counts internal links in the body.
 * @param {string} body - The generated article body
 * @returns {number}
 */
function countInternalLinks(body) {
  const matches = body.match(/\[.*?\]\(\/.*?\)/g);
  return matches ? matches.length : 0;
}

module.exports = { buildPrompt, checkForbiddenPhrases, checkWordCount, countInternalLinks, CONFIG };
