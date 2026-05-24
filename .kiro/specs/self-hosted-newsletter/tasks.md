# Implementation Plan: Self-Hosted Newsletter

## Overview

Replace the Beehiiv newsletter platform with a fully self-hosted system built on the existing Firebase Cloud Functions + Firestore infrastructure. Implementation follows the existing patterns in `functions/index.js` — `onRequest` handlers with `region: "europe-west1"`, `cors: true`, and `secrets` arrays. All functions use JavaScript (Node.js 20).

## Tasks

- [x] 1. Infrastructure setup and core utilities
  - [x] 1.1 Add `svix` dependency to `functions/package.json` and create helper module `functions/newsletter/utils.js` with token generation (unsubscribe token + hash), tracking token encode/decode, email validation, and email normalization functions
    - Add `"svix": "^1.x"` to dependencies
    - Create `functions/newsletter/utils.js` with: `generateUnsubscribeToken()`, `generateTrackingToken(subscriberId, editionId)`, `decodeTrackingToken(token)`, `validateEmail(email)`, `normalizeEmail(email)`, `maskEmail(email)`
    - _Requirements: 1.4, 3.6_

  - [x] 1.2 Create Firestore security rules for `subscribers`, `editions`, and `events` collections in `firestore.rules`
    - Add explicit deny rules for the three new collections (matching existing pattern of `allow read, write: if false`)
    - _Requirements: 11.1, 11.2_

  - [x] 1.3 Create shared auth verification helper `functions/newsletter/auth.js` that verifies Firebase ID tokens
    - Export `verifyAdminToken(req)` that extracts Bearer token from Authorization header and calls `admin.auth().verifyIdToken()`
    - Returns decoded token on success, throws on failure
    - _Requirements: 11.1, 11.2, 11.3_

  - [x] 1.4 Write property tests for token generation and email validation utilities
    - **Property 1: Subscribe creates correct record** (token generation portion)
    - **Property 4: Invalid emails are rejected**
    - **Validates: Requirements 1.1, 1.4**

- [x] 2. Core subscriber management
  - [x] 2.1 Implement `subscribeNewsletter` Cloud Function in `functions/newsletter/subscribe.js` — replaces existing Beehiiv-based subscribe
    - POST handler: validate email, normalize, check existing subscriber in Firestore
    - If new: create subscriber doc with status "active", segments `["main_website", "sproochentest_prep"]`, generated unsubscribe token hash, utm_source, timestamps
    - If active: return success (idempotent)
    - If unsubscribed: reactivate (set status "active", record `reactivatedAt`)
    - Send welcome email on new creation or reactivation
    - _Requirements: 1.1, 1.2, 1.3, 1.5, 1.6, 8.2, 8.3_

  - [x] 2.2 Implement welcome email sending within the subscribe function
    - Send via Resend from "Hasan Jaffal <hasan@hasanjaffal.com>"
    - Include newsletter name "The Second Mind", content topics, expected frequency
    - Include personalized unsubscribe link with raw token
    - Include `List-Unsubscribe` and `List-Unsubscribe-Post` headers
    - On failure: log error, set `welcomeEmailFailed: true` on subscriber doc, still return success
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.5, 10.1, 10.3_

  - [x]* 2.3 Write property tests for subscribe function
    - **Property 1: Subscribe creates correct record**
    - **Property 2: Subscribe is idempotent for active subscribers**
    - **Property 3: Reactivation transitions unsubscribed to active**
    - **Property 4: Invalid emails are rejected**
    - **Property 5: All sent emails contain personalized unsubscribe link**
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 2.3, 3.5**

