"use strict";
const { SITE, C, escapeHtml, paragraph, heading, link, button, callout, renderEmail } = require("../email/design");
const e = escapeHtml;

// URLs supplied here are already rewritten by the sender's click-tracking proxy.
// The unsubscribe destination and open pixel pass through unchanged.
function renderNewsletter({ subject, introHtml, posts = [], featuredPost, toolInvitation, unsubscribeUrl, trackingPixelUrl }) {
  function image(post) {
    if (!post.image) return "";
    const src = post.image.startsWith("/") ? SITE + post.image : post.image;
    if (!/^https?:\/\//i.test(src)) return "";
    return `<a href="${e(post.url)}"><img src="${e(src)}" alt="" width="546" style="display:block;width:100%;max-width:546px;height:auto;margin:0 0 20px;border-radius:6px;" /></a>`;
  }
  function article(post, featured) {
    return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 28px;"><tr><td style="padding:24px 0;border-top:1px solid ${C.line};">${featured ? `<p style="font-size:12px;line-height:1.5;letter-spacing:1px;color:${C.purple};font-weight:700;margin:0 0 14px;">FEATURED</p>` : ""}${image(post)}<h2 style="font-family:Georgia,'Times New Roman',serif;font-size:${featured || posts.length === 1 ? "29" : "26"}px;font-weight:400;line-height:1.3;margin:0 0 16px;color:${C.ink};"><a href="${e(post.url)}" style="color:${C.ink};text-decoration:none;">${e(post.title)}</a></h2>${paragraph(e(post.excerpt))}${featured || posts.length === 1 ? button("Read the full article →", post.url) : `<a href="${e(post.url)}" style="display:inline-block;padding:12px 0;font-size:16px;font-weight:600;color:${C.purple};text-decoration:underline;">Read more →</a>`}</td></tr></table>`;
  }
  const body = (introHtml ? `<div style="font-size:16px;line-height:1.75;color:${C.ink};margin-bottom:28px;">${introHtml}</div>` : "") +
    (featuredPost ? article(featuredPost, true) : "") + posts.map(post => article(post, false)).join("") +
    (toolInvitation ? callout(`<p style="font-size:12px;line-height:1.5;letter-spacing:1px;color:${C.purple};font-weight:700;margin:0 0 14px;">TRY THIS TOOL</p>${heading(toolInvitation.name)}${paragraph(e(toolInvitation.description))}${button("Try it free →", toolInvitation.url)}`) : "");
  return renderEmail({ title: subject, eyebrow: "THE SECOND MIND", preheader: posts[0] ? posts[0].excerpt : subject, body, unsubscribeUrl, trackingPixelUrl, reason: "You received this because you subscribed to The Second Mind by Hasan Jaffal." });
}
module.exports = { renderNewsletter, escapeHtml };
