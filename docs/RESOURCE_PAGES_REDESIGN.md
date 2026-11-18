# Resource pages redesign

The templates, Lexicon, skills assessment, role directory, and job risk analyzer now share the publication’s purple editorial design. Public introductions link to the existing interactive URLs; template and term detail URLs also retain their content and destinations.

- Templates: eight actual resources, searchable descriptions and categories; PDF and copy-prompt actions retained. Download form has explicit subscription wording, labeled inputs, focus containment, and retry feedback.
- Lexicon: 36 server-rendered definitions, search and subject filtering, preserved `?topic=` links, full examples and explanations on detail pages. Framed as the author’s working vocabulary.
- Role directory: 154 original records and role destinations; task exposure estimates clearly distinguished from individual job-loss probabilities. Search, class filter, score/title sorting, URL state, and progressive pagination. All records remain present without JavaScript.
- Skills assessment: original profile choices, questions, scoring, thresholds, and backend payload preserved. Native keyboard-operable answers, progress announcements, labeled optional guide form, retry feedback, and mobile-friendly result screens.
- Analyzer: existing payload and endpoints retained; required email/newsletter consent disclosed before starting. Removed simulated analysis delay and random fallback score. Token-only server success now provides the private report dashboard link. Failed requests preserve answers and allow retry.
- Search: unique metadata, collection/application structured data, linked definitions, plain-text Lexicon, updated agent guide, and existing URL checks.

## Validation

`bundle exec jekyll build` and `python3 scripts/check-publication.py` validate generated content, structured data, links, historical routes, and search access.

Local headless Chrome checks cover nine representative index, detail, and interactive pages at 320, 390, 768, and 1440 pixels, plus dark mode. Interaction checks cover search/reset/empty states; directory filters, sorting, and pagination; no-JavaScript resource inventories; complete assessment scores of 0 and 36; guide failure/retry; task generation and manual entry; analyzer validation, network failure/retry, zero-score and actual token-only responses; template download callbacks.

External requests were mocked: no real report, newsletter subscription, email, or download was generated. Production Firebase availability and email delivery were not tested. No deployment was performed.
