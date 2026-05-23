# Design: CSS Split

## Overview

Split `assets/css/custom-styles.css` (4,862 lines) into 1 global file + 11 page-specific files. Uses Jekyll's `site-css` for global and `page.css` front matter for per-page loading.

## Architecture

```
assets/css/
├── global.css          ← loaded on every page via _config.yml site-css
├── homepage.css        ← index.html
├── writing.css         ← writing.html
├── post.css            ← _layouts/post.html
├── position.css        ← _layouts/position.html
├── template.css        ← _layouts/template.html
├── sproochentest.css   ← sproochentest.html + all sp-* layouts
├── assessment.css      ← tools/future-proof-skills-assessment.html
├── about.css           ← aboutme.html
├── contact.css         ← contact.html
├── books.css           ← books.html
├── newsletter.css      ← newsletter.html
└── (custom-styles.css deleted at end)
```

## File Contents Mapping

### global.css (~1,200 lines)
Source lines: 1–100 (variables, global resets, typography), 100–300 (navbar), 1050–1200 (page-with-sidebar layout), 1200–1400 (sidebar components), 1400–1600 (footer), 1650–1780 (post-layout-wrapper, overrides, forms), 1800–1960 (responsive breakpoints for sidebar/navbar/footer), 2000–2200 (dark mode base + navbar/footer dark), 2400–2500 (404 page), 2500–2600 (tags page), 4758–4800 (mobile grid fixes for inline styles), hamburger menu styles.

Contains:
- `:root` CSS variables
- Global resets (html, body, p, a, h1-h4, em, ::selection)
- Hide Beautiful Jekyll defaults (.intro-header, .avatar-container, .page-heading)
- Navbar (all `.navbar*` rules)
- Nav CTA button
- Dark mode toggle button
- Page-with-sidebar grid layout
- Sidebar components (newsletter, recent, publication, templates)
- Footer
- Post-layout-wrapper base
- Global overrides (a:visited, .btn-primary, forms)
- Dark mode base variables + navbar/footer dark overrides
- 404 page (.error-*)
- Tags page (.tags-*, .tag-*)
- Mobile hamburger menu
- Responsive: sidebar collapse, navbar padding, footer stack

### homepage.css (~180 lines)
Source lines: 4700–4862 (all `.hp-*` classes + mobile overrides)

Contains:
- `.hp-hero`, `.hp-hero-orb-*`, `.hp-hero-grid`, `.hp-hero-label`, `.hp-hero-title`, `.hp-hero-desc`, `.hp-hero-audience`, `.hp-hero-ctas`, `.hp-hero-cta-primary`, `.hp-hero-cta-ghost`
- `.hp-proof-card`, `.hp-proof-header`, `.hp-proof-avatar`, `.hp-proof-name`, `.hp-proof-role`, `.hp-proof-list`, `.hp-proof-item`, `.hp-proof-dot`, `.hp-proof-text`
- `.hp-positions`, `.hp-positions-grid`, `.hp-position-card`, `.hp-position-header`, `.hp-position-num`, `.hp-position-tag`, `.hp-position-title`, `.hp-position-desc`, `.hp-position-cta`
- `.hp-assessment`, `.hp-assessment-inner`
- `.hp-book`, `.hp-book-grid`, `.hp-book-cover`
- `.hp-newsletter`, `.hp-newsletter-grid`, `.hp-newsletter-form`
- Mobile overrides for `.hp-*` at 960px and 640px

### writing.css (~180 lines)
Source lines: 530–700 (`.writing-*` classes)

Contains:
- `.writing-page`
- `.writing-essays`, `.writing-essays-header`, `.writing-essays-intro`
- `.writing-essays-list`, `.writing-essay-item`, `.writing-essay-left`, `.writing-essay-right`
- `.writing-essay-thumb`, `.writing-essay-thumb-placeholder`
- `.writing-essay-date`, `.writing-essay-date-day`, `.writing-essay-date-month`, `.writing-essay-date-year`
- Dark mode: `.writing-essays-list`, `.writing-essay-item`, `.writing-essay-thumb`, `.writing-essay-date`
- Responsive at 600px

### post.css (~120 lines)
Source lines: 1600–1650 (post share), 1580–1600 (post hero accent — already in global as shared with position/template), 4830–4862 (post-related, position crosslinks, position nav)

