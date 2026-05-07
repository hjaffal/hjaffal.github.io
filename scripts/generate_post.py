from openai import OpenAI
from slugify import slugify
from datetime import datetime
import os

client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])

PROMPT = """
Write a short blog post for analytics, AI, security, fraud, and operations leaders.

Positioning:
I expose where data, AI, dashboards, and leadership fail in real operations, especially under risk.

Structure:
Title
Hook
Operational example
Hidden failure point
What strong teams do differently
Practical takeaway
One forced-position question

Style:
Simple English.
No hype.
No consultant language.
400-700 words.
"""

response = client.responses.create(
    model="gpt-5",
    input=PROMPT
)

content = response.output_text.strip()

lines = content.splitlines()
title = lines[0].replace("#", "").strip()

today = datetime.utcnow().strftime("%Y-%m-%d")
slug = slugify(title)

filename = f"_posts/{today}-{slug}.md"

markdown = f"""---
layout: post
title: "{title}"
date: {today}
categories: [ai, analytics, risk]
---

{content}
"""

os.makedirs("_posts", exist_ok=True)

with open(filename, "w", encoding="utf-8") as f:
    f.write(markdown)

print(f"Created {filename}")
