# Technical Design — Writing Guide Alignment

## Overview

This design aligns hasanjaffal.com's content system with the 24-section writing guide. It covers: generation prompt rewrite, Layer 2 topic architecture, structured data, admin panel enhancements, and reference pages.

## Architecture

This design covers the full alignment of hasanjaffal.com's content system with the writing guide. The system is a Jekyll static site with Firebase Cloud Functions, native ES modules (no bundler), and GitHub Actions for automated posting.

**Key architectural decisions:**
- All writing guide rules live in shared data files (`_data/topics.yml`, `_data/writing-config.yml`) consumed by both the Cloud Function and the Python script
- The generation prompt is rebuilt from scratch as a template function that assembles sections based on parameters
- Structured data is added via Jekyll includes (no plugins needed)
- Layer 2 topics become a first-class data model used across the site
- Editorial checklist validation happens in the AI response (Gemini evaluates its own output)

```
┌──────────────────────────────────────────────────────────────────┐
│                        ADMIN PANEL (Browser)                      │
│  Position → Topic → Archetype → Mix → Techniques → Generate      │
└──────────────────────┬───────────────────────────────────────────┘
                       │ POST /generatePost
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│                   CLOUD FUNCTION (generate.js)                     │
│  ┌─────────────────┐    ┌──────────────────────────────────┐     │
│  │ prompt-builder.js│───▶│ Gemini 2.5 Flash                 │     │
│  │ (assembles full  │    │ (generates article + checklist)   │     │
│  │  prompt from     │    └──────────────┬───────────────────┘     │
│  │  config + params)│                   │                         │
│  └─────────────────┘                    ▼                         │
│                              Extended JSON Response                │
│                    {title, body, topic, archetype, keywords,       │
│                     external_reference, editorial_checklist}       │
└──────────────────────┬───────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│                   ADMIN PANEL (Display Results)                    │
│  - Article preview with word count                                │
│  - Editorial checklist (17 items, pass/fail)                      │
│  - Soft validation warnings                                       │
│  - Publish / Regenerate                                           │
└──────────────────────────────────────────────────────────────────┘
                       │ Publish
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│                   GITHUB (createPost / manageDrafts)               │
│  Post file with extended front matter:                            │
│  topic, archetype, keywords, tags                                 │
└──────────────────────────────────────────────────────────────────┘
                       │ Jekyll Build
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│                   PUBLIC SITE                                      │
│  - Article Schema JSON-LD                                         │
│  - FAQ Schema (question titles)                                   │
│  - Position pages with topic clusters                             │
│  - Writing page with topic filters                                │
│  - Reference pages (7 source-worthy assets)                       │
└──────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

| Component | File(s) | Purpose |
|-----------|---------|---------|
| Topics Data | `_data/topics.yml` | 30 Layer 2 topics with SEO keywords per position |
| Writing Config | `_data/writing-config.yml` | Shared config: archetypes, beliefs, metaphors, forbidden phrases, techniques, CTA text |
| Prompt Builder | `functions/posts/prompt-builder.js` | Assembles the full generation prompt from parameters + config |
| Generate Function | `functions/posts/generate.js` | Cloud Function entry point, accepts extended params, returns extended JSON |
| Python Script | `scripts/generate_post.py` | GitHub Actions automated posting, reads same config |
| Admin UI | `newsletter/admin/index.html` + `assets/js/admin/new-post.js` | Extended dropdowns, checklist display, soft warnings |
| Dashboard | `assets/js/admin/dashboard.js` | Topic coverage section |
| Article Schema | `_includes/article-schema.html` | JSON-LD structured data for posts |
| FAQ Schema | `_includes/faq-schema.html` | JSON-LD for question-titled posts |
| Post Layout | `_layouts/post.html` | Includes schema, renders extended front matter |
| Position Layout | `_layouts/position.html` | Topic cluster display |
| Writing Page | `writing.html` + `assets/css/writing.css` | Topic sub-filters |
| Reference Layout | `_layouts/reference.html` | Layout for source-worthy reference pages |
| Reference Pages | `references/*.html` (7 pages) | Standalone citable content assets |
| robots.txt | `robots.txt` | AI crawler rules |

## Data Models

### Post Front Matter (Extended)

```yaml
---
layout: post
title: "Why Most AI Transformations Are Expensive Theater"
subtitle: "The gap between AI announcements and operational reality"
share-description: "..."
tags:
  - ai-decision-operations
topic: ai-theater           # NEW — Layer 2 topic slug
archetype: contrarian       # NEW — Article archetype ID
keywords:                   # NEW — SEO keywords
  - AI transformation failure
  - fake AI adoption
  - AI theater
author: Hasan J.
---
```

### Generation Response JSON (Extended)

```json
{
  "title": "...",
  "subtitle": "...",
  "share_description": "...",
  "meta_title": "...",
  "excerpt": "...",
  "tags": ["ai-decision-operations"],
  "topic": "ai-theater",
  "archetype": "contrarian",
  "keywords": ["AI transformation failure", "fake AI adoption"],
  "body": "...(markdown with internal links, external ref, comparison table)...",
  "external_reference": {
    "title": "McKinsey: Why AI Transformations Fail",
    "url": "https://...",
    "source": "McKinsey"
  },
  "editorial_checklist": {
    "score": "15/17",
    "items": [
      {"name": "Fits one position", "passed": true},
      {"name": "Fits one topic", "passed": true},
      {"name": "Attacks a belief", "passed": true},
      {"name": "Creates tension", "passed": true},
      {"name": "Contains a memorable line", "passed": true},
      {"name": "Feels conversational", "passed": true},
      {"name": "Sounds human", "passed": true},
      {"name": "Avoids corporate tone", "passed": true},
      {"name": "Includes operational example", "passed": true},
      {"name": "Includes recommendation", "passed": true},
      {"name": "Includes forced-position question", "passed": true},
      {"name": "Includes CTA", "passed": true},
      {"name": "Includes internal links (min 2)", "passed": true},
      {"name": "Includes external reference", "passed": true},
      {"name": "Keyword naturally included", "passed": true},
      {"name": "Emotionally engaging", "passed": false},
      {"name": "Avoids duplication", "passed": true}
    ]
  }
}
```

### Topics Data Model (`_data/topics.yml`)

```yaml
# Keyed by position tag, each containing array of topic objects
ai-decision-operations:
  - slug: ai-theater
    name: "AI Theater"
    keywords: ["AI transformation failure", "fake AI adoption", "AI theater"]
    description: "Organizations that announce AI initiatives without operational change"
  - slug: fake-ai-transformation
    name: "Fake AI Transformation"
    keywords: ["digital transformation failure", "AI hype cycle"]
    description: "The gap between AI press releases and actual operational improvement"
  # ... 10 total

risk-intelligence:
  - slug: dashboard-addiction
    name: "Dashboard Addiction"
    keywords: ["dashboard problems", "too many dashboards", "dashboard overload"]
    description: "Organizations that build dashboards instead of decision systems"
  # ... 10 total

ai-job-risk:
  - slug: white-collar-automation
    name: "White-Collar Automation"
    keywords: ["AI replacing office jobs", "white collar automation"]
    description: "How AI is automating knowledge work faster than expected"
  # ... 10 total
```

## Correctness Properties

### Property 1: No Forbidden Phrases
Every generated article MUST NOT contain any of the 7 forbidden phrases. The Cloud Function validates this post-generation and rejects/regenerates if found.

**Validates: Requirement 2.14**

### Property 2: Word Count Bounds
Generated articles MUST be 500-600 words. The Cloud Function validates word count and rejects if outside bounds.

**Validates: Requirement 2.2**

### Property 3: Internal Link Minimum
Generated body MUST contain at least 2 markdown links to hasanjaffal.com paths. Validated post-generation.

**Validates: Requirement 3.4**

### Property 4: Front Matter Completeness
Every published post MUST have `topic`, `archetype`, and `keywords` fields populated.

**Validates: Requirements 14.1, 14.2, 14.3**

### Property 5: Schema Validity
Article Schema JSON-LD MUST be valid JSON and include all required fields (headline, author, datePublished).

**Validates: Requirements 11.1, 11.2**

### Property 6: Topic-Position Consistency
A post's `topic` field MUST belong to the position specified in its `tags`.

**Validates: Requirement 5.3**

## Error Handling

| Scenario | Handling |
|----------|----------|
| Generated article contains forbidden phrase | Regenerate automatically (max 2 retries), then return error |
| Word count outside 500-600 range | Regenerate with explicit length correction instruction |
| Fewer than 2 internal links in output | Add warning in response, don't block |
| External reference URL appears hallucinated | Flag in admin UI as "(verify link)" — non-blocking |
| Gemini timeout (>120s) | Return timeout error, admin can retry |
| Editorial checklist score < 12/17 | Display warning, suggest regeneration, don't block publish |
| Topic/keyword duplication detected | Return error with explanation, force different topic/keyword selection |
| Missing `_data/topics.yml` or `_data/writing-config.yml` | Cloud Function falls back to hardcoded defaults (current behavior) |

## Testing Strategy

| Test Type | Scope | Tool |
|-----------|-------|------|
| Unit tests | `prompt-builder.js` — verify prompt assembly for all parameter combinations | Vitest |
| Unit tests | Forbidden phrase detection — verify all 7 phrases are caught | Vitest |
| Unit tests | Word count validation — boundary testing (499, 500, 600, 601) | Vitest |
| Unit tests | Internal link counting — regex accuracy | Vitest |
| Unit tests | Front matter generation — all fields present | Vitest |
| Property tests | For any valid combination of position + topic + archetype, prompt builder produces a non-empty prompt containing all required sections | fast-check |
| Property tests | For any generated front matter, topic belongs to the correct position | fast-check |
| Integration test | Full generation flow — call Cloud Function with test params, verify response schema | Manual / Vitest with mocked Gemini |
| Schema validation | Article Schema JSON-LD output passes Google Rich Results Test | Manual |
| Template tests | Posts with/without topic/archetype/keywords render without errors | Jekyll build |

## Component 1: Layer 2 Topics Data Architecture

### File: `_data/topics.yml`

```yaml
ai-decision-operations:
  - slug: ai-theater
    name: "AI Theater"
    keywords: ["AI transformation failure", "fake AI adoption", "AI theater"]
  - slug: fake-ai-transformation
    name: "Fake AI Transformation"
    keywords: ["digital transformation failure", "AI hype", "fake transformation"]
  - slug: slow-decision-cultures
    name: "Slow Decision Cultures"
    keywords: ["slow decisions", "decision latency", "approval chains"]
  # ... (10 topics total)

risk-intelligence:
  - slug: dashboard-addiction
    name: "Dashboard Addiction"
    keywords: ["dashboard problems", "too many dashboards", "dashboard overload"]
  # ... (10 topics total)

ai-job-risk:
  - slug: white-collar-automation
    name: "White-Collar Automation"
    keywords: ["AI replacing office jobs", "white collar automation", "AI job loss"]
  # ... (10 topics total)
```

### File: `_data/writing-config.yml`

Shared configuration consumed by both generation scripts:

```yaml
archetypes:
  - id: contrarian
    name: "Contrarian Opinion"
    instruction: "Attack a common belief with a concrete counter-example"
  - id: framework
    name: "Framework / How-To"
    instruction: "Provide operational guidance with actionable steps"
  - id: breakdown
    name: "Operational Breakdown"
    instruction: "Analyze a real or fictional operational failure"
  - id: prediction
    name: "Prediction / Future Risk"
    instruction: "Predict organizational or workforce shifts"

content_mix:
  - id: confrontation
    name: "High confrontation"
    percentage: 20
  - id: practical
    name: "Practical insight"
    percentage: 40
  - id: predictive
    name: "Predictive"
    percentage: 20
  - id: humor
    name: "Humor / light"
    percentage: 20

signature_beliefs:
  - "Visibility is not action."
  - "AI exposes weak management."
  - "Busy work is disappearing."
  - "Dashboards delay accountability."
  - "Reporting is not intelligence."
  - "Automation scales weak processes."
  - "AI increases signal speed faster than organizations can react."

signature_metaphors:
  - "radar systems"
  - "pressure leaks"
  - "digital battlefields"
  - "mission control"
  - "tripwires"
  - "chain reactions"
  - "fault lines"
  - "black boxes"
  - "traffic jams"
  - "wildfire spread"

forbidden_phrases:
  - "leverage"
  - "unlock"
  - "digital transformation"
  - "revolutionary"
  - "synergize"
  - "game changer"
  - "AI-powered solution"

writing_techniques:
  - "Contrast"
  - "Metaphors & Analogies"
  - "Imagery"
  - "Strong verbs"
  - "Repetition"
  - "Foreshadowing"
  - "Pattern interrupts"
  - "Narrative hooks"
  - "Open loops"
  - "Tension escalation"
  - "Short punch sentences"
  - "Counterintuitive claims"
  - "Story framing"
  - "Forced choice questions"

newsletter_cta: "Weekly writing on AI, risk, and decisions. How to use AI in operations and risk — and how AI is reshaping the skills that matter at work."

internal_link_targets:
  tools:
    - url: "/ai-job-risk-analyzer/"
      name: "AI Job Risk Analyzer"
    - url: "/future-proof-skills-assessment/"
      name: "Future-Proof Skills Assessment"
  positions:
    - url: "/positions/ai-decision-operations/"
      name: "AI & Decision Operations"
    - url: "/positions/risk-intelligence/"
      name: "Risk Intelligence"
    - url: "/positions/ai-job-risk/"
      name: "AI Job Risk"
```

---

## Component 2: Generation Prompt Rewrite

### Architecture

The prompt is split into composable sections assembled at runtime:

```
┌─────────────────────────────────────────┐
│ SYSTEM CONTEXT                          │
│ (voice, audience, beliefs, metaphors)   │
├─────────────────────────────────────────┤
│ CONTENT PARAMETERS                      │
│ (position, topic, archetype, mix type)  │
├─────────────────────────────────────────┤
│ STRUCTURE RULES                         │
│ (article structure, answer block, SEO)  │
├─────────────────────────────────────────┤
│ STYLE RULES                             │
│ (conversational, imperfection, format)  │
├─────────────────────────────────────────┤
│ QUALITY ENFORCEMENT                     │
│ (checklist, forbidden, duplication)     │
├─────────────────────────────────────────┤
│ OUTPUT FORMAT                           │
│ (JSON schema with extended fields)      │
└─────────────────────────────────────────┘
```

### File: `functions/posts/prompt-builder.js`

New module that builds the full prompt from parameters:

```javascript
/**
 * Builds the complete generation prompt from parameters and config.
 *
 * @param {Object} params
 * @param {Object} params.position - Position object {tag, position, thesis}
 * @param {Object} params.topic - Layer 2 topic {slug, name, keywords}
 * @param {string} params.archetype - Archetype instruction
 * @param {string} params.contentMix - Content mix type
 * @param {string[]} params.techniques - Selected writing techniques (2-4)
 * @param {string} params.tone - Tone instruction
 * @param {string[]} params.existingTitles - Recent titles for dedup
 * @param {string[]} params.existingTopics - Topics already covered
 * @param {string[]} params.existingKeywords - Keywords already targeted
 * @param {Object} params.config - Writing config (beliefs, metaphors, etc.)
 * @param {string[]} params.internalLinks - Available internal link URLs
 * @returns {string} Complete prompt string
 */
