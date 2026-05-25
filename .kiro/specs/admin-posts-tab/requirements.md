# Requirements Document

## Introduction

Add a "Posts" section to the existing admin dashboard at `newsletter/admin/index.html` and restructure the sidebar navigation into three clear sections: Dashboard, Posts, and Newsletter. The Posts section provides a centralized view of all Jekyll blog posts with their metadata, enables the admin to browse, search, filter, and sort posts, create new posts (from scratch or via AI generation using the same prompt structure as `scripts/generate_post.py`), and quickly navigate to the public URL or an edit screen for any post. The feature reuses the existing `_posts/` markdown files as the data source and follows the established admin UI patterns (sidebar navigation, Grid.js tables, `nla-*` class naming, `#9333EA` primary color). Tags are limited to the four canonical position tags (`ai-operations`, `decision-authority`, `risk-intelligence`, `ai-and-work`) — no free-form tags exist in this system.

## Glossary

- **Admin_Dashboard**: The authenticated admin interface at `newsletter/admin/index.html` that contains Dashboard, Posts, and Newsletter sections in the sidebar navigation.
- **Dashboard_Panel**: The enhanced overview panel that displays both newsletter metrics (subscriber stats, recent editions) and post-related summary data (total posts, published/draft counts, latest post).
- **Posts_Panel**: The panel that displays all Jekyll posts in a searchable, filterable table.
- **Posts_Table**: The table component inside the Posts_Panel that renders post data in rows with sortable columns.
- **Post_Entry**: A single row in the Posts_Table representing one Jekyll markdown file from `_posts/`.
- **Post_Status_Badge**: A styled badge component that visually indicates a post's status (published, draft, or archived).
- **Post_Actions**: The set of action buttons (View, Edit) available for each Post_Entry.
- **Post_Filters**: The UI controls that allow filtering the Posts_Table by status and position.
- **Post_Search**: The search input that filters the Posts_Table by title, slug, or position tags.
- **Empty_Posts_State**: The placeholder UI shown when no posts exist or no posts match the current filters.
- **Loading_State**: The spinner and message shown while post data is being loaded.
- **Error_State**: The error message UI shown when post data fails to load.
- **Front_Matter**: The YAML metadata block at the top of each Jekyll markdown file that contains post properties (title, tags, date, etc.).
- **Category_Position**: The topic cluster a post belongs to, represented by one of the four canonical position tags: `ai-operations`, `decision-authority`, `risk-intelligence`, `ai-and-work`. These are the only valid tags in the system.
- **Post_Creation_Form**: The form UI that allows the admin to create a new Jekyll post by filling in metadata fields and body content.
- **Advanced_Editor**: A rich text editor component for the post body that supports full formatting (headings, bold, italic, lists, links, blockquotes, code blocks, horizontal rules) and outputs markdown-compatible content.
- **AI_Post_Generator**: The Firebase Cloud Function that uses the Gemini API to generate post content based on a selected content direction/position.

## Requirements

### Requirement 1: Admin Navigation Restructure

**User Story:** As an admin, I want the sidebar navigation organized into three clear sections (Dashboard, Posts, Newsletter), so that I can find features quickly based on their purpose.

#### Acceptance Criteria

1. THE Admin_Dashboard SHALL organize the sidebar navigation into three labeled sections displayed in the following top-to-bottom order: "Dashboard", "Posts", "Newsletter".
2. THE "Dashboard" section SHALL contain a single navigation item labeled "Dashboard" that displays a panel combining the existing newsletter metrics (active subscribers, unsubscribed, bounced counts) and post statistics (total posts, posts per position, view metrics, publishing frequency).
3. THE "Posts" section SHALL contain exactly two navigation items in this order: "Posts" (displays the posts list) and "New Post" (displays the post creation form).
4. THE "Newsletter" section SHALL contain the existing newsletter-related navigation items in this order: "Compose", "Subscribers", "Analytics", and "Import".
5. THE Admin_Dashboard SHALL visually separate the three sections using visible section labels that display the section name above each group of navigation items, using the existing nla-* CSS class naming convention.
6. WHEN the admin navigates to the admin page after authentication, THE Admin_Dashboard SHALL display the "Dashboard" panel as the default active view with its navigation item in the active state.
7. WHEN the admin clicks any navigation item, THE Admin_Dashboard SHALL display the corresponding panel, hide all other panels, and update the active state to the clicked item only.
8. WHEN a navigation item is active, THE Admin_Dashboard SHALL apply the existing active class (nla-nav-item active) styling to that item and remove it from all other navigation items.
9. THE Admin_Dashboard SHALL display an icon element alongside each navigation label, where each navigation item has a unique icon distinguishing it from other items.
10. THE Admin_Dashboard SHALL preserve the existing sidebar footer (user email and sign-out button) and the external links section (Public Website link and Config submenu) below the navigation sections.
11. THE navigation restructure SHALL NOT break existing panel functionality — the Compose, Subscribers, Analytics, and Import panels SHALL continue to load their data and operate identically to their current behavior.

