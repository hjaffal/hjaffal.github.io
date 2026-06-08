# Product & Technical Specification: Sproochentest Vocabulary Engine

**Target Path:** `/sproochentest/vocab/`  
**Version:** 1.0  
**Last Updated:** 2026-05-31

---

## 1. Executive Summary

This module adds a gamified, interactive vocabulary acquisition engine to the existing Sproochentest platform at `hasanjaffal.com`. The engine trains users to recall Luxembourgish vocabulary under time pressure (sub-2.5 seconds), directly targeting the conversational freezing problem that causes exam failure.

The system uses a Leitner-box spaced repetition algorithm, three progressive learning layers (recognition → production → speed recall), and behavioral gamification (XP, streaks, daily decks) to drive daily return visits.

---

## 2. Business Requirements

### 2.1 Target User
Expats in Luxembourg preparing for the Sproochentest oral exam who need structured, high-frequency vocabulary practice rather than generic word lists.

### 2.2 Success Metrics
| Metric | Target |
|--------|--------|
| Daily Active Users (DAU) | Measurable via streak data |
| Session completion rate | >70% of started decks finished |
| Conversion to registered user | >30% of trial users register |
| Return rate (D7) | >40% of registered users active after 7 days |

### 2.3 Conversion Model
- **Free tier (guest):** 10-word trial per category, localStorage-only progress, no streaks/XP persistence.
- **Registered tier:** Full access to all categories, spaced repetition tracking, streaks, XP history, audio playback.
- Registration uses Firebase Authentication (email/password + Google sign-in). User does not have to pay to registered.

---

## 3. Architecture & Technical Constraints

### 3.1 Frontend
- Jekyll static page at `/sproochentest/vocab/`
- Uses existing `base.html` layout → `sproochentest-header.html` / `sproochentest-footer.html`
- Page-specific CSS: `assets/css/vocab.css` (loaded via front matter `css:` array)
- Page-specific JS: `assets/js/vocab-engine.js` (loaded at bottom of page)
- Firebase Auth SDK loaded only on this page (not globally)

### 3.2 Backend
- Google Cloud Functions (Node.js 20), same project as existing functions (`hasanjaffal`)
- Firestore for user progress, SRS state, XP ledger, streak data
- New functions module: `functions/vocab/`
- Function URLs added to `_data/firebase.yml`

### 3.3 Hard Constraints (from project steering)
- No Firestore usage for the Future-Proof Skills Assessment (this is a separate module — Firestore IS allowed for vocab)
- Firebase client code stays isolated to the vocab page
- No secrets in frontend code
- No `@import url()` in CSS files
- No inline styles
- Existing URLs must not break
- No global CSS/JS bloat — vocab assets load only on `/sproochentest/vocab/`

### 3.4 Data Storage

| Data | Location | Reason |
|------|----------|--------|
| Vocabulary content (words, translations, categories) | `_data/vocab/` YAML files | Static, version-controlled, no backend needed |
| Guest session progress | `localStorage` | No auth required |
| Authenticated user SRS state | Firestore `users/{uid}/vocab/{wordId}` | Persistent across devices |
| XP ledger | Firestore `users/{uid}/xp` | Server-validated |
| Streak data | Firestore `users/{uid}/streaks` | Server-validated |

---

## 4. Vocabulary Content Structure

### 4.1 Content Source
All vocabulary is sourced from a curated master word list (52 sections, ~1500+ entries). Categories follow the source document's own structure — NOT the speaking topics. The source organizes words into:

- **Foundation modules** — core words, grammar building blocks, pronouns, articles
- **Functional modules** — fillers, connectors, sentence launchers, question words
- **Thematic modules** — exam-relevant topics (Sport, Wunnen, Transport, Hobbyen, Vakanz, Gesondheet, Medien, Sproochen, Kaddoen, Summer/Wanter, Aarbecht)
- **Grammar reference** — verb conjugations, declensions, prepositions, past participles
- **Cultural module** — truly Luxembourgish idioms and colloquial expressions

