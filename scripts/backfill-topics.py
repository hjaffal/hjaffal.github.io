#!/usr/bin/env python3
"""
Backfill existing posts with topic, archetype, and keywords fields.
Reads each post's body, matches against Layer 2 topics from _data/topics.yml,
determines archetype from content style, and assigns 2-3 SEO keywords.
"""

import os
import re
import yaml
import glob

# Load topics
with open("_data/topics.yml", "r") as f:
    topics_data = yaml.safe_load(f)

# Flatten topics into a list with position info
ALL_TOPICS = []
for position, topics in topics_data.items():
    for topic in topics:
        ALL_TOPICS.append({
            "slug": topic["slug"],
            "name": topic["name"],
            "keywords": topic["keywords"],
            "position": position,
        })

# Archetype detection patterns
ARCHETYPE_PATTERNS = {
    "contrarian": [
        r"most people (believe|think|assume)",
        r"the (common|popular|conventional) (wisdom|belief|view)",
        r"(wrong|myth|misconception|lie|illusion)",
        r"(actually|reality is|truth is|uncomfortable truth)",
        r"(stop|quit|don't|never) (believing|thinking|assuming)",
    ],
    "framework": [
        r"(how to|step[s]?|checklist|framework|guide|playbook)",
        r"(first|second|third|finally|start by|begin with)",
        r"(rule|principle|model|system|process)",
        r"(here's how|here is how|do this)",
    ],
    "breakdown": [
        r"(what (went|goes) wrong|failure|failed|broke|collapsed)",
        r"(incident|case|example|scenario|story|scene)",
        r"(the (dashboard|system|team|process) (was|had|showed))",
        r"(post-mortem|root cause|what happened)",
    ],
    "prediction": [
        r"(will (be|become|change|disappear|shrink|grow))",
        r"(next (year|12 months|decade|5 years))",
        r"(future|coming|emerging|trend|shift)",
        r"(expect|predict|forecast|inevitable)",
    ],
}


def score_topic(body_lower, topic):
    """Score how well a topic matches the post body."""
    score = 0
    for keyword in topic["keywords"]:
        kw_lower = keyword.lower()
        # Exact phrase match
        if kw_lower in body_lower:
            score += 10
        else:
            # Partial word matching
            words = kw_lower.split()
            matches = sum(1 for w in words if w in body_lower and len(w) > 3)
            score += matches * 2
    return score


def detect_archetype(body_lower):
    """Detect the most likely archetype from body content."""
    scores = {}
    for archetype, patterns in ARCHETYPE_PATTERNS.items():
        score = 0
        for pattern in patterns:
            matches = re.findall(pattern, body_lower)
            score += len(matches)
        scores[archetype] = score

    # Return highest scoring, default to "contrarian"
    best = max(scores, key=scores.get)
    if scores[best] == 0:
        return "contrarian"
    return best


def pick_keywords(body_lower, topic, position):
    """Pick 2-3 relevant keywords from the topic's keyword list that appear in the body."""
    matched = []
    for kw in topic["keywords"]:
        kw_lower = kw.lower()
        if kw_lower in body_lower:
            matched.append(kw)
        else:
            words = kw_lower.split()
            if sum(1 for w in words if w in body_lower and len(w) > 3) >= len(words) // 2:
                matched.append(kw)

    if len(matched) >= 2:
        return matched[:3]

    # Fall back to the topic's first 2-3 keywords
    return topic["keywords"][:3]


def get_position_from_frontmatter(content):
    """Extract the position tag from front matter."""
    # Multi-line format: tags:\n  - tag
    match = re.search(r"tags:\s*\n((?:\s+-\s+.+\n)+)", content)
    if match:
        tags_block = match.group(1)
        tags = re.findall(r"-\s+(.+)", tags_block)
        for tag in tags:
            tag = tag.strip()
            if tag in topics_data:
                return tag
    # Inline format: tags: [tag1, tag2]
    match = re.search(r"tags:\s*\[([^\]]+)\]", content)
    if match:
        tags = [t.strip().strip('"').strip("'") for t in match.group(1).split(",")]
        for tag in tags:
            if tag in topics_data:
                return tag
    return None


def process_post(filepath):
    """Process a single post file and add topic/archetype/keywords."""
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    # Check if already has topic field
    if re.search(r"^topic:", content, re.MULTILINE):
        return False  # Already backfilled

    # Split front matter and body
    parts = content.split("---", 2)
    if len(parts) < 3:
        return False

    front_matter = parts[1]
    body = parts[2]
    body_lower = body.lower()

    # Get position from tags
    position = get_position_from_frontmatter(content)
    if not position:
        return False

    # Filter topics to this position
    position_topics = [t for t in ALL_TOPICS if t["position"] == position]
    if not position_topics:
        return False

    # Score each topic
    scored = [(score_topic(body_lower, t), t) for t in position_topics]
    scored.sort(key=lambda x: x[0], reverse=True)

    best_topic = scored[0][1]

    # Detect archetype
    archetype = detect_archetype(body_lower)

    # Pick keywords
    keywords = pick_keywords(body_lower, best_topic, position)

    # Build new front matter fields
    keywords_yaml = "\n".join([f'  - "{kw}"' for kw in keywords])
    new_fields = f"topic: {best_topic['slug']}\narchetype: {archetype}\nkeywords:\n{keywords_yaml}\n"

    # Insert before the closing ---
    # Find the last line of front matter (before author or the end)
    updated_front_matter = front_matter.rstrip() + "\n" + new_fields

    # Rebuild file
    new_content = "---" + updated_front_matter + "---" + body

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(new_content)

    return True


# Process all posts
post_files = sorted(glob.glob("_posts/*.md"))
updated = 0
skipped = 0

for filepath in post_files:
    filename = os.path.basename(filepath)
    try:
        if process_post(filepath):
            updated += 1
            print(f"  ✓ {filename}")
        else:
            skipped += 1
    except Exception as e:
        print(f"  ✗ {filename}: {e}")
        skipped += 1

print(f"\nDone: {updated} updated, {skipped} skipped")
