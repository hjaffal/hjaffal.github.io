from openai import OpenAI
from slugify import slugify
from datetime import datetime, timezone
import glob
import json
import os
import random
import re
import yaml


ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
POSTS_DIR = os.path.join(ROOT, "_posts")
WRITING_PATH = os.path.join(ROOT, "_data", "writing.yml")
MISSION = (
    "Help business leaders find the opportunities AI makes possible and lead the "
    "transformation it takes to realize them. Work with the people who know the "
    "business best to test the opportunity, build the skills to put it into practice, "
    "agree on the business outcome before investing, and assess how much of the "
    "improvement can be attributed to AI and whether it justified the investment."
)
EDITORIAL_FORMATS = {
    "opportunities": (
        "Explore a customer or business possibility. Start from the work or constraint, "
        "explain what could change, and propose a bounded test that would help establish "
        "whether AI is useful."
    ),
    "investment": (
        "Examine an investment decision. Compare AI with a process change, another tool, "
        "a smaller use case, and doing nothing. Account for full costs, uncertainty, "
        "alternatives, and explicit reasons to continue, change, or stop."
    ),
    "adoption": (
        "Examine how work changes in practice. Include the people doing the work, "
        "responsibilities, skills, workflow, exception handling, and how the team can "
        "question or override AI output."
    ),
    "value": (
        "Examine outcomes and evidence. Define a baseline and business outcome, include "
        "costs and trade-offs, distinguish correlation from AI's contribution, and "
        "explain what evidence would justify continuing, changing, or stopping."
    ),
}


def load_yaml(path):
    with open(path, "r", encoding="utf-8") as handle:
        return yaml.safe_load(handle) or {}


def load_recent_posts(writing, limit=40):
    overrides = writing.get("overrides", {})
    posts = []
    post_paths = sorted(glob.glob(os.path.join(POSTS_DIR, "*.md")), reverse=True)[:limit]
    for file_path in post_paths:
        try:
            with open(file_path, "r", encoding="utf-8") as handle:
                content = handle.read()
            match = re.match(r"\A---\s*\n(.*?)\n---\s*\n", content, re.DOTALL)
            metadata = yaml.safe_load(match.group(1)) if match else {}
            metadata = metadata or {}
            post_id = os.path.basename(file_path).rsplit(".", 1)[0]
            tags = metadata.get("tags", []) or []
            if isinstance(tags, str):
                tags = [tags]
            reading_topics = (
                metadata.get("reading_topics")
                or overrides.get(post_id)
                or (["value"] if "risk-intelligence" in tags else ["adoption"])
            )
            if isinstance(reading_topics, str):
                reading_topics = [reading_topics]
            posts.append({
                "id": post_id,
                "title": metadata.get("title", ""),
                "reading_topics": reading_topics,
                "keywords": metadata.get("keywords", []) or [],
                "url": "/" + post_id + "/",
            })
        except (OSError, yaml.YAMLError):
            continue
    return posts


def choose_topic(topics, recent_posts):
    if not topics:
        raise ValueError("No writing topics configured in _data/writing.yml")

    counts = {topic["id"]: 0 for topic in topics}
    for post in recent_posts:
        for topic_id in post["reading_topics"]:
            if topic_id in counts:
                counts[topic_id] += 1

    least_covered = min(counts.values())
    available = [topic for topic in topics if counts[topic["id"]] == least_covered]
    return random.choice(available)


def choose_archetype(topic):
    options = {
        "opportunities": [
            "Opportunity analysis",
            "A practical, bounded test",
            "An illustrative business scenario",
        ],
        "investment": [
            "Investment comparison",
            "A practical decision framework",
            "An illustrative business scenario",
        ],
        "adoption": [
            "Workflow and role analysis",
            "An adoption playbook",
            "An illustrative team scenario",
        ],
        "value": [
            "Outcome evaluation",
            "A measurement framework",
            "An illustrative business scenario",
        ],
    }
    return random.choice(options[topic["id"]])


def internal_link_targets(topic, topics, recent_posts):
    links = [
        "[{}]({})".format(topic["label"], topic["url"]),
    ]
    other_topics = [item for item in topics if item["id"] != topic["id"]]
    links.extend("[{}]({})".format(item["label"], item["url"]) for item in other_topics)
    links.extend(
        "[{}]({})".format(post["title"], post["url"])
        for post in recent_posts
        if post["title"]
    )
    return links