### Requirement 2: Enhanced Dashboard Panel

**User Story:** As an admin, I want the Dashboard to show both newsletter metrics and post-related statistics, so that I get a complete overview of content performance in one place.

#### Acceptance Criteria

1. THE Dashboard_Panel SHALL replace the existing Overview panel and retain all current overview functionality (subscriber stats, recent editions).
2. THE Dashboard_Panel SHALL display a posts statistics section containing the following metrics:
   - Total post count
   - Number of published posts
   - Number of draft posts
   - Posts per position: a breakdown showing the count of posts tagged with each of the four canonical positions (`ai-operations`, `decision-authority`, `risk-intelligence`, `ai-and-work`)
   - Total views across all posts (if view count data is available from an existing analytics source)
   - Most viewed post title and its view count (if view count data is available)
   - Most recently published post title and date
   - Posts published this month (count)
   - Posts published this week (count)
3. THE Dashboard_Panel SHALL display the newsletter subscriber stats (active, unsubscribed, bounced) as it does currently.
4. THE Dashboard_Panel SHALL display the 5 most recent newsletter editions as it does currently.
5. WHEN the admin clicks on the posts statistics section, THE Admin_Dashboard SHALL navigate to the Posts_Panel.
6. IF no published posts exist, THEN THE Dashboard_Panel SHALL display "0" for all count metrics and "—" for the most recently published post title and date fields.
7. IF view count data is not available from any existing analytics source, THEN THE Dashboard_Panel SHALL display "Not tracked" for total views and most viewed post, and SHALL NOT fabricate view numbers.
8. IF post data fails to load, THEN THE Dashboard_Panel SHALL display the newsletter metrics normally and show an error message in the posts statistics section indicating that post data is unavailable.
9. THE Dashboard_Panel SHALL display the posts-per-position breakdown using the position display names: "AI Operations", "Decision Authority", "Risk Intelligence", "AI and Work" alongside their respective counts.

### Requirement 3: Posts Data Loading

**User Story:** As an admin, I want the posts panel to load all post data from the Jekyll content source, so that I can see all posts without manual data entry.

#### Acceptance Criteria

1. WHEN the Posts_Panel becomes active, THE Posts_Panel SHALL parse post data from a JSON array embedded in the page at build time via Jekyll Liquid templating (iterating over `site.posts`).
2. WHILE post data is being parsed and rendered into the Posts_Table, THE Posts_Panel SHALL display the Loading_State with a spinner and "Loading posts…" message.
3. WHEN post data is parsed successfully and contains at least one post, THE Posts_Panel SHALL hide the Loading_State and display the Posts_Table within 2 seconds of the panel becoming active.
4. IF the embedded post data is malformed or cannot be parsed, THEN THE Posts_Panel SHALL hide the Loading_State and display the Error_State with a message indicating that post data could not be loaded.
5. THE Posts_Panel SHALL extract the following metadata from each post's Front_Matter where available: title, slug (derived from filename), public URL (derived from Jekyll permalink), status (derived per Requirement 4 criterion 5), published date (from filename date), last updated date (from `last-updated` front matter field), author, tags/position (limited to the four canonical position tags: `ai-operations`, `decision-authority`, `risk-intelligence`, `ai-and-work`), meta title (`share-title`), meta description (`share-description`), canonical URL, reading time (`reading-time`), featured image (`thumbnail-img` or `share-img`), and excerpt.
6. WHEN a metadata field is not present in a post's Front_Matter, THE Posts_Table SHALL display "—" (em dash) for that field.
7. IF the embedded post data array is empty, THEN THE Posts_Panel SHALL hide the Loading_State and display the Empty_Posts_State.

### Requirement 4: Posts Table Display

**User Story:** As an admin, I want to see all posts in a clean table with their metadata, so that I can quickly scan and find the post I need.

