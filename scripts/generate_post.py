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
- Do not include section labels like Title, Hook, Context, Insight, Takeaway, or Question in the body.
- Do not sound like generic AI content.
- Do not use phrases like "in today's rapidly evolving landscape", "leverage", "unlock", "game changer", "transformative", or "delve".
- Do not make unsupported claims.
- Do not invent statistics.
- Use concrete operational examples.
- Use simple English.
- Use short paragraphs.
- Use a clear point of view.
- Challenge a common belief.
- Include terms naturally for SEO: AI operations, data analytics, dashboards, risk detection, fraud signals, operational risk, decision-making, security, loss prevention, reporting, intelligence.
- Make it useful for both human readers and search/AI crawlers.
- Write 700 to 1,000 words.

Content structure:
1. Strong title.
2. Short subtitle.
3. Share description, maximum 155 characters.
4. 5 to 8 tags.
5. Body in Markdown.
6. Body must start with a strong opening, not a label.
7. Body must include one realistic operational example.
8. Body must explain the hidden failure point.
9. Body must explain what strong teams do differently.
10. Body must end with one forced-position question.

Return only valid JSON with this schema:
{{
  "title": "string",
  "subtitle": "string",
  "share_description": "string",
  "tags": ["string"],
  "body": "markdown string"
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