def build_prompt(topic, archetype, recent_posts, topics):
    recent_titles = "\n".join(
        "- " + post["title"] for post in recent_posts if post["title"]
    ) or "None"
    recent_keywords = ", ".join(sorted({
        keyword
        for post in recent_posts
        for keyword in post["keywords"]
        if isinstance(keyword, str)
    })) or "None"
    links = "\n".join(
        "- " + target for target in internal_link_targets(topic, topics, recent_posts)
    )

    return f"""
Write one original article for Hasan Jaffal's website.

CURRENT WEBSITE MISSION:
{MISSION}

THE ARTICLE'S READER QUESTION:
{topic["question"]}

TOPIC: {topic["label"]}
TOPIC DESCRIPTION: {topic["description"]}
QUESTIONS TO EXPLORE:
{chr(10).join("- " + question for question in topic["questions"])}

ARTICLE APPROACH: {archetype}
{EDITORIAL_FORMATS[topic["id"]]}

WHO THE ARTICLE SERVES:
Business leaders deciding where AI could make a difference, what deserves investment,
how people and work need to change, and whether the business outcome justified the cost.
Write for both informed decision-makers and people doing the work.

EDITORIAL POINT OF VIEW:
- Begin with a real business problem or possibility, not with AI hype.
- Treat AI as one possible means to an outcome, not the outcome itself.
- Consider a simpler process change or doing nothing where relevant.
- Include the people who understand the work and the operational changes adoption requires.
- Make costs, trade-offs, uncertainty, and accountability visible.
- End with a useful question or decision the reader can take back to their business.

EVIDENCE AND EXAMPLES:
- Never invent statistics, studies, sources, customer results, or personal experience.
- Clearly label a made-up scenario as illustrative; do not imply it is a documented case.
- Separate observed results from hypotheses and from AI's contribution.
- If you make a specific factual claim, use a real source you can identify and link to.
- If you cannot verify a claim, qualify it or leave it out.

STYLE:
- Natural, clear, thoughtful, and direct. Use plain English and short paragraphs.
- Explain necessary terms. Avoid jargon, hype, and overconfident claims.
- Use headings where they help readers navigate; do not force a fixed essay template.
- A comparison table is optional, not required. Use one only when it clarifies a real choice.
- Do not force old recurring slogans, military metaphors, artificial confrontation, or listicles.

LENGTH AND SEARCH:
- Aim for 600-900 words.
- Use a specific, accurate title under 150 characters.
- Return 1 primary and 2-3 secondary search keywords, used naturally rather than stuffed.
- Include a concise 40-60 word answer near the beginning, after the opening.
- Put that exact answer in the "answer" JSON field and include it verbatim in the body
  as a blockquote after the opening paragraph.
- Include a concise summary for the article page, up to 100 words.
- Share description must be no more than 160 characters.

INTERNAL LINKS:
Include at least 2 relevant links to the existing pages below. Do not invent URLs or
rewrite their paths. Link naturally in context.
{links}

NEWSLETTER:
End with one simple, relevant invitation to read future articles by email, linked to
[/newsletter/](/newsletter/). Do not claim a subscriber count or publishing frequency.

AVOID REPEATING THESE RECENT TITLES OR THEIR CENTRAL ARGUMENTS:
{recent_titles}
Keywords recently used: {recent_keywords}

Return ONLY valid JSON, with this structure:
{{
  "title": "Article title",
  "subtitle": "One-line subtitle",
  "share_description": "Accurate social description",
  "excerpt": "Short article preview",
  "answer": "40-60 word direct answer",
  "tldr": "Concise summary, up to 100 words",
  "reading_topics": ["{topic["id"]}"],
  "keywords": ["primary keyword", "secondary keyword", "secondary keyword"],
  "body": "Full Markdown article"
}}
"""


def parse_json_response(raw):
    text = raw.strip()
    if text.startswith("```"):
        text = re.sub(r"\A```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```\Z", "", text)
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if not match:
            raise ValueError("Model did not return valid JSON")
        return json.loads(match.group(0))


def count_words(text):
    plain = re.sub(r"<[^>]+>", " ", text)
    plain = re.sub(r"[#*_\[\](){}]", " ", plain)
    return len(re.findall(r"\b[\w'-]+\b", plain))


def markdown_links(body):
    return re.findall(r"\[([^\]]+)\]\(([^)\s]+)\)", body)


