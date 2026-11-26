---
layout: post
title: "Which Controls Should Be Ready Before a Fraud Spike Starts?"
subtitle: "Dashboards and models show a fraud spike. Only controls prepared, owned and tested in advance can contain it before the losses accumulate."
share-title: "Which Controls Should Be Ready Before a Fraud Spike Starts?"
share-description: "Fraud spikes are contained by controls prepared in advance: graduated, reversible, owned and tested, with automatic expiry and a path back for customers."
excerpt: "When fraud spikes, the gap between seeing the pattern and changing the system is where losses build. The answer is a small set of controls prepared in calm conditions, each tied to a known pattern and owned by a named role."
tldr: "A small set of graduated, reversible controls, each tied to a known fraud pattern, owned by a named role and tested before it is needed: extra verification, limits, temporary holds and pauses, with automatic expiry and a path back for genuine customers. Dashboards and models show the spike. Only controls prepared in advance can contain it before the losses accumulate."
reading_topics:
  - "value"
tags:
  - risk-intelligence
author: Hasan Jaffal
topic: alert-spam
archetype: framework
keywords:
  - "fraud spike response"
  - "fraud controls"
  - "fraud prevention controls"
  - "alert fatigue"
  - "too many alerts"
faq:
  - q: "What is a graduated fraud control?"
    a: "A graduated control responds in steps rather than with a single block. It might start by asking for extra verification, then lower a transaction limit, then hold transactions for review, and only then block. Each step adds friction for fraudsters while leaving genuine customers a way to complete what they started."
  - q: "Why should fraud controls expire automatically?"
    a: "Because controls switched on during a spike are easily forgotten once it passes. A control that expires after a set period, unless someone deliberately renews it, protects genuine customers from lasting friction and forces a review of whether the control is still needed and still effective."
  - q: "How do you measure whether a fraud control worked?"
    a: "Measure the loss contained compared with similar events before the control existed, the time from detection to the control taking effect, and the cost to genuine customers in declined transactions, complaints and abandoned purchases. A control that stops fraud but drives away good customers may cost more than it saves."
last-updated: 2026-11-26
---

## Why does seeing a fraud spike not stop it?

When fraud spikes, most organisations see it quickly. Models flag the pattern, dashboards show the curve rising and analysts share screenshots. What often follows is a request for a rule change, a ticket in a queue, a legal review of the customer message and a wait for someone with permission to change the system. The losses build in that gap.

Leaders usually respond by asking for better detection. It is a natural instinct, and it misses a larger question: when the spike arrives, which controls can be switched on immediately, by whom, and with what effect on genuine customers? Detection without a prepared response is awareness. In fraud, awareness without action is loss.

