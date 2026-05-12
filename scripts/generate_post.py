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

PILLARS = [
    "AI in real operations",
    "data analytics leadership",
    "project management in the age of AI",
    "product management in the age of AI",
    "job safety in the age of AI",
    "security and loss prevention",
    "decision-making under pressure",
    "reporting versus intelligence",
    "data engineering in the age of AI",
    "analytics roles in the age of AI",
    "leadership accountability",
    "field execution gaps",
    "early warning signals",
    "escalation discipline",
    "risk culture",
    "predictive analytics",
    "AI governance",
    "human judgment versus automation"
]

AUDIENCE_LENSES = [
    "senior leaders",
    "analytics managers",
    "operations leaders",
    "risk leaders",
    "product managers",
    "project managers",
    "data analysts",
    "data engineers",
    "security and loss prevention leaders"
]

ARTICLE_TYPES = [
    "challenge a common belief",
    "explain a hidden failure pattern",
    "compare weak teams and strong teams",
    "show why a popular metric is misleading",
    "explain a decision-making trap",
    "describe an operational blind spot",
    "explain what changes when AI enters the workflow",
    "show why execution fails after the data is available"
]

TENSION_ANGLES = [
    "more data does not mean better decisions",
    "automation can increase risk when ownership is unclear",
    "leaders often confuse visibility with control",
    "AI does not remove accountability",
    "dashboards can delay action",
    "poor data quality is usually an ownership problem",
    "risk signals are useless without escalation discipline",
    "models fail when the operating process is weak",
    "teams optimize reporting instead of outcomes",
    "AI changes jobs before it replaces jobs"
]

pillar = random.choice(PILLARS)
audience_lens = random.choice(AUDIENCE_LENSES)
article_type = random.choice(ARTICLE_TYPES)
tension_angle = random.choice(TENSION_ANGLES)

recent_titles = []

post_files = sorted(
    glob.glob("_posts/*.md"),
    reverse=True
)[:12]

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

Pillar: {pillar}
Audience lens: {audience_lens}
Article type: {article_type}
Tension angle: {tension_angle}

Avoid repeating these recent titles:
{recent_titles_text}

Audience:
Leaders and practitioners in AI, data, analytics, operations, and risk.

Rules:
- Simple English.
- Strong point of view.
- Practical operator tone.
- Concrete operational example.
- Write like a human operator with field experience: specific, opinionated, slightly uneven, and grounded in real trade-offs.
- Avoid polished AI patterns, symmetrical sections, generic transitions, and predictable conclusions.
- Include one concrete scene, one uncomfortable trade-off, and one sentence that sounds like personal judgment.
- No hype.
- No corporate buzzwords.
- No invented statistics.
- No labels like Hook, Insight, or Takeaway.
- Do not write another generic dashboard article unless the angle is clearly different.
- Use natural SEO wording where relevant:
AI operations, data analytics, operational risk, predictive analytics, data governance, reporting, intelligence, decision-making.
- 700-1000 words.
- Short paragraphs.
- End with one forced-position question.

Return only valid JSON:

{{
  "title": "",
  "subtitle": "",
  "share_description": "",
  "tags": [],
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
tags = data["tags"]
body = data["body"].strip()

slug = slugify(title)

filename = f"_posts/{TODAY}-{slug}.md"

def yaml_escape(value):
    return str(value).replace('"', '\\"')

tags_yaml = "\n".join(
    [f"  - {yaml_escape(tag)}" for tag in tags]
)

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