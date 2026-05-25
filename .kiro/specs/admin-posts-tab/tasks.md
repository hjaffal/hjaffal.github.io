# Implementation Plan: Admin Posts Tab

## Overview

This plan adds a Posts management section to the existing admin dashboard at `newsletter/admin/index.html`. It restructures the sidebar navigation into three sections (Dashboard, Posts, Newsletter), adds a posts listing panel with Grid.js table, search, filters, and sorting, a post creation form with rich text editor, and AI post generation via Firebase Cloud Functions. The implementation builds incrementally: navigation restructure → data embedding → posts panel → dashboard enhancement → post creation → AI generation → Cloud Functions.

## Tasks

- [x] 1. Restructure sidebar navigation and add panel shells
  - [x] 1.1 Restructure sidebar navigation into three labeled sections
    - Modify `newsletter/admin/index.html` sidebar `<nav class="nla-sidebar-nav">` to add section labels ("Dashboard", "Posts", "Newsletter") using `<div class="nla-nav-section-label">` elements
    - Rename the "Overview" nav item to "Dashboard" with `data-panel="dashboard"`
    - Add "Posts" (`data-panel="posts"`) and "New Post" (`data-panel="new-post"`) nav items under the Posts section
    - Keep existing Compose, Subscribers, Analytics, Import items under the Newsletter section
    - Preserve sidebar footer (user email, sign-out) and external links section
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.9, 1.10_

  - [x] 1.2 Add CSS styles for navigation section labels
    - Add `.nla-nav-section-label` styles to `assets/css/newsletter-admin.css`
    - Style as uppercase, small font, muted color, with spacing above/below to visually separate groups
    - Ensure active state styling still works with `nla-nav-item active` class
    - _Requirements: 1.5, 1.8, 15.1, 15.3_

  - [x] 1.3 Add empty panel shells for Dashboard, Posts, and New Post
    - Rename `#panel-overview` to `#panel-dashboard` in the HTML
    - Add empty `#panel-posts` and `#panel-new-post` panel divs with `nla-panel` class
    - Update the JavaScript panel-switching logic to handle the renamed panel and new panels
    - Ensure "Dashboard" is the default active panel on load
    - Verify existing panels (Compose, Subscribers, Analytics, Import) still function
    - _Requirements: 1.6, 1.7, 1.11, 16.1, 16.6_

- [x] 2. Embed post data and implement Posts Panel listing
  - [x] 2.1 Add Jekyll Liquid template to embed post data as JSON
    - Add a `<script id="posts-data" type="application/json">` block in `newsletter/admin/index.html`
    - Iterate over `site.posts` using Liquid to serialize each post's metadata (title, slug, url, date, lastUpdated, author, tags, status, shareTitle, shareDescription, canonicalUrl, readingTime, thumbnailImg, shareImg, excerpt, wordCount)
    - Derive status using Liquid conditionals: `archived: true` → "archived", `published: false` or future date → "draft", else → "published"
    - _Requirements: 3.1, 3.5, 4.5, 4.6_

  - [x] 2.2 Implement post data parsing and loading logic
    - Write JavaScript function `loadPostsPanel()` that parses the embedded JSON from `#posts-data`
    - Show Loading_State (`nla-loading` spinner + "Loading posts…") while parsing
    - Handle parse errors by showing Error_State with "Post data could not be loaded" message
    - Handle empty array by showing Empty_Posts_State with icon, message, and CTA to create first post
    - Display "—" for any missing metadata fields
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.6, 3.7, 13.1, 13.4_

  - [x] 2.3 Implement Grid.js Posts Table with columns and pagination
    - Initialize Grid.js table in `#panel-posts` with columns: Title, Slug, Status, Published Date, Updated Date, Author, Position (tags), Actions
    - Use existing admin table classes (`nla-gridjs`, `nla-gridjs-table`, `nla-gridjs-th`, `nla-gridjs-td`)
    - Add custom cell formatters for status badges (`nla-badge-published`, `nla-badge-draft`, `nla-badge-archived`) and position badges (`nla-badge-position`)
    - Truncate Title at 60 chars and Slug at 40 chars with ellipsis and tooltip on hover
    - Set pagination to 20 posts per page
    - Default sort: published date descending (newest first)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.8, 4.9, 11.4_

  - [x] 2.4 Add CSS styles for post badges, table, and empty states
    - Add `.nla-badge-published` (green), `.nla-badge-draft` (amber), `.nla-badge-archived` (gray) styles
    - Add `.nla-badge-position` (purple) styles
    - Add `.nla-empty` and `.nla-empty-icon` styles for empty states (matching existing newsletter empty state patterns)
    - All new classes use `nla-` prefix, no inline styles
    - _Requirements: 4.3, 4.4, 13.3, 15.1, 15.2, 15.5_

