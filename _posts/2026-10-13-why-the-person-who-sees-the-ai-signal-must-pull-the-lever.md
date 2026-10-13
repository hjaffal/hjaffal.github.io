---
layout: post
title: "Why the Person Who Sees the AI Signal Must Pull the Lever"
subtitle: "AI exposes weak ownership and slow approvals. Bind authority to detection or pay for noise."
share-description: "AI speeds up detection, not decisions. If the person who sees the signal can’t act, you’re buying expensive noise. Here’s a decision framework and how to use it under pressure."
tags:
  - ai-decision-operations
topic: ai-topic
archetype: describe
author: Hasan J.
tldr: "AI accelerates detection but has no power to resolve unclear ownership. Alerts without authority become expensive noise. The fastest clean path is to bind the lever to the eyes that see the signal. Use a simple decision framework—Signal, Lever, Window, Default, Backstop, Review—to let the detector act within a tight time window on pre-approved actions. This trades a few wrong fast calls for eliminating slow, systemic misses. Strong teams pre-commit cutoffs and authority by role, rehearse under pressure, and measure time-to-lever. Average teams add approvals. Choose who owns the lever."
---

AI speeds up detection. It does nothing for ownership. If the person who sees the signal cannot act, you just multiplied how often you discover problems you are structurally unable to fix in time.

This is not philosophical. Signals need authority. Without it, precision becomes noise. Every new model that finds issues earlier only sharpens the pain of slow decisions and unclear chains.

The operational rule is simple: the eyes that see the signal should pull the lever. Not after a committee. Not after a second confirmatory dashboard. Right there, within a defined window, using pre-agreed actions.

Why this works:
- Detection is perishable. The value of a signal decays by the minute. Latency in approval chains usually exceeds the decay curve.
- Context lives with the detector. The person who caught it understands scope, confidence, and history. You lose that when you route for sign-off.
- Ambiguity compounds. Each handoff adds questions and delays. Authority at the point of detection collapses the chain.

A compact decision framework

Bind your AI signals to decisions with five elements:

- Signal: Define what the alert means in operational terms. What is being measured, how it fails, and how confident the model is at each level.
- Lever: Pre-approve the concrete action(s) that can be taken immediately. Examples: roll back, throttle, quarantine, disable feature flag, block cohort, pause job.
- Window: Set a maximum time-to-decision (e.g., three minutes). Past the window, the default action auto-fires or the page escalates.
- Default: Choose a bias when uncertain. Pick reversible pain over irreversible damage. Document when to act on “yellow” to avoid waiting for “red.”
- Backstop: Define the next escalation hop, audit logging, and a rapid review loop to tighten thresholds and actions after the fact.

Who holds this? The person on the hook for the page or stream where the signal fires. Authority attaches to the role, not the seniority of the human filling it.

A real scenario

A consumer platform shipped a localization change at 01:10 UTC. Ten minutes later, the conversion model flagged a steep drop at the checkout step for two EU markets. The on-call growth engineer saw the alert first. She needed a product manager and a release manager to approve a rollback. Both were asleep. Slack pings, phone calls, calendar hunting. Twenty-five minutes later, they approved. Orders recovered after the revert. Overnight, support woke up to a backlog of “payment failed” messages.

Nothing was wrong with the model. The AI did its job. Ownership failed. The team paid in lost orders and cleanup time.

Two weeks later, they changed the decision path using the framework above:
- They defined the signal: a model-based step-drop at checkout above a set magnitude for a region.
- They bound levers: revert the last release for that region or disable the feature flag.
- They set the window: three minutes from alert to action.
- They chose a default: when in doubt at night, revert one step; fix forward in the morning.
- They set the backstop: if the on-call hesitated, SRE was the auto-escalation at minute three.

The next time it fired, the on-call reverted within two minutes. They woke the PM after. No backlog.

The uncomfortable trade-off

You will make a few wrong fast calls. You will revert a clean release once in a while or block a cohort that turns out benign. The exchange is speed for precision. But the alternative—slow accuracy—costs more. Outage minutes, fraud exposure, data drift, SLA hits. Fast, reversible action wins in most operational domains.

Average teams pretend they can keep both: slow approvals with perfect accuracy and zero downside. They can’t. The choice is explicit: accept small, contained, reversible errors made quickly, or accept slower, larger failures that pile up.

What strong teams do differently

- Authority by role, not title: The person on-call for a signal has pre-approved levers and uses them. No chasing signatures.
- Pre-commit cutoffs and actions: They don’t argue thresholds live. They agree them in daylight and practice on dry runs.
- Measure decision latency: They track time-to-lever as a core KPI. If the window slips, they treat it as an incident cause.
- Rehearse pressure: They run game days with real alerts and real authority. The first time you pull the lever should not be during a customer-impacting event.
- Document reversibility: They know which actions are safe to undo and bias toward those under uncertainty.
- Short, honest reviews: After action, they adjust the signal definition, the default, or the window. No blame. Tighten the loop.

How to apply this under pressure today

- Pick one signal that causes pain when delayed. Don’t start with everything. Start where minutes matter.
- Write the one-page card: signal definition, allowed levers, decision window, default, backstop. Share it with the team.
- Grant the permission: update access control so the on-call can actually execute the lever without waiting.
- Set the timer: add a visible countdown in the alert. At zero, auto-fire the default or escalate.
- Run a live rehearsal: during business hours, simulate the alert and force the decision within the window. Fix the frictions you find.
- Audit and adjust: after the first real event, change one thing. Shorten the window or tune the default. Iterate weekly until the chain is boring.

Common objections, answered

- “What if they overreact?” Then you chose the wrong default or levers. Shift toward reversible actions and tighten the review loop. Don’t reintroduce slow approvals.
- “Legal/compliance needs a say.” Fine. Codify their guardrails into the allowed levers and defaults. Pre-approve the actions; do not require live sign-off.
- “Junior people can’t own this.” They already own it in practice; they’re the ones awake. Give them a framework, training, and authority, or accept the cost of delay.

AI will keep finding issues faster. If you don’t move authority to the person who sees the signal, you will drown in alerts while your outcomes stay the same.

Choose a side: will your on-call who sees the alert have the right to pull the lever within three minutes—yes or no?
