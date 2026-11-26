---
layout: post
title: "Who Should Be Allowed to Act on an AI Signal?"
subtitle: "AI has made detection fast. The delay that remains is authority, and leaders can remove it before the next incident rather than during it."
share-title: "Who Should Be Allowed to Act on an AI Signal?"
share-description: "AI speeds up detection, not approvals. Give one role written authority for bounded, reversible actions, set the risk budget and review every decision."
excerpt: "AI finds problems faster than most approval chains can respond. The answer is not another dashboard but delegated, bounded authority: one role per signal, a written limit on what it may do, and a review of every decision."
tldr: "One named role per signal, with written authority to take a bounded, reversible action within a set time and without further approval. Irreversible actions keep their approvals. The sponsor sets the risk budget in advance and reviews a log of every decision. Without that, faster detection mostly produces faster meetings, while the loss continues at the same speed as before."
reading_topics:
  - "adoption"
tags:
  - ai-decision-operations
topic: ai-topic
archetype: write
keywords:
  - "AI decision rights"
  - "who should act on AI alerts"
  - "AI incident response authority"
  - "fraud response decision making"
  - "AI operating model"
faq:
  - q: "What is a decision right?"
    a: "A decision right is written permission for a named role to make a specific decision, within stated limits, without asking anyone else. For an AI signal it states who may act, which actions they may take, how large or long those actions may be, and when the decision must be escalated instead."
  - q: "How do you stop people acting on AI false positives?"
    a: "You cannot avoid them entirely, so you limit their cost. Delegate only reversible actions, cap their size and duration, require a quick review afterwards, and track how often actions were later reversed. If the reversal rate is too high, tighten the threshold or narrow the authority rather than removing it."
  - q: "Who should own fraud response outside office hours?"
    a: "A role on a published rota, not whoever happens to be awake. That role needs the same written authority at night as by day, the tools to act directly, and a clear escalation path for anything outside its limits. Approvers who are asleep cannot be part of a response measured in minutes."
  - q: "Does delegating decision rights require new technology?"
    a: "Rarely. Most organisations can start with what they have: an on-call rota, a written authority table, existing switches and settings, and a shared log. Technology helps later, by attaching the recommended action and its evidence to each alert, but the hard part is agreeing the authority itself."
author: Hasan Jaffal
last-updated: 2026-11-26
---

## Why does faster detection not lead to faster action?

AI has made detection fast and cheap. A model can flag a fraud pattern, an abuse spike or an operational failure within minutes. What it cannot do is shorten the chain of approvals that follows. When an alert reaches three managers, a legal review and a finance sign-off before anyone may act, the organisation has bought faster alarms, not faster responses.

Leaders who want better outcomes from AI usually invest in better models and better dashboards. It is a reasonable instinct, and it misses a larger question: who is allowed to act on a signal, within what limits, while the signal is still useful? Detection without authority to act is, in practice, expensive noise.

The gap is not unique to AI. In McKinsey's [2019 global survey on decision making](https://www.mckinsey.com/capabilities/people-and-organizational-performance/our-insights/decision-making-in-the-age-of-urgency), only 20% of respondents said their organisations excel at decision making, and 61% said most of the time they spend on decisions is used ineffectively. AI exposes that weakness faster, because it produces more decisions to make.

## What does AI change about decisions, and what does it not change?

AI changes the volume and timing of decisions. Signals arrive more often, earlier and at any hour. A process designed for a weekly review now receives a stream of alerts that each demand an answer.

AI does not change who holds authority, what a wrong decision costs or how much risk the organisation will accept. Those remain leadership choices. If they are not made in advance, they are made under pressure, by whoever is available, or not at all.

## Find the value: which signals deserve delegated authority?

Not every alert deserves a decision right. Most should be batched, reviewed or switched off. Delegated authority belongs to the few signals where a late decision costs real money or harm: a fraud surge, an account takeover pattern, abuse of a promotion, a failure that affects customers.

For each candidate signal, ask two questions. What decision should it trigger: block, slow down, hold for review, pause a promotion, or notify only? And what does a delay of an hour, or a night, cost? A signal that cannot be tied to a decision is a report, and it should be treated as one.

**Decision for the sponsor:** which signals justify delegated authority, and what is a late decision on each of them costing today?

## Lead the change: who decides, and within what limits?

The core of the answer is simple to state and hard to agree: one named role per signal, with written authority. The role, not a person, owns the decision, so the authority survives holidays and night shifts.

