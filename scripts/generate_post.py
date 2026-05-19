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

# Fixed topic/tag system — each post must use exactly one of these
TOPICS = [
    {
        "tag": "ai-in-operations",
        "description": "AI in operations — practical guide for teams deploying AI in real workflows",
        "angles": [
            "How to deploy AI in operations without losing control",
            "What operational teams get wrong when adopting AI",
            "The gap between AI demos and AI in production operations",
            "How to measure AI value in operations, not in slides",
        ]
    },
    {
        "tag": "ai-risk-management",
        "description": "How AI creates and reduces risk in business operations",
        "angles": [
            "AI reduces some risks and creates new ones — how to manage both",
            "The new risk surface AI introduces to operations",
            "Why AI risk management is an operations problem, not a compliance checkbox",
            "How to build risk controls around AI-driven decisions",
        ]
    },
    {
        "tag": "ai-in-loss-prevention",
        "description": "AI applied to loss prevention, fraud detection, and shrink reduction",
        "angles": [
            "How AI changes the speed and accuracy of loss prevention",
            "Where AI fails in loss prevention and what to do about it",
            "Building an AI-assisted loss prevention program from scratch",
            "The human-AI handoff in fraud and loss prevention",
        ]
    },
    {
        "tag": "reporting-vs-intelligence",
        "description": "The difference between reporting and actionable intelligence",
        "angles": [
            "Why most reporting is decoration and how to make it intelligence",
            "How to turn dashboards into decision tools",
            "The cost of reporting without action authority",
            "What separates a report from operational intelligence",
        ]
    },
    {
        "tag": "ai-human-judgment",
        "description": "Where humans must stay in the loop when AI is involved",
        "angles": [
            "Decisions AI should never make alone",
            "How to design human-in-the-loop systems that actually work",
            "When to override AI and when to trust it",
            "The judgment layer AI cannot replace",
        ]
    },
    {
        "tag": "predictive-risk-detection",
        "description": "Predictive models for operational risk detection and early warning",
        "angles": [
            "How predictive models detect operational risk before it hits",
            "Building early warning systems for fraud and loss",
            "Why predictive risk detection fails without operational context",
            "From reactive alerts to predictive risk containment",
        ]
    },
    {
        "tag": "ai-governance-for-operations",
        "description": "Simple AI governance operating model for real teams, not policy theory",
        "angles": [
            "AI governance that operators can actually follow",
            "How to govern AI decisions without slowing operations",
            "The minimum viable AI governance for operational teams",
            "Why most AI governance frameworks fail on the floor",
        ]
    },
    {
        "tag": "analytics-operating-model",
        "description": "How analytics teams should work, organize, and deliver value",
        "angles": [
            "How to structure an analytics team for decision impact",
            "Why analytics teams fail when they optimize for output, not outcomes",
            "The operating model that makes analytics teams indispensable",
            "What analytics leaders must change to stay relevant",
        ]
    },
    {
        "tag": "security-data-analytics",
        "description": "Security analytics — using data to protect assets and detect threats",
        "angles": [
            "How security teams should use data analytics to detect threats",
            "Building a security analytics function from scratch",
            "The metrics that matter in security data analytics",
            "Where security analytics fails and how to fix it",
        ]
    },
]

ARTICLE_FORMS = [
    "make a blunt argument with a clear position",
    "explain a real operational failure and what to learn from it",
    "give a practical playbook for operators",
    "challenge a popular belief with evidence",
    "compare what most teams do vs. what strong teams do",
    "explain what leaders must change now",
    "describe a decision framework for the topic",
    "explain the hidden cost of getting this wrong",
]

# Select topic and angle
selected_topic = random.choice(TOPICS)
selected_angle = random.choice(selected_topic["angles"])
article_form = random.choice(ARTICLE_FORMS)

# Get recent titles to avoid repetition
recent_titles = []
post_files = sorted(glob.glob("_posts/*.md"), reverse=True)[:15]

for file_path in post_files:
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            match = re.search(r'title:\s*"(.+?)"', f.read())
            if match:
                recent_titles.append(match.group(1))
    except Exception:
        pass

recent_titles_text = "; ".join(recent_titles) if recent_titles else "None"

PROMPT = f"""
Write one original blog post for Hasan J.

Topic: {selected_topic["description"]}
Angle: {selected_angle}
Article form: {article_form}
Tag to use: {selected_topic["tag"]}

Avoid repeating these recent titles:
{recent_titles_text}

Audience:
Leaders and professionals in AI, data, analytics, operations, risk, security, loss prevention, and decision-making.

Rules:
- Be bold and direct.
- Say the uncomfortable truth clearly.
- Use simple English.
- Use practical operator judgment.
- Include one concrete workplace example.
- Include one uncomfortable trade-off.
- Explain what strong teams do differently.
- Explain what leaders should do now.
- No hype. No corporate buzzwords. No invented statistics.
- No labels like Hook, Insight, or Takeaway.
- The title must clearly state the argument or value. Make it SEO-friendly.
- Bad title: "The Future of Work"
- Good title: "Why Predictive Risk Models Fail Without Operational Context"
- Use natural SEO wording where relevant.
- 500 to 600 words.
- Short paragraphs.
- End with one forced-position question.

IMPORTANT: The "tags" field must contain ONLY this exact tag: "{selected_topic["tag"]}"
Do not add any other tags.

Return only valid JSON:

{{
  "title": "",
  "subtitle": "",
  "share_description": "",
  "tags": ["{selected_topic["tag"]}"],
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
    match = re.search(r"\{{.*\}}", raw, re.DOTALL)
    if not match:
        raise ValueError("Model did not return valid JSON")
    data = json.loads(match.group(0))

title = data["title"].strip()
subtitle = data["subtitle"].strip()
share_description = data["share_description"].strip()
# Force the tag to be only the selected one
tags = [selected_topic["tag"]]
body = data["body"].strip()

slug = slugify(title)
filename = f"_posts/{TODAY}-{slug}.md"

def yaml_escape(value):
    return str(value).replace('"', '\\"')

tags_yaml = "\n".join([f"  - {yaml_escape(tag)}" for tag in tags])

markdown = f"""---
layout: post
title: "{yaml_escape(title)}"
subtitle: "{yaml_escape(subtitle)}"
share-description: "{yaml_escape(share_description)}"
tags:
{tags_yaml}
author: Hasan J.
---

{body}
"""

os.makedirs("_posts", exist_ok=True)

with open(filename, "w", encoding="utf-8") as f:
    f.write(markdown)

print(f"Created {filename}")
print(f"Topic: {selected_topic['tag']}")
print(f"Angle: {selected_angle}")
