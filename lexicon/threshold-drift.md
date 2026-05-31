---
layout: lexicon-term
title: "Threshold Drift — AI Operations Lexicon"
share-title: "Threshold Drift — AI Operations Lexicon"
share-description: "When alert thresholds gradually loosen until they no longer catch real problems."
permalink: /lexicon/threshold-drift/
term_name: "Threshold Drift"
pos: "n."
definition: "When alert thresholds gradually loosen until they no longer catch real problems."
category: "false-confidence-metrics"
explanation: "Teams set thresholds. Alerts fire too often. They loosen the threshold. Repeat. Eventually the threshold is so loose it only catches catastrophic failures — missing everything in between."
example: "A fraud alert originally fires at 100 dollars. Too many false positives. Raised to 500. Then 1000. Then 5000. Now it only catches the largest fraud events. Everything under 5000 goes undetected."
why_it_matters: "Threshold drift is invisible. Nobody decides to stop catching fraud. It happens one adjustment at a time."
teams_get_wrong: "They adjust thresholds to reduce noise without measuring what they stop catching."
strong_teams: "Track what falls below threshold after every adjustment. Measure the cost of what you stop detecting."
related_terms:
  - "dashboard-sedation"
  - "alert-fatigue"
  - "vanity-signal"
keywords:
  - "alert threshold"
  - "false positive management"
  - "detection gap"
updated_at: "2026-05-31"
---
