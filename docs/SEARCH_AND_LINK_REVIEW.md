# Search, agent discovery, and link review

The site remains a personal publication. Changes prioritize substantive articles and topic explanations, plain HTML navigation, author context, and accurate search metadata.

## Content and design

- Four topic pages now define the question, examine trade-offs, give clearly labelled illustrative examples, and link to supporting articles. The operating-ownership and reporting-versus-intelligence arguments from the former positions have been retained within People & adoption and Outcomes & evidence.
- About explains the mission, background, and editorial standard, with the existing CV, book, Gepackt, LinkedIn, and contact links preserved.
- Newsletter offers sample articles before a free subscription. Unverified audience numbers and publishing-frequency claims have been removed.
- Contact uses a labelled, accessible form. Joining the newsletter is a separate, unchecked choice. A message can be sent without subscribing. The message endpoint and payload remain compatible.
- Public-facing “essay” terminology is now “article.” Existing URLs, CSS hooks, and anchor IDs are intentionally retained.

## Search and agent discovery

- Homepage search title and description explicitly describe AI adoption and business value; visible topic links connect it to the four topic guides.
- Canonical URLs, social metadata, and linked WebSite, Person, WebPage, Article, BreadcrumbList, and topic ItemList data identify the publication, author, pages, and visible article lists. Structured data does not claim an unverified company, service, rating, result, or credential.
- Topic content is server-rendered and readable without JavaScript. Search and filtering progressively enhance an archive whose article links remain in the HTML.
- `llms.txt` is generated from current topic and article data rather than a stale list. It is a supplementary navigation aid, not a ranking mechanism or a substitute for canonical HTML.
- `robots.txt` explicitly permits OAI-SearchBot for public content while excluding administrative and account/report areas. Existing training-crawler preferences are retained.
- Sitemap entries use canonical content pages. Compatibility routes are excluded from the sitemap.

## Compatibility

- A pre-change baseline records 382 generated HTML paths and 368 original source URL paths, including retired learning pages.
- Article URLs remain unchanged. Incorrect historical date URLs have compatibility pages pointing to the existing article.
- Former `/positions/` URLs retain substantive topic HTML and identify the current topic with a canonical URL and an immediate browser redirect. This supports both old bookmarks and agents that do not execute JavaScript.
- Common `.html` page URLs are retained as aliases. Redirects preserve query strings and fragments when JavaScript is available, with a meta-refresh and link fallback.
- Previously unpublished Sproochentest URLs resolve through compatibility routes to equivalent resources in the current Gepackt project. Combined or retired resources have a useful bridge page instead of an unrelated redirect. Retired study material has not been republished.
- GitHub Pages does not provide arbitrary server-side redirect rules from this repository. These are static redirect pages, not HTTP 301 responses. If hosting changes later, the same mapping can be implemented with permanent server redirects.

## Sources consulted

- [Google: helpful, reliable, people-first content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)
- [Google: AI features and your website](https://developers.google.com/search/docs/appearance/ai-features)
- [Google: URL changes and site moves](https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes)
- [OpenAI: crawler controls and OAI-SearchBot](https://developers.openai.com/api/docs/bots)

These are local content and technical checks. Search rankings, inclusion in AI answers, external hosting behavior, and Search Console indexing are not established by a local build. No production deployment is included in this work.

## Verification completed

- Jekyll build; JavaScript syntax; generated JSON-LD parsing; sitemap and RSS XML parsing.
- All 382 pre-change HTML paths and all 368 original URL paths resolve. The inventories overlap; these are not counts of distinct pages added.
- All root-relative, relative, and same-site absolute article/page links resolve in the generated site. The agent guide has no stale internal targets.
- No visible “essay” labels remain. Internal CSS hooks and fragment IDs are retained for compatibility.
- Browser checks at 320, 390, 768, 1024, and 1440px: no horizontal overflow, one H1, aligned header/content, readable type, and working dark colors.
- Newsletter success/error states and contact send/error/reset states verified with mocked requests. No email or subscription was sent during testing. Newsletter signup is unchecked by default and independent of sending a message.
- Browser redirects preserve query strings and fragments. The writing filter and article controls remain functional.

Run the repeatable static checks with `bundle exec jekyll build` followed by `python3 scripts/check-publication.py`. The preserved route inventory is versioned in `scripts/fixtures/legacy-routes.json`.
