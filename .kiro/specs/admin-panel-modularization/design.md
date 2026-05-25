# Design Document

## Overview

This design describes how to refactor the newsletter admin panel from a monolithic inline script into native ES modules. The architecture uses a hub-and-spoke pattern: a single `main.js` entry point handles shared concerns (auth, navigation, utilities) and lazily delegates to panel-specific modules when each panel is activated.

## Architecture

### Module Dependency Graph

```
index.html
  └── <script type="module"> (inline bootstrap)
        └── assets/js/admin/main.js
              ├── dashboard.js
              ├── posts.js
              ├── new-post.js
              ├── compose.js
              ├── subscribers.js
              ├── analytics.js
              └── import.js
```

### Data Flow

1. **Build time**: Jekyll injects Liquid variables into the HTML (Firebase config, API URLs, posts JSON).
2. **Load time**: The inline bootstrap script reads config from the HTML and passes it to `main.js`.
3. **Auth time**: `main.js` initializes Firebase, handles auth state, and shows/hides the dashboard.
4. **Navigation time**: When a panel is activated, `main.js` calls the corresponding module's loader function.
5. **Runtime**: Each panel module uses shared utilities from `main.js` to make API calls and manipulate DOM.

### Configuration Passing Strategy

The HTML file will contain a minimal inline `<script type="module">` that:
1. Reads Firebase config and API URLs (injected by Jekyll Liquid).
2. Imports `main.js` and calls an `init()` function, passing the config object.

```html
<script type="module">
import { init } from '/assets/js/admin/main.js';
init({
  firebaseConfig: { apiKey: "...", authDomain: "...", projectId: "..." },
  api: { send: "...", analytics: "...", subscribers: "...", import: "...", createPost: "...", generatePost: "..." }
});
</script>
```

This keeps Jekyll Liquid in the HTML while modules remain pure JavaScript.

### Shared Utilities Pattern

`main.js` exports utility functions that panel modules import:

```javascript
// main.js exports
export { show, hide, $, escHtml, formatDate, apiFetch, getToken, showNotification, slugify, switchPanel };
```

Panel modules import what they need:

```javascript
// dashboard.js
import { show, hide, $, apiFetch, formatDate, escHtml } from './main.js';
```

### Window Exposure for Inline Handlers

Some HTML markup uses `onclick` handlers (Grid.js formatters, inline buttons). These functions must be exposed on `window`. Each panel module assigns its public functions to `window` during initialization:

```javascript
// posts.js
window.showPostDetail = showPostDetail;
window.copyPostUrl = copyPostUrl;
window.editPost = editPost;
window.filterPosts = filterPosts;
```

## File Specifications

### `assets/js/admin/main.js`

**Responsibilities:**
- Firebase initialization and auth (sign-in, sign-out, onAuthStateChanged)
- Shared utility functions
- Sidebar navigation switching (panel activation, mobile toggle, config submenu)
- `switchPanel()` function exposed on `window` for use by inline handlers
- Imports and calls panel module loaders on navigation

**Exports:** `init`, `show`, `hide`, `$`, `escHtml`, `formatDate`, `apiFetch`, `getToken`, `showNotification`, `slugify`, `switchPanel`

### `assets/js/admin/dashboard.js`

**Responsibilities:**
- `loadOverview()` — fetches analytics overview + recent editions, renders Grid.js table
- `renderPostStats()` — parses posts-data JSON, computes stats, renders stat cards
- `computePostStats(posts)` — pure function returning stats object

**Exports:** `loadOverview`, `renderPostStats`, `computePostStats`, `initDashboard`

### `assets/js/admin/posts.js`

**Responsibilities:**
- `loadPostsPanel()` — parses posts-data JSON, normalizes fields, initializes table
- `initPostsTable(posts)` — configures Grid.js with columns, sorting, pagination, actions
- `filterPosts()` — applies search + status + position filters, re-renders table
- `showPostDetail(index)` — renders detail panel for a post
- Search input debounce, filter dropdown listeners

**Exports:** `loadPostsPanel`, `initPostsTable`, `filterPosts`, `showPostDetail`, `initPosts`

### `assets/js/admin/new-post.js`

**Responsibilities:**
- `initNewPostPanel()` — sets up form, char counters, mode toggle, EasyMDE, AI directions
- Form validation and submission to createPost Cloud Function
- AI generation flow (direction selection, API call with 60s timeout, form population)
- `editPost(title)` — placeholder edit flow
- `restoreNewPostPanel()` — restores default panel HTML after edit

