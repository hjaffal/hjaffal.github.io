---
title: How Many Approvals Can Fraud Response Afford?
subtitle: During a live attack, each extra approval costs time, widens the response and teaches attackers. The answer is to move most approvals to before the attack and after it.
share-title: How Many Approvals Can Fraud Response Afford?
share-description: Each approval during a live fraud attack costs time and widens the response. Move approvals before and after the attack, inside an agreed risk budget.
excerpt: AI finds fraud attacks quickly, but the response often waits for approvals that were designed for calmer decisions. Leaders can keep control and gain speed by approving in advance, reviewing afterwards and giving the person on duty a bounded risk budget.
tldr: Very few during the attack itself. Each approval adds delay while attackers adapt, and late responses tend to be broader and harsher on genuine customers. Keep control by moving approvals to before the attack, through agreed tiers and pre-cleared actions, and to after it, through a prompt review. During the attack, the person on duty acts within a bounded risk budget.
keywords:
- fraud response process
- fraud incident response
- fraud approval process
- AI fraud detection response
faq:
- q: Why do approvals slow down fraud response?
  a: 'Each approval adds a handoff: explaining the situation, framing the risk and waiting for an answer. During a live attack those minutes matter, because attackers adapt quickly. The delay also tends to widen the eventual response, since by the time approval arrives the problem has spread and a narrow, precise action is no longer enough.'
- q: What is a risk budget in fraud response?
  a: 'A risk budget is a written limit on the cost the person on duty may incur to contain an attack without asking: for example, how much extra friction for genuine customers, or how much revenue at risk, for how long. Within the budget they act; beyond it they escalate. The budget is set and reviewed by a senior owner.'
- q: How do you keep control if approvals are removed during an attack?
  a: By moving them rather than removing them. Senior leaders, legal and compliance approve tiers of response and customer messages in advance. Every action during the attack is logged, reversible where possible and reviewed promptly afterwards. Control shifts from permission in the moment to design beforehand and accountability after.
author: Hasan Jaffal
last-updated: 2026-11-26
layout: post
tags:
- ai-decision-operations
topic: ai-topic
archetype: analyze
---

## Why does one extra approval matter during a fraud attack?

AI has made fraud detection fast. Models and rules can recognise credential stuffing, card testing or abuse of an offer within minutes. In many organisations, the response then waits: the analyst on duty proposes an action, tags a manager, the manager involves legal because genuine customers will be affected, and a second manager asks for more evidence. Each step is reasonable. Together, they turn a fast detection into a slow response.

Leaders usually see approvals as a safeguard, and in calm conditions they are. During a live attack the question changes: how many approvals can the response afford before the delay costs more than the risk the approvals were meant to control?

