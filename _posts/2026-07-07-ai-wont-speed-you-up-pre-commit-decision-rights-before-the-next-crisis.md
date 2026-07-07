---
layout: post
title: "AI Won’t Speed You Up—Pre-Commit Decision Rights Before the Next Crisis"
subtitle: "More detection without authority slows you down. Decide who can act, on what signals, and with what budget—now, not during the incident."
share-description: "AI exposes slow approvals and unclear ownership. Pre-commit decision rights, thresholds, and budgets before the next crisis or drown in alerts when it hits."
tags:
  - ai-decision-operations
topic: ai-topic
archetype: challenge
author: Hasan J.
tldr: "Most leaders think more models and real-time dashboards make them faster. Wrong. AI multiplies your approval delays. Detection without decision power becomes noise you pay for in money and reputation. The fix isn’t another tool; it’s pre-committing decision rights: who can act, on what signal, within what budget, and how quickly. Strong teams assign authority before the crisis, accept bounded mistakes, and practice the handoffs. Average teams sharpen detection and then stall at the first legal or VP review. Choose now: give your closest operator authority with an error budget, or let the next incident run you."
---

What most people believe: more AI and more real‑time monitoring will make them decisive. The graph updates faster, the model detects earlier, and speed follows.

I disagree. AI doesn’t speed you up. It multiplies whatever is already in your operating model. If you have slow approvals and unclear ownership, AI will expose that faster and at scale. You’ll get more alerts, sooner, into the same clogged decision pipes.

Last November, I sat with a consumer marketplace during a holiday spike. They had just rolled out a card‑fraud model that could spot coordinated sprees within minutes. At 7:12 a.m. on a Friday, the detector lit up—forty times the baseline in three regions. The risk analyst on call did everything right: verified inputs, checked a second signal, and raised the flag.

Then the brakes hit. Their policy said account freezes above a certain count needed Legal and a VP sign‑off because of false positives and PR risk. Legal was in transit. The VP was in a board prep. Ops spun up a war room and kept “monitoring.” Sellers kept shipping. Four hours later, they had thousands of bad orders out the door and an angry pile of chargebacks. The CFO asked why the model failed. It didn’t. Approvals did. By Monday, they turned the model sensitivity down “to reduce noise.” They didn’t fix noise. They hid from decisions.

This is the part leaders miss: signals don’t carry authority. You have to give them authority. If a model’s output cannot trigger a pre‑approved action within a bounded budget and time window, it’s just an opinion you pay to hear.

The popular belief says: centralize approvals to reduce risk. My counter‑example: a same‑day delivery company I worked with took the opposite bet before summer storms. They pre‑committed decision rights. For any surge above a defined threshold in failed address verifications, the on‑call incident lead could auto‑hold shipments in two distribution centers for up to 30 minutes and spend a fixed budget on alternate carriers—no executive touch. They practiced the drill every quarter.

One Saturday, it hit. A routing model flagged a bad data feed from a partner, and orders started bouncing. The on‑call didn’t beg for permission. They froze two centers, rerouted five lanes, and pushed a customer notice that had been pre‑approved. Some good orders were delayed. Credits went out. But they contained the blast in under an hour and avoided a full‑day backlog. The CEO didn’t have to be a hero. The decision was already made—weeks earlier.

Here is the uncomfortable trade‑off you have to face: speed requires letting the closest person act and accepting some bounded wrong decisions. That means you will lock a few clean accounts, delay a few good orders, or pay a small premium for a backup path. If you can’t live with that, be honest that you choose slower and larger losses under stress.

Strong teams do something simple that average teams avoid: they pre‑commit decision rights with money attached. They turn “who decides?” from a live debate into a written contract.

What that looks like in practice:

- Decision cap table: For each high‑stakes signal, write down who can pull which lever, with what budget and for how long. Make it visible and versioned. Titles don’t decide—roles do.
- Pre‑approved actions: Link model outputs to actions with thresholds. “If A + B fire above X, then hold Y for Z minutes” is clear. “Investigate and escalate” is how you stall.
- Timeboxed escalation: If the owner does not act within N minutes, it auto‑escalates by timer, not by politics. Silence is a decision to escalate.
- Error budget by design: Agree on the acceptable false positives per action window. Write the dollar cap, not a vibe. Without a cap, nobody will own the hit.
- One channel, one commander: Incidents run through a single channel with a rotating incident lead who can spend the budget. Ban parallel sign‑off threads that drift for hours.
- Drills and red teams: Run the play on a real clock. Kill switches, rollbacks, customer comms. If you would be embarrassed to simulate it, you will fail it live.
- Post‑incident accounting: Track money moved under authority, not just model precision. Your cycle time to action is a metric. So is “decisions taken without exec” during load.

Notice what’s missing: nobody asked for another dashboard. Average teams respond to a miss by buying more detection and adding another review step. Strong teams accept that faster signals without faster authority make you look busy while you lose. They make the hard calls before they’re popular: who can hit pause, who can spend, who owns the blowback.

If you lead AI, data, risk, or ops, your job this week is not to calibrate another threshold. It’s to clear the path between a known signal and a paid action. Pick one scenario that hurt you in the last year. Write the if‑then. Set a dollar cap. Name the on‑call who can act. Get Legal to pre‑approve the customer message. Put it on a laminated card and in your runbook. Then drill it until it’s boring.

The next crisis will not test your model. It will test whether you believed enough in it to grant authority when it mattered. Signals are cheap. Decisions are expensive. Delay is the most expensive of all.

When your model fires at 2:13 a.m., will you let the on‑call lock what’s needed within a pre‑set budget, or will you wait for a VP and let the loss and anger pile up while you “monitor”? Choose a side.
