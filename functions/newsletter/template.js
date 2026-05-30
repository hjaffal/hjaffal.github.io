"use strict";

/**
 * Newsletter email template renderer.
 * Produces table-based HTML email with inline styles for maximum
 * email client compatibility.
 *
 * @param {Object} options
 * @param {string} options.subject - Edition subject line
 * @param {Array<{title: string, excerpt: string, url: string}>} options.posts - Post cards (urls already rewritten through click proxy)
 * @param {{title: string, excerpt: string, url: string}|null} options.featuredPost - Featured post (url already rewritten through click proxy)
 * @param {{name: string, description: string, url: string}|null} options.toolInvitation - Tool invitation (url already rewritten through click proxy)
 * @param {string} options.unsubscribeUrl - Direct unsubscribe link (NOT rewritten through click proxy)
 * @param {string} options.trackingPixelUrl - Unique tracking pixel URL for this subscriber-edition
 * @returns {string} Complete HTML email string
 */
function renderNewsletter({ subject, introHtml, posts, featuredPost, toolInvitation, unsubscribeUrl, trackingPixelUrl }) {
  const introSection = introHtml ? `
    <tr><td style="padding:0 0 24px;">
      <div style="font-size:15px;color:#334155;line-height:1.7;">${introHtml}</div>
    </td></tr>` : "";

  const postsHtml = (posts || []).map(post => `
    <tr><td style="padding:0 0 16px;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#FFFFFF;border:1px solid #E2E8F0;border-radius:8px;overflow:hidden;">
        <tr><td style="padding:20px 24px;">
          <p style="margin:0 0 8px;font-size:16px;font-weight:700;color:#0F172A;line-height:1.4;">${escapeHtml(post.title)}</p>
          <p style="margin:0 0 14px;font-size:14px;color:#475569;line-height:1.6;">${escapeHtml(post.excerpt)}</p>
          <a href="${escapeHtml(post.url)}" style="font-size:13px;font-weight:600;color:#9333EA;text-decoration:none;">Read more →</a>
        </td></tr>
      </table>
    </td></tr>`).join("");

  const featuredImageHtml = (featuredPost && featuredPost.image)
    ? `<tr><td style="padding:0;">
        <img src="https://hasanjaffal.com${escapeHtml(featuredPost.image)}" alt="" style="width:100%;height:auto;display:block;border-radius:10px 10px 0 0;" />
      </td></tr>` : "";

  const featuredHtml = featuredPost ? `
    <tr><td style="padding:0 0 32px;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#FAF5FF;border:2px solid #9333EA;border-radius:10px;overflow:hidden;">
        ${featuredImageHtml}
        <tr><td style="padding:28px 28px 8px;">
          <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#9333EA;">FEATURED</p>
          <p style="margin:0 0 12px;font-size:20px;font-weight:800;color:#0F172A;line-height:1.3;">${escapeHtml(featuredPost.title)}</p>
          <p style="margin:0 0 20px;font-size:14px;color:#334155;line-height:1.7;">${escapeHtml(featuredPost.excerpt)}</p>
        </td></tr>
        <tr><td style="padding:0 28px 28px;">
          <a href="${escapeHtml(featuredPost.url)}" style="display:inline-block;padding:12px 28px;background:#9333EA;color:#ffffff;font-size:14px;font-weight:700;border-radius:6px;text-decoration:none;">Read the full article →</a>
        </td></tr>
      </table>
    </td></tr>` : "";

  const toolHtml = toolInvitation ? `
    <tr><td style="padding:0 0 32px;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;overflow:hidden;">
        <tr><td style="padding:24px 28px;">
          <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#64748B;">TRY THIS TOOL</p>
          <p style="margin:0 0 8px;font-size:16px;font-weight:700;color:#0F172A;">${escapeHtml(toolInvitation.name)}</p>
          <p style="margin:0 0 18px;font-size:14px;color:#475569;line-height:1.6;">${escapeHtml(toolInvitation.description)}</p>
          <a href="${escapeHtml(toolInvitation.url)}" style="display:inline-block;padding:11px 24px;background:#0F172A;color:#ffffff;font-size:13px;font-weight:700;border-radius:6px;text-decoration:none;">Try it free →</a>
        </td></tr>
      </table>
    </td></tr>` : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#F4F7FB;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<div style="background:#F4F7FB;padding:0;margin:0;">
<table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#F4F7FB;">
<tr><td align="center" style="padding:24px 16px;">
<table cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;width:100%;background:#FFFFFF;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(15,23,42,0.06);">

<!-- Header -->
<tr><td style="background:#0F172A;padding:28px 32px;border-bottom:3px solid #9333EA;">
  <p style="margin:0 0 4px;font-size:11px;font-weight:600;letter-spacing:0.15em;text-transform:uppercase;color:#9333EA;">HASAN JAFFAL</p>
  <p style="margin:0;font-size:22px;font-weight:800;color:#F8FAFC;letter-spacing:0.02em;">THE SECOND MIND</p>
</td></tr>

<!-- Subject line -->
<tr><td style="padding:28px 32px 24px;">
  <p style="margin:0;font-size:18px;font-weight:700;color:#0F172A;line-height:1.4;">${escapeHtml(subject)}</p>
</td></tr>

<!-- Intro text -->
<tr><td style="padding:0 32px;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%">
    ${introSection}
  </table>
</td></tr>

<!-- Post cards -->
<tr><td style="padding:0 32px;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%">
    ${postsHtml}
  </table>
</td></tr>

<!-- Featured post -->
<tr><td style="padding:0 32px;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%">
    ${featuredHtml}
  </table>
</td></tr>

<!-- Tool invitation -->
<tr><td style="padding:0 32px;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%">
    ${toolHtml}
  </table>
</td></tr>

<!-- Footer -->
<tr><td style="padding:28px 32px;border-top:1px solid #E2E8F0;text-align:center;background:#F8FAFC;">
  <p style="margin:0 0 12px;font-size:12px;color:#64748B;line-height:1.6;">You received this because you subscribed to The Second Mind by Hasan Jaffal.</p>
  <p style="margin:0 0 12px;font-size:12px;">
    <a href="${escapeHtml(unsubscribeUrl)}" style="color:#9333EA;font-weight:600;text-decoration:none;">Unsubscribe</a>
    <span style="color:#CBD5E1;margin:0 8px;">|</span>
    <a href="${escapeHtml(unsubscribeUrl)}" style="color:#9333EA;font-weight:600;text-decoration:none;">Manage preferences</a>
  </p>
  <p style="margin:0 0 8px;font-size:11px;color:#94A3B8;">Hasan Jaffal · hasanjaffal.com · Luxembourg</p>
</td></tr>

</table>
</td></tr>
</table>
</div>
<!-- Tracking pixel -->
<img src="${escapeHtml(trackingPixelUrl)}" width="1" height="1" alt="" style="display:block;width:1px;height:1px;border:0;" />
</body>
</html>`;
}

/**
 * Escape HTML special characters to prevent XSS in email content.
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

module.exports = { renderNewsletter, escapeHtml };
