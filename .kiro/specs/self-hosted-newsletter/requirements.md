# Requirements Document

## Introduction

Self-hosted newsletter system replacing Beehiiv for "The Second Mind" newsletter. The system manages subscriber lifecycle (subscribe, unsubscribe, reactivate), sends welcome emails and newsletters via Resend, tracks engagement (opens, clicks), handles bounces, and provides analytics — all within the existing Firebase Cloud Functions and Firestore infrastructure. The goal is full ownership of the subscriber list and sending pipeline with no third-party newsletter platform dependency.

## Glossary

- **Newsletter_System**: The complete self-hosted newsletter platform running on Firebase Cloud Functions, Firestore, and Resend
- **Subscriber_Manager**: The component responsible for managing subscriber records in Firestore (create, update, status changes)
- **Email_Sender**: The component that sends emails via the Resend API (welcome emails, newsletters, transactional emails)
- **Tracking_Pixel**: A transparent 1x1 image embedded in emails whose HTTP request signals that a recipient opened the email
- **Click_Proxy**: A Cloud Function endpoint that redirects link clicks through a tracking URL before forwarding to the destination
- **Bounce_Handler**: The component that processes bounce and complaint webhooks from Resend and updates subscriber status
- **Newsletter_Dispatcher**: The admin-facing API endpoint for composing and sending newsletter editions
- **Newsletter_Template**: A standard HTML email template that renders selected posts, featured content, and tool invitations into a newsletter edition
- **Post_List**: The API endpoint that returns all published posts sorted by date (most recent first) for the author to select from during composition
- **Subscriber**: A person who has opted in to receive "The Second Mind" newsletter
- **Edition**: A single newsletter issue composed of subject, HTML content, and metadata
- **Segment**: A grouping of subscribers filtered by utm_source, status, or other attributes
- **Unsubscribe_Token**: A unique, non-guessable token embedded in each email that identifies the subscriber for one-click unsubscribe
- **Webhook**: An HTTP callback from Resend that notifies the system of delivery events (bounce, complaint, delivery)

## Requirements

### Requirement 1: Subscribe a New Subscriber

**User Story:** As a website visitor, I want to subscribe to the newsletter from any form on the site, so that I receive "The Second Mind" newsletter editions.

#### Acceptance Criteria

1. WHEN a valid email address and utm_source are submitted, THE Subscriber_Manager SHALL create a new subscriber record in Firestore with status "active", the provided utm_source, and a server timestamp
2. WHEN a subscription request contains an email that already exists with status "active", THE Subscriber_Manager SHALL return a success response without creating a duplicate record
3. WHEN a subscription request contains an email that already exists with status "unsubscribed", THE Subscriber_Manager SHALL update the subscriber status to "active" and record the reactivation timestamp
4. IF a subscription request contains an invalid email format, THEN THE Subscriber_Manager SHALL return a 400 error with a descriptive message
5. IF email validation fails after partial processing, THEN THE Subscriber_Manager SHALL roll back any partial changes ensuring no subscriber record or side effects remain
6. WHEN a new subscriber is successfully created, THE Email_Sender SHALL send a welcome email to the subscriber within 10 seconds

### Requirement 2: Send Welcome Email

**User Story:** As a new subscriber, I want to receive a welcome email immediately after subscribing, so that I know my subscription was successful and what to expect.

#### Acceptance Criteria

1. WHEN a subscriber is newly created or reactivated, THE Email_Sender SHALL send a welcome email from "Hasan Jaffal <hasan@hasanjaffal.com>" via Resend
2. THE Email_Sender SHALL include the newsletter name "The Second Mind", a brief description of content topics, and expected frequency in the welcome email body
3. THE Email_Sender SHALL include a one-click unsubscribe link using the subscriber Unsubscribe_Token in the welcome email
4. IF the welcome email fails to send, THEN THE Newsletter_System SHALL log the failure with the subscriber email and error details, and mark the subscriber record with a "welcome_email_failed" flag