- [x] 3. Checkpoint - Verify navigation and posts listing
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement search, filters, sorting, and post actions
  - [x] 4.1 Implement post search with debounce
    - Add search input with placeholder "Search by title, slug, position…" above the table
    - Implement debounced (300ms) client-side filtering on title, slug, and tags (case-insensitive substring match)
    - When search is cleared, restore full list respecting active filters
    - Combine search with active filters using AND logic
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

  - [x] 4.2 Implement status and position filter dropdowns
    - Add status filter dropdown: All, Published, Draft, Archived (default: All)
    - Add position filter dropdown: All, AI Operations, Decision Authority, Risk Intelligence, AI and Work (default: All)
    - Filter immediately on selection, client-side, no page reload
    - Apply AND logic between filters and search
    - Posts with no tags are excluded when position filter is active
    - Show Empty_Posts_State when filters produce zero results (distinct message from no-posts-exist)
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8, 13.2_

  - [x] 4.3 Implement column sorting
    - Enable Grid.js sorting on: Published Date, Updated Date, Title columns
    - Show visual sort direction indicator (arrow) on active sort column
    - Click non-active column → sort ascending; click active column → toggle direction
    - Place rows with missing values ("—") at end regardless of sort direction
    - _Requirements: 11.1, 11.2, 11.3, 11.5_

  - [x] 4.4 Implement View and Edit post actions
    - Add "View" button per row that opens the post's public URL in a new tab
    - Add "Edit" button per row that switches to a placeholder panel with "Edit feature planned" message and a "Back to Posts" button
    - Add copy-to-clipboard button for the public URL on each row
    - Ensure action buttons are keyboard-operable with accessible labels including post title
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 4.7_

  - [x] 4.5 Add CSS styles for posts toolbar (search + filters)
    - Add `.nla-posts-toolbar` container styles
    - Add `.nla-posts-search` input styles using `nla-input` base
    - Add `.nla-posts-filters` container with `nla-select` dropdowns
    - Add responsive stacking: filters stack vertically at ≤900px, individual controls stack at ≤480px
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 15.4, 15.5_

- [x] 5. Checkpoint - Verify search, filters, sorting, and actions
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement enhanced Dashboard Panel with post statistics
  - [x] 6.1 Implement post statistics computation and display
    - Write `computePostStats(posts)` function that calculates: total, published, draft, archived counts, posts this week, posts this month, per-position breakdown, latest post title/date
    - Display stats in `#panel-dashboard` below existing newsletter stats using a `.nla-post-stats` grid
    - Show position breakdown using display names ("AI Operations", "Decision Authority", "Risk Intelligence", "AI and Work")
    - Display "Not tracked" for total views and most viewed post (no analytics source exists)
    - Show "0" and "—" when no posts exist
    - Make post stats section clickable to navigate to Posts panel
    - _Requirements: 2.1, 2.2, 2.3, 2.5, 2.6, 2.7, 2.9_

  - [x] 6.2 Add CSS styles for dashboard post statistics
    - Add `.nla-post-stats` grid layout styles
    - Add `.nla-post-stats-position` styles for position breakdown cards
    - Reuse `nla-card` for stat containers
    - Handle error state: show newsletter stats normally + error message for posts section if post data fails
    - _Requirements: 2.4, 2.8, 15.5_

