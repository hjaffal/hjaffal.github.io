---
title: Should You Fix the Process Before Deploying an AI Model?
subtitle: Models rarely fail in testing. They fail in handoffs, missing data and decisions nobody owns, which makes the process around the model the first investment.
share-title: Should You Fix the Process Before Deploying an AI Model?
share-description: 'AI models fail in weak processes: missing data, unowned decisions, no fallback. What to fix first, and how to tell whether the process is ready for AI.'
excerpt: A model placed into a weak process makes the weakness faster. Before deployment, leaders should check the inputs, the ownership of each decision, the fallback when the model is unsure and the way mistakes are undone.
tldr: 'Yes, in most cases, at least enough to make it safe. A model inherits the weaknesses of the process around it: unreliable inputs, decisions nobody owns, no fallback and no way to undo mistakes. Fix those first, deploy where actions are reversible, and measure decisions rather than model accuracy. The process is often where most of the value, and most of the risk, sits.'
keywords:
- AI deployment readiness
- fix process before AI
- AI implementation risks
- AI model in production
- slow decisions
- decision latency
- decision bottleneck
faq:
- q: Why do AI projects fail after a successful pilot?
  a: Often because the pilot tested the model and not the process. In production the model meets late or missing data, unclear ownership of its decisions, and situations nobody planned for. Gartner predicted in 2024 that 30% of generative AI projects would be abandoned after proof of concept, citing poor data quality and inadequate risk controls among the causes.
- q: What is a fallback for an AI model?
  a: 'A fallback is a simple, safe way of making the decision when the model cannot be trusted: when its inputs are missing, its confidence is low or it is switched off. It might be a basic rule or a route to a person. A model without a fallback leaves the process with no answer when something goes wrong.'
- q: Should an AI model be deployed everywhere at once?
  a: Rarely. Start where decisions are frequent, low in stakes and easy to reverse, and expand as evidence builds. Avoid launching just before known periods of disruption, such as holidays or month-end, when unusual data is most likely and the people who could intervene may be away.
author: Hasan Jaffal
last-updated: 2026-11-26
layout: post
tags:
- ai-decision-operations
topic: slow-decision-cultures
archetype: framework
---

## Why do good models fail in production?

Most AI models perform well in testing. They fail later, in production, where they meet the process around them: data that arrives late or not at all, handoffs between teams, decisions that nobody clearly owns, and nights and holidays that the test data never included. A model placed into a weak process does not repair it. It makes the weakness faster.

Leaders preparing an AI deployment usually ask whether the model is good enough. It is a necessary question, and it misses a larger one: is the process ready to receive the model, and to cope when the model is wrong?

