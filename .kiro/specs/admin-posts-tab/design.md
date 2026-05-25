# Technical Design — Admin Posts Tab

## Overview

This design adds a Posts management section to the existing admin dashboard at `newsletter/admin/index.html`. The implementation extends the current single-page admin architecture (sidebar navigation + panel switching) with new panels for post listing, creation, and AI generation. Post data is embedded at build time via Jekyll Liquid templating. Post creation and AI generation use new Firebase Cloud Functions.

## Architecture

### System Context

```
┌─────────────────────────────────────────────────────────────┐
│                    Admin Dashboard (SPA)                      │
│  newsletter/admin/index.html                                 │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐ │
│  │ Dashboard │  │  Posts   │  │ New Post │  │ Newsletter  │ │
│  │  Panel    │  │  Panel   │  │  Panel   │  │  Panels    │ │
│  └──────────┘  └──────────┘  └──────────┘  └────────────┘ │
└─────────────────────────────────────────────────────────────┘
         │                │              │
         │                │              │
    ┌────▼────┐    ┌──────▼──────┐  ┌───▼────────────────┐
    │ Jekyll  │    │ Jekyll      │  │ Firebase Cloud      │
    │ Build   │    │ site.posts  │  │ Functions           │
    │ (Liquid)│    │ (JSON embed)│  │                     │
    └─────────┘    └─────────────┘  │ • createPost        │
                                    │ • generatePost (AI) │
                                    └─────────────────────┘
                                             │
                                    ┌────────▼────────┐
                                    │ GitHub API      │
                                    │ (commit to repo)│
                                    └─────────────────┘
                                             │
                                    ┌────────▼────────┐
                                    │ Gemini API      │
                                    │ (AI generation) │
                                    └─────────────────┘
```

### Data Flow

1. **Post data loading**: At Jekyll build time, all posts from `site.posts` are serialized into a JSON array embedded in a `<script>` tag. The JavaScript reads this array on page load — no API call needed for listing.

2. **Post creation**: The admin fills the form → frontend calls `createPost` Cloud Function → function commits a new markdown file to the GitHub repo via GitHub API → returns success → frontend adds post to local array and re-renders table.

3. **AI generation**: Admin selects position → frontend calls `generatePost` Cloud Function → function builds prompt (mirroring `generate_post.py` logic), calls Gemini API → returns generated content → frontend populates the creation form.

## Component Design

### Navigation Restructure

The sidebar `<nav class="nla-sidebar-nav">` is restructured into three labeled sections:

```html
<nav class="nla-sidebar-nav">
  <div class="nla-nav-section-label">Dashboard</div>
  <button class="nla-nav-item active" data-panel="dashboard">📊 Dashboard</button>

  <div class="nla-nav-section-label">Posts</div>
  <button class="nla-nav-item" data-panel="posts">📝 Posts</button>
  <button class="nla-nav-item" data-panel="new-post">✍️ New Post</button>

  <div class="nla-nav-section-label">Newsletter</div>
  <button class="nla-nav-item" data-panel="compose">✉️ Compose</button>
  <button class="nla-nav-item" data-panel="subscribers">👥 Subscribers</button>
  <button class="nla-nav-item" data-panel="analytics">📈 Analytics</button>
  <button class="nla-nav-item" data-panel="import">📥 Import</button>
</nav>
```

The existing `panel-overview` is renamed to `panel-dashboard` and enhanced with post statistics.

### Panel Structure

| Panel ID | Purpose | Data Source |
|----------|---------|-------------|
| `panel-dashboard` | Combined overview (newsletter stats + post stats) | API (newsletter) + embedded JSON (posts) |
| `panel-posts` | Post list with search, filters, sort | Embedded JSON |
| `panel-new-post` | Post creation form + AI generation | User input → Cloud Function |
| `panel-compose` | Newsletter compose (existing) | API |
| `panel-subscribers` | Subscriber management (existing) | API |
| `panel-analytics` | Newsletter analytics (existing) | API |
| `panel-import` | Subscriber import (existing) | API |

### Post Data Schema (Embedded JSON)

At build time, Jekyll Liquid generates:

