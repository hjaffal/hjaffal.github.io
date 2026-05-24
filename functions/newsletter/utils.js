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
 */
function normalizeEmail(email) {
  if (!email || typeof email !== "string") return "";
  return email.trim().toLowerCase();
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
};