- [x] 3. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Unsubscribe preference page and API
  - [x] 4.1 Implement `newsletterPreferences` Cloud Function in `functions/newsletter/preferences.js`
    - GET handler: accept `token` query param, hash it, look up subscriber by `unsubscribeTokenHash`, return masked email and current segments
    - POST handler: accept `token` and `segments` array in body, update subscriber segments; if empty segments → set status "unsubscribed" + `unsubscribedAt`; if non-empty → keep status "active"
    - Support RFC 8058 one-click unsubscribe: POST with empty body unsubscribes from all
    - Invalid token: return 404 with generic error, no data leak
    - _Requirements: 3.1, 3.2, 3.3, 3.5, 3.6, 3.7, 8.5_

  - [x] 4.2 Create Jekyll static page at `newsletter/preferences/index.html` with JavaScript for the unsubscribe UI
    - Read `?token=` from URL
    - Call GET `/newsletterPreferences?token=...` to load current state
    - Display two checkboxes: "The Second Mind (AI, risk, operations)" and "Sproochentest Prep"
    - Pre-check boxes based on current segments
    - On submit: call POST `/newsletterPreferences` with selected segments
    - Show confirmation messages for unsubscribe/update/invalid token
    - Style consistent with site design system (use page-specific CSS)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.6_

  - [x]* 4.3 Write property tests for preference management
    - **Property 6: Preference update correctly sets segments**
    - **Property 7: Invalid tokens don't leak info or mutate state**
    - **Validates: Requirements 3.2, 3.3, 3.6, 8.5**

- [x] 5. Newsletter compose and send
  - [x] 5.1 Implement `sendNewsletter` Cloud Function in `functions/newsletter/send.js` — GET handler for listing posts
    - GET with `action=listPosts`: read post metadata from site RSS feed or Firestore, return sorted by date descending with title, date, excerpt, URL, tags
    - Require Firebase ID token auth
    - _Requirements: 4.1, 4.13_

  - [x] 5.2 Implement `sendNewsletter` POST handler for composing and sending editions
    - Validate admin auth via Firebase ID token
    - Validate subject non-empty, at least one post selected
    - Query active subscribers for target segment
    - Create edition document in Firestore with status "sending"
    - Render HTML email template with post cards, featured post, tool invitation
    - Rewrite all links through click proxy (except unsubscribe link)
    - Embed unique tracking pixel per subscriber-edition
    - Personalize unsubscribe link per subscriber
    - Send in batches of 10 with 1-second delays
    - Retry on 429 with exponential backoff (max 3 retries)
    - Log individual failures, continue processing
    - Update edition doc with final status and `failedSends` count
    - _Requirements: 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 4.10, 4.11, 4.12, 4.13, 7.3, 8.4, 8.6_

  - [x]* 5.3 Write property tests for newsletter sending
    - **Property 8: Recipient filtering by segment and status**
    - **Property 9: Template rendering includes all post content**
    - **Property 10: Tracking pixel is unique per subscriber-edition**
    - **Property 11: Link rewriting routes all links through click proxy**
    - **Property 12: Batching respects rate limits**
    - **Validates: Requirements 4.3, 4.4, 4.6, 4.7, 4.8**

- [x] 6. Email template
  - [x] 6.1 Create email template renderer `functions/newsletter/template.js`
    - Export `renderNewsletter({ subject, posts, featuredPost, toolInvitation, unsubscribeUrl, trackingPixelUrl })` function
    - Table-based HTML email following existing pattern from `analyzeJobRisk` function
    - Header with "THE SECOND MIND" branding
    - Post cards section (title, excerpt, "Read more" link)
    - Featured post section (larger title, full excerpt, highlighted CTA)
    - Tool invitation section (name, description, CTA button)
    - Footer with unsubscribe link, manage preferences link, physical address (Luxembourg)
    - Tracking pixel at bottom
    - All links (except unsubscribe) use click proxy URLs
    - _Requirements: 4.2, 4.3, 4.4, 4.5, 4.7, 10.1, 10.2, 10.3_

  - [x]* 6.2 Write unit tests for template rendering
    - Test that all post titles/excerpts appear in output
    - Test featured post renders with highlighted CTA
    - Test tool invitation renders with correct link
    - Test footer contains physical address and unsubscribe link
    - **Property 9: Template rendering includes all post content**
    - **Validates: Requirements 4.2, 4.3, 10.1, 10.2**