Contains:
- `.post-share`, `.post-share-label`, `.post-share-buttons`, `.post-share-btn`
- `.post-preview`, `.post-title`, `.post-meta`, `.post-entry`, `.post-read-more`
- `.page-content p`, `.post-content p/ul`
- `.post-related`, `.post-related-title`, `.post-related-grid`, `.post-related-card`, `.post-related-card-title`, `.post-related-card-date`, `.post-related-positions`
- Dark mode for post content

### position.css (~50 lines)
Source lines: 4850–4862 (position nav + crosslinks)

Contains:
- `.pos-nav`, `.pos-nav-active`, `.pos-nav-link`
- `.pos-crosslinks`, `.pos-crosslinks-title`, `.pos-crosslinks-grid`, `.pos-crosslinks-card`, `.pos-crosslinks-num`, `.pos-crosslinks-name`
- `.position-article-row` hover styles

### template.css (~40 lines)
Source lines: 4805–4830

Contains:
- `.tpl-meta-grid`, `.tpl-meta-card`, `.tpl-meta-label`, `.tpl-meta-value`
- `.tpl-download-btn`, `.tpl-download-cta`
- `.tpl-related`, `.tpl-related-grid`, `.tpl-related-link`

### sproochentest.css (~600 lines)
Source lines: 2700–3200 (`.sp-*` main page), 3200–4700 (topic pages, listening, image description, quiz, header, mobile dropdown, transcript panel)

Contains:
- All `.sp-*` classes (hero, sections, cards, checklist, formula, methods, vocab, grammar, plan, downloads, start-links)
- Topic page layout (`.sp-topic-page`, `.sp-topic-sidebar`, `.sp-topic-main`)
- Sproochentest header (`.sp-header*`)
- Listening practice (`.listen-*`)
- Image description (`.sp-img-*`, `.sp-phrase-*`)
- Quiz functionality (`.quiz-*`, `.selected`, `.correct`, `.wrong`)
- Transcript panel (`.transcript-*`)
- Mobile dropdown (`.sp-mobile-dropdown`, `.sp-topic-select`)
- Sproochentest footer (`.sp-footer`)
- All sproochentest responsive breakpoints

### assessment.css (~60 lines)
Source lines: 4680–4700 (`.result-signal-*`)

Contains:
- `.result-signal-table`, `.result-signal-card`, `.result-signal-fail`, `.result-signal-pass`
- `.result-signal-number`, `.result-signal-text`
- Responsive at 600px

### about.css (~40 lines)
Source lines: 4800–4810 (`.about-hero*`)

Contains:
- `.about-hero`, `.about-hero-orb`, `.about-hero-inner`, `.about-hero-avatar`
- `.about-hero-label`, `.about-hero-name`, `.about-hero-desc`
- `.about-section`, `.about-content`, `.about-focus-list`
- Responsive at 640px

### contact.css (~80 lines)
Source lines: 480–530

Contains:
- `.contact-section`, `.contact-intro`, `.contact-form`, `.form-group`, `.form-label`
- `.contact-form input/textarea` styles
- `.contact-submit`
- `.contact-banner` (success)
- `.contact-options`, `.contact-option`, `.contact-option-active`, `.contact-option-text`, `.contact-option-arrow`
- Dark mode for contact banner

### books.css (~80 lines)
Source lines: 380–480

Contains:
- `.books-section`, `.books-header`, `.books-grid`
- `.book-item`, `.book-item-cover`, `.book-item-content`, `.book-item-badge`, `.book-item-title`, `.book-item-subtitle`, `.book-item-desc`, `.book-item-themes`, `.book-theme-tag`, `.book-item-link`
- `.book-meta-panel`, `.book-meta-item`, `.book-meta-icon`, `.book-meta-label`, `.book-meta-value`
- Dark mode for book items
- Responsive at 600px

### newsletter.css (~200 lines)
Source lines: 2600–2700 (`.nl-*` full page) + 4600–4680 (`.nl-simple-*`)

Contains:
- `.nl`, `.nl-hero`, `.nl-hero-left`, `.nl-hero-right`, `.nl-hero-title`, `.nl-hero-sub`, `.nl-hero-note`
- `.nl-form-card`, `.nl-form-title`
- `.nl-info`, `.nl-info-inner`, `.nl-info-heading`, `.nl-info-list`, `.nl-info-tags`, `.nl-info-belief`
- `.nl-topics`, `.nl-topics-list`
- `.nl-posts`, `.nl-posts-grid`, `.nl-post-card`, `.nl-post-tag`, `.nl-post-title`, `.nl-post-excerpt`, `.nl-post-date`
- `.nl-cta-final`, `.nl-cta-final-title`
- `.nl-simple`, `.nl-simple-grid`, `.nl-simple-left`, `.nl-simple-right`, `.nl-simple-title`, `.nl-simple-desc`, `.nl-simple-features`, `.nl-simple-form`
- Responsive at 800px/900px

