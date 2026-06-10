# Chapter V: Methodology

---

## Analytical Framework

This report evaluates 154 professional roles against a standardized forensic framework designed to measure task-level automation exposure within a 24-month deployment window. The methodology prioritizes structural analysis over speculation, measuring what AI systems can demonstrably execute today and projecting organizational adoption timelines based on observable deployment patterns.

This chapter documents the complete analytical framework, scoring criteria, definitions, and limitations — providing full transparency for researchers, journalists, and professionals who wish to evaluate the rigor of the findings.

---

## The Forensic Audit Model

Each role in Chapter III was evaluated through a five-stage forensic process:

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  STAGE 1: TASK DECOMPOSITION                                        │
│  Break the role into its constituent daily activities               │
│  ↓                                                                  │
│  STAGE 2: LAYER CLASSIFICATION                                      │
│  Assign each task to an operational layer (1-5)                     │
│  ↓                                                                  │
│  STAGE 3: AUTOMATION FEASIBILITY SCORING                            │
│  Evaluate each task against current AI capabilities                 │
│  ↓                                                                  │
│  STAGE 4: TIME-WEIGHTED AGGREGATION                                 │
│  Calculate the role's composite automation index                    │
│  ↓                                                                  │
│  STAGE 5: DISRUPTION CLASSIFICATION                                 │
│  Assign the role to a disruption class based on thresholds          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Stage 1: Task Decomposition

### Definition
Every professional role is decomposed into 5-8 discrete task categories representing the complete scope of daily work. Tasks are defined at the activity level — not the outcome level.

### Criteria for Task Identification
- Tasks must be observable and time-measurable
- Tasks must occur with regularity (minimum weekly frequency)
- Tasks must represent a meaningful percentage of total working time (minimum 3%)
- Tasks must be distinct from each other (no overlapping categories)

### Time Allocation
Each task is assigned a percentage of total working time based on a standard 40-hour work week. Time allocations are derived from:
- Role-specific job description analysis (standard scope of work)
- Organizational structure patterns (typical team configurations)
- Process flow analysis (standard workflows for the function)

Time allocations represent the **median** professional in this role — not best-case or worst-case performers.

---

## Stage 2: Layer Classification

### The Five-Layer Model

Every professional task exists on one of five operational layers. The layer determines the task's structural relationship to AI automation.

| Layer | Name | Definition | AI Relationship |
|:---:|:---|:---|:---|
| 1 | Execution | Rule-based processing with defined inputs and outputs | Fully automatable |
| 2 | Analysis | Pattern recognition, data synthesis, and summarization | Largely automatable |
| 3 | Coordination | Information relay, scheduling, status management, and cross-functional communication | Partially automatable |
| 4 | Judgment | Decisions requiring trade-off evaluation, ambiguity resolution, and accountability | Minimally automatable |
| 5 | Strategy | Direction-setting, vision, organizational design, and capital allocation | Not automatable within window |

### Layer Assignment Rules

A task is assigned to the highest layer that accurately describes its **primary cognitive requirement** — not its most complex occasional demand.

- If a task is "mostly data processing with occasional judgment calls" → Layer 2 (not Layer 4)
- If a task is "mostly coordination with occasional strategic input" → Layer 3 (not Layer 5)
- The layer reflects the dominant mode, not the exception

---

## Stage 3: Automation Feasibility Scoring

### Definition
Each decomposed task receives an individual automation feasibility score (0-100) representing the probability that an agentic AI system can execute this task to acceptable quality within the 24-month window.

### Scoring Criteria

| Score Range | Meaning | Current State |
|:---:|:---|:---|
| 90-100 | Task is already being automated in production at scale | Deployed systems exist |
| 75-89 | Task automation is technically proven and entering enterprise deployment | Integration phase |
| 60-74 | Task automation is technically feasible with current models | Proof-of-concept stage |
| 40-59 | Task automation is partially feasible; human oversight still required | Research/early pilot |
| 20-39 | Task automation faces significant barriers (data, context, accountability) | Not yet viable |
| 0-19 | Task automation is structurally blocked by human-dependency requirements | No foreseeable path |

### Scoring Inputs