#### Acceptance Criteria

1. THE Posts_Table SHALL display posts in a tabular format using Grid.js with the existing admin table class names (`nla-gridjs`, `nla-gridjs-table`, `nla-gridjs-th`, `nla-gridjs-td`).
2. THE Posts_Table SHALL display the following columns: Title, Slug, Status, Published Date, Updated Date, Author, Position (tags), and Actions.
3. THE Posts_Table SHALL display the post status using Post_Status_Badge components where each status value (published, draft, archived) has a unique background and text color combination following the existing `nla-badge` pattern.
4. THE Posts_Table SHALL display position tags as badge components (one or two badges per row, limited to the four canonical position tags).
5. THE Posts_Table SHALL derive post status from Front_Matter using the following priority order: posts with `archived: true` are "archived", posts with a future date (compared to the current date at render time) or `published: false` are "draft", and all remaining posts are "published".
6. THE Posts_Table SHALL derive the public URL from the Jekyll permalink configuration (`/:year-:month-:day-:title/`).
7. THE Posts_Table SHALL provide a copy-to-clipboard button for the public URL on each Post_Entry that copies the full URL to the clipboard.
8. THE Posts_Table SHALL enable pagination with a limit of 20 posts per page.
9. THE Posts_Table SHALL truncate Title values exceeding 60 characters and Slug values exceeding 40 characters with an ellipsis, displaying the full value on hover via a tooltip.

### Requirement 5: Post Detail Metadata

**User Story:** As an admin, I want to view extended metadata for each post, so that I can review SEO fields and content details without opening the file.

#### Acceptance Criteria

1. WHEN the admin expands a Post_Entry row, THE Posts_Table SHALL display an inline detail section showing the following extended metadata fields: meta title (share-title), meta description (share-description), canonical URL, reading time, featured image (thumbnail-img or share-img), excerpt, and public URL.
2. WHEN extended metadata is displayed, THE Posts_Panel SHALL render all fields in a read-only format using non-editable text elements.
3. THE Posts_Panel SHALL NOT allow editing metadata directly from the table view.
4. WHEN an extended metadata field is not present in a post's Front_Matter, THE Posts_Panel SHALL display "—" for that field.
5. THE Posts_Panel SHALL calculate reading time based on the post body word count using an average of 200 words per minute, rounded up to the nearest whole minute, and display it as "{N} min read".

### Requirement 6: Post Actions

**User Story:** As an admin, I want View and Edit buttons for each post, so that I can quickly open the public page or edit the post.

#### Acceptance Criteria

1. THE Post_Actions SHALL include a "View" button and an "Edit" button for each Post_Entry, visually distinguishable from each other.
2. WHEN the admin clicks the "View" button, THE Post_Actions SHALL open the post's public URL in a new browser tab using the URL derived from the Jekyll permalink configuration.
3. WHEN the admin clicks the "Edit" button, THE Post_Actions SHALL switch the active panel to the Post_Creation_Form pre-filled with that post's existing Front_Matter and body content.
4. IF no edit screen exists for posts, THEN THE Post_Actions SHALL switch to a placeholder panel that displays a message indicating the edit feature is planned and provides a button to return to the Posts_Table.
5. THE Post_Actions buttons SHALL be keyboard-operable and include accessible labels indicating the action and the associated post title.

### Requirement 7: Create New Post

**User Story:** As an admin, I want to create a new post from the admin panel, so that I can add content without manually creating markdown files.

#### Acceptance Criteria

