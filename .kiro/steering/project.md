---
inclusion: always
---

# Project Steering — hasanjaffal.com

## Project Management

All changes are managed through GitHub Issues and the "hasanjaffal.com" GitHub Project (board #2, ID: PVT_kwHOAAQJBM4BZFeI).

**Issue Templates:**
- **Feature**: What / Why / Acceptance Criteria / Notes
- **Bug**: What's broken / Steps to reproduce / Where / Browser-Device / Screenshots
- **Content**: What / Position / SEO Target / Notes
- **Sproochentest**: What / Section / Details

**Lifecycle — every change MUST follow this:**
1. **Create issue** using the appropriate template. Add label(s): `feature`, `bug`, `content`, `sproochentest`, `admin`, `seo`.
2. **Add to project board**: `gh project item-add 2 --owner hjaffal --url <issue-url>`
3. **When starting work**: Move issue to "In progress" on the board.
4. **Implement the change**, referencing the issue in code comments if relevant.
5. **Commit with issue reference**: Include `Closes #N` in the commit message.
6. **Push to master**.
7. **Move issue to "Done"** on the board (or let `Closes #N` auto-close it).
8. **Update CHANGELOG.md** with the change description and commit hash.

**Status field ID:** PVTSSF_lAHOAAQJBM4BZFeIzhUGq5I
**Status options:**
- Backlog: f75ad846
- Ready: 61e4505c
- In progress: 47fc9ee4
- In review: df73e18b
- Done: 98236657

**Labels:** `feature`, `bug`, `content`, `sproochentest`, `admin`, `seo`

**Commands:**
- Create issue: `gh issue create --repo hjaffal/hjaffal.github.io --title "..." --body "..." --label "..."`
- Add to project: `gh project item-add 2 --owner hjaffal --url <issue-url>`
- Move to In progress: `gh project item-edit --project-id PVT_kwHOAAQJBM4BZFeI --id <item-id> --field-id PVTSSF_lAHOAAQJBM4BZFeIzhUGq5I --single-select-option-id 47fc9ee4`
- Move to Done: `gh project item-edit --project-id PVT_kwHOAAQJBM4BZFeI --id <item-id> --field-id PVTSSF_lAHOAAQJBM4BZFeIzhUGq5I --single-select-option-id 98236657`
- Close issue: `gh issue close N --repo hjaffal/hjaffal.github.io`
- List project items: `gh project item-list 2 --owner hjaffal --format json`

## Overview

This is Hasan Jaffal's personal authority website. The site positions Hasan around AI, risk intelligence, operational decision-making, dashboards, data signals, decision authority, future-proof skills, books, templates, and Luxembourgish learning resources.

**Core positions:**
- AI will not fix weak operations. It will expose them.
- Data signals are useless without decision authority.
- Reporting is not intelligence.
- AI is changing work, so people need broader, future-proof skillsets.

**Hasan's role:** Data and business intelligence leader (NOT security/loss prevention leader).

## Core Priorities

1. Preserve SEO
2. Preserve existing live URLs
3. Improve performance
4. Improve reusable components
5. Use composition over large page-specific files
6. Remove inline styling
7. Avoid loading unnecessary CSS globally
8. Keep Firebase isolated and minimal
9. Keep content and configuration clean
10. Maintain a premium, authority-building UX

## Hard Constraints

- Never change existing routes or URLs unless redirects are explicitly added.
- Do NOT push to git automatically. User handles commits and pushes.
- Existing indexed URLs must continue to work.
- Do not remove SEO metadata.
- Do not rename public assets without checking references.
- Do not use Firestore for the Future-Proof Skills Assessment.
- Do not store assessment answers.
- Do not expose secrets in frontend code.
- Do not place the Resend API key in frontend files.
- Firebase is only used to call a Cloud Function that sends the guide email.
- Frontend assessment logic must calculate the result locally.
- The frontend should send only: email, score, resultBand, jobFamily, weakestCategory, and strongestCategory.
- Do NOT edit files using terminal commands (sed, mv, rm). Use `str_replace`, `fs_write`, `fs_append`, `delete_file` tools instead.
- Do NOT mention templates as a positioning tool — they are for SEO traffic only.
- Use "weekly writing" not "weekly essays."

## Frontend Architecture

- Keep pages thin.
- Compose pages from reusable sections and components.
- Prefer reusable components over duplicated markup.
- Move repeated content into `_data/` config files where practical.
- Keep Firebase client code isolated.
- Keep assessment questions, scoring, result bands, and recommendation logic in separate config or utility files.
- Avoid large all-in-one files.
- Avoid repeated card, CTA, FAQ, newsletter, book, article, and template markup.

### Preferred Reusable Components

- PageHeader
- SectionHeader (`_includes/section-header.html`)
- CardGrid
- ContentCard
- CTASection
- NewsletterBlock (`_includes/newsletter.html`)
- BookFeature
- ArticleList
- TemplateCard
- FAQSection
- AssessmentStep
- AssessmentOption
- ResultCard
- ProgressIndicator
- EmailCaptureForm

## Styling Rules

- Remove inline styles. Do not add new inline styles.
- Use the project's shared styling system (CSS classes in `assets/css/`).
- Keep only base styles, tokens, typography, layout primitives, and shared utilities in `global.css`.
- Do not load one large CSS file on every page.
- CSS is split: `global.css` (loaded on all pages via `site-css`) + page-specific files (loaded via `page.css` or `layout.css` front matter).
- Each page should load only the CSS it requires.
- Keep visual design stable unless a change is explicitly approved.
- Test mobile layout after CSS changes.
- After any CSS change, do a full clean build: remove `_site` and `.jekyll-cache` before rebuilding.

### CSS File Structure

```
assets/css/
├── global.css          ← site-css (every page)
├── homepage.css        ← index.html (page.css front matter)
├── writing.css         ← writing.html
├── post.css            ← _layouts/post.html (layout.css front matter)
├── position.css        ← _layouts/position.html
├── template.css        ← _layouts/template.html
├── sproochentest.css   ← sproochentest pages + layouts
├── assessment.css      ← tools/future-proof-skills-assessment.html
├── about.css           ← aboutme.html
├── contact.css         ← contact.html
├── books.css           ← books.html
└── newsletter.css      ← newsletter.html
```

### CSS Loading Mechanism

- `_config.yml` → `site-css` array loads global CSS on every page.
- Pages use `css:` front matter array to load page-specific CSS.
- Layouts use `css:` front matter array (supported via `layout.css` in `_includes/head.html`).
- Do NOT use `@import url()` inside CSS files — it doesn't work reliably with Jekyll static serving.
- Google Fonts are loaded via `<link>` tag in `_includes/head.html`.

## Performance Rules

- Avoid loading unnecessary CSS and JavaScript.
- Avoid duplicated CSS.
- Avoid large catch-all files.
- Keep images optimized.
- Preserve Core Web Vitals.
- Avoid unnecessary third-party scripts.
- Use lazy loading where appropriate.

## SEO Rules

- Keep explicit metadata per page.
- Preserve title tags, meta descriptions, canonical URLs, and structured data where present.
- Do not break sitemap or indexed pages.
- Use descriptive internal link text.
- Keep authority topic clusters clear:
  - AI and Decision Operations
  - Risk Intelligence
  - AI Job Risk
  - Future-Proof Skills
  - Templates
  - Books
  - Luxembourgish / Sproochentest

### Canonical Tags

The 3 canonical position tags are: `ai-decision-operations`, `risk-intelligence`, `ai-job-risk`.

## Content Rules

- Tone: direct, sharp, practical, authority-building.
- Avoid generic motivational language.
- Avoid consultant-style filler.
- Use clear claims, strong positioning, and useful explanations.
- Homepage establishes authority.
- Writing / Field Intelligence proves authority.
- Books page supports long-form credibility.
- Templates act as practical proof (SEO traffic only).
- Luxembourgish guide pages stay SEO-focused and useful.

## Key Configuration

- Firebase function URLs are in `_data/firebase.yml`.
- Position data is in `_data/positions.yml`.
- Beehiiv form IDs: desktop `d805d78f-acff-4c2b-b871-fe65ff327886`, mobile `c48f5bc1-80ee-479b-b238-d7fe9d839504`.
- Contact form emails go to `jaftalks@gmail.com`.
- Emails send from `hasan@hasanjaffal.com` via Resend.
- `node_modules/` and `functions/node_modules/` are in `.gitignore`.

## Before Making Changes

1. Review the current structure.
2. Identify SEO risks.
3. Identify route risks.
4. Identify reusable component opportunities.
5. Identify CSS and performance risks.
6. Propose a safe step-by-step plan.
7. Do not refactor blindly.

## After Making Changes

1. Do a full clean build (`rm -rf _site .jekyll-cache` then `bundle exec jekyll build`).
2. Check homepage.
3. Check Writing / Field Intelligence page.
4. Check Books page.
5. Check Templates page.
6. Check Luxembourgish guide pages.
7. Check Future-Proof Skills Assessment page.
8. Check navigation.
9. Check forms and CTAs.
10. Check mobile layout.
11. Confirm existing URLs still work.
12. Confirm no secrets were exposed.