- [x] 7. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Tracking (open pixel and click proxy)
  - [x] 8.1 Implement `trackOpen` Cloud Function in `functions/newsletter/tracking.js`
    - GET handler: decode base64url tracking token to get `{subscriberId, editionId}`
    - Record open event in Firestore `events` collection with compound doc ID `{subscriberId}_{editionId}_open` (dedup)
    - Always return valid 1x1 transparent PNG with `Cache-Control: no-store, no-cache`
    - Invalid token: return PNG without recording event
    - _Requirements: 5.1, 5.2, 5.3_

  - [x] 8.2 Implement `trackClick` Cloud Function in `functions/newsletter/tracking.js`
    - GET handler: decode tracking token and base64url-encoded destination URL
    - Record click event in Firestore `events` collection (auto-generated doc ID)
    - Return 302 redirect to original destination URL
    - Invalid token: redirect to `https://hasanjaffal.com` without recording
    - _Requirements: 6.1, 6.2, 6.3_

  - [x]* 8.3 Write property tests for tracking
    - **Property 14: Open tracking is idempotent**
    - **Property 15: Click tracking records event and redirects**
    - **Property 16: Invalid click tokens redirect to homepage**
    - **Validates: Requirements 5.1, 5.2, 6.1, 6.2, 6.3**

- [x] 9. Bounce handling
  - [x] 9.1 Implement `handleBounce` Cloud Function in `functions/newsletter/bounce.js`
    - POST handler: validate Svix webhook signature using `RESEND_WEBHOOK_SECRET`
    - Hard bounce (`email.bounced`): set subscriber status to "bounced", record reason and `bouncedAt`
    - Complaint (`email.complained`): set subscriber status to "complained", record `complainedAt`
    - Soft bounce (`email.delivery_delayed`): increment `softBounceCount`, add to `softBounces` array
    - 3+ soft bounces in 30-day rolling window → set status "bounced"
    - Invalid signature: return 401
    - Subscriber not found: return 200 (acknowledge webhook), log warning
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

  - [x]* 9.2 Write property tests for bounce handling
    - **Property 17: Hard bounce transitions subscriber to bounced**
    - **Property 18: Complaint transitions subscriber to complained**
    - **Property 19: Invalid webhook signatures are rejected**
    - **Property 20: Soft bounce increments counter without status change**
    - **Property 21: Three soft bounces in 30 days triggers bounce status**
    - **Validates: Requirements 7.1, 7.2, 7.4, 7.5, 7.6**

- [x] 10. Analytics
  - [x] 10.1 Implement `getAnalytics` Cloud Function in `functions/newsletter/analytics.js`
    - GET with `type=editions`: return all editions sorted by `sentAt` descending with calculated open/click rates from events collection
    - GET with `type=edition&id=...`: return full edition detail including clicked links aggregated from events
    - GET with `type=overview`: aggregate subscriber counts by status, segment, and utm_source
    - All endpoints require Firebase ID token verification
    - Return null rates for editions with zero recipients
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 11.1_

  - [x]* 10.2 Write property tests for analytics
    - **Property 23: Analytics rate calculations**
    - **Property 24: Subscriber overview counts are correct**
    - **Property 25: Admin endpoints reject unauthenticated requests**
    - **Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5, 11.1**

- [x] 11. Subscriber admin management
  - [x] 11.1 Implement `manageSubscribers` Cloud Function in `functions/newsletter/manage.js`
    - GET with `action=list`: return subscribers filtered by optional status, sorted by `subscribedAt` descending
    - POST with `action=add`: create subscriber with status "active", both segments, utm_source "admin_added"; return 409 if email exists
    - POST with `action=deactivate`: set status to "unsubscribed", record timestamp, no notification
    - POST with `action=delete`: permanently remove subscriber doc and all associated events
    - All actions require Firebase ID token verification
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7, 10.4, 11.3_

  - [x]* 11.2 Write unit tests for subscriber management
    - Test list returns correct format and sorting
    - Test add creates correct record
    - Test add returns 409 for duplicate
    - Test deactivate sets correct status
    - Test delete removes subscriber and events
    - Test unauthenticated requests return 401
    - **Validates: Requirements 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7**

- [x] 12. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 13. Import from Beehiiv
  - [x] 13.1 Implement `importSubscribers` Cloud Function in `functions/newsletter/import.js`
    - POST handler: accept JSON array of subscriber records
    - Validate each email format, skip duplicates (by email lookup in Firestore)
    - Create subscriber docs with provided email, status, utm_source "beehiiv", original `subscribedAt`
    - Generate unsubscribe token for each imported subscriber
    - Return summary: `{ imported, skipped, rejected }`
    - Require Firebase ID token auth
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 11.1_

  - [x]* 13.2 Write property tests for import
    - **Property 26: Import invariant**
    - **Validates: Requirements 12.1, 12.2, 12.3, 12.4**

