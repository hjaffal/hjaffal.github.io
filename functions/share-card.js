/**
 * Dynamic OG Share Card Image Generator
 * Generates a 1200x630 personalized PNG for LinkedIn/social sharing.
 * Uses Satori (SVG rendering) + @resvg/resvg-js (PNG conversion).
 */

const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const satori = require("satori").default || require("satori");
const { Resvg } = require("@resvg/resvg-js");
const { readFileSync } = require("fs");
const { join } = require("path");

// Load font (Inter Bold + Regular bundled with the function)
let fontBold, fontRegular;
try {
  fontBold = readFileSync(join(__dirname, "fonts", "Inter-Bold.ttf"));
  fontRegular = readFileSync(join(__dirname, "fonts", "Inter-Regular.ttf"));
} catch (e) {
  fontBold = null;
  fontRegular = null;
}

const db = admin.firestore();

/**
 * Generate card PNG buffer from report data.
 * Returns a Buffer of the PNG image.
 */
async function renderCardImage(reportData) {
  const result = reportData.result || {};
  const jobTitle = reportData.jobTitle || "Professional";
  const score = result.risk_score || 50;
  const riskLevel = result.risk_level || "Medium";

  let prognosis = "Core Task Attrition";
  if (score >= 75) prognosis = "Full Asset Substitution";
  else if (score >= 60) prognosis = "Core Task Attrition";
  else if (score >= 40) prognosis = "Structural Reclassification";
  else prognosis = "Peripheral Automation";

  let threatLevel = "MODERATE";
  if (score >= 70) threatLevel = "CRITICAL";
  else if (score >= 55) threatLevel = "HIGH";
  else if (score >= 40) threatLevel = "MODERATE";
  else threatLevel = "LOW";

  const protectedTasks = result.protected_tasks || [];
  let primaryMoat = "Strategic judgment and stakeholder accountability";
  if (protectedTasks.length > 0) {
    const first = protectedTasks[0];
    primaryMoat = typeof first === "string" ? first : first.task || primaryMoat;
  }

  const accentColor = score >= 70 ? "#DC2626" : score >= 40 ? "#F59E0B" : "#E2E8F0";
  const accentGlow = score >= 70 ? "rgba(220,38,38,0.25)" : score >= 40 ? "rgba(245,158,11,0.2)" : "rgba(226,232,240,0.15)";
  const hookText = `WILL AI REPLACE A ${jobTitle.toUpperCase()} BY 2028?`;

  const cardMarkup = {
    type: "div",
    props: {
      style: { width: "1200px", height: "630px", display: "flex", flexDirection: "column", background: "#09090B", fontFamily: "Inter", padding: "0", position: "relative", overflow: "hidden" },
      children: [
        { type: "div", props: { style: { padding: "36px 60px 24px", display: "flex", flexDirection: "column", alignItems: "flex-start" }, children: [{ type: "div", props: { style: { fontSize: "28px", fontWeight: "800", color: "#FAFAFA", letterSpacing: "-0.02em", lineHeight: "1.2" }, children: hookText.length > 55 ? hookText.slice(0, 55) + "?" : hookText } }] } },
        { type: "div", props: { style: { flex: "1", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 60px" }, children: [
          { type: "div", props: { style: { fontSize: "120px", fontWeight: "800", color: accentColor, letterSpacing: "-0.05em", lineHeight: "1", textShadow: `0 0 60px ${accentGlow}` }, children: score + "%" } },
          { type: "div", props: { style: { fontSize: "18px", fontWeight: "700", color: "#A1A1AA", letterSpacing: "0.15em", textTransform: "uppercase", marginTop: "8px" }, children: "AI AUTOMATION EXPOSURE" } },
          { type: "div", props: { style: { marginTop: "16px", padding: "6px 20px", background: `${accentColor}18`, border: `1px solid ${accentColor}50`, borderRadius: "4px", fontSize: "12px", fontWeight: "700", color: accentColor, letterSpacing: "0.12em" }, children: `THREAT LEVEL: ${threatLevel}` } }
        ] } },
        { type: "div", props: { style: { padding: "20px 60px 24px", borderTop: "1px solid #27272A", display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
          { type: "div", props: { style: { display: "flex", flexDirection: "column", gap: "2px" }, children: [
            { type: "div", props: { style: { fontSize: "9px", fontWeight: "700", letterSpacing: "0.18em", color: "#52525B", textTransform: "uppercase" }, children: "2028 STRUCTURAL PROGNOSIS" } },
            { type: "div", props: { style: { fontSize: "15px", fontWeight: "700", color: "#FAFAFA" }, children: prognosis } }
          ] } },
          { type: "div", props: { style: { display: "flex", flexDirection: "column", gap: "2px", alignItems: "flex-end", maxWidth: "400px" }, children: [
            { type: "div", props: { style: { fontSize: "9px", fontWeight: "700", letterSpacing: "0.18em", color: "#52525B", textTransform: "uppercase" }, children: "THE HUMAN SURVIVAL MOAT" } },
            { type: "div", props: { style: { fontSize: "13px", fontWeight: "400", color: "#A1A1AA", textAlign: "right" }, children: primaryMoat.length > 60 ? primaryMoat.slice(0, 60) + "..." : primaryMoat } }
          ] } }
        ] } },
        { type: "div", props: { style: { padding: "14px 60px", background: "#18181B", display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
          { type: "div", props: { style: { fontSize: "12px", fontWeight: "700", color: "#71717A" }, children: "Audit your exact role at hasanjaffal.com" } },
          { type: "div", props: { style: { fontSize: "11px", fontWeight: "600", color: "#52525B" }, children: "The Second Mind" } }
        ] } }
      ]
    }
  };

  if (!fontBold || !fontRegular) throw new Error("Font files not found");
  const fonts = [
    { name: "Inter", data: fontRegular, weight: 400, style: "normal" },
    { name: "Inter", data: fontBold, weight: 700, style: "normal" },
    { name: "Inter", data: fontBold, weight: 800, style: "normal" },
  ];

  const svg = await satori(cardMarkup, { width: 1200, height: 630, fonts });
  const resvg = new Resvg(svg, { fitTo: { mode: "width", value: 1200 } });
  return resvg.render().asPng();
}

/**
 * Generate card and upload to Firebase Storage.
 * Returns the public URL.
 */
async function generateAndUploadCard(reportData, reportToken) {
  const pngBuffer = await renderCardImage(reportData);
  const bucket = admin.storage().bucket();
  const filePath = `share-cards/${reportToken}.png`;
  const file = bucket.file(filePath);
  await file.save(pngBuffer, {
    metadata: { contentType: "image/png", cacheControl: "public, max-age=604800" }
  });
  await file.makePublic();
  return `https://storage.googleapis.com/${bucket.name}/${filePath}`;
}

// Export for use in analyzeJobRisk
exports.generateAndUploadCard = generateAndUploadCard;

exports.generateShareCard = onRequest(
  {
    region: "europe-west1",
    cors: true,
    memory: "512MiB",
    timeoutSeconds: 30,
  },
  async (req, res) => {
    const token = req.query.token;

    if (!token || typeof token !== "string" || token.length !== 64) {
      res.status(400).send("Invalid token");
      return;
    }

    try {
      // Lookup report by token
      const crypto = require("crypto");
      const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

      const snapshot = await db
        .collection("job_risk_submissions")
        .where("tokenHash", "==", tokenHash)
        .limit(1)
        .get();

      if (snapshot.empty) {
        res.status(404).send("Report not found");
        return;
      }

      const data = snapshot.docs[0].data();

      // Check if pre-generated image exists in Storage
      if (data.shareCardUrl) {
        res.redirect(301, data.shareCardUrl);
        return;
      }

      // Generate on the fly as fallback
      const pngBuffer = await renderCardImage(data);

      // Return PNG with caching
      res.set("Content-Type", "image/png");
      res.set("Cache-Control", "public, max-age=86400, s-maxage=86400");
      res.status(200).send(pngBuffer);
    } catch (err) {
      console.error("Share card generation error:", err);
      res.status(500).send("Could not generate image");
    }
  }
);


/**
 * Share Report Page
 * Serves a minimal HTML page with proper OG meta tags for LinkedIn scraping.
 * Real users get redirected to the full dashboard; bots/crawlers see OG tags.
 */
exports.shareReportPage = onRequest(
  {
    region: "europe-west1",
    cors: true,
    memory: "256MiB",
    timeoutSeconds: 15,
  },
  async (req, res) => {
    const token = req.query.token;

    if (!token || typeof token !== "string" || token.length !== 64) {
      res.redirect(301, "https://hasanjaffal.com/ai-job-risk-analyzer/");
      return;
    }

    try {
      const crypto = require("crypto");
      const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

      const snapshot = await db
        .collection("job_risk_submissions")
        .where("tokenHash", "==", tokenHash)
        .limit(1)
        .get();

      if (snapshot.empty) {
        res.redirect(301, "https://hasanjaffal.com/ai-job-risk-analyzer/");
        return;
      }

      const data = snapshot.docs[0].data();
      const result = data.result || {};
      const name = data.name || "Someone";
      const jobTitle = data.jobTitle || "a professional";
      const score = result.risk_score || 50;
      const resilience = 100 - score;
      const riskLevel = result.risk_level || "Medium";

      const reportUrl = `https://hasanjaffal.com/tools/ai-job-risk-report/?token=${token}`;
      const imageUrl = data.shareCardUrl || `https://generatesharecard-vgheoh5xza-ew.a.run.app?token=${token}`;
      const title = `${name}'s AI Job Risk Score: ${score}/100 — ${riskLevel} Risk`;
      const description = `${resilience}% Human Resilience. ${name} (${jobTitle}) ran the 24-Month Forensic AI Risk Audit. Check your own role's exposure.`;

      // Detect crawlers/bots — serve OG page without redirect
      const ua = (req.headers['user-agent'] || '').toLowerCase();
      const isBot = ua.includes('linkedinbot') || ua.includes('facebookexternalhit') || ua.includes('twitterbot') || ua.includes('slackbot') || ua.includes('whatsapp') || ua.includes('telegrambot') || ua.includes('googlebot') || ua.includes('bingbot');

      // Serve HTML with OG tags
      const redirectMeta = isBot ? '' : `<meta http-equiv="refresh" content="0;url=${reportUrl}">`;
      const redirectScript = isBot ? '' : `<script>window.location.href="${reportUrl}";</script>`;

      const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${title}</title>
<meta name="description" content="${description}">
<meta property="og:type" content="website">
<meta property="og:url" content="${reportUrl}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:image" content="${imageUrl}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${description}">
<meta name="twitter:image" content="${imageUrl}">
${redirectMeta}
</head>
<body>
<p>Redirecting to your report...</p>
${redirectScript}
</body>
</html>`;

      res.set("Content-Type", "text/html");
      res.set("Cache-Control", "public, max-age=3600");
      res.status(200).send(html);
    } catch (err) {
      console.error("Share page error:", err);
      res.redirect(301, "https://hasanjaffal.com/ai-job-risk-analyzer/");
    }
  }
);
