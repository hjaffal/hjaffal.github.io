# Requirements Document

## Introduction

The hasanjaffal.com content system currently implements approximately 30% of the writing guide specification. This feature aligns the entire content generation pipeline, site infrastructure, and admin tooling with the comprehensive 24-section writing guide. The scope covers: rewriting AI generation prompts (Cloud Function and GitHub Actions script), adding Layer 2 topic architecture, implementing structured data and AI crawlability rules, enhancing the admin panel with editorial controls, and creating source-worthy reference pages.

## Glossary

- **Generation_System**: The AI-powered content generation pipeline consisting of the Cloud Function (generate.js using Gemini) and the GitHub Actions script (generate_post.py using OpenAI) that produce blog posts
- **Admin_Panel**: The authenticated admin dashboard at /newsletter/admin/ used to manage posts, newsletters, and content generation
- **Layer_2_Topic**: A specific sub-topic within one of the three core positions, used to organize content into clusters (30 topics total across 3 positions)
- **Article_Archetype**: One of four content formats every article must follow: Contrarian Opinion, Framework/How-To, Operational Breakdown, or Prediction/Future Risk
- **Answer_Block**: A 40-60 word concise answer placed after the hook, designed for AI extraction and citation
- **Editorial_Checklist**: A 17-item quality verification list that must be satisfied before publishing
- **Position**: One of three core content pillars: AI-Decision-Operations, Risk-Intelligence, or AI-Job-Risk
- **Writing_Guide**: The complete content specification document (writing-guide.md) defining all rules for content generation, structure, and presentation
- **Post_Layout**: The Jekyll layout template (_layouts/post.html) that renders individual blog posts
- **Duplication_Check**: A validation process that checks for overlap at the topic, keyword, and argument level, not just title similarity
- **Reference_Page**: A standalone page designed to become a citable source asset (e.g., AI Job Risk Index, Dashboard Failure Checklist)
- **Front_Matter**: The YAML metadata block at the top of each Jekyll post file
- **Signature_Belief**: One of 7 recurring beliefs that should appear naturally across articles
- **Signature_Metaphor**: One of 10 recurring operational metaphors used across content
- **Forbidden_Phrase**: A word or phrase that must never appear in generated content
- **Content_Mix**: The target distribution of article tones: 20% confrontation, 40% practical, 20% predictive, 20% humor

## Reference Data

### Core Positions

| Tag | Statement | Thesis |
|-----|-----------|--------|
| ai-decision-operations | AI exposes weak operations and slow decisions | AI does not repair unclear ownership or slow approval chains. It exposes them faster and at scale. Signals need authority — detection without decision power is expensive noise. |
| risk-intelligence | Reporting is not intelligence | Reporting explains what happened. Intelligence changes what happens next. If metrics do not trigger action, they are decoration. |
| ai-job-risk | AI is changing the skill floor | AI exposes people who only operate tools. The safer skillset is judgment: setting thresholds, owning trade-offs, and knowing when to escalate. |

### Layer 2 Topics

**AI-Decision-Operations (10 topics):**
1. AI Theater
2. Fake AI Transformation
3. Slow Decision Cultures
4. AI Accountability Vacuum
5. Automation Failure Loops
6. Human Bottleneck Myth
7. AI Governance Bureaucracy
8. Meeting-Driven Operations
9. Escalation Collapse
10. Operational Cowardice

**Risk-Intelligence (10 topics):**
1. Dashboard Addiction
2. KPI Theater
3. Reporting Bureaucracy
4. Alert Spam
5. Data Without Ownership
6. False Confidence Metrics
7. Vanity Analytics
8. Intelligence vs Reporting
9. Data Team Irrelevance
10. Metric Manipulation

**AI-Job-Risk (10 topics):**
1. White-Collar Automation
2. Fake AI Safety Advice
3. Productivity Trap
4. Middle Management Exposure
5. The Collapse of Busy Work
6. Prompt Engineer Hype
7. Knowledge Worker Oversupply
8. Credential Irrelevance
9. AI Career Delusion
10. The Death of Information Work