Feasibility scores are determined by evaluating each task against five dimensions:

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  DIMENSION 1: TECHNICAL CAPABILITY                                  │
│  Can current AI systems perform this task in isolation?              │
│  Weight: 30%                                                        │
│                                                                     │
│  DIMENSION 2: DATA AVAILABILITY                                     │
│  Does sufficient structured/unstructured data exist to train        │
│  and operate AI for this task?                                      │
│  Weight: 20%                                                        │
│                                                                     │
│  DIMENSION 3: INTEGRATION COMPLEXITY                                │
│  How difficult is it to connect AI to the systems, tools, and       │
│  data sources required for this task?                               │
│  Weight: 20%                                                        │
│                                                                     │
│  DIMENSION 4: ERROR TOLERANCE                                       │
│  What is the organizational cost of an AI error on this task?       │
│  Lower cost → faster adoption. Higher cost → slower adoption.       │
│  Weight: 15%                                                        │
│                                                                     │
│  DIMENSION 5: DEPLOYMENT VELOCITY                                   │
│  How quickly are organizations actually deploying AI for            │
│  this specific task category?                                       │
│  Weight: 15%                                                        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Stage 4: Time-Weighted Aggregation

### The Automation Index Formula

The role's composite **Automation Index** is calculated as a time-weighted average of individual task feasibility scores:

```
Automation Index = Σ (Task_Feasibility_Score × Task_Time_Allocation) / 100
```

**Example calculation:**

| Task | Time % | Feasibility | Contribution |
|:-----|:---:|:---:|:---:|
| Data extraction | 25% | 95% | 23.75 |
| Report generation | 20% | 90% | 18.00 |
| Dashboard maintenance | 15% | 88% | 13.20 |
| Exploratory analysis | 15% | 70% | 10.50 |
| Data cleaning | 10% | 85% | 8.50 |
| Stakeholder communication | 10% | 35% | 3.50 |
| Strategic recommendation | 5% | 20% | 1.00 |
| **Total** | **100%** | | **78.45** |

Role Automation Index: **78%** → Rounded to nearest whole number.

### Properties of the Index
- Range: 0-100 (theoretical); observed range in this study: 15-96
- Higher = more exposed to automation
- Measures the role as structurally defined, not individual performance
- Does not account for organizational speed of adoption (that is captured in the timeline)

---

## Stage 5: Disruption Classification

### Threshold Definitions

| Automation Index | Disruption Class | Organizational Outcome |
|:---:|:---|:---|
| 75-100% | Full Asset Substitution | Role eliminated from headcount plans |
| 60-74% | Core Task Attrition | Role retained at 40-60% reduced headcount |
| 40-59% | Structural Reclassification | Role transforms; incumbents may not qualify for new version |
| 0-39% | Peripheral Automation | Role largely unaffected; minor efficiency gains only |

### Classification Rules
- Thresholds are fixed and applied uniformly across all 154 roles
- No manual override or "expert judgment" adjustment is applied after scoring
- The classification reflects the structural outcome, not the individual outcome

---

## Key Definitions

### Execution Layer
Work that involves processing defined inputs into defined outputs according to known rules, documented procedures, or standard methodologies. The critical characteristic: the "correct" output is determinable without human judgment.

**Indicators:** The task has a template. The task has a checklist. The task produces a standardized output. The task can be described as a procedure.

### Judgment Layer
Work that involves evaluating trade-offs between competing priorities, making decisions with incomplete information, navigating ambiguity where multiple valid approaches exist, or bearing personal accountability for outcomes.

**Indicators:** The task has no template. The output depends on context. Reasonable people would disagree on the "correct" approach. The person is personally accountable for the outcome.

### Agentic AI System
An artificial intelligence system that operates autonomously across multi-step workflows, maintains state between interactions, self-corrects errors without human prompting, and coordinates with other AI agents to complete complex objectives. Distinguished from "copilot" AI by the absence of human-in-the-loop requirements during execution.

### 24-Month Window
The period between January 2026 and December 2027. Represents the forecast horizon for organizational adoption — not technical capability (which already exists for most tasks). The window captures the gap between "AI can do this" and "organizations are using AI to do this at scale."

