# Requirements Document

## Introduction

Refactor the newsletter admin panel (`newsletter/admin/index.html`) from a monolithic single-file architecture (~2200 lines of inline JavaScript) into a modular ES module structure. The goal is to improve maintainability, readability, and developer experience by splitting JavaScript into feature-based modules under `assets/js/admin/`, while preserving all existing functionality and respecting the Jekyll static site constraints (no build tools, no bundlers).

## Glossary

- **Admin_Panel**: The newsletter admin dashboard at `newsletter/admin/index.html`, used by authorized administrators to manage posts, subscribers, newsletters, and analytics.
- **Module_System**: The native ES module system using `import`/`export` statements loaded via `<script type="module">` tags in the browser.
- **Main_Module**: The entry-point module (`assets/js/admin/main.js`) responsible for Firebase initialization, authentication, navigation switching, and shared utilities.
- **Panel_Module**: A feature-specific ES module responsible for all logic related to a single admin panel (e.g., dashboard, posts, compose, subscribers, analytics, import).
- **Posts_Data_Script**: The embedded `<script id="posts-data" type="application/json">` element containing Jekyll-generated post metadata as JSON, which must remain in the HTML file.
- **Firebase_Config**: The Firebase configuration object and API endpoint URLs derived from Jekyll Liquid variables (`{{ site.data.firebase.* }}`), which must remain in the HTML file or be passed to modules at initialization.
- **Shared_Utilities**: Common helper functions (`show`, `hide`, `$`, `escHtml`, `formatDate`, `apiFetch`, `getToken`, `showNotification`, `slugify`) used across multiple modules.

## Requirements

### Requirement 1: Module Entry Point

**User Story:** As a developer, I want a single entry-point module that initializes the application, so that I can understand the boot sequence and shared dependencies at a glance.

#### Acceptance Criteria

1. THE Main_Module SHALL export shared utility functions (`show`, `hide`, `$`, `escHtml`, `formatDate`, `apiFetch`, `getToken`, `showNotification`, `slugify`) for use by Panel_Modules.
2. THE Main_Module SHALL initialize Firebase using the Firebase_Config passed from the HTML file.
3. THE Main_Module SHALL handle Firebase authentication (sign-in, sign-out, auth state changes) and expose the authenticated state to Panel_Modules.
4. THE Main_Module SHALL implement sidebar navigation switching logic that activates the correct panel and triggers the corresponding Panel_Module loader function.
5. THE Main_Module SHALL implement mobile sidebar toggle and overlay behavior.
6. THE Main_Module SHALL implement the config submenu toggle behavior.
7. WHEN the HTML file loads, THE Admin_Panel SHALL include a single `<script type="module">` tag that imports and initializes the Main_Module, passing Firebase_Config and API endpoint URLs.

### Requirement 2: Dashboard Module

**User Story:** As a developer, I want the dashboard logic isolated in its own module, so that I can modify overview stats and post statistics independently.

#### Acceptance Criteria

1. THE Panel_Module for dashboard SHALL export a `loadOverview` function that fetches analytics data and renders overview stats and recent editions.
2. THE Panel_Module for dashboard SHALL export a `renderPostStats` function that computes and displays post statistics from the Posts_Data_Script.
3. THE Panel_Module for dashboard SHALL export a `computePostStats` function that calculates post counts by status, time period, and position tag.
4. WHEN the dashboard panel is activated, THE Main_Module SHALL call `loadOverview` from the dashboard Panel_Module.

### Requirement 3: Posts Module

**User Story:** As a developer, I want the posts table, filtering, and detail panel logic in its own module, so that I can iterate on the posts management UI independently.

#### Acceptance Criteria

