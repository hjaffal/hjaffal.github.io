---
layout: post
title: "Stop Shipping Metrics That Don’t Trigger Action"
subtitle: "Define the decision, the owner, the threshold, and the authority—or delete the metric."
share-description: "Leaders: kill report-only metrics. Build trigger metrics with thresholds, owners, and pre-authorized moves so your data changes what happens next."
tags:
  - risk-intelligence
topic: risk-topic
archetype: explain
author: Hasan J.
tldr: "There are only two kinds of metrics: those that inform and those that trigger. Informing explains what happened. Triggering changes what happens next. If a metric cannot cause a specific person to take a pre-authorized action within a set time, it is decoration. Stop accepting dashboards and weekly updates as deliverables. Replace them with trigger metrics: named owners, clear thresholds, defined actions, and a timer to measure time-to-decision. Strong teams wire metrics into authority and reversibility. Average teams admire charts. Decide now which metrics you will delete and which you will arm with thresholds, playbooks, and ownership."
---

There are only two kinds of metrics: the ones that inform and the ones that trigger. Inform metrics explain what happened. Trigger metrics cause a decision within a defined time. If a metric cannot change what happens next, it is decoration.

The difference is structural, not cosmetic. An inform metric ends at a chart. A trigger metric continues into a threshold, an owner, authority to act, a playbook, and a timer that starts when the signal fires. That chain is what turns reporting into intelligence.

Here is the logic:
- Sensor detects a change.
- Threshold defines “enough to act.”
- Owner is accountable to move first.
- Authority is pre-approved, not requested.
- Playbook lists the action and rollback.
- Timer measures detection to decision to effect.
- Feedback updates the threshold or playbook.

Break any link and you fall back to reporting. You will talk about the number instead of moving the lever.

What leaders must stop doing now:
- Stop accepting dashboards without named owners and pre-authorized actions.
- Stop weekly “status” meetings where no thresholds are raised or lowered.
- Stop tracking metrics that nobody will move budget, friction, or controls for.
- Stop shipping “FYI” alerts; they train the team to ignore real ones.
- Stop letting product, risk, and ops argue about action authority after the spike hits.

What to do instead:
- For each kept metric, write the decision it triggers in one sentence: “When X crosses Y, [owner] will do Z within T minutes.”
- Assign one owner for the threshold and one for the action. Make them the same person unless there is a legal reason not to.
- Pre-authorize a ladder of moves (e.g., tighten, then block, then freeze) and a rollback plan.
- Put a timer on every alert. Track time to decision and time to effect as primary KPIs.
- Build reversibility. Small, fast, reversible actions beat perfect but late ones.
- Kill or archive everything else. Less surface area means faster recognition and cleaner response.

A concrete workplace example.

At a marketplace I advised, payments risk and checkout owned different parts of the funnel. Monday morning, customer support tickets mentioned surprise declines. The analytics channel lit up. An analyst pasted a Looker chart showing a rising issuer decline rate. Product said, “Let’s watch for another hour.” Risk said, “We should enable step-up authentication.” Growth pushed back. Nobody knew who could flip the switch.

By the time they aligned, the team had chased ten threads and moved zero levers. Losses rose. Social media noticed. The postmortem found nothing exotic: the metric informed but did not trigger. It had no threshold, no timer, no owner with authority, and no pre-approved action ladder.

They rebuilt it as a trigger metric:
- Decision: “If issuer declines jump above the baseline for a sustained window, we tighten authentication for selected bins and routes.”
- Owner: On-call Risk Lead.
- Authority: Pre-authorized by CTO and GM to change routing and require step-up on defined routes without new approvals.
- Threshold: Clearly defined windows and variance bands, reviewed weekly and tuned after incidents.
- Playbook: Action ladder, communication template to customer support, and a rollback rule once the metric returns to band.
- Timer: The alert starts a clock. The team measures time to decision and time to effect.

Two weeks later, a similar spike hit. The on-call lead acted in minutes. Conversion dipped on the affected routes, then recovered after rollback. The difference was not a better model. It was the move from inform to trigger.

The uncomfortable trade-off you must face: speed versus friction. Trigger metrics move faster and sometimes act on imperfect signals. That can add friction for good users or create small revenue dips. Inform metrics feel safer. They never create false positives because they never act. You must choose where to place that pain: a controlled, reversible action now, or a larger, often public cost later.

Strong teams choose speed with guardrails. They design their pain. Average teams inherit it.

What strong teams do differently:
- They define the controlled variable up front. What knob will you turn when the metric fires? If there is no knob, they drop the metric or build the knob first.
- They tie every trigger to a budget: risk budget, friction budget, or cost-of-delay. The owner can spend that budget without new permission.
- They measure time-to-decision and time-to-effect and review them like revenue. Slow times trigger changes to thresholds, staffing, or authority.
- They keep a trigger register: all active metrics, thresholds, owners, action ladders, and rollback rules in one place.
- They rehearse. On-call runs the playbook on test signals weekly. Reversals are practiced, not improvised.
- They prune. If a trigger doesn’t fire or never changes a lever for a quarter, it is retired or redesigned.

Average teams admire dashboards. They confuse coverage with control. They reward neat charts, not moved thresholds. They discuss signals at length, then open a ticket. The ticket waits for approvals. The window closes. The loss is written off as “market noise.”

You can tell which team you have by a simple check: ask for the three most important metrics and, for each, name the owner, the threshold, the first move, the rollback, and the target time to act. If you cannot answer in one breath, you have reports, not intelligence.

Implementation sequence for leaders in the next 30 days:
- Week 1: Inventory metrics. Tag each as inform or trigger. Delete or archive 30% that have no clear lever.
- Week 2: For the top five triggers, write the one-sentence decision, set thresholds, and name owners. Grant written authority.
- Week 3: Build the action ladders and rollback steps. Add the timer and logging. Rehearse.
- Week 4: Review time-to-decision for any live fire. Adjust thresholds. Prune again.

This is not about being harsh. It is about treating time as a first-class risk. Intelligence is measured in how quickly and safely you can pivot when the world changes. Reporting is a mirror. Intelligence is a lever.

Choose a side: will you delete every metric without a threshold, owner, authority, and timer by Friday, or will you keep decorating the wall?
