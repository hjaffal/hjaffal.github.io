# Tasks

## Task 1: Create shared utilities module (main.js)

- [x] 1.1 Create `assets/js/admin/main.js` with exported utility functions: `show`, `hide`, `$`, `escHtml`, `formatDate`, `apiFetch`, `getToken`, `showNotification`, `slugify`
- [x] 1.2 Implement `init(config)` function that accepts Firebase config and API URLs, initializes Firebase, sets up auth listeners (sign-in, sign-out, onAuthStateChanged)
- [x] 1.3 Implement sidebar navigation switching logic that activates panels and calls panel module loaders
- [x] 1.4 Implement mobile sidebar toggle, overlay click handler, and config submenu toggle
- [x] 1.5 Export `switchPanel` function and assign it to `window.switchPanel`

## Task 2: Create dashboard module

- [x] 2.1 Create `assets/js/admin/dashboard.js` that imports utilities from `main.js`
- [x] 2.2 Implement `computePostStats(posts)` as a pure function returning stats object (total, published, draft, archived, thisWeek, thisMonth, perPosition, latestPost)
- [x] 2.3 Implement `renderPostStats()` that parses posts-data JSON and renders stat cards
- [x] 2.4 Implement `loadOverview()` that fetches analytics overview and recent editions, renders Grid.js table
- [x] 2.5 Export `initDashboard` function that wires up post-stats-link and post-stats-grid click handlers
- [x] 2.6 [PBT] Write property test: computePostStats total equals input length, and status counts do not exceed total

## Task 3: Create posts module

- [x] 3.1 Create `assets/js/admin/posts.js` that imports utilities from `main.js`
- [x] 3.2 Implement `loadPostsPanel()` that parses posts-data JSON, normalizes fields, and calls `initPostsTable`
- [x] 3.3 Implement `initPostsTable(posts)` that configures Grid.js with columns, sorting, pagination, and action buttons
- [x] 3.4 Implement `filterPosts()` with search term, status filter, and position filter logic
- [x] 3.5 Implement `showPostDetail(index)` that renders the detail panel with post metadata
- [x] 3.6 Wire up search input debounce, filter dropdown change listeners, and close-detail button
- [x] 3.7 Expose `showPostDetail`, `copyPostUrl`, `editPost`, `filterPosts` on `window`
- [x] 3.8 [PBT] Write property test: filterPosts result is always a subset of input and status filter produces only matching statuses

## Task 4: Create new-post module

- [x] 4.1 Create `assets/js/admin/new-post.js` that imports utilities from `main.js`
- [x] 4.2 Implement `initNewPostPanel()` with form setup, char counters, mode toggle, EasyMDE initialization, and AI direction cards
- [x] 4.3 Implement form validation and submission handler that calls createPost Cloud Function
- [x] 4.4 Implement AI generation flow: direction card selection, API call with 60s timeout, form population on success
- [x] 4.5 Implement `editPost(title)` placeholder and `restoreNewPostPanel()` functions
- [x] 4.6 Expose `editPost` and `restoreNewPostPanel` on `window`

## Task 5: Create compose module

- [x] 5.1 Create `assets/js/admin/compose.js` that imports utilities from `main.js`
- [x] 5.2 Implement `loadPosts()` that fetches posts from API and renders the selection list with checkboxes and featured radio
- [x] 5.3 Implement compose form submission handler with validation, segment selection, and multi-segment sending
- [x] 5.4 Implement rich text toolbar (execCommand handlers) and tool dropdown auto-fill
- [x] 5.5 Export `initCompose` function that wires up toolbar buttons, tool-select change, and form submit

## Task 6: Create subscribers module

- [x] 6.1 Create `assets/js/admin/subscribers.js` that imports utilities from `main.js`
- [x] 6.2 Implement `loadSubscribers()` that fetches subscribers, applies segment filter, and renders Grid.js table
- [x] 6.3 Implement add subscriber handler, edit form population/save/cancel, and deactivate/delete via event delegation
- [x] 6.4 Implement CSV export function that generates and downloads a CSV file
- [x] 6.5 Wire up segment filter change, export button, add button, edit save/cancel buttons
- [x] 6.6 [PBT] Write property test: CSV export produces exactly subscribers.length + 1 lines with header row

## Task 7: Create analytics module

- [x] 7.1 Create `assets/js/admin/analytics.js` that imports utilities from `main.js`
- [x] 7.2 Implement `loadAnalytics()` that fetches editions and renders Grid.js table
- [x] 7.3 Implement `viewEdition(id)` that fetches edition detail and renders stats + clicked links
- [x] 7.4 Implement `viewEditionFromOverview(id)` that switches to analytics panel and shows detail
- [x] 7.5 Expose `viewEdition`, `viewEditionFromOverview`, `backToAnalyticsList` on `window`

## Task 8: Create import module

- [x] 8.1 Create `assets/js/admin/import.js` that imports utilities from `main.js`
- [x] 8.2 Implement import button handler with JSON parsing, array validation, confirmation, and API submission
- [x] 8.3 Implement result display (imported/skipped/rejected counts) and error handling

## Task 9: Refactor HTML file

- [x] 9.1 Remove all inline JavaScript from `newsletter/admin/index.html` (the entire `<script type="module">` block)
- [x] 9.2 Add a minimal inline `<script type="module">` bootstrap that reads Jekyll Liquid config and calls `init()` from `main.js`
- [x] 9.3 Verify that Posts_Data_Script, Firebase config Liquid variables, API URL Liquid variables, Grid.js script tag, and EasyMDE script tag remain in the HTML
- [x] 9.4 Verify all HTML markup (panels, forms, buttons) is unchanged

## Task 10: Write property tests for shared utilities

- [x] 10.1 [PBT] Write property test: slugify is idempotent — slugify(slugify(x)) === slugify(x)
- [x] 10.2 [PBT] Write property test: escHtml output contains no unescaped <, >, &, or " characters

## Task 11: Integration verification

- [x] 11.1 Verify all module files exist under `assets/js/admin/` with correct exports
- [x] 11.2 Verify no circular dependencies exist between modules (main.js → panel modules, panel modules → main.js only)
- [x] 11.3 Verify HTML file contains no inline JS logic beyond the bootstrap
- [x] 11.4 Verify no new external dependencies were introduced
