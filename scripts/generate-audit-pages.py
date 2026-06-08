#!/usr/bin/env python3
"""Generate AI Job Risk audit pages for all roles in the directory."""

import os
import yaml

# Role-specific content templates
ROLE_DATA = {
    "marketing-coordinator": {
        "tasks": [
            ("Campaign scheduling & coordination", 22, 90, "Already deployed"),
            ("Social media content scheduling", 18, 95, "Already deployed"),
            ("Performance reporting & analytics", 16, 88, "Already deployed"),
            ("Email campaign setup & management", 14, 85, "6 months"),
            ("Vendor & agency coordination", 12, 35, "24+ months"),
            ("Creative brief development", 10, 55, "12 months"),
            ("Strategic planning participation", 8, 30, "24+ months"),
        ],
        "why_not_100": [
            "**Agency relationship management** — Negotiating with external vendors requires human trust and context.",
            "**Brand judgment** — Deciding what feels right for the brand involves intuition that AI cannot replicate reliably.",
            "**Cross-functional alignment** — Coordinating with sales, product, and leadership requires political skill.",
        ],
        "moats": [
            "Brand intuition — understanding what resonates with the audience beyond data",
            "Vendor negotiation — managing external relationships and contracts",
            "Cross-team influence — aligning marketing with broader business goals",
            "Crisis communication — real-time judgment when campaigns go wrong",
        ],
        "actions_short": "Shift from 'executing campaigns' to 'owning channel strategy.' Learn AI marketing tools and become the person who directs them.",
        "actions_mid": "Specialize in brand strategy, partnerships, or demand generation leadership where judgment matters more than execution.",
        "actions_long": "Move into marketing management, brand leadership, or growth strategy roles.",
        "bottom_line": "The coordinator who schedules posts and pulls reports is redundant. The one who shapes strategy and manages relationships is not.",
    },
    "content-writer": {
        "tasks": [
            ("Blog posts & article writing", 30, 88, "Already deployed"),
            ("SEO content optimization", 15, 90, "Already deployed"),
            ("Product descriptions & copy", 15, 92, "Already deployed"),
            ("Email newsletter drafting", 12, 85, "Already deployed"),
            ("Research & fact-checking", 12, 70, "12 months"),
            ("Brand voice development", 8, 40, "24+ months"),
            ("Strategic content planning", 8, 35, "24+ months"),
        ],
        "why_not_100": [
            "**Original expertise** — Writing that draws on lived experience and unique domain knowledge cannot be replicated.",
            "**Brand voice ownership** — Defining and evolving a brand's tone requires cultural awareness.",
            "**Strategic content decisions** — Choosing what to write about requires understanding business goals and audience needs.",
        ],
        "moats": [
            "Original thought leadership — genuine expertise expressed in writing",
            "Brand voice definition — not just following a style guide but creating one",
            "Content strategy — deciding what to create, not just how to create it",
            "Audience relationship — building trust through authenticity",
        ],
        "actions_short": "Stop writing commodity content. AI handles informational blog posts. Focus on opinion, analysis, and original research.",
        "actions_mid": "Build a personal brand or specialization. Writers with recognized expertise are hired for their perspective, not their word count.",
        "actions_long": "Transition to content strategy, editorial leadership, or thought leadership roles where judgment drives value.",
        "bottom_line": "Generic content writers are already being replaced. Writers with genuine expertise, strong opinions, and strategic thinking are more valuable than ever.",
    },
    "copywriter": {
        "tasks": [
            ("Ad copy & headlines", 25, 85, "Already deployed"),
            ("Landing page copy", 20, 82, "Already deployed"),
            ("Email sequences", 15, 88, "Already deployed"),
            ("Social media copy", 12, 90, "Already deployed"),
            ("Brand messaging development", 12, 40, "24+ months"),
            ("Creative concepting", 10, 45, "18 months"),
            ("Client/stakeholder collaboration", 6, 25, "24+ months"),
        ],
        "why_not_100": [
            "**Creative concepting** — Generating breakthrough campaign ideas requires cultural fluency and lateral thinking.",
            "**Brand positioning** — Defining how a brand should sound requires strategic judgment.",
            "**Client navigation** — Understanding what a client actually wants vs. what they say they want.",
        ],
        "moats": [
            "Creative direction — conceiving campaigns, not just writing copy",
            "Brand strategy — positioning and messaging architecture",
            "Cultural fluency — understanding what resonates in specific contexts",
            "Client management — translating vague feedback into action",
        ],
        "actions_short": "Move from 'writing words' to 'creating concepts.' Use AI for first drafts and focus your time on strategy and creative direction.",
        "actions_mid": "Build expertise in brand strategy, creative direction, or conversion optimization.",
        "actions_long": "Transition to creative director, brand strategist, or content strategist roles.",
        "bottom_line": "The copywriter who writes ad variations is automated. The one who invents the campaign concept is not.",
    },
    "business-analyst": {
        "tasks": [
            ("Requirements documentation", 25, 82, "6 months"),
            ("Process mapping & analysis", 20, 78, "6-12 months"),
            ("Data analysis & reporting", 18, 88, "Already deployed"),
            ("Stakeholder interviews", 15, 30, "24+ months"),
            ("Solution evaluation", 12, 55, "12-18 months"),
            ("Change management support", 10, 35, "24+ months"),
        ],
        "why_not_100": [
            "**Stakeholder elicitation** — Getting the real requirements from humans who don't know what they want requires interpersonal skill.",
            "**Organizational politics** — Understanding which solutions are feasible given power dynamics.",
            "**Change facilitation** — Helping people adopt new processes requires empathy and persistence.",
        ],
        "moats": [
            "Elicitation skill — extracting real requirements from ambiguous conversations",
            "Organizational awareness — knowing what will actually get implemented",
            "Translation ability — bridging technical and business language",
            "Change leadership — helping organizations adopt what's been built",
        ],
        "actions_short": "Focus on the facilitation and discovery phases of projects. That's where human skill matters most.",
        "actions_mid": "Move toward product ownership, transformation leadership, or solutions architecture.",
        "actions_long": "Position yourself in strategic advisory, product management, or organizational change roles.",
        "bottom_line": "The BA who documents requirements that could be captured by an AI conversation is redundant. The one who uncovers hidden needs and navigates politics is essential.",
    },
    "accountant": {
        "tasks": [
            ("Transaction processing & journal entries", 25, 95, "Already deployed"),
            ("Account reconciliation", 20, 90, "Already deployed"),
            ("Financial statement preparation", 18, 85, "6 months"),
            ("Tax compliance & filing", 15, 80, "6-12 months"),
            ("Audit preparation & support", 12, 65, "12 months"),
            ("Advisory & judgment calls", 10, 30, "24+ months"),
        ],
        "why_not_100": [
            "**Professional judgment** — Accounting standards require interpretation in ambiguous situations.",
            "**Audit relationships** — Working with external auditors requires trust and negotiation.",
            "**Regulatory navigation** — Tax law interpretation and strategic compliance require expertise.",
        ],
        "moats": [
            "Professional judgment — interpreting standards in ambiguous situations",
            "Regulatory strategy — finding legal advantages within complex tax codes",
            "Audit negotiation — managing auditor relationships and findings",
            "Advisory capacity — counseling leadership on financial implications",
        ],
        "actions_short": "Automate your own routine work. Become the accountant who uses AI tools, not the one replaced by them.",
        "actions_mid": "Specialize in advisory services, complex tax strategy, or forensic accounting.",
        "actions_long": "Move toward controller, CFO advisory, or strategic finance roles.",
        "bottom_line": "Transactional accounting is fully automatable. Advisory accounting — where professional judgment drives value — remains human territory.",
    },
}