### Article Archetypes

| # | Archetype | Description | Example Title |
|---|-----------|-------------|---------------|
| 1 | Contrarian Opinion | Attack a common belief | "Most AI Transformations Are Expensive Theater" |
| 2 | Framework / How-To | Provide operational guidance | "How to Build AI Escalation Paths That Actually Work" |
| 3 | Operational Breakdown | Analyze a real or fictional operational failure | "The Dashboard Was Green. The Operation Was Failing." |
| 4 | Prediction / Future Risk | Predict organizational or workforce shifts | "Middle Management Will Shrink Faster Than Most Executives Expect" |

### Article Structure

Every article follows this structure in order:
1. **Hook** — Opening that creates immediate tension or curiosity
2. **Key takeaway** — The core answer/insight upfront
3. **Tension** — The uncomfortable truth or conflict
4. **Consequence** — What happens if the reader ignores this
5. **Recommendation** — What to do about it
6. **Forced-position question** — A question that makes the reader choose a side
7. **CTA** — Newsletter subscription call-to-action

**Article length:** 500-600 words. Short paragraphs (2-4 sentences), highly scannable, conversational, emotionally provocative, strategically useful.

### Writing Techniques (14 total)

1. Contrast
2. Metaphors & Analogies
3. Imagery
4. Strong verbs
5. Repetition
6. Foreshadowing
7. Pattern interrupts
8. Narrative hooks
9. Open loops
10. Tension escalation
11. Short punch sentences
12. Counterintuitive claims
13. Story framing
14. Forced choice questions

### Signature Beliefs (7 recurring beliefs)

1. Visibility is not action.
2. AI exposes weak management.
3. Busy work is disappearing.
4. Dashboards delay accountability.
5. Reporting is not intelligence.
6. Automation scales weak processes.
7. AI increases signal speed faster than organizations can react.

### Signature Metaphors (10 operational metaphors)

1. Radar systems
2. Pressure leaks
3. Digital battlefields
4. Mission control
5. Tripwires
6. Chain reactions
7. Fault lines
8. Black boxes
9. Traffic jams
10. Wildfire spread

### Brand Voice

- **Voice identity:** Strategist, operator, sharp observer
- **Tone:** Provocative, emotionally charged, conversational, direct, humorous at times, aggressive toward weak thinking
- **Allowed criticism targets:** Consultants, BI teams, reporting bureaucracy, AI theater, meeting culture

### Conversational Writing Rules

- Use contractions
- Use simple language
- Ask questions
- Use "you"
- Inject personality
- Use dry sarcasm and dark workplace humor
- Sound like an operator-strategist
- Avoid sounding academic
- Avoid sounding like polished corporate marketing

### Controlled Imperfection Rules

**Allowed:**
- Occasional repetition
- Abrupt paragraphs
- Incomplete transitions
- Blunt statements
- Asymmetry
- Slightly messy conversational flow

**Forbidden:**
- Perfect rhythm everywhere
- Over-structured prose
- Excessive polish
- Sounding like a professional ghostwriter
- AI-generated "smoothness"

### SEO Rules

- 1 primary keyword per article
- 2-3 secondary keywords per article
- Keyword in title, intro, and at least one subheading
- Title structure: SEO + curiosity hybrid
- Many subheadings, short paragraphs, frequent lists
- Example title: "AI Is Replacing Reporting Jobs Faster Than Most Analysts Expect"

### Answer-First Content Structure

- Length: 40-60 words
- Placement: After the hook, before deeper analysis
- Purpose: Help AI systems extract a direct answer quickly
- Rules: Clear language, no fluff, directly answer the article topic, keyword naturally included

### Forbidden Phrases

- leverage
- unlock
- digital transformation
- revolutionary
- synergize
- game changer
- AI-powered solution

### Forbidden Content Types