### Requirement 3: Unsubscribe a Subscriber

**User Story:** As a subscriber, I want to manage which newsletters I receive, so that I can stop receiving content I no longer want while keeping content I still value.

#### Acceptance Criteria

1. WHEN a valid Unsubscribe_Token is received via GET request, THE Newsletter_System SHALL display a preference page showing the two newsletter segments (Main Website, Sproochentest Prep) with checkboxes for the ones the subscriber still wants to receive
2. WHEN the subscriber submits their preferences, THE Subscriber_Manager SHALL update the subscriber segment subscriptions accordingly and record the update timestamp
3. IF the subscriber unchecks all segments, THEN THE Subscriber_Manager SHALL update the subscriber status to "unsubscribed" and record the unsubscribe timestamp
4. WHEN a subscriber is fully unsubscribed, THE Newsletter_System SHALL display a confirmation page acknowledging the unsubscription
5. THE Newsletter_System SHALL include a List-Unsubscribe header and a List-Unsubscribe-Post header in every sent email to support one-click unsubscribe per RFC 8058
6. IF an invalid or expired Unsubscribe_Token is received, THEN THE Newsletter_System SHALL display a generic "already unsubscribed or invalid link" page without revealing subscriber information and SHALL NOT modify any subscriber record
7. WHEN a subscriber unsubscribes from a segment, THE Newsletter_System SHALL stop sending editions from that segment to that email address within 1 processing cycle

### Requirement 4: Compose and Send a Newsletter Edition

**User Story:** As the newsletter author, I want to compose a newsletter by selecting posts, featuring content, and including tool invitations, so that I can send a curated edition to subscribers.

#### Acceptance Criteria

1. WHEN the author accesses the compose endpoint, THE Newsletter_System SHALL return a list of all published posts sorted by date (most recent first) with title, date, excerpt, and URL
2. WHEN the author selects one or more posts from the list, THE Newsletter_Template SHALL include each selected post in the email body as a card with title, excerpt, and "Read more" link
3. WHEN the author designates a post as "featured", THE Newsletter_Template SHALL render that post prominently after the list of regular posts with a larger title, full excerpt, and a highlighted CTA button
4. WHEN the author includes a tools invitation, THE Newsletter_Template SHALL render a tools section at the bottom of the email with a brief description and CTA link to the specified tool (e.g., AI Job Risk Assessment, Future-Proof Skills Assessment)
5. WHEN the author specifies a subject line and target segment, THE Newsletter_System SHALL validate that the subject is non-empty and at least one post is selected
6. WHEN a valid edition is submitted for sending, THE Email_Sender SHALL send the edition to all active subscribers matching the target segment
7. THE Email_Sender SHALL personalize each email with the subscriber Unsubscribe_Token in the unsubscribe link
8. THE Email_Sender SHALL embed a Tracking_Pixel unique to each subscriber-edition combination in the email HTML
9. THE Email_Sender SHALL rewrite ALL links in the email HTML (post links, featured post CTA, tool invitation links) to route through the Click_Proxy for tracking
10. WHEN sending to more than 50 subscribers, THE Email_Sender SHALL batch sends at a rate that respects Resend API rate limits (maximum 10 emails per second)
11. WHEN sending begins, THE Newsletter_System SHALL store the edition metadata (subject, selected posts, featured post, tools included, send timestamp, recipient count, segment) in Firestore
12. IF an individual email send fails, THEN THE Email_Sender SHALL log the failure and continue sending to remaining subscribers
13. THE compose and send endpoint SHALL require valid admin authentication before processing any request

### Requirement 5: Track Email Opens

**User Story:** As the newsletter author, I want to know how many subscribers opened each edition, so that I can measure engagement and improve content.

#### Acceptance Criteria

