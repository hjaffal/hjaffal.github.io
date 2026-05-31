---
layout: lexicon-term
title: "Decision Latency — AI Operations Lexicon"
share-title: "Decision Latency — AI Operations Lexicon"
share-description: "The time between detecting a problem and having authority to act on it."
permalink: /lexicon/decision-latency/
term_name: "Decision Latency"
pos: "n."
definition: "The time between detecting a problem and having authority to act on it."
category: "slow-decision-cultures"
explanation: "AI detects in milliseconds. Humans approve in days. The gap between detection speed and decision speed is where losses accumulate."
example: "An anomaly detection system flags suspicious activity at 2am. The on-call analyst sees it but cannot block the account without manager approval. The manager responds at 9am. Seven hours of exposure."
why_it_matters: "Every minute of decision latency is a minute of uncontrolled risk. In fraud, that is money. In security, that is data."
teams_get_wrong: "They optimize model accuracy while ignoring the approval chain that follows the alert."
strong_teams: "Measure time-to-action, not just time-to-detection. Pre-authorize responses for known patterns."
related_terms:
  - "escalation-debt"
  - "governance-fog"
  - "ai-theater"
keywords:
  - "decision speed"
  - "approval chain"
  - "response time"
updated_at: "2026-05-31"
---
