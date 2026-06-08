#!/usr/bin/env python3
"""Generate 50 mid-career AI Job Risk audit pages and add them to the directory data."""

import os
import yaml

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(BASE_DIR, "_data", "ai_job_risk_directory.yml")
OUTPUT_DIR = os.path.join(BASE_DIR, "ai-job-risk")

NEW_ROLES = [
    {"title": "Senior Software Engineer", "slug": "senior-software-engineer", "automation_index": 55, "disruption_class": "Structural Reclassification"},
    {"title": "Engineering Manager", "slug": "engineering-manager", "automation_index": 32, "disruption_class": "Peripheral Automation"},
    {"title": "Senior Business Analyst", "slug": "senior-business-analyst", "automation_index": 52, "disruption_class": "Structural Reclassification"},
    {"title": "Senior Data Analyst", "slug": "senior-data-analyst", "automation_index": 58, "disruption_class": "Structural Reclassification"},
    {"title": "Senior Financial Analyst", "slug": "senior-financial-analyst", "automation_index": 55, "disruption_class": "Structural Reclassification"},
    {"title": "Senior Product Manager", "slug": "senior-product-manager", "automation_index": 28, "disruption_class": "Peripheral Automation"},
    {"title": "Senior Project Manager", "slug": "senior-project-manager", "automation_index": 45, "disruption_class": "Structural Reclassification"},
    {"title": "Senior UX Designer", "slug": "senior-ux-designer", "automation_index": 35, "disruption_class": "Peripheral Automation"},
    {"title": "Senior Marketing Manager", "slug": "senior-marketing-manager", "automation_index": 38, "disruption_class": "Peripheral Automation"},
    {"title": "Senior Accountant", "slug": "senior-accountant", "automation_index": 52, "disruption_class": "Structural Reclassification"},
    {"title": "Finance Manager", "slug": "finance-manager", "automation_index": 35, "disruption_class": "Peripheral Automation"},
    {"title": "Data Engineering Manager", "slug": "data-engineering-manager", "automation_index": 30, "disruption_class": "Peripheral Automation"},
    {"title": "Senior Data Scientist", "slug": "senior-data-scientist", "automation_index": 42, "disruption_class": "Structural Reclassification"},
    {"title": "Technical Lead", "slug": "technical-lead", "automation_index": 38, "disruption_class": "Peripheral Automation"},
    {"title": "Staff Engineer", "slug": "staff-engineer", "automation_index": 28, "disruption_class": "Peripheral Automation"},
    {"title": "Principal Engineer", "slug": "principal-engineer", "automation_index": 20, "disruption_class": "Peripheral Automation"},
    {"title": "Senior DevOps Engineer", "slug": "senior-devops-engineer", "automation_index": 42, "disruption_class": "Structural Reclassification"},
    {"title": "Platform Engineering Lead", "slug": "platform-engineering-lead", "automation_index": 30, "disruption_class": "Peripheral Automation"},
    {"title": "IT Manager", "slug": "it-manager", "automation_index": 38, "disruption_class": "Peripheral Automation"},
    {"title": "Senior Cybersecurity Analyst", "slug": "senior-cybersecurity-analyst", "automation_index": 38, "disruption_class": "Peripheral Automation"},
    {"title": "Security Architect", "slug": "security-architect", "automation_index": 28, "disruption_class": "Peripheral Automation"},
    {"title": "Senior Recruiter", "slug": "senior-recruiter", "automation_index": 48, "disruption_class": "Structural Reclassification"},
    {"title": "HR Business Partner", "slug": "hr-business-partner", "automation_index": 35, "disruption_class": "Peripheral Automation"},
    {"title": "Talent Acquisition Manager", "slug": "talent-acquisition-manager", "automation_index": 42, "disruption_class": "Structural Reclassification"},
    {"title": "Senior Operations Manager", "slug": "senior-operations-manager", "automation_index": 25, "disruption_class": "Peripheral Automation"},
    {"title": "Director of Operations", "slug": "director-of-operations", "automation_index": 20, "disruption_class": "Peripheral Automation"},
    {"title": "Supply Chain Manager", "slug": "supply-chain-manager", "automation_index": 38, "disruption_class": "Peripheral Automation"},
    {"title": "Senior Compliance Officer", "slug": "senior-compliance-officer", "automation_index": 42, "disruption_class": "Structural Reclassification"},
    {"title": "Risk Manager", "slug": "risk-manager", "automation_index": 35, "disruption_class": "Peripheral Automation"},
    {"title": "Senior Fraud Analyst", "slug": "senior-fraud-analyst", "automation_index": 48, "disruption_class": "Structural Reclassification"},
    {"title": "Clinical Research Manager", "slug": "clinical-research-manager", "automation_index": 35, "disruption_class": "Peripheral Automation"},
    {"title": "Regulatory Affairs Manager", "slug": "regulatory-affairs-manager", "automation_index": 38, "disruption_class": "Peripheral Automation"},
    {"title": "Senior Content Strategist", "slug": "senior-content-strategist", "automation_index": 42, "disruption_class": "Structural Reclassification"},
    {"title": "Creative Director", "slug": "creative-director", "automation_index": 28, "disruption_class": "Peripheral Automation"},
    {"title": "Brand Manager", "slug": "brand-manager", "automation_index": 35, "disruption_class": "Peripheral Automation"},
    {"title": "Senior Sales Manager", "slug": "senior-sales-manager", "automation_index": 30, "disruption_class": "Peripheral Automation"},
    {"title": "Customer Success Manager", "slug": "customer-success-manager", "automation_index": 45, "disruption_class": "Structural Reclassification"},
    {"title": "Solutions Engineer", "slug": "solutions-engineer", "automation_index": 40, "disruption_class": "Structural Reclassification"},
    {"title": "Technical Account Manager", "slug": "technical-account-manager", "automation_index": 38, "disruption_class": "Peripheral Automation"},
    {"title": "Senior QA Lead", "slug": "senior-qa-lead", "automation_index": 55, "disruption_class": "Structural Reclassification"},
    {"title": "Release Manager", "slug": "release-manager", "automation_index": 62, "disruption_class": "Core Task Attrition"},
    {"title": "Scrum Master (Senior)", "slug": "senior-scrum-master", "automation_index": 55, "disruption_class": "Structural Reclassification"},
    {"title": "Delivery Manager", "slug": "delivery-manager", "automation_index": 42, "disruption_class": "Structural Reclassification"},
    {"title": "Senior Investment Analyst", "slug": "senior-investment-analyst", "automation_index": 48, "disruption_class": "Structural Reclassification"},
    {"title": "Portfolio Manager", "slug": "portfolio-manager", "automation_index": 35, "disruption_class": "Peripheral Automation"},
    {"title": "Head of Analytics", "slug": "head-of-analytics", "automation_index": 30, "disruption_class": "Peripheral Automation"},
    {"title": "Director of Engineering", "slug": "director-of-engineering", "automation_index": 22, "disruption_class": "Peripheral Automation"},
    {"title": "VP of Product", "slug": "vp-of-product", "automation_index": 18, "disruption_class": "Peripheral Automation"},
    {"title": "VP of Marketing", "slug": "vp-of-marketing", "automation_index": 20, "disruption_class": "Peripheral Automation"},
    {"title": "VP of Sales", "slug": "vp-of-sales", "automation_index": 15, "disruption_class": "Peripheral Automation"},
]


