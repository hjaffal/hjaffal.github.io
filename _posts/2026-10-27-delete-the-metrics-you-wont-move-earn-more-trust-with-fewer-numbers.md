---
layout: post
title: "Delete the Metrics You Won’t Move: Earn More Trust with Fewer Numbers"
subtitle: "Reporting explains yesterday. Intelligence changes tomorrow."
share-description: "Most teams think more metrics mean more trust. The opposite is true. Cut every number that doesn’t trigger a decision, bind the rest to real authority, and watch trust rise as outcomes change."
tags:
  - risk-intelligence
topic: risk-topic
archetype: challenge
author: Hasan J.
tldr: "Most teams confuse transparency with trust. Flooding leaders with metrics no one will act on breeds cynicism and delay. I describe a real incident where a team killed dozens of dashboards, bound a small set of metrics to pre‑approved actions, and moved faster under pressure. The uncomfortable trade-off: accept some blind spots and give operators real authority, or keep museum dashboards and slow failures. Strong teams run an “Act or Archive” process, pair each metric with an owner, trigger, and lever, and keep a public graveyard for retired metrics. Decide now if you’ll delete every metric that lacks a named owner, trigger, and authority—yes or no."
---

2:07 a.m., incident bridge. Gift card balances draining across the marketplace. Fourteen dashboards open, every graph urgent and useless.

“Which of these tells me what to do right now?” the VP asked. Silence. Trend charts crawled. Status pings stacked. Customers were losing money in real time.

Elena, the on-call analyst, closed twelve tabs. “If we can’t act in five minutes, it’s theater.” She pulled up one metric: password reset attempts per minute from new devices, tied to a pre-approved lever—throttle resets for 30 minutes when the rate breaks X. She had the authority. She pulled it. The drain slowed, ticket volume stabilized, and the attackers moved on.

The next morning, the team didn’t celebrate. They held a funeral.

Most people believe more metrics mean more transparency and more trust. Show everything and people will feel safe. That belief dies under pressure. Transparency without authority is exposure. You watch the same bad thing happen with better resolution.

Here’s the counter-example. That marketplace ran a weekly risk review with a 50-page deck. No one decided anything in the meeting. The deck grew to satisfy every stakeholder. The day after the 2 a.m. hit, they cut the deck to seven metrics. Each survived for one reason: a bound action existed, with a named owner and real access to the lever. Meeting behavior changed overnight. Numbers led to moves, not notes. Trust went up because outcomes changed in the same hour as the conversation.

If a metric never triggers action, it’s decoration. Reporting explains what happened. Intelligence changes what happens next.

The hard part isn’t admitting you have dead metrics. It’s killing them without making people feel blind or ignored. Here’s how we did it without losing trust.

Announce Act or Archive. For 30 days, every metric must meet three conditions or it goes to archive: a named owner with authority, a pre-agreed trigger, and a specific lever. Owner, trigger, lever. No exceptions for “context” or “nice to know.” If people push back, tell them archival is reversible—resurrection requires adding the missing piece.

Create a public graveyard. We kept a read-only “Metric Cemetery” listing every retired metric, its last purpose, and the reviewer who archived it. Anyone could see it. Anyone could propose a resurrection. This kept the peace. We didn’t erase work; we admitted it wasn’t changing outcomes right now.

Bind the survivors. For each kept metric, we wrote one line in plain English: “If X>Y for Z minutes, [owner] executes [action] within [SLA].” We attached the runbook and confirmed the owner had the permission to pull the lever without a separate meeting. We also set a small blast radius limit for first moves to reduce fear.

Change the meeting. We banned metrics without a proposed decision attached to the agenda item. “Revenue by region” used to open every review. It disappeared until someone could state the decision they wanted to make with it that week. Attendance dropped, quality went up, and the meeting got shorter.

Protect a basics-only floor. People worry about blind spots when you cut. We kept three “sentinel” metrics with only one job: trigger a human look when they go extreme. They had no steady-state airtime. They only rang the bell when the floor fell out, and then we investigated with on-demand views.

Pre-approve the pain. Intelligence changes what happens next, which means some customers will feel it. We wrote down the friction we would allow: how many false positives per hour we’d tolerate to stop an obvious attack, how quickly we’d roll back a lever, and who would apologize to whom if we overshot. Adults sign these trade-offs in advance. That’s how you build trust.

Now the uncomfortable trade-off. You will miss something you used to see. You will be blamed for it. You will also stop a bigger, real problem faster because your operators aren’t wading through ornamental charts. You cannot have both infinite visibility and fast action under risk. Choose.

Average teams hoard metrics to avoid conflict. They measure in the passive voice. “Trend is up.” “Exposure is elevated.” They anchor trust to the thickness of the deck and the gloss of the dashboard. When asked who can act, they say, “We need alignment.”

Strong teams keep fewer numbers and make them bossy. They attach verbs to every chart. “If this moves, we pull that.” They pair each metric with a human who owns the lever and the consequence. They keep a small, public graveyard to reduce politics and an even smaller escape hatch to bring a metric back with teeth. Their meetings are short because decisions are pre-authorized.

Back to Elena. The week after the incident, she ran the first Act or Archive session. She asked one question per metric. “When this twitches, what do you do?” If the answer was “We watch it,” it died. If the answer was “We page the on-call,” she asked to see the page rule. If the answer was “We need to tell Legal,” she confirmed Legal had pre-cleared the move.

Forty-two widgets went to the cemetery. Eight stayed. The eight had names next to them and levers behind them. The next attack didn’t feel like theater. The operator pulled, the system bent, customers kept their money. People didn’t say “nice charts.” They said “thanks for moving.”

If you want to kill metrics nobody acts on without losing trust, don’t argue aesthetics. Argue consequences. Keep the graveyard public, the survivors bound to action, and the friction pre-approved. When people see numbers leading to moves—and moves explained before they hurt—they stop clinging to measurement as comfort.

So choose: this quarter, will you delete every metric that lacks a named owner, a trigger, and a lever—yes or no?