### 4.2 Categories

Categories are grouped into three tiers by learning progression:

#### Tier 1: Foundations (unlock first)

| Category Slug | Source Sections | Display Name | Entry Count |
|---------------|----------------|--------------|-------------|
| `essential-words` | §1 | Essential Words | 44 |
| `articles-pronouns` | §2, §4, §17, §18, §33, §35, §37, §38, §40, §47 | Articles & Pronouns | ~80 |
| `starter-verbs` | §5, §6 | Core Verbs | ~50 |
| `introductions` | §7 | Introduce Yourself | ~45 |
| `numbers-dates` | §3, §8, §14 | Numbers, Dates & Time | ~100 |

#### Tier 2: Exam Building Blocks (unlock after Tier 1 progress)

| Category Slug | Source Sections | Display Name | Entry Count |
|---------------|----------------|--------------|-------------|
| `fillers-connectors` | §10, §11, §13 | Fillers, Connectors & Sentence Launchers | ~80 |
| `question-words` | §21 | Question Words | ~13 |
| `locators` | §12 | Locators & Spatial Words | ~14 |
| `describe-objects` | §19 | Describing Objects | ~60 |
| `describe-people` | §24 | Describing People | ~55 |
| `adjective-declension` | §20, §45 | Adjective Forms | ~20 |
| `prepositions` | §16 | Prepositions | ~35 |

#### Tier 3: Thematic Modules (exam topics)

| Category Slug | Source Sections | Display Name | Entry Count |
|---------------|----------------|--------------|-------------|
| `sport` | §9 | Sport | ~65 |
| `wunnen` | §15 | Wunnen (Housing) | ~55 |
| `transport` | §23 | Transport | ~75 |
| `hobbyen` | §27 | Hobbyen (Hobbies) | ~70 |
| `vakanz` | §31, §34 | Vakanz (Holidays & Beach) | ~80 |
| `gesondheet` | §36, §39 | Gesond Liewen (Health & Market) | ~75 |
| `medien-technologien` | §46, §48 | Medien & Technologien | ~65 |
| `sproochen` | §42, §44 | Sproochen & Léieren | ~60 |
| `kaddoen` | §30 | Kaddoen (Gifts) | ~30 |
| `summer-wanter` | §49 | Summer & Wanter | ~55 |
| `aarbecht` | §50 | Meng Aarbecht (Work) | ~65 |
| `stot-maachen` | §29 | De Stot Maachen (Housework) | ~25 |
| `family` | §22, §41 | Family & Relations | ~65 |

#### Tier 4: Advanced & Cultural

| Category Slug | Source Sections | Display Name | Entry Count |
|---------------|----------------|--------------|-------------|
| `frequent-verbs` | §28 | Frequent Verbs | ~130 |
| `irregular-verbs` | §25 | Verbs with Irregularities | ~45 |
| `simple-past` | §32, §52 | Past Tenses | ~50 |
| `truly-luxembourgish` | §51 | Truly Luxembourgish (Idioms & Slang) | ~180 |

### 4.3 Word Data Schema (`_data/vocab/{category}.yml`)

Each entry type has a slightly different schema depending on its nature:

#### Standard word entry
```yaml
- id: "sport_001"
  lb: "Sport maachen"
  en: "to exercise"
  pos: "verb-phrase"        # noun, verb, adjective, adverb, phrase, verb-phrase, connector
  difficulty: 1             # 1 = beginner, 2 = intermediate, 3 = advanced
  example_lb: "Ech maache gär Sport."
  example_en: "I like to exercise."
```

#### Noun entry (with gender/plural)
```yaml
- id: "wunnen_003"
  lb: "d'Appartement"
  en: "flat, apartment"
  pos: "noun"
  gender: "n"              # m, f, n
  plural: "Appartementer"
  difficulty: 1
  example_lb: "Mir wunnen an engem Appartement."
  example_en: "We live in an apartment."
```

