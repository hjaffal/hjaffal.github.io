const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const { Resend } = require("resend");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

const RESEND_API_KEY = defineSecret("RESEND_API_KEY");
const GEMINI_API_KEY = defineSecret("GEMINI_API_KEY");
const GITHUB_PAT = defineSecret("GITHUB_PAT");

// ===== POSTS MODULE EXPORTS =====
const { createPost } = require("./posts/create");
const { generatePost } = require("./posts/generate");
const { getPost } = require("./posts/get");
const { updatePost } = require("./posts/update");
const { manageDrafts } = require("./posts/drafts");

exports.createPost = createPost;
exports.generatePost = generatePost;
exports.getPost = getPost;
exports.updatePost = updatePost;
exports.manageDrafts = manageDrafts;

const { generateLinkedInPosts } = require("./posts/linkedin");
exports.generateLinkedInPosts = generateLinkedInPosts;

const { manageLexicon } = require("./posts/lexicon");
exports.manageLexicon = manageLexicon;

// ===== NEWSLETTER MODULE EXPORTS =====
const { subscribeNewsletter } = require("./newsletter/subscribe");
const { newsletterPreferences } = require("./newsletter/preferences");
const { sendNewsletter } = require("./newsletter/send");
const { trackOpen, trackClick } = require("./newsletter/tracking");
const { handleBounce } = require("./newsletter/bounce");
const { getAnalytics } = require("./newsletter/analytics");
const { manageSubscribers } = require("./newsletter/manage");
const { importSubscribers } = require("./newsletter/import");

exports.subscribeNewsletter = subscribeNewsletter;
exports.newsletterPreferences = newsletterPreferences;
exports.sendNewsletter = sendNewsletter;
exports.trackOpen = trackOpen;
exports.trackClick = trackClick;
exports.handleBounce = handleBounce;
exports.getAnalytics = getAnalytics;
exports.manageSubscribers = manageSubscribers;
exports.importSubscribers = importSubscribers;

const { trackDownload } = require("./newsletter/downloads");
exports.trackDownload = trackDownload;

const { listAssessments } = require("./newsletter/assessments");
exports.listAssessments = listAssessments;

const { backfillTokens } = require("./newsletter/backfill-tokens");
exports.backfillTokens = backfillTokens;

const VALID_BANDS = ["exposed", "adaptable", "harder_to_replace"];
const VALID_FAMILIES = [
  "data_analytics_bi", "operations_process_program", "manager_team_leader",
  "product_project_strategy", "admin_support_coordination",
  "marketing_content_communication", "technical_engineering", "other_not_sure"
];
const VALID_CATEGORIES = [
  "ai_literacy", "judgment", "decision_value", "problem_solving",
  "business_judgment", "future_proofing", "communication", "decision_judgment"
];

