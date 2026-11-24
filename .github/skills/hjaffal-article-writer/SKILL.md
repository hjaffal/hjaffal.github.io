---
name: hjaffal-article-writer
description: Write and edit articles for hasanjaffal.com that follow Hasan Jaffal's mission, reader topics, evidence standard, voice, metadata, and internal-link strategy.
---

# Write a Hasan Jaffal Article

Use this skill when creating, revising, or generating an article for `hjaffal.github.io`.
The goal is not to produce generic "AI content." The goal is to give a leader or working professional a clearer decision about an AI opportunity, investment, change in work, or business outcome.

## Source of truth

Resolve conflicts in this order:

1. `_data/writing.yml` for the four reader topics and their questions.
2. `aboutme.html` for the professional mission.
3. `scripts/generate_post.py` for the current article-generation contract and validation rules.
4. `_data/writing-config.yml` for supporting editorial vocabulary, topics, and ideas.
5. Recent `_posts/*.md` for current voice and duplication checks.

Do not import obsolete system text that conflicts with the current mission. In particular:

- The current mission is more measured than "AI replaces reporting jobs" or "AI is deleting work."
- Write for leaders deciding what to do, not for readers who only want hype or career fear.
- AI is a possible means to an outcome. It is never the outcome itself.
- Do not make documented claims that the source material cannot support.

## The mission

Help business leaders find opportunities AI makes possible and lead the transformation needed to realize them. Work with the people who know the business to test the opportunity, build the skills to put it into practice, agree on the business outcome before investing, and assess how much of the improvement can reasonably be attributed to AI and whether the investment was justified.

The reader should become more capable of making a specific decision. Useful ending states include:

- A leader has a bounded test they can approve.
- A manager knows which work and responsibility must change.
- An executive can compare alternatives and understand the full cost.
- A professional knows what evidence is needed before supporting or rejecting a change.

The site is not for:

- AI news summaries or hype.
- Coding tutorials.
- Startup advice or fundraising content.
- Productivity tricks.
- Generic leadership or motivational posts.
- Consultant-style transformation language.
- The claim that AI will automatically improve a team or business.

## Choose one reader topic

Every post has exactly one primary `reading_topics` value unless there is a strong, documented reason for a second topic. The four topics are:

| Topic ID | Reader question | Editorial role |
|---|---|---|
| `opportunities` | Where could AI make a difference? | Identify constrained work, new customer or business possibilities, and a bounded test. |
| `investment` | What deserves investment? | Compare AI with process change, alternatives, and doing nothing; count full cost and set stop/change rules. |
| `adoption` | What needs to change in the work? | Explain workflow, responsibility, skills, escalation, exception handling, and human override. |
| `value` | How do we judge the result? | Define the baseline and outcome, evidence, costs, trade-offs, attribution, and continuation rule. |

Before drafting, write down:

- One primary topic.
- One reader question.
- One central claim.
- One practical decision or behavior the reader should take away.
- One specific piece of evidence or reasoning that supports the claim.

Reject an angle if it is only an opinion, a restatement of an existing post, or an industry trend with no connection to an organizational decision.

## Duplication check

Before writing:

1. Search `_posts/` titles, excerpts, keywords, tags, and `reading_topics`.
2. Read the closest 5–10 articles.
3. Check whether the central argument, example type, framework, or headline has already been used.
4. If overlap exists, change one of these, not merely the wording:
   - The decision being made.
   - The reader or role.
   - The operational setting.
   - The alternatives being compared.
   - The evidence or measurement question.
   - The time horizon.

Do not publish a near-duplicate. A different title about "reporting versus intelligence" is not a new article if it makes the same claim.

## Diversify the archive

Balance format and treatment across recent posts:

- Rotate across `opportunities`, `investment`, `adoption`, and `value`.
- Vary opening types: incident, overlooked constraint, decision, comparison, or short practical observation.
- Vary practical formats: analysis, framework, checklist, scenario, measurement test, or numbered list only when numbering is genuinely useful.
- Keep the archive mix useful rather than mechanically forcing a ratio.
- Avoid recurring fake dialogue, repeated "a team I advised" scenes, military metaphors, or the same company or manager.
- Avoid repeating "strong teams versus average teams" in consecutive or closely related articles.
- Use a signature metaphor only where it clarifies the operational mechanism. Do not insert one to decorate the prose.

## Voice

The voice is natural, clear, thoughtful, direct, and human. The writer has experience in analytics and operational leadership, but should not name personal experience as fact unless it is verified by the author.

Use:

- Plain English and necessary technical terms, clearly explained.
- Contractions when they sound natural.
- "You" to address the reader.
- Short paragraphs and descriptive headings.
- Concrete workplace scenes with clear decisions.
- Controlled dry humor or bluntness when it fits.
- Specific verbs: decide, set, measure, compare, stop, change, own, escalate, reverse, or test.