The evidence suggests the question is often skipped. In July 2024, [Gartner predicted](https://www.gartner.com/en/newsroom/press-releases/2024-07-29-gartner-predicts-30-percent-of-generative-ai-projects-will-be-abandoned-after-proof-of-concept-by-end-of-2025) that at least 30% of generative AI projects would be abandoned after proof of concept by the end of 2025, citing poor data quality, inadequate risk controls, escalating costs and unclear business value. Most of those causes sit in the process, not in the model.

## What does AI change in a process, and what does it not change?

AI changes the speed and volume of decisions. A process that once handled a few hundred cases a day by hand can suddenly route, approve or flag thousands. Every weakness in that process now operates at the same scale.

AI does not change the quality of the inputs, the ownership of the decisions or the organisation's ability to notice and undo a mistake. Those are properties of the process, and they determine whether a capable model creates value or creates incidents.

## Find the value: which parts of the process will the model depend on?

The first step is to trace the decision the model will make, end to end. Where do its inputs come from, and what happens when one is late, incomplete or wrong? Who acts on its output? How is a wrong decision noticed, and how quickly can it be reversed?

The answers usually show where the value is. Sometimes the biggest gain is not the model at all but the process fix it forces: a data feed that should have been checked, a handoff that should have had an owner, a manual step that should have been removed. In my judgement, these fixes often deliver a large share of the benefit that was attributed to the model.

**Decision for the sponsor:** which weaknesses in the process would make the model unsafe, and which of them are worth fixing whether or not the model goes ahead?

## Lead the change: what must be in place before the model goes live?

Five things make a process ready to receive a model:

- **Checked inputs.** Before the model makes a decision, the process confirms that its inputs are present, recent and within expected ranges. If they are not, the model does not decide.
- **A fallback.** When inputs fail or confidence is low, a simple, safe alternative takes over: a basic rule, or a route to a person.
- **A named owner for each kind of decision.** Someone is responsible for the decisions the model makes, including the ones that go wrong, and has the authority to change or stop them. This is set out in [who should be allowed to act on an AI signal](/2026-08-20-assign-decision-rights-now-how-to-turn-ai-signals-into-fast-authorized-actions/).
- **Reversibility.** Where possible, decisions can be undone cheaply. Where they cannot, a person reviews them first.
- **A careful rollout.** Deploy first where decisions are frequent, low in stakes and easy to reverse, and avoid launching just before holidays, month-end or other known disruptions.

There is a real trade-off here. Removing people from the process lowers average cost and raises the risk of rare, expensive failures. Keeping people on every decision is safe and slow. The sponsor should choose deliberately where each kind of decision sits.

**Decision for the sponsor:** which conditions must be met before go-live, and who owns each kind of decision the model will make?

## Prove the impact: are the decisions better, not just the model?

Offline accuracy is a poor guide to production value. Judge the deployment by its decisions: how quickly bad decisions were detected, how many were reversed, how far their effects spread, and how often the fallback was used.

Because true outcomes often arrive late, use early indicators where you can: the rate at which people override the model, the share of cases routed to the fallback, and complaints or reversals within days rather than months. Review a sample of high-stakes decisions regularly. A broader method for testing whether such work pays is discussed in [should you invest in AI for supply chain loss prevention](/2026-11-23-should-you-invest-in-ai-for-supply-chain-loss-prevention-buy-the-decision-not-the-alerts/).

**Decision for the sponsor:** on the evidence of decisions rather than accuracy, should the model be extended, kept within its current scope or withdrawn?

## What does it cost, and what is the cheaper alternative?

Readiness work costs time before the model delivers anything: building input checks and fallbacks, agreeing ownership, designing reversals and planning the rollout. It can feel like delay, and it is usually the cheapest insurance the deployment will have.

The cheaper alternative is sometimes to fix the process and not deploy the model at all. If the checked inputs, clear ownership and removed manual steps deliver most of the expected benefit, the model may not be worth its running cost yet. That outcome is a result, not a failure.

## Questions to put to your team

1. What happens today when one of the model's inputs is late or wrong?
2. Who owns each kind of decision the model will make, including the wrong ones?
3. What is the fallback when the model is unsure or switched off?
4. Which decisions can be reversed cheaply, and which need a person first?
5. Would fixing the process alone deliver most of the benefit?

## Frequently asked questions

### Why do AI projects fail after a successful pilot?

Often because the pilot tested the model and not the process. In production the model meets late or missing data, unclear ownership of its decisions, and situations nobody planned for. Gartner predicted in 2024 that 30% of generative AI projects would be abandoned after proof of concept, citing poor data quality and inadequate risk controls among the causes.

### What is a fallback for an AI model?

A fallback is a simple, safe way of making the decision when the model cannot be trusted: when its inputs are missing, its confidence is low or it is switched off. It might be a basic rule or a route to a person. A model without a fallback leaves the process with no answer when something goes wrong.

### Should an AI model be deployed everywhere at once?

Rarely. Start where decisions are frequent, low in stakes and easy to reverse, and expand as evidence builds. Avoid launching just before known periods of disruption, such as holidays or month-end, when unusual data is most likely and the people who could intervene may be away.

## Sources

- Gartner, [Gartner predicts 30% of generative AI projects will be abandoned after proof of concept by end of 2025](https://www.gartner.com/en/newsroom/press-releases/2024-07-29-gartner-predicts-30-percent-of-generative-ai-projects-will-be-abandoned-after-proof-of-concept-by-end-of-2025), July 2024.

A model is only as reliable as the process that feeds it and acts on it. Strengthening that process first is less visible than a launch, and it decides whether the launch is worth having. More on this is in the [people and adoption](/topics/people-and-adoption/) topic, and on organisational readiness in [is your operating model ready for AI](/2026-05-27-is-your-operating-model-ready-for-ai-ask-this-one-question-first/).