1. THE Panel_Module for posts SHALL export a `loadPostsPanel` function that parses the Posts_Data_Script and initializes the Grid.js table.
2. THE Panel_Module for posts SHALL export an `initPostsTable` function that configures and renders the Grid.js posts table with sorting, pagination, and action buttons.
3. THE Panel_Module for posts SHALL export a `filterPosts` function that filters posts by search term, status, and position tag, then re-renders the table.
4. THE Panel_Module for posts SHALL export a `showPostDetail` function that displays the detail panel for a selected post.
5. WHEN the posts panel is activated, THE Main_Module SHALL call `loadPostsPanel` from the posts Panel_Module.

### Requirement 4: New Post Module

**User Story:** As a developer, I want the post creation form, editor initialization, AI generation, and form validation logic in its own module, so that I can extend the post editor without touching other panels.

#### Acceptance Criteria

1. THE Panel_Module for new-post SHALL export an `initNewPostPanel` function that sets up the post creation form, character counters, mode toggle, EasyMDE editor, and AI direction cards.
2. THE Panel_Module for new-post SHALL handle form validation and submission to the `createPost` Cloud Function.
3. THE Panel_Module for new-post SHALL handle AI post generation including the direction card selection, API call with timeout, and form population on success.
4. THE Panel_Module for new-post SHALL export an `editPost` function and a `restoreNewPostPanel` function for the edit placeholder flow.
5. WHEN the new-post panel is activated, THE Main_Module SHALL call `initNewPostPanel` from the new-post Panel_Module if not already initialized.

### Requirement 5: Compose Module

**User Story:** As a developer, I want the newsletter compose logic in its own module, so that I can modify the send flow without affecting other panels.

#### Acceptance Criteria

1. THE Panel_Module for compose SHALL export a `loadPosts` function that fetches available posts from the API and renders the post selection list.
2. THE Panel_Module for compose SHALL handle the compose form submission including subject validation, segment selection, post selection, tool invitation, and multi-segment sending.
3. THE Panel_Module for compose SHALL handle the rich text editor toolbar commands for the intro text field.
4. THE Panel_Module for compose SHALL handle the tool dropdown auto-fill behavior.
5. WHEN the compose panel is activated, THE Main_Module SHALL call `loadPosts` from the compose Panel_Module.

### Requirement 6: Subscribers Module

**User Story:** As a developer, I want the subscriber management logic in its own module, so that I can modify the subscriber grid, filters, and edit form independently.

#### Acceptance Criteria

1. THE Panel_Module for subscribers SHALL export a `loadSubscribers` function that fetches subscribers from the API, applies segment filters, and renders the Grid.js table.
2. THE Panel_Module for subscribers SHALL handle adding new subscribers via the add form.
3. THE Panel_Module for subscribers SHALL handle editing subscribers via the edit form (name, segments update).
4. THE Panel_Module for subscribers SHALL handle deactivating and deleting subscribers via table action buttons.
5. THE Panel_Module for subscribers SHALL handle CSV export of the current subscriber list.
6. WHEN the subscribers panel is activated, THE Main_Module SHALL call `loadSubscribers` from the subscribers Panel_Module.

### Requirement 7: Analytics Module

**User Story:** As a developer, I want the analytics logic in its own module, so that I can extend analytics views without touching other panels.

#### Acceptance Criteria

1. THE Panel_Module for analytics SHALL export a `loadAnalytics` function that fetches edition data and renders the Grid.js analytics table.
2. THE Panel_Module for analytics SHALL export a `viewEdition` function that fetches and displays detailed stats for a single edition.
3. THE Panel_Module for analytics SHALL export a `viewEditionFromOverview` function that switches to the analytics panel and shows edition detail directly.
4. WHEN the analytics panel is activated, THE Main_Module SHALL call `loadAnalytics` from the analytics Panel_Module.

### Requirement 8: Import Module

**User Story:** As a developer, I want the import logic in its own module, so that I can modify the bulk import flow independently.

#### Acceptance Criteria

1. THE Panel_Module for import SHALL export an initialization function that wires up the import button click handler.
2. THE Panel_Module for import SHALL handle JSON parsing, validation, confirmation, and API submission for bulk subscriber imports.
3. THE Panel_Module for import SHALL display import results (imported, skipped, rejected counts) after a successful import.