Avoid:

- Academic pacing and overlong causal chains.
- Polished corporate copy.
- Buzzwords and breathless AI claims.
- The dramatic aggression of every paragraph being a challenge.
- Forced military imagery.
- "Revolutionary," "game changer," "unlock," "leverage," "digital transformation," "synergize," or "AI-powered solution."
- Forced imperfection, repetition, or short punch sentences used as a performance.

The article can be opinionated, but the opinion must be grounded in a real choice and evidence the reader can inspect.

## Evidence and examples

### Never invent

Do not invent:

- Statistics or percentages.
- Studies or source names.
- Customer outcomes or revenue claims.
- Personal anecdotes or professional experience.
- Attribution to an organization or person.
- A result claimed to have been observed if it is hypothetical.

### Label scenarios

Clearly mark made-up examples as an `illustrative example` or `illustrative scenario`. Never imply that an invented company, manager, or result is real.

Example:

> "An illustrative scenario: a field-service desk receives a repair request with only a photo and a vague description."

Use "could," "would need to show," "if," or "might" for assumptions.

### Cite factual claims

If a factual claim depends on a real study, report, event, or public decision:

- Link to the identifiable source.
- Describe the finding narrowly.
- Do not convert correlation into AI causation.
- Prefer primary sources or credible official reports.
- Separate:
  - Observed result.
  - Proposed explanation.
  - Hypothesis.
  - AI's contribution.

An external reference is optional for every article, but it becomes mandatory if the article relies on a factual market, workforce, or incident claim. The reference should support the argument, not serve as decoration.

## Article structure

Use 600–900 words as the current generation target, unless a focused post or the current validation contract explicitly requires another length.

For a standard article:

1. Open with a real problem or decision.
2. Add a direct answer block of 40–60 words near the top.
3. Present the tension or false assumption.
4. Explain the operational consequence.
5. Use a bounded example or compare alternatives.
6. Give the reader one clear recommendation or test.
7. Include a forced-position question only if it creates a genuine choice.
8. End with a relevant newsletter invitation.

The answer block should be:

- 40–60 words.
- Directly responsive to the title or central question.
- Included verbatim in the body after the opening.
- Natural in keyword use, not keyword-stuffed.
- Written as a blockquote if that fits the post.

Use 2–4 sentence paragraphs, descriptive `##` headings, bullets, and an occasional comparison table when the table clarifies a real choice.

Do not force every article through the same template, and do not force a table, list, quote, or operational checklist into it.

## Website positioning

The archive uses four substantive editorial layers:

- `opportunities`: can an organization recognize a useful possibility?
- `investment-decisions`: does the possibility justify its full cost compared with alternatives?
- `people-and-adoption`: can the people, skills, authority, and workflow make the change real?
- `outcomes-and-evidence`: did the change improve a defined outcome, and how strong is the evidence?

An article should connect to at least one of these questions. It should never stop at "AI can do X."

Useful sequence:

1. Start with work, customers, constraints, or a decision.
2. Define what could become possible.
3. Identify process change and non-AI alternatives.
4. Include the people responsible for the work.
5. Name costs and trade-offs.
6. Specify the evidence that would justify continuing, changing, or stopping.

## Front matter

Use this Jekyll front matter shape:

```yaml
---
layout: post
title: "Specific title"
subtitle: "Specific one-line proposition"
share-title: "Specific title"
share-description: "Accurate social description, 160 characters or fewer"
excerpt: "Short article preview"
reading_topics:
  - "opportunities"
keywords:
  - "primary keyword"
  - "secondary keyword"
  - "secondary keyword"
author: Hasan Jaffal
tldr: "Concise summary of the argument and actionable takeaway"
---
```

Rules:

- `title`: fewer than 150 characters.
- `share-description`: fewer than 160 characters.
- `excerpt`: fewer than 300 characters.
- `tldr`: no more than 100 words for the current generator contract.
- `reading_topics`: contain exactly the selected topic in current generated posts.
- `keywords`: exactly one primary and two secondary keywords.
- Add `article_image`, `article_image_alt`, and `article_image_caption` only for a meaningful image that adds context.
- Preserve existing front matter conventions in older posts unless the task is migration or repair.

## SEO

Use one primary keyword and two secondary keywords. Use them naturally in:

- The title.
- The opening.
- At least one heading.
- Supporting explanations where relevant.

The title should combine search accuracy with curiosity or a useful tension. It should not use a bait-and-switch.

Avoid stuffing the keyword or repeating the same wording every few paragraphs.

Use:

- Descriptive headings.
- Question titles when the article genuinely answers a question.
- A concise answer block.
- Clear comparisons and definitions.
- Metadata and structured data that match the body.

Do not treat search formatting as permission to create a generic article. Use it to make a distinct article easier to understand.

## Internal linking

Every article must have at least two distinct internal Markdown links. Natural context is mandatory.