#### Verb entry (with conjugation hint)
```yaml
- id: "starter-verbs_005"
  lb: "fueren"
  en: "to drive/ride"
  pos: "verb"
  conjugation: "Ech fueren, du fiers, hien/si fiert"
  irregular: true
  difficulty: 1
  example_lb: "Ech fuere mam Bus op d'Aarbecht."
  example_en: "I take the bus to work."
```

#### Phrase/expression entry
```yaml
- id: "fillers_002"
  lb: "Majo et ass esou, ..."
  en: "Well, in fact ..."
  pos: "filler"
  difficulty: 1
  usage_note: "Use to introduce a factual statement or explanation in conversation."
```

### 4.4 Content Rules
- All vocabulary is sourced from the curated master list — no AI-generated words
- Each entry must have: `id`, `lb`, `en`, `pos`, `difficulty`
- Example sentences come directly from the source document where available
- IDs follow pattern: `{category-slug}_{three-digit-number}`
- Difficulty is assigned based on tier: Tier 1 = difficulty 1, Tier 2 = difficulty 1–2, Tier 3 = difficulty 2, Tier 4 = difficulty 2–3
- Entries with multiple meanings get the most exam-relevant translation first
- Colloquial markers (coll.) and pejorative markers (pej.) are preserved in a `register` field where applicable

### 4.5 Tier Unlocking Logic
- Tier 1 is always available (free + registered users)
- Tier 2 unlocks when user has ≥50% of any Tier 1 category at Box 3+
- Tier 3 unlocks when user has ≥30% of Tier 2 categories started
- Tier 4 unlocks when user has ≥3 Tier 3 categories with ≥50% at Box 3+
- Guest users can only access Tier 1 (10-word limit per category still applies)

---

## 5. Functional Requirements

### 5.1 Page & Navigation

| ID | Type | Requirement |
|----|------|-------------|
| REQ-01 | Ubiquitous | The system shall serve the vocabulary interface at `/sproochentest/vocab/`. |
| REQ-02 | Ubiquitous | The page shall use the existing Sproochentest header with a new "Vocab" nav link added. |
| REQ-03 | Ubiquitous | The page shall display a tier-based category selector showing all available modules grouped by learning progression (Foundations → Exam Building Blocks → Thematic → Advanced), with word counts and user progress per category. |

### 5.2 Authentication & Access Control

| ID | Type | Requirement |
|----|------|-------------|
| REQ-04 | Event-Driven | **When** a guest user completes 10 words in any category, **then** the system shall display a registration modal blocking further progress. |
| REQ-05 | State-Driven | **While** a user is unauthenticated, the system shall store all session progress in `localStorage` only. |
| REQ-06 | Event-Driven | **When** a guest user registers, **then** the system shall migrate their `localStorage` progress to Firestore. |
| REQ-07 | Ubiquitous | The registration modal shall offer email/password signup and Google sign-in via Firebase Auth. |
| REQ-08 | State-Driven | **While** a user is authenticated, the system shall sync all progress to Firestore in real-time. |

### 5.3 Learning Layers

The engine presents vocabulary through three progressive layers. A word must pass each layer before advancing to the next.

#### Layer 1: Recognition (Passive → Active Recognition)

| ID | Type | Requirement |
|----|------|-------------|
| REQ-09 | Ubiquitous | The system shall present a Luxembourgish word and four English translation options (1 correct + 3 distractors from the same category). |
| REQ-10 | Event-Driven | **When** the user selects the correct answer, **then** the system shall show a green confirmation, award +10 XP, and advance the card. |
| REQ-11 | Event-Driven | **When** the user selects an incorrect answer, **then** the system shall highlight the correct answer in green, show the wrong answer in red, and reset the word to Box 1. |
| REQ-12 | Ubiquitous | Distractors shall be semantically plausible (same part of speech, same difficulty band). |

#### Layer 2: Production (Active Recall)

