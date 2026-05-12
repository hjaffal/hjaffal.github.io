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
    "analytics leadership",
    "project management in the age of AI",
    "product management role in the age of AI",
    "Job safety in the age of AI",
    "security and loss prevention",
    "operational risk",
    "decision-making under pressure",
    "reporting versus intelligence",
    "data engineers and analyst role in AI",
    "leadership accountability",
    "field execution gaps",
    "early warning signals",
    "escalation discipline",
    "risk culture"
]

pillar = random.choice(PILLARS)

recent_titles = []
post_files = sorted(glob.glob("_posts/*.md"), reverse=True)[:8]

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

Theme: {pillar}

Avoid repeating these recent titles:
{recent_titles_text}

Audience: senior leaders in analytics, operations, AI, fraud, security, and risk.

Rules:
Simple English. Strong point of view. Practical operator tone. Concrete operational example.
No hype. No buzzwords. No invented statistics. No labels like Hook, Insight, or Takeaway.
Use natural SEO terms where relevant: AI operations, data analytics, risk detection, fraud signals, operational risk, security, loss prevention, reporting, intelligence.
700-1000 words. Short paragraphs. End with one forced-position question.

Return only JSON:
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