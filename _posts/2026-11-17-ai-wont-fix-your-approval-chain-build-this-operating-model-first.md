---
layout: post
title: "AI Won’t Fix Your Approval Chain: Build This Operating Model First"
subtitle: "If the person who sees the signal can’t pull the lever, your AI is a siren with no brakes."
share-description: "AI exposes sloppy ownership and slow approvals. Before you deploy another model, make sure the person who sees the risk has the right to act. Here’s the operating model that turns detection into money."
tags:
  - ai-decision-operations
topic: ai-topic
archetype: tell
author: Hasan J.
tldr: "AI won’t repair unclear ownership or slow approvals. It will surface more problems, faster, and humiliate your operating gaps at scale. Before you add another model or dashboard, build an operating model where the person who sees the signal has the right to act within minutes and a budget for mistakes. Strong teams pre-commit thresholds, decision rights, time limits, and rollback paths. Everyone else buys detection and pays for delay. Choose: authority with risk, or comfort with avoidable loss."
---

2:07 a.m., Saturday. Our marketplace risk model lit up on a burst of gift card purchases tied to fresh devices and a recycled IP range.

The junior analyst on call did what the playbook allowed: dropped screenshots in Slack, tagged a manager, opened a ticket. The manager was asleep. The director wanted to be looped because the block might ding weekend revenue. Legal had asked to be notified if we ever throttled gift cards again.

Nothing moved. By sunrise, the ring was done. The model was right. Our operating model was not.

This is what AI does to weak operations. It floods you with true signals that no one is authorized to act on. It also floods you with false signals that no one is allowed to tune. You get speed without authority. That is noise, not value.

Here’s the uncomfortable truth: AI does not fix unclear ownership or slow approval chains. It exposes them faster and at scale. If the person who sees the signal can’t pull the lever, your model is a siren with no brakes.

That night pushed a change. We stopped arguing about features and built the operating model first. We wrote down exactly what must be true before another model could ship. If you don’t do this, you’re paying to watch yourself lose.

The checklist that must be true before AI adds value:

- Single owner per shift with action rights. One human is on the hook, by name, for the domain. They can block, rate-limit, or require extra verification without asking anyone.

- Pre-approved error budgets. We state in writing the acceptable false positive hit (revenue or customer friction) per day/week. If the action is inside the budget, it’s green-lit.

- Time limits on decisions. In this domain, first action within 2 minutes, escalation at 10, senior decision by 30. If a person misses the window, the next rung acts. No waiting for a title.

- Actuators wired, not just dashboards. The model must connect to levers: blocklists, velocity caps, KYC steps, payment holds. A chart is not a control surface.

- Threshold ownership and change protocol. Named owners can change cutoffs, with auto-rollback if metrics swing outside guardrails. Changes are logged and reviewed next day, not pre-approved.

- Reversal path. Every action has an undo inside the same console. If we hit good customers, we make them whole fast and we track the cost against the budget.

- Clear escalation tree with sleeping rights. Who gets paged at 2 a.m. is documented. Who doesn’t get woken up is also documented.

- Post-action review that edits the playbook. Not blame. A 20-minute debrief next business day that results in one change to thresholds, rules, or budgets.

- Legal and compliance pre-buys the moves. Sensitive actions are pre-approved in classes: block, throttle, step-up auth. No midnight approvals. Just apply the class.

We implemented this and ate our own decision risk. The next weekend, a different pattern popped. The on-call lead capped purchase velocity on the segment within two minutes. We hit a few good customers. We credited them by noon and logged the cost against the error budget. Losses stayed contained. Revenue dipped slightly. We kept the ring out.

That’s the trade-off everyone tiptoes around: either you accept some customer friction and revenue noise now, or you accept larger, uglier losses later. You can’t have real-time protection and pristine approval comfort. Choose your pain and write it down.

Average teams avoid that choice. They buy more models and put more eyes on dashboards. They write “notify” into every step. They let legal and finance sit on the same approval rung as operations. They ask for one more metric before making the call. Their best people become couriers for screenshots.

Strong teams do the opposite. They concentrate authority where the signal lands. They pre-commit to thresholds and the cost of being wrong. They wire models to controls, not slides. They set timers on decisions and treat missed timers as defects. They assume they will be wrong sometimes and build fast reversals to make customers whole.

Strong teams also kill vanity detection. If a model can’t trigger an action or a decision inside a budget, it doesn’t go to production. It becomes an experiment with a sunset date. No zombie alerts.

A note on metrics. If your dashboard doesn’t map to a lever you own, delete it from the on-call view. Keep it for analysis later. During an incident, the only numbers that matter are the ones that change your next move within minutes.

The other sticking point is titles. I’ve seen directors who want to be in the loop on every weekend throttle. That’s not leadership. Leadership is writing the thresholds, blessing the budgets, and sleeping through the night because you trust your operators to act inside them—and to wake you only when the budget is gone.

If you feel queasy giving that authority, good. You should. That queasiness is the price of speed. The alternative is exactly what you have now: fast detection, slow decisions, and a weekly parade of avoidable loss.

Before you spin up another model, run the checklist. If any item is missing, stop. Fix the operating model first. Deploy after you’ve put a name next to a lever and a number next to the cost of being wrong.

You don’t need more intelligence. You need the right to act on the intelligence you already have.

So pick a side: will you give your on-call lead the authority to pull the lever within two minutes—inside a written error budget—or will you keep your approval chain and pay for the delay?