1. WHEN a Tracking_Pixel HTTP request is received, THE Newsletter_System SHALL record an open event with the subscriber ID, edition ID, and timestamp in Firestore
2. THE Newsletter_System SHALL count only the first open per subscriber per edition for unique open rate calculation
3. THE Tracking_Pixel endpoint SHALL return a valid 1x1 transparent PNG image with appropriate cache-control headers to prevent browser caching

### Requirement 6: Track Link Clicks

**User Story:** As the newsletter author, I want to know which links subscribers click in each edition, so that I can understand what content resonates.

#### Acceptance Criteria

1. WHEN a Click_Proxy request is received with a valid tracking token, THE Newsletter_System SHALL record a click event with the subscriber ID, edition ID, original URL, and timestamp in Firestore
2. WHEN a valid tracking token is received, THE Click_Proxy SHALL redirect the subscriber to the original destination URL with a 302 status code
3. IF a Click_Proxy request contains an invalid tracking token, THEN THE Click_Proxy SHALL redirect to the site homepage without recording an event

### Requirement 7: Handle Bounces and Complaints

**User Story:** As the newsletter system operator, I want bounces and complaints to be handled automatically, so that my sender reputation stays healthy and I comply with email regulations.

#### Acceptance Criteria

1. WHEN a hard bounce webhook is received from Resend, THE Bounce_Handler SHALL update the subscriber status to "bounced" and record the bounce reason and timestamp
2. WHEN a complaint (spam report) webhook is received from Resend, THE Bounce_Handler SHALL update the subscriber status to "complained" and record the complaint timestamp
3. WHILE a subscriber has status "bounced" or "complained", THE Email_Sender SHALL exclude that subscriber from all future sends
4. THE Bounce_Handler SHALL validate the webhook signature from Resend to prevent spoofed webhook calls
5. IF a soft bounce is received, THEN THE Bounce_Handler SHALL increment a soft bounce counter on the subscriber record without changing status
6. WHEN a subscriber accumulates 3 or more soft bounces within a rolling 30-day window, THE Bounce_Handler SHALL update the subscriber status to "bounced" (only soft bounces within the rolling window count toward the threshold)

### Requirement 8: Segment Subscribers by Newsletter

**User Story:** As the newsletter author, I want subscribers organized into two newsletter segments, so that I can send relevant content to the right audience.

#### Acceptance Criteria

1. THE Newsletter_System SHALL support exactly two segments: "main_website" (The Second Mind — AI, risk, operations) and "sproochentest_prep" (Sproochentest updates and materials)
2. WHEN a new subscriber is created, THE Subscriber_Manager SHALL subscribe them to both segments by default
3. THE Subscriber_Manager SHALL store segment subscriptions as an array on the subscriber record (e.g., ["main_website", "sproochentest_prep"])
4. WHEN a newsletter edition is sent for a specific segment, THE Email_Sender SHALL send only to active subscribers who are subscribed to that segment
5. WHEN a subscriber unsubscribes from one segment but remains subscribed to the other, THE Subscriber_Manager SHALL keep the subscriber status as "active" and only remove the unsubscribed segment from their subscriptions array
6. THE Post_Detector SHALL determine the segment for each post based on the post's tags or path (posts tagged "sproochentest" or in the sproochentest path go to "sproochentest_prep", all others go to "main_website")

### Requirement 9: Provide Analytics and Reporting

**User Story:** As the newsletter author, I want to view a list of past editions and drill into each one's analytics, so that I can track newsletter performance over time.

#### Acceptance Criteria

1. WHEN the author requests the editions list, THE Newsletter_System SHALL return all sent editions sorted by send date (most recent first) with subject, segment, recipient count, open rate, click rate, and send timestamp
2. WHEN the author selects a specific edition, THE Newsletter_System SHALL return detailed analytics: total recipients, unique opens, unique clicks, open rate percentage, click rate percentage, list of clicked links with click counts, and list of posts included
3. WHEN an analytics request is made for subscriber overview, THE Newsletter_System SHALL return: total active subscribers, total unsubscribed, total bounced, and subscriber count per segment
4. THE Newsletter_System SHALL calculate open rate as (unique opens / total recipients) multiplied by 100, where unique opens are capped at one per recipient per edition regardless of how many times the recipient opens the email
5. THE Newsletter_System SHALL calculate click rate as (unique clicks / total recipients) multiplied by 100
6. WHEN an edition has zero recipients, THE Newsletter_System SHALL return null rates rather than 0% for open rate and click rate
7. ALL analytics endpoints SHALL require valid admin authentication