```html
<script id="posts-data" type="application/json">
[
  {% for post in site.posts %}
  {
    "title": {{ post.title | jsonify }},
    "slug": {{ post.slug | jsonify }},
    "url": {{ post.url | jsonify }},
    "date": {{ post.date | date: "%Y-%m-%d" | jsonify }},
    "lastUpdated": {{ post.last-updated | jsonify }},
    "author": {{ post.author | default: "—" | jsonify }},
    "tags": {{ post.tags | jsonify }},
    "status": {% if post.archived %}"archived"{% elsif post.published == false or post.date > site.time %}"draft"{% else %}"published"{% endif %},
    "shareTitle": {{ post.share-title | jsonify }},
    "shareDescription": {{ post.share-description | jsonify }},
    "canonicalUrl": {{ post.canonical-url | jsonify }},
    "readingTime": {{ post.reading-time | jsonify }},
    "thumbnailImg": {{ post.thumbnail-img | jsonify }},
    "shareImg": {{ post.share-img | jsonify }},
    "excerpt": {{ post.excerpt | strip_html | truncate: 200 | jsonify }},
    "wordCount": {{ post.content | number_of_words }}
  }{% unless forloop.last %},{% endunless %}
  {% endfor %}
]
</script>
```

### Posts Panel (panel-posts)

```
┌─────────────────────────────────────────────────────────┐
│ Panel Header: "Posts" + count + [New Post] button       │
├─────────────────────────────────────────────────────────┤
│ Search: [Search by title, slug, position...]            │
│ Filters: [Status ▼] [Position ▼]                       │
├─────────────────────────────────────────────────────────┤
│ Grid.js Table                                           │
│ ┌─────────┬──────┬────────┬──────┬────────┬─────────┐ │
│ │ Title   │ Slug │ Status │ Date │Position│ Actions │ │
│ ├─────────┼──────┼────────┼──────┼────────┼─────────┤ │
│ │ ...     │ ...  │ Badge  │ ...  │ Badge  │View Edit│ │
│ └─────────┴──────┴────────┴──────┴────────┴─────────┘ │
│ Pagination: [1] [2] [3] ...                             │
└─────────────────────────────────────────────────────────┘
```

**Grid.js configuration:**
- Columns: Title, Slug, Status, Published Date, Updated Date, Author, Position, Views, Actions
- Search: Custom external search (debounced 300ms) filtering on title, slug, tags
- Sort: Enabled on date, title, updated date columns
- Pagination: 20 per page
- Custom formatters for badges, actions, copy URL

### Dashboard Panel (panel-dashboard)

```
┌─────────────────────────────────────────────────────────┐
│ Panel Header: "Dashboard"                                │
├─────────────────────────────────────────────────────────┤
│ Newsletter Stats (existing):                             │
│ [Active: N] [Unsubscribed: N] [Bounced: N]             │
├─────────────────────────────────────────────────────────┤
│ Post Statistics:                                         │
│ [Total: N] [Published: N] [Draft: N]                   │
│ [This Week: N] [This Month: N]                         │
│                                                          │
│ Posts per Position:                                      │
│ [AI Operations: N] [Decision Authority: N]             │
│ [Risk Intelligence: N] [AI and Work: N]                │
│                                                          │
│ Views: [Total: N or "Not tracked"]                     │
│ Most Viewed: [Title (N views) or "Not tracked"]        │
│ Latest Post: [Title — Date]                            │
├─────────────────────────────────────────────────────────┤
│ Recent Editions (existing Grid.js table)                │
└─────────────────────────────────────────────────────────┘
```

### New Post Panel (panel-new-post)

Two modes accessible via a mode selector at the top:

**Mode 1: Start from Scratch**
```
┌─────────────────────────────────────────────────────────┐
│ [Start from Scratch] [Generate with AI]                  │
├─────────────────────────────────────────────────────────┤
│ Title: [________________________] (max 150)              │
│ Slug:  [auto-generated__________] (editable, max 80)    │
│ Author: [Hasan J._____________]                         │
│ Position: [▼ Select position]                           │
│ Status: [▼ Draft / Published]                           │
│ Excerpt: [________________________] (max 300)           │
│ Meta Title: [___________________] (max 70)              │
│ Meta Description: [_____________] (max 160)             │
│ Featured Image: [_______________]                       │
│                                                          │
│ Body (Rich Editor):                                      │
│ [B] [I] [H] [UL] [OL] [Link] [Quote] [Code] [HR]     │
│ ┌─────────────────────────────────────────────────────┐ │
│ │                                                     │ │
│ │              Content editor area                    │ │
│ │                                                     │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                          │
│ [Cancel] [Save Post]                                    │
└─────────────────────────────────────────────────────────┘
```

