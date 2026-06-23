---
layout: post
title: "Pre-Commit Decision Rights Before the Next Incident: AI Will Punish Slow Approvals"
subtitle: "Detection is cheap. Hesitation is expensive. Assign authority now or pay for it later."
share-description: "AI won’t fix your approval chain. It will expose it. Pre-commit decision rights, budgets, and thresholds before the next crisis—or let losses compound while you wait for consensus."
tags:
  - ai-decision-operations
topic: ai-topic
archetype: explain
author: Hasan J.
---

Write down the actions that must happen without a meeting: freeze spend, block a segment, roll back a model, shut an endpoint, quarantine a vendor. Put one name next to each. Give them a budget to act. If you won’t do this today, your next AI incident will be a live drill in how slow you are.

AI does not repair unclear ownership. It surfaces more problems faster. If signals trigger committees, you built a noise machine. The bill shows up as decision latency—minutes and hours where loss keeps compounding because nobody owns the cutoff.

Stop doing these immediately:
- Stop routing critical alerts to channels with 20 “FYI” watchers and no decider.
- Stop writing runbooks that describe steps but never say who can push the button.
- Stop shipping models without explicit thresholds that map to actions and owners.
- Stop stacking approvals (ops, risk, legal, finance) in series. In a crisis, serial means failure.
- Stop pretending “awareness” equals readiness. If the on-call can’t act, you are not ready.

Do this instead:
- Publish a one-page Authority Charter for each high-impact signal. It lists the trigger, the owner on call, the pre-approved actions, and the budget they control.
- Pre-commit thresholds and consequences. “If fraud score > 0.92 for 5 minutes, block BINs X/Y, require step-up on Z, auto-refund flagged orders under $100.” No meetings.
- Set escalation floors and ceilings. The owner must act up to $250k/day exposure. Over that, a named exec on-call is the tiebreaker in 15 minutes max.
- Instrument decision latency. Track time from signal to action. Report it weekly. If it grows, fix it like a Sev1.
- Run game days. Kill a region, poison a feature flag, spike a model’s false positives. Make people practice authority before they need it.
- Pre-wire legal and comms templates. “We shut off this endpoint under clause X. Here’s the pre-approved customer note.” Don’t draft while burning.

A real example: Black Friday morning, a marketplace I worked with lit up on card testing. 7:14 a.m. PT, fraud model flags a sharp rise from two issuers and a new proxy AS. Slack channel #fraud-war-room fills. Product, ops, finance, and a risk analyst join. Stripe and internal models agree: confidence is high.

The ops manager wants to block the BINs and require step-up auth for all new accounts. Finance asks for expected revenue impact. Legal asks if the TOS covers blanket step-up. Product says a full challenge will crater conversion and wants a segmented rule. Nobody knows who can decide. The CISO is on a plane. The VP of Ops is “five minutes out.” The meeting drifts to “can we get a quick cohort analysis?” It takes 47 minutes.

By the time a decision hits, $480k in fraudulent orders pass. Support tickets spike. Chargeback risk balloons. The fix is finally approved at 8:01 a.m. The team did good work. They were still slow, because authority was fuzzy.

Two weeks later they installed an Authority Charter. Fraud score > 0.9 for > 3 minutes across two issuers? The risk on-call can block those BINs, force step-up on new accounts, and pause gift card purchases up to $250k/day impact. No meeting. A named exec carries the budget from $250k to $2M with a 15-minute SLA. Legal pre-approved the customer wording. On the next spike, the action fired in four minutes. Losses were small. Yes, conversion dipped for an hour. That was the price of control.

Here’s the uncomfortable trade-off: you either accept controlled false positives and short-term revenue hits, or you accept uncontrolled losses and brand damage. There is no third option where everyone feels good and the graph only goes up. Pre-commit the pain you will take. If you won’t, the crisis will pick it for you.

Strong teams do five things differently:
- They attach money to authority. Owners know their spend/impact limit and don’t ask for permission inside it.
- They define tiebreakers. When two functions disagree, a single role decides. Disagree and commit is policy, not a poster.
- They measure decision speed, not just detection accuracy. They treat minutes saved as dollars saved.
- They train the muscle. Game days aren’t a show; they’re reps under realistic load with real systems.
- They prune watchers. Fewer people in the room. Clearer audio. Faster hands.

Average teams scale tooling and headcount to mask slow decisions. They add dashboards, more alerts, and Slack bots, then wonder why incidents still drag. They write runbooks that map steps but dodge authority. They celebrate “alignment” after an hour-long call that should have been a four-minute decision.

Your next step is not another model. It’s a pen and a calendar.

Write an Authority Charter for your top five signals:
- Signal definition, threshold, and confidence source.
- Named owner on-call, with rotation and backup.
- Pre-approved actions with exact scopes.
- Budget ceiling for unilateral action and the exec ceiling above it.
- Time-to-decision SLA and escalation timer.
- Pre-written legal/comms language.
- Audit: where actions are logged and who reviews within 24 hours.

Then schedule a 60-minute signing session with the actual deciders. No delegates. If someone can block but won’t sign, you found your failure point. Fix it or lower your ambition. After it’s signed, rehearse. Break glass on a quiet Tuesday and see if the pager answers.

One more thing to stop: shadow approvals. If your culture punishes people who act inside their charter, you will regress to meetings. Back your operators. Review after. Publicly.

AI will keep surfacing edge cases and spikes. Your edge is not a better model. It’s faster authority. Choose before the next hit: will you pre-commit decision rights with budgets and timers, or will you wait for “more data” while the meter runs?