## Styles to DELETE (unused)

These styles reference elements/pages that no longer exist or were from the old hero layout:
- `.hero`, `.hero-grid`, `.hero-left`, `.hero-right`, `.hero-right-top`, `.hero-right-bottom` (old hero — replaced by `.hp-hero`)
- `.hero-tag`, `.hero-diamond` (old hero tag)
- `.hero-headline` (old hero)
- `.hero-sub` (old hero)
- `.btn-linkedin` (old hero button — replaced by `.hp-hero-cta-*`)
- `.pub-row`, `.pub-cover`, `.pub-info`, `.pub-title`, `.pub-link` (old hero publication section)
- `.newsletter-desc` (old hero newsletter)
- `.field-section`, `.field-header`, `.field-grid`, `.field-card`, `.field-card-*`, `.field-cta` (old field intelligence section — replaced by `.hp-positions`)
- `.card-label` — keep (still used in sproochentest sidebar)
- `.field-label` — keep (still used across pages)
- Dark mode overrides for deleted classes (`.hero-left`, `.hero-right`, `.field-section`, `.field-card`, etc.)
- `.header-section` push (old layout)
- `.hero { margin-top: -80px }` (old hero)
- Motion section (`.hero-left animation: none`, `.hero-right animation: none`)
- `.officehours-*` — check if officehours.html still uses them (keep if yes)
- `.gated-*` — check if future-proof-skills.html uses them (keep if yes)

**Estimated deletion: ~400 lines**

## Configuration Changes

### _config.yml
```yaml
site-css:
  - "/assets/css/global.css"
```

### Pages — `css` front matter additions

| File | css value |
|------|-----------|
| `index.html` | `["/assets/css/homepage.css"]` |
| `writing.html` | `["/assets/css/writing.css"]` |
| `_layouts/post.html` | `["/assets/css/post.css"]` |
| `_layouts/position.html` | `["/assets/css/position.css", "/assets/css/post.css"]` |
| `_layouts/template.html` | `["/assets/css/template.css"]` |
| `sproochentest.html` | `["/assets/css/sproochentest.css"]` |
| `_layouts/sproochentest-topic.html` | `["/assets/css/sproochentest.css"]` |
| `_layouts/sproochentest-listening.html` | `["/assets/css/sproochentest.css"]` |
| `_layouts/sproochentest-images.html` | `["/assets/css/sproochentest.css"]` |
| `_layouts/sproochentest-generic.html` | `["/assets/css/sproochentest.css"]` |
| `tools/future-proof-skills-assessment.html` | `["/assets/css/assessment.css"]` |
| `aboutme.html` | `["/assets/css/about.css"]` |
| `contact.html` | `["/assets/css/contact.css"]` |
| `books.html` | `["/assets/css/books.css"]` |
| `newsletter.html` | `["/assets/css/newsletter.css"]` |

Note: Position layout also needs `post.css` because it uses `.post-hero-accent`, `.post-heading`, and `.post-heading-subtitle` which are shared with post layout. These shared post/position/template styles go in global since they're used by 3+ layouts.

## Shared Styles Decision

Styles used by multiple page-specific layouts (post, position, template):
- `.post-hero-accent`, `.post-hero-accent-inner`, `.post-hero-accent-shape` → **global.css** (used by post, position, template)
- `.post-heading`, `.post-heading h1`, `.post-heading-tags`, `.post-heading-subtitle` → **global.css** (used by post, position, template)
- `.post-main .blog-post` → **global.css** (used by post, position)

This means position layout only needs `position.css` (not `post.css`).

## Execution Order

1. Create `global.css` with shared styles
2. Create page-specific files one at a time (homepage → writing → post → position → template → sproochentest → assessment → about → contact → books → newsletter)
3. After each file: update front matter, verify Jekyll builds
4. Update `_config.yml` to point to `global.css`
5. Delete `custom-styles.css`
6. Final verification: all pages render correctly

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Missing a class in the split | Grep for each class name to confirm which pages use it |
| Dark mode breaks | Keep all `[data-theme="dark"]` overrides co-located with their light-mode counterparts in the same file |
| Responsive breaks | Keep `@media` queries co-located with the styles they modify in each file |
| Specificity changes | No specificity changes since we're just splitting into separate files loaded in the same order |
| Build failure | Test `bundle exec jekyll build` after each step |