1. THE Posts_Panel SHALL display a "New Post" primary action button in the panel header area.
2. WHEN the admin clicks the "New Post" button, THE Posts_Panel SHALL present two creation modes: "Start from Scratch" and "Generate with AI".
3. WHEN the admin selects "Start from Scratch", THE Post_Creation_Form SHALL display an empty form with all editable fields.
4. THE Post_Creation_Form SHALL include fields for: title (max 150 characters), slug (auto-generated from title, editable, max 80 characters), author, position/tag (dropdown limited to the four canonical position tags: `ai-operations`, `decision-authority`, `risk-intelligence`, `ai-and-work` — no free-form tags allowed), status (draft or published), excerpt (max 300 characters), meta title (max 70 characters), meta description (max 160 characters), featured image path, and post body content.
5. THE Post_Creation_Form SHALL use an Advanced_Editor for the post body content that supports full text formatting including headings, bold, italic, lists (ordered and unordered), links, blockquotes, code blocks, and horizontal rules.
6. WHEN the admin submits the Post_Creation_Form with valid data, THE Posts_Panel SHALL generate a Jekyll-compatible markdown file with proper Front_Matter (layout, title, subtitle, share-title, share-description, tags limited to the selected position tag(s), author, thumbnail-img, share-img) and save it to the `_posts/` directory using the naming convention `YYYY-MM-DD-slug.md` via a Firebase Cloud Function.
7. IF required fields (title, body content) are missing or title exceeds 150 characters, THEN THE Post_Creation_Form SHALL display inline validation errors adjacent to each invalid field indicating the specific validation failure.
8. WHEN a new post is created successfully, THE Posts_Panel SHALL display a success notification for 5 seconds and add the new post to the Posts_Table.
9. THE Post_Creation_Form SHALL pre-fill the published date with the current date.
10. THE Post_Creation_Form SHALL auto-generate the slug from the title by converting to lowercase, replacing spaces with hyphens, removing all characters except letters, numbers, and hyphens, and collapsing consecutive hyphens into a single hyphen.
11. WHEN the admin cancels post creation, THE Posts_Panel SHALL return to the Posts_Table view without creating a file.
12. IF the backend save operation fails, THEN THE Post_Creation_Form SHALL display an error message indicating the save failure and SHALL preserve all entered form data so the admin can retry without re-entering content.
13. IF the generated slug matches an existing file name in `_posts/` for the same date, THEN THE Post_Creation_Form SHALL display a validation error indicating the slug must be unique for that date.

### Requirement 8: AI Post Generation

**User Story:** As an admin, I want to generate a post using AI by selecting a content direction, so that I can quickly produce draft content aligned with my positioning.

#### Acceptance Criteria

1. WHEN the admin selects "Generate with AI", THE Posts_Panel SHALL display a direction selection interface with the four canonical positions using the exact tags and titles from `_data/positions.yml`: `ai-operations` ("AI exposes weak operations"), `decision-authority` ("Signals need authority"), `risk-intelligence` ("Reporting is not intelligence"), and `ai-and-work` ("AI is changing the skill floor").
2. WHILE the direction selection interface is displayed, THE Posts_Panel SHALL show the position thesis from `_data/positions.yml` beneath each direction option to help the admin choose.
3. WHEN the admin selects a direction and clicks a confirm button, THE Posts_Panel SHALL call the AI_Post_Generator Firebase Cloud Function with the selected position tag as input.
4. WHILE AI generation is in progress, THE Posts_Panel SHALL display a loading indicator with the message "Generating post…" and disable the confirm button to prevent duplicate requests.
5. IF AI generation does not complete within 60 seconds, THEN THE Posts_Panel SHALL cancel the request, hide the loading indicator, and display a timeout error message allowing the admin to retry or switch to "Start from Scratch" mode.
6. WHEN AI generation completes successfully, THE Posts_Panel SHALL populate the Post_Creation_Form with the generated content (title, subtitle, share-description, tags set to the selected position tag only, and body) in an editable state.
7. IF AI generation fails due to a network error or Cloud Function error, THEN THE Posts_Panel SHALL display an error message indicating the failure reason and present both a "Retry" button and a "Start from Scratch" button.
8. THE AI_Post_Generator Cloud Function SHALL use the same Gemini configuration pattern as existing Cloud Functions in the project (gemini-2.5-flash model, GEMINI_API_KEY secret, europe-west1 region).
9. THE AI_Post_Generator prompt SHALL replicate the exact same prompt structure, content rules, writing rules, diversity instructions, and constraints used in `scripts/generate_post.py`, including: the POSITIONS array (with tag, position, thesis, and angles), the ARTICLE_FORMS list, the TONES list, random selection of angle/form/tone, avoidance of recent post titles, the full CONTENT RULES (explore the angle specifically, include one concrete workplace example, include one uncomfortable trade-off, explain what strong teams do differently, end with a forced-position question), the full WRITING RULES (700-1000 words, short paragraphs 2-4 sentences max, no hype, no corporate buzzwords, no invented statistics, no labels like "Hook"/"Insight"/"Takeaway", simple English, SEO-friendly title that states the argument), and the DIVERSITY INSTRUCTIONS (vary opening based on tone, vary sentence length, do not repeat opening patterns).
10. THE AI_Post_Generator Cloud Function SHALL return a JSON response containing title, subtitle, share-description, tags (array containing only the selected position tag), and body fields.
11. THE AI_Post_Generator SHALL force the tags output to contain only the selected position tag, regardless of what the AI model returns, matching the behavior in `generate_post.py` where `tags = [selected_position["tag"]]` is enforced after generation.

