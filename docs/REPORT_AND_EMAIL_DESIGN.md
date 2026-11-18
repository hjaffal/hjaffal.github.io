# Report dashboard and outgoing emails

## Dashboard

`/tools/ai-job-risk-report/` now follows the purple publication design. The report starts with the reader’s context and written findings; overview, 30-day plan, skills, and saved profile are distinct, keyboard-accessible tabs. Chart detail is available after the practical findings, with accessible numeric summaries. Missing data stays missing: hard-coded metric defaults and the synthetic “AI Threat” comparison are removed.

Existing private tokens, GET and rerun endpoints, payloads, sharing links, profile editing and PDF download remain in use. Missing links, request failures, share focus handling, and rerun errors have explicit states. The page remains excluded from indexing and the sitemap. PDF export adopts the purple palette.

## Emails

`functions/email/design.js` supplies a common table-based, inline-styled shell with system fonts, serif headings, 16px body text, purple actions, a plain-text preheader, mobile spacing, and dark-mode adjustments. `portal.js` and `welcome.js` render the transactional and welcome messages; the existing newsletter renderer uses the same components.

Updated messages: newsletter editions (single, multiple, featured, optional tool), main and Sproochentest welcomes, personal job-risk report, skills guide, report download, shared-tool invitation, contact notification, testimonial notification, and the existing vocabulary reminder renderer. The vocabulary scheduler remains disabled.

All five portal sender configurations were compared with the pre-change source: recipients, subjects, reply-to settings, and delivery options remain unchanged. Newsletter opt-out destinations, one-click headers, click tracking and open pixels are retained. Personalized and generated text is HTML-escaped. Newsletter article images are included only when explicitly supplied; image paths are no longer guessed.

The welcome copy now introduces Opportunities, Investment decisions, People & adoption, and Outcomes & evidence. Transactional messages explain the requested resource and its primary link without asserting guaranteed career outcomes.

## Local previews

After `bundle exec jekyll build`:

```sh
node scripts/preview-portal-design.cjs
python3 -m http.server 4002 --bind 127.0.0.1 --directory /tmp/hjaffal-portal-design
```

- `http://localhost:4002/`: twelve email previews with a mobile/desktop switch.
- `http://localhost:4002/report.html`: fictional report using the actual dashboard markup.

The report fixture is explicitly labeled, report API requests are mocked, and network mutations are disabled. The previews contain no real subscriber data or live private tokens. The main local Jekyll site must remain available on port 4001 for dashboard assets.

## Verification

- Jekyll build and publication/link/metadata checks pass; all historical paths retained.
- Browser checks: report at 320, 390, 768, 1024, and 1440px; every tab; real charts; keyboard navigation; sharing focus/Escape; preserved edits on failed rerun; missing-token and network errors; zero score and missing metrics; report remains readable when Chart.js cannot load.
- All twelve email variants checked at 320, 390, and 660px, with additional dark-mode and inline-style-only fallback checks. These are browser previews, not a full Outlook/Gmail/iOS Mail client matrix.
- Actual jsPDF export produces a two-page sample PDF at `/tmp/hjaffal-redesigned-report.pdf`.
- 39 focused newsletter/welcome/new-renderer tests pass.
- Full backend suite: 216 pass, seven fail. All seven failures also occur in a pre-change baseline: subscription/default segment expectations (three), preference response shape (two), and RSS excerpt truncation expectations (two). Baseline also had a stale welcome-copy assertion, which now follows the current topic content. No new failing tests remain.

No emails were sent, real reports generated, or changes deployed. Email changes require a Firebase Functions deployment before production sends use the new design.