function buildPrompt(params) { ... }

module.exports = { buildPrompt };
```

### Updated `functions/posts/generate.js`

```javascript
const { buildPrompt } = require("./prompt-builder");

// Accepts extended parameters from admin:
// positionTag, topic, archetype, contentMix, techniques[], tone,
// existingTitles, existingTopics, existingKeywords

// Returns extended JSON:
{
  title, subtitle, share_description, meta_title, excerpt,
  tags: [positionTag],
  topic: "ai-theater",
  archetype: "contrarian",
  keywords: ["AI transformation failure", "fake AI adoption"],
  body: "...",
  external_reference: { title, url, source },
  editorial_checklist: { items: [{name, passed}...], score: "15/17" }
}
```

### Updated `scripts/generate_post.py`

Same prompt structure, reads from `_data/writing-config.yml` and `_data/topics.yml` at runtime. Outputs extended front matter.

---

## Component 3: Extended Post Front Matter

### New fields added to generated posts:

```yaml
---
layout: post
title: "Why Most AI Transformations Are Expensive Theater"
subtitle: "..."
share-description: "..."
tags:
  - ai-decision-operations
topic: ai-theater
archetype: contrarian
keywords:
  - AI transformation failure
  - fake AI adoption
  - AI theater
author: Hasan J.
---
```

### Impact on existing posts:
- Existing posts won't have `topic`, `archetype`, or `keywords` fields
- Templates must handle missing fields gracefully (use `{% if page.topic %}`)
- Backfilling existing posts is a separate content task (not blocking)

---

## Component 4: Admin Panel UI Changes

### File: `newsletter/admin/index.html`

Add to the AI generate container (after position cards):

```html
<div class="nla-ai-options-extended">
  <div class="nla-form-group">
    <label>Topic</label>
    <select id="ai-topic"><!-- populated by JS based on position --></select>
  </div>
  <div class="nla-form-group">
    <label>Archetype</label>
    <select id="ai-archetype">
      <option value="">Random</option>
      <option value="contrarian">Contrarian Opinion</option>
      <option value="framework">Framework / How-To</option>
      <option value="breakdown">Operational Breakdown</option>
      <option value="prediction">Prediction / Future Risk</option>
    </select>
  </div>
  <div class="nla-form-group">
    <label>Content Mix</label>
    <select id="ai-content-mix">
      <option value="">Random</option>
      <option value="confrontation">High confrontation</option>
      <option value="practical">Practical insight</option>
      <option value="predictive">Predictive</option>
      <option value="humor">Humor / light</option>
    </select>
  </div>
  <div class="nla-form-group">
    <label>Writing Techniques (2-4)</label>
    <div id="ai-techniques-checkboxes"><!-- 14 checkboxes --></div>
  </div>