def get_disruption_explanation(disruption_class):
    if disruption_class == "Full Asset Substitution":
        return "The role does not evolve — it ends. There is no 'augmented' version. The economic incentive to retain the headcount drops to zero."
    elif disruption_class == "Core Task Attrition":
        return "The role survives in reduced form. Core tasks are automated, but the role retains value through judgment, coordination, and human-dependent activities. Headcount shrinks 40-60%."
    elif disruption_class == "Structural Reclassification":
        return "The role transforms into something fundamentally different. The job title may persist, but the daily work, required skills, and value proposition change dramatically."
    else:
        return "The role is minimally affected by direct automation. Some support tasks are automated, but the core value — strategic judgment, leadership, and complex decision-making — remains firmly human."


def get_tasks(title, index, dclass):
    if index >= 55:
        return [
            ("Routine operational execution", 20, min(index + 15, 95), "Already deployed"),
            ("Reporting & status communication", 15, 88, "Already deployed"),
            ("Analysis & pattern identification", 15, 75, "6-12 months"),
            ("Team coordination & delegation", 15, 45, "18 months"),
            ("Decision-making & prioritization", 15, 30, "24+ months"),
            ("Stakeholder management & influence", 12, 20, "24+ months"),
            ("Strategic direction & mentoring", 8, 12, "Not foreseeable"),
        ]
    elif index >= 40:
        return [
            ("Operational oversight & quality control", 18, 55, "12 months"),
            ("Strategy development & planning", 17, 25, "24+ months"),
            ("Cross-functional coordination", 16, 35, "18 months"),
            ("Team leadership & development", 15, 12, "Not foreseeable"),
            ("Stakeholder influence & negotiation", 14, 18, "24+ months"),
            ("Decision-making under uncertainty", 12, 15, "Not foreseeable"),
            ("Process optimization & reporting", 8, 72, "6 months"),
        ]
    elif index >= 30:
        return [
            ("Strategic decision-making", 22, 18, "Not foreseeable"),
            ("Team leadership & talent development", 20, 10, "Not foreseeable"),
            ("Stakeholder management & influence", 18, 15, "Not foreseeable"),
            ("Cross-organizational alignment", 15, 20, "24+ months"),
            ("Complex problem resolution", 12, 30, "24+ months"),
            ("Operational reporting & coordination", 8, 70, "Already deployed"),
            ("Administrative & scheduling tasks", 5, 90, "Already deployed"),
        ]
    else:
        return [
            ("Executive decision-making & strategy", 28, 12, "Not foreseeable"),
            ("Organizational leadership", 22, 8, "Not foreseeable"),
            ("Board & investor communication", 18, 15, "Not foreseeable"),
            ("Talent strategy & culture", 15, 10, "Not foreseeable"),
            ("Complex negotiation & partnerships", 10, 12, "Not foreseeable"),
            ("Operational oversight", 5, 45, "18 months"),
            ("Routine reporting & admin", 2, 85, "Already deployed"),
        ]


