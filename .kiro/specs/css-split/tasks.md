# Tasks: CSS Split

## Task 1: Create global.css ✅
- [x] Extract CSS variables, resets, typography, navbar, footer, sidebar, page-with-sidebar layout, post-hero-accent (shared), post-heading (shared), dark mode base, 404, tags, hamburger menu, and global responsive rules into `assets/css/global.css`
- [x] Include all dark mode overrides for global elements (navbar, footer, sidebar, page-main)
- [x] Include responsive breakpoints for global elements (sidebar collapse at 960px, footer stack at 600px, navbar mobile at 1199px)
- [x] Update `_config.yml` to add `global.css` to `site-css` (alongside custom-styles.css during transition)
- [x] Verify Jekyll builds successfully

## Task 2: Create homepage.css ✅
- [x] Extract all `.hp-*` classes into `assets/css/homepage.css`
- [x] Include mobile overrides for `.hp-*` at 960px and 640px breakpoints
- [x] Add `css: ["/assets/css/homepage.css"]` to `index.html` front matter
- [x] Verify homepage renders correctly

## Task 3: Create writing.css ✅
- [x] Extract `.writing-page`, `.writing-essays*`, `.writing-essay-*` classes into `assets/css/writing.css`
- [x] Include dark mode overrides for writing elements
- [x] Include responsive rules at 600px
- [x] Add `css: ["/assets/css/writing.css"]` to `writing.html` front matter
- [x] Verify writing page renders correctly

## Task 4: Create post.css ✅
- [x] Extract `.post-share*`, `.post-preview`, `.post-title`, `.post-meta`, `.post-entry`, `.post-read-more`, `.post-related*` classes into `assets/css/post.css`
- [x] Include dark mode overrides for post content
- [x] Add `css: ["/assets/css/post.css"]` to `_layouts/post.html` front matter
- [x] Verify post pages render correctly

## Task 5: Create position.css ✅
- [x] Extract `.pos-nav*`, `.pos-crosslinks*`, `.position-article-row` styles into `assets/css/position.css`
- [x] Add `css: ["/assets/css/position.css", "/assets/css/post.css"]` to `_layouts/position.html` front matter
- [x] Verify position pages render correctly

## Task 6: Create template.css ✅
- [x] Extract `.tpl-meta-*`, `.tpl-download-*`, `.tpl-related*` classes into `assets/css/template.css`
- [x] Add `css: ["/assets/css/template.css"]` to `_layouts/template.html` front matter
- [x] Verify template pages render correctly

## Task 7: Create sproochentest.css ✅
- [x] Extract all `.sp-*`, `.listen-*`, `.transcript-*`, `.quiz-*` classes into `assets/css/sproochentest.css`
- [x] Include sproochentest header, footer, mobile dropdown, topic sidebar
- [x] Include all sproochentest responsive breakpoints
- [x] Add `css: ["/assets/css/sproochentest.css"]` to `sproochentest.html` and all `_layouts/sproochentest-*.html` front matter
- [x] Verify sproochentest pages render correctly

## Task 8: Create assessment.css ✅
- [x] Extract `.result-signal-*` classes into `assets/css/assessment.css`
- [x] Include responsive at 600px
- [x] Add `css: ["/assets/css/assessment.css"]` to `tools/future-proof-skills-assessment.html` front matter
- [x] Verify assessment page renders correctly

## Task 9: Create about.css ✅
- [x] Extract `.about-hero*`, `.about-section`, `.about-content`, `.about-focus-list` classes into `assets/css/about.css`
- [x] Include responsive at 640px
- [x] Add `css: ["/assets/css/about.css"]` to `aboutme.html` front matter
- [x] Verify about page renders correctly

## Task 10: Create contact.css ✅
- [x] Extract `.contact-*`, `.form-group`, `.form-label` classes into `assets/css/contact.css`
- [x] Include dark mode for contact banner
- [x] Add `css: ["/assets/css/contact.css"]` to `contact.html` front matter
- [x] Verify contact page renders correctly

## Task 11: Create books.css ✅
- [x] Extract `.books-*`, `.book-item*`, `.book-meta-*`, `.book-theme-tag` classes into `assets/css/books.css`
- [x] Include dark mode for book items
- [x] Include responsive at 600px
- [x] Add `css: ["/assets/css/books.css"]` to `books.html` front matter
- [x] Verify books page renders correctly

## Task 12: Create newsletter.css ✅
- [x] Extract `.nl-*` and `.nl-simple-*` classes into `assets/css/newsletter.css`
- [x] Include responsive at 800px/900px
- [x] Add `css: ["/assets/css/newsletter.css"]` to `newsletter.html` front matter
- [x] Verify newsletter page renders correctly

## Task 13: Delete unused CSS and finalize ✅
- [x] Remove `custom-styles.css` from `site-css` in `_config.yml`
- [x] Verify all pages still render correctly with only global.css + page-specific CSS
- [x] Delete `assets/css/custom-styles.css`
- [x] Final Jekyll build verification
- [x] Spot-check all pages for visual regressions