exports.sendFutureProofSkillsGuide = onRequest(
  { region: "europe-west1", cors: true, secrets: [RESEND_API_KEY] },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    const body = req.body.data || req.body;
    const { name, email, jobTitle, country, score, resultBand, jobFamily, weakestCategory, strongestCategory } = body;

    // Validate email
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ error: "Invalid email" });
      return;
    }

    // Validate score
    const scoreInt = parseInt(score);
    if (isNaN(scoreInt) || scoreInt < 0 || scoreInt > 36) {
      res.status(400).json({ error: "Invalid score" });
      return;
    }

    // Validate resultBand
    if (!VALID_BANDS.includes(resultBand)) {
      res.status(400).json({ error: "Invalid resultBand" });
      return;
    }

    // Validate jobFamily
    if (!VALID_FAMILIES.includes(jobFamily)) {
      res.status(400).json({ error: "Invalid jobFamily" });
      return;
    }

    // Validate categories
    if (!VALID_CATEGORIES.includes(weakestCategory)) {
      res.status(400).json({ error: "Invalid weakestCategory" });
      return;
    }
    if (!VALID_CATEGORIES.includes(strongestCategory)) {
      res.status(400).json({ error: "Invalid strongestCategory" });
      return;
    }

    // Format band for display
    const bandDisplay = resultBand.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
    const weakDisplay = weakestCategory.replace(/_/g, " ");
    const strongDisplay = strongestCategory.replace(/_/g, " ");

    // Build email HTML
    const htmlBody = `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;">
        <h1 style="font-size:22px;font-weight:800;color:#0F172A;margin:0 0 8px;">Your Future-Proof Skills Assessment Result</h1>
        <p style="font-size:14px;color:#64748B;margin:0 0 24px;">Here is your personalized result from the assessment.</p>

        <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:20px;margin-bottom:24px;">
          <p style="font-size:13px;color:#64748B;margin:0 0 4px;">Result</p>
          <p style="font-size:20px;font-weight:800;color:#9333EA;margin:0 0 12px;">${bandDisplay}</p>
          <p style="font-size:13px;color:#64748B;margin:0;">Score: <strong>${scoreInt} / 36</strong></p>
        </div>

        <div style="display:flex;gap:12px;margin-bottom:24px;">
          <div style="flex:1;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;padding:14px;margin-right:6px;">
            <p style="font-size:11px;color:#94A3B8;margin:0 0 4px;text-transform:uppercase;letter-spacing:0.05em;">Strongest</p>
            <p style="font-size:14px;font-weight:600;color:#0F172A;margin:0;">${strongDisplay}</p>
          </div>
          <div style="flex:1;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;padding:14px;margin-left:6px;">
            <p style="font-size:11px;color:#94A3B8;margin:0 0 4px;text-transform:uppercase;letter-spacing:0.05em;">Weakest</p>
            <p style="font-size:14px;font-weight:600;color:#0F172A;margin:0;">${weakDisplay}</p>
          </div>
        </div>

        <p style="font-size:14px;color:#334155;line-height:1.6;margin:0 0 24px;">
          AI is changing the skill floor. The safest skills are judgment, communication, business understanding, and AI literacy. People who only operate tools are increasingly exposed. People who own decisions, trade-offs, and escalation are harder to replace.
        </p>

        <a href="https://hasanjaffal.com/assets/pdf/future-proof-skills-guide.pdf" style="display:inline-block;padding:12px 24px;background:#0F172A;color:#ffffff;font-size:14px;font-weight:600;border-radius:6px;text-decoration:none;">Download the Full Guide (PDF)</a>

        <p style="font-size:12px;color:#94A3B8;margin:24px 0 0;">— Hasan Jaffal · hasanjaffal.com</p>
      </div>
    `;

    try {
      // Send guide email via Resend
      const resend = new Resend(RESEND_API_KEY.value());
      await resend.emails.send({
        from: "Hasan Jaffal <hasan@hasanjaffal.com>",
        to: email,
        cc: "jaftalks@gmail.com",
        subject: "Your Future-Proof Skills Assessment Result",
        html: htmlBody
      });

      // Store submission in Firestore
      await db.collection("skills_assessment_submissions").add({
        name: name || "",
        email: email,
        jobTitle: jobTitle || "",
        country: country || "",
        score: scoreInt,
        resultBand: resultBand,
        jobFamily: jobFamily,
        weakestCategory: weakestCategory,
        strongestCategory: strongestCategory,
        result: {
          bandDisplay: bandDisplay,
          weakDisplay: weakDisplay,
          strongDisplay: strongDisplay
        },
        submittedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      res.status(200).json({ result: "success" });
    } catch (err) {
      console.error("Send error:", err);
      res.status(500).json({ error: "Failed to send email" });
    }
  }
);


exports.sendContactMessage = onRequest(
  { region: "europe-west1", cors: true, secrets: [RESEND_API_KEY] },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    const body = req.body.data || req.body;
    const { name, email, message } = body;

    // Validate
    if (!name || typeof name !== "string" || name.length > 200) {
      res.status(400).json({ error: "Invalid name" });
      return;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ error: "Invalid email" });
      return;
    }
    if (!message || typeof message !== "string" || message.length > 5000) {
      res.status(400).json({ error: "Invalid message" });
      return;
    }

    const htmlBody = `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;padding:24px;">
        <h2 style="font-size:18px;color:#0F172A;margin:0 0 16px;">New message from hasanjaffal.com</h2>
        <table style="font-size:14px;color:#334155;border-collapse:collapse;width:100%;">
          <tr><td style="padding:8px 0;font-weight:600;width:80px;vertical-align:top;">From:</td><td style="padding:8px 0;">${name}</td></tr>
          <tr><td style="padding:8px 0;font-weight:600;vertical-align:top;">Email:</td><td style="padding:8px 0;"><a href="mailto:${email}">${email}</a></td></tr>
          <tr><td style="padding:8px 0;font-weight:600;vertical-align:top;">Message:</td><td style="padding:8px 0;white-space:pre-wrap;">${message}</td></tr>
        </table>
      </div>
    `;

    try {
      // Send contact message via Resend
      const resend = new Resend(RESEND_API_KEY.value());
      await resend.emails.send({
        from: "Website Contact <hasan@hasanjaffal.com>",
        to: "jaftalks@gmail.com",
        reply_to: email,
        subject: `Contact: ${name}`,
        html: htmlBody
      });

      // Store in Firestore
      await db.collection("contact_submissions").add({
        name: name,
        email: email,
        message: message,
        submittedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      res.status(200).json({ result: "success" });
    } catch (err) {
      console.error("Send error:", err);
      res.status(500).json({ error: "Failed to send" });
    }
  }
);




// ===== AI JOB RISK ANALYZER =====

const VALID_SENIORITY = [
  "entry_level", "specialist", "manager", "senior_manager",
  "director", "executive", "other"
];