**Exports:** `initNewPostPanel`, `editPost`, `restoreNewPostPanel`, `initNewPost`

### `assets/js/admin/compose.js`

**Responsibilities:**
- `loadPosts()` — fetches posts from API, renders selection list
- Form submission with multi-segment sending
- Rich text toolbar (execCommand handlers)
- Tool dropdown auto-fill

**Exports:** `loadPosts`, `initCompose`

### `assets/js/admin/subscribers.js`

**Responsibilities:**
- `loadSubscribers()` — fetches subscribers, applies segment filter, renders Grid.js table
- Add subscriber form handler
- Edit subscriber form (populate, save, cancel)
- Deactivate/delete via event delegation
- CSV export

**Exports:** `loadSubscribers`, `initSubscribers`

### `assets/js/admin/analytics.js`

**Responsibilities:**
- `loadAnalytics()` — fetches editions, renders Grid.js table
- `viewEdition(id)` — fetches and renders edition detail
- `viewEditionFromOverview(id)` — switches panel and shows detail
- `backToAnalyticsList()` — returns to list view

**Exports:** `loadAnalytics`, `viewEdition`, `viewEditionFromOverview`, `initAnalytics`

### `assets/js/admin/import.js`

**Responsibilities:**
- Import button click handler
- JSON parsing and validation
- Confirmation dialog
- API submission and result display

**Exports:** `initImport`

## Correctness Properties

### Property 1: computePostStats invariants (Requirement 2, Criterion 3)

**Type:** Invariant

**Property:** For any array of post objects, `computePostStats(posts)` SHALL return a stats object where `stats.total === posts.length` and `stats.published + stats.draft + stats.archived <= stats.total`.

**Rationale:** The total count must always equal the input array length. Status counts are subsets and cannot exceed the total (posts with unrecognized status are not counted in any status bucket).

### Property 2: filterPosts subset property (Requirement 3, Criterion 3)

**Type:** Metamorphic

**Property:** For any posts array and any combination of filter criteria (search term, status, position), the filtered result SHALL always be a subset of the input array (every item in the result exists in the original array) and the result length SHALL be less than or equal to the input length.

**Rationale:** Filtering can only remove items, never add or duplicate them.

### Property 3: filterPosts status consistency (Requirement 3, Criterion 3)

**Type:** Invariant

**Property:** When a status filter is applied (not "all"), every post in the filtered result SHALL have a `status` field equal to the filter value.

**Rationale:** The status filter is an exact match — no post with a different status should pass through.

### Property 4: slugify idempotence (Requirement 1, shared utilities)

**Type:** Idempotence

**Property:** For any string input, `slugify(slugify(input)) === slugify(input)`.

**Rationale:** A slug that is already slugified should not change when slugified again. This ensures stability when users manually edit slugs.

### Property 5: escHtml round-trip safety (Requirement 1, shared utilities)

**Type:** Invariant

**Property:** For any string input, `escHtml(input)` SHALL NOT contain unescaped `<`, `>`, `&`, or `"` characters (i.e., the output matches the regex `/^[^<>&"]*$/` after accounting for entity references `&amp;`, `&lt;`, `&gt;`, `&quot;`).

**Rationale:** The HTML escaping function must guarantee that no raw HTML-special characters remain, preventing XSS.

### Property 6: CSV export row count (Requirement 6, Criterion 5)

**Type:** Invariant

**Property:** For any array of subscriber objects, the generated CSV string SHALL contain exactly `subscribers.length + 1` lines (one header row plus one data row per subscriber).

**Rationale:** Every subscriber must appear in the export, and the header row is always present.

## Implementation Notes

- **Grid.js and EasyMDE** are loaded as UMD scripts (non-module) via `<script>` tags before the module script. They attach to `window.gridjs` and `window.EasyMDE` respectively, which modules access as globals.
- **Event delegation** for subscriber table actions (edit/deactivate/delete) should remain in the subscribers module using `document.addEventListener('click', ...)` since Grid.js re-renders the table dynamically.
- **Panel state** (e.g., `postsLoaded`, `newPostPanelInitialized`) is managed within each panel module as module-level variables.
- **No circular dependencies**: `main.js` imports from panel modules; panel modules import only from `main.js`. No panel module imports from another panel module.