**Mode 2: Generate with AI**
```
┌─────────────────────────────────────────────────────────┐
│ [Start from Scratch] [Generate with AI]                  │
├─────────────────────────────────────────────────────────┤
│ Select a content direction:                              │
│                                                          │
│ ○ AI Operations                                         │
│   "AI does not repair unclear ownership..."             │
│                                                          │
│ ○ Decision Authority                                    │
│   "A risk signal has no value if nobody can act..."     │
│                                                          │
│ ○ Risk Intelligence                                     │
│   "Reporting explains what happened..."                 │
│                                                          │
│ ○ AI and Work                                           │
│   "AI exposes people who only operate tools..."         │
│                                                          │
│ [Generate Post]                                          │
└─────────────────────────────────────────────────────────┘
```

After generation → populates the "Start from Scratch" form with editable content.

## Cloud Functions Design

### `createPost` Function

**Endpoint:** New Cloud Function deployed at `europe-west1`
**Auth:** Firebase Auth token (same pattern as existing admin functions)
**Method:** POST

**Request body:**
```json
{
  "title": "string",
  "slug": "string",
  "author": "string",
  "tags": ["ai-operations"],
  "status": "draft|published",
  "excerpt": "string",
  "shareTitle": "string",
  "shareDescription": "string",
  "featuredImage": "string",
  "body": "string (markdown)"
}
```

**Logic:**
1. Validate auth token (admin only)
2. Validate required fields (title, body)
3. Validate tags are from the 4 canonical positions only
4. Generate filename: `YYYY-MM-DD-slug.md`
5. Build front matter YAML + body markdown
6. Commit file to GitHub repo via GitHub API (using a GitHub PAT stored as a secret)
7. Return success with filename and URL

**Response:**
```json
{
  "result": "success",
  "filename": "2026-05-25-post-slug.md",
  "url": "/2026-05-25-post-slug/"
}
```

### `generatePost` Function (AI)

**Endpoint:** New Cloud Function deployed at `europe-west1`
**Auth:** Firebase Auth token
**Method:** POST
**Secrets:** `GEMINI_API_KEY`
**Timeout:** 120s
**Memory:** 512MiB

**Request body:**
```json
{
  "positionTag": "ai-operations"
}
```

**Logic:**
1. Validate auth token
2. Validate `positionTag` is one of the 4 canonical tags
3. Look up position data (tag, position title, thesis, angles) from hardcoded POSITIONS array (mirroring `generate_post.py`)
4. Randomly select: angle, article form, tone (from the same arrays as `generate_post.py`)
5. Fetch recent post titles from Firestore or from a pre-built list (to avoid repetition)
6. Build the exact same prompt structure as `generate_post.py`:
   - POSITION, THESIS, ANGLE, FORM, TONE
   - TAG (forced to selected position)
   - Recent titles to avoid
   - AUDIENCE section
   - CONTENT RULES (explore angle specifically, concrete example, uncomfortable trade-off, strong vs average teams, forced-position question)
   - WRITING RULES (700-1000 words, short paragraphs, no hype, no buzzwords, no labels, simple English, SEO title)
   - DIVERSITY INSTRUCTIONS (vary opening based on tone, vary sentence length)
7. Call Gemini `gemini-2.5-flash` model
8. Parse JSON response
9. Force tags to `[positionTag]` only (regardless of model output)
10. Return structured content

**Response:**
```json
{
  "title": "string",
  "subtitle": "string",
  "shareDescription": "string",
  "tags": ["ai-operations"],
  "body": "string (markdown)"
}
```

### Prompt Template (mirrors `generate_post.py` exactly)

The Cloud Function uses the identical prompt structure:

```
Write one original blog post for Hasan Jaffal.

POSITION: {position}
THESIS: {thesis}
ANGLE: {randomly selected angle}
FORM: {randomly selected form}
TONE: {randomly selected tone}

TAG (use exactly this): {positionTag}

AVOID these recent titles — do NOT repeat similar ideas:
{recent titles list}

AUDIENCE:
Leaders and professionals in AI, data, analytics, operations, risk, security, loss prevention, and decision-making.

CONTENT RULES:
- The article must explore the ANGLE specifically...
[full content rules from generate_post.py]

WRITING RULES:
- 700 to 1000 words...
[full writing rules from generate_post.py]

DIVERSITY INSTRUCTIONS:
- If the tone is narrative, start with a scene or moment...
[full diversity instructions from generate_post.py]

Return ONLY valid JSON:
{
  "title": "",
  "subtitle": "",
  "share_description": "",
  "tags": ["{positionTag}"],
  "body": ""
}
```

