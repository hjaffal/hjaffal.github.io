"use strict";

// Email HTML uses presentation tables and inline styles; no web fonts, scripts,
// CSS variables, or layout dependencies that disappear in email clients.
const SITE = "https://hasanjaffal.com";
const C = { ink: "#281f32", muted: "#6c6375", purple: "#7734ce", soft: "#f8f5fc", line: "#e7e0ed" };
function escapeHtml(value) {
  return value == null ? "" : String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
const e = escapeHtml;
function paragraph(html) { return `<p style="margin:0 0 20px;font-size:16px;line-height:1.75;color:${C.ink};">${html}</p>`; }
function heading(text) { return `<h2 style="font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:25px;line-height:1.3;color:${C.ink};margin:30px 0 16px;">${e(text)}</h2>`; }
function link(text, url) { return `<a href="${e(url)}" style="color:${C.purple};text-decoration:underline;text-underline-offset:3px;">${e(text)}</a>`; }
function button(text, url) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;"><tr><td bgcolor="${C.purple}" style="background:${C.purple};border-radius:6px;mso-padding-alt:14px 22px;text-align:center;"><a href="${e(url)}" style="display:inline-block;padding:14px 22px;font-family:Arial,sans-serif;font-size:16px;font-weight:600;line-height:1.5;color:#ffffff;text-decoration:none;border-radius:6px;">${e(text)}</a></td></tr></table>`;
}
function callout(html) { return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;"><tr><td class="email-soft" style="background:${C.soft};border-left:3px solid ${C.purple};padding:22px 24px;">${html}</td></tr></table>`; }
function rows(entries) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${entries.map(([label, value]) => `<tr><td style="padding:14px 0;border-bottom:1px solid ${C.line};"><p style="margin:0 0 5px;font-size:13px;line-height:1.5;color:${C.muted};">${e(label)}</p><p style="margin:0;font-size:16px;line-height:1.7;color:${C.ink};overflow-wrap:anywhere;white-space:pre-wrap;">${e(value)}</p></td></tr>`).join("")}</table>`;
}
function list(items) { return `<ul style="padding-left:22px;margin:0 0 24px;font-size:16px;line-height:1.8;color:${C.ink};">${items.map(item => `<li style="padding:3px 0;">${e(item)}</li>`).join("")}</ul>`; }
function renderEmail({ title, preheader = "", eyebrow = "THE SECOND MIND", body, reason = "", unsubscribeUrl, trackingPixelUrl, publication = "The Second Mind" }) {
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light dark"><meta name="supported-color-schemes" content="light dark"><title>${e(title)}</title>
<style>body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}table{border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt}img{border:0;outline:none;text-decoration:none}a{word-break:break-word} @media screen and (max-width:600px){.email-outer{padding:12px 8px!important}.email-pad{padding-left:22px!important;padding-right:22px!important}.email-title{font-size:30px!important}} @media(prefers-color-scheme:dark){body,.email-bg{background:#191321!important}.email-paper{background:#251b32!important}.email-soft{background:#30223f!important}.email-paper p,.email-paper h1,.email-paper h2,.email-paper h3{color:#f2ecfa!important}.email-brand{color:#f2ecfa!important}.email-paper a:not(.email-brand){color:#bf97f3!important}.email-paper td[bgcolor="#7734ce"] a{color:#ffffff!important}.email-muted{color:#bfb2cd!important}}</style></head>
<body class="email-bg" style="margin:0;padding:0;background:${C.soft};font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;color:${C.ink};">
<div style="display:none;font-size:1px;color:${C.soft};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">${e(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="email-bg" style="background:${C.soft};"><tr><td class="email-outer" align="center" style="padding:32px 16px;">
<!--[if mso]><table role="presentation" width="620" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="email-paper" style="max-width:620px;background:#ffffff;border:1px solid ${C.line};">
<tr><td class="email-pad" style="padding:28px 36px;border-bottom:3px solid ${C.purple};"><a class="email-brand" href="${SITE}/" style="display:inline-block;min-height:44px;font-size:17px;font-weight:700;line-height:1.5;color:${C.ink};text-decoration:none;">Hasan Jaffal<br><span class="email-muted" style="font-size:13px;font-weight:400;color:${C.muted};">${e(publication)} · ${publication === "Sproochentest Prep" ? "Luxembourgish learning resources" : "Writing on AI and business"}</span></a></td></tr>
<tr><td class="email-pad" style="padding:32px 36px 12px;"><p style="margin:0 0 14px;font-size:12px;font-weight:700;letter-spacing:1px;line-height:1.5;color:${C.purple};">${e(eyebrow)}</p><h1 class="email-title" style="font-family:Georgia,'Times New Roman',serif;font-size:34px;font-weight:400;line-height:1.2;letter-spacing:-.5px;color:${C.ink};margin:0 0 24px;">${e(title)}</h1>${body}</td></tr>
<tr><td class="email-pad email-soft" style="padding:24px 36px;background:${C.soft};border-top:1px solid ${C.line};"><p class="email-muted" style="margin:0 0 14px;font-size:13px;line-height:1.7;color:${C.muted};">${e(reason)}</p>${unsubscribeUrl ? `<p style="margin:0 0 14px;font-size:14px;line-height:1.7;"><a href="${e(unsubscribeUrl)}" style="color:${C.purple};display:inline-block;padding:10px 0;">Unsubscribe</a> &nbsp;·&nbsp; <a href="${e(unsubscribeUrl)}" style="color:${C.purple};display:inline-block;padding:10px 0;">Manage preferences</a></p>` : ""}<p class="email-muted" style="margin:0;font-size:13px;line-height:1.7;color:${C.muted};">Hasan Jaffal · Luxembourg<br>${link("hasanjaffal.com", SITE + "/")}</p></td></tr>
</table><!--[if mso]></td></tr></table><![endif]-->
</td></tr></table>${trackingPixelUrl ? `<img src="${e(trackingPixelUrl)}" width="1" height="1" alt="" style="display:block;width:1px;height:1px;border:0;" />` : ""}
</body></html>`;
}
module.exports = { C, SITE, escapeHtml, paragraph, heading, link, button, callout, rows, list, renderEmail };