</div>
```

### File: `assets/js/admin/new-post.js`

After generation, display:
- Word count
- Editorial checklist results (17 items, pass/fail)
- External reference used
- Topic and archetype assigned

### File: `assets/js/admin/dashboard.js`

New section: "Topic Coverage" showing a grid of 30 topics grouped by position with post counts. Topics with 0 posts highlighted in red.

---

## Component 5: Structured Data (JSON-LD)

### File: `_includes/article-schema.html`

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "{{ page.title | xml_escape }}",
  "author": {
    "@type": "Person",
    "name": "Hasan Jaffal",
    "url": "https://hasanjaffal.com/aboutme/"
  },
  "datePublished": "{{ page.date | date_to_xmlschema }}",
  {% if page.last-updated %}"dateModified": "{{ page.last-updated }}",{% endif %}
  "description": "{{ page.share-description | default: page.excerpt | strip_html | xml_escape | truncate: 160 }}",
  {% if page.thumbnail-img %}"image": "https://hasanjaffal.com{{ page.thumbnail-img }}",{% endif %}
  {% if page.keywords %}"keywords": "{{ page.keywords | join: ', ' }}",{% endif %}
  "publisher": {
    "@type": "Organization",
    "name": "Hasan Jaffal",
    "url": "https://hasanjaffal.com"
  },
  "mainEntityOfPage": "https://hasanjaffal.com{{ page.url }}"
}
</script>
```

