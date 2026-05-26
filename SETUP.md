# Fork & Setup Guide

This guide walks you through forking this project and setting it up as your own personal authority website with blog, newsletter admin, AI tools, and downloadable materials.

---

## What You Get

- **Personal website** with blog, positions/pillars, and tools
- **Newsletter admin panel** — compose, send, manage subscribers, analytics
- **AI post generation** — Gemini-powered blog post creation
- **Draft workflow** — save to Firestore, preview, publish to GitHub
- **Interactive tools** — AI Job Risk Analyzer, Future-Proof Skills Assessment
- **Download tracking** — gated materials with email capture and analytics
- **Sproochentest study guide** — (optional, Luxembourgish language content)

---

## Prerequisites

- [Ruby](https://www.ruby-lang.org/) 3.x (for Jekyll)
- [Bundler](https://bundler.io/) (`gem install bundler`)
- [Node.js](https://nodejs.org/) 20+ (for Cloud Functions)
- [Firebase CLI](https://firebase.google.com/docs/cli) (`npm install -g firebase-tools`)
- A [GitHub](https://github.com) account
- A [Firebase](https://firebase.google.com) project (free Spark plan works for most features)
- A [Resend](https://resend.com) account (for sending emails)
- A [Google AI Studio](https://aistudio.google.com) API key (for Gemini post generation)

---

## Step 1: Fork the Repository

1. Click **Fork** on the GitHub repo page
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR-USERNAME/YOUR-REPO.git
   cd YOUR-REPO
   ```

---

## Step 2: Install Dependencies

```bash
# Jekyll dependencies
bundle install

# Frontend test dependencies (optional)
npm install

# Cloud Functions dependencies
cd functions
npm install
cd ..
```

---

## Step 3: Firebase Setup

### Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project
3. Enable **Authentication** → Sign-in method → Google
4. Enable **Firestore Database** (start in production mode)
5. Note your project ID

### Configure Firebase Locally

```bash
firebase login
firebase use YOUR-PROJECT-ID
```

### Set Secrets

```bash
firebase functions:secrets:set RESEND_API_KEY
firebase functions:secrets:set GEMINI_API_KEY
firebase functions:secrets:set GITHUB_PAT
```

- **RESEND_API_KEY** — from [Resend dashboard](https://resend.com/api-keys)
- **GEMINI_API_KEY** — from [Google AI Studio](https://aistudio.google.com/apikey)
- **GITHUB_PAT** — from [GitHub Settings → Developer settings → Personal access tokens](https://github.com/settings/tokens?type=beta) with `Contents: Read and write` permission on your repo

---

## Step 4: Update Configuration

### `_data/firebase.yml`

Replace all URLs with your Firebase project's Cloud Function URLs. After deploying functions (Step 6), update these:

```yaml
firebase_api_key: "YOUR_FIREBASE_API_KEY"
firebase_auth_domain: "YOUR_PROJECT.firebaseapp.com"
firebase_project_id: "YOUR_PROJECT_ID"

fn_send_newsletter: "https://YOUR-FUNCTION-URL"
fn_get_analytics: "https://YOUR-FUNCTION-URL"
# ... etc
```

### `_config.yml`

Update:
- `title` — your name
- `author` — your name
- `url-pretty` — your domain
- Social links, avatar, etc.

### `functions/posts/create.js`, `get.js`, `update.js`, `drafts.js`

Update these constants in each file:
```javascript
const REPO_OWNER = "YOUR-GITHUB-USERNAME";
const REPO_NAME = "YOUR-REPO-NAME";
const REPO_BRANCH = "main"; // or "master"
```

### `CNAME`

Replace with your custom domain, or delete if using `username.github.io`.

---

## Step 5: Deploy Cloud Functions

```bash
firebase deploy --only functions
```

After deployment, Firebase will show the URLs for each function. Update `_data/firebase.yml` with these URLs.

The URL pattern is: `https://FUNCTIONNAME-PROJECTHASH-REGION.a.run.app`

---

## Step 6: GitHub Pages Setup

1. Go to your repo → Settings → Pages
2. Set Source to **Deploy from a branch** → `master` (or `main`)
3. The site will build automatically on push

---

## Step 7: Run Locally

```bash
bundle exec jekyll serve
```

Site available at `http://localhost:4000`

---

## Step 8: Admin Panel

1. Go to `http://localhost:4000/newsletter/admin/`
2. Sign in with the Google account you authorized in Firebase Auth
3. To authorize your account: Firebase Console → Authentication → Users → verify your email is listed

---

## Project Structure

```
├── _config.yml              # Jekyll config
├── _data/firebase.yml       # API URLs and Firebase config
├── _posts/                  # Blog posts (markdown)
├── _layouts/                # Page layouts
├── _includes/               # Reusable components
├── assets/
│   ├── css/                 # Stylesheets (per-page)
│   ├── js/admin/            # Admin panel ES modules
│   ├── img/                 # Images
│   └── pdf/                 # Downloadable materials
├── functions/               # Firebase Cloud Functions
│   ├── index.js             # Function exports
│   ├── newsletter/          # Email, subscribers, analytics, tracking
│   └── posts/               # Create, update, get, generate, drafts
├── newsletter/admin/        # Admin panel HTML
├── positions/               # Position landing pages
├── tools/                   # Interactive tool pages
├── sproochentest-materials/ # Luxembourgish study content (optional)
└── tests/                   # Property-based tests
```

---

## Customization

### Remove Sproochentest Content

Delete these if you don't need the Luxembourgish study guide:
- `sproochentest.html`
- `sproochentest-materials/`
- `assets/css/sproochentest.css`
- `_layouts/sproochentest-*.html`
- `_includes/sproochentest-*.html`

### Change Positions

Edit `_data/positions.yml` to define your own content pillars. Update the position pages in `positions/`.

### Change Tools

The tools are standalone HTML pages in `tools/`. Replace or remove them as needed.

### Change Blog Tags

Update the `VALID_TAGS` array in `functions/posts/create.js` and the position checkboxes in the admin HTML.

---

## Environment Variables Summary

| Secret | Where | Purpose |
|--------|-------|---------|
| `RESEND_API_KEY` | Firebase Secrets | Send emails (newsletter, contact, guides) |
| `GEMINI_API_KEY` | Firebase Secrets | AI post generation |
| `GITHUB_PAT` | Firebase Secrets | Commit posts to repo |

---

## Firestore Collections

| Collection | Purpose |
|------------|---------|
| `subscribers` | Newsletter subscribers |
| `editions` | Sent newsletter editions |
| `posts_drafts` | Draft posts (admin workflow) |
| `downloadable_materials` | Registered downloadable files |
| `download_events` | Download tracking events |
| `skills_assessment_submissions` | Skills assessment results |
| `job_risk_submissions` | AI job risk reports |
| `contact_submissions` | Contact form messages |

---

## Deployment Checklist

- [ ] Fork repo
- [ ] Create Firebase project
- [ ] Enable Auth + Firestore
- [ ] Set secrets (Resend, Gemini, GitHub PAT)
- [ ] Update `_data/firebase.yml` with your config
- [ ] Update `_config.yml` with your info
- [ ] Update repo constants in Cloud Functions
- [ ] Deploy functions: `firebase deploy --only functions`
- [ ] Update `_data/firebase.yml` with deployed function URLs
- [ ] Push to GitHub → site builds on Pages
- [ ] Verify admin panel works at `/newsletter/admin/`
- [ ] Seed materials: Admin → Downloads → (first download auto-registers)

---

## Support

If you run into issues or want to discuss the architecture, reach out at [hasanjaffal.com/contact](https://hasanjaffal.com/contact/).
