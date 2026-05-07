# hasanjaffal.com

Personal website and Sproochentest study guide built with Jekyll and hosted on GitHub Pages.

**Live:** [hasanjaffal.com](https://www.hasanjaffal.com)

---

## What this site contains

### Main website
- **Homepage** — Split hero layout with book promotion, newsletter embed, and featured posts
- **Writing** — Blog posts on risk, AI, fraud analytics, and operational decision-making
- **Books** — Publication page for "The Second Mind"
- **About** — Professional background
- **Contact** — Contact form (Formspree) with office hours booking
- **Dark mode** — Toggle in the navbar, persisted via localStorage

### Sproochentest Study Guide (`/sproochentest/`)
A separate sub-site for Luxembourgish language test preparation:
- **Speaking topics** — 15 A2 speaking topics with sample questions
- **Image description** — Framework and phrases for describing pictures
- **Listening practice** — 8 exercises with audio links, questions, interactive quiz, and transcripts
- **Materials** — Coming soon (downloadable resources)
- Own header, footer, sidebar navigation, and newsletter (Beehiiv)

---

## Tech stack

| Component | Tool |
|-----------|------|
| Static site generator | Jekyll 4.x |
| Theme base | [Beautiful Jekyll](https://beautifuljekyll.com) by Dean Attali |
| Hosting | GitHub Pages |
| Fonts | Inter, JetBrains Mono (Google Fonts) |
| Icons | Font Awesome 6 |
| Newsletter | Beehiiv embed |
| Contact form | Formspree |
| Analytics | Google Tag Manager |
| CSS framework | Bootstrap 4 (navbar only) |

---

## Project structure

```
├── _config.yml              # Site configuration
├── _includes/               # Reusable components
│   ├── newsletter.html      # Newsletter embed component
│   ├── contact-form.html    # Contact form component
│   ├── featured-publication.html
│   ├── sidebar-recent.html
│   ├── sproochentest-header.html
│   ├── sproochentest-footer.html
│   ├── sproochentest-sidebar.html
│   ├── sidebar-image-description.html
│   ├── sidebar-listening.html
│   └── transcript-panel.html
├── _layouts/                # Page layouts
│   ├── base.html
│   ├── page.html
│   ├── post.html
│   ├── sproochentest-topic.html
│   ├── sproochentest-images.html
│   ├── sproochentest-listening.html
│   └── sproochentest-generic.html
├── _posts/                  # Blog posts
├── assets/
│   ├── css/custom-styles.css   # All custom styling
│   └── js/custom-script.js    # Dark mode, quiz, transcript panel
├── sproochentest.html       # Sproochentest homepage
├── sproochentest-materials/  # Sproochentest content
│   ├── sample-topics/       # A2 speaking topic pages
│   ├── sample-listening/    # Listening exercise pages
│   ├── image-description.html
│   ├── listening-practice.html
│   └── materials.html
├── index.html               # Main homepage
├── writing.html             # Blog listing
├── books.html               # Books page
├── aboutme.html             # About page
├── contact.html             # Contact page
├── officehours.html         # Office hours (Google Calendar)
└── robots.txt               # SEO
```

---

## Running locally

```bash
bundle install
bundle exec jekyll serve
```

Site available at `http://localhost:4000`

---

## Key design decisions

- **Custom CSS only** — No Tailwind or additional frameworks. All styling in one `custom-styles.css` file using CSS variables.
- **Component-based** — Reusable includes for newsletter, sidebar, forms, and publication cards.
- **Two-column layout** — Writing, books, about, and post pages use a main + sidebar grid.
- **Sproochentest as sub-site** — Own header/footer/navigation, separate from the main site identity.
- **Interactive quiz** — Listening exercises have clickable answers with instant correction via vanilla JS.
- **Dark mode** — CSS variables swap via `[data-theme="dark"]` attribute on `<html>`.

---

## Credits

Built on [Beautiful Jekyll](https://beautifuljekyll.com) by [Dean Attali](https://deanattali.com). If you use Beautiful Jekyll, consider [supporting the project](https://github.com/sponsors/daattali).