- Coding tutorials
- Generic AI news
- Generic productivity advice
- Startup content
- Motivational content
- Generic leadership content
- "AI will change everything" fluff
- Buzzword-heavy corporate writing

### Content Mix Targets

| Type | Percentage |
|------|-----------|
| High confrontation | 20% |
| Practical insight | 40% |
| Predictive | 20% |
| Humor / light operational observations | 20% |

### Editorial Quality Checklist (17 items)

1. Fits one position?
2. Fits one topic?
3. Attacks a belief?
4. Creates tension?
5. Contains a memorable line?
6. Feels conversational?
7. Sounds human?
8. Avoids corporate tone?
9. Includes one operational example?
10. Includes one recommendation?
11. Includes one forced-position question?
12. Includes CTA?
13. Includes internal links (minimum 2)?
14. Includes one external reference?
15. Keyword naturally included?
16. Emotionally engaging?
17. Avoids duplication?

### Newsletter CTA Promise Text

> "Weekly writing on AI, risk, and decisions. How to use AI in operations and risk — and how AI is reshaping the skills that matter at work."

### Internal Linking Rules

- Minimum 2 internal links per article
- 1 link to related article
- 1 link to relevant tool
- Links should connect: same position, related topic, supporting framework

### External References

- Every article should include 1 external reference (study, news event, or credible source)
- Preferred sources: Operational AI failures, layoffs, workforce studies, AI adoption reports, organizational case studies
- References are generated by the AI model alongside the article content

### Fictional Examples

- Fictional companies, managers, incidents, meetings, and operational failures are allowed
- Do not repeat the same characters across articles
- Examples should feel realistic and operational

### Formatting Rules

- Subheadings heavily
- Pull quotes
- Key takeaway boxes
- Bullet lists
- Short paragraphs (2-4 sentences)
- Avoid: dense text blocks, giant paragraphs, excessive bolding, corporate formatting

### Source-Worthy Reference Pages (7 pages)

1. AI Job Risk Index
2. Dashboard Failure Checklist
3. Reporting vs Intelligence Framework
4. AI Operations Failure Patterns
5. Decision Ownership Model
6. Operational Escalation Framework
7. AI Adoption Failure Checklist

Each page should: define concepts, include tables, use concise explanations, contain frameworks, be heavily internally linked, include Article Schema JSON-LD.

---

## Requirements

### Requirement 1: Admin Panel — Generation Parameter Selection

**User Story:** As a site owner, I want to select all generation parameters (archetype, Layer 2 topic, content mix type, writing techniques) from the admin AI generation UI, so that I have full control over what type of content is produced.

#### Acceptance Criteria

1. WHEN the AI generation mode is active, THE Admin_Panel SHALL display a dropdown for selecting an Article_Archetype (Contrarian Opinion, Framework/How-To, Operational Breakdown, Prediction/Future Risk, or Random)
2. WHEN a position is selected, THE Admin_Panel SHALL display a dropdown for selecting a Layer_2_Topic filtered to that position's 10 topics (or Random)
3. WHEN the AI generation mode is active, THE Admin_Panel SHALL display a dropdown for selecting a Content_Mix type (High confrontation, Practical insight, Predictive, Humor/light, or Random)
4. WHEN the AI generation mode is active, THE Admin_Panel SHALL display a multi-select for choosing 2-4 writing techniques from the 14 available techniques
5. THE Admin_Panel SHALL pass all selected parameters to the Generation_System when generating a post
6. WHEN "Random" is selected for any parameter, THE Generation_System SHALL choose an appropriate value automatically

### Requirement 2: Generation Prompt — Full Writing Guide Enforcement

**User Story:** As a site owner, I want the AI generation prompts rewritten from scratch to use the writing guide as the complete specification, so that every generated post fully complies with all 24 sections.

#### Acceptance Criteria