const VALID_AI_CONCERN = [
  "job_automated", "skills_outdated", "team_no_ai",
  "company_too_fast", "company_too_slow", "dont_know_where_to_start"
];

const VALID_AI_USAGE = [
  "no_ai", "occasionally", "weekly", "daily", "manage_ai"
];

exports.analyzeJobRisk = onRequest(
  {
    region: "europe-west1",
    cors: true,
    timeoutSeconds: 120,
    memory: "512MiB",
    secrets: [RESEND_API_KEY, GEMINI_API_KEY]
  },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    const body = req.body.data || req.body;
    const {
      name, email, jobTitle, industry, seniority, country,
      mainTasks, aiConcern, aiUsage, skillsToLearn, consent, honeypot
    } = body;

    // Honeypot spam check
    if (honeypot) {
      res.status(200).json({ result: "success" });
      return;
    }

    // Validate consent
    if (!consent) {
      res.status(400).json({ error: "Consent is required" });
      return;
    }

    // Validate required fields
    if (!name || typeof name !== "string" || name.trim().length < 2 || name.length > 200) {
      res.status(400).json({ error: "Invalid name" });
      return;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ error: "Invalid email" });
      return;
    }
    if (!jobTitle || typeof jobTitle !== "string" || jobTitle.trim().length < 2 || jobTitle.length > 200) {
      res.status(400).json({ error: "Invalid job title" });
      return;
    }
    if (!industry || typeof industry !== "string" || industry.trim().length < 2 || industry.length > 200) {
      res.status(400).json({ error: "Invalid industry" });
      return;
    }
    if (!VALID_SENIORITY.includes(seniority)) {
      res.status(400).json({ error: "Invalid seniority" });
      return;
    }
    if (!country || typeof country !== "string" || country.trim().length < 2 || country.length > 100) {
      res.status(400).json({ error: "Invalid country" });
      return;
    }
    if (!mainTasks || typeof mainTasks !== "string" || mainTasks.trim().length < 10 || mainTasks.length > 2000) {
      res.status(400).json({ error: "Main tasks must be at least 10 characters" });
      return;
    }
    if (!VALID_AI_CONCERN.includes(aiConcern)) {
      res.status(400).json({ error: "Invalid AI concern" });
      return;
    }
    if (!VALID_AI_USAGE.includes(aiUsage)) {
      res.status(400).json({ error: "Invalid AI usage level" });
      return;
    }
    if (skillsToLearn && skillsToLearn.length > 1000) {
      res.status(400).json({ error: "Skills text too long" });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const firstName = name.trim().split(" ")[0];

    // 1. Generate Gemini analysis
    let analysis;
    try {
      const { GoogleGenerativeAI } = require("@google/generative-ai");
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY.value());
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const prompt = `You are an AI job risk analyst. Analyze the following professional profile and return a structured JSON assessment.

IMPORTANT RULES:
- Be practical and direct. Avoid hype and generic advice.
- Distinguish between task automation risk and full job replacement risk.
- Do not claim certainty. Use language like "likely," "may," "based on current trends."
- Do not provide legal, medical, or financial advice.
- Write in simple English.
- Return ONLY valid JSON, no markdown, no code fences.
- The 30-day plan MUST be specific to this person's actual role, industry, and tasks. Do NOT give generic advice like "learn AI" or "take a course." Reference their specific job title, tasks, and industry.
- Each exposed/protected task must include an exposure_pct (0-100) showing how automatable or protected it is.
- Skill gaps must include a priority level.

PROFILE:
- Name: ${name.trim()}
- Job title: ${jobTitle.trim()}
- Industry: ${industry.trim()}
- Seniority: ${seniority.replace(/_/g, " ")}
- Country/Region: ${country.trim()}
- Main tasks: ${mainTasks.trim()}
- Biggest AI concern: ${aiConcern.replace(/_/g, " ")}
- Current AI usage: ${aiUsage.replace(/_/g, " ")}
- Skills they want to build: ${skillsToLearn ? skillsToLearn.trim() : "Not specified"}

Return this exact JSON structure:
{
  "risk_score": <number 0-100>,
  "risk_level": "<Low|Medium|High>",
  "summary": "<2-3 sentence plain-English summary of their specific situation>",
  "breakdown": {
    "automation_exposure": <number 0-100>,
    "human_judgment_strength": <number 0-100>,
    "skill_gap_urgency": <number 0-100>,
    "action_readiness": <number 0-100>,
    "ai_literacy": <number 0-100>
  },
  "radar": {
    "ai_literacy": <number 0-100>,
    "judgment": <number 0-100>,
    "communication": <number 0-100>,
    "strategy": <number 0-100>,
    "technical": <number 0-100>,
    "leadership": <number 0-100>
  },
  "risk_distribution": {
    "exposed_pct": <number 0-100>,
    "moderate_pct": <number 0-100>,
    "protected_pct": <number 0-100>
  },
  "exposed_tasks": [
    {"task": "<specific task from their description>", "exposure_pct": <number 50-100>, "reason": "<why this task is exposed>"},
    {"task": "<task>", "exposure_pct": <number>, "reason": "<reason>"},
    {"task": "<task>", "exposure_pct": <number>, "reason": "<reason>"}
  ],
  "protected_tasks": [
    {"task": "<specific task>", "protection_pct": <number 60-100>, "judgment_area": "<Context|Accountability|Trade-offs|Ambiguity|Ethics|Stakeholders>"},
    {"task": "<task>", "protection_pct": <number>, "judgment_area": "<area>"},
    {"task": "<task>", "protection_pct": <number>, "judgment_area": "<area>"}
  ],
  "skill_gaps": [
    {"skill": "<specific skill gap>", "priority": "<HIGH|MEDIUM>", "action": "<one concrete first step>"},
    {"skill": "<skill>", "priority": "<priority>", "action": "<action>"},
    {"skill": "<skill>", "priority": "<priority>", "action": "<action>"}
  ],
  "recommended_skills": ["<skill to build>", "<skill>", "<skill>", "<skill>"],
  "thirty_day_plan": [
    {"week": 1, "title": "<short goal title specific to their role>", "actions": "<2-3 sentences of specific actions referencing their actual tasks, tools, and industry>", "output": "<what they should produce by end of week>"},
    {"week": 2, "title": "<title>", "actions": "<actions>", "output": "<output>"},
    {"week": 3, "title": "<title>", "actions": "<actions>", "output": "<output>"},
    {"week": 4, "title": "<title>", "actions": "<actions>", "output": "<output>"}
  ],
  "final_advice": "<2-3 sentences of direct, practical advice specific to their role and situation>"
}`;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text().trim();

      // Parse JSON from response (handle potential markdown fences)
      let jsonStr = responseText;
      if (jsonStr.startsWith("```")) {
        jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
      }
      analysis = JSON.parse(jsonStr);

      // Validate required fields exist
      if (!analysis.risk_score || !analysis.risk_level || !analysis.summary) {
        throw new Error("Incomplete Gemini response");
      }
    } catch (err) {
      console.error("Gemini error:", err.message);
      res.status(500).json({ error: "Analysis could not be generated. Please try again." });
      return;
    }

    // 2. Generate secure report token and save to Firestore
    const crypto = require("crypto");
    const reportToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(reportToken).digest("hex");
    const reportUrl = `https://hasanjaffal.com/tools/ai-job-risk-report/?token=${reportToken}`;

    try {
      // Store full report in Firestore
      await db.collection("job_risk_submissions").add({
        tokenHash: tokenHash,
        reportToken: reportToken,
        name: name.trim(),
        email: normalizedEmail,
        jobTitle: jobTitle.trim(),
        industry: industry.trim(),
        seniority: seniority,
        country: country.trim(),
        mainTasks: mainTasks.trim(),
        aiConcern: aiConcern,
        aiUsage: aiUsage,
        skillsToLearn: skillsToLearn || "",
        result: analysis,
        reportEmailSentAt: admin.firestore.FieldValue.serverTimestamp(),
        submittedAt: admin.firestore.FieldValue.serverTimestamp(),
        viewCount: 0
      });

      // 3. Send short summary email with CTA
      const resend = new Resend(RESEND_API_KEY.value());
      const riskColor = analysis.risk_level === "High" ? "#DC2626" :
                        analysis.risk_level === "Medium" ? "#D97706" : "#0D9488";
      const riskBg = analysis.risk_level === "High" ? "#FEF2F2" :
                     analysis.risk_level === "Medium" ? "#FEF3C7" : "#F0FDF4";

      const topExposed = (analysis.exposed_tasks || []).slice(0, 3);
      const topSkills = (analysis.recommended_skills || []).slice(0, 3);

      const exposedHtml = topExposed.map(t => {
        const taskName = typeof t === 'string' ? t : t.task;
        return `<tr><td style="padding:6px 0;font-size:13px;color:#334155;border-bottom:1px solid #F1F5F9;">⚠ ${taskName}</td></tr>`;
      }).join("");

      const skillsHtml = topSkills.map(s =>
        `<tr><td style="padding:6px 0;font-size:13px;color:#334155;border-bottom:1px solid #F1F5F9;">→ ${s}</td></tr>`
      ).join("");

      const htmlBody = `
<div style="background:#F4F7FB;padding:0;margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#F4F7FB;">
<tr><td align="center" style="padding:24px 16px;">
<table cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;width:100%;background:#FFFFFF;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(15,23,42,0.06);">

<!-- Header -->
<tr><td style="background:#0F172A;padding:24px 32px;border-bottom:3px solid #0D9488;">
  <p style="margin:0 0 2px;font-size:11px;font-weight:600;letter-spacing:0.15em;text-transform:uppercase;color:#0D9488;">HASAN JAFFAL</p>
  <p style="margin:0 0 4px;font-size:18px;font-weight:800;color:#F8FAFC;">Your AI Job Risk Report is Ready</p>
  <p style="margin:0;font-size:12px;color:#94A3B8;">Personalized analysis for ${firstName}</p>
</td></tr>

<!-- Score -->
<tr><td style="padding:32px;text-align:center;">
  <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 14px;">
    <tr><td style="width:88px;height:88px;border-radius:50%;border:6px solid ${riskColor};text-align:center;vertical-align:middle;line-height:76px;">
      <span style="font-size:36px;font-weight:800;color:#0F172A;">${analysis.risk_score}</span>
    </td></tr>
  </table>
  <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 12px;">
    <tr><td style="padding:5px 14px;background:${riskBg};border-radius:16px;">
      <span style="font-size:12px;font-weight:700;color:${riskColor};">● ${analysis.risk_level.toUpperCase()} RISK</span>
    </td></tr>
  </table>
  <p style="margin:0;font-size:13px;color:#64748B;line-height:1.5;max-width:420px;margin:0 auto;">${analysis.summary}</p>
</td></tr>

<!-- Exposed Tasks -->
<tr><td style="padding:0 32px 24px;">
  <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#DC2626;">TOP EXPOSED TASKS</p>
  <table cellpadding="0" cellspacing="0" border="0" width="100%">${exposedHtml}</table>
</td></tr>

<!-- Recommended Skills -->
<tr><td style="padding:0 32px 28px;">
  <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#0D9488;">SKILLS TO BUILD</p>
  <table cellpadding="0" cellspacing="0" border="0" width="100%">${skillsHtml}</table>
</td></tr>

<!-- CTA -->
<tr><td style="padding:24px 32px;text-align:center;background:#F8FAFC;border-top:1px solid #E2E8F0;">
  <p style="margin:0 0 16px;font-size:14px;font-weight:600;color:#0F172A;">Your full interactive dashboard is ready.</p>
  <a href="${reportUrl}" style="display:inline-block;padding:14px 32px;background:#0D9488;color:#ffffff;font-size:14px;font-weight:700;border-radius:8px;text-decoration:none;">View Your Full AI Risk Dashboard →</a>
  <p style="margin:14px 0 0;font-size:11px;color:#94A3B8;">Includes detailed charts, skill gap analysis, and your 30-day action plan.</p>
</td></tr>

<!-- Footer -->
<tr><td style="padding:24px 32px;border-top:1px solid #E2E8F0;text-align:center;">
  <p style="margin:0 0 8px;font-size:12px;color:#64748B;line-height:1.5;">I write about where AI, data, dashboards, and leadership fail in real operations — and what professionals can do about it.</p>
  <a href="https://hasanjaffal.com/writing/" style="font-size:12px;color:#0D9488;font-weight:600;text-decoration:none;">Read more on hasanjaffal.com →</a>
  <p style="margin:16px 0 0;font-size:10px;color:#94A3B8;">You received this because you used the AI Job Risk Analyzer.<br>This report is private to ${normalizedEmail}.</p>
</td></tr>

</table>
</td></tr>
</table>
</div>`;

      await resend.emails.send({
        from: "Hasan Jaffal <hasan@hasanjaffal.com>",
        to: normalizedEmail,
        cc: "jaftalks@gmail.com",
        subject: `Your AI Job Risk Score: ${analysis.risk_score}/100 — ${analysis.risk_level} Risk`,
        html: htmlBody
      });

      res.status(200).json({ result: "success", reportToken: reportToken });

      // 4. Auto-subscribe to newsletter (main_website segment) — uses shared utilities
      try {
        const { generateUnsubscribeToken, normalizeEmail: normEmail, detectBot } = require("./newsletter/utils");

        // Bot check on the email
        const botCheck = detectBot({ email: normalizedEmail });
        if (!botCheck.isBot) {
          const cleanEmail = normEmail(normalizedEmail);
          const subscribersRef = db.collection("subscribers");
          const existingSnapshot = await subscribersRef
            .where("email", "==", cleanEmail)
            .limit(1)
            .get();

          if (existingSnapshot.empty) {
            const { token: unsubToken, hash: unsubHash } = generateUnsubscribeToken();
            await subscribersRef.add({
              email: cleanEmail,
              name: name.trim(),
              status: "active",
              segments: ["main_website"],
              utmSource: "ai_job_risk_assessment",
              unsubscribeToken: unsubToken,
              unsubscribeTokenHash: unsubHash,
              subscribedAt: admin.firestore.FieldValue.serverTimestamp(),
              reactivatedAt: null,
              unsubscribedAt: null,
              welcomeEmailFailed: false,
              softBounceCount: 0,
              softBounces: [],
              bounceReason: null,
              bouncedAt: null,
              complainedAt: null,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
          }
        }
        // If already exists or is bot, don't modify
      } catch (subErr) {
        console.error("Auto-subscribe error (non-blocking):", subErr.message);
      }
    } catch (err) {
      console.error("Email send error:", err.message);
      res.status(500).json({ error: "Report could not be sent. Please try again." });
    }
  }
);