### Automation Index
A composite score (0-100) representing the percentage of a role's standard daily task load that faces complete machine execution within the 24-month window. Calculated as a time-weighted average of individual task feasibility scores.

### Disruption Class
A categorical classification of the organizational outcome for a role based on its automation index threshold. Four classes exist: Full Asset Substitution, Core Task Attrition, Structural Reclassification, and Peripheral Automation.

---

## Scope and Boundaries

### What This Report Measures
- Task-level automation feasibility for 154 specific job roles
- Structural exposure based on standard role definitions
- Organizational deployment timelines based on observable patterns
- The execution-to-judgment ratio of each role

### What This Report Does Not Measure
- Individual performance within a role (two people in the same role may have different EJRs)
- Company-specific adoption speed (varies by industry, geography, and organizational maturity)
- Regulatory intervention (potential government action to slow or restrict AI deployment)
- Economic recession effects (macro-economic conditions may accelerate or delay adoption)
- Geographic variation (automation indexes assume global enterprise deployment patterns)

---

## Limitations and Caveats

### Limitation 1: Median Representation
The automation index represents the **median** professional in each role. Individuals who have already repositioned toward judgment-layer work will have lower personal exposure than the role benchmark indicates. Individuals who spend more time on execution than the median will have higher exposure.

### Limitation 2: Static Snapshot
This report captures automation feasibility as of the publication date. AI capabilities are advancing continuously. Roles classified as "Structural Reclassification" today may shift to "Core Task Attrition" within months as new systems deploy. The 24-month window is conservative.

### Limitation 3: Organizational Inertia
The timeline assumes rational organizational behavior — that companies will adopt cost-reducing technology as it becomes reliable. In practice, organizational inertia, union agreements, change management friction, and leadership conservatism may delay adoption beyond the forecast window for specific companies. The structural pressure remains regardless.

### Limitation 4: Role Definition Variability
Job titles are not standardized across organizations. A "Data Analyst" at one company may operate at Layer 2-3, while a "Data Analyst" at another may operate at Layer 4-5. The automation index reflects the most common structural definition of the role — readers should assess their personal time allocation against the benchmark.

### Limitation 5: Emergent Roles
This report evaluates existing roles. New role categories that emerge in response to AI deployment (AI System Governor, Prompt Architect, Human-AI Collaboration Specialist) are not evaluated because they do not yet have standardized definitions or sufficient incumbents to assess.

---

## Reproducibility

### For Researchers
The complete dataset (154 roles × task decompositions × feasibility scores × time allocations) is available for academic citation and independent verification. The scoring framework is deterministic — applying the same criteria to the same role definition should produce scores within ±5 points of those published here.

### For Journalists
This report is designed to be cited at the role level. Each entry in Chapter III functions as an independent, self-contained assessment. Attribution: "2028 Agentic AI Workforce Disruption Report, hasanjaffal.com, 2026."

### For HR Professionals
The automation indexes in this report can be used as directional inputs for workforce planning. They should not be used as the sole basis for headcount decisions. Organizational context, individual performance, and local market conditions must be factored into implementation.

---

## Update Cadence

This report represents the first edition of an ongoing research program. Updates will be published:
- **Quarterly:** Automation index revisions for roles where deployment velocity has materially changed
- **Semi-annually:** New role additions as emerging job categories become evaluable
- **Annually:** Full methodology review and threshold recalibration

---

*End of Chapter V. This concludes the 2028 Agentic AI Workforce Disruption Report.*

---

## About This Research

This report was produced by the AI & Operational Intelligence research program at hasanjaffal.com. The program focuses on the intersection of artificial intelligence, workforce structure, and operational decision-making.

The research methodology prioritizes forensic, task-level analysis over macro-economic speculation. It is designed to provide actionable data for individual professionals, organizational leaders, and workforce researchers — not to generate headlines or confirm existing narratives.

**Citation format:**
*2028 Agentic AI Workforce Disruption Report.* hasanjaffal.com. 2026. Available at: https://hasanjaffal.com/ai-job-risk-directory/

**Contact:**
Research inquiries: https://hasanjaffal.com/contact/

---

*Publication date: 2026. Forecast window: January 2026 – December 2027. 154 roles evaluated. Methodology version: 1.0.*
