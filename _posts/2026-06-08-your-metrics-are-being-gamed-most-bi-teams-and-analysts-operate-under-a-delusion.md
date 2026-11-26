---
title: How Do You Stop Teams Gaming the Metrics They Are Judged On?
subtitle: 'When a measure becomes a target, people learn to move the number. The answer is not more policing but better design: paired measures, checks against reality and targets that reward results.'
share-title: How Do You Stop Teams Gaming the Metrics They Are Judged On?
share-description: When a measure becomes a target it gets gamed. Pair measures, check numbers against reality and reward outcomes so teams improve results, not reports.
excerpt: Any measure tied to pay, promotion or reputation will be moved by the people judged on it, sometimes by improving results and sometimes by changing the number. Leaders reduce gaming by pairing measures, checking them against independent evidence and rewarding outcomes rather than reported activity.
tldr: By designing measures that are hard to move without improving the result. Pair each target with a counter-measure that would reveal gaming, check reported numbers against independent evidence, reward outcomes rather than activity, and watch for numbers that look better than reality. When a measure becomes a target, people will move it; good design makes improving the result the easiest way to do so.
keywords:
- metric gaming
- Goodhart's law
- KPI manipulation
- performance targets
- metric manipulation
- gaming metrics
faq:
- q: What is Goodhart's law?
  a: It is the observation that a measure loses its value once it becomes a target, because people change their behaviour to move the number rather than the thing it represented. The best-known wording, "When a measure becomes a target, it ceases to be a good measure", comes from the anthropologist Marilyn Strathern's 1997 paper on university audit.
- q: What is a counter-measure?
  a: A counter-measure is a second metric reported alongside a target to reveal whether the target is being met in the wrong way. For example, on-time delivery is paired with customer complaints about late delivery, and tickets closed with tickets reopened. If the target improves while its counter-measure worsens, gaming or a reporting problem is likely.
- q: Is metric gaming always dishonest?
  a: 'No. Much of it is people responding rationally to the incentives they are given: focusing on what is measured, choosing easy cases or recording work in the most favourable way. That is why the main fix is better design of measures and incentives, with policing reserved for the rarer cases of deliberate falsification.'
author: Hasan Jaffal
last-updated: 2026-11-26
layout: post
tags:
- risk-intelligence
topic: metric-manipulation
archetype: provide
thumbnail-img: /assets/img/posts/2026-06-08-your-metrics-are-being-gamed-most-bi-teams-and-analysts-operate-under-a-delusion.webp
share-img: /assets/img/posts/2026-06-08-your-metrics-are-being-gamed-most-bi-teams-and-analysts-operate-under-a-delusion.webp
---

## Why do measures stop working once people are judged on them?

Measures are useful because they describe something real. Once a measure is tied to pay, promotion or reputation, the people judged on it have a reason to move the number, and there are usually two ways to do so: improve the result, or change how the result is recorded. Over time the second way tends to grow, and the measure drifts away from the reality it once described.

Leaders who discover gaming usually respond with tighter definitions and more checking. That helps, and it misses the larger question: have we designed our measures and incentives so that improving the result is the easiest way to improve the number? If not, people will keep finding the other way.

The idea is long established. Its best-known wording, "When a measure becomes a target, it ceases to be a good measure", comes from the anthropologist Marilyn Strathern's [1997 paper on audit in British universities](https://en.wikipedia.org/wiki/Goodhart%27s_law), restating an observation by the economist Charles Goodhart. The cost of ignoring it can be severe. In 2016 the US Consumer Financial Protection Bureau [fined Wells Fargo $100 million](https://www.consumerfinance.gov/about-us/newsroom/consumer-financial-protection-bureau-fines-wells-fargo-100-million-widespread-illegal-practice-secretly-opening-unauthorized-accounts/) after employees, under pressure to meet sales targets, opened roughly 1.5 million deposit accounts that may not have been authorised by customers.

## What does AI change about metric gaming, and what does it not change?

AI changes both sides. It can detect gaming patterns, such as numbers that move in suspicious steps or records that look better than the evidence around them. It can also make gaming easier, by producing plausible records and reports quickly.

AI does not change the incentive. If people are rewarded for a number rather than a result, they will move the number, with or without AI. And a model trained on gamed data learns the gaming as if it were reality.

## Find the value: which of our targets are most likely to be gamed?

Gaming is most likely where three conditions meet: the measure carries significant reward or consequence, the people measured control how it is recorded, and nobody checks it against independent evidence.

Look at the targets that matter most to pay and promotion, and ask of each: could the people judged by it improve the number without improving the result? Where the answer is yes, look for signs: a target met suspiciously exactly, a measure improving while customer complaints, reopened cases or losses rise, or results that look much better in one team than in comparable ones.