- [x] 7. Implement Post Creation Form (Start from Scratch)
  - [x] 7.1 Build the New Post panel with mode selector and form fields
    - Add mode toggle buttons ("Start from Scratch" / "Generate with AI") at top of `#panel-new-post`
    - Build form with fields: title (max 150), slug (auto-generated, editable, max 80), author (default "Hasan J."), position/tag dropdown (4 canonical tags only), status (draft/published), excerpt (max 300), meta title (max 70), meta description (max 160), featured image path, body content area
    - Pre-fill published date with current date
    - Implement `slugify(title)` function: lowercase, spaces→hyphens, remove non-alphanumeric except hyphens, collapse consecutive hyphens
    - Auto-generate slug as user types title
    - Add Cancel button (returns to Posts Table) and Save Post button
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.9, 7.10, 7.11_

  - [x] 7.2 Implement rich text editor for post body
    - Build Advanced_Editor using `contenteditable` div with toolbar buttons: Bold, Italic, Headings, Unordered List, Ordered List, Link, Blockquote, Code Block, Horizontal Rule
    - Output HTML that can be converted to markdown for saving
    - Style editor area with `.nla-editor` class and toolbar with formatting buttons
    - _Requirements: 7.5_

  - [x] 7.3 Implement form validation and submission logic
    - Validate required fields (title, body) on submit
    - Validate character limits (title ≤150, slug ≤80, excerpt ≤300, meta title ≤70, meta description ≤160)
    - Display inline validation errors adjacent to invalid fields
    - On valid submission, call `createPost` Cloud Function with form data
    - On success: show success notification for 5 seconds, add post to Posts Table
    - On failure: show error message, preserve all form data for retry
    - _Requirements: 7.6, 7.7, 7.8, 7.12, 7.13_

  - [x] 7.4 Add CSS styles for post creation form and editor
    - Add `.nla-post-form` and `.nla-post-form-grid` layout styles
    - Add `.nla-editor` styles for the rich text editor area
    - Add mode toggle button styles
    - Use `nla-input`, `nla-select`, `nla-btn`, `nla-btn-primary` for form controls
    - _Requirements: 15.2, 15.4, 15.5_

- [x] 8. Checkpoint - Verify post creation form UI
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Implement AI Post Generation UI
  - [x] 9.1 Build AI direction selection interface
    - Show 4 radio cards for canonical positions when "Generate with AI" mode is selected
    - Display position title and thesis text on each card
    - Add "Generate Post" confirm button (disabled until a direction is selected)
    - Style with `.nla-ai-directions` and `.nla-ai-direction-card` classes
    - _Requirements: 8.1, 8.2_

  - [x] 9.2 Implement AI generation flow and form population
    - On confirm, call `generatePost` Cloud Function with selected `positionTag`
    - Show loading indicator "Generating post…" and disable confirm button during generation
    - On timeout (60s): cancel request, show timeout error with Retry and "Start from Scratch" options
    - On success: populate Post_Creation_Form with generated title, subtitle (as share-description), tags, and body in editable state
    - On error: show error message with "Retry" and "Start from Scratch" buttons
    - _Requirements: 8.3, 8.4, 8.5, 8.6, 8.7_

  - [x] 9.3 Add CSS styles for AI generation UI
    - Add `.nla-ai-direction-card` and `.nla-ai-direction-card.selected` styles
    - Add loading state styles for generation in progress
    - Use `var(--accent)` for selected card border/highlight
    - _Requirements: 15.3_

- [x] 10. Implement Cloud Functions for post creation and AI generation
  - [x] 10.1 Create `functions/posts/create.js` — createPost Cloud Function
    - Export `createPost` as an `onRequest` Cloud Function (europe-west1, cors, secrets: GITHUB_PAT)
    - Validate Firebase Auth token (admin only, same pattern as existing functions)
    - Validate required fields (title, body), character limits, and tags (must be from 4 canonical positions only)
    - Generate filename: `YYYY-MM-DD-slug.md`
    - Build front matter YAML (layout, title, subtitle, share-title, share-description, tags, author, thumbnail-img, share-img) + body markdown
    - Commit file to GitHub repo via `@octokit/rest` using GITHUB_PAT secret
    - Return `{ result: "success", filename, url }` on success or `{ error: "message" }` on failure
    - Return 401 for unauthorized requests
    - _Requirements: 7.6, 16.1, 16.5_

  - [x] 10.2 Create `functions/posts/generate.js` — generatePost Cloud Function
    - Export `generatePost` as an `onRequest` Cloud Function (europe-west1, cors, timeout 120s, memory 512MiB, secrets: GEMINI_API_KEY)
    - Validate Firebase Auth token
    - Validate `positionTag` is one of the 4 canonical tags
    - Hardcode POSITIONS, ARTICLE_FORMS, TONES arrays (identical to `scripts/generate_post.py`)
    - Randomly select angle, form, tone
    - Build the exact same prompt structure as `generate_post.py` (POSITION, THESIS, ANGLE, FORM, TONE, TAG, recent titles, AUDIENCE, CONTENT RULES, WRITING RULES, DIVERSITY INSTRUCTIONS)
    - Call Gemini `gemini-2.5-flash` model
    - Parse JSON response, force `tags = [positionTag]` regardless of model output
    - Return `{ title, subtitle, shareDescription, tags, body }`
    - _Requirements: 8.8, 8.9, 8.10, 8.11_

  - [x] 10.3 Wire Cloud Functions into `functions/index.js` and install dependencies
    - Add `const { createPost } = require("./posts/create");` and `const { generatePost } = require("./posts/generate");` to `functions/index.js`
    - Export both functions: `exports.createPost = createPost;` and `exports.generatePost = generatePost;`
    - Add `GITHUB_PAT` secret definition with `defineSecret`
    - Install `@octokit/rest` in `functions/package.json`
    - _Requirements: 16.5_

  - [x] 10.4 Add Cloud Function URLs to `_data/firebase.yml`
    - Add `fn_create_post` and `fn_generate_post` URL entries
    - Update the frontend JavaScript to read these URLs from the embedded site data for API calls
    - _Requirements: 7.6, 8.3_

