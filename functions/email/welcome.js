"use strict";
const { SITE, paragraph: p, heading: h, link, button, renderEmail } = require("./design");

function buildMainWebsiteWelcome(unsubscribeUrl) {
  const topics = [
    ["Opportunities", "Where could AI make a useful difference in your business?", "/topics/opportunities/"],
    ["Investment decisions", "Which opportunity deserves investment, and what evidence would justify it?", "/topics/investment-decisions/"],
    ["People & adoption", "What will it take for people to use it well?", "/topics/people-and-adoption/"],
    ["Outcomes & evidence", "What changed, what did AI contribute, and was it worth the cost?", "/topics/outcomes-and-evidence/"],
  ];
  return renderEmail({ title: "Welcome to The Second Mind.", preheader: "AI opportunities, investment decisions, people, and the evidence of business value.", unsubscribeUrl, reason: "You subscribed to The Second Mind by Hasan Jaffal.", body:
    p("I’m Hasan Jaffal. I write about the business decisions behind AI: where it could help, what it takes to adopt it, and how to tell whether it was worth the investment.") +
    p("The aim is to help you ask a better question about your own business, examine the evidence, and choose a useful next step.") + button("Start with the articles →", SITE + "/writing/") +
    h("Four questions guide the writing") + topics.map(([name, question, url]) => `<h3 style="font-size:18px;font-weight:600;line-height:1.4;margin:24px 0 8px;">${link(name, SITE + url)}</h3>` + p(question)).join("") +
    h("When you want to put it into practice") + p("The " + link("AI Job Risk Analyzer", SITE + "/ai-job-risk-analyzer/") + " reviews how your own task mix could change. You can also browse " + link("templates and worksheets", SITE + "/ai-templates/") + " for team discussions and practical reviews.") });
}
function buildSproochentestWelcome(unsubscribeUrl) {
  return renderEmail({ title: "Wëllkomm — you’re in!", eyebrow: "SPROOCHENTEST PREP", publication: "Sproochentest Prep", preheader: "Speaking topics, listening practice, and downloadable learning materials.", unsubscribeUrl, reason: "You subscribed to Sproochentest Prep updates by Hasan Jaffal.", body:
    p("You’ll receive updates, new topics, and practice materials to help you prepare for the Sproochentest — the Luxembourgish language and citizenship test.") +
    h("Make room for a little practice") + p("Explore speaking questions about family, work, hobbies, and Luxembourg life. Use the picture-description frameworks, listening exercises, and downloadable grammar guides to support your practice.") +
    button("Start practicing →", SITE + "/sproochentest/") });
}
module.exports = { buildMainWebsiteWelcome, buildSproochentestWelcome };
