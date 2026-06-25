from openai import OpenAI
from slugify import slugify
from datetime import datetime, timezone
import os
import json
import re
import random
import glob

client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])
TODAY = datetime.now(timezone.utc).strftime("%Y-%m-%d")

# The 3 canonical positions — each post must use exactly one
POSITIONS = [
    {
        "tag": "ai-decision-operations",
        "position": "AI exposes weak operations and slow decisions",
        "thesis": "AI does not repair unclear ownership or slow approval chains. It exposes them faster and at scale. Signals need authority — detection without decision power is expensive noise.",
        "angles": [
            "A specific failure where AI amplified a broken process instead of fixing it",
            "How to audit your operating model before deploying AI",
            "The difference between AI-ready and AI-dependent organizations",
            "Why AI projects fail in operations: the process gap nobody talks about",
            "What happens when you deploy a model into a team with no escalation path",
            "The operating model checklist: what must be true before AI adds value",
            "How strong teams use AI as a stress test for their workflows",
            "Why the best AI teams spend 80% of their time on process, not models",
            "The hidden cost of deploying AI into unclear ownership structures",
            "How to design AI-assisted operations that degrade gracefully under pressure",
            "How to pre-commit decision rights before the next crisis",
            "The anatomy of a slow decision: where organizations lose time under risk",
            "Why dashboards create the illusion of control without the reality of action",
            "How to design a decision system that works at 2am with no manager online",
            "The cost of one extra approval step during a live fraud attack",
            "How to measure decision latency and why it matters more than model accuracy",
            "The difference between a status update and a decision meeting",
            "Why the person who sees the signal should be the person who pulls the lever",
        ]
    },
    {
        "tag": "risk-intelligence",
        "position": "Reporting is not intelligence",
        "thesis": "Reporting explains what happened. Intelligence changes what happens next. If metrics do not trigger action, they are decoration.",
        "angles": [
            "How to convert a weekly report into an intelligence product",
            "The 3 questions every metric must answer to qualify as intelligence",
            "Why most dashboards are museums: pretty, historical, and useless under pressure",
            "How to build a risk intelligence function from a reporting team",
            "The difference between a metric that informs and a metric that triggers",
            "How to kill metrics that nobody acts on without losing organizational trust",
            "The intelligence loop: from signal to action to feedback in under 5 minutes",
            "Why your best analysts are wasted on reporting and how to fix it",
            "How to present risk intelligence to leaders who only understand dashboards",
        ]
    },
    {
        "tag": "ai-job-risk",
        "position": "AI is changing the skill floor",
        "thesis": "AI exposes people who only operate tools. The safer skillset is judgment: setting thresholds, owning trade-offs, and knowing when to escalate.",
        "angles": [
            "The specific tasks AI is removing from analyst roles right now",
            "What 'judgment work' actually looks like in practice — concrete examples",
            "How to transition from tool operator to decision shaper in 6 months",
            "Why the middle layer of knowledge work is the most exposed to AI",
            "The new career moat: owning outcomes, not outputs",
            "How AI changes what 'senior' means in analytics and operations",
            "What hiring managers actually look for now that AI handles the basics",
            "The uncomfortable conversation: which roles on your team are exposed",
            "How to build a career around judgment when AI handles execution",
            "Why the best operators will use AI as leverage, not as a replacement for thinking",
        ]
    },
]

ARTICLE_FORMS = [
    "Tell a specific story from the field, then extract the principle",
    "Challenge a popular belief with a concrete counter-example",
    "Compare what average teams do vs what strong teams do — be specific",
    "Describe a decision framework and show how to apply it under pressure",
    "Explain the hidden cost of getting this wrong — use numbers or timelines",
    "Write a practical playbook: 5-7 steps an operator can follow this week",
    "Analyze a common failure pattern and explain the systemic root cause",
    "Make a prediction about what will change in the next 12 months and why",
    "Explain what leaders must stop doing immediately and what to do instead",
    "Describe the minimum viable version of a system that actually works",
    "Structure the article as a numbered listicle (5-8 items). OVERRIDE the standard structure. Title MUST start with a number (e.g., '7 Signs...', '5 Ways...'). Use ## numbered headings for each item. Under each heading: 2-3 sentences + one concrete example. Open with why the list matters. Close with a forced-choice question. Keep items tight and scannable.",
]

TONES = [
    "Direct and blunt. No softening. Say the uncomfortable thing.",
    "Analytical and precise. Use structure. Show the logic.",
    "Narrative-driven. Start with a scene. Make the reader feel the pressure.",
    "Practical and operator-focused. Every paragraph must be actionable.",
    "Contrarian. Take the opposite position from conventional wisdom.",
]