Use `_data/writing.yml` topic URLs and recently relevant existing post URLs. At least one link should usually connect to the reader topic or a relevant article; at least one other should support the argument or direct the reader to a practical next step.

Current core destinations include:

- `/topics/opportunities/`
- `/topics/investment-decisions/`
- `/topics/people-and-adoption/`
- `/topics/outcomes-and-evidence/`
- `/ai-job-risk-analyzer/`
- `/future-proof-skills-assessment/`
- `/writing/`
- `/newsletter/`

Internal-link rules:

- Do not invent URLs.
- Do not rewrite `/topics/` paths.
- Link only to pages that exist or are intentionally introduced elsewhere.
- Do not force a tool link where the article has no job-exposure or skill-gap relevance.
- Do not add empty or repetitive cross-links.
- End with a useful newsletter link to `/newsletter/`.
- Use recent posts naturally instead of a list of unrelated articles.

CTA example:

> "If you want to follow the next article in this series, [read The Second Mind by email](/newsletter/)."

Do not claim a subscriber count or publishing frequency unless it is verified.

## Existing article types

### Opportunity

Start with constrained work or a customer problem. Explain what could change and propose a bounded test. Include alternative approaches and uncertainty.

### Investment

Compare AI with process changes, a smaller use case, another tool, and doing nothing. Count implementation, integration, review, training, support, rework, and downside costs. Agree on evidence that would continue, change, or stop the investment.

### Adoption

Describe who does the work, who owns exceptions, what skills change, how employees question or override AI, and how the operating process changes. Do not assume training alone solves adoption.

### Outcomes and evidence

Define baseline, outcome, counter-metric, attribution method, and cost. Distinguish a usable improvement from a temporary or coincidental change.

### Contrarian article

State the common belief, explain the defensible counterargument, show an operational mechanism, and give the reader a test or decision. Do not provoke for the sake of attention.

### Framework

Name a framework only if it improves recall or application. Keep steps limited, measurable, and understandable. Show one practical application.

## Pre-draft checklist

Answer these in notes, not necessarily in the article:

- What is the single reader question?
- What is changing in the real work or decision?
- What is the central claim?
- What belief or assumption does it challenge?
- What alternatives are relevant?
- Who owns the decision or work?
- What could go wrong or create an unintended cost?
- What evidence would change the conclusion?
- What recent post might overlap?
- Which existing page or post will be linked naturally?

## Writing workflow

1. Determine the topic and article angle.
2. Run the duplication check.
3. Choose one archetype and a distinct opening.
4. Gather or verify external evidence if needed.
5. Draft the answer block and opening.
6. Build the argument and operational consequence.
7. Add one realistic or clearly illustrative example.
8. Add one practical recommendation or test.
9. Add at least two internal links.
10. Write metadata.
11. Run the editorial checklist.
12. Build or test the Jekyll site if the article is being committed.

## Editorial checklist

Before delivering or publishing, explicitly check:

- [ ] Fits exactly one primary reader topic.
- [ ] Reflects the professional mission.
- [ ] Starts with a real work, customer, or business decision.
- [ ] Includes a 40–60 word answer near the beginning.
- [ ] Contains a defensible central claim, not a trend observation.
- [ ] Considers alternatives, cost, or uncertainty where relevant.
- [ ] Clearly labels any illustrative example.
- [ ] Makes no unsupported factual claim.
- [ ] Has a natural, direct, human voice.
- [ ] Does not use forbidden or stale buzzwords.
- [ ] Uses 600–900 words unless the task or validator specifies another range.
- [ ] Uses descriptive headings and scannable paragraphs.
- [ ] Includes at least two distinct, valid internal links.
- [ ] Includes a newsletter CTA with `/newsletter/`.
- [ ] Uses one primary and two secondary keywords naturally.
- [ ] Avoids the central argument or title of recent articles.
- [ ] Varies the structure and example type from recent posts.
- [ ] Includes the right Jekyll front matter.
- [ ] Separates evidence, assumptions, and illustrative claims.
- [ ] Ends with a useful question or decision readers can act on.

## Example transformations

Weak:

> "AI is revolutionizing field service. Teams should leverage AI to unlock faster repairs."

Good:

> "AI could shorten repair intake if it consistently connects a vague customer request to the right equipment record. Test that task against the current workflow and a structured checklist. Measure time to a correct next step, wrong matches, and the work required to verify suggestions."

Weak:

> "Strong leaders embrace AI and weak leaders resist change."

Good:

> "A leader needs to decide which alternative is justified: a process change, a narrowly scoped AI test, another tool, or no change. The decision should be based on full cost and a result the organization can actually measure."

Weak:

> "AI is changing analytics careers."

Good:

> "Analytics roles are becoming less valuable when the work is limited to formatting reports and repeating status updates. A role is harder to replace when it owns thresholds, trade-offs, escalation, and a result the organization must defend."
