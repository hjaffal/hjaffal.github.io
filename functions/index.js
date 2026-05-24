const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const { Resend } = require("resend");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

const RESEND_API_KEY = defineSecret("RESEND_API_KEY");
const BEEHIIV_API_KEY = defineSecret("BEEHIIV_API_KEY");
const BEEHIIV_PUBLICATION_ID = defineSecret("BEEHIIV_PUBLICATION_ID");
const GEMINI_API_KEY = defineSecret("GEMINI_API_KEY");

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
  { region: "europe-west1", cors: true, secrets: [RESEND_API_KEY, BEEHIIV_API_KEY, BEEHIIV_PUBLICATION_ID] },
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
      // Subscribe to Beehiiv newsletter
      const beehiivRes = await fetch(
        `https://api.beehiiv.com/v2/publications/${BEEHIIV_PUBLICATION_ID.value()}/subscriptions`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${BEEHIIV_API_KEY.value()}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            email: email,
            reactivate_existing: true,
            send_welcome_email: true,
            utm_source: "skills_assessment",
            double_opt_override: "off"
          })
        }
      );
      if (!beehiivRes.ok) {
        console.error("Beehiiv subscription error:", await beehiivRes.text());
      }

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
  { region: "europe-west1", cors: true, secrets: [RESEND_API_KEY, BEEHIIV_API_KEY, BEEHIIV_PUBLICATION_ID] },
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
      // Subscribe to Beehiiv newsletter
      const beehiivRes = await fetch(
        `https://api.beehiiv.com/v2/publications/${BEEHIIV_PUBLICATION_ID.value()}/subscriptions`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${BEEHIIV_API_KEY.value()}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            email: email,
            reactivate_existing: true,
            send_welcome_email: true,
            utm_source: "contact_form",
            double_opt_override: "off"
          })
        }
      );
      if (!beehiivRes.ok) {
        console.error("Beehiiv subscription error:", await beehiivRes.text());
      }

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


