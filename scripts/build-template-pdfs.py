#!/usr/bin/env python3
"""Generate 5 standalone PDF templates for the 30-Day Self-Audit Protocol."""

import os
import subprocess

REPORT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "report")
TEMPLATES_DIR = os.path.join(REPORT_DIR, "templates")
os.makedirs(TEMPLATES_DIR, exist_ok=True)

STYLE = """
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
@page { size: A4; margin: 20mm 18mm; }
:root { --dark:#0F172A; --accent:#9333EA; --text:#334155; --muted:#64748B; --border:#E2E8F0; --bg:#FFF; --alt:#F8FAFC; }
* { box-sizing:border-box; margin:0; padding:0; }
body { font-family:'Inter',sans-serif; font-size:10pt; line-height:1.6; color:var(--text); }
.header { background:var(--dark); padding:24px 28px; margin:-20mm -18mm 20px; padding-top:25mm; padding-left:18mm; padding-right:18mm; }
.header-label { font-size:8pt; font-weight:700; letter-spacing:0.2em; color:#9333EA; margin-bottom:6px; }
.header-title { font-size:18pt; font-weight:800; color:#F8FAFC; letter-spacing:-0.02em; margin-bottom:4px; }
.header-sub { font-size:9pt; color:#94A3B8; }
h2 { font-size:12pt; font-weight:800; color:var(--dark); margin:20px 0 10px; padding-top:10px; border-top:1px solid var(--border); }
h2:first-of-type { border-top:none; padding-top:0; }
p { margin:0 0 8px; }
.field-row { display:flex; gap:16px; margin:8px 0; }
.field { flex:1; border-bottom:1px solid var(--border); padding:8px 0 4px; font-size:9pt; color:var(--muted); }
.field-label { font-size:7pt; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:var(--muted); margin-bottom:4px; display:block; }
table { width:100%; border-collapse:collapse; margin:12px 0; font-size:9pt; }
th { background:var(--dark); color:#F8FAFC; padding:8px 10px; font-size:7.5pt; font-weight:700; letter-spacing:0.05em; text-transform:uppercase; text-align:left; }
td { padding:10px; border-bottom:1px solid var(--border); }
.note { background:var(--alt); border-left:3px solid var(--accent); padding:10px 14px; margin:16px 0; font-size:9pt; color:var(--muted); }
.footer { margin-top:30px; padding-top:12px; border-top:1px solid var(--border); font-size:7.5pt; color:var(--muted); display:flex; justify-content:space-between; }
.empty-line { border-bottom:1px solid var(--border); height:28px; margin:6px 0; }
"""

