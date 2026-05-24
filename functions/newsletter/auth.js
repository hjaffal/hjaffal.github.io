const admin = require("firebase-admin");

/**
 * Verifies that the request includes a valid Firebase Admin ID token.
 * Extracts the Bearer token from the Authorization header and verifies it.
 *
 * @param {object} req - The HTTP request object
 * @returns {Promise<object>} The decoded Firebase ID token
 * @throws {Error} If the token is missing or invalid
 */
async function verifyAdminToken(req) {
  const authHeader = req.headers && req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    const error = new Error("Missing or malformed Authorization header");
    error.statusCode = 401;
    throw error;
  }

  const idToken = authHeader.split("Bearer ")[1];

  if (!idToken) {
    const error = new Error("Missing token");
    error.statusCode = 401;
    throw error;
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return decodedToken;
  } catch (err) {
    const error = new Error("Invalid or expired token");
    error.statusCode = 401;
    error.cause = err;
    throw error;
  }
}

module.exports = { verifyAdminToken };