1. WHEN generating a post, THE Generation_System SHALL produce content following the article structure: Hook → Key takeaway → Tension → Consequence → Recommendation → Forced-position question → CTA
2. WHEN generating a post, THE Generation_System SHALL produce articles between 500 and 600 words in length
3. WHEN generating a post, THE Generation_System SHALL include an Answer_Block of 40-60 words placed after the hook and before deeper analysis
4. WHEN generating a post, THE Generation_System SHALL enforce conversational writing rules: contractions, simple language, questions, "you" address, dry sarcasm, dark workplace humor, operator-strategist tone
5. WHEN generating a post, THE Generation_System SHALL enforce controlled imperfection: allow occasional repetition, abrupt paragraphs, incomplete transitions, blunt statements, and slightly messy flow
6. THE Generation_System SHALL forbid AI-generated smoothness, perfect rhythm, over-structured prose, and professional ghostwriter tone
7. WHEN generating a post, THE Generation_System SHALL use the 2-4 writing techniques selected by the admin (or randomly chosen if not specified)
8. WHEN generating a post, THE Generation_System SHALL naturally incorporate at least one Signature_Belief
9. WHEN generating a post, THE Generation_System SHALL use at least one Signature_Metaphor
10. WHEN generating a post, THE Generation_System SHALL enforce brand voice: provocative, emotionally charged, conversational, direct, aggressive toward weak thinking
11. WHEN generating a post, THE Generation_System SHALL include a forced-position question that requires the reader to choose a side
12. WHEN generating a post, THE Generation_System SHALL include a newsletter CTA using the promise text defined in the Writing_Guide
13. WHEN generating a post, THE Generation_System SHALL include at least one concrete operational example (fictional companies, managers, or incidents allowed)
14. THE Generation_System SHALL reject any output containing a Forbidden_Phrase (leverage, unlock, digital transformation, revolutionary, synergize, game changer, AI-powered solution)
15. THE Generation_System SHALL reject any output that reads as forbidden content types (coding tutorials, generic AI news, generic productivity advice, startup content, motivational content, generic leadership content, buzzword-heavy corporate writing)

### Requirement 3: Generation Prompt — SEO, References, and Internal Links

**User Story:** As a site owner, I want the AI generation system to produce SEO-optimized content with real external references and internal links included in the generated output, so that posts are discoverable and credible without manual editing.

#### Acceptance Criteria

1. WHEN generating a post, THE Generation_System SHALL include 1 primary keyword and 2-3 secondary keywords naturally in the content
2. WHEN generating a post, THE Generation_System SHALL place the primary keyword in the title, introduction, and at least one subheading
3. WHEN generating a post, THE Generation_System SHALL use a hybrid title structure combining SEO discoverability with curiosity
4. WHEN generating a post, THE Generation_System SHALL include at least 2 internal links to related articles or tools from the site
5. WHEN generating a post, THE Generation_System SHALL include at least 1 external reference (study, news event, AI adoption report, or credible source) with a working URL
6. WHEN generating a post, THE Generation_System SHALL use formatting rules: many subheadings, short paragraphs (2-4 sentences), frequent lists, scannable structure
7. WHEN generating a post, THE Generation_System SHALL include at least one comparison table or structured comparison block
8. WHEN generating a post, THE Generation_System SHALL return the external reference(s) as part of the generated JSON output alongside the article body

### Requirement 4: Generation Prompt — Duplication Prevention

**User Story:** As a site owner, I want the AI generation system to prevent content duplication at the topic, keyword, and argument level, so that the site never publishes near-duplicate content.

#### Acceptance Criteria

1. WHEN generating a post, THE Generation_System SHALL receive the full list of existing post topics, keywords, and core arguments for comparison
2. WHEN generating a post, THE Generation_System SHALL check for overlap at the topic level (same Layer_2_Topic already covered)
3. WHEN generating a post, THE Generation_System SHALL check for overlap at the keyword level (same primary keyword already targeted)
4. WHEN generating a post, THE Generation_System SHALL check for overlap at the argument level (same core claim already made)
5. IF overlap is detected at any level, THEN THE Generation_System SHALL force a new angle, keyword, or argument before producing output