### File: `_includes/faq-schema.html`

Conditionally included when title starts with a question word:

```html
{% assign question_words = "Will,Can,Should,Is,Are,Do,Does,How,Why,What,When,Where,Who" | split: "," %}
{% assign first_word = page.title | split: " " | first %}
{% if question_words contains first_word %}
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [{
    "@type": "Question",
    "name": "{{ page.title | xml_escape }}",
    "acceptedAnswer": {
      "@type": "Answer",
      "text": "{{ page.excerpt | strip_html | xml_escape }}"
    }
  }]
}
</script>
{% endif %}
```

### Integration in `_layouts/post.html`:

Add before `</head>` or in the body:
```
{% include article-schema.html %}
{% include faq-schema.html %}
```

---

## Component 6: robots.txt Update

### File: `robots.txt`

```
User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: *
Allow: /ai-job-risk-analyzer/
Allow: /future-proof-skills-assessment/
Disallow: /tools/ai-job-risk-analyzer
Disallow: /tools/ai-job-risk-report/
Disallow: /tools/future-proof-skills-assessment
Disallow: /newsletter/admin/
Disallow: /assets/pdf/

Sitemap: {{ site.url }}/sitemap.xml
```

---

## Component 7: Position Pages — Topic Clusters

### File: `_layouts/position.html`