- [x] 11. Implement view count display and post detail expansion
  - [x] 11.1 Add view count column and post detail row expansion
    - Add Views column to Grid.js table displaying "—" for all posts (no analytics source exists)
    - Implement row expansion to show inline detail section with extended metadata: meta title, meta description, canonical URL, reading time, featured image, excerpt, public URL
    - Calculate reading time from wordCount (200 words/min, rounded up) if not in front matter
    - Display all detail fields as read-only, show "—" for missing fields
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 12.1, 12.2, 12.3, 12.4, 12.5_

- [x] 12. Implement responsive layout and final styling
  - [x] 12.1 Add responsive CSS for posts panel
    - At ≤900px: sidebar collapses (existing behavior), posts table enables horizontal scroll, filters and search stack vertically
    - At ≤480px: individual filter controls stack vertically, full width
    - Ensure all interactive elements have minimum 44×44px touch targets on mobile
    - _Requirements: 14.1, 14.2, 14.3, 14.4_

  - [x] 12.2 Final styling pass and compliance check
    - Verify all new CSS classes use `nla-` prefix
    - Verify no inline `style` attributes on any new HTML elements
    - Verify `var(--accent)` is used for primary color (active states, primary buttons, focus rings)
    - Verify reuse of existing component classes: `nla-card`, `nla-badge`, `nla-btn`, `nla-btn-primary`, `nla-input`, `nla-select`, `nla-table`, `nla-panel-header`
    - Verify no new external dependencies beyond those already loaded (Grid.js, Firebase SDKs)
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 16.5_

- [x] 13. Final checkpoint - Verify complete integration
  - Ensure all tests pass, ask the user if questions arise.
  - Verify existing panels (Compose, Subscribers, Analytics, Import) still function correctly
  - Verify no existing public post URLs are modified
  - Verify no existing post files are modified during read operations
  - Verify no SEO metadata on public pages is altered
  - _Requirements: 16.1, 16.2, 16.3, 16.4_

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- The `@octokit/rest` package is the only new dependency (backend only in `functions/`)
- Post data is embedded at build time via Jekyll Liquid — no API call needed for listing
- View counts display "—" since no analytics source exists (Requirement 12.5)
- The Edit button shows a placeholder panel since full edit functionality is out of scope (Requirement 6.4)
- Cloud Functions follow the same auth pattern as existing newsletter functions

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["1.3", "2.4"] },
    { "id": 2, "tasks": ["2.1"] },
    { "id": 3, "tasks": ["2.2", "2.3"] },
    { "id": 4, "tasks": ["4.1", "4.2", "4.3", "4.4", "4.5"] },
    { "id": 5, "tasks": ["6.1", "6.2"] },
    { "id": 6, "tasks": ["7.1", "7.4"] },
    { "id": 7, "tasks": ["7.2", "7.3"] },
    { "id": 8, "tasks": ["9.1", "9.3"] },
    { "id": 9, "tasks": ["9.2", "10.1", "10.2"] },
    { "id": 10, "tasks": ["10.3", "10.4"] },
    { "id": 11, "tasks": ["11.1"] },
    { "id": 12, "tasks": ["12.1", "12.2"] }
  ]
}
```