The stakes are rising. US consumers reported losing $12.5 billion to fraud in 2024, a 25% increase on the previous year, according to the [Federal Trade Commission (FTC) Consumer Sentinel Network](https://www.ftc.gov/news-events/news/press-releases/2025/03/new-ftc-data-show-big-jump-reported-losses-fraud-125-billion-2024). The figures are self-reported by consumers, but the direction is clear.

## What does AI change in fraud response, and what does it not change?

AI changes how early and how precisely a spike can be recognised. It can separate a coordinated attack from a seasonal surge, and point to the channels, products or customer groups involved.

AI does not create the levers that stop the attack. If the organisation has no prepared way to add verification, lower a limit or pause an offer in minutes, a better model only describes the loss in more detail. The control layer, the set of switches that change what the system allows, has to be built and owned in advance.

## Find the value: which fraud patterns need a prepared control?

Not every pattern needs its own control. The value lies in the patterns that recur and cost the most: abuse of a promotion, account takeover attempts, card testing, misuse of refunds or gift cards. Recent incident history, and the loss from each, shows which patterns justify preparation.

For each pattern, identify the smallest effective response. The best controls are graduated, responding in steps rather than with a single block:

- **Extra verification** for the transactions or accounts that match the pattern.
- **Lower limits** on value, quantity or frequency for a defined group.
- **Temporary holds** for review on the highest-risk transactions.
- **Pauses** on a specific offer, channel or product.
- **Blocks**, kept for clear cases and used for the shortest time that works.

**Decision for the sponsor:** which recurring fraud patterns cost enough to justify a prepared control, and what is the smallest effective response to each?

## Lead the change: who owns each control, and what has been agreed in advance?

A prepared control is useful only if someone may switch it on without waiting. Each control needs a named owner by role, on a rota that covers nights and weekends. Its limits should be written down: how far it may go, for how long, and for which customers.

The approvals that usually slow a response should happen in calm conditions. Legal and compliance agree the customer messages in advance. Customer service knows what genuine customers will see and how they can complete their purchase. Finance accepts the expected cost of friction. During the spike, the owner acts within what has already been agreed.

Four design rules make controls safe to use quickly:

- **Reversible.** Every control can be switched off as easily as it was switched on.
- **Time-limited.** Every control expires automatically unless someone deliberately renews it.
- **Logged.** Every change records who made it, when and why.
- **A path back.** Genuine customers caught by a control have a clear way to proceed, such as verifying their identity.

The wider question of delegated authority is covered in [who should be allowed to act on an AI signal](/2026-08-20-assign-decision-rights-now-how-to-turn-ai-signals-into-fast-authorized-actions/).

**Decision for the sponsor:** who owns each control, and have its limits, messages and expected friction been agreed before it is needed?

## Prove the impact: did the controls contain the loss without driving customers away?

Prepared controls should be tested before they are needed and judged after they are used. Testing in calm conditions, by switching a control on for a small, low-risk group and then off again, confirms that it works and that the owner has the access to use it.

After each use, measure three things. The loss contained, compared with similar events before the control existed. The time from detection to the control taking effect. And the cost to genuine customers: declined transactions, complaints, abandoned purchases. A control that stops fraud but drives away good customers may cost more than it saves.

Review the controls on a regular cycle. Some will prove too blunt and need narrowing; some will never be used and can be retired; new patterns will need new controls.

**Decision for the sponsor:** on the evidence, which controls should be kept, refined or retired, and which new patterns need one?

## What does it cost, and what is the simpler alternative?

The cost is mostly engineering and governance: building switches that change system behaviour quickly and safely, the logging around them, the rota and training, and the time to agree limits and messages with legal, finance and customer service.

The simpler alternative is to start with the single most costly recurring pattern. Prepare one graduated control for it, name its owner, agree its limits and test it once. That alone often shortens the response to the pattern that hurts most, and it shows what the rest of the control layer will require. The same discipline of testing one bounded case first applies to [supply chain loss prevention](/2026-11-23-should-you-invest-in-ai-for-supply-chain-loss-prevention-buy-the-decision-not-the-alerts/).

## Questions to put to your team

1. Which fraud patterns recur most often, and which cost us most?
2. For each, what could we switch on within minutes today, and who would do it?
3. What would genuine customers experience, and how could they proceed?
4. Do our controls expire automatically, or do they stay on until someone remembers?
5. When did we last test a control before we needed it?

## Frequently asked questions

### What is a graduated fraud control?

A graduated control responds in steps rather than with a single block. It might start by asking for extra verification, then lower a transaction limit, then hold transactions for review, and only then block. Each step adds friction for fraudsters while leaving genuine customers a way to complete what they started.

### Why should fraud controls expire automatically?

Because controls switched on during a spike are easily forgotten once it passes. A control that expires after a set period, unless someone deliberately renews it, protects genuine customers from lasting friction and forces a review of whether the control is still needed and still effective.

### How do you measure whether a fraud control worked?

Measure the loss contained compared with similar events before the control existed, the time from detection to the control taking effect, and the cost to genuine customers in declined transactions, complaints and abandoned purchases. A control that stops fraud but drives away good customers may cost more than it saves.

## Sources

- Federal Trade Commission, [New FTC data show a big jump in reported losses to fraud to $12.5 billion in 2024](https://www.ftc.gov/news-events/news/press-releases/2025/03/new-ftc-data-show-big-jump-reported-losses-fraud-125-billion-2024), March 2025.

Fraud response is decided long before the spike: in the controls that exist, the people who may use them and the agreements already made. Preparing those in calm conditions is less visible than a new model, and usually more valuable. More on judging such results is in the [outcomes and evidence](/topics/outcomes-and-evidence/) topic, and on acting outside office hours in [how an organisation should act on AI signals at night](/2026-07-30-build-a-2-a-m-decision-system-that-works-without-you/).