The POSITIONS, ARTICLE_FORMS, and TONES arrays are hardcoded in the Cloud Function, identical to `generate_post.py`.

## Data Model

### Post Status Derivation

Status is derived at build time (not stored explicitly):
- `archived: true` in front matter → "archived"
- `published: false` or future date → "draft"
- Otherwise → "published"

### Position Tags (exhaustive list)

| Tag | Display Name | Thesis |
|-----|-------------|--------|
| `ai-operations` | AI Operations | AI does not repair unclear ownership... |
| `decision-authority` | Decision Authority | A risk signal has no value if nobody can act... |
| `risk-intelligence` | Risk Intelligence | Reporting explains what happened... |
| `ai-and-work` | AI and Work | AI exposes people who only operate tools... |

### View Counts

No view count tracking exists in the current system. The Posts Table will display "—" for all view count cells. A recommendation note will be shown in the Dashboard panel suggesting future analytics integration.

## File Changes

### Modified Files

| File | Change |
|------|--------|
| `newsletter/admin/index.html` | Restructure sidebar nav, add Dashboard/Posts/New Post panels, add post data embed, add JavaScript for posts functionality |
| `assets/css/newsletter-admin.css` | Add styles for nav section labels, post badges, post filters, post creation form, AI generation UI |
| `_data/firebase.yml` | Add `fn_create_post` and `fn_generate_post` URLs |
| `functions/index.js` | Export new `createPost` and `generatePost` functions |

### New Files

| File | Purpose |
|------|---------|
| `functions/posts/create.js` | `createPost` Cloud Function module |
| `functions/posts/generate.js` | `generatePost` Cloud Function module (AI) |

### Unchanged Files

All existing `_posts/*.md` files, public layouts, public CSS, and public routes remain untouched.

## CSS Additions

New classes added to `newsletter-admin.css`:

```css
/* Nav section labels */
.nla-nav-section-label { ... }

/* Post status badges */
.nla-badge-published { background: #ECFDF5; color: #059669; }
.nla-badge-draft { background: #FEF3C7; color: #D97706; }
.nla-badge-archived { background: #F1F5F9; color: #64748B; }

/* Position badges */
.nla-badge-position { background: rgba(147, 51, 234, 0.08); color: #9333EA; }

/* Post filters bar */
.nla-posts-toolbar { ... }

/* Post creation form */
.nla-post-form { ... }
.nla-post-form-grid { ... }

/* AI generation UI */
.nla-ai-directions { ... }
.nla-ai-direction-card { ... }
.nla-ai-direction-card.selected { ... }

/* Post stats grid (dashboard) */
.nla-post-stats { ... }
.nla-post-stats-position { ... }
```

## Security