That authority is defined by an authority band: the largest action the role may take without further approval. For example, a fraud duty lead may hold new-account transactions above a set value for up to six hours, or a promotion owner may pause one campaign for the rest of the day. Bands are wide for reversible actions, which can be undone quickly, and narrow for irreversible ones, which keep their approvals.

Three further agreements make the band usable:

- **A time limit.** The role must act, or escalate, within a set time. If it does neither, a pre-agreed default applies, usually the more cautious action.
- **Pre-cleared approvals.** Legal, compliance and finance agree the bands in calm hours, not in the middle of an incident.
- **A stated trade-off.** Faster action means some good customers will meet friction. The sponsor should decide in advance which cost the organisation will accept first: friction or loss.

An illustrative example, not a documented case: a retailer sees a sudden rise in new accounts redeeming a promotion. Under a committee model, the alert waits for marketing, finance and legal. Under delegated authority, the promotion owner pauses redemptions for new accounts for four hours within an agreed band, logs the decision, and the team reviews it the next morning.

**Decision for the sponsor:** what risk budget will the organisation delegate, to which roles, and which actions must still be approved?

## Prove the impact: are decisions faster, and is the loss lower?

Delegated authority needs evidence, both to keep it and to adjust it. Four measures do most of the work:

- **Time to first action** from the moment the signal fires.
- **Loss contained** compared with similar events before the change.
- **Cost of false positives**, in customer friction, complaints and reversed actions.
- **Use of the band**: how often the role acted, escalated or let the default apply.

Every decision should be recorded in a short log: the signal, the action, the owner, the time and the outcome. The sponsor reviews the log regularly and decides whether each band should widen, narrow or be retired. Practising the response in calm conditions, with a timed drill on a recent incident, often reveals the real blocks: missing access, an unclear owner, or an approval that nobody knew was required.

**Decision for the sponsor:** on the evidence of the log and the drills, should each authority band be kept, widened, narrowed or retired?

## What does it cost, and what is the cheaper alternative?

The cost of delegated authority is mostly organisational: the time to agree bands with legal and finance, a published rota, training, and the friction caused by actions that turn out to be unnecessary. The technology cost is usually small, because most organisations already have the switches and settings they need.

The cheaper first step is often enough to show the value: clarify who owns three important signals, write down what each owner may do, and run one drill. That costs little and frequently shortens response times before any new detection is bought. It is also the logic behind testing AI on one bounded problem, as in [should you invest in AI for supply chain loss prevention](/2026-11-23-should-you-invest-in-ai-for-supply-chain-loss-prevention-buy-the-decision-not-the-alerts/).

## Questions to put to your team

1. For our three most important signals, who may act today without asking anyone?
2. What may they do, how far, and for how long?
3. Which actions are reversible, and which must keep their approvals?
4. How long does it take, on average, from signal to first action?
5. When did we last practise the response?

## Frequently asked questions

### What is a decision right?

A decision right is written permission for a named role to make a specific decision, within stated limits, without asking anyone else. For an AI signal it states who may act, which actions they may take, how large or long those actions may be, and when the decision must be escalated instead.

### How do you stop people acting on AI false positives?

You cannot avoid them entirely, so you limit their cost. Delegate only reversible actions, cap their size and duration, require a quick review afterwards, and track how often actions were later reversed. If the reversal rate is too high, tighten the threshold or narrow the authority rather than removing it.

### Who should own fraud response outside office hours?

A role on a published rota, not whoever happens to be awake. That role needs the same written authority at night as by day, the tools to act directly, and a clear escalation path for anything outside its limits. Approvers who are asleep cannot be part of a response measured in minutes.

### Does delegating decision rights require new technology?

Rarely. Most organisations can start with what they have: an on-call rota, a written authority table, existing switches and settings, and a shared log. Technology helps later, by attaching the recommended action and its evidence to each alert, but the hard part is agreeing the authority itself.

## Sources

- McKinsey & Company, [Decision making in the age of urgency](https://www.mckinsey.com/capabilities/people-and-organizational-performance/our-insights/decision-making-in-the-age-of-urgency), global survey, 2019.

AI will keep finding problems faster than committees can meet. The organisations that benefit will be those that decided, in calm conditions, who may act and how far. More on the people side of AI adoption is in the [people and adoption](/topics/people-and-adoption/) topic, and on one way to apply this in [understanding why products come back](/2026-11-24-can-ai-make-product-returns-useful-a-small-test-to-turn-free-text-and-photos-into-fixable-causes/).