### Requirement 10: CAN-SPAM and GDPR Compliance

**User Story:** As the newsletter system operator, I want the system to comply with CAN-SPAM and GDPR regulations, so that the newsletter operates legally.

#### Acceptance Criteria

1. THE Email_Sender SHALL include a visible unsubscribe link in the footer of every newsletter edition
2. THE Email_Sender SHALL include the sender physical mailing address in the footer of every newsletter edition
3. THE Email_Sender SHALL include the "From" name and email address accurately identifying the sender in every email
4. WHEN a subscriber requests data deletion (GDPR right to erasure), THE Subscriber_Manager SHALL permanently delete all subscriber data including tracking events within a consistent 30-day processing window
5. THE Newsletter_System SHALL not share subscriber email addresses with third-party services beyond Resend for email delivery

### Requirement 11: Admin Authentication for Analytics and Subscriber Management

**User Story:** As the newsletter author, I want analytics and subscriber management endpoints to be protected by authentication, so that only authorized users can view engagement data and manage subscribers.

#### Acceptance Criteria

1. WHEN an analytics request is received, THE Newsletter_System SHALL verify that the request includes a valid Firebase Admin authentication token
2. IF an analytics or subscriber management request lacks valid authentication, THEN THE Newsletter_System SHALL return a 401 error without processing the business logic of the request (authentication verification itself is acceptable processing)
3. WHEN a subscriber management request (list, delete, export) is received, THE Newsletter_System SHALL verify authentication before returning or modifying subscriber data

### Requirement 13: Manage Subscribers

**User Story:** As the newsletter author, I want to view, add, deactivate, and delete subscribers, so that I can maintain a clean and accurate subscriber list.

#### Acceptance Criteria

1. WHEN the author requests the subscriber list, THE Subscriber_Manager SHALL return all subscribers with their email, status, segments, utm_source, and subscription date, sorted by most recent first
2. WHEN the author requests the subscriber list with a status filter (active, unsubscribed, bounced, complained), THE Subscriber_Manager SHALL return only subscribers matching that status
3. WHEN the author adds a new subscriber manually with an email address, THE Subscriber_Manager SHALL create a subscriber record with status "active", both segments, utm_source "admin_added", and a server timestamp
4. WHEN the author adds a subscriber with an email that already exists, THE Subscriber_Manager SHALL return an error indicating the subscriber already exists
5. WHEN the author deactivates a subscriber, THE Subscriber_Manager SHALL update the subscriber status to "unsubscribed" and record the deactivation timestamp without sending any notification to the subscriber
6. WHEN the author deletes a subscriber, THE Subscriber_Manager SHALL permanently remove the subscriber record and all associated tracking events from Firestore
7. ALL subscriber management operations SHALL require valid admin authentication

### Requirement 12: Migrate Existing Subscribers from Beehiiv

**User Story:** As the newsletter system operator, I want to import existing subscribers from Beehiiv, so that I retain my current audience when switching platforms.

#### Acceptance Criteria

1. WHEN a CSV export from Beehiiv is provided, THE Subscriber_Manager SHALL import each subscriber with their email, status, utm_source, and original subscription date
2. THE Subscriber_Manager SHALL skip duplicate emails during import (not importing them) and log each skipped email as a duplicate with the total count of skipped records
3. THE Subscriber_Manager SHALL validate each email format during import and reject invalid entries with a logged error
4. WHEN import completes, THE Subscriber_Manager SHALL return a summary with total imported, total skipped, and total rejected counts
