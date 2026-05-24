/**
 * fast-check arbitraries for generating Resend webhook payloads.
 */
const fc = require("fast-check");
const { validEmail } = require("./email");

/**
 * Generates a valid Svix webhook header set.
 */
const svixHeaders = fc.record({
  "svix-id": fc.hexaString({ minLength: 20, maxLength: 30 }).map((s) => `msg_${s}`),
  "svix-timestamp": fc.integer({ min: 1672531200, max: 1893456000 }).map(String),
  "svix-signature": fc.hexaString({ minLength: 40, maxLength: 64 }).map((s) => `v1,${s}`),
});

/**
 * Generates a hard bounce webhook payload.
 */
const hardBouncePayload = fc.record({
  type: fc.constant("email.bounced"),
  data: fc.record({
    email_id: fc.hexaString({ minLength: 20, maxLength: 30 }),
    from: fc.constant("hasan@hasanjaffal.com"),
    to: fc.tuple(validEmail).map(([e]) => [e]),
    created_at: fc.constant(new Date().toISOString()),
    bounce: fc.record({
      message: fc.constantFrom(
        "550 5.1.1 The email account does not exist",
        "550 User not found",
        "552 Mailbox full",
        "550 No such user"
      ),
    }),
  }),
});

/**
 * Generates a complaint webhook payload.
 */
const complaintPayload = fc.record({
  type: fc.constant("email.complained"),
  data: fc.record({
    email_id: fc.hexaString({ minLength: 20, maxLength: 30 }),
    from: fc.constant("hasan@hasanjaffal.com"),
    to: fc.tuple(validEmail).map(([e]) => [e]),
    created_at: fc.constant(new Date().toISOString()),
  }),
});

/**
 * Generates a soft bounce (delivery delayed) webhook payload.
 */
const softBouncePayload = fc.record({
  type: fc.constant("email.delivery_delayed"),
  data: fc.record({
    email_id: fc.hexaString({ minLength: 20, maxLength: 30 }),
    from: fc.constant("hasan@hasanjaffal.com"),
    to: fc.tuple(validEmail).map(([e]) => [e]),
    created_at: fc.constant(new Date().toISOString()),
    delayed: fc.record({
      message: fc.constantFrom(
        "421 Try again later",
        "450 Requested mail action not taken",
        "451 Temporary service unavailable"
      ),
    }),
  }),
});

/**
 * Generates any valid webhook payload (bounce, complaint, or soft bounce).
 */
const anyWebhookPayload = fc.oneof(hardBouncePayload, complaintPayload, softBouncePayload);

/**
 * Generates an invalid/malformed webhook payload.
 */
const invalidWebhookPayload = fc.oneof(
  fc.constant({}),
  fc.constant({ type: "unknown.event" }),
  fc.record({
    type: fc.constantFrom("email.bounced", "email.complained"),
    data: fc.constant(null),
  }),
  fc.record({
    type: fc.constantFrom("email.bounced", "email.complained"),
    data: fc.record({
      email_id: fc.constant(null),
      to: fc.constant([]),
    }),
  })
);

module.exports = {
  svixHeaders,
  hardBouncePayload,
  complaintPayload,
  softBouncePayload,
  anyWebhookPayload,
  invalidWebhookPayload,
};