### Requirement 9: Search

**User Story:** As an admin, I want to search posts by title, slug, and position tag, so that I can quickly find specific posts.

#### Acceptance Criteria

1. THE Post_Search SHALL provide a text input field with placeholder text that lists the searchable fields (title, slug, and position).
2. WHEN the admin types in the Post_Search input, THE Posts_Table SHALL filter visible posts to those where the title, slug, or any position tag contains the search term as a case-insensitive substring match.
3. WHEN the search term is cleared, THE Posts_Table SHALL display all posts that match the currently active Post_Filters and sort order.
4. THE Post_Search SHALL perform filtering client-side without a page reload.
5. WHEN the admin types in the Post_Search input, THE Post_Search SHALL apply the filter after a debounce delay of no more than 300 milliseconds following the last keystroke.
6. WHEN the Post_Search input has a value and active Post_Filters are set, THE Posts_Table SHALL display only posts that satisfy both the search match AND all active filter criteria.

### Requirement 10: Filters

**User Story:** As an admin, I want to filter posts by status and position, so that I can narrow down the list to relevant posts.

#### Acceptance Criteria

1. THE Post_Filters SHALL provide a status filter dropdown with options: All, Published, Draft, Archived, with "All" selected by default.
2. THE Post_Filters SHALL provide a position filter dropdown with the fixed options: All, AI Operations (`ai-operations`), Decision Authority (`decision-authority`), Risk Intelligence (`risk-intelligence`), AI and Work (`ai-and-work`), with "All" selected by default.
3. WHEN the admin selects a filter value, THE Posts_Table SHALL immediately display only posts matching all active filter criteria without a page reload.
4. WHEN the position filter is active, THE Posts_Table SHALL display posts where the post's tags array contains the selected position tag value.
5. WHEN the position filter is active and a post has no tags in its Front_Matter, THE Posts_Table SHALL exclude that post from the filtered results.
6. WHEN multiple filters are active, THE Posts_Table SHALL apply all filters using AND logic combined with any active Post_Search term.
7. WHEN the admin selects "All" on any filter, THE Post_Filters SHALL treat that filter as inactive and not constrain the results for that dimension.
8. WHEN no posts match the active filters, THE Posts_Panel SHALL display the Empty_Posts_State.

### Requirement 11: Sorting

**User Story:** As an admin, I want to sort posts by published date, updated date, views, and title, so that I can organize the list by the criteria most useful to me.

#### Acceptance Criteria

1. THE Posts_Table SHALL support sorting by published date, updated date, title, and views, and SHALL display a visual indicator (arrow or icon) on the active sort column showing the current sort direction.
2. WHEN the admin clicks a sortable column header that is not the current sort column, THE Posts_Table SHALL sort posts by that column in ascending order.
3. WHEN the admin clicks the currently active sort column header, THE Posts_Table SHALL toggle the sort direction between ascending and descending order.
4. THE Posts_Table SHALL default to sorting by published date in descending order (newest first) on initial load.
5. WHEN sorting a column that contains missing values (displayed as "—"), THE Posts_Table SHALL place rows with missing values at the end of the sorted list regardless of sort direction.

### Requirement 12: View Count Display

**User Story:** As an admin, I want to see view counts for posts if the data exists, so that I can understand post performance without fake numbers.

#### Acceptance Criteria

1. WHEN view count data is available for a post from an existing analytics source, THE Posts_Table SHALL display the view count as a whole number formatted with locale-appropriate thousands separators (e.g., "1,234").
2. WHEN view count data is not available for a post (the analytics source returns null, undefined, or no entry for that post), THE Posts_Table SHALL display "—" as the value.
3. IF the view count value returned from the analytics source is zero, THEN THE Posts_Table SHALL display "0" (zero is a valid data point, not treated as missing data).
4. THE Posts_Table SHALL NOT display fabricated, estimated, or randomly generated view count numbers.
5. THE Posts_Panel SHALL NOT create a new analytics tracking system for view counts; it SHALL only consume data from an analytics source already configured for the site.

### Requirement 13: Empty State

