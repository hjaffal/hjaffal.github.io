from openai import OpenAI
from slugify import slugify
from datetime import datetime, timezone
import os
import json
import re

client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])

TODAY = datetime.now(timezone.utc).strftime("%Y-%m-%d")

PROMPT = f"""
You are writing for Hasan J., a senior operator in data analytics, AI, risk, fraud detection, security, and loss prevention.

Write one original blog post for a Jekyll website.

Audience:
Analytics leaders, operations leaders, risk managers, fraud teams, security professionals, and senior decision-makers.

Positioning:
Expose where data, AI, dashboards, and leadership fail in real operations, especially under risk.

Core rules:
- Do not include labels like Title, Hook, Context, Insight, or Takeaway in the article.
- Do not sound generic.
- Do not use corporate buzzwords.
- Do not invent statistics.
- Use concrete operational examples.
- Use simple English.
- Use short paragraphs.
- Use a strong point of view.
- Challenge a common belief.
- Naturally include SEO-relevant topics:
  AI operations,
  data analytics,
  dashboards,
  risk detection,
  fraud signals,
  operational risk,
  decision-making,
  security,
  loss prevention,
  reporting,
  intelligence.
- Write 700 to 1000 words.

Structure requirements:
- Strong headline
- Short subtitle
- Share description under 155 characters
- 5 to 8 tags
- Markdown body
- Strong opening paragraph
- One realistic operational example
- Explain the hidden failure point
- Explain what strong teams do differently
- End with one forced-position question

Return ONLY valid JSON in this exact format:

{{
  "title": "string",
  "subtitle": "string",
  "share_description": "string",
  "tags": ["tag1", "tag2"],
  "body": "markdown content"
}}

Date: {TODAY}
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
