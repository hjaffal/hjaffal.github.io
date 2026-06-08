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
      const result = data.result || {};

      const name = data.name || "Anonymous";
      const jobTitle = data.jobTitle || "Professional";
      const score = result.risk_score || 50;
      const riskLevel = result.risk_level || "Medium";
      const resilience = 100 - score;

      // Determine archetype
      let archetype = "Adaptive Professional";
      if (resilience >= 60) archetype = "Strategic Operator";
      else if (resilience < 40) archetype = "Execution Specialist";

      // Determine primary moat
      const protectedTasks = result.protected_tasks || [];
      let primaryMoat = "Strategic judgment";
      if (protectedTasks.length > 0) {
        const first = protectedTasks[0];
        primaryMoat = typeof first === "string" ? first : first.task || "Strategic judgment";
      }

      // Colors based on risk
      const ringColor = score >= 70 ? "#EF4444" : score >= 45 ? "#F59E0B" : "#10B981";
      const glowColor = score >= 70 ? "rgba(239,68,68,0.3)" : score >= 45 ? "rgba(245,158,11,0.2)" : "rgba(16,185,129,0.25)";

      // Build the card as Satori JSX-like object (using React-like structure)
      const cardMarkup = {
        type: "div",
        props: {
          style: {
            width: "1200px",
            height: "630px",
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)",
            fontFamily: "Inter",
            padding: "48px 60px",
            position: "relative",
          },
          children: [
            // Decorative orb top-right
            {
              type: "div",
              props: {
                style: {
                  position: "absolute",
                  top: "-60px",
                  right: "-40px",
                  width: "300px",
                  height: "300px",
                  borderRadius: "50%",
                  background: "radial-gradient(circle, rgba(147,51,234,0.12) 0%, transparent 70%)",
                },
              },
            },
            // Left side: Score
            {
              type: "div",
              props: {
                style: {
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "380px",
                  flexShrink: "0",
                },
                children: [
                  // Score circle
                  {
                    type: "div",
                    props: {
                      style: {
                        width: "180px",
                        height: "180px",
                        borderRadius: "50%",
                        border: `8px solid ${ringColor}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: `0 0 40px ${glowColor}`,
                        marginBottom: "20px",
                      },
                      children: [
                        {
                          type: "div",
                          props: {
                            style: {
                              fontSize: "64px",
                              fontWeight: "800",
                              color: "#F8FAFC",
                              letterSpacing: "-0.03em",
                            },
                            children: String(score),
                          },
                        },
                      ],
                    },
                  },
                  // Risk level badge
                  {
                    type: "div",
                    props: {
                      style: {
                        padding: "6px 18px",
                        background: `${ringColor}20`,
                        border: `1px solid ${ringColor}40`,
                        borderRadius: "20px",
                        fontSize: "14px",
                        fontWeight: "700",
                        color: ringColor,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                      },
                      children: `${riskLevel} RISK`,
                    },
                  },
                ],
              },
            },
            // Right side: Details
            {
              type: "div",
              props: {
                style: {
                  display: "flex",
                  flexDirection: "column",
                  flex: "1",
                  paddingLeft: "48px",
                  borderLeft: "1px solid rgba(255,255,255,0.1)",
                },
                children: [
                  // Resilience headline
                  {
                    type: "div",
                    props: {
                      style: {
                        fontSize: "36px",
                        fontWeight: "800",
                        color: ringColor,
                        letterSpacing: "-0.02em",
                        marginBottom: "16px",
                      },
                      children: `${resilience}% HUMAN RESILIENCE`,
                    },
                  },
                  // Name
                  {
                    type: "div",
                    props: {
                      style: {
                        fontSize: "28px",
                        fontWeight: "700",
                        color: "#F8FAFC",
                        marginBottom: "4px",
                      },
                      children: name.length > 25 ? name.slice(0, 25) + "..." : name,
                    },
                  },
                  // Job title
                  {
                    type: "div",
                    props: {
                      style: {
                        fontSize: "18px",
                        fontWeight: "400",
                        color: "#94A3B8",
                        marginBottom: "28px",
                      },
                      children: jobTitle.length > 40 ? jobTitle.slice(0, 40) + "..." : jobTitle,
                    },
                  },
                  // Archetype
                  {
                    type: "div",
                    props: {
                      style: {
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                        marginBottom: "20px",
                        padding: "14px 18px",
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "10px",
                      },
                      children: [
                        {
                          type: "div",
                          props: {
                            style: {
                              fontSize: "10px",
                              fontWeight: "700",
                              letterSpacing: "0.15em",
                              color: "#64748B",
                              textTransform: "uppercase",
                            },
                            children: "AI-ASSIGNED ARCHETYPE",
                          },
                        },
                        {
                          type: "div",
                          props: {
                            style: {
                              fontSize: "20px",
                              fontWeight: "800",
                              color: "#F8FAFC",
                            },
                            children: archetype,
                          },
                        },
                      ],
                    },
                  },
                  // Primary moat
                  {
                    type: "div",
                    props: {
                      style: {
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                      },
                      children: [
                        {
                          type: "div",
                          props: {
                            style: {
                              fontSize: "10px",
                              fontWeight: "700",
                              letterSpacing: "0.15em",
                              color: "#64748B",
                              textTransform: "uppercase",
                            },
                            children: "PRIMARY MOAT",
                          },
                        },
                        {
                          type: "div",
                          props: {
                            style: {
                              fontSize: "16px",
                              fontWeight: "600",
                              color: "#CBD5E1",
                            },
                            children: primaryMoat.length > 50 ? primaryMoat.slice(0, 50) + "..." : primaryMoat,
                          },
                        },
                      ],
                    },
                  },
                ],
              },
            },
            // Bottom watermark
            {
              type: "div",
              props: {
                style: {
                  position: "absolute",
                  bottom: "24px",
                  left: "60px",
                  right: "60px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderTop: "1px solid rgba(255,255,255,0.08)",
                  paddingTop: "16px",
                },
                children: [
                  {
                    type: "div",
                    props: {
                      style: {
                        fontSize: "13px",
                        fontWeight: "600",
                        color: "#64748B",
                      },
                      children: "hasanjaffal.com/ai-job-risk-analyzer",
                    },
                  },
                  {
                    type: "div",
                    props: {
                      style: {
                        fontSize: "13px",
                        fontWeight: "600",
                        color: "#9333EA",
                      },
                      children: "The Second Mind",
                    },
                  },
                ],
              },
            },
          ],
        },
      };

      // Load fonts
      if (!fontBold || !fontRegular) {
        throw new Error("Font files not found");
      }
      const fonts = [
        { name: "Inter", data: fontRegular, weight: 400, style: "normal" },
        { name: "Inter", data: fontBold, weight: 700, style: "normal" },
        { name: "Inter", data: fontBold, weight: 800, style: "normal" },
      ];

      // Render SVG with Satori
      const svg = await satori(cardMarkup, {
        width: 1200,
        height: 630,
        fonts: fonts,
      });

      // Convert SVG to PNG
      const resvg = new Resvg(svg, {
        fitTo: { mode: "width", value: 1200 },
      });
      const pngData = resvg.render();
      const pngBuffer = pngData.asPng();

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
      const imageUrl = `https://generatesharecard-vgheoh5xza-ew.a.run.app?token=${token}`;
      const title = `${name}'s AI Job Risk Score: ${score}/100 — ${riskLevel} Risk`;
      const description = `${resilience}% Human Resilience. ${name} (${jobTitle}) ran the 24-Month Forensic AI Risk Audit. Check your own role's exposure.`;

      // Serve HTML with OG tags
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
<meta http-equiv="refresh" content="0;url=${reportUrl}">
</head>
<body>
<p>Redirecting to your report...</p>
<script>window.location.href="${reportUrl}";</script>
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