def validate_article(data, topic, recent_posts, topics):
    errors = []
    if not isinstance(data, dict):
        return ["Response is not a JSON object"]

    required = ("title", "subtitle", "share_description", "excerpt", "answer", "tldr", "body")
    for field in required:
        if not isinstance(data.get(field), str) or not data[field].strip():
            errors.append("Missing or invalid: " + field)

    title = data.get("title", "").strip()
    if len(title) > 150:
        errors.append("Title exceeds 150 characters")
    if len(data.get("share_description", "").strip()) > 160:
        errors.append("Share description exceeds 160 characters")
    if len(data.get("excerpt", "").strip()) > 300:
        errors.append("Excerpt exceeds 300 characters")

    summary = data.get("tldr")
    if isinstance(summary, str):
        summary_words = count_words(summary)
        if summary_words > 100:
            errors.append("Summary must be no more than 100 words (got {})".format(summary_words))
    answer = data.get("answer", "").strip()
    answer_words = count_words(answer)
    if not 40 <= answer_words <= 60:
        errors.append("Answer must be 40-60 words (got {})".format(answer_words))
    body = data.get("body", "").strip()
    body_words = count_words(body)
    if not 500 <= body_words <= 1000:
        errors.append("Article body must be 500-1000 words (got {})".format(body_words))

    reading_topics = data.get("reading_topics")
    if reading_topics != [topic["id"]]:
        errors.append("reading_topics must contain exactly the selected website topic")

    keywords = data.get("keywords")
    if not isinstance(keywords, list) or len(keywords) != 3:
        errors.append("keywords must contain one primary and two secondary keywords")
    elif not all(isinstance(keyword, str) and keyword.strip() for keyword in keywords):
        errors.append("Every keyword must be a non-empty string")

    title_folded = title.casefold()
    body_folded = body.casefold()
    for recent in recent_posts:
        if recent["title"] and title_folded == recent["title"].casefold():
            errors.append("Title duplicates an existing article")
            break
    if not re.search(r"\billustrative\s+(example|scenario)\b", body_folded) and re.search(
        r"\b(for example|consider a team|imagine a company)\b", body_folded
    ):
        errors.append("Hypothetical examples must be clearly labelled illustrative")
    if answer and answer not in body:
        errors.append("The direct answer must appear verbatim in the article body")
    elif answer and count_words(body[:body.find(answer)]) > 100:
        errors.append("The direct answer must appear near the beginning")

    links = markdown_links(body)
    internal_links = [(label, url) for label, url in links if url.startswith("/")]
    if len({url for _, url in internal_links}) < 2:
        errors.append("Article must contain at least 2 distinct internal Markdown links")
    allowed_urls = {item["url"] for item in topics}
    allowed_urls.update(post["url"] for post in recent_posts)
    allowed_urls.add("/newsletter/")
    invalid_links = sorted({url for _, url in internal_links if url not in allowed_urls})
    if invalid_links:
        errors.append("Internal links must use existing site URLs: " + ", ".join(invalid_links))
    if not any(url == "/newsletter/" for _, url in internal_links):
        errors.append("Article must link to the newsletter page")

    return errors


def yaml_quote(value):
    return json.dumps(str(value), ensure_ascii=False)


def yaml_list(values):
    return "\n".join("  - " + yaml_quote(value) for value in values)


def generate_article(client, prompt, topic, recent_posts, topics, max_attempts=3):
    last_errors = []
    for _ in range(max_attempts):
        attempt_prompt = prompt
        if last_errors:
            attempt_prompt += (
                "\n\nFix these validation failures in the complete JSON response:\n"
                + "\n".join("- " + error for error in last_errors)
            )
        response = client.responses.create(model="gpt-5", input=attempt_prompt)
        data = parse_json_response(response.output_text)
        last_errors = validate_article(data, topic, recent_posts, topics)
        if not last_errors:
            return data

    raise ValueError(
        "Generated article failed validation after {} attempts:\n{}".format(
            max_attempts, "\n".join("- " + error for error in last_errors)
        )
    )


def write_post(data, topic):
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    title = data["title"].strip()
    slug = slugify(title)
    filename = os.path.join(POSTS_DIR, today + "-" + slug + ".md")
    metadata = """---
layout: post
title: {title}
subtitle: {subtitle}
share-title: {title}
share-description: {share_description}
excerpt: {excerpt}
reading_topics:
{reading_topics}
keywords:
{keywords}
author: Hasan Jaffal
tldr: {tldr}
---

{body}
""".format(
        title=yaml_quote(title),
        subtitle=yaml_quote(data["subtitle"]),
        share_description=yaml_quote(data["share_description"]),
        excerpt=yaml_quote(data["excerpt"]),
        reading_topics=yaml_list(data["reading_topics"]),
        keywords=yaml_list(data["keywords"]),
        tldr=yaml_quote(data["tldr"]),
        body=data["body"].strip(),
    )

    os.makedirs(POSTS_DIR, exist_ok=True)
    if os.path.exists(filename):
        raise FileExistsError("Refusing to overwrite existing post: " + filename)
    with open(filename, "w", encoding="utf-8") as handle:
        handle.write(metadata)
    return filename


def main():
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY is not configured")

    writing = load_yaml(WRITING_PATH)
    recent_posts = load_recent_posts(writing)
    topic = choose_topic(writing.get("topics", []), recent_posts)
    archetype = choose_archetype(topic)
    prompt = build_prompt(topic, archetype, recent_posts, writing["topics"])
    data = generate_article(
        OpenAI(api_key=api_key),
        prompt,
        topic,
        recent_posts,
        writing["topics"],
    )
    filename = write_post(data, topic)
    print("Created: " + os.path.relpath(filename, ROOT))
    print("Topic: " + topic["label"])
    print("Approach: " + archetype)


if __name__ == "__main__":
    main()
