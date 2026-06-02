const crypto = require("crypto");

/**
 * Generates a crypto-random unsubscribe token and its SHA-256 hash for storage.
 * Returns both the raw token (64-char hex) and its hash.
 */
function generateUnsubscribeToken() {
  const token = crypto.randomBytes(32).toString("hex");
  const hash = crypto.createHash("sha256").update(token).digest("hex");
  return { token, hash };
}

/**
 * Generates a tracking token by base64url-encoding a JSON payload
 * containing the subscriber ID and edition ID.
 */
function generateTrackingToken(subscriberId, editionId) {
  const payload = JSON.stringify({ s: subscriberId, e: editionId });
  return Buffer.from(payload).toString("base64url");
}

/**
 * Decodes a base64url tracking token back to subscriber and edition IDs.
 * Returns null if the token is invalid.
 */
function decodeTrackingToken(token) {
  try {
    const payload = JSON.parse(Buffer.from(token, "base64url").toString("utf8"));
    if (!payload.s || !payload.e) return null;
    return { subscriberId: payload.s, editionId: payload.e };
  } catch {
    return null;
  }
}

/**
 * Validates an email address against the project's standard regex.
 */
function validateEmail(email) {
  if (!email || typeof email !== "string") return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Normalizes an email address: lowercase + trim.
 * For Gmail/Googlemail: strips dots and +aliases from the local part
 * to prevent dot-trick and plus-alias abuse.
 */
function normalizeEmail(email) {
  if (!email || typeof email !== "string") return "";
  let normalized = email.trim().toLowerCase();

  const [local, domain] = normalized.split("@");
  if (!local || !domain) return normalized;

  // Gmail normalization: strip dots and +aliases
  if (domain === "gmail.com" || domain === "googlemail.com") {
    let cleanLocal = local.split("+")[0]; // Remove +alias
    cleanLocal = cleanLocal.replace(/\./g, ""); // Remove dots
    return `${cleanLocal}@gmail.com`; // Always normalize to gmail.com
  }

  return normalized;
}

/**
 * Conservative list of role-based email prefixes commonly abused by bots.
 * Keep this small to avoid false positives on real work emails.
 */
const BLOCKED_PREFIXES = [
  "enquiry@",
  "customercare@",
  "loyaltysupport@",
  "support@",
  "info@",
  "noreply@",
  "no-reply@",
  "mailer-daemon@",
  "postmaster@",
];

/**
 * Checks if a subscription request looks like a bot.
 * Returns { isBot: true, reason: string } if blocked, or { isBot: false } if clean.
 *
 * Checks:
 * 1. Honeypot field (website_url) — if populated, it's a bot
 * 2. Role-based email prefix filter
 */
function detectBot(body) {
  // 1. Honeypot: if the hidden field has a value, it's a bot
  if (body.website_url && body.website_url.trim().length > 0) {
    return { isBot: true, reason: "honeypot" };
  }

  // 2. Role-based prefix filter
  const email = (body.email || "").trim().toLowerCase();
  for (const prefix of BLOCKED_PREFIXES) {
    if (email.startsWith(prefix)) {
      return { isBot: true, reason: "role_prefix" };
    }
  }

  return { isBot: false };
}

/**
 * Masks an email for display (e.g., "u***@example.com").
 * Shows the first character of the local part, masks the rest.
 */
function maskEmail(email) {
  if (!email || typeof email !== "string") return "";
  const [local, domain] = email.split("@");
  if (!local || !domain) return "";
  const masked = local.charAt(0) + "***";
  return `${masked}@${domain}`;
}

module.exports = {
  generateUnsubscribeToken,
  generateTrackingToken,
  decodeTrackingToken,
  validateEmail,
  normalizeEmail,
  maskEmail,
  detectBot,
};