def generate_page(role):
    title = role["title"]
    slug = role["slug"]
    index = role["automation_index"]
    dclass = role["disruption_class"]
    
    tasks = get_tasks(title, index, dclass)
    disruption_exp = get_disruption_explanation(dclass)
    
    # Build task table
    task_rows = ""
    for task_name, pct, feasibility, timeline in tasks:
        if feasibility >= 75:
            badge = "risk-critical"
        elif feasibility >= 60:
            badge = "risk-high"
        elif feasibility >= 40:
            badge = "risk-medium"
        else:
            badge = "risk-low"
        task_rows += f'| {task_name} | {pct}% | <span class="{badge}">{feasibility}%</span> | {timeline} |\n'

    # Keywords
    title_lower = title.lower()
    keywords_yaml = f"""  - {title_lower} AI risk
  - will AI replace {title_lower}
  - {title_lower} automation 2028
  - {title_lower} job future
  - AI impact on {title_lower}"""

    # Why not content based on seniority
    if index >= 50:
        why_not = f"""1. **Leadership judgment** — Setting priorities when multiple valid options exist and resources are constrained.
2. **Team development** — Growing people, managing performance, and building culture cannot be automated.
3. **Stakeholder politics** — Navigating organizational dynamics, managing up, and influencing without authority.
4. **Contextual decision-making** — Understanding unwritten rules, historical context, and institutional knowledge that shapes what's possible."""
    elif index >= 35:
        why_not = f"""1. **Strategic ownership** — Defining direction rather than executing against existing plans requires judgment AI cannot replicate.
2. **Organizational influence** — Changing how teams operate through leadership, persuasion, and relationship capital.
3. **Accountability under ambiguity** — Owning outcomes when the right answer isn't clear and multiple stakeholders disagree.
4. **Talent judgment** — Hiring, promoting, and developing people based on potential, not just metrics.
5. **Crisis leadership** — Making high-stakes decisions in real-time with incomplete information."""
    else:
        why_not = f"""1. **Executive judgment** — Strategic decisions that shape organizational trajectory require human wisdom and accountability.
2. **Organizational design** — Structuring teams, incentives, and processes requires deep understanding of human behavior.
3. **Board and investor relationships** — Trust-based relationships that require personal credibility and judgment.
4. **Culture creation** — Building and maintaining organizational culture is fundamentally human.
5. **Complex stakeholder navigation** — Managing competing interests across customers, employees, investors, and regulators simultaneously."""

    # Moats
    if index >= 50:
        moats = """1. **People leadership** — growing, mentoring, and directing teams
2. **Strategic prioritization** — deciding what NOT to do
3. **Cross-functional influence** — aligning teams without direct authority
4. **Institutional knowledge** — understanding context that exists nowhere in documentation
5. **Accountability ownership** — standing behind decisions when outcomes are uncertain"""
    elif index >= 35:
        moats = """1. **Vision setting** — defining where the team/organization should go
2. **Talent judgment** — hiring and developing the right people
3. **Executive communication** — translating complexity into clear strategic narratives
4. **Organizational redesign** — restructuring teams and processes for new realities
5. **Trust capital** — relationships built over years that enable difficult decisions"""
    else:
        moats = """1. **Strategic direction** — setting the course that others execute against
2. **Executive presence** — commanding confidence in boardrooms and investor meetings
3. **Complex negotiation** — high-stakes deals requiring relationship and judgment
4. **Organizational transformation** — leading through fundamental change
5. **Talent magnetism** — attracting and retaining exceptional people through personal leadership"""

    # Actions
    if index >= 50:
        actions_short = "Identify which parts of your current work are 'senior execution' vs. 'leadership judgment.' Automate the execution portions and invest more time in mentoring, strategy, and stakeholder influence."
        actions_mid = "Build your reputation as someone who makes decisions, not someone who does senior-level work. The distinction matters as AI handles more complex execution."
        actions_long = "Position yourself for director-level roles where team building, organizational design, and strategic ownership define your value — not technical execution at a higher level."
    elif index >= 35:
        actions_short = "Leverage AI tools to eliminate the remaining operational tasks in your role. Invest freed-up time in strategic thinking, talent development, and cross-functional alignment."
        actions_mid = "Strengthen your executive communication and strategic planning capabilities. Your role is protected by judgment, but only if you continue operating at the leadership level."
        actions_long = "Expand your scope. The mid-career leaders who thrive in 2028 are those who can lead larger organizations, not just better-executing teams."
    else:
        actions_short = "Stay current on AI capabilities so you can make informed decisions about organizational adoption. Your value is strategic direction, not technical expertise."
        actions_mid = "Build your board-readiness. The executive roles of 2028 require understanding AI's organizational impact at a strategic level."
        actions_long = "Focus on the uniquely human aspects of executive leadership: vision, culture, talent judgment, and stakeholder trust. These are unautomatable."

    # Bottom line
    if index >= 50:
        bottom_line = f"The {title} role is being restructured, not eliminated. The parts that involve 'doing the work at a senior level' are automatable. The parts that involve 'leading people and making strategic calls' are not. Lean into the latter."
    elif index >= 35:
        bottom_line = f"The {title} role is well-positioned against AI disruption, but not immune. The routine and operational portions will be automated, concentrating the role more tightly around leadership, judgment, and human coordination. This is an upgrade if you're ready for it."
    else:
        bottom_line = f"The {title} role is among the most protected from AI disruption. The core value — executive judgment, organizational leadership, and complex human dynamics — is firmly outside AI's capability window. Stay strategic."

    content = f"""---
layout: ai-job-risk-audit
title: "AI Job Risk Audit: {title}"
subtitle: "{index}% of traditional task load faces machine execution within 24 months"
share-title: "{title} — AI Automation Risk Audit ({index}% Exposure)"
share-description: "Full forensic breakdown of AI automation risk for {title}. Task-level analysis, timeline, disruption class, and career defense strategies for 2026-2028."
share-img: /assets/img/hasanjaffal.jpeg
permalink: /ai-job-risk/{slug}/
automation_index: {index}
disruption_class: "{dclass}"
keywords:
{keywords_yaml}
---

## Executive Summary

The {title} role carries a **{index}% automation index**, classified as **{dclass}**. {disruption_exp}

At the mid-career level, the calculus shifts. Unlike junior roles that are defined by execution volume, senior and managerial roles derive value from judgment, leadership, and organizational influence. AI can automate the operational residue that clings to these roles — but not the strategic core.

---

## Task-Level Automation Breakdown

| Task | % of Workday | Automation Feasibility | Timeline |
|:-----|:---:|:---:|:---:|
{task_rows}
---

## Why {index}% and Not Higher

The {100 - index}% that resists automation:

{why_not}

---

## The Mid-Career Advantage

Mid-career professionals in this role have a structural advantage over junior counterparts:

- **Accumulated judgment** — Years of pattern recognition that AI lacks context to replicate
- **Relationship capital** — Trust networks that enable influence without authority
- **Institutional knowledge** — Understanding why things work the way they do, not just what they do
- **Mentorship capacity** — The ability to develop others, which becomes more valuable as AI handles execution

The risk is not elimination. The risk is **role compression** — where the operational layer of the job disappears and only the strategic layer remains. If you've been coasting on senior execution rather than genuine leadership, the compression will expose that.

---

## Human Moats: What Cannot Be Automated

{moats}

---

## If This Is Your Role: Immediate Actions

### Short-term (0-6 months)
{actions_short}

### Medium-term (6-12 months)
{actions_mid}

### Long-term (12-24 months)
{actions_long}

---

## The Bottom Line

{bottom_line}
"""
    return content