### Requirement 5: Layer 2 Topics Data Architecture

**User Story:** As a site owner, I want a structured Layer 2 topics data file with 30 topics mapped to positions and SEO keywords, so that content is organized into discoverable topic clusters.

#### Acceptance Criteria

1. THE Generation_System SHALL have access to a data structure containing 30 Layer_2_Topics organized across 3 positions (10 topics per position) as defined in the Reference Data section
2. THE Generation_System SHALL map SEO keywords to each Layer_2_Topic
3. WHEN generating a post, THE Generation_System SHALL include the selected Layer_2_Topic in the post Front_Matter as a `topic` field
4. WHEN generating a post, THE Generation_System SHALL include the Article_Archetype in the post Front_Matter as an `archetype` field
5. WHEN generating a post, THE Generation_System SHALL include primary and secondary keywords in the post Front_Matter as a `keywords` field

### Requirement 6: AI-Validated Editorial Checklist After Generation

**User Story:** As a site owner, I want the AI to automatically validate the 17-item editorial checklist after generating an article and display the results, so that I can immediately see which quality criteria are met without manual review.

#### Acceptance Criteria

1. WHEN an article is generated by the AI, THE Generation_System SHALL evaluate the generated content against all 17 Editorial_Checklist items
2. WHEN an article is generated, THE Generation_System SHALL return a checklist validation result for each item (pass/fail) as part of the generation response JSON
3. WHEN the generation response is received, THE Admin_Panel SHALL display the 17-item Editorial_Checklist with each item marked as passed or failed based on the AI validation
4. THE Admin_Panel SHALL visually distinguish passed items (green/checked) from failed items (red/unchecked)
5. THE Admin_Panel SHALL display the overall score (e.g., 15/17 items passed)
6. IF any checklist items fail, THEN THE Admin_Panel SHALL display the failed items prominently so the admin can decide whether to edit, regenerate, or proceed

### Requirement 7: Admin Panel — Topic Coverage Dashboard

**User Story:** As a site owner, I want the admin dashboard to show coverage per Layer 2 topic, so that I can identify content gaps and plan future posts.

#### Acceptance Criteria

1. WHEN the dashboard is displayed, THE Admin_Panel SHALL show post count per Layer_2_Topic
2. WHEN the dashboard is displayed, THE Admin_Panel SHALL visually indicate topics with zero coverage (no posts)
3. THE Admin_Panel SHALL group topic coverage by position
4. THE Admin_Panel SHALL display the topic coverage in the existing dashboard sidebar or as a new dashboard section

### Requirement 8: Admin Panel — Soft Validation Warnings

**User Story:** As a site owner, I want soft validation warnings before publishing, so that I am alerted to missing elements without being blocked from publishing.

#### Acceptance Criteria

1. WHEN a post is about to be published, THE Admin_Panel SHALL warn if the Answer_Block is missing (no 40-60 word answer block detected after the hook)
2. WHEN a post is about to be published, THE Admin_Panel SHALL warn if fewer than 2 internal links are present in the body
3. WHEN a post is about to be published, THE Admin_Panel SHALL warn if no external reference URL is included in the body
4. WHEN a post is about to be published, THE Admin_Panel SHALL warn if no forced-position question is detected
5. WHEN a post is about to be published, THE Admin_Panel SHALL warn if no comparison table or structured comparison is present
6. THE Admin_Panel SHALL display warnings as non-blocking advisories that do not prevent publishing

### Requirement 9: Position Pages — Topic Cluster Display

**User Story:** As a site owner, I want position pages to display topic clusters with post counts, so that readers can browse content by specific sub-topics.

#### Acceptance Criteria

1. WHEN a position page is rendered, THE Post_Layout SHALL display the 10 Layer_2_Topics for that position as browsable clusters
2. WHEN a position page is rendered, THE Post_Layout SHALL show the post count for each Layer_2_Topic
3. WHEN a reader clicks a topic cluster, THE Post_Layout SHALL filter displayed posts to only those matching the selected topic