- All Cloud Functions require Firebase Auth token validation (same as existing admin functions)
- Only the authorized admin email can access post creation/generation
- GitHub PAT is stored as a Firebase secret (`GITHUB_PAT`), never exposed to frontend
- Gemini API key is stored as a Firebase secret (`GEMINI_API_KEY`), never exposed to frontend
- Post data embedded in the admin page is not sensitive (it's all public content)
- The admin page has `noindex.html` in `head-extra` and `sitemap: false`

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Post JSON parse failure | Show Error_State with "Post data could not be loaded" |
| Empty posts array | Show Empty_Posts_State with CTA to create first post |
| createPost API failure | Show inline error, preserve form data |
| generatePost API failure | Show error with Retry + Start from Scratch options |
| generatePost timeout (60s) | Cancel request, show timeout message |
| Network offline | Show generic error state |

## Performance Considerations

- Post data is embedded at build time — no API call needed for listing (instant load)
- Grid.js handles pagination client-side (20 per page)
- Search and filter are client-side (no network round-trips)
- Rich text editor uses native `contenteditable` (no heavy library)
- AI generation is the only slow operation (up to 60s timeout)

## Dependencies

| Dependency | Already Loaded | Purpose |
|-----------|---------------|---------|
| Grid.js | ✅ Yes | Table rendering |
| Firebase App SDK | ✅ Yes | App initialization |
| Firebase Auth SDK | ✅ Yes | Authentication |
| `@google/generative-ai` | ✅ Yes (in functions) | Gemini API |
| GitHub API (Octokit) | ❌ New (functions only) | Commit files to repo |

Only one new dependency: `@octokit/rest` in `functions/package.json` for GitHub API access. This is backend-only and does not affect the frontend bundle.

## Components and Interfaces

### Frontend Components (HTML Panels + JavaScript)

| Component | Location | Interface |
|-----------|----------|-----------|
| Dashboard Panel | `#panel-dashboard` | Renders newsletter stats + post statistics from embedded JSON |
| Posts Panel | `#panel-posts` | Grid.js table with search, filters, sort, actions |
| New Post Panel | `#panel-new-post` | Form with mode toggle (scratch/AI), rich editor, validation |
| Post Search | `.nla-posts-search` input | Debounced input → filters Grid.js data |
| Post Filters | `.nla-posts-filters` selects | Status + Position dropdowns → filter Grid.js data |
| Post Status Badge | `nla-badge-{status}` | Renders colored badge for published/draft/archived |
| Position Badge | `nla-badge-position` | Renders purple badge for position tag |
| Post Actions | Grid.js cell formatter | View (new tab) + Edit (switch panel) buttons |
| AI Direction Selector | `.nla-ai-directions` | Radio cards for 4 positions with thesis text |
| Rich Text Editor | `.nla-editor` (contenteditable) | Toolbar + editable div, outputs HTML converted to markdown |

### Cloud Function Interfaces

**`createPost(req, res)`**
- Input: `{ title, slug, author, tags, status, excerpt, shareTitle, shareDescription, featuredImage, body }`
- Output: `{ result: "success", filename, url }` or `{ error: "message" }`
- Auth: Firebase ID token required
- Secrets: `GITHUB_PAT`

**`generatePost(req, res)`**
- Input: `{ positionTag }`
- Output: `{ title, subtitle, shareDescription, tags, body }` or `{ error: "message" }`
- Auth: Firebase ID token required
- Secrets: `GEMINI_API_KEY`
- Timeout: 120s

### Internal JavaScript Functions

| Function | Purpose |
|----------|---------|
| `loadPostsPanel()` | Parse embedded JSON, initialize Grid.js table |
| `loadDashboard()` | Load newsletter stats (API) + compute post stats from embedded JSON |
| `filterPosts()` | Apply search + filters to Grid.js data |
| `initPostForm(mode)` | Show creation form in scratch or AI mode |
| `generateAIPost(positionTag)` | Call generatePost Cloud Function, populate form |
| `savePost(formData)` | Validate form, call createPost Cloud Function |
| `slugify(title)` | Convert title to URL-safe slug |
| `computePostStats(posts)` | Calculate totals, per-position counts, latest post |

## Data Models

### Post Object (Embedded JSON)

```typescript
interface PostData {
  title: string;
  slug: string;
  url: string;              // Jekyll permalink, e.g. "/2026-05-25-post-slug/"
  date: string;             // "YYYY-MM-DD"
  lastUpdated: string|null; // "YYYY-MM-DD" or null
  author: string;           // e.g. "Hasan J." or "—"
  tags: string[];           // e.g. ["ai-operations"] — limited to 4 canonical tags
  status: string;           // "published" | "draft" | "archived"
  shareTitle: string|null;
  shareDescription: string|null;
  canonicalUrl: string|null;
  readingTime: string|null; // e.g. "5 min" or null (calculated from wordCount if missing)
  thumbnailImg: string|null;
  shareImg: string|null;
  excerpt: string|null;     // First 200 chars of content, stripped of HTML
  wordCount: number;        // Used to calculate reading time if not in front matter
}
```

### Post Statistics (Computed Client-Side)

```typescript
interface PostStats {
  total: number;
  published: number;
  draft: number;
  archived: number;
  thisWeek: number;
  thisMonth: number;
  perPosition: {
    "ai-operations": number;
    "decision-authority": number;
    "risk-intelligence": number;
    "ai-and-work": number;
  };
  latestPost: { title: string; date: string } | null;
  totalViews: string;       // "Not tracked" (no analytics source exists)
  mostViewed: string;       // "Not tracked"
}
```

### Create Post Request

```typescript
interface CreatePostRequest {
  title: string;            // Required, max 150 chars
  slug: string;             // Required, max 80 chars, auto-generated from title
  author: string;           // Default "Hasan J."
  tags: string[];           // 1-2 items from canonical position tags
  status: "draft" | "published";
  excerpt?: string;         // Max 300 chars
  shareTitle?: string;      // Max 70 chars
  shareDescription?: string; // Max 160 chars
  featuredImage?: string;   // Path to image
  body: string;             // Required, markdown content
}
```

### Generate Post Request/Response

```typescript
interface GeneratePostRequest {
  positionTag: "ai-operations" | "decision-authority" | "risk-intelligence" | "ai-and-work";
}

interface GeneratePostResponse {
  title: string;
  subtitle: string;
  shareDescription: string;
  tags: string[];           // Always [positionTag] — forced server-side
  body: string;             // Markdown content, 700-1000 words
}
```

### Position Data (Hardcoded in Cloud Function)

```typescript
interface Position {
  tag: string;
  position: string;         // Short title
  thesis: string;           // One-sentence thesis
  angles: string[];         // 10 specific content angles
}
```

## Correctness Properties

### Property 1: Tag Integrity
Tags in the system are always one of the 4 canonical position tags (`ai-operations`, `decision-authority`, `risk-intelligence`, `ai-and-work`). The `createPost` function validates this server-side. The `generatePost` function forces `tags = [positionTag]` regardless of AI output.

**Validates: Requirements 7.4, 8.11, 10.2**

### Property 2: Status Derivation Consistency
Post status is derived identically in the embedded JSON (Liquid) and in any client-side re-computation: `archived: true` → archived, `published: false` or future date → draft, else → published.

**Validates: Requirements 4.5, 3.5**

### Property 3: Non-Destructive Reads
The Posts Panel never modifies existing `_posts/` files. All operations on the list are read-only. Only the `createPost` function writes new files.

**Validates: Requirements 16.3, 16.4**

### Property 4: URL Preservation
Public post URLs follow the Jekyll permalink `/:year-:month-:day-:title/`. The admin derives URLs using this same pattern. No existing URLs are modified.

**Validates: Requirements 16.2, 4.6**

### Property 5: Auth Enforcement
Both new Cloud Functions validate Firebase Auth tokens before processing. Unauthorized requests receive 401.

**Validates: Requirements 16.1, 16.5**

### Property 6: Prompt Fidelity
The `generatePost` Cloud Function uses the exact same POSITIONS, ARTICLE_FORMS, TONES arrays and prompt template as `scripts/generate_post.py`. Any update to the Python script should be mirrored in the Cloud Function.

**Validates: Requirements 8.9, 8.10, 8.11**

## Testing Strategy

### Manual Testing Checklist

1. **Navigation**: Verify all 7 nav items switch panels correctly, active state updates, existing panels still work
2. **Dashboard stats**: Verify post counts match actual `_posts/` directory, per-position counts are accurate
3. **Posts table**: Verify all posts appear, metadata is correct, pagination works at 20/page
4. **Search**: Type partial title → verify filtering, clear → verify reset
5. **Filters**: Select each status/position → verify correct filtering, combine filters → verify AND logic
6. **Sort**: Click column headers → verify ascending/descending toggle, default is newest first
7. **View action**: Click View → verify public URL opens in new tab
8. **Edit action**: Click Edit → verify placeholder message appears
9. **New Post (scratch)**: Fill form, submit → verify Cloud Function creates file in repo
10. **New Post (AI)**: Select position, generate → verify form populates with content
11. **Validation**: Submit empty form → verify inline errors appear
12. **Empty state**: Filter to zero results → verify empty state message
13. **Responsive**: Resize to mobile → verify sidebar collapses, table scrolls, filters stack
14. **Existing functionality**: Compose, Subscribers, Analytics, Import all still work

### Build Verification

1. Run `bundle exec jekyll build` — verify no Liquid errors
2. Verify embedded JSON is valid (parse with `JSON.parse`)
3. Verify no inline styles in new HTML
4. Verify all new CSS classes use `nla-` prefix

## Migration & Deployment

1. Deploy Cloud Functions first (`firebase deploy --only functions`)
2. Add `fn_create_post` and `fn_generate_post` URLs to `_data/firebase.yml`
3. Add `GITHUB_PAT` secret to Firebase (`firebase functions:secrets:set GITHUB_PAT`)
4. Update `newsletter/admin/index.html` with new panels and JavaScript
5. Update `assets/css/newsletter-admin.css` with new styles
6. Run Jekyll build — post data will be embedded automatically
7. Deploy site

No data migration needed. Existing posts are read-only from the admin. New posts created via admin go through the same `_posts/` directory and follow the same front matter schema.
