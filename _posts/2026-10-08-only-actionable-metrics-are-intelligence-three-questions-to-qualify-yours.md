---
layout: post
title: "Only Actionable Metrics Are Intelligence: Three Questions to Qualify Yours"
subtitle: "Reporting tells you what happened. Intelligence decides what happens next. Make every metric issue an order—or cut it."
share-description: "Most dashboards are museums. If a metric can’t trigger a move, it’s decoration. Here are the three questions that turn reporting into intelligence—and the failure pattern that keeps teams stuck in status updates."
tags:
  - risk-intelligence
topic: risk-topic
archetype: analyze
author: Hasan J.
tldr: "Dashboards don’t stop loss; decisions do. Most teams confuse reporting with intelligence, then wonder why nothing changes in a crisis. The fix is simple and hard: bind each metric to an owner, a trigger with a time window, and the capacity you’ve pre-committed to act. This turns data into orders, not updates. Strong teams prune dead metrics, rehearse 2 a.m. moves, and accept a clear trade-off: some good users will get friction so the business survives. Decide now—convert or cut every metric that can’t answer the three questions."
---

2:11 a.m. The payments Slack channel lights up—chargebacks climbing, new device clusters from the same ASN, promo abuse doubling. The on‑call analyst drops screenshots into the thread. People pile in with heatmaps and trending lines. Nobody touches the cutoff.

By 3:00 a.m., the fraud run is obvious. Ops asks if they can slow onboarding or raise the risk score threshold for the promo. Product says they need a ticket and a sign‑off. Legal wants to document the rationale first. Everyone says “good catch.” Nobody acts before dawn.

At 9:00 a.m., the war room agrees on what the night already told them. They push a temporary rule, pause the promo, and send a note to Support. Losses are “unfortunate but expected.” The dashboard gets a new tab.

This is the failure pattern. We’ve trained teams to believe that a clean chart is a job well done. Reporting explains what happened. Intelligence changes what happens next. If a metric can’t move a hand, it’s decoration.

The systemic root cause isn’t ignorance. It’s structure. We build metrics for visibility, not authority. We separate the people who see the signal from those who own the lever. We budget for dashboards, not for capacity to act at 2:00 a.m. And we celebrate “no surprises” more than fast, reversible moves.

In these systems, a metric is innocent. It has no owner, no trigger, and no pre‑committed resources. So it can only inform meetings. At best, it fuels a post‑mortem. At worst, it becomes wallpaper.

If you want metrics to qualify as intelligence, each one must answer three questions before it’s allowed onto a critical dashboard:

- Who owns the next move, and do they have the authority to make it without asking? Name one person, not a team.
- What exact action will fire at what threshold, within what time window? Define the trigger, the action, and the SLA to act.
- What capacity and collateral are pre‑committed to execute, and what are we willing to sacrifice? People, rate limits, budget, customer friction—and what will stop to make room.

Back to the night shift. In one company I worked with, a “bad‑card velocity” metric sat front‑and‑center in the fraud dashboard. It trended beautifully and was reviewed daily. During holiday promos, the line spiked right on schedule. The on‑call analyst flagged it. Nothing happened because the metric had no action map.

Ownership? “Fraud” owned the analysis, “Product” owned thresholds, “Compliance” owned documentation, “Support” felt the pain. Authority diffused.

Trigger and window? The rule said “monitor and escalate.” It didn’t say “if velocity > X for Y minutes, pause promo Z within 10 minutes.” No timer. No order. Just attention.

Capacity? The onboarding service had no rate‑limit switch anyone on‑call could flip. Support had no prewritten macros for a pause. Legal had no pre‑approved template for a risky move. Everyone was working, but the system had no muscle memory.

Contrast that with a team that treats metrics as levers, not lenses. Their fraud velocity metric has a card under it: Owner: Priya (on‑call). Trigger: >1.5x baseline for 15 minutes. Action: Raise promo risk threshold by 20 points, auto‑pause affiliates A/B, notify Support. SLA: 5 minutes. Capacity: On‑call can allocate up to N% false‑positive impact for 24 hours without sign‑off. Rollback: Auto‑revert after 2 hours of baseline.

When the line starts to climb, Priya doesn’t post a chart. She flips the switch, writes a two‑line note, and goes back to watching the slope. The promo runs a little colder. A few good users hit friction. The business keeps its weekend.

Here’s the uncomfortable trade‑off you have to face: either you allow some good users to feel pain when the metric fires, or you accept bigger, slower losses while you curate consensus. There is no third path. Intelligence is judgment with consequences.

Average teams avoid that trade‑off. They keep soft language around metrics. They “monitor,” “flag,” and “share updates.” They push the hard decision up the chain and hide behind process words because process words can’t be wrong.

Strong teams do three things differently:

- They bind every critical metric to a named owner with authority to act alone inside a pre‑agreed band. No committees at 2:00 a.m.
- They define triggers, actions, and time windows in plain language. The dashboard itself tells you what will happen, not just what is happening.
- They reserve capacity. That means rate‑limit switches, on‑call coverage that can execute, budget earmarked for surge work, pre‑approved customer messaging, and the will to accept temporary friction.

They also run drills. Once a quarter, they simulate the spike, watch the metric cross the line, and time the move. If it takes longer than the loss window, they adjust the trigger or add a lever. If a metric can’t order a move, they cut it from the board and reduce noise.

None of this is fancy. It is paperwork and courage. You write the rules while you’re calm so you can act when you’re not. You pick the losses you’ll tolerate before someone else picks them for you.

If you lead AI, data, or risk, audit your dashboards this week. For each top metric, ask the three questions. If you can’t answer all three in one minute, you don’t have intelligence—you have a slideshow.

Decide now: will you convert or cut every metric that lacks an owner, a trigger with a time window, and pre‑committed capacity in the next 30 days?
