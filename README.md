# hasanjaffal.com

Personal authority website for Hasan Jaffal — writing on AI, risk intelligence, operational decision-making, and future-proof skills. Built with Jekyll, Firebase Cloud Functions, and hosted on GitHub Pages.

**Live:** [hasanjaffal.com](https://www.hasanjaffal.com)

---

## What this site contains

### Main website
- **Homepage** — Authority positioning with book promotion, newsletter embed, and featured posts
- **Writing** — Blog posts organized by 4 canonical positions (AI Operations, Decision Authority, Risk Intelligence, AI and Work)
- **Tools** — Interactive assessments (AI Job Risk Analyzer, Future-Proof Skills Assessment)
- **Books** — Publication page for "The Second Mind"
- **Newsletter** — The Second Mind newsletter with admin panel
- **Templates** — SEO-focused downloadable resources
- **About** — Professional background
- **Contact** — Contact form with office hours booking

### Position Pages (`/positions/`)
Four canonical content pillars, each with a dedicated landing page:
- **AI Operations** — AI exposes weak operations
- **Decision Authority** — Signals need authority
- **Risk Intelligence** — Reporting is not intelligence
- **AI and Work** — AI is changing the skill floor

### Tools (`/tools/`)
- **AI Job Risk Analyzer** — Personalized AI risk assessment with Gemini-powered analysis, interactive dashboard, and 30-day action plan
- **Future-Proof Skills Assessment** — 5-minute skills evaluation with personalized recommendations

### Newsletter Admin (`/newsletter/admin/`)
Full-featured admin panel for managing the newsletter:
- **Dashboard** — Health metrics for newsletter and posts (subscribers, open/click rates, position breakdown, recent activity, editions analytics)
- **Posts** — Grid.js table with search, position filtering, detail panel, edit, and create
- **New Post** — Form with EasyMDE markdown editor, AI-powered post generation (Gemini), character counters, and position tagging
- **Compose** — Newsletter composition with post selection, rich text intro, tool invitations, and multi-segment sending
- **Subscribers** — Subscriber management with Grid.js table, add/edit/deactivate/delete, segment filtering, and CSV export
- **Analytics** — Edition performance tracking with open/click rates and clicked links
- **Import** — Bulk subscriber import from JSON

### Sproochentest Study Guide (`/sproochentest/`)
Sub-site for Luxembourgish language test preparation:
- Speaking topics, image description framework, listening exercises with interactive quizzes
- Own header, footer, sidebar navigation, and newsletter

---

## Tech stack

| Component | Tool |
|-----------|------|
| Static site generator | Jekyll |
| Theme base | [Beautiful Jekyll](https://beautifuljekyll.com) |
| Hosting | GitHub Pages |
| Backend | Firebase Cloud Functions (v2, Node.js 20) |
| Database | Firestore |
| AI | Google Gemini 2.5 Flash |
| Email | Resend |
| Auth | Firebase Authentication (Google sign-in) |
| Source control | GitHub API (Octokit) for post CRUD |
| Newsletter table/grid | Grid.js |
| Markdown editor | EasyMDE |
| Testing | Vitest + fast-check (property-based) |
| Fonts | Inter, JetBrains Mono |
| Analytics | Google Tag Manager |
| CSS | Custom CSS with variables (no frameworks) |

---

## Cloud Functions

All functions deployed to `europe-west1`:

| Function | Purpose |
|----------|---------|
| `createPost` | Creates a Jekyll post by committing to GitHub |
| `updatePost` | Updates an existing post via GitHub API |
| `getPost` | Fetches raw markdown content from GitHub |
| `generatePost` | AI post generation using Gemini |
| `sendNewsletter` | Sends newsletter editions via Resend |
| `getAnalytics` | Newsletter analytics (overview, editions, edition detail) |
| `manageSubscribers` | CRUD operations for subscribers |
| `importSubscribers` | Bulk subscriber import |
| `trackOpen` / `trackClick` | Email engagement tracking |
| `handleBounce` | Bounce/complaint webhook handler |
| `subscribeNewsletter` | Public subscription endpoint |
| `newsletterPreferences` | Unsubscribe/preferences management |
| `sendFutureProofSkillsGuide` | Skills assessment result email |
| `analyzeJobRisk` | AI job risk analysis with Gemini |
| `getJobRiskReport` | Retrieve stored risk report |
| `sendContactMessage` | Contact form handler |

---

## Project structure

```
├── _config.yml                 # Jekyll configuration
├── _data/
│   ├── firebase.yml            # Cloud Function URLs + Firebase config
│   └── positions.yml           # Position data for landing pages
├── _includes/                  # Reusable components
├── _layouts/                   # Page layouts (post, page, position, template, sproochentest)
├── _posts/                     # Blog posts (markdown)
├── assets/
│   ├── css/                    # Page-specific CSS (global.css + per-page files)
│   ├── js/admin/               # Admin panel ES modules
│   │   ├── main.js             # Entry point (auth, nav, utilities)
│   │   ├── dashboard.js        # Dashboard metrics and activity feed
│   │   ├── posts.js            # Posts table and filtering
│   │   ├── new-post.js         # Post creation/editing + AI generation
│   │   ├── compose.js          # Newsletter composition
│   │   ├── subscribers.js      # Subscriber management
│   │   ├── analytics.js        # Edition analytics
│   │   └── import.js           # Bulk import
│   ├── img/                    # Images
│   └── pdf/                    # Downloadable resources
├── functions/                  # Firebase Cloud Functions
│   ├── index.js                # Function exports
│   ├── newsletter/             # Newsletter module (send, track, manage, etc.)
│   └── posts/                  # Posts module (create, update, get, generate)
├── newsletter/admin/           # Admin panel HTML
├── positions/                  # Position landing pages
├── tools/                      # Interactive tool pages
├── tests/pbt/                  # Property-based tests (Vitest + fast-check)
├── sproochentest-materials/    # Luxembourgish study content
├── robots.txt                  # SEO (blocks tool pages + PDFs from indexing)
└── .github/workflows/          # CI/CD
```

---

## Admin panel architecture

The admin panel uses native ES modules (no build tools, no bundlers):

```
index.html (bootstrap script)
  └── main.js (Firebase auth, navigation, shared utilities)
        ├── dashboard.js    (loaded on panel switch)
        ├── posts.js        (loaded on panel switch)
        ├── new-post.js     (loaded on panel switch)
        ├── compose.js      (loaded on panel switch)
        ├── subscribers.js  (loaded on panel switch)
        ├── analytics.js    (loaded on panel switch)
        └── import.js       (loaded on panel switch)
```

- Modules are dynamically imported when their panel is activated
- No circular dependencies (panel modules import only from main.js)
- Firebase config and API URLs injected via Jekyll Liquid at build time
- Grid.js and EasyMDE loaded as UMD scripts (accessed as globals)

---

## Running locally

```bash
# Install Ruby dependencies
bundle install

# Start Jekyll server
bundle exec jekyll serve

# Run frontend tests
npm test

# Deploy Cloud Functions
cd functions && firebase deploy --only functions
```

Site available at `http://localhost:4000`

---

## Key design decisions

- **No build tools for frontend** — Native ES modules, no webpack/vite/bundler. Keeps the Jekyll static site simple.
- **Modular admin panel** — Hub-and-spoke architecture with lazy-loaded panel modules.
- **GitHub as CMS** — Posts are created/edited by committing markdown files via the GitHub API. No database for content.
- **Property-based testing** — Core logic (filtering, stats computation, CSV export, utilities) tested with fast-check.
- **Split CSS** — `global.css` loaded everywhere + page-specific CSS via front matter. No monolithic stylesheet.
- **SEO-first content** — 4 canonical positions, staggered post dates, internal linking strategy, tool landing pages optimized for search.
- **Firebase for backend** — Cloud Functions handle email, AI generation, analytics, and subscriber management. No server to maintain.

---

## Credits

Built on [Beautiful Jekyll](https://beautifuljekyll.com) by [Dean Attali](https://deanattali.com).
