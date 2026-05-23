# Requirements: CSS Split

## Overview
Split the monolithic `assets/css/custom-styles.css` (4,862 lines) into a lean global stylesheet plus page-specific CSS files. Use Jekyll's `site-css` config for the global file and `page.css` front matter for per-page styles. The previous attempt using `@import url()` failed because Jekyll static serving doesn't resolve CSS imports — this approach avoids that entirely.

## Requirements

### Functional Requirements

- FR-1: A single global CSS file (`global.css`) must contain only shared styles used across 3+ pages: CSS variables, resets, typography, navbar, footer, sidebar, dark mode base, and shared utility classes.
- FR-2: Each major page/layout must have its own CSS file loaded via `page.css` front matter, containing only styles specific to that page.
- FR-3: The following page-specific CSS files must be created:
  - `homepage.css` — hero, positions grid, book section, newsletter section, assessment section
  - `writing.css` — essay list, writing page grid, date badges, thumbnails
  - `post.css` — post hero accent, blog post typography, share buttons, related reading, post navigation
  - `position.css` — position nav, article rows, crosslinks, featured guide
  - `template.css` — template meta grid, download button/CTA, related templates, email gate modal
  - `sproochentest.css` — Luxembourgish exam prep page styles
  - `assessment.css` — future-proof skills assessment tool styles
  - `about.css` — about page content, focus list, sproochentest section
  - `contact.css` — contact form, options, success banner
  - `books.css` — book grid, book item, meta panel
  - `newsletter.css` — newsletter page embed styles
- FR-4: The original `custom-styles.css` must be deleted after the split is complete and verified.
- FR-5: Unused CSS (styles for elements/pages that no longer exist) must be identified and removed — not migrated to any new file.

### Non-Functional Requirements

- NFR-1: No visual regression — every page must render identically before and after the split.
- NFR-2: No broken URLs — no page routes, permalinks, or asset paths may change.
- NFR-3: Page load performance must not degrade. Each page should load only the CSS it needs (global + its own page CSS), reducing total CSS parsed per page.
- NFR-4: The `_includes/head.html` already supports `page.css` front matter — no changes needed to the head include.
- NFR-5: Dark mode must continue to work on all pages without regression.
- NFR-6: Mobile responsiveness must be preserved on all pages.

### Constraints

- C-1: Do NOT use `@import url()` in CSS files — this failed previously with Jekyll static serving.
- C-2: Use `site-css` in `_config.yml` for the global stylesheet (replacing the current `custom-styles.css` entry).
- C-3: Use `page.css` front matter array in each page/layout file to load page-specific styles.
- C-4: All new CSS files live under `assets/css/`.
- C-5: Do not change any existing page routes or SEO metadata.
- C-6: The split must be done incrementally — one file at a time — with verification after each step to catch regressions early.

### Acceptance Criteria

- AC-1: `custom-styles.css` no longer exists in the project.
- AC-2: `_config.yml` references `assets/css/global.css` in `site-css`.
- AC-3: Every page/layout that needs page-specific styles has a `css` front matter entry pointing to its CSS file.
- AC-4: Jekyll builds successfully with no errors.
- AC-5: Total lines across all new CSS files is less than the original 4,862 (due to unused CSS removal).
- AC-6: No page has visual differences when compared before/after.

## Out of Scope

- Switching to a CSS framework (Tailwind, etc.)
- CSS minification or build tooling
- Removing remaining inline styles from HTML (separate task)
- Refactoring CSS class names or architecture (BEM, etc.)

## Dependencies

- `_includes/head.html` already supports `page.css` front matter (confirmed).
- `_config.yml` `site-css` array is the mechanism for global CSS loading (confirmed).
