---
layout: post
title: "Can AI Make Product Returns Useful? A Small Test to Turn Free‑Text and Photos into Fixable Causes"
subtitle: "Start where work is bottlenecked by unstructured information and prove whether better tags change real decisions."
share-title: "Can AI Make Product Returns Useful? A Small Test to Turn Free‑Text and Photos into Fixable Causes"
share-description: "A practical, two‑week test to see if AI can turn returns text and photos into consistent causes that drive fixes."
excerpt: "Where could AI make a difference? Start where work is constrained by unstructured information. In product returns, a short, bounded test can show whether AI-generated cause tags are reliable enough to change packaging, policies, or design—and whether that change is worth paying for."
reading_topics:
  - "opportunities"
keywords:
  - "AI opportunities"
  - "product returns analysis"
  - "unstructured data"
author: Hasan Jaffal
tldr: "Begin with work constrained by unstructured information. In product returns, test whether AI can turn text and photos into consistent, fast cause tags that trigger specific fixes. Keep it two weeks, focus on a small SKU set, pre-commit action rules, and measure whether better tagging actually changes outcomes before investing."
---

Leaders ask where AI could make a difference. A reliable place to look: work that depends on reading, interpreting, and re-typing unstructured information (free‑text, images, PDFs) into the systems where decisions get made. Product returns are full of it.

> Start where work is bottlenecked by unstructured information. In product returns, AI can help convert free‑text and photos into consistent cause codes fast enough to drive fixes. Run a two‑week, SKU‑focused test with clear action rules and human adjudication to see if better tags change packaging, policies, or design decisions.

Illustrative scenario (not a documented case): a retailer receives returns with short descriptions ("too small," "arrived damaged"), optional photos, and agent notes. Coding the reason is inconsistent and slow. Product and operations teams want to fix packaging, instructions, or product specs, but the signal is noisy and late.

What could change for customers or the business
- Faster, more consistent tags: AI can read text and photos to assign cause codes you already use. That consistency lets you size the problem by SKU and step.
- Actionable specificity: not just "damaged," but "corner crush," "seal failure," or "barcode unreadable." Precision helps you pick the cheapest effective fix.
- Shorter loops: if tagging happens within hours, you can trial packaging or content changes next week, not next quarter.

Start from the work and its constraints
- Information: reasons are in free‑text and images across systems (returns portal, WMS, CS tools). They are hard to join and normalize.
- Time: analysts and agents can’t read everything. They rely on defaults and heuristics.
- Capacity: even when patterns are spotted, there isn’t enough evidence at SKU level to justify a change.

A practical, bounded test (two weeks, two SKUs)
1) Scope
- Choose two high‑volume SKUs with meaningful return counts and plausible, fixable causes (e.g., sizing confusion, fragile corners, missing part).
- Limit to two weeks of incoming returns plus a 200‑record historical sample for calibration.

2) Data and access
- Collect: return text reason, agent notes, photos, SKU, order date, fulfillment node, and current cause code (if any).
- Keep data in your environment. Use a standard vision+text model or vendor; no PII beyond what is already processed for returns.

3) Labels and adjudication
- Assemble a small panel (returns ops lead, product/packaging engineer, one senior agent). They define a sharper cause taxonomy for the two SKUs (10–15 codes max) and adjudicate a 150‑record “gold set.” This is your accuracy yardstick.

4) Model and workflow
- Use off‑the‑shelf models to generate a cause code per return from text and photos, with a confidence score and short rationale.
- Route low‑confidence cases to a human for review. Keep a 10% random sample of high‑confidence cases for spot checks.

5) Pre‑commit the action rules
- Agree the actions before you start. Examples:
  - If ≥25% of SKU A’s returns in the test are tagged “size confusion,” product owner updates the size chart and product page within two weeks.
  - If ≥10% of SKU B are “corner crush,” ops trial stronger corner protection in one DC for one week.
- Assign owners and dates. This aligns with the discipline in [Outcomes & evidence](/topics/outcomes-and-evidence/) and helps avoid “interesting findings that don’t move anything.”

6) What to measure
- Tag quality: agreement with the gold set; disagreement categories that matter to decisions.
- Cycle time: time from return initiation to usable cause tag.
- Action rate: percent of AI tags that meet a pre‑agreed threshold and actually trigger the action rule.
- Business signal change: after the intervention window, did the measured cause rate for the affected SKU shift in the expected direction in the treated node or page variant?
- Cost to operate: incremental cost per return analyzed and per action triggered.

What this test will teach you
- Data sufficiency: Do you have enough text/photos by SKU to see a pattern you would pay to fix?
- Operational fit: Can your team act on tags within their current remit, or do you need decision rights you don’t have? If yes, see [People & adoption](/topics/people-and-adoption/).
- Investment logic: Is better tagging alone enough to justify spend, or do you need adjacent changes (packaging suppliers, PDP updates)? Tie the go/no‑go to your criteria in [Investment decisions](/topics/investment-decisions/).

Costs, trade‑offs, and alternatives
- Misclassification risk: Keep human adjudication for low‑confidence and spot checks. Track where errors would lead to the wrong spend.
- Privacy and safety: Avoid processing unnecessary PII. Mask addresses in photos.
- Integration effort: You may get most value by exporting a daily CSV for the test rather than wiring APIs on day one.
- Simpler first change: In parallel, you might standardize the return reason form or require a photo for “damaged” claims. If that alone gives you enough signal to act, you may not need AI here.

Accountability and uncertainty
- Make the uncertainty visible: upfront error bars, confidence scores, and where the model struggles (e.g., low‑light images).
- Separate the AI’s contribution: Did improved tagging cause the packaging change, and did that change reduce the targeted cause rate? Keep those steps distinct in your notes and readout.

A decision you can take back to your business
- Will we run a two‑week, two‑SKU returns tagging test with pre‑committed actions, defined owners, and a gold‑set adjudication? If yes, who owns each action rule, what are our go/no‑go thresholds, and what budget/time are we willing to spend if it works?

If you’re exploring where AI is worth testing next, see [Opportunities](/topics/opportunities/) and how to make evidence stick in [Outcomes & evidence](/topics/outcomes-and-evidence/).

Get future practical tests and decision guides by email: [/newsletter/](/newsletter/)