**Decision for the sponsor:** which of our high-stakes targets could be met without improving the result, and is there any sign that they are?

## Lead the change: how do leaders design measures that resist gaming?

Four design choices make gaming harder and improvement easier:

- **Pair every target with a counter-measure.** Report on-time delivery alongside complaints about late delivery; tickets closed alongside tickets reopened; sales alongside cancellations. If the target improves while its counter-measure worsens, look closer.
- **Check against independent evidence.** Compare reported numbers periodically with evidence the measured team does not control: customer surveys, samples of records, physical counts.
- **Reward outcomes, not activity.** Tie incentives to results that are hard to fake, such as customers retained or losses reduced, rather than to counts of work done.
- **Make it safe to report bad news.** Where a red number brings punishment, people hide red numbers. Leaders who treat honest bad news as useful get more of it.

The related problem of measures that reassure without informing is covered in [what a false-confidence metric is and how to spot one](/2026-06-02-false-confidence-metrics-are-a-digital-opiate-for-operations/).

An illustrative example, not a documented case: a delivery team reports a high on-time rate every week while complaints about late deliveries rise. Pairing the two measures shows that deliveries are being marked as delivered before they arrive. The fix is not punishment but a counter-measure and an independent check.

**Decision for the sponsor:** what counter-measure will each high-stakes target carry, and which incentives need to change?

## Prove the impact: are the numbers and the reality moving together?

The evidence that gaming has reduced is that reported measures and independent evidence now move together. Track each target alongside its counter-measure and the periodic independent checks. Where they diverge, investigate before celebrating.

Review incentive outcomes too. Are rewards going to teams whose results, not just whose numbers, improved? Over time, the gap between what is reported and what is real should narrow. Choosing which measures deserve to exist at all is covered in [which three questions decide whether a metric is worth keeping](/2026-11-12-if-a-metric-wont-change-your-next-move-cut-it-three-questions-that-make-numbers-intelligent/).

Be careful with the first findings. When a counter-measure reveals that a target has been met in the wrong way, the instinct is to blame individuals. Usually the incentive and the measure created the behaviour, and changing them is what stops it from returning under a new name.

**Decision for the sponsor:** on the evidence, are our reported measures and independent checks moving together, and where do they still diverge?

## What does it cost, and what is the simpler alternative?

The costs include building counter-measures, running independent checks and redesigning incentives, which can be politically difficult. Reports also become less flattering, at least at first, as gaming stops inflating them.

The simpler first step is to take the single target most closely tied to pay and add one counter-measure to its report. That alone often reveals whether the target has been drifting away from reality, and it costs very little.

Senior leaders set the tone here. If they ask how a number was achieved as often as whether it was achieved, teams learn that the result matters more than the report, and gaming loses much of its appeal without any new rules.

## Questions to put to your team

1. Which of our targets could be met without improving the result?
2. Does each important target have a counter-measure that would reveal gaming?
3. When did we last check reported numbers against independent evidence?
4. Do our incentives reward outcomes or reported activity?
5. Is it safe for a team to report a red number?

## Frequently asked questions

### What is Goodhart's law?

It is the observation that a measure loses its value once it becomes a target, because people change their behaviour to move the number rather than the thing it represented. The best-known wording, "When a measure becomes a target, it ceases to be a good measure", comes from the anthropologist Marilyn Strathern's 1997 paper on university audit.

### What is a counter-measure?

A counter-measure is a second metric reported alongside a target to reveal whether the target is being met in the wrong way. For example, on-time delivery is paired with customer complaints about late delivery, and tickets closed with tickets reopened. If the target improves while its counter-measure worsens, gaming or a reporting problem is likely.

### Is metric gaming always dishonest?

No. Much of it is people responding rationally to the incentives they are given: focusing on what is measured, choosing easy cases or recording work in the most favourable way. That is why the main fix is better design of measures and incentives, with policing reserved for the rarer cases of deliberate falsification.

## Sources

- Marilyn Strathern, "'Improving ratings': audit in the British University system", *European Review*, 5(3), 1997, as summarised in [Goodhart's law](https://en.wikipedia.org/wiki/Goodhart%27s_law).
- Consumer Financial Protection Bureau, [CFPB fines Wells Fargo $100 million for widespread illegal practice of secretly opening unauthorized accounts](https://www.consumerfinance.gov/about-us/newsroom/consumer-financial-protection-bureau-fines-wells-fargo-100-million-widespread-illegal-practice-secretly-opening-unauthorized-accounts/), September 2016.

People will move whatever number they are judged on. The leader's task is to make improving the result the easiest way to move it. More on this is in the [outcomes and evidence](/topics/outcomes-and-evidence/) topic.
