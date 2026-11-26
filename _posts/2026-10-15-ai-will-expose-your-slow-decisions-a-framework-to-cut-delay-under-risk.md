---
layout: post
title: "Where Is Time Lost Between an AI Alert and Action?"
subtitle: "The model is rarely the slow part. Most delay sits in five places between the alert and the action, and each has a leadership fix."
share-title: "Where Is Time Lost Between an AI Alert and Action?"
share-description: "The model is rarely the slow part. Time is lost in ownership, permission, information, tooling and unagreed trade-offs. Measure each and fix the largest."
excerpt: "Most organisations measure how quickly their models detect a problem, and few measure how long it takes to act. The delay usually sits in five places, and each can be found, measured and removed."
tldr: "Usually in five places: finding who owns the alert, waiting for permission, gathering more information, working through the tools needed to act, and hesitating over a trade-off nobody agreed in advance. The model is rarely the slow part. Measure the time each step takes for one important signal, then remove the largest delay first, before investing in faster detection."
reading_topics:
  - "adoption"
tags:
  - ai-decision-operations
topic: ai-topic
archetype: describe
author: Hasan Jaffal
keywords:
  - "time to action"
  - "decision latency"
  - "AI incident response time"
  - "reduce response time"
  - "AI alert handling"
faq:
  - q: "What is decision latency?"
    a: "Decision latency is the time between the moment an organisation has enough information to act and the moment it actually acts. It is different from detection time, which measures how quickly a problem is noticed. In many organisations decision latency is far longer than detection time, and far less often measured."
  - q: "What is a decision packet?"
    a: "A decision packet is the smallest set of facts a decision-maker needs to act on a particular kind of alert: what changed, how large it is, who is affected, the actions available and their likely cost. Attaching it to the alert automatically removes the delay of gathering information by hand."
  - q: "How do you measure time from alert to action?"
    a: "Record timestamps for each step on recent events of one important signal: when the alert fired, when an owner acknowledged it, when a decision was made and when the action took effect. The differences show where time goes. Repeat the measurement after each change to confirm the delay has actually shrunk."
last-updated: 2026-11-26
---

## Why is the model rarely the slow part?

AI has made detection fast. A model can flag a problem within seconds of it appearing. Yet many organisations still take hours to respond, and when they investigate the delay they usually look at the model: could it be faster, more accurate, better tuned?

That is a reasonable place to start, and it misses where most of the time goes. The slowest part of an AI-supported operation is usually the path from the alert to an authorised action. Most organisations measure detection time carefully and decision time not at all.

