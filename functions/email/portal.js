"use strict";
const { SITE, C, escapeHtml: e, paragraph: p, heading: h, link, button, callout, rows, list, renderEmail } = require("./design");

function renderSkillsGuide({ name, score, band, strongest, weakest }) {
  return renderEmail({ title: "Your next learning priority.", eyebrow: "FUTURE-PROOF SKILLS ASSESSMENT", preheader: `${band} · ${score} / 36. Your result and practical learning guide.`, reason: "You requested the Future-Proof Skills Guide after completing the assessment.", body:
    p(`Hi ${e((name || "there").trim().split(" ")[0])}, here is your assessment result and the guide to help you turn it into a learning plan.`) +
    callout(`<p style="margin:0 0 8px;font-size:13px;color:${C.muted};">Your assessment result</p><p style="margin:0 0 8px;font-family:Georgia,serif;font-size:30px;line-height:1.3;color:${C.purple};">${e(band)}</p>${p(`Score: <strong>${e(score)} / 36</strong>`)}`) +
    rows([["Strongest area", strongest], ["Area to develop", weakest]]) +
    button("Download the full guide (PDF) →", SITE + "/assets/pdf/future-proof-skills-guide.pdf") +
    h("Make it useful in your current work") + p("Choose one skill to practise on a responsibility you already have. Discuss it with your manager, decide what progress would look like, and review the evidence after a few weeks.") +
    p("The assessment is a reflection tool, not a guarantee of career security.") + p(link("Explore people & adoption", SITE + "/topics/people-and-adoption/")) });
}
function renderContactNotification({ name, email, subject, message }) {
  return renderEmail({ title: "A new conversation.", eyebrow: "WEBSITE CONTACT", preheader: `Message from ${name}${subject ? ": " + subject : ""}`, reason: "An internal notification from the contact form on hasanjaffal.com.", body:
    p("A visitor sent the following message through your website. Reply to this email to continue the conversation.") + rows([["From", name], ["Email", email], ...(subject ? [["Subject", subject]] : []), ["Message", message]]) });
}
function renderReportDownload({ firstName }) {
  return renderEmail({ title: "Your report, ready to read.", eyebrow: "AI WORKFORCE DISRUPTION REPORT", preheader: "Your PDF download and a starting point for examining how work could change.", reason: "You requested the AI Workforce Disruption Report on hasanjaffal.com.", body:
    p(`Hi ${e(firstName || "there")}, thank you for your interest. Your report is available at the link below.`) + button("Download the report (PDF) →", SITE + "/report/2028-AI-Workforce-Disruption-Report.pdf") +
    h("What’s inside") + list(["154 role profiles and task-level automation estimates", "Four disruption classifications", "A 30-day self-audit protocol with templates", "A framework for considering how responsibilities could change"]) +
    callout(p("Use the projections to question assumptions about your work. Task exposure estimates are not probabilities that a person will lose their job.")) +
    p("For a closer look at your own responsibilities, you can also explore the " + link("AI Job Risk Analyzer", SITE + "/ai-job-risk-analyzer/") + ".") });
}
function renderJobRiskReport({ name, jobTitle, industry, country, analysis, reportUrl, email }) {
  const exposed = (analysis.exposed_tasks || []).slice(0, 3).map(t => typeof t === "string" ? t : t.task);
  const skills = (analysis.recommended_skills || []).slice(0, 3);
  return renderEmail({ title: "A closer look at your work.", eyebrow: "AI JOB RISK ANALYZER · PERSONAL REPORT", preheader: `Your report for ${jobTitle}, including task exposure, skills, and a 30-day plan.`, reason: `You requested this report using the AI Job Risk Analyzer. This email was sent to ${email}.`, body:
    p(`Hi ${e((name || "there").trim().split(" ")[0])}, your analysis is ready. Open the report to review the reasoning, your task mix, and suggested next steps.`) + button("Open your personal report →", reportUrl) +
    callout(`<p style="font-size:13px;line-height:1.6;color:${C.muted};margin:0 0 8px;">AI risk score · ${e(analysis.risk_level)} risk</p><p style="font-size:36px;line-height:1.2;color:${C.purple};margin:0 0 12px;font-family:Georgia,serif;">${e(analysis.risk_score)}<span style="font-size:18px;"> / 100</span></p>${p(e([jobTitle, industry, country].filter(Boolean).join(" · ")))}`) +
    p(e(analysis.summary)) + (exposed.length ? h("Tasks to examine first") + list(exposed) : "") + (skills.length ? h("Skills to build on") + list(skills) : "") +
    p("The dashboard includes the full analysis, skill gaps, and a 30-day plan. Treat its estimates as hypotheses to check against your work, rather than a prediction of job loss.") +
    p("Keep your report link private: anyone with the link can view your profile and analysis.") + p(link("Read more on AI and work", SITE + "/writing/")) });
}
function renderToolInvitation({ firstName, sender }) {
  return renderEmail({ title: "A tool to explore your work.", eyebrow: "SHARED WITH YOU", preheader: `${sender} thought you might find the AI Job Risk Analyzer useful.`, reason: `You received this one-time invitation because ${sender} shared the tool with you.`, body:
    p(`Hi ${e(firstName)}, ${e(sender)} thought you might find the ${link("AI Job Risk Analyzer", SITE + "/ai-job-risk-analyzer/")} useful.`) +
    p("The tool reviews the tasks behind your job title and creates a personal report with skills to consider and a 30-day action plan.") + button("Explore the AI Job Risk Analyzer →", SITE + "/ai-job-risk-analyzer/") +
    p("The report requires your name, email, and consent to receive the newsletter. This invitation does not subscribe you.") });
}
function renderTestimonialNotification({ character, name, experience, improvement, adminUrl }) {
  return renderEmail({ title: "A new reader experience.", eyebrow: "SPROOCHENTEST · ADMIN NOTIFICATION", reason: "An internal notification for a submitted Sproochentest testimonial. The submission is pending review.", body:
    rows([["Character", character], ["Name", name], ["Experience", experience], ["Suggested improvement", improvement || "Not provided"]]) + button("Review in Admin →", adminUrl) + p("Go to Sproochentest → Testimonials to approve or reject the submission.") });
}
function renderVocabReminder({ name, xp, wordsLearned }) {
  return renderEmail({ title: "Pick up where you left off.", eyebrow: "SPROOCHENTEST PREP", publication: "Sproochentest Prep", reason: "You received this because you use the Sproochentest Vocab Engine.", body:
    p(`Hi ${e(name)}, your vocabulary progress is still saved. Return when you’re ready for another practice session.`) + callout(p(`<strong>${e(xp)} XP</strong> earned · <strong>${e(wordsLearned)} words</strong> learned`)) +
    button("Continue learning →", SITE + "/sproochentest/vocab/") + p(link("Sproochentest Prep", SITE + "/sproochentest/")) });
}
module.exports = { renderSkillsGuide, renderContactNotification, renderReportDownload, renderJobRiskReport, renderToolInvitation, renderTestimonialNotification, renderVocabReminder };