templates = [
    {
        "filename": "week-1-task-decomposition.pdf",
        "title": "Week 1: Task Decomposition",
        "subtitle": "Map exactly where your time goes — not where you think it goes.",
        "body": """
<h2>Instructions</h2>
<p>Track every work activity for 5 consecutive days in 30-minute blocks. Categorize each block into one of five layers.</p>

<h2>Profile</h2>
<div class="field-row">
  <div class="field"><span class="field-label">Full Name</span></div>
  <div class="field"><span class="field-label">Role / Job Title</span></div>
</div>
<div class="field-row">
  <div class="field"><span class="field-label">Week of</span></div>
  <div class="field"><span class="field-label">Department</span></div>
</div>

<h2>Layer Definitions</h2>
<table>
<tr><th>Layer</th><th>Name</th><th>Definition</th></tr>
<tr><td>1</td><td>Execution</td><td>Data entry, formatting, copying, routing</td></tr>
<tr><td>2</td><td>Analysis</td><td>Processing data, building reports, summarizing</td></tr>
<tr><td>3</td><td>Coordination</td><td>Scheduling, status updates, information relay</td></tr>
<tr><td>4</td><td>Judgment</td><td>Decisions with trade-offs, stakeholder negotiation</td></tr>
<tr><td>5</td><td>Strategy</td><td>Direction-setting, resource allocation, vision</td></tr>
</table>

<h2>Time Allocation Results</h2>
<table>
<tr><th>Layer</th><th>% of Time</th><th>Hours/Week</th></tr>
<tr><td>Layer 1 (Execution)</td><td></td><td></td></tr>
<tr><td>Layer 2 (Analysis)</td><td></td><td></td></tr>
<tr><td>Layer 3 (Coordination)</td><td></td><td></td></tr>
<tr><td>Layer 4 (Judgment)</td><td></td><td></td></tr>
<tr><td>Layer 5 (Strategy)</td><td></td><td></td></tr>
<tr><td><strong>Total</strong></td><td><strong>100%</strong></td><td><strong>40 hrs</strong></td></tr>
</table>

<h2>Summary Metrics</h2>
<div class="field-row">
  <div class="field"><span class="field-label">Execution-to-Judgment Ratio (Layers 1-3 / Total)</span></div>
  <div class="field"><span class="field-label">Personal Automation Index (compare to Chapter III)</span></div>
</div>

<div class="note">If your EJR exceeds 60%, urgent repositioning is required. Refer to Chapter IV for your path selection.</div>
"""
    },
    {
        "filename": "week-2-moat-identification.pdf",
        "title": "Week 2: Moat Identification",
        "subtitle": "Identify which of your current activities are structurally un-automatable.",
        "body": """
<h2>Instructions</h2>
<p>Review your Week 1 task log. For each Layer 4-5 activity, determine whether an AI system could do it without a human in the loop. If not — identify WHY not.</p>

<h2>Moat Assessment</h2>
<table>
<tr><th>Rank</th><th>Activity</th><th>Why Un-Automatable</th><th>Time/Week</th><th>Org Visibility</th></tr>
<tr><td>1</td><td></td><td></td><td></td><td>High / Med / Low</td></tr>
<tr><td>2</td><td></td><td></td><td></td><td>High / Med / Low</td></tr>
<tr><td>3</td><td></td><td></td><td></td><td>High / Med / Low</td></tr>
<tr><td>4</td><td></td><td></td><td></td><td>High / Med / Low</td></tr>
<tr><td>5</td><td></td><td></td><td></td><td>High / Med / Low</td></tr>
</table>

<h2>Moat Category Classification</h2>
<p>For each moat above, classify the reason it resists automation:</p>
<table>
<tr><th>Category</th><th>Applies to Moat #</th></tr>
<tr><td>Relationship-dependent (trust, history, personal credibility)</td><td></td></tr>
<tr><td>Accountability-dependent (personal liability, sign-off authority)</td><td></td></tr>
<tr><td>Ambiguity-dependent (no clear "correct" answer exists)</td><td></td></tr>
<tr><td>Context-dependent (requires institutional/unwritten knowledge)</td><td></td></tr>
<tr><td>Ethical-dependent (values-based judgment required)</td><td></td></tr>
</table>

<div class="note">Your strongest moats are those with HIGH organizational visibility AND a clear un-automatable category. These are your career insurance.</div>
"""
    },
    {
        "filename": "week-3-reallocation-planning.pdf",
        "title": "Week 3: Reallocation Planning",
        "subtitle": "Design a concrete plan to shift time from execution to judgment.",
        "body": """
<h2>Instructions</h2>
<p>Identify your top 3 execution-layer time consumers. Determine: automate, delegate, or eliminate. Calculate freed time and allocate to moats.</p>

<h2>Tasks to Eliminate or Automate</h2>
<table>
<tr><th>#</th><th>Task</th><th>Action (Automate / Delegate / Eliminate)</th><th>Time Saved</th></tr>
<tr><td>1</td><td></td><td></td><td>___ hrs/week</td></tr>
<tr><td>2</td><td></td><td></td><td>___ hrs/week</td></tr>
<tr><td>3</td><td></td><td></td><td>___ hrs/week</td></tr>
</table>

<div class="field-row">
  <div class="field"><span class="field-label">Total time freed per week</span></div>
</div>

<h2>Time Reinvestment Plan</h2>
<table>
<tr><th>#</th><th>Judgment Activity to Expand</th><th>Hours to Add</th></tr>
<tr><td>1</td><td></td><td>+___ hrs/week</td></tr>
<tr><td>2</td><td></td><td>+___ hrs/week</td></tr>
<tr><td>3</td><td></td><td>+___ hrs/week</td></tr>
</table>

<h2>New EJR Target</h2>
<div class="field-row">
  <div class="field"><span class="field-label">Current EJR</span></div>
  <div class="field"><span class="field-label">Target EJR (after reallocation)</span></div>
  <div class="field"><span class="field-label">Reduction in execution %</span></div>
</div>

<div class="note">Draft a one-paragraph "role evolution proposal" for your manager using the template in Week 4.</div>
"""
    },
    {
        "filename": "week-4-execution-evidence.pdf",
        "title": "Week 4: Execution & Evidence Building",
        "subtitle": "Implement the reallocation and document results for organizational credibility.",
        "body": """
<h2>Instructions</h2>
<p>Implement the reallocation from Week 3. Track the time shift. Document one judgment-layer decision per day that AI could not have made.</p>

<h2>Daily Decision Log</h2>
<table>
<tr><th>Day</th><th>Judgment Decision Made</th><th>Why AI Could Not</th><th>Outcome</th></tr>
<tr><td>Monday</td><td></td><td></td><td></td></tr>
<tr><td>Tuesday</td><td></td><td></td><td></td></tr>
<tr><td>Wednesday</td><td></td><td></td><td></td></tr>
<tr><td>Thursday</td><td></td><td></td><td></td></tr>
<tr><td>Friday</td><td></td><td></td><td></td></tr>
</table>

<h2>Week 4 Metrics</h2>
<div class="field-row">
  <div class="field"><span class="field-label">Updated EJR (measured this week)</span></div>
  <div class="field"><span class="field-label">Change from Week 1 EJR</span></div>
</div>

<h2>Manager Conversation</h2>
<p>Schedule and complete a conversation with your manager. Frame it as:</p>
<div class="note">"I've been auditing where my time creates the most value, and I've found I can deliver significantly higher strategic output by automating my routine work. Here's my proposal."</div>

<div class="field-row">
  <div class="field"><span class="field-label">Conversation date</span></div>
  <div class="field"><span class="field-label">Outcome / Next steps</span></div>
</div>
"""
    },
    {
        "filename": "role-evolution-proposal.pdf",
        "title": "The One-Page Role Evolution Proposal",
        "subtitle": "Present your repositioning to management in a structured, actionable format.",
        "body": """
<h2>Profile</h2>
<div class="field-row">
  <div class="field"><span class="field-label">Full Name</span></div>
  <div class="field"><span class="field-label">Current Job Title</span></div>
</div>
<div class="field-row">
  <div class="field"><span class="field-label">Date</span></div>
  <div class="field"><span class="field-label">Department</span></div>
</div>

<h2>Current State</h2>
<div class="field-row">
  <div class="field"><span class="field-label">Current EJR: ___% execution / ___% judgment</span></div>
</div>
<p><strong>Top 3 execution activities consuming my time:</strong></p>
<div class="empty-line"></div>
<div class="empty-line"></div>
<div class="empty-line"></div>

<h2>Proposed State</h2>
<div class="field-row">
  <div class="field"><span class="field-label">Target EJR: ___% execution / ___% judgment</span></div>
</div>
<p><strong>Execution tasks to automate or delegate:</strong></p>
<table>
<tr><th>#</th><th>Task</th><th>Action</th></tr>
<tr><td>1</td><td></td><td>→ AI / Tool</td></tr>
<tr><td>2</td><td></td><td>→ Delegate</td></tr>
<tr><td>3</td><td></td><td>→ Eliminate</td></tr>
</table>
<p><strong>Judgment activities to expand:</strong></p>
<div class="empty-line"></div>
<div class="empty-line"></div>
<div class="empty-line"></div>

<h2>Expected Outcomes</h2>
<div class="field-row">
  <div class="field"><span class="field-label">% reduction in routine processing time</span></div>
  <div class="field"><span class="field-label">% increase in strategic contribution</span></div>
</div>
<div class="field-row">
  <div class="field"><span class="field-label">Specific decision/outcome I will own</span></div>
</div>

<div class="field-row">
  <div class="field"><span class="field-label">Implementation timeline: 90 days</span></div>
</div>
"""
    },
]

for t in templates:
    html = f"""<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="robots" content="noindex, nofollow"><title>{t['title']}</title>
<style>{STYLE}</style></head><body>
<div class="header">
  <div class="header-label">30-DAY SELF-AUDIT PROTOCOL</div>
  <div class="header-title">{t['title']}</div>
  <div class="header-sub">{t['subtitle']}</div>
</div>
{t['body']}
<div class="footer">
  <span>2028 Agentic AI Workforce Disruption Report · hasanjaffal.com</span>
  <span>The Second Mind</span>
</div>
</body></html>"""

    html_path = os.path.join(TEMPLATES_DIR, t["filename"].replace(".pdf", ".html"))
    pdf_path = os.path.join(TEMPLATES_DIR, t["filename"])

    with open(html_path, "w") as f:
        f.write(html)

    result = subprocess.run(["weasyprint", html_path, pdf_path], capture_output=True, text=True, timeout=60)
    if result.returncode == 0:
        print(f"  ✓ {t['filename']}")
    else:
        print(f"  ✗ {t['filename']}: {result.stderr[:100]}")

print(f"\nAll templates saved to: {TEMPLATES_DIR}")