The scale of the problem makes the question worth asking. Criminals stole £1.17 billion through fraud in the UK in 2024, according to [UK Finance's Annual Fraud Report 2025](https://www.ukfinance.org.uk/policy-and-guidance/reports-and-publications/annual-fraud-report-2025).

## What does AI change in fraud response, and what does it not change?

AI changes the speed of detection and the precision of the evidence. It can show which accounts, channels or payment routes are involved, often before the losses are large.

AI does not change who may act. If the authority to add friction, slow traffic or pause a payment route sits two levels above the person who sees the attack, fast detection simply means the organisation knows sooner that it is waiting.

## Find the value: what does each approval cost during an attack?

The cost of an approval during an attack shows up in four ways. The first is time: each handoff requires context, framing and an answer, while attackers keep adapting. The second is scope: the longer the wait, the further the attack spreads, and the eventual response has to be broader and harsher on genuine customers. The third is fatigue: teams that fight for approvals during every incident learn to be either too timid or too aggressive next time. The fourth is a governance spiral: late, messy responses invite more oversight, which adds more approvals to the next incident.

To see the cost in practice, look at recent incidents. How long did the response wait for approval? How much did the attack grow in that time? Was the final action broader than the first proposal?

**Decision for the sponsor:** what did approvals during recent attacks cost in time, losses and customer friction?

## Lead the change: where should the approvals move?

The aim is not to remove control but to move it. Most approvals can happen before the attack or after it, rather than during it:

- **Before: tiers of response.** Leaders agree tiers of incident, each with pre-approved actions tied to the evidence and the likely impact. The recommended action arrives with the alert.
- **Before: pre-cleared wording and actions.** Legal and compliance approve customer messages and the mechanics of each action in calm conditions, so their review is not a gate during the attack.
- **During: a risk budget.** The person on duty may incur a defined cost, in friction or revenue at risk, for a defined time, without asking. Actions are reversible by design. Beyond the budget, they escalate.
- **After: a prompt review.** Every action is logged and reviewed within an agreed window. If it was too heavy, it is dialled back and the rule adjusted; if it was too late, the budget may be widened.

The broader principle of delegated authority is set out in [who should be allowed to act on an AI signal](/2026-08-20-assign-decision-rights-now-how-to-turn-ai-signals-into-fast-authorized-actions/), and the design of the controls themselves in [which controls should be ready before a fraud spike starts](/2026-05-02-dashboards-dont-stop-fraud-pre-wired-decisions-do/).

An illustrative example, not a documented case: a payments team sees card testing begin on one checkout route. The analyst on duty proposes adding verification for that route and waits for a manager, who waits for legal. In the meantime the attack moves to a second route, and the eventual response has to cover both, affecting far more genuine customers than the first proposal would have.

**Decision for the sponsor:** what risk budget will the person on duty hold, and which approvals will move to before and after the attack?

## Prove the impact: is the response faster without becoming careless?

Measure the response, not only the detection. Track the time from detection to first action, the losses during attacks compared with similar attacks before the change, and the cost to genuine customers in declined transactions and complaints.

The post-attack reviews provide the quality check. How often did the person on duty act within budget? How often were actions reversed, and why? Did any action exceed what the tiers allowed? Practising the response periodically, with a timed exercise on a recent attack, shows whether the arrangement works under pressure.

**Decision for the sponsor:** on the evidence, should the risk budget be widened, narrowed or kept, and are the tiers still right?

## What does it cost, and what is the simpler alternative?

The main cost is accepting that the person on duty will sometimes act when, with hindsight, they should not have. That cost is bounded by the budget and the review, and it is usually smaller than the cost of slow, broad responses. There is also a one-off cost in agreeing tiers, wording and budgets with legal, compliance and finance.

The simpler first step is to choose one high-impact action, such as adding verification for a defined group, and give the person on duty a budget for that action only. Write the thresholds, the maximum duration and the review process, and use it for a month before widening the approach.

## Questions to put to your team

1. During our last fraud attack, how long did the response wait for approval?
2. How much did the attack grow while we waited?
3. Which actions could be approved in advance, through tiers and pre-cleared wording?
4. What risk budget could the person on duty hold without asking?
5. How quickly do we review actions after an attack?

## Frequently asked questions

### Why do approvals slow down fraud response?

Each approval adds a handoff: explaining the situation, framing the risk and waiting for an answer. During a live attack those minutes matter, because attackers adapt quickly. The delay also tends to widen the eventual response, since by the time approval arrives the problem has spread and a narrow, precise action is no longer enough.

### What is a risk budget in fraud response?

A risk budget is a written limit on the cost the person on duty may incur to contain an attack without asking: for example, how much extra friction for genuine customers, or how much revenue at risk, for how long. Within the budget they act; beyond it they escalate. The budget is set and reviewed by a senior owner.

### How do you keep control if approvals are removed during an attack?

By moving them rather than removing them. Senior leaders, legal and compliance approve tiers of response and customer messages in advance. Every action during the attack is logged, reversible where possible and reviewed promptly afterwards. Control shifts from permission in the moment to design beforehand and accountability after.

## Sources

- UK Finance, [Annual Fraud Report 2025](https://www.ukfinance.org.uk/policy-and-guidance/reports-and-publications/annual-fraud-report-2025), 2025.

The approvals that protect an organisation in calm conditions can expose it during an attack. Moving them to before and after keeps the control and gains the speed. More on judging the results is in the [outcomes and evidence](/topics/outcomes-and-evidence/) topic, and on measuring delays in [where time is lost between an AI alert and action](/2026-10-15-ai-will-expose-your-slow-decisions-a-framework-to-cut-delay-under-risk/).