**User Story:** As an admin, I want to see a helpful empty state when no posts exist, so that I understand the system is working but has no content.

#### Acceptance Criteria

1. WHEN no posts exist in the content source, THE Posts_Panel SHALL display the Empty_Posts_State containing an icon element (using the `nla-empty-icon` class), a message communicating that no posts have been created yet, and a call-to-action button or link that navigates the admin to the New Post creation flow.
2. WHEN filters or search produce zero results, THE Posts_Panel SHALL display the Empty_Posts_State containing an icon element (using the `nla-empty-icon` class) and a message communicating that no posts match the current filter or search criteria, distinct from the no-posts-exist message in criterion 1.
3. THE Empty_Posts_State SHALL use the existing `nla-empty` CSS class for its container and `nla-empty-icon` for its icon element, matching the structure and styling used by empty states in the newsletter admin panels.
4. WHEN the Empty_Posts_State is displayed, THE Posts_Panel SHALL hide the Posts_Table.

### Requirement 14: Responsive Layout

**User Story:** As an admin, I want the posts panel to work on mobile and tablet screens, so that I can manage posts from any device.

#### Acceptance Criteria

1. WHILE the viewport width is at or below 900px, THE Posts_Panel SHALL collapse the sidebar, switch to single-column layout, and ensure all interactive elements (buttons, links, inputs) have a minimum touch target size of 44×44px, consistent with the existing admin responsive behavior.
2. WHILE the viewport width is at or below 900px, THE Posts_Table SHALL enable horizontal scrolling on its container so that all columns remain accessible without content being clipped or hidden.
3. WHILE the viewport width is at or below 900px, THE Post_Filters and Post_Search SHALL stack vertically, each occupying the full available width.
4. WHILE the viewport width is at or below 480px, THE Post_Filters SHALL stack each individual filter control vertically, each occupying the full available width.

### Requirement 15: Styling Compliance

**User Story:** As an admin, I want the posts panel to match the existing admin design system, so that the interface feels cohesive.

#### Acceptance Criteria

1. THE Posts_Panel SHALL prefix all CSS class names with `nla-` (e.g., `nla-posts-list`, `nla-posts-filter`).
2. THE Posts_Panel SHALL NOT use inline `style` attributes on any HTML element.
3. THE Posts_Panel SHALL apply the primary color exclusively through the `var(--accent)` CSS variable (resolved value `#9333EA`) for active navigation states, primary action buttons, focus rings, and hover highlights.
4. THE Posts_Panel SHALL load its styles either from the existing `newsletter-admin.css` file or from a dedicated CSS file named with the `nla-` or panel-specific prefix and placed in `assets/css/`.
5. THE Posts_Panel SHALL reuse the following existing admin component classes: `nla-card` for content containers, `nla-badge` for status indicators, `nla-btn` and `nla-btn-primary` for action buttons, `nla-input` and `nla-select` for form controls, `nla-table` for tabular data, and `nla-panel-header` for section headings.
6. THE Posts_Panel SHALL NOT introduce new CSS class names for components that already have equivalent `nla-*` classes defined in `newsletter-admin.css`.

### Requirement 16: Non-Destructive Integration

**User Story:** As an admin, I want the new Posts tab to integrate without breaking existing admin functionality, so that newsletter management continues to work.

#### Acceptance Criteria

1. THE Admin_Dashboard SHALL continue to render and operate all existing panels (Compose, Subscribers, Analytics, Import) after the Posts_Panel addition, such that each panel loads its data, accepts user input, and completes its primary action (sending newsletters, managing subscribers, viewing analytics, importing data) without errors.
2. THE Posts_Panel SHALL NOT modify existing public post URLs, which follow the permalink pattern `/:year-:month-:day-:title/`.
3. THE Posts_Panel SHALL NOT modify post Front_Matter or file contents of existing posts during read operations (browsing, searching, filtering, sorting, or viewing metadata).
4. THE Posts_Panel SHALL NOT alter SEO metadata (title tags, meta descriptions, canonical URLs, structured data, or Open Graph tags) on public pages.
5. THE Posts_Panel SHALL NOT introduce external dependencies beyond those already loaded by the admin (Grid.js, Firebase App SDK, Firebase Auth SDK); any additional dependency requires explicit admin approval before integration.
6. THE Posts_Panel JavaScript SHALL NOT reuse or remove existing DOM element IDs or global variable names used by the Compose, Subscribers, Analytics, or Import panels.