| ID | Type | Requirement |
|----|------|-------------|
| REQ-13 | Ubiquitous | The system shall present an English word and require the user to type the Luxembourgish translation. |
| REQ-14 | Ubiquitous | Input matching shall be case-insensitive and shall accept answers with or without the article for nouns. |
| REQ-15 | Event-Driven | **When** the typed answer matches the target (fuzzy: Levenshtein distance ≤ 1 for words > 5 chars), **then** the system shall accept it as correct with a "close enough" indicator. |
| REQ-16 | Event-Driven | **When** the user submits an incorrect answer, **then** the system shall display the correct spelling, show the user's attempt with differences highlighted, and reset to Box 1. |

#### Layer 3: Speed Recall (Timed Production)

| ID | Type | Requirement |
|----|------|-------------|
| REQ-17 | Ubiquitous | The system shall present an English word with a visible 2.5-second countdown timer. |
| REQ-18 | Event-Driven | **When** the user answers correctly within 2.5 seconds, **then** the system shall award +10 XP base + 5 XP "Speed Demon" bonus and show a speed animation. |
| REQ-19 | Event-Driven | **When** the timer expires without a correct answer, **then** the system shall treat it as incorrect (reset to Box 1) and show the correct answer. |
| REQ-20 | Event-Driven | **When** the user answers correctly but after 2.5 seconds, **then** the system shall award +10 XP (no speed bonus) and show "Correct — but too slow for the exam." |

### 5.4 Spaced Repetition (SRS) Engine

| ID | Type | Requirement |
|----|------|-------------|
| REQ-21 | Ubiquitous | The SRS engine shall use a 5-box Leitner system with the following review intervals: Box 1 = same session, Box 2 = 1 day, Box 3 = 3 days, Box 4 = 7 days, Box 5 = 14 days (mastered). |
| REQ-22 | State-Driven | **While** generating a daily study session, the backend shall assemble a 20-card deck: 70% due review cards (`next_review_due <= now`) + 30% new cards from the active category. |
| REQ-23 | Event-Driven | **When** a user answers incorrectly at any layer, **then** the engine shall reset that word to Box 1 and re-queue it at the end of the current session. |
| REQ-24 | Event-Driven | **When** a user answers correctly, **then** the engine shall promote the word to the next box and set `next_review_due` based on the new box interval. |
| REQ-25 | State-Driven | **While** no review cards are due, the system shall present new cards only (up to 20 per session). |
| REQ-26 | Ubiquitous | Words in Box 5 (mastered) shall not appear in daily decks unless the user explicitly resets them. |

### 5.5 Gamification

| ID | Type | Requirement |
|----|------|-------------|
| REQ-27 | Event-Driven | **When** a user completes a 20-card daily deck, **then** the system shall increment `current_streak` by 1 and trigger a fire/celebration animation. |
| REQ-28 | Event-Driven | **When** a user misses a calendar day without completing a deck, **then** the system shall reset `current_streak` to 0 (preserve `longest_streak`). |
| REQ-29 | Ubiquitous | The system shall display a persistent XP counter and streak counter in the session header. |
| REQ-30 | Event-Driven | **When** a user earns XP, **then** the system shall show a floating "+10 XP" / "+15 XP" animation near the answer area. |
| REQ-31 | Ubiquitous | The system shall display a progress bar showing cards completed / total in the current session. |

### 5.6 Session Flow

| ID | Type | Requirement |
|----|------|-------------|
| REQ-32 | Event-Driven | **When** a user selects a category, **then** the system shall generate a session deck and begin with Layer 1 for new words and the appropriate layer for review words. |
| REQ-33 | Event-Driven | **When** a session is interrupted (page close/navigate away), **then** the system shall save current progress and resume from the same point on return. |
| REQ-34 | Ubiquitous | The system shall show a session summary screen on deck completion: words learned, words reviewed, XP earned, streak status, accuracy percentage. |
| REQ-35 | Event-Driven | **When** a user completes a session, **then** the system shall offer "Continue with another deck" or "Done for today." |

---

## 6. User Interface Specification

### 6.1 Page Layout