exports.subscribeNewsletter = onRequest(
  { region: "europe-west1", cors: true, secrets: [BEEHIIV_API_KEY, BEEHIIV_PUBLICATION_ID] },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    const body = req.body.data || req.body;
    const { email, utm_source } = body;

    // Validate email
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ error: "Invalid email" });
      return;
    }

    try {
      const beehiivRes = await fetch(
        `https://api.beehiiv.com/v2/publications/${BEEHIIV_PUBLICATION_ID.value()}/subscriptions`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${BEEHIIV_API_KEY.value()}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            email: email,
            reactivate_existing: true,
            send_welcome_email: true,
            utm_source: utm_source || "website",
            double_opt_override: "off"
          })
        }
      );

      if (!beehiivRes.ok) {
        const errBody = await beehiivRes.text();
        console.error("Beehiiv subscription error:", errBody);
        res.status(500).json({ error: "Subscription failed" });
        return;
      }

      // Store in Firestore
      await db.collection("newsletter_subscriptions").add({
        email: email,
        utmSource: utm_source || "website",
        subscribedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      res.status(200).json({ result: "success" });
    } catch (err) {
      console.error("Subscribe error:", err);
      res.status(500).json({ error: "Subscription failed" });
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
    secrets: [RESEND_API_KEY, BEEHIIV_API_KEY, BEEHIIV_PUBLICATION_ID, GEMINI_API_KEY]
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

    // 1. Subscribe to Beehiiv
    try {
      const beehiivRes = await fetch(
        `https://api.beehiiv.com/v2/publications/${BEEHIIV_PUBLICATION_ID.value()}/subscriptions`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${BEEHIIV_API_KEY.value()}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            email: normalizedEmail,
            reactivate_existing: true,
            send_welcome_email: true,
            utm_source: "job_risk_analyzer",
            double_opt_override: "off"
          })
        }
      );
      if (!beehiivRes.ok) {
        console.error("Beehiiv error:", await beehiivRes.text());
      }
    } catch (err) {
      console.error("Beehiiv subscription failed:", err.message);
    }

    // 2. Generate Gemini analysis
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
  "summary": "<2-3 sentence plain-English summary of their situation>",
  "exposed_tasks": ["<task most exposed to AI>", "<task>", "<task>"],
  "protected_tasks": ["<task where human judgment still matters>", "<task>", "<task>"],
  "skill_gaps": ["<missing or weak skill>", "<skill>", "<skill>"],
  "recommended_skills": ["<skill to build>", "<skill>", "<skill>", "<skill>"],
  "thirty_day_plan": [
    "Week 1: <specific action>",
    "Week 2: <specific action>",
    "Week 3: <specific action>",
    "Week 4: <specific action>"
  ],
  "final_advice": "<1-2 sentences of direct, practical advice>"
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

    // 3. Send email with results
    try {
      const resend = new Resend(RESEND_API_KEY.value());

      const riskColor = analysis.risk_level === "High" ? "#DC2626" :
                        analysis.risk_level === "Medium" ? "#D97706" : "#16A34A";

      const listItems = (arr) => arr && arr.length > 0
        ? arr.map(item => `<li style="padding:4px 0;font-size:14px;color:#334155;">${item}</li>`).join("")
        : "<li style='padding:4px 0;font-size:14px;color:#94A3B8;'>None identified</li>";

      const htmlBody = `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;">
          <h1 style="font-size:22px;font-weight:800;color:#0F172A;margin:0 0 8px;">Your AI Job Risk Report</h1>
          <p style="font-size:14px;color:#64748B;margin:0 0 28px;">Hi ${firstName}, here is your personalized analysis.</p>

          <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:24px;margin-bottom:24px;">
            <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:16px;"><tr>
              <td style="width:56px;height:56px;border-radius:50%;background:${riskColor};text-align:center;vertical-align:middle;">
                <span style="font-size:18px;font-weight:800;color:#fff;">${analysis.risk_score}</span>
              </td>
              <td style="padding-left:16px;vertical-align:middle;">
                <p style="font-size:12px;color:#64748B;margin:0 0 2px;text-transform:uppercase;letter-spacing:0.05em;">Risk Level</p>
                <p style="font-size:20px;font-weight:800;color:${riskColor};margin:0;">${analysis.risk_level}</p>
              </td>
            </tr></table>
            <p style="font-size:14px;color:#334155;line-height:1.6;margin:0;">${analysis.summary}</p>
          </div>

          <h2 style="font-size:15px;font-weight:700;color:#0F172A;margin:24px 0 8px;">Tasks Most Exposed to AI</h2>
          <ul style="padding-left:18px;margin:0 0 20px;">${listItems(analysis.exposed_tasks)}</ul>

          <h2 style="font-size:15px;font-weight:700;color:#0F172A;margin:24px 0 8px;">Tasks Where Human Judgment Still Matters</h2>
          <ul style="padding-left:18px;margin:0 0 20px;">${listItems(analysis.protected_tasks)}</ul>

          <h2 style="font-size:15px;font-weight:700;color:#0F172A;margin:24px 0 8px;">Skill Gaps</h2>
          <ul style="padding-left:18px;margin:0 0 20px;">${listItems(analysis.skill_gaps)}</ul>

          <h2 style="font-size:15px;font-weight:700;color:#0F172A;margin:24px 0 8px;">Recommended Skills to Build</h2>
          <ul style="padding-left:18px;margin:0 0 20px;">${listItems(analysis.recommended_skills)}</ul>

          <h2 style="font-size:15px;font-weight:700;color:#0F172A;margin:24px 0 8px;">Your 30-Day Plan</h2>
          <ol style="padding-left:18px;margin:0 0 20px;">${listItems(analysis.thirty_day_plan)}</ol>

          <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;padding:16px;margin:28px 0;">
            <p style="font-size:14px;font-weight:700;color:#0F172A;margin:0 0 6px;">${analysis.final_advice}</p>
          </div>

          <div style="border-top:1px solid #E2E8F0;padding-top:24px;margin-top:32px;">
            <p style="font-size:13px;color:#64748B;line-height:1.6;margin:0 0 12px;">I write about where AI, data, dashboards, and leadership fail in real operations, and what professionals can do about it.</p>
            <a href="https://hasanjaffal.com/writing/" style="display:inline-block;padding:10px 20px;background:#0F172A;color:#ffffff;font-size:13px;font-weight:600;border-radius:6px;text-decoration:none;">Read more on hasanjaffal.com</a>
          </div>

          <p style="font-size:11px;color:#94A3B8;margin:24px 0 0;">— Hasan Jaffal · hasanjaffal.com<br>You received this because you used the AI Job Risk Analyzer and agreed to receive your report by email.</p>
        </div>
      `;

      await resend.emails.send({
        from: "Hasan Jaffal <hasan@hasanjaffal.com>",
        to: normalizedEmail,
        cc: "jaftalks@gmail.com",
        subject: "Your AI Job Risk Report",
        html: htmlBody
      });

      // Store submission in Firestore
      await db.collection("job_risk_submissions").add({
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
        result: {
          riskScore: analysis.risk_score,
          riskLevel: analysis.risk_level,
          summary: analysis.summary,
          exposedTasks: analysis.exposed_tasks || [],
          protectedTasks: analysis.protected_tasks || [],
          skillGaps: analysis.skill_gaps || [],
          recommendedSkills: analysis.recommended_skills || [],
          thirtyDayPlan: analysis.thirty_day_plan || [],
          finalAdvice: analysis.final_advice || ""
        },
        submittedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      res.status(200).json({ result: "success" });
    } catch (err) {
      console.error("Email send error:", err.message);
      res.status(500).json({ error: "Report could not be sent. Please try again." });
    }
  }
);

// v2 - added Firestore storage