### Requirement 9: Jekyll Liquid Data Preservation

**User Story:** As a developer, I want Jekyll Liquid variables and build-time data to remain in the HTML file, so that the static site generator can inject them at build time.

#### Acceptance Criteria

1. THE Admin_Panel HTML file SHALL retain the Posts_Data_Script element containing Jekyll Liquid-generated post JSON.
2. THE Admin_Panel HTML file SHALL retain Firebase_Config values (API key, auth domain, project ID) derived from Jekyll Liquid variables.
3. THE Admin_Panel HTML file SHALL retain API endpoint URLs derived from Jekyll Liquid variables.
4. THE Admin_Panel HTML file SHALL pass Firebase_Config and API URLs to the Main_Module via a configuration object or inline script that the module reads.

### Requirement 10: No Build Tools Constraint

**User Story:** As a developer, I want the modular architecture to work without any build tools or bundlers, so that the Jekyll site remains simple to deploy.

#### Acceptance Criteria

1. THE Module_System SHALL use native browser ES module syntax (`import`/`export`) exclusively.
2. THE Admin_Panel HTML file SHALL load modules via `<script type="module">` tags.
3. THE Module_System SHALL NOT require any build step, bundler, transpiler, or package manager for frontend JavaScript.
4. THE Module_System SHALL NOT introduce any new external dependencies beyond what is already used (Firebase, Grid.js, EasyMDE).

### Requirement 11: Functional Equivalence

**User Story:** As a developer, I want all existing functionality to work identically after the refactor, so that no admin workflows are broken.

#### Acceptance Criteria

1. WHEN a user signs in with Google, THE Admin_Panel SHALL authenticate and display the dashboard identically to the current implementation.
2. WHEN a user navigates between panels, THE Admin_Panel SHALL load and display each panel with the same behavior as the current implementation.
3. WHEN a user creates a post, THE Admin_Panel SHALL validate, submit, and confirm post creation identically to the current implementation.
4. WHEN a user composes and sends a newsletter, THE Admin_Panel SHALL validate, submit, and confirm sending identically to the current implementation.
5. WHEN a user manages subscribers (add, edit, deactivate, delete, export), THE Admin_Panel SHALL perform each action identically to the current implementation.
6. WHEN a user views analytics or edition details, THE Admin_Panel SHALL fetch and display data identically to the current implementation.
7. WHEN a user imports subscribers, THE Admin_Panel SHALL validate, submit, and display results identically to the current implementation.

### Requirement 12: File Structure

**User Story:** As a developer, I want a clear, predictable file structure for the admin modules, so that I can quickly locate code for any feature.

#### Acceptance Criteria

1. THE Module_System SHALL organize files under `assets/js/admin/` with one file per panel/feature.
2. THE Module_System SHALL include the following files: `main.js`, `dashboard.js`, `posts.js`, `new-post.js`, `compose.js`, `subscribers.js`, `analytics.js`, and `import.js`.
3. THE Admin_Panel HTML file SHALL contain only markup, the Posts_Data_Script, Firebase_Config initialization, and a module import statement.

### Requirement 13: HTML Thinning

**User Story:** As a developer, I want the HTML file to contain only markup and data that must be generated at build time, so that the file is easy to read and maintain.

#### Acceptance Criteria

1. THE Admin_Panel HTML file SHALL NOT contain inline JavaScript logic beyond the minimal bootstrap that passes configuration to the Main_Module.
2. THE Admin_Panel HTML file SHALL retain all existing HTML markup for panels, forms, and UI elements.
3. THE Admin_Panel HTML file SHALL retain external script tags for Grid.js and EasyMDE CDN resources.
4. IF the inline `onclick` handlers in HTML markup reference module functions, THEN THE Admin_Panel SHALL expose those functions on the `window` object from the appropriate Panel_Module.