```
┌─────────────────────────────────────────────────┐
│  [Sproochentest Header — existing]              │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌─────────────────────────────────────────┐    │
│  │  Category Selector (grid of topic cards) │    │
│  │  - Shows progress per category           │    │
│  │  - Word count / mastered count           │    │
│  │  - Locked indicator for guest overflow   │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
│  ── OR (during active session) ──               │
│                                                 │
│  ┌─────────────────────────────────────────┐    │
│  │  Session Header                          │    │
│  │  [Progress: 7/20] [XP: 145] [🔥 3 days] │    │
│  ├─────────────────────────────────────────┤    │
│  │                                         │    │
│  │  Card Area                              │    │
│  │  - Word display (large, centered)       │    │
│  │  - Timer bar (Layer 3 only)             │    │
│  │  - Answer options (Layer 1) or          │    │
│  │    text input (Layer 2 & 3)             │    │
│  │                                         │    │
│  ├─────────────────────────────────────────┤    │
│  │  Feedback Area                          │    │
│  │  - Correct/incorrect indicator          │    │
│  │  - Example sentence                     │    │
│  │  - XP animation                         │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
├─────────────────────────────────────────────────┤
│  [Sproochentest Footer — existing]              │
└─────────────────────────────────────────────────┘
```

### 6.2 Visual Design Tokens (from existing system)

| Token | Value | Usage |
|-------|-------|-------|
| `--accent` | `#9333EA` | Primary actions, progress, XP |
| `--dark` | `#0F172A` | Card backgrounds, text |
| `--slate-bg` | (light gray) | Page background |
| `--slate-border` | (border gray) | Card borders |
| `--white` | `#FFFFFF` | Card surfaces |
| Success green | `#10B981` | Correct answers |
| Error red | `#EF4444` | Wrong answers |
| Speed gold | `#F59E0B` | Speed bonus indicator |

### 6.3 Animations
- Card flip transition between question and feedback (300ms ease)
- XP float-up animation (+10 XP text rises and fades, 800ms)
- Progress bar smooth fill (200ms)
- Timer bar countdown (linear 2.5s, color shifts green → yellow → red)
- Streak fire animation on deck completion (CSS keyframes, 1.5s)
- Shake animation on wrong answer (200ms)

### 6.4 Mobile Responsiveness
- Single-column layout below 700px
- Touch-friendly tap targets (minimum 44px)
- Answer options stack vertically on mobile
- Timer bar full-width on mobile
- Category grid: 2 columns on tablet, 1 column on mobile

---

## 7. API Specification

### 7.1 Cloud Functions

All functions use the existing pattern: `onRequest` with CORS, JSON body, region `europe-west1`.

#### `vocabGetDeck`
Generates a study session deck for an authenticated user.

```
POST /vocabGetDeck
Headers: Authorization: Bearer <Firebase ID token>
Body: { "category": "gesondheet" }
Response: {
  "deck": [
    {
      "wordId": "gesondheet_001",
      "lb": "de Kappwéi",
      "en": "headache",
      "layer": 1,
      "box": 2,
      "distractors": ["fever", "cough", "medicine"]  // Layer 1 only
    }
  ],
  "sessionId": "uuid",
  "stats": { "totalXp": 1450, "streak": 3, "wordsLearned": 87 }
}
```

#### `vocabSubmitAnswer`
Records an answer and returns updated SRS state.

```
POST /vocabSubmitAnswer
Headers: Authorization: Bearer <Firebase ID token>
Body: {
  "sessionId": "uuid",
  "wordId": "gesondheet_001",
  "answer": "headache",
  "correct": true,
  "responseTimeMs": 1800,
  "layer": 1
}
Response: {
  "xpAwarded": 15,
  "newBox": 3,
  "nextReviewDue": "2026-06-03T00:00:00Z",
  "speedBonus": true,
  "sessionProgress": { "completed": 8, "total": 20 }
}
```

#### `vocabCompleteSession`
Finalizes a session, updates streak.

