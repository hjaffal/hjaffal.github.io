---
layout: post
title: "Build a 2 A.M. Decision System That Works Without You"
subtitle: "AI exposes weak ownership. Here’s the minimum setup that acts when no manager is online."
share-description: "AI doesn’t fix slow approvals or unclear owners. It exposes them. Here’s a blunt, minimum system that makes decisions at 2 a.m. without a manager: thresholds, authority, timers, reversible actions, and audit. Pick: execute and own the fallout, or wait and pay for delay."
tags:
  - ai-decision-operations
topic: ai-topic
archetype: describe
author: Hasan J.
tldr: "AI speeds detection. It does not grant authority. At 2 a.m., detection without decision power is expensive noise. This post lays out the minimum viable system that actually works when no manager is online: a small set of signals tied to pre-approved actions, hard thresholds and timers, clear spend/risk caps, reversible-first automation with real write access, and a tight audit/rollback loop. Strong teams ship this and drill it. Average teams argue in Slack and wake up to losses. You have to pick the trade-off: tolerate some false positives and own them, or bleed while waiting for permission."
---

2:11 a.m., Friday. The model flags a 5x spike in refunds tied to two prepaid cards and a promo code. The on-call analyst sees it, posts in Slack, tags a manager, and waits. Finance is asleep. Marketing is offline. Legal is not on-call. By 6:00 a.m., $87,400 is gone and a cohort of abusers taught your system it can be farmed.

AI didn’t fail. Your decision system did. Detection without decision power is expensive noise.

You cannot “improve comms” or “tighten SLAs” and hope for better nights. The only system that works at 2 a.m. is one that can act with no new approvals. That requires real authority, not vibes.

Here’s the minimum viable version that actually works.

1) Name the signals, and tie each to a single action.
- One owner per signal. Not a committee.
- Each signal is a contract: “If X crosses Y for Z minutes, do A now.” Not “alert and discuss.”
- Kill 80% of your alerts. If a signal can’t trigger an action, it isn’t a signal. It’s a report.

2) Assign hard authority and budgets.
- The on-call role (human or automation) holds the keys up to a cap: “Can incur up to $50k revenue hit per night to prevent larger loss.”
- Publish this. If you can’t put a number on it, you don’t have authority—you have theater.

3) Set thresholds and timers before the incident.
- Cutoffs are specific: “Refund rate > 2.5x baseline for 10 minutes with >200 events.”
- Timers are ruthless: “60 seconds to human-ack. If no ack, automation executes.”
- Irreversible actions require two independent sensors. Reversible actions fire on one.

4) Ship reversible-first actions with write access.
- Auto-pause promos. Throttle sign-ups by source. Require 2FA on suspect cohorts. Cap order value. Switch to safe payment rails. All reversible.
- The automation account needs production write rights. If it can’t change state, your “AI ops” is just a siren.
- Backout is one command: “resume_promo PROMO123” or “throttle_signups off.” ChatOps, not tickets.

5) Bundle evidence with every action.
- Attach the snapshot: metric deltas, top offenders, cohort breakdown, the exact query. No dashboards to hunt.
- Freeze the evidence with the action so you can audit without re-running flaky data later.

6) Log the decision and do a 9 a.m. cut-and-dry review.
- Write who/what/when/why to an immutable log.
- In the morning, judge the call by the pre-set rules, not by outcomes alone. Adjust thresholds if needed. Keep or kill the signal.

7) Drill monthly at 2 a.m.
- Ten-minute tabletop: run the play for real in staging and once in prod on a low-impact control (e.g., throttle a sandbox source). If it breaks, fix it that day.

A real example from a food delivery marketplace I worked with:

Before: Marketing launched a “$20 off 3 orders” promo. Abusers chained prepaid cards and VPNs. The model flagged it. On-call posted. Marketing had the permission to pause; they weren’t on-call. Finance had the authority to cap; they were not in the room. Loss: $90k, plus mornings of finger-pointing.

After: We named a signal: PROMO-DRAIN-01. Rule: “Refunds + promo usage > 3x baseline, cohorts concentrated in top 3 ASNs, duration 7 minutes, n>150.” Action: auto-pause affected promo for 30 minutes and force 3DS on the cohort. Timer: 60 seconds for human-ack, then execute. Authority: on-call allowed up to $40k nightly revenue impact. Backout: /resume_promo PROMOID. Evidence: top segments, chargeback overlap, method-of-payment mix, diffs vs previous 24 hours.

Two weeks later, 2:07 a.m., pattern repeats. The system pauses the promo, applies 3DS to the noisy segment, and throttles sign-ups from three ASNs. Loss contained to $6k. A handful of angry tweets. We slept. In the morning, we adjusted the ASN list and tightened the timer to 45 seconds.

That is the point: trade pain you can afford now for pain you can’t afford later.

The uncomfortable trade-off: you either accept false positives and some customer anger, or you accept real loss and a reputation among abusers that you are slow. Pick one. Pretending there’s a perfect setting is how you end up paying both bills.

What strong teams do differently:
- They measure time-to-decision, not time-to-detection. The clock stops when the system changes state.
- They grant production write access to automation and on-call humans with audit, not with endless approvals.
- They keep the action catalog tiny, reversible, and tested. They don’t ship 30 options no one uses under stress.
- They publish a one-page “use of force” policy: what the system can do, up to what cost, for how long.
- They back the on-call when a good-faith call turns out wrong. They fix the rule, not the person.

Average teams do the opposite:
- They flood Slack with screenshots and ask for “quick eyes.”
- They route authority to whoever is awake, not to the role designed to decide.
- They confuse dashboards with decisions. They think more features beat clear thresholds.
- They set timers for comfort, not for risk. Minutes turn into hours. The loss curve doesn’t care.

If you want this running next week, here’s the bare bones:
- Pick three signals that correlate to real loss. Tie each to one reversible action.
- Write the threshold, timer, and cap in plain English. Publish it.
- Give the automation account write access for those three actions. No exceptions.
- Build ChatOps commands for execute and backout. Log everything.
- Run a 30-minute drill at 2 a.m. Fix whatever breaks. Repeat monthly.

AI will keep finding problems faster. Without authority, you only pay for better alarms. So choose: will your 2 a.m. system execute and apologize when needed, or will it wait and explain the losses at 9 a.m.?
