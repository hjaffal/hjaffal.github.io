---
layout: post
title: "6 Tests Every Metric Must Pass to Change What Happens Next"
subtitle: "Reporting explains what happened. Intelligence changes what happens next. Use these tests to turn dashboards into orders."
share-description: "Most dashboards report the past. Intelligence orders the next move. Here are six tests to make every metric trigger action, not applause."
tags:
  - risk-intelligence
topic: risk-topic
archetype: structure
author: Hasan J.
tldr: "Most teams drown in reporting that explains yesterday. Intelligence is different: it changes tomorrow. Use six tests to force every metric to answer three hard questions—what decision it drives, who owns that decision, and when it triggers—then bind it to an action path, a trade-off you accept, and a review that keeps it honest. Strong teams pre-commit owners, cutoffs, and consequences; average teams add annotations. If your metrics don’t move hands and budgets in minutes, they’re decoration. Make them issue orders."
---

02:13 a.m. The payouts channel lights up. A marketplace’s fraud signals push into orange; the queue for instant withdrawals swells. An analyst scrolls a neat dashboard that explains the last hour perfectly. It doesn’t tell anyone what to do.

Five minutes later, the on-call risk lead flags a pre-agreed cutoff: risk index > 72 for five straight minutes triggers auto-hold. They flip the feature flag, route withdrawals to manual review, and post the incident note. By 7 a.m., finance sees a short spike in holds—and no wave of reversed payouts.

This list matters because that 12-minute window is where careers are made or burned. Reports pacify. Intelligence commits. If your metrics don’t trigger action, they’re decoration.

## 1. Tie each metric to a decision you can make now
Average teams describe the world; strong teams bind a number to a move. If a metric doesn’t point to a decision you can take in the next hour, it’s not intelligence—it’s trivia.

Example: “Login failure rate” isn’t a story; it’s a fork—tighten challenge flow, throttle an IP range, or page auth engineers.

## 2. Name the single owner with the authority to act
A metric without an owner is a group project in disguise. Strong teams pre-assign one person who is both on-call and authorized to pull a lever; average teams tag three channels and wait for consensus.

Example: “Owner: On-call Risk Lead” beats “FYI @risk @ops @payments” when chargeback rate crosses a threshold at midnight.

## 3. Set the trigger and the consequence in the same sentence
Intelligence is a contract: when X, do Y. Document the cutoff, the time window, and the exact action, so no one invents policy at 2 a.m.

Example: “If payout risk_index > 72 for 5 consecutive minutes, auto-hold new withdrawals and downgrade limits to $200 until cleared by Risk.”

## 4. Choose your pain: false positives or false negatives
You can’t be safe and smooth at the same time. Strong teams make the trade-off explicit and live with the cost; average teams drift into a mushy middle and pay both ways.

Example: During a holiday promo, you accept a 1% customer friction uptick (FP) to cut high-velocity refund abuse (FN), and you brief support on the script before launch.

## 5. Wire the alert to the channel that moves humans and code
Metrics that matter don’t whisper—they page. Strong teams connect thresholds to an incident channel, a runbook, and a feature flag; average teams drop screenshots into weekly reviews.

Example: “Checkout latency p95 > 800ms for 3 minutes” triggers PagerDuty, posts the runbook link, and flips traffic off the new service via a pre-made toggle.

## 6. Hold a ruthless keep/kill review and adjust the cutoffs
Intelligence decays. Strong teams meet weekly to kill dead metrics, ratchet thresholds, and record the decision; average teams grow dashboard museums.

Example: Every Monday, the ops lead spends 15 minutes on a metrics doc with three columns: “Cutoff,” “Owner,” “Keep/Kill.” Dead metrics are archived on the spot.

Why this standard beats reporting: it converts signals into orders. In the marketplace incident, the metric did not explain the past; it executed a pre-committed choice under pressure. The team paid an explicit cost—more manual reviews overnight—to prevent a larger loss when volume spiked. That’s the uncomfortable trade-off strong operators accept because they choose where to bleed.

Here’s what strong teams do differently from average teams:
- They write metrics as decisions with owners and cutoffs, not as charts with colors.
- They argue about thresholds in daylight so they can act in the dark.
- They rehearse flipping controls so the first time isn’t during a live fire.

And they document every trigger-consequence pair in plain language. No heroics. No wisdom-of-the-crowd Slack threads. Just a simple contract: if this number crosses that line for this long, this person does this thing, then tells these people.

Use the six tests as a gate. If a metric fails any one of them, it’s not intelligence yet. Fix it or delete it. The cost of indecision at 2 a.m. is always higher than the discomfort of choosing at 2 p.m.

Will you bind every critical metric to a decision, an owner, and a trigger this quarter—or keep shipping reports that never move a hand?