Add after the argument section:

```html
{% if site.data.topics[page.position_tag] %}
<section class="pos-topics">
  <h2>Topics</h2>
  <div class="pos-topics-grid">
    {% for topic in site.data.topics[page.position_tag] %}
    {% assign topic_posts = site.posts | where: "topic", topic.slug %}
    <div class="pos-topic-card">
      <h3>{{ topic.name }}</h3>
      <span class="pos-topic-count">{{ topic_posts.size }} posts</span>
    </div>
    {% endfor %}
  </div>
</section>
{% endif %}
```

---

## Component 8: Writing Page — Topic Filter

### File: `writing.html`

Add a secondary filter row below position filters:

```html
<div class="wr-topic-filter-bar" id="wr-topic-filters" hidden>
  <button class="wr-filter-btn active" data-topic="all">All Topics</button>
  <!-- Populated by JS based on selected position -->
</div>
```

JS logic: when a position filter is active, show topic sub-filters for that position's 10 topics. Filter cards by `data-topic` attribute.

Cards get an additional `data-topic` attribute:
```html
<a class="wr-card" data-tags="ai-decision-operations" data-topic="ai-theater">
```

---

## Component 9: Soft Validation Warnings

### File: `assets/js/admin/new-post.js`

Before publish, run client-side checks:

```javascript
function validateBeforePublish(body) {
  const warnings = [];
  const wordCount = body.split(/\s+/).length;

  // Answer block check (40-60 words in first 100 words)
  // Internal links check (count markdown links)
  const linkCount = (body.match(/\[.*?\]\(\/.*?\)/g) || []).length;
  if (linkCount < 2) warnings.push('Fewer than 2 internal links');

  // External reference check
  const extLinks = (body.match(/\[.*?\]\(https?:\/\/(?!hasanjaffal).*?\)/g) || []).length;
  if (extLinks < 1) warnings.push('No external reference found');

  // Question check (forced-position question)
  const hasQuestion = body.includes('?');
  if (!hasQuestion) warnings.push('No forced-position question detected');

  // Comparison table check
  const hasTable = body.includes('|') && body.includes('---');
  if (!hasTable) warnings.push('No comparison table found');

  return warnings;
}
```

Display as a yellow warning box above the publish button. Non-blocking.

---

## Component 10: Reference Pages

### Layout: `_layouts/reference.html`

Extends `base` layout with:
- Article Schema JSON-LD
- Table of contents (auto-generated from h2/h3)
- Internal links section at bottom
- Related posts section

### Pages (7 total):

```
/references/ai-job-risk-index.html
/references/dashboard-failure-checklist.html
/references/reporting-vs-intelligence.html
/references/ai-operations-failure-patterns.html
/references/decision-ownership-model.html
/references/operational-escalation-framework.html
/references/ai-adoption-failure-checklist.html
```

Each page is manually authored content (not AI-generated) with:
- Concept definitions
- Tables and frameworks
- Internal links to related posts
- Structured data

---

## Component 11: Editorial Checklist in Generation Response

### How it works:

The Gemini prompt includes a final instruction:

```
After generating the article, evaluate it against this 17-item checklist.
Return the results as a JSON array in the "editorial_checklist" field.
```

The response JSON includes:
```json
{
  "editorial_checklist": {
    "score": "15/17",
    "items": [
      {"name": "Fits one position", "passed": true},
      {"name": "Fits one topic", "passed": true},
      {"name": "Attacks a belief", "passed": true},
      ...
    ]
  }
}
```

The admin panel renders this as a visual checklist card after generation.

---

## Deployment Order

1. **Data files** (`_data/topics.yml`, `_data/writing-config.yml`) — no deployment needed, just commit
2. **Prompt rewrite** (`functions/posts/prompt-builder.js`, update `generate.js`) — deploy Cloud Function
3. **Python script update** (`scripts/generate_post.py`) — commit, GitHub Actions picks it up
4. **Admin UI** (HTML + JS changes) — commit, Jekyll rebuilds
5. **Structured data** (`_includes/article-schema.html`, `_includes/faq-schema.html`, update `_layouts/post.html`) — commit
6. **robots.txt** — commit
7. **Position pages** (topic clusters) — commit
8. **Writing page** (topic filter) — commit
9. **Reference pages** (7 pages) — content authoring + commit
10. **Soft validation** (JS) — commit

Items 1-8 can be done in one batch. Item 9 is a content project. Item 10 is a small JS addition.

---

## Risk Considerations

- **Prompt length**: The full prompt will be ~2000-3000 tokens. Gemini 2.5 Flash handles this fine within the 120s timeout.
- **External references**: AI-generated URLs may be hallucinated. The admin should verify before publishing. Consider adding a "(verify link)" note in the UI.
- **Backward compatibility**: Existing posts without `topic`/`archetype`/`keywords` fields will still render correctly — templates use `{% if %}` guards.
- **Content mix tracking**: Tracking the 20/40/20/20 mix requires knowing the content_mix of each post. This is stored in front matter going forward; historical posts won't have it.