```
POST /vocabCompleteSession
Headers: Authorization: Bearer <Firebase ID token>
Body: { "sessionId": "uuid" }
Response: {
  "streak": 4,
  "longestStreak": 12,
  "sessionXp": 245,
  "accuracy": 0.85,
  "wordsLearned": 6,
  "wordsReviewed": 14
}
```

#### `vocabGetProgress`
Returns user's overall progress across all categories.

```
GET /vocabGetProgress
Headers: Authorization: Bearer <Firebase ID token>
Response: {
  "totalXp": 1695,
  "currentStreak": 4,
  "longestStreak": 12,
  "categories": {
    "gesondheet": { "total": 50, "learned": 32, "mastered": 18 },
    "akafen": { "total": 45, "learned": 12, "mastered": 5 }
  }
}
```

#### `vocabMigrateGuest`
Migrates localStorage progress to Firestore on registration.

```
POST /vocabMigrateGuest
Headers: Authorization: Bearer <Firebase ID token>
Body: {
  "localProgress": {
    "gesondheet_001": { "box": 2, "layer": 1, "lastSeen": "2026-05-30" },
    "gesondheet_002": { "box": 1, "layer": 1, "lastSeen": "2026-05-30" }
  }
}
Response: { "migrated": 2, "conflicts": 0 }
```

### 7.2 Firestore Schema

```
users/{uid}/
├── vocab_profile/
│   └── stats {
│         totalXp: number,
│         currentStreak: number,
│         longestStreak: number,
│         lastSessionDate: timestamp,
│         wordsLearned: number,
│         wordsMastered: number
│       }
├── vocab_progress/{wordId} {
│     box: number (1-5),
│     layer: number (1-3),
│     nextReviewDue: timestamp,
│     correctCount: number,
│     incorrectCount: number,
│     lastReviewed: timestamp,
│     speedBonusCount: number
│   }
└── vocab_sessions/{sessionId} {
      category: string,
      startedAt: timestamp,
      completedAt: timestamp | null,
      deck: array<wordId>,
      currentIndex: number,
      xpEarned: number,
      accuracy: number
    }
```

---

## 8. Guest Mode (localStorage Schema)

```javascript
// Key: "sp_vocab_progress"
{
  "words": {
    "gesondheet_001": { "box": 2, "layer": 1, "lastSeen": "2026-05-30" },
    "gesondheet_002": { "box": 1, "layer": 1, "lastSeen": "2026-05-30" }
  },
  "stats": {
    "totalWordsAttempted": 10,
    "sessionsStarted": 1
  },
  "currentSession": {
    "category": "gesondheet",
    "deck": ["gesondheet_001", "gesondheet_002", ...],
    "currentIndex": 5,
    "xpThisSession": 50
  }
}
```

Guest limitations:
- No streak tracking (requires server-side date validation)
- No XP persistence across browser clears
- Maximum 10 unique words per category
- No cross-device sync
- No Layer 3 (speed recall) — requires auth to unlock

---

## 9. File Structure

```
# Frontend (Jekyll)
sproochentest-vocab.html                    ← Main page (layout: sproochentest-vocab)
_layouts/sproochentest-vocab.html           ← Layout (extends base.html)
_data/vocab/
├── essential-words.yml                     ← Tier 1: Foundation
├── articles-pronouns.yml
├── starter-verbs.yml
├── introductions.yml
├── numbers-dates.yml
├── fillers-connectors.yml                  ← Tier 2: Exam Building Blocks
├── question-words.yml
├── locators.yml
├── describe-objects.yml
├── describe-people.yml
├── adjective-declension.yml
├── prepositions.yml
├── sport.yml                               ← Tier 3: Thematic Modules
├── wunnen.yml
├── transport.yml
├── hobbyen.yml
├── vakanz.yml
├── gesondheet.yml
├── medien-technologien.yml
├── sproochen.yml
├── kaddoen.yml
├── summer-wanter.yml
├── aarbecht.yml
├── stot-maachen.yml
├── family.yml
├── frequent-verbs.yml                      ← Tier 4: Advanced
├── irregular-verbs.yml
├── simple-past.yml
└── truly-luxembourgish.yml
assets/css/vocab.css                        ← Page-specific styles
assets/js/vocab-engine.js                   ← SRS logic, UI controller, Firebase Auth
_includes/vocab-auth-modal.html             ← Registration/login modal

# Backend (Cloud Functions)
functions/vocab/
├── getDeck.js
├── submitAnswer.js
├── completeSession.js
├── getProgress.js
└── migrateGuest.js
functions/index.js                          ← Add vocab module exports
```