The cost of slow response is well documented in security. The [IBM Cost of a Data Breach Report 2024](https://www.ibm.com/think/insights/whats-new-2024-cost-of-a-data-breach-report) puts the global average cost of a breach at $4.88 million, and the average time to identify and contain one at 258 days. Every stage of that timeline is an opportunity to lose less.

## What does AI change about response time, and what does it not change?

AI removes most of the delay in noticing. It can also shorten the time spent understanding an alert, by assembling the evidence around it.

AI does not remove the delays that come from how the organisation is arranged: unclear ownership, approvals that must be sought, tools that take many steps, and choices that nobody has agreed to make. Those delays are leadership matters, and they are usually the larger part of the total.

## Find the value: how long does each step actually take?

The first step is measurement. Choose one important signal and record, for recent events, when the alert fired, when an owner acknowledged it, when a decision was made and when the action took effect. The gaps show where the time goes.

In my judgement, the delay usually concentrates in five places:

| Where time is lost | What it looks like | The leadership fix |
|---|---|---|
| Ownership | The alert moves between channels while people ask who owns it | Name the owning role in the alert itself |
| Permission | The owner must seek approval from legal, finance or a senior manager | Agree authority and limits in advance |
| Information | The owner waits for more data before acting | Attach a standard decision packet to the alert |
| Tooling | Acting takes many steps across several systems | Prepare the action as a single, reversible step |
| Nerve | Nobody wants to own the trade-off, so the decision drifts | Agree in advance which cost to accept first |

An illustrative example, not a documented case: a team measures its refund-abuse alert over its last ten events. Detection takes under a minute. Acknowledgement takes twenty minutes, because the alert goes to a shared channel. The decision takes three hours, because the owner needs a finance manager's approval to pause refunds. The model is not the problem; the permission is.

**Decision for the sponsor:** for our most important signal, which of the five delays is largest, and what is it costing?

## Lead the change: how is each delay removed?

Each delay has a different owner and a different fix, and leaders should address the largest first rather than all at once.

**Ownership** is fixed by naming the responsible role in the alert, with a rota behind it, so that the question "who owns this?" never needs asking. **Permission** is fixed by agreeing authority and limits in calm conditions, so that the owner does not need to ask during the event; the approach is set out in [who should be allowed to act on an AI signal](/2026-08-20-assign-decision-rights-now-how-to-turn-ai-signals-into-fast-authorized-actions/).

**Information** is fixed with a decision packet: the smallest set of facts the decision needs, such as what changed, how large it is, who is affected, the actions available and their likely cost, attached to the alert automatically. If the packet is incomplete after an agreed time, a cautious default action applies. **Tooling** is fixed by preparing common actions as single, reversible steps, as described in [which controls should be ready before a fraud spike starts](/2026-05-02-dashboards-dont-stop-fraud-pre-wired-decisions-do/).

**Nerve** is the hardest. Under pressure, people hesitate because every option has a cost: friction for genuine customers, or continued loss. Leaders remove the hesitation by deciding in advance which cost the organisation will accept first, and writing it down.

**Decision for the sponsor:** which delay will we remove first, who owns the fix, and by when?

## Prove the impact: has the time from alert to action fallen?

Repeat the measurement after each change, on the same signal. The time between each step should shrink where the fix was applied. If it does not, the fix was in the wrong place, or the delay has simply moved elsewhere.

Speed alone is not the goal. Track the quality of decisions alongside it: losses contained, actions later reversed, and the cost to genuine customers. A faster path that produces many unnecessary actions has traded one problem for another.

Practise the response periodically on a recent event. A timed rehearsal shows delays that a document does not, such as a missing permission or an access right nobody tested.

**Decision for the sponsor:** on the evidence, has the path from alert to action become faster without becoming careless, and which delay comes next?

## What does it cost, and what is the simpler alternative?

Most of the fixes cost leadership time and modest engineering: agreeing authority, writing decision packets, preparing actions as single steps and maintaining a rota. They are usually cheaper than a new detection system, and they make any future investment in detection more valuable.

The simplest first step costs almost nothing: measure the five delays for one signal over its last few events. That measurement alone often redirects investment from the model, which was fast enough, to the organisation, which was not.

## Questions to put to your team

1. For our most important signal, how long does each step from alert to action take?
2. Does every alert name the role that owns it?
3. What permission does the owner still need to seek during an event?
4. What information does the owner wait for, and could it arrive with the alert?
5. Have we agreed in advance which cost we accept first: friction or loss?

## Frequently asked questions

### What is decision latency?

Decision latency is the time between the moment an organisation has enough information to act and the moment it actually acts. It is different from detection time, which measures how quickly a problem is noticed. In many organisations decision latency is far longer than detection time, and far less often measured.

### What is a decision packet?

A decision packet is the smallest set of facts a decision-maker needs to act on a particular kind of alert: what changed, how large it is, who is affected, the actions available and their likely cost. Attaching it to the alert automatically removes the delay of gathering information by hand.

### How do you measure time from alert to action?

Record timestamps for each step on recent events of one important signal: when the alert fired, when an owner acknowledged it, when a decision was made and when the action took effect. The differences show where time goes. Repeat the measurement after each change to confirm the delay has actually shrunk.

## Sources

- IBM, [Cost of a Data Breach Report 2024: what's new](https://www.ibm.com/think/insights/whats-new-2024-cost-of-a-data-breach-report), July 2024.

Faster detection is valuable only when the organisation can act at a similar speed. Finding where the time goes is the quickest way to make an existing AI investment pay. More on this is in the [people and adoption](/topics/people-and-adoption/) topic, and on acting outside office hours in [how an organisation should act on AI signals at night](/2026-07-30-build-a-2-a-m-decision-system-that-works-without-you/).
