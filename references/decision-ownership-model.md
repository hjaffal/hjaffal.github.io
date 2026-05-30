---
layout: reference
title: "Decision Ownership Model"
subtitle: "A framework for assigning decision authority before signals arrive"
share-title: "Decision Ownership Model — Hasan Jaffal"
share-description: "A framework for pre-committing decision rights in operations. Signals need authority — detection without decision power is expensive noise."
permalink: /references/decision-ownership-model/
position_tag: ai-decision-operations
position_name: "AI & Decision Operations"
related_topic: slow-decision-cultures
keywords:
  - decision ownership
  - decision authority
  - decision rights framework
---

## What Is Decision Ownership?

Decision ownership means pre-committing **who can act, under what conditions, within what time** — before the signal arrives. It's the missing layer between detection and outcome.

Most organizations invest in detection (dashboards, alerts, AI models) but not in the authority to act on what they detect.

## The Decision Ownership Matrix

For every operational signal, define:

| Element | Question | Example |
|---------|----------|---------|
| **Owner** | Who decides? | "The on-call risk analyst" |
| **Trigger** | What activates the decision? | "Fraud score > 85 on transactions > €5,000" |
| **Authority** | What can they do without approval? | "Block the transaction immediately" |
| **Time bound** | How fast must they act? | "Within 60 seconds of alert" |
| **Escalation** | When do they escalate? | "If pattern affects > 10 accounts, escalate to director" |
| **Accountability** | Who owns the outcome? | "The analyst who blocked or approved" |

## Decision Speed Tiers

| Tier | Response Time | Authority Level | Example |
|------|--------------|-----------------|---------|
| **Tier 1: Autonomous** | < 1 minute | Individual contributor | Block suspicious transaction |
| **Tier 2: Rapid** | < 1 hour | Team lead | Pause a campaign, disable an account |
| **Tier 3: Escalated** | < 4 hours | Director/VP | Change a policy, shut down a system |
| **Tier 4: Strategic** | < 24 hours | Executive | Organizational change, public response |

## The Pre-Commitment Principle

Decision ownership must be assigned **before** the crisis, not during it. During a crisis, people default to the safest option (do nothing, call a meeting, wait for approval). Pre-commitment removes that hesitation.

**Before:** "If X happens, we'll figure out who handles it."
**After:** "If X happens, person Y does Z within T minutes."

## Common Decision Ownership Failures

| Failure | Symptom | Fix |
|---------|---------|-----|
| Shared ownership | "The team decides" | Assign one name, not a group |
| Unclear thresholds | "Use your judgment" | Define specific numbers |
| Missing time bounds | "Handle it when you can" | Set explicit response times |
| No escalation path | "Figure it out" | Define when and how to escalate |
| Accountability diffusion | "We all agreed" | One person signs off, one person owns |

## How to Implement

**Step 1: Map your signals**
List every alert, dashboard threshold, and AI output that requires a human response.

**Step 2: Assign owners**
For each signal, name one person (not a team, not a role — a person).

**Step 3: Define authority**
What can the owner do without asking permission? Write it down.

**Step 4: Set time bounds**
How fast must they respond? Match the response time to the risk velocity.

**Step 5: Build escalation**
When does the owner escalate? To whom? What information must they provide?

**Step 6: Test under pressure**
Run a drill. Fire the signal at 2am. See if the system works without a meeting.

## The Cost of Missing Decision Ownership

Every minute between signal and action is a minute of uncontrolled risk. In fraud operations, that's money lost. In security, that's data exposed. In operations, that's cascading failure.

The best AI model in the world loses when the approval chain moves slower than the threat.
