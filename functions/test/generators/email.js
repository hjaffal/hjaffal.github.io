/**
 * fast-check arbitraries for generating valid and invalid email addresses.
 */
const fc = require("fast-check");

/**
 * Generates a valid email local part (no spaces, no @).
 */
const validLocalPart = fc
  .stringOf(
    fc.constantFrom(
      ..."abcdefghijklmnopqrstuvwxyz0123456789._+-".split("")
    ),
    { minLength: 1, maxLength: 20 }
  )
  .filter((s) => /^[^\s@]+$/.test(s));

/**
 * Generates a valid domain label (letters, digits, hyphens, not starting/ending with hyphen).
 */
const domainLabel = fc
  .stringOf(fc.constantFrom(..."abcdefghijklmnopqrstuvwxyz0123456789".split("")), {
    minLength: 1,
    maxLength: 10,
  });

/**
 * Generates a valid TLD (2-6 lowercase letters).
 */
const tld = fc.stringOf(fc.constantFrom(..."abcdefghijklmnopqrstuvwxyz".split("")), {
  minLength: 2,
  maxLength: 6,
});

/**
 * Generates a valid email address matching ^[^\s@]+@[^\s@]+\.[^\s@]+$
 */
const validEmail = fc
  .tuple(validLocalPart, domainLabel, tld)
  .map(([local, domain, ext]) => `${local}@${domain}.${ext}`);

/**
 * Generates an invalid email address (various failure modes).
 */
const invalidEmail = fc.oneof(
  // Missing @ sign
  fc.string({ minLength: 1, maxLength: 30 }).filter((s) => !s.includes("@") && s.trim().length > 0),
  // Has spaces
  fc
    .tuple(validLocalPart, domainLabel, tld)
    .map(([local, domain, ext]) => `${local} @${domain}.${ext}`),
  // Empty string
  fc.constant(""),
  // Just @
  fc.constant("@"),
  // No domain part after @
  fc
    .tuple(validLocalPart)
    .map(([local]) => `${local}@`),
  // No TLD (no dot after @)
  fc
    .tuple(validLocalPart, domainLabel)
    .map(([local, domain]) => `${local}@${domain}`),
  // Multiple @ signs
  fc
    .tuple(validLocalPart, validLocalPart, domainLabel, tld)
    .map(([l1, l2, domain, ext]) => `${l1}@${l2}@${domain}.${ext}`)
);

/**
 * Generates an email with mixed casing and whitespace (for normalization testing).
 */
const unnormalizedEmail = fc
  .tuple(validLocalPart, domainLabel, tld, fc.constantFrom("", " ", "  "))
  .map(([local, domain, ext, padding]) => {
    const email = `${local}@${domain}.${ext}`;
    // Randomly uppercase some chars
    const mixed = email
      .split("")
      .map((c) => (Math.random() > 0.5 ? c.toUpperCase() : c))
      .join("");
    return `${padding}${mixed}${padding}`;
  });

module.exports = {
  validEmail,
  invalidEmail,
  unnormalizedEmail,
  validLocalPart,
  domainLabel,
  tld,
};