# Load existing directory data
with open(DATA_PATH, "r") as f:
    existing_roles = yaml.safe_load(f)

existing_slugs = {r["slug"] for r in existing_roles}

# Add new roles to directory data
added_to_data = 0
for role in NEW_ROLES:
    if role["slug"] not in existing_slugs:
        existing_roles.append({
            "title": role["title"],
            "slug": role["slug"],
            "automation_index": role["automation_index"],
            "disruption_class": role["disruption_class"],
        })
        added_to_data += 1

# Write updated directory data
with open(DATA_PATH, "w") as f:
    f.write("# AI Job Risk Directory — Role data for the master directory page\n")
    f.write("# Each entry: title, slug, automation_index (%), disruption_class\n\n")
    for role in existing_roles:
        f.write(f'- title: "{role["title"]}"\n')
        f.write(f'  slug: "{role["slug"]}"\n')
        f.write(f'  automation_index: {role["automation_index"]}\n')
        f.write(f'  disruption_class: "{role["disruption_class"]}"\n\n')

# Generate audit pages
os.makedirs(OUTPUT_DIR, exist_ok=True)
created = 0
for role in NEW_ROLES:
    output_file = os.path.join(OUTPUT_DIR, f"{role['slug']}.md")
    if os.path.exists(output_file):
        continue
    content = generate_page(role)
    with open(output_file, "w") as f:
        f.write(content)
    created += 1

print(f"Added to directory data: {added_to_data}")
print(f"Audit pages created: {created}")
print(f"Total roles in directory: {len(existing_roles)}")
