/**
 * fast-check arbitraries for generating subscriber documents.
 */
const fc = require("fast-check");
const { validEmail } = require("./email");

/**
 * Valid subscriber statuses.
 */
const subscriberStatus = fc.constantFrom("active", "unsubscribed", "bounced", "complained");

/**
 * Valid segment arrays (subsets of the two supported segments).
 */
const segmentArray = fc.subarray(["main_website", "sproochentest_prep"], { minLength: 0, maxLength: 2 });

/**
 * Valid UTM source strings.
 */
const utmSource = fc.constantFrom(
  "homepage_form",
  "skills_assessment",
  "contact_form",
  "admin_added",
  "beehiiv",
  "website"
);

/**
 * Generates a timestamp-like value (milliseconds since epoch within a reasonable range).
 */
const timestamp = fc.integer({ min: 1672531200000, max: 1893456000000 }); // 2023 to 2030

/**
 * Generates a complete subscriber document.
 */
const subscriberDoc = fc
  .record({
    email: validEmail,
    status: subscriberStatus,
    segments: segmentArray,
    utmSource: utmSource,
    unsubscribeTokenHash: fc.hexaString({ minLength: 64, maxLength: 64 }),
    subscribedAt: timestamp,
    reactivatedAt: fc.option(timestamp, { nil: null }),
    unsubscribedAt: fc.option(timestamp, { nil: null }),
    welcomeEmailFailed: fc.boolean(),
    softBounceCount: fc.integer({ min: 0, max: 10 }),
    createdAt: timestamp,
    updatedAt: timestamp,
  })
  .map((doc) => ({
    ...doc,
    softBounces: [],
    bounceReason: null,
    bouncedAt: null,
    complainedAt: null,
  }));

/**
 * Generates an active subscriber document.
 */
const activeSubscriber = subscriberDoc.map((doc) => ({
  ...doc,
  status: "active",
  segments: ["main_website", "sproochentest_prep"],
  unsubscribedAt: null,
}));

/**
 * Generates an unsubscribed subscriber document.
 */
const unsubscribedSubscriber = subscriberDoc.map((doc) => ({
  ...doc,
  status: "unsubscribed",
  segments: [],
  unsubscribedAt: Date.now(),
}));

/**
 * Generates a new subscriber request body (what comes in from the API).
 */
const subscribeRequest = fc.record({
  email: validEmail,
  utm_source: fc.option(utmSource, { nil: undefined }),
});

module.exports = {
  subscriberStatus,
  segmentArray,
  utmSource,
  timestamp,
  subscriberDoc,
  activeSubscriber,
  unsubscribedSubscriber,
  subscribeRequest,
};