- [x] 14. Integration — wire functions and update existing code
  - [x] 14.1 Register all new Cloud Functions in `functions/index.js` by requiring and exporting from the newsletter modules
    - Import and export: `subscribeNewsletter` (replace existing), `newsletterPreferences`, `sendNewsletter`, `trackOpen`, `trackClick`, `handleBounce`, `getAnalytics`, `manageSubscribers`, `importSubscribers`
    - Remove Beehiiv API calls from existing `subscribeNewsletter`, `sendContactMessage`, `sendFutureProofSkillsGuide`, and `analyzeJobRisk` functions
    - Update those functions to call the new self-hosted subscribe logic instead of Beehiiv
    - _Requirements: 1.1, 1.6_

  - [x] 14.2 Update `_data/firebase.yml` with new Cloud Function URLs for the newsletter endpoints
    - Add entries for: `newsletterPreferences`, `sendNewsletter`, `trackOpen`, `trackClick`, `handleBounce`, `getAnalytics`, `manageSubscribers`, `importSubscribers`
    - _Requirements: 1.1_

  - [x] 14.3 Update existing subscribe forms across the site to use the new self-hosted `subscribeNewsletter` function (remove any Beehiiv form IDs or references)
    - Update `_includes/newsletter.html` and any other forms that currently reference Beehiiv
    - Ensure forms POST to the new Cloud Function URL from `_data/firebase.yml`
    - Remove `BEEHIIV_API_KEY` and `BEEHIIV_PUBLICATION_ID` secrets from functions that no longer need them
    - _Requirements: 1.1, 10.5_

- [x] 15. Testing infrastructure and final validation
  - [x] 15.1 Set up test infrastructure: create `functions/test/` directory structure, add `jest` and `fast-check` as dev dependencies, create mock helpers for Resend and Firestore
    - Create `functions/test/helpers/mock-resend.js` and `functions/test/helpers/mock-firestore.js`
    - Create `functions/test/generators/` with email, subscriber, post, and webhook generators for fast-check
    - Add test scripts to `functions/package.json`
    - _Requirements: All (testing infrastructure)_

  - [x]* 15.2 Write integration tests for full subscribe → welcome email flow
    - Test complete flow with mocked Resend and in-memory Firestore
    - Verify subscriber doc created correctly
    - Verify welcome email sent with correct content
    - **Validates: Requirements 1.1, 1.6, 2.1, 2.2, 2.3**

  - [x]* 15.3 Write integration tests for full newsletter send flow
    - Test: compose → query subscribers → batch send → edition created
    - Verify batching behavior and edition document
    - **Validates: Requirements 4.1, 4.6, 4.8, 4.11**

  - [x]* 15.4 Write integration tests for bounce → exclusion flow
    - Test: bounce webhook → subscriber status update → excluded from next send
    - **Validates: Requirements 7.1, 7.3**

- [x] 16. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The existing `firestore.rules` already denies all client access — new collections inherit this protection
- All functions follow the existing pattern: `onRequest` with `region: "europe-west1"`, `cors: true`, `secrets` array
- The `BEEHIIV_API_KEY` and `BEEHIIV_PUBLICATION_ID` secrets can be removed from Firebase after migration is complete

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3"] },
    { "id": 1, "tasks": ["1.4", "2.1", "15.1"] },
    { "id": 2, "tasks": ["2.2", "6.1"] },
    { "id": 3, "tasks": ["2.3", "4.1", "6.2"] },
    { "id": 4, "tasks": ["4.2", "4.3", "5.1"] },
    { "id": 5, "tasks": ["5.2", "8.1", "8.2"] },
    { "id": 6, "tasks": ["5.3", "8.3", "9.1"] },
    { "id": 7, "tasks": ["9.2", "10.1", "11.1"] },
    { "id": 8, "tasks": ["10.2", "11.2", "13.1"] },
    { "id": 9, "tasks": ["13.2", "14.1"] },
    { "id": 10, "tasks": ["14.2", "14.3"] },
    { "id": 11, "tasks": ["15.2", "15.3", "15.4"] }
  ]
}
```
