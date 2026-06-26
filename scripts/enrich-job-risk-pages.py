"""
Enrich AI Job Risk audit pages with unique, role-specific content.
Uses Google Gemini API (key from Firebase secrets).

Run: python3 scripts/enrich-job-risk-pages.py
"""

import os
import glob
import re
import time
import json
import subprocess
import urllib.request

# Get Gemini API key from Firebase secrets
def get_gemini_key():
    result = subprocess.run(
        ["firebase", "functions:secrets:access", "GEMINI_API_KEY"],
        capture_output=True, text=True, cwd=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    )
    key = result.stdout.strip()
    if not key or "Error" in key:
        raise RuntimeError("Could not access GEMINI_API_KEY from Firebase secrets")
    return key

GEMINI_KEY = get_gemini_key()
GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_KEY}"

def call_gemini(prompt):
    """Call Gemini API and return text response."""
    payload = json.dumps({
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"responseMimeType": "application/json", "temperature": 0.8, "maxOutputTokens": 2000}
    }).encode("utf-8")

    req = urllib.request.Request(GEMINI_URL, data=payload, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=60) as resp:
        data = json.loads(resp.read().decode("utf-8"))

    text = data["candidates"][0]["content"]["parts"][0]["text"]
    return text.strip()


def extract_front_matter(content):
    match = re.match(r'^---\n(.*?)\n---\n(.*)$', content, re.DOTALL)
    if match:
        return match.group(1), match.group(2)
    return "", content


def get_role_name(front_matter):
    match = re.search(r'title:\s*"AI Job Risk Audit:\s*(.+?)"', front_matter)
    return match.group(1) if match else ""


def get_automation_index(front_matter):
    match = re.search(r'automation_index:\s*(\d+)', front_matter)
    return int(match.group(1)) if match else 50


def generate_unique_content(role_name, automation_index):
    prompt = f"""You are writing unique content for an AI job risk audit page about the "{role_name}" role (automation index: {automation_index}%).

Generate EXACTLY this JSON structure with role-specific content. Every field must be unique to this specific role — no generic advice.

{{
  "specific_tools_threatening": [
    {{"tool": "Name of specific AI tool/platform", "threat": "What it does that replaces part of this role", "timeline": "When (e.g., 'Already live', '6-12 months', '12-24 months')"}},
    {{"tool": "...", "threat": "...", "timeline": "..."}},
    {{"tool": "...", "threat": "...", "timeline": "..."}}
  ],
  "real_scenario": "A 3-4 sentence scenario describing how a specific company or team is already using AI to reduce or transform this role. Make it feel real and concrete. Use a fictional but realistic company name.",
  "career_pivots": [
    {{"direction": "Specific pivot direction", "why": "1 sentence on why this works for someone in this role", "example_title": "A specific job title they could pivot to"}},
    {{"direction": "...", "why": "...", "example_title": "..."}},
    {{"direction": "...", "why": "...", "example_title": "..."}}
  ],
  "unique_insight": "One sharp, specific insight about THIS role's relationship to AI that wouldn't apply to other roles. 2-3 sentences. Be specific and surprising."
}}

Rules:
- Be specific to the {role_name} role. No generic advice.
- Name real AI tools/platforms where possible (ChatGPT, Copilot, specific vertical tools)
- Career pivots must be realistic and leverage existing skills from THIS role
- The scenario must feel like a real situation, not a hypothetical
- Return ONLY valid JSON"""

    raw = call_gemini(prompt)
    # Clean markdown fences if present
    if raw.startswith("```"):
        raw = re.sub(r'^```(?:json)?\n?', '', raw)
        raw = re.sub(r'\n?```$', '', raw)
    return json.loads(raw)


def build_unique_section(data, role_name):
    md = "\n---\n\n## AI Tools Already Threatening This Role\n\n"
    md += "| Tool / Platform | What It Does | Timeline |\n"
    md += "|:---|:---|:---:|\n"
    for tool in data["specific_tools_threatening"]:
        md += f"| **{tool['tool']}** | {tool['threat']} | {tool['timeline']} |\n"

    md += f"\n---\n\n## Real-World Scenario\n\n{data['real_scenario']}\n"

    md += "\n---\n\n## Career Pivot Paths\n\n"
    for pivot in data["career_pivots"]:
        md += f"**→ {pivot['direction']}**\n"
        md += f"{pivot['why']} Target role: *{pivot['example_title']}*.\n\n"

    md += f"---\n\n## The Unique Risk for This Role\n\n{data['unique_insight']}\n"

    return md


def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Skip if already enriched
    if "## AI Tools Already Threatening" in content:
        return "skip"

    front_matter, body = extract_front_matter(content)
    role_name = get_role_name(front_matter)
    automation_index = get_automation_index(front_matter)

    if not role_name:
        print(f"  SKIP (no role name): {filepath}")
        return "skip"

    print(f"  Generating for: {role_name} ({automation_index}%)")

    try:
        data = generate_unique_content(role_name, automation_index)
        unique_section = build_unique_section(data, role_name)

        # Insert before "## The Bottom Line"
        if "## The Bottom Line" in body:
            body = body.replace("## The Bottom Line", unique_section + "\n## The Bottom Line")
        else:
            body += unique_section

        new_content = f"---\n{front_matter}\n---\n{body}"

        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)

        return "success"
    except Exception as e:
        print(f"  ERROR: {e}")
        return "error"


def main():
    import sys
    files = sorted(glob.glob("ai-job-risk/*.md"))
    print(f"Found {len(files)} ai-job-risk pages", flush=True)

    success = 0
    skipped = 0
    errors = 0

    for i, filepath in enumerate(files):
        print(f"[{i+1}/{len(files)}] {os.path.basename(filepath)}", flush=True)
        result = process_file(filepath)
        if result == "success":
            success += 1
            time.sleep(0.4)  # Rate limit
        elif result == "skip":
            skipped += 1
        else:
            errors += 1
            time.sleep(1)

    print(f"\nDone: {success} enriched, {skipped} skipped, {errors} errors", flush=True)


if __name__ == "__main__":
    main()
