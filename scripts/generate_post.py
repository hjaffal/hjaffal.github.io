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

TOPIC_SYSTEMS = [
    {
        "theme": "AI is removing work, not just improving work",
        "stance": "Many jobs will shrink or disappear because AI removes tasks faster than companies redesign roles.",
        "title_style": "direct warning"
    },
    {
        "theme": "The middle layer of knowledge work is exposed",
        "stance": "Jobs built around summarizing, reporting, coordinating, and basic analysis are under serious pressure.",
        "title_style": "plain and uncomfortable"
    },
    {
        "theme": "Data analysts must move beyond reporting",
        "stance": "Analysts who only build dashboards are at risk. Analysts who define decisions, risks, and actions still matter.",
        "title_style": "career risk"
    },
    {
        "theme": "AI will punish weak ownership",
        "stance": "AI does not fix unclear accountability. It makes unclear accountability more dangerous.",
        "title_style": "leadership truth"
    },
    {
        "theme": "Project managers in the AI age",
        "stance": "Project managers who only track tasks are exposed. The valuable work is judgment, trade-offs, escalation, and alignment.",
        "title_style": "role disruption"
    },
    {
        "theme": "Product managers in the AI age",
        "stance": "Product managers who only write requirements are exposed. The value shifts to problem selection and decision quality.",
        "title_style": "role disruption"
    },
    {
        "theme": "AI and operational risk",
        "stance": "AI can reduce manual work but increase risk when teams stop questioning outputs.",
        "title_style": "risk warning"
    },
    {
        "theme": "Reporting is becoming cheap",
        "stance": "When AI makes reporting easier, the scarce skill becomes deciding what matters and acting on it.",
        "title_style": "market shift"
    },
    {
        "theme": "Leadership accountability in AI transformation",
        "stance": "Leaders cannot hide behind AI tools. They still own the decision, the trade-off, and the failure.",
        "title_style": "executive accountability"
    },
    {
        "theme": "The future of analytics work",
        "stance": "Analytics jobs will split into two groups: people who operate tools and people who shape decisions.",
        "title_style": "clear prediction"
    }
]

ARTICLE_FORMS = [
    "make a blunt argument",
    "explain who is at risk and who is not",
    "challenge a comforting belief",
    "describe a real operational failure",
    "compare old work with future work",
    "give a practical warning to leaders",
    "explain what professionals must stop doing",
    "explain what professionals must learn now"
]

selected = random.choice(TOPIC_SYSTEMS)
article_form = random.choice(ARTICLE_FORMS)

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

Theme: {selected["theme"]}
Stance: {selected["stance"]}
Article form: {article_form}
Title style: {selected["title_style"]}

Avoid repeating these recent titles:
{recent_titles_text}

Audience:
Leaders and professionals in AI, data, analytics, operations, risk, project management, and product management.

Rules:
- Be bold and direct.
- Say the uncomfortable truth clearly.
- Make it clear that many jobs and tasks are going away because of AI.
- Do not soften the message with motivational language.
- Do not claim every job is safe.
- Do not claim AI only helps people work better.
- Do not use vague titles.
- The title must clearly state the argument.
- Bad title: "The Future of Work"
- Good title: "AI Will Remove Many Reporting Jobs. Pretending Otherwise Is Irresponsible."
- Use simple English.
- Use practical operator judgment.
- Include one concrete workplace example.
- Include one uncomfortable trade-off.
- Explain who is most exposed.
- Explain who is more protected.
- Explain what strong leaders should do now.
- No hype.
- No corporate buzzwords.
- No invented statistics.
- No labels like Hook, Insight, or Takeaway.
- Use natural SEO wording where relevant:
AI jobs, AI in operations, data analytics, operational risk, AI governance, reporting, intelligence, decision-making, automation, future of work.
- 700 to 1000 words.
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