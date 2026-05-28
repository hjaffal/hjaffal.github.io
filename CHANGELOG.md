# Changelog

All notable changes to this project are documented here.

---

## 2026-05-28

- **Position migration**: Merged "AI Operations" + "Decision Authority" into "AI and Decision Operations" (`ai-decision-operations`). Renamed "AI and Work" to "AI Job Risk" (`ai-job-risk`). Now 3 positions instead of 4. Redirects in place for old URLs. Updated homepage, writing page, admin panel, dashboard, post generation, Cloud Functions, tests, and all 49 posts retagged. `9d9500b`, `9a47a46`
- **Writing page**: Position cards grid updated to 3 columns, single column on mobile, added top spacing from hero.
- **Homepage hero**: Replaced bio card with newsletter subscription form. Buttons changed to "Read My Articles" and "View the Book" (links to /books). `c4846b7`
- **Newsletter segments fix**: Sproochentest pages now correctly assign `sproochentest_prep` only. AI Job Risk Assessment auto-subscribes users to `main_website` segment.
- **Admin assessments**: Added Email column to Grid.js table. Removed backfill tokens button.
- **Post generation prompt**: Shortened target to 500-600 words, fewer article formats, more human-like writing style. `159b352`
- **Sproochentest fix**: Corrected "bloen Hiem" to "blot Hiem" in image description guide.
- **GitHub Issues**: Added structured issue templates (Feature, Bug, Content, Sproochentest).

## 2026-05-27

- **Admin panel — Job Assessments page**: Lists AI Job Risk Assessment submissions with Grid.js (name, email, job title, score, country, date, view report button).
- **Backfill tokens Cloud Function**: One-time utility to update existing Firestore documents with raw report tokens.
- **Homepage**: "What I Stand For" changed to "What I Believe In".
- **Console easter egg**: Updated to reflect Jekyll + Firebase + Gemini stack.
- **Admin panel icon**: Changed to dashboard lines, label to "Admin Panel".
- **Documentation**: Created SETUP.md, updated README.md.