// v2 - added Firestore storage

// ===== RERUN JOB RISK ANALYSIS =====

exports.rerunJobRiskAnalysis = onRequest(
  {
    region: "europe-west1",
    cors: true,
    timeoutSeconds: 120,
    memory: "512MiB",
    secrets: [GEMINI_API_KEY]
  },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    const { token, updatedInputs } = req.body;
    if (!token || typeof token !== "string" || token.length !== 64) {
      res.status(400).json({ error: "Invalid token" });
      return;
    }

    const crypto = require("crypto");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    try {
      const snapshot = await db.collection("job_risk_submissions")
        .where("tokenHash", "==", tokenHash)
        .limit(1)
        .get();

      if (snapshot.empty) {
        res.status(404).json({ error: "Report not found" });
        return;
      }

      const doc = snapshot.docs[0];
      const data = doc.data();

      // Merge updated inputs if provided
      const inputs = {
        name: (updatedInputs && updatedInputs.name) || data.name,
        jobTitle: (updatedInputs && updatedInputs.jobTitle) || data.jobTitle,
        industry: (updatedInputs && updatedInputs.industry) || data.industry,
        seniority: (updatedInputs && updatedInputs.seniority) || data.seniority,
        country: (updatedInputs && updatedInputs.country) || data.country,
        mainTasks: (updatedInputs && updatedInputs.mainTasks) || data.mainTasks,
        aiConcern: (updatedInputs && updatedInputs.aiConcern) || data.aiConcern,
        aiUsage: (updatedInputs && updatedInputs.aiUsage) || data.aiUsage,
        skillsToLearn: (updatedInputs && updatedInputs.skillsToLearn) || data.skillsToLearn || ""
      };

      // Rerun Gemini with inputs
      const { GoogleGenerativeAI } = require("@google/generative-ai");
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY.value());
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const prompt = `You are an AI job risk analyst. Analyze the following professional profile and return a structured JSON assessment.

IMPORTANT RULES:
- Be practical and direct. Avoid hype and generic advice.
- Distinguish between task automation risk and full job replacement risk.
- Do not claim certainty. Use language like "likely," "may," "based on current trends."
- Do not provide legal, medical, or financial advice.
- Write in simple English.
- Return ONLY valid JSON, no markdown, no code fences.
- The 30-day plan MUST be specific to this person's actual role, industry, and tasks. Do NOT give generic advice like "learn AI" or "take a course." Reference their specific job title, tasks, and industry.
- Each exposed/protected task must include an exposure_pct (0-100) showing how automatable or protected it is.
- Skill gaps must include a priority level.

PROFILE:
- Name: ${inputs.name}
- Job title: ${inputs.jobTitle}
- Industry: ${inputs.industry}
- Seniority: ${(inputs.seniority || "").replace(/_/g, " ")}
- Country/Region: ${inputs.country}
- Main tasks: ${inputs.mainTasks}
- Biggest AI concern: ${(inputs.aiConcern || "").replace(/_/g, " ")}
- Current AI usage: ${(inputs.aiUsage || "").replace(/_/g, " ")}
- Skills they want to build: ${inputs.skillsToLearn || "Not specified"}

Return this exact JSON structure:
{
  "risk_score": <number 0-100>,
  "risk_level": "<Low|Medium|High>",
  "summary": "<2-3 sentence plain-English summary of their specific situation>",
  "breakdown": {
    "automation_exposure": <number 0-100>,
    "human_judgment_strength": <number 0-100>,
    "skill_gap_urgency": <number 0-100>,
    "action_readiness": <number 0-100>,
    "ai_literacy": <number 0-100>
  },
  "radar": {
    "ai_literacy": <number 0-100>,
    "judgment": <number 0-100>,
    "communication": <number 0-100>,
    "strategy": <number 0-100>,
    "technical": <number 0-100>,
    "leadership": <number 0-100>
  },
  "risk_distribution": {
    "exposed_pct": <number 0-100>,
    "moderate_pct": <number 0-100>,
    "protected_pct": <number 0-100>
  },
  "exposed_tasks": [
    {"task": "<specific task from their description>", "exposure_pct": <number 50-100>, "reason": "<why this task is exposed>"},
    {"task": "<task>", "exposure_pct": <number>, "reason": "<reason>"},
    {"task": "<task>", "exposure_pct": <number>, "reason": "<reason>"}
  ],
  "protected_tasks": [
    {"task": "<specific task>", "protection_pct": <number 60-100>, "judgment_area": "<Context|Accountability|Trade-offs|Ambiguity|Ethics|Stakeholders>"},
    {"task": "<task>", "protection_pct": <number>, "judgment_area": "<area>"},
    {"task": "<task>", "protection_pct": <number>, "judgment_area": "<area>"}
  ],
  "skill_gaps": [
    {"skill": "<specific skill gap>", "priority": "<HIGH|MEDIUM>", "action": "<one concrete first step>"},
    {"skill": "<skill>", "priority": "<priority>", "action": "<action>"},
    {"skill": "<skill>", "priority": "<priority>", "action": "<action>"}
  ],
  "recommended_skills": ["<skill to build>", "<skill>", "<skill>", "<skill>"],
  "thirty_day_plan": [
    {"week": 1, "title": "<short goal title specific to their role>", "actions": "<2-3 sentences of specific actions referencing their actual tasks, tools, and industry>", "output": "<what they should produce by end of week>"},
    {"week": 2, "title": "<title>", "actions": "<actions>", "output": "<output>"},
    {"week": 3, "title": "<title>", "actions": "<actions>", "output": "<output>"},
    {"week": 4, "title": "<title>", "actions": "<actions>", "output": "<output>"}
  ],
  "final_advice": "<2-3 sentences of direct, practical advice specific to their role and situation>"
}`;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text().trim();
      let jsonStr = responseText;
      if (jsonStr.startsWith("```")) {
        jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
      }
      const analysis = JSON.parse(jsonStr);

      if (!analysis.risk_score || !analysis.risk_level || !analysis.summary) {
        throw new Error("Incomplete Gemini response");
      }

      // Update Firestore with new result and inputs
      await doc.ref.update({
        name: inputs.name,
        jobTitle: inputs.jobTitle,
        industry: inputs.industry,
        seniority: inputs.seniority,
        country: inputs.country,
        mainTasks: inputs.mainTasks,
        aiConcern: inputs.aiConcern,
        aiUsage: inputs.aiUsage,
        skillsToLearn: inputs.skillsToLearn,
        result: analysis,
        lastRerunAt: admin.firestore.FieldValue.serverTimestamp(),
        submittedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Return updated report
      res.status(200).json({
        name: inputs.name,
        jobTitle: inputs.jobTitle,
        industry: inputs.industry,
        seniority: inputs.seniority,
        country: inputs.country,
        result: analysis,
        inputs: {
          mainTasks: inputs.mainTasks,
          aiConcern: inputs.aiConcern,
          aiUsage: inputs.aiUsage,
          skillsToLearn: inputs.skillsToLearn
        },
        submittedAt: new Date().toISOString(),
        viewCount: data.viewCount || 0
      });
    } catch (err) {
      console.error("Rerun error:", err.message);
      res.status(500).json({ error: "Analysis could not be regenerated. Please try again." });
    }
  }
);