# Select randomly
selected_position = random.choice(POSITIONS)
selected_angle = random.choice(selected_position["angles"])
selected_form = random.choice(ARTICLE_FORMS)
selected_tone = random.choice(TONES)

# Get recent titles to avoid repetition
recent_titles = []
post_files = sorted(glob.glob("_posts/*.md"), reverse=True)[:20]

for file_path in post_files:
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
            match = re.search(r'title:\s*"(.+?)"', content)
            if match:
                recent_titles.append(match.group(1))
    except Exception:
        pass

recent_titles_text = "\n".join([f"- {t}" for t in recent_titles]) if recent_titles else "None"

PROMPT = f"""
Write one original blog post for Hasan Jaffal.

POSITION: {selected_position["position"]}
THESIS: {selected_position["thesis"]}
ANGLE: {selected_angle}
FORM: {selected_form}
TONE: {selected_tone}

TAG (use exactly this): {selected_position["tag"]}

AVOID these recent titles — do NOT repeat similar ideas:
{recent_titles_text}

AUDIENCE:
Leaders and professionals in AI, data, analytics, operations, risk, security, loss prevention, and decision-making.

CONTENT RULES:
- The article must explore the ANGLE specifically. Do not write a generic piece about the position.
- Include one concrete workplace example or scenario (not hypothetical — make it feel real).
- Include one uncomfortable trade-off that the reader must face.
- Explain what strong teams do differently from average teams.
- End with one forced-position question that makes the reader choose a side.
- Do NOT repeat the same structure as previous posts. Vary your opening, your examples, and your conclusions.

WRITING RULES:
- 700 to 1000 words.
- Short paragraphs (2-4 sentences max).
- No hype. No corporate buzzwords. No invented statistics.
- No labels like "Hook," "Insight," "Takeaway," or "Key Point."
- Use simple English. Write like an operator, not a consultant.
- The title must clearly state the argument. Make it SEO-friendly and specific.
- Bad title: "The Future of AI in Operations"
- Good title: "Why AI Projects Fail When Nobody Owns the Escalation Path"

DIVERSITY INSTRUCTIONS:
- If the tone is narrative, start with a scene or moment.
- If the tone is analytical, start with a claim and immediately support it.
- If the tone is contrarian, start by stating what most people believe, then disagree.
- If the tone is practical, start with the action and explain why after.
- Vary sentence length. Mix short punches with longer explanations.
- Do NOT use the same opening pattern as previous posts.

Return ONLY valid JSON:

{{
  "title": "",
  "subtitle": "",
  "share_description": "",
  "tags": ["{selected_position["tag"]}"],
  "tldr": "80-120 word summary. Direct, sharp tone. Captures the main argument and actionable takeaway.",
  "body": ""
}}
"""

response = client.responses.create(
    model="gpt-5",
    input=PROMPT
)

raw = response.output_text.strip()

try:
    data = json.loads(raw)
except json.JSONDecodeError:
    match = re.search(r"\{.*\}", raw, re.DOTALL)
    if not match:
        raise ValueError("Model did not return valid JSON")
    data = json.loads(match.group(0))

title = data["title"].strip()
subtitle = data["subtitle"].strip()
share_description = data["share_description"].strip()
# Force the tag to be only the selected position
tags = [selected_position["tag"]]
body = data["body"].strip()
tldr = data.get("tldr", "").strip()

slug = slugify(title)
filename = f"_posts/{TODAY}-{slug}.md"

def yaml_escape(value):
    return str(value).replace('"', '\\"')

tags_yaml = "\n".join([f"  - {tag}" for tag in tags])

# Derive topic slug from the selected angle (simplified mapping)
topic_slug = selected_angle.lower().replace(" ", "-").replace("'", "")[:30] if selected_angle else ""

# Build tldr line
tldr_line = f'tldr: "{yaml_escape(tldr)}"' if tldr else ""

markdown = f"""---
layout: post
title: "{yaml_escape(title)}"
subtitle: "{yaml_escape(subtitle)}"
share-description: "{yaml_escape(share_description)}"
tags:
{tags_yaml}
topic: {selected_position["tag"].split("-")[0]}-topic
archetype: {selected_form.split(" ")[0].lower() if selected_form else "contrarian"}
author: Hasan J.
{tldr_line}
---

{body}
"""

os.makedirs("_posts", exist_ok=True)

with open(filename, "w", encoding="utf-8") as f:
    f.write(markdown)

print(f"Created: {filename}")
print(f"Position: {selected_position['tag']}")
print(f"Angle: {selected_angle}")
print(f"Form: {selected_form}")
print(f"Tone: {selected_tone}")