# Generic template for roles not in ROLE_DATA
def get_generic_tasks(role_title, automation_index, disruption_class):
    """Generate generic but relevant tasks based on automation index."""
    if automation_index >= 80:
        return [
            ("Core operational execution", 30, min(automation_index + 5, 98), "Already deployed"),
            ("Reporting & documentation", 20, 92, "Already deployed"),
            ("Data processing & analysis", 18, 88, "Already deployed"),
            ("Routine decision-making", 12, 75, "6-12 months"),
            ("Quality verification", 10, 70, "12 months"),
            ("Stakeholder communication", 6, 35, "24+ months"),
            ("Strategic judgment & exceptions", 4, 20, "24+ months"),
        ]
    elif automation_index >= 60:
        return [
            ("Routine operational tasks", 25, min(automation_index + 10, 95), "Already deployed"),
            ("Analysis & reporting", 20, 82, "Already deployed"),
            ("Process coordination", 15, 75, "6 months"),
            ("Decision support & recommendations", 15, 55, "12-18 months"),
            ("Stakeholder management", 13, 30, "24+ months"),
            ("Strategic judgment & escalation", 7, 20, "24+ months"),
            ("Cross-functional leadership", 5, 15, "Not foreseeable"),
        ]
    elif automation_index >= 40:
        return [
            ("Operational execution", 20, 70, "6-12 months"),
            ("Analysis & pattern recognition", 18, 65, "12 months"),
            ("Coordination & communication", 17, 45, "18 months"),
            ("Judgment-based decision-making", 17, 30, "24+ months"),
            ("Stakeholder relationships", 13, 20, "24+ months"),
            ("Strategic planning & oversight", 10, 15, "Not foreseeable"),
            ("Crisis management & escalation", 5, 10, "Not foreseeable"),
        ]
    else:
        return [
            ("Strategic decision-making", 25, 15, "Not foreseeable"),
            ("Stakeholder management & influence", 20, 12, "Not foreseeable"),
            ("Team leadership & development", 18, 10, "Not foreseeable"),
            ("Complex problem resolution", 15, 25, "24+ months"),
            ("Organizational design", 10, 20, "24+ months"),
            ("Operational oversight", 7, 45, "18 months"),
            ("Routine coordination & reporting", 5, 75, "Already deployed"),
        ]