---

## 10. Integration Points

### 10.1 Sproochentest Header Update
Add "Vocab" link to `_includes/sproochentest-header.html`:
```html
<a href="/sproochentest/vocab/" class="{% if page.url == '/sproochentest/vocab/' %}sp-nav-active{% endif %}">Vocab</a>
```

### 10.2 Firebase Config
Add to `_data/firebase.yml`:
```yaml
fn_vocab_get_deck: "https://vocabgetdeck-vgheoh5xza-ew.a.run.app"
fn_vocab_submit_answer: "https://vocabsubmitanswer-vgheoh5xza-ew.a.run.app"
fn_vocab_complete_session: "https://vocabcompletesession-vgheoh5xza-ew.a.run.app"
fn_vocab_get_progress: "https://vocabgetprogress-vgheoh5xza-ew.a.run.app"
fn_vocab_migrate_guest: "https://vocabmigrateguest-vgheoh5xza-ew.a.run.app"
```

### 10.3 Sproochentest Landing Page
Add a new section to `sproochentest.html` between Speaking and Image Description:
```html
<div class="sp-section" id="vocab">
  <!-- Vocabulary Engine promo section -->
</div>
```

### 10.4 CSS Loading
The vocab page loads CSS via front matter — no changes to `global.css` or `_config.yml` needed:
```yaml
css:
  - "/assets/css/sproochentest.css"
  - "/assets/css/vocab.css"
```

---

## 11. Security Requirements

| ID | Requirement |
|----|-------------|
| SEC-01 | All Cloud Functions shall validate Firebase ID tokens before processing requests. |
| SEC-02 | XP and streak calculations shall be server-side only. The frontend displays values but cannot set them. |
| SEC-03 | Answer correctness shall be validated server-side (frontend sends the answer, backend checks it). |
| SEC-04 | Rate limiting: max 100 answer submissions per user per hour. |
| SEC-05 | Firebase API key (already public) is domain-restricted. No additional secrets exposed in frontend. |
| SEC-06 | Guest localStorage data is untrusted. On migration, server validates word IDs exist and box values are within range (1-5). |

---

## 12. Performance Requirements

| ID | Requirement |
|----|-------------|
| PERF-01 | Page load (first contentful paint) shall be under 1.5 seconds on 4G. |
| PERF-02 | Card transition (answer → next card) shall be under 200ms perceived latency. |
| PERF-03 | Firebase Auth SDK shall be loaded asynchronously and not block initial render. |
| PERF-04 | Vocabulary YAML data shall be compiled into a single JSON file at build time (Jekyll plugin or build script) to avoid multiple network requests. |
| PERF-05 | The deck generation API shall respond in under 500ms. |
| PERF-06 | Total page JS bundle (excluding Firebase SDK) shall be under 30KB gzipped. |

---

## 13. Accessibility Requirements

| ID | Requirement |
|----|-------------|
| A11Y-01 | All interactive elements shall be keyboard-navigable (Tab, Enter, Escape). |
| A11Y-02 | Answer options shall use `role="radio"` with proper `aria-checked` states. |
| A11Y-03 | Timer countdown shall have an `aria-live="polite"` region announcing time remaining. |
| A11Y-04 | Color shall not be the only indicator of correct/incorrect — use icons (✓/✗) and text labels. |
| A11Y-05 | Focus shall move logically: question → answer area → feedback → next card. |
| A11Y-06 | Modal shall trap focus and be dismissible with Escape. |

---

## 14. SEO Considerations