// ===== GET JOB RISK REPORT (token-based access) =====

exports.getJobRiskReport = onRequest(
  { region: "europe-west1", cors: true },
  async (req, res) => {
    if (req.method !== "GET" && req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    const token = req.query.token || (req.body && req.body.token);
    if (!token || typeof token !== "string" || token.length !== 64) {
      res.status(400).json({ error: "Invalid or missing token" });
      return;
    }

    const crypto = require("crypto");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    try {
      const snapshot = await db.collection("job_risk_submissions")
        .where("tokenHash", "==", tokenHash)
        .limit(1)
        .get();

      if (snapshot.empty) {
        res.status(404).json({ error: "Report not found" });
        return;
      }

      const doc = snapshot.docs[0];
      const data = doc.data();

      // Update view tracking
      await doc.ref.update({
        lastViewedAt: admin.firestore.FieldValue.serverTimestamp(),
        viewCount: admin.firestore.FieldValue.increment(1)
      });

      // Return report data (exclude sensitive fields like tokenHash, email)
      res.status(200).json({
        name: data.name,
        jobTitle: data.jobTitle,
        industry: data.industry,
        seniority: data.seniority,
        country: data.country,
        result: data.result,
        inputs: {
          mainTasks: data.mainTasks || "",
          aiConcern: data.aiConcern || "",
          aiUsage: data.aiUsage || "",
          skillsToLearn: data.skillsToLearn || ""
        },
        submittedAt: data.submittedAt ? data.submittedAt.toDate().toISOString() : null,
        lastViewedAt: data.lastViewedAt ? data.lastViewedAt.toDate().toISOString() : null,
        viewCount: (data.viewCount || 0) + 1
      });
    } catch (err) {
      console.error("Get report error:", err.message);
      res.status(500).json({ error: "Could not load report" });
    }
  }
);


// ===== SHARE TOOL WITH FRIEND =====

exports.shareToolWithFriend = onRequest(
  { region: "europe-west1", cors: true, secrets: [RESEND_API_KEY] },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    const body = req.body.data || req.body;
    const { friendName, friendEmail, senderName } = body;

    if (!friendName || typeof friendName !== "string" || friendName.trim().length < 2 || friendName.length > 200) {
      res.status(400).json({ error: "Invalid name" });
      return;
    }
    if (!friendEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(friendEmail)) {
      res.status(400).json({ error: "Invalid email" });
      return;
    }

    const firstName = friendName.trim().split(" ")[0];
    const sender = senderName ? senderName.trim() : "Someone";

    const htmlBody = `
<div style="background:#F4F7FB;padding:0;margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#F4F7FB;">
<tr><td align="center" style="padding:24px 16px;">
<table cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;width:100%;background:#FFFFFF;border-radius:12px;overflow:hidden;">

<tr><td style="background:#0F172A;padding:24px 32px;border-bottom:3px solid #0D9488;">
  <p style="margin:0 0 4px;font-size:18px;font-weight:800;color:#F8FAFC;">You've been invited to try something</p>
  <p style="margin:0;font-size:12px;color:#94A3B8;">${sender} thinks you should check this out</p>
</td></tr>

<tr><td style="padding:32px;">
  <p style="margin:0 0 16px;font-size:14px;color:#334155;line-height:1.6;">Hi ${firstName},</p>
  <p style="margin:0 0 16px;font-size:14px;color:#334155;line-height:1.6;">${sender} used the <strong>AI Job Risk Analyzer</strong> and thought you'd find it useful too.</p>
  <p style="margin:0 0 24px;font-size:14px;color:#334155;line-height:1.6;">It's a free tool that analyzes your job role and tells you which tasks are most exposed to AI automation, what skills to build, and gives you a personalized 30-day action plan.</p>
  <a href="https://hasanjaffal.com/ai-job-risk-analyzer/" style="display:inline-block;padding:14px 28px;background:#0D9488;color:#ffffff;font-size:14px;font-weight:700;border-radius:8px;text-decoration:none;">Try the AI Job Risk Analyzer →</a>
  <p style="margin:20px 0 0;font-size:12px;color:#94A3B8;">Takes 3 minutes. Full report by email. Free.</p>
</td></tr>

<tr><td style="padding:20px 32px;border-top:1px solid #E2E8F0;text-align:center;">
  <p style="margin:0;font-size:10px;color:#94A3B8;">Sent via hasanjaffal.com · You received this because ${sender} shared this tool with you.</p>
</td></tr>

</table>
</td></tr>
</table>
</div>`;

    try {
      const resend = new Resend(RESEND_API_KEY.value());
      await resend.emails.send({
        from: "Hasan Jaffal <hasan@hasanjaffal.com>",
        to: friendEmail.trim().toLowerCase(),
        subject: `${sender} thinks you should try this AI tool`,
        html: htmlBody
      });

      // Store referral
      await db.collection("tool_referrals").add({
        senderName: sender,
        friendName: friendName.trim(),
        friendEmail: friendEmail.trim().toLowerCase(),
        tool: "ai_job_risk_analyzer",
        sentAt: admin.firestore.FieldValue.serverTimestamp()
      });

      res.status(200).json({ result: "success" });
    } catch (err) {
      console.error("Share error:", err.message);
      res.status(500).json({ error: "Could not send invite" });
    }
  }
);


