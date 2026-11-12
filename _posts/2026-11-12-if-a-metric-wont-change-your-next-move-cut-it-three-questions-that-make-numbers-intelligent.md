---
layout: post
title: "If a Metric Won’t Change Your Next Move, Cut It: Three Questions That Make Numbers Intelligent"
subtitle: "Reporting describes the past. Intelligence dictates the next action."
share-description: "Most teams worship dashboards. Strong teams force numbers to trigger moves. Use three hard questions and a one‑week playbook to turn metrics into decisions—or delete them."
tags:
  - risk-intelligence
topic: risk-topic
archetype: write
author: Hasan J.
tldr: "Most teams confuse reporting with intelligence. Reporting explains what happened; intelligence changes what happens next. If a metric can’t trigger a move with a clear owner, lever, and accepted downside, it’s decoration. Use three questions to qualify every metric, then run a six-step playbook this week: inventory metrics, write decision cards, set thresholds and timers, pre-approve levers and authority, log actions, and prune ruthlessly. Strong teams don’t add charts—they remove everything that doesn’t force a decision under risk."
---

Most teams believe more reporting equals better control. They’re wrong. Reporting explains yesterday. Intelligence changes tomorrow.

If a number doesn’t force a move, it’s set dressing for slides. Pretty, polite, and useless when it’s time to pull a lever.

Here are the three questions every metric must answer to qualify as intelligence:

1) What decision does this metric trigger, at what threshold, and who owns the call within how many minutes?
2) Which lever will we pull immediately when it fires, and by exactly how much?
3) What downside are we willing to accept to move it, and how will we measure that cost in parallel?

If you can’t answer all three in one breath, you don’t have intelligence. You have a scoreboard without a coach.

A real workplace example:

Last November, at 10:41 a.m., a mid-market marketplace in Austin saw a spike in new-account coupon abuse. The weekly fraud review had a clean chart: “Promo misuse attempts +38%.” People nodded. No one moved.

By 12:05 p.m., support tickets ballooned. The on-call analyst, Carla, could see the spike in self-serve dashboards but had no authority to tighten the “one-per-user” rule. Policy said to wait for the growth lead because conversion might drop. Growth was in a customer meeting. Abuse kept climbing.

A month earlier, the team had defined only “reporting.” The metric existed. The decision did not.

In January, they changed it. They rewrote the metric card for “Promo abuse rate (per 1,000 sign-ups)” to answer the three questions:

- Decision/Owner/Timer: If abuse rate > 7/1,000 for 15 minutes, on-call risk owns a 30-minute decision.
- Lever: Increase phone verification strictness from medium to strict, and block VPN ASNs 3–5 for two hours.
- Downside accepted: Up to 0.9% drop in same-day conversion; track with counter-metric in the same panel.

In February, the spike returned at 9:13 a.m. Carla flipped the levers by 9:21. Abuse fell within 20 minutes. Conversion dipped 0.6% for two hours. Finance synced later, and they kept the setting for the day.

Same data. Different rules. Intelligence, not reporting.

The uncomfortable trade-off you must face:

You either accept some immediate pain—friction, false positives, angry sales—or you accept unbounded loss and slow death by committee. You cannot keep both high conversion and zero abuse during an active attack. You pick the wound you will treat and you write it down in advance so the operator can cut without asking permission.

Strong teams vs average teams:

Average teams decorate dashboards, then ask for alignment. They set “targets” but never sign the authority to pay the cost of hitting them. When risk shows up, they escalate, they wait, and they postmortem.

Strong teams prune until every remaining metric owns a decision, a lever, and a priced downside. They pre-approve moves and timers. They log actions and costs as first-class data. They are proud of what they delete because what remains actually moves money and risk.

A practical playbook you can run this week:

1) Inventory and kill: Export your top 30 metrics. For each, try to answer the three questions in writing. If you can’t fill all three fields in 60 seconds, park or delete it. Aim to cut at least a third.

2) Write decision cards: For the survivors, create a one-page metric card with owner, threshold, timer, lever change (with specific increments), and the accepted downside with its counter-metric. Store these where your on-call lives, not in a wiki graveyard.

3) Set timers and pages: Add time bounds to alerts. “X exceeds Y for Z minutes” should page the owner with the decision card linked. If there’s no page and no timer, it’s a newsletter, not an alert.

4) Pre-approve levers and authority: Get explicit sign-off from legal, finance, and growth on the exact lever changes and the max downside you’ll accept without a meeting. Put the approval in the card. If you need a meeting during an incident, you already lost.

5) Instrument the decision, not just the data: Create a simple form or script that logs when an alert fired, who acted, what lever moved, how fast, and both the primary metric and the counter-metric over the next two hours. This is your accountability layer.

6) Weekly cut and sharpen: Review every fired alert and every ignored one. If an alert never fired in 30 days, consolidate or retire it. If it fired but didn’t lead to a move, fix the lever, authority, or threshold. Celebrate deletions and tighten the rest.

Notes on the three questions in practice:

- Decision specificity beats model precision. A 72% accurate signal with a pre-approved lever will often outperform a 94% model stuck behind approval.
- The lever must be measurable and reversible. “Call the vendor” is not a lever. “Raise KYC threshold from 0.65 to 0.72 for 4 hours” is.
- The priced downside prevents cowardice and panic. Without it, you either never act or you overreact. With it, the operator acts within guardrails.

Common objections, answered:

- “But we need full context.” You need enough context to act within the timer. Full context is for the retro.
- “This might hurt conversion.” Yes. That’s the cost you priced in. You chose it on a calm day so you can execute on a hot one.
- “We can automate later.” Great. First, prove the decision and the lever work manually. Then automate what’s real.

Stop trying to make perfect dashboards. Make reliable moves. The gap between reporting and intelligence is not data quality—it’s owned decisions, ready levers, and priced costs.

Pick your side now: Do you want a dashboard that tells a story about yesterday, or a console that forces a move in the next 10 minutes?