### Requirement 10: Writing Page — Topic Filter

**User Story:** As a site owner, I want the writing page to include topic filtering, so that readers can browse articles by Layer 2 topic.

#### Acceptance Criteria

1. WHEN the writing page is rendered, THE Post_Layout SHALL display a topic filter interface
2. WHEN a reader selects a topic filter, THE Post_Layout SHALL show only posts matching the selected Layer_2_Topic
3. THE Post_Layout SHALL display the topic filter alongside existing position filters

### Requirement 11: Structured Data — Article and FAQ Schema

**User Story:** As a site owner, I want Article Schema JSON-LD added to post pages and FAQ Schema for question-titled posts, so that search engines and AI systems can better understand and cite the content.

#### Acceptance Criteria

1. THE Post_Layout SHALL include Article Schema JSON-LD markup on every post page
2. THE Post_Layout SHALL include author name (Hasan Jaffal), publish date, update date, and category in the Article Schema
3. WHEN a post title is phrased as a question (starts with Who, What, When, Where, Why, How, Will, Can, Should, Is, Are, Do, Does), THE Post_Layout SHALL include FAQ Schema JSON-LD in addition to Article Schema
4. THE Post_Layout SHALL include the post's primary keyword as the Article Schema `keywords` field

### Requirement 12: AI Crawler Rules in robots.txt

**User Story:** As a site owner, I want explicit AI crawler rules in robots.txt allowing AI systems to index public content, so that AI agents can discover, summarize, and cite articles.

#### Acceptance Criteria

1. THE robots.txt SHALL include explicit User-agent rules for GPTBot with Allow on public article paths
2. THE robots.txt SHALL include explicit User-agent rules for ChatGPT-User with Allow on public article paths
3. THE robots.txt SHALL include explicit User-agent rules for ClaudeBot with Allow on public article paths
4. THE robots.txt SHALL include explicit User-agent rules for Google-Extended with Allow on public article paths
5. THE robots.txt SHALL maintain existing Disallow rules for /newsletter/admin/ and /assets/pdf/

### Requirement 13: Source-Worthy Reference Pages

**User Story:** As a site owner, I want 7 standalone reference pages that serve as citable source assets, so that AI systems and other websites link to them as authoritative resources.

#### Acceptance Criteria

1. THE Post_Layout SHALL render 7 Reference_Pages: AI Job Risk Index, Dashboard Failure Checklist, Reporting vs Intelligence Framework, AI Operations Failure Patterns, Decision Ownership Model, Operational Escalation Framework, AI Adoption Failure Checklist
2. WHEN a Reference_Page is rendered, THE Post_Layout SHALL include concept definitions, tables, concise explanations, and operational frameworks
3. WHEN a Reference_Page is rendered, THE Post_Layout SHALL include internal links to related posts within the same position
4. THE Reference_Pages SHALL use clear headings, structured data, consistent terminology, and concise summaries optimized for AI extraction
5. THE Reference_Pages SHALL include Article Schema JSON-LD markup
6. THE Reference_Pages SHALL be linked from position pages and relevant articles

### Requirement 14: Post Front Matter Extension

**User Story:** As a site owner, I want extended front matter fields on posts, so that topic, archetype, and keyword metadata is stored and queryable by the site and admin panel.

#### Acceptance Criteria

1. WHEN a post is created, THE Generation_System SHALL include a `topic` field in the Front_Matter identifying the Layer_2_Topic
2. WHEN a post is created, THE Generation_System SHALL include an `archetype` field in the Front_Matter identifying the Article_Archetype used
3. WHEN a post is created, THE Generation_System SHALL include a `keywords` field in the Front_Matter listing primary and secondary keywords as a YAML list
4. THE Post_Layout SHALL use the `topic` field for filtering and clustering on position and writing pages
5. THE Admin_Panel SHALL use the `topic`, `archetype`, and `keywords` fields for duplication checking and coverage reporting