// ===== GENERATE ROLE TASKS =====

exports.generateRoleTasks = onRequest(
  {
    region: "europe-west1",
    cors: true,
    timeoutSeconds: 30,
    secrets: [GEMINI_API_KEY]
  },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    const body = req.body.data || req.body;
    const { jobTitle, industry, seniority, country } = body;

    if (!jobTitle || !industry || !seniority) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    try {
      const { GoogleGenerativeAI } = require("@google/generative-ai");
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY.value());
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const prompt = `List 10-15 typical daily tasks for a ${seniority.replace(/_/g, " ")} ${jobTitle} working in ${industry}${country ? " in " + country : ""}. 

Return ONLY a JSON array of short task descriptions. Each task should be 5-12 words. Be specific to this role and industry. Do not include generic tasks like "attend meetings" unless they are specific to the role.

Example format: ["Review daily sales reports", "Approve team expense claims", "Present KPIs to leadership"]

Return ONLY the JSON array, no markdown, no explanation.`;

      const result = await model.generateContent(prompt);
      let text = result.response.text().trim();
      if (text.startsWith("```")) {
        text = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
      }
      const tasks = JSON.parse(text);

      if (!Array.isArray(tasks) || tasks.length === 0) {
        throw new Error("Invalid response");
      }

      res.status(200).json({ tasks: tasks.slice(0, 15) });
    } catch (err) {
      console.error("Generate tasks error:", err.message);
      res.status(500).json({ error: "Could not generate tasks" });
    }
  }
);