| Concern | Mitigation |
|---------|-----------|
| Interactive page has little crawlable content | Include static intro text, category list, and FAQ below the app shell |
| New URL `/sproochentest/vocab/` | Add to sitemap, internal link from sproochentest landing page |
| Page title & meta | "Luxembourgish Vocabulary Practice — Sproochentest Prep" |
| Structured data | `FAQPage` schema for common questions about vocab learning |

---

## 15. Implementation Phases

### Phase 1: Foundation (MVP)
- [ ] Convert Tier 1 vocabulary data into YAML files (essential-words, articles-pronouns, starter-verbs, introductions, numbers-dates)
- [ ] Frontend page with tier/category selector
- [ ] Layer 1 (recognition) — multiple choice
- [ ] Guest mode with localStorage (10-word limit per category)
- [ ] Registration modal with Firebase Auth
- [ ] Basic progress tracking (no SRS, sequential cards)
- [ ] Page-specific CSS and JS

### Phase 2: SRS & Production
- [ ] Leitner box algorithm (client-side for guests, server-side for auth users)
- [ ] Layer 2 (production) — typed answers with fuzzy matching
- [ ] Cloud Functions: getDeck, submitAnswer, completeSession
- [ ] Firestore schema and progress persistence
- [ ] Guest → authenticated migration flow
- [ ] Session resume on page reload
- [ ] Convert Tier 2 vocabulary data into YAML files

### Phase 3: Speed & Gamification
- [ ] Layer 3 (speed recall) — timed input
- [ ] XP system with animations
- [ ] Streak tracking with server-side validation
- [ ] Session summary screen
- [ ] Celebration animations (streak fire, level up)
- [ ] Progress dashboard per category
- [ ] Tier unlocking logic

### Phase 4: Content Expansion
- [ ] Convert Tier 3 vocabulary data (all thematic modules)
- [ ] Convert Tier 4 vocabulary data (advanced + truly Luxembourgish)
- [ ] Audio pronunciation (future — TTS or pre-recorded)
- [ ] Daily push notification reminders (future — requires PWA)
- [ ] Leaderboard (future — requires additional Firestore queries)

---

## 16. Open Questions

| # | Question | Impact |
|---|----------|--------|
| 1 | Should Layer 3 accept typed input or voice input? | Voice would be more exam-realistic but adds complexity (Web Speech API). Start with typed, add voice as Phase 5. |
| 2 | Should wrong answers demote to Box 1 or demote by one box? | Box 1 reset is aggressive but ensures mastery. Recommend Box 1 for MVP, gather user feedback. |
| 3 | Audio pronunciation — TTS or pre-recorded? | Pre-recorded is higher quality but expensive to produce for 600+ words. TTS (Google Cloud) is scalable. Defer to Phase 4. |
| 4 | Should the 10-word guest limit be per category or total? | Per category is more generous and lets users sample multiple topics. Recommend per category. |
| 5 | Offline/PWA support? | Would significantly boost DAU for a daily-habit tool. Defer to post-MVP — requires service worker and IndexedDB. |

---

## 17. Dependencies

| Dependency | Version | Purpose |
|------------|---------|---------|
| Firebase Auth (Web SDK) | ^10.x | User authentication |
| Firebase Firestore (Web SDK) | ^10.x | Progress persistence |
| firebase-admin | ^12.x (existing) | Backend token validation |
| firebase-functions | ^5.x (existing) | Cloud Function framework |

No new backend dependencies required. Frontend Firebase SDKs loaded via CDN (modular tree-shakeable imports).

---

## 18. Success Criteria for Launch

- [ ] All 5 Tier 1 categories converted to YAML with full entries
- [ ] Layer 1 and Layer 2 functional for guests and authenticated users
- [ ] Registration flow works (email + Google)
- [ ] Guest progress migrates on registration
- [ ] No impact on existing Sproochentest pages or URLs
- [ ] Mobile-responsive down to 320px width
- [ ] Page loads under 2s on 4G
- [ ] No console errors in production
- [ ] Passes WAVE accessibility check (0 errors)
