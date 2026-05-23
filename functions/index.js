const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const { Resend } = require("resend");

const RESEND_API_KEY = defineSecret("RESEND_API_KEY");

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
    const { email, score, resultBand, jobFamily, weakestCategory, strongestCategory } = body;

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
          <div style="flex:1;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;padding:14px;">
            <p style="font-size:11px;color:#94A3B8;margin:0 0 4px;text-transform:uppercase;letter-spacing:0.05em;">Strongest</p>
            <p style="font-size:14px;font-weight:600;color:#0F172A;margin:0;">${strongDisplay}</p>
          </div>
          <div style="flex:1;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;padding:14px;">
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
      const resend = new Resend(RESEND_API_KEY.value());
      await resend.emails.send({
        from: "Hasan Jaffal <hasan@hasanjaffal.com>",
        to: email,
        subject: "Your Future-Proof Skills Assessment Result",
        html: htmlBody
      });

      res.status(200).json({ result: "success" });
    } catch (err) {
      console.error("Resend error:", err);
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
      const resend = new Resend(RESEND_API_KEY.value());
      await resend.emails.send({
        from: "Website Contact <hasan@hasanjaffal.com>",
        to: "jaftalks@gmail.com",
        reply_to: email,
        subject: `Contact: ${name}`,
        html: htmlBody
      });

      res.status(200).json({ result: "success" });
    } catch (err) {
      console.error("Resend error:", err);
      res.status(500).json({ error: "Failed to send" });
    }
  }
);