def get_disruption_explanation(disruption_class):
    if disruption_class == "Full Asset Substitution":
        return "The role does not evolve — it ends. There is no 'augmented' version. The economic incentive to retain the headcount drops to zero."
    elif disruption_class == "Core Task Attrition":
        return "The role survives in reduced form. Core tasks are automated, but the role retains value through judgment, coordination, and human-dependent activities. Headcount shrinks 40-60%."
    elif disruption_class == "Structural Reclassification":
        return "The role transforms into something fundamentally different. The job title may persist, but the daily work, required skills, and value proposition change dramatically."
    else:  # Peripheral Automation
        return "The role is minimally affected by direct automation. Some support tasks are automated, but the core value — strategic judgment, leadership, and complex decision-making — remains firmly human."


def generate_page(role):
    title = role["title"]
    slug = role["slug"]
    index = role["automation_index"]
    dclass = role["disruption_class"]
    
    # Skip already created
    if slug in ["data-entry-specialist", "data-analyst", "software-engineer", "financial-analyst", "project-manager", "loss-prevention-specialist"]:
        return None
    
    # Use specific data if available, otherwise generic
    if slug in ROLE_DATA:
        rd = ROLE_DATA[slug]
        tasks = rd["tasks"]
        why_not = rd["why_not_100"]
        moats = rd["moats"]
        actions_short = rd["actions_short"]
        actions_mid = rd["actions_mid"]
        actions_long = rd["actions_long"]
        bottom_line = rd["bottom_line"]
    else:
        tasks = get_generic_tasks(title, index, dclass)
        
        if index >= 75:
            why_not = [
                f"**Contextual judgment** — Edge cases that require understanding organizational context beyond what's in any system.",
                f"**Stakeholder relationships** — Human trust and political navigation that cannot be replicated by machines.",
                f"**Ambiguity resolution** — Situations where the 'correct' action depends on unstated norms and unwritten rules.",
            ]
        elif index >= 50:
            why_not = [
                f"**Complex judgment** — Decisions that require weighing multiple competing priorities with incomplete information.",
                f"**Human coordination** — Activities that depend on trust, persuasion, and relationship capital.",
                f"**Strategic context** — Understanding organizational goals and political dynamics that shape what's possible.",
                f"**Crisis response** — Situations that require real-time adaptation and accountability.",
            ]
        else:
            why_not = [
                f"**Strategic ownership** — Setting direction rather than executing against existing plans.",
                f"**Organizational influence** — Changing how teams operate through leadership and persuasion.",
                f"**Accountability under uncertainty** — Owning outcomes when the right answer isn't clear.",
                f"**Complex stakeholder management** — Navigating competing interests across multiple parties.",
            ]
        
        if index >= 75:
            moats = [
                "Institutional knowledge that exists nowhere in written form",
                "Stakeholder trust built over years of reliable delivery",
                "Exception handling that requires organizational context",
                "Regulatory or compliance judgment in ambiguous situations",
            ]
        elif index >= 50:
            moats = [
                "Cross-functional coordination requiring political skill",
                "Judgment-based decisions where multiple valid approaches exist",
                "Stakeholder management requiring empathy and persuasion",
                "Strategic thinking that connects tactical work to business outcomes",
                "Crisis leadership requiring real-time adaptation",
            ]
        else:
            moats = [
                "Strategic direction-setting that shapes organizational trajectory",
                "Executive influence and board-level communication",
                "Complex decision-making under genuine uncertainty",
                "Team building and talent development",
                "Innovation and creative problem-solving at scale",
            ]
        
        if index >= 75:
            actions_short = f"Acknowledge the timeline. Identify which parts of your work require genuine judgment vs. routine execution. Automate your own routine work before the organization does it for you."
            actions_mid = f"Move toward adjacent roles that emphasize judgment, strategy, or stakeholder management. Build skills that complement AI rather than compete with it."
            actions_long = f"Exit the execution layer entirely. Position yourself in roles where decision ownership, accountability, and human relationships define the value."
        elif index >= 50:
            actions_short = f"Identify your highest-judgment tasks and invest more time there. Automate the routine portions of your role using available AI tools."
            actions_mid = f"Specialize in the human-dependent aspects of your work — stakeholder management, strategic direction, or complex problem-solving."
            actions_long = f"Position yourself as a leader who directs AI systems rather than someone who performs tasks AI can handle."
        else:
            actions_short = f"Stay current on AI capabilities in your domain. Understand what AI can handle so you can delegate effectively and focus on strategic work."
            actions_mid = f"Strengthen your strategic and leadership capabilities. Your role is protected by judgment, but only if you continue operating at that level."
            actions_long = f"Expand your influence. The low-risk roles of 2028 are those that own decisions, shape organizations, and lead through complexity."
        
        if index >= 75:
            bottom_line = f"The {title} role as traditionally defined is facing elimination. The window to pivot toward judgment-based work is 12-18 months."
        elif index >= 50:
            bottom_line = f"The {title} role will survive but transform significantly. Those who embrace the shift toward strategy and judgment will thrive. Those who cling to routine execution will find fewer chairs when the music stops."
        else:
            bottom_line = f"The {title} role is well-positioned against AI disruption. The core value — strategic judgment, leadership, and complex decision-making — remains firmly in human territory. Stay there."

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
    keywords_list = [
        f"{title_lower} AI risk",
        f"will AI replace {title_lower}",
        f"{title_lower} automation",
        f"{title_lower} jobs 2028",
        f"AI replacing {title_lower}",
    ]
    keywords_yaml = "\n".join([f"  - {k}" for k in keywords_list])

    # Why not 100 content
    why_not_content = "\n".join([f"{i+1}. {w}" for i, w in enumerate(why_not)])

    # Moats content
    moats_content = "\n".join([f"{i+1}. **{m.split(' — ')[0] if ' — ' in m else m}**{' — ' + m.split(' — ')[1] if ' — ' in m else ''}" for i, m in enumerate(moats)])

    # Disruption explanation
    disruption_exp = get_disruption_explanation(dclass)

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

---

## Task-Level Automation Breakdown

| Task | % of Workday | Automation Feasibility | Timeline |
|:-----|:---:|:---:|:---:|
{task_rows}
---

## Why {index}% and Not {'100' if index < 90 else 'Higher'}%

The {100 - index}% that resists automation:

{why_not_content}

---

## Human Moats: What Cannot Be Automated

{moats_content}

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


# Load roles from YAML
data_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "_data", "ai_job_risk_directory.yml")
output_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "ai-job-risk")

with open(data_path, "r") as f:
    roles = yaml.safe_load(f)

os.makedirs(output_dir, exist_ok=True)

created = 0
skipped = 0
for role in roles:
    output_file = os.path.join(output_dir, f"{role['slug']}.md")
    if os.path.exists(output_file):
        skipped += 1
        continue
    
    content = generate_page(role)
    if content is None:
        skipped += 1
        continue
    
    with open(output_file, "w") as f:
        f.write(content)
    created += 1

print(f"Created: {created} | Skipped (already exist): {skipped}")
