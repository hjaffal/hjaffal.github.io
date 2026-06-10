#!/usr/bin/env python3
"""Build the 2028 AI Workforce Disruption Report as a professional PDF.
- Two-column layout for prose chapters (1,2,4,5,6) — NOT using CSS columns (WeasyPrint bug)
  Instead: use grid-based two-column via splitting content into left/right divs
- Chapter 3: single-column, one page per role with SVG charts and expanded data
- SVG charts replace all text-art in chapters 1 & 2
"""

import os
import re
import yaml
import subprocess
import markdown

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REPORT_DIR = os.path.join(BASE_DIR, "report")
AUDIT_DIR = os.path.join(BASE_DIR, "ai-job-risk")
DATA_PATH = os.path.join(BASE_DIR, "_data", "ai_job_risk_directory.yml")
OUTPUT_HTML = os.path.join(REPORT_DIR, "report.html")
OUTPUT_PDF = os.path.join(REPORT_DIR, "2028-AI-Workforce-Disruption-Report.pdf")

with open(DATA_PATH) as f:
    roles = yaml.safe_load(f)
roles.sort(key=lambda r: r["automation_index"], reverse=True)


# ===== HELPERS =====

def get_color(index):
    if index >= 75: return "#DC2626"
    if index >= 60: return "#F59E0B"
    if index >= 40: return "#9333EA"
    return "#10B981"

def get_wave(index):
    if index >= 80: return "Wave 1 (2024–2026)"
    if index >= 60: return "Wave 2 (2026–2027)"
    return "Wave 3 (2027–2028)"

def get_dc_short(dc):
    return {"Full Asset Substitution": "ELIMINATION", "Core Task Attrition": "ATTRITION",
            "Structural Reclassification": "TRANSFORMATION", "Peripheral Automation": "PROTECTED"}.get(dc, dc)


# ===== SVG CHART BUILDERS =====

def svg_distribution_chart():
    """Pie/donut chart for the 4 disruption classes."""
    data = [(47, "#DC2626", "Full Asset Substitution"), (32, "#F59E0B", "Core Task Attrition"),
            (42, "#9333EA", "Structural Reclassification"), (33, "#10B981", "Peripheral Automation")]
    total = sum(d[0] for d in data)
    r, cx, cy = 60, 80, 80
    circumference = 2 * 3.14159 * r
    paths = ""
    offset = 0
    for count, color, label in data:
        pct = count / total
        dash = circumference * pct
        paths += f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="none" stroke="{color}" stroke-width="24" stroke-dasharray="{dash} {circumference - dash}" stroke-dashoffset="-{offset}" opacity="0.9"/>'
        offset += dash
    legend = ""
    for i, (count, color, label) in enumerate(data):
        y = 20 + i * 22
        legend += f'<rect x="180" y="{y}" width="12" height="12" rx="2" fill="{color}"/>'
        legend += f'<text x="198" y="{y+10}" font-size="9" fill="#334155" font-weight="500">{label} ({count})</text>'
    return f'<svg width="360" height="165" viewBox="0 0 360 165" xmlns="http://www.w3.org/2000/svg"><g transform="rotate(-90 {cx} {cy})">{paths}</g><text x="{cx}" y="{cy+4}" text-anchor="middle" font-size="16" font-weight="800" fill="#0F172A">154</text>{legend}</svg>'


def svg_sector_bars():
    """Horizontal bar chart for sector average automation indexes."""
    sectors = [("Admin & Support", 78), ("Finance & Accounting", 67), ("Marketing & Creative", 68),
               ("Legal & Compliance", 65), ("Research & Academic", 62), ("Healthcare", 60),
               ("Operations & Supply Chain", 58), ("Sales & CS", 56), ("Technology & Engineering", 52),
               ("HR & Recruitment", 51), ("Executive & Leadership", 25)]
    sectors.sort(key=lambda s: s[1], reverse=True)
    h = len(sectors) * 24 + 10
    bars = ""
    for i, (name, val) in enumerate(sectors):
        y = i * 24 + 5
        color = get_color(val)
        w = val * 2.2
        bars += f'<text x="0" y="{y+13}" font-size="8" fill="#64748B" font-weight="500">{name}</text>'
        bars += f'<rect x="140" y="{y+3}" width="{w}" height="14" rx="2" fill="{color}" opacity="0.85"/>'
        bars += f'<text x="{142+w+3}" y="{y+13}" font-size="7.5" fill="{color}" font-weight="700">{val}%</text>'
    return f'<svg width="400" height="{h}" viewBox="0 0 400 {h}" xmlns="http://www.w3.org/2000/svg">{bars}</svg>'


def svg_seniority_chart():
    """Bar chart for avg automation by seniority."""
    data = [("Entry/Junior", 81), ("Specialist", 70), ("Manager", 48), ("Sr. Manager/Director", 32), ("VP/Executive", 19)]
    h = len(data) * 30 + 10
    bars = ""
    for i, (label, val) in enumerate(data):
        y = i * 30 + 5
        color = get_color(val)
        w = val * 2.5
        bars += f'<text x="0" y="{y+15}" font-size="9" fill="#334155" font-weight="600">{label}</text>'
        bars += f'<rect x="130" y="{y+4}" width="{w}" height="16" rx="3" fill="{color}" opacity="0.85"/>'
        bars += f'<text x="{132+w+4}" y="{y+15}" font-size="9" fill="{color}" font-weight="800">{val}%</text>'
    return f'<svg width="420" height="{h}" viewBox="0 0 420 {h}" xmlns="http://www.w3.org/2000/svg">{bars}</svg>'


def svg_gauge(index, size=80):
    color = get_color(index)
    r = size // 2 - 6
    cx = cy = size // 2
    circ = 2 * 3.14159 * r
    offset = circ - (circ * index / 100)
    return f'<svg width="{size}" height="{size}" viewBox="0 0 {size} {size}"><circle cx="{cx}" cy="{cy}" r="{r}" fill="none" stroke="#E2E8F0" stroke-width="7"/><circle cx="{cx}" cy="{cy}" r="{r}" fill="none" stroke="{color}" stroke-width="7" stroke-dasharray="{circ}" stroke-dashoffset="{offset}" stroke-linecap="round" transform="rotate(-90 {cx} {cy})"/><text x="{cx}" y="{cy+5}" text-anchor="middle" font-size="18" font-weight="800" fill="{color}">{index}%</text></svg>'


def svg_task_bars(tasks):
    h = len(tasks) * 26 + 5
    bars = ""
    for i, (name, time_pct, feasibility) in enumerate(tasks):
        y = i * 26 + 4
        color = get_color(feasibility)
        w = feasibility * 1.1  # narrower bars to give more label space
        # Truncate label to fit
        label = f"{name} ({time_pct}%)"
        if len(label) > 28:
            label = name[:22] + f".. ({time_pct}%)"
        bars += f'<text x="0" y="{y+11}" font-size="7" fill="#64748B">{label}</text>'
        bars += f'<rect x="160" y="{y+1}" width="{w}" height="13" rx="2" fill="{color}" opacity="0.85"/>'
        bars += f'<text x="{162+w+3}" y="{y+11}" font-size="7" fill="{color}" font-weight="700">{feasibility}%</text>'
    return f'<svg width="300" height="{h}" viewBox="0 0 300 {h}" xmlns="http://www.w3.org/2000/svg">{bars}</svg>'


def svg_ejr(index):
    color = get_color(index)
    total_w = 280
    exec_w = index * total_w / 100
    judg_w = (100 - index) * total_w / 100
    # Place text outside if segment is too narrow
    if exec_w < 50:
        exec_text = f'<text x="{exec_w + 4}" y="20" font-size="7" fill="{color}" font-weight="700">{index}% Exec</text>'
    else:
        exec_text = f'<text x="{exec_w/2}" y="20" text-anchor="middle" font-size="7" fill="white" font-weight="700">{index}% Exec</text>'
    if judg_w < 50:
        judg_text = f'<text x="{exec_w - 4}" y="20" text-anchor="end" font-size="7" fill="#94A3B8">{100-index}% Judgment</text>'
    else:
        judg_text = f'<text x="{exec_w + judg_w/2}" y="20" text-anchor="middle" font-size="7" fill="#94A3B8">{100-index}% Judgment</text>'
    return f'<svg width="300" height="32" viewBox="0 0 300 32" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="6" width="{exec_w}" height="20" rx="3" fill="{color}" opacity="0.8"/><rect x="{exec_w}" y="6" width="{judg_w}" height="20" rx="3" fill="#1E293B"/>{exec_text}{judg_text}</svg>'


# ===== LOAD AUDIT DATA FOR CHAPTER 3 =====

def load_audit_content(slug):
    """Load the markdown audit file and extract key content."""
    path = os.path.join(AUDIT_DIR, f"{slug}.md")
    if not os.path.exists(path):
        return None
    with open(path) as f:
        content = f.read()
    # Remove front matter
    if content.startswith("---"):
        end = content.find("---", 3)
        if end > 0:
            content = content[end+3:].strip()
    return content


def extract_summary(content):
    """Extract Executive Summary paragraph."""
    match = re.search(r"## Executive Summary\s*\n\n(.+?)(?:\n\n---|\n\n##)", content, re.DOTALL)
    if match:
        text = match.group(1).strip()
        text = re.sub(r'\*\*(.+?)\*\*', r'\1', text)
        text = re.sub(r'\*(.+?)\*', r'\1', text)
        text = re.sub(r'> .+?\n', '', text)  # remove blockquotes
        return text[:600]
    return ""


def extract_bottom_line(content):
    """Extract The Bottom Line section."""
    match = re.search(r"## The Bottom Line\s*\n\n(.+?)(?:\n\n---|\n\n##|\Z)", content, re.DOTALL)
    if match:
        text = match.group(1).strip()
        text = re.sub(r'\*\*(.+?)\*\*', r'\1', text)
        text = re.sub(r'\*(.+?)\*', r'\1', text)
        return text[:300]
    return ""


def extract_why_not(content):
    """Extract the 'Why X% and not higher' reasons."""
    match = re.search(r"## Why \d+% and Not.*?\n\n.*?:\n\n(.+?)(?:\n\n---|\n\n##)", content, re.DOTALL)
    if match:
        text = match.group(1).strip()
        text = re.sub(r'\*\*(.+?)\*\*', r'\1', text)
        lines = [l.strip().lstrip('0123456789. ') for l in text.split('\n') if l.strip() and l.strip()[0].isdigit()]
        return lines[:3]
    return []


def extract_tasks_from_audit(content):
    """Try to extract task table from the audit markdown."""
    lines = content.split("\n")
    tasks = []
    in_table = False
    for line in lines:
        if "Task" in line and "Workday" in line and "Feasibility" in line:
            in_table = True
            continue
        if in_table and line.startswith("|:"):
            continue
        if in_table and line.startswith("|"):
            parts = [p.strip() for p in line.split("|")[1:-1]]
            if len(parts) >= 3:
                task_name = parts[0]
                time_match = re.search(r"(\d+)", parts[1])
                feas_match = re.search(r"(\d+)", parts[2])
                if time_match and feas_match:
                    tasks.append((task_name[:30], int(time_match.group(1)), int(feas_match.group(1))))
        elif in_table and not line.startswith("|"):
            break
    return tasks[:7] if tasks else None


def get_generic_tasks(index):
    if index >= 85:
        return [("Core execution", 30, 98), ("Reporting", 22, 92), ("Data processing", 18, 95),
                ("Quality checks", 12, 85), ("Communication", 10, 65), ("Exceptions", 5, 40), ("Escalation", 3, 18)]
    elif index >= 70:
        return [("Primary operations", 28, 90), ("Analysis", 20, 82), ("Coordination", 15, 72),
                ("Documentation", 12, 85), ("Decision support", 12, 48), ("Stakeholder mgmt", 8, 28), ("Strategy", 5, 12)]
    elif index >= 55:
        return [("Operations", 22, 72), ("Analysis", 18, 65), ("Coordination", 16, 48),
                ("Judgment", 15, 30), ("Stakeholders", 14, 20), ("Planning", 10, 14), ("Crisis mgmt", 5, 8)]
    elif index >= 40:
        return [("Strategy", 20, 18), ("Cross-functional", 18, 32), ("Judgment", 17, 14),
                ("Leadership", 15, 8), ("Monitoring", 12, 52), ("Reporting", 10, 68), ("Influence", 8, 10)]
    else:
        return [("Executive decisions", 25, 10), ("Leadership", 22, 6), ("Stakeholders", 18, 8),
                ("Direction", 15, 12), ("Problems", 10, 22), ("Oversight", 7, 42), ("Admin", 3, 72)]


# ===== BUILD ROLE PAGES =====

def build_role_page(role, rank):
    title = role["title"]
    index = role["automation_index"]
    dc = role["disruption_class"]
    slug = role["slug"]
    color = get_color(index)
    wave = get_wave(index)

    # Load audit content
    audit = load_audit_content(slug)
    summary = extract_summary(audit) if audit else f"Automation index: {index}%. Classified as {dc}."
    bottom_line = extract_bottom_line(audit) if audit else ""
    why_not = extract_why_not(audit) if audit else []
    tasks = extract_tasks_from_audit(audit) if audit else None
    if not tasks:
        tasks = get_generic_tasks(index)

    gauge = svg_gauge(index, 80)
    task_chart = svg_task_bars(tasks)
    ejr = svg_ejr(index)

    moat = {"Full Asset Substitution": "Minimal. Insufficient judgment-layer activity to sustain headcount.",
             "Core Task Attrition": "Moderate. Stakeholder judgment and context-dependent decisions protect reduced positions.",
             "Structural Reclassification": "Significant. Leadership, ambiguity resolution, and cross-functional influence create barriers.",
             "Peripheral Automation": "Strong. Strategic ownership and accountability remain outside AI capability."}.get(dc, "")

    timeline_rows = f"""<tr><td>Technical capability</td><td>{"Deployed" if index>=80 else "6-12mo" if index>=60 else "12-18mo" if index>=40 else "18-24mo"}</td></tr>
<tr><td>Enterprise adoption</td><td>{"Active" if index>=80 else "Building" if index>=60 else "Early" if index>=40 else "Nascent"}</td></tr>
<tr><td>Headcount impact</td><td>{"Immediate" if index>=85 else "12 months" if index>=70 else "18 months" if index>=50 else "24+ months"}</td></tr>"""

    # Why not 100% section
    why_html = ""
    if why_not:
        why_html = '<h4>Residual Human Requirements</h4><ul style="font-size:7.5pt;color:#334155;margin:0 0 0 3mm;padding:0;">'
        for reason in why_not:
            why_html += f'<li style="margin-bottom:1mm;">{reason[:120]}</li>'
        why_html += '</ul>'

    # Bottom line
    bottom_html = ""
    if bottom_line:
        bottom_html = f'<div style="margin-top:3mm;padding:2.5mm 3mm;background:#0F172A;border-radius:2mm;"><p style="font-size:7pt;color:#F59E0B;font-weight:700;margin:0 0 1mm;letter-spacing:0.08em;">THE BOTTOM LINE</p><p style="font-size:7.5pt;color:#CBD5E1;margin:0;line-height:1.45;">{bottom_line}</p></div>'

    # Color as rgba for background
    r_val = int(color[1:3], 16)
    g_val = int(color[3:5], 16)
    b_val = int(color[5:7], 16)
    bg_rgba = f"rgba({r_val},{g_val},{b_val},0.1)"

    return f'''<div class="role-page" id="role-{slug}">
  <div class="role-header">
    <div class="role-rank-badge">#{rank}</div>
    <div class="role-title-area">
      <h3 class="role-name">{title}</h3>
      <div class="role-tags">
        <span class="role-dc-tag" style="background:{bg_rgba};color:{color};border:0.5px solid {color};">{get_dc_short(dc)}</span>
        <span class="role-wave-tag">{wave}</span>
      </div>
    </div>
    <div class="role-gauge">{gauge}</div>
  </div>
  <p class="role-summary">{summary[:500]}</p>
  <div class="role-grid">
    <div class="role-left">
      <h4>Task Automation Feasibility</h4>
      {task_chart}
      <h4>Execution-to-Judgment Ratio</h4>
      {ejr}
      {why_html}
    </div>
    <div class="role-right">
      <h4>Classification</h4>
      <table class="role-table"><tr><td>Automation Index</td><td style="color:{color};font-weight:800;">{index}%</td></tr>
      <tr><td>Disruption Class</td><td>{dc}</td></tr>
      <tr><td>Wave</td><td>{wave}</td></tr></table>
      <h4>24-Month Timeline</h4>
      <table class="role-table">{timeline_rows}</table>
      <h4>Human Survival Moat</h4>
      <p class="role-moat-text">{moat}</p>
      {bottom_html}
    </div>
  </div>
</div>'''


# ===== PROCESS PROSE CHAPTERS =====
# Replace code blocks (text charts) with SVG versions

def svg_professional_stack():
    """The New Professional Stack — post-2028 hierarchy."""
    return '''<svg width="520" height="380" viewBox="0 0 520 380" xmlns="http://www.w3.org/2000/svg" font-family="Inter, sans-serif">
  <rect width="520" height="380" rx="8" fill="#0F172A"/>
  <text x="24" y="28" font-size="8" font-weight="700" fill="#9333EA" letter-spacing="2">POST-2028 PROFESSIONAL HIERARCHY</text>
  <!-- Layer 1: Strategic Owners -->
  <rect x="20" y="44" width="480" height="56" rx="4" fill="#1E293B" stroke="#10B981" stroke-width="1.5"/>
  <rect x="20" y="44" width="4" height="56" rx="2" fill="#10B981"/>
  <text x="36" y="62" font-size="8" font-weight="700" fill="#10B981" letter-spacing="1">STRATEGIC OWNERS</text>
  <text x="180" y="62" font-size="7" fill="#64748B">(5–8% of workforce)</text>
  <text x="36" y="77" font-size="7.5" fill="#CBD5E1">Set direction, own capital allocation, bear ultimate accountability.</text>
  <text x="36" y="91" font-size="7" fill="#64748B">C-suite, VPs, founders.</text>
  <!-- Layer 2: Judgment Operators -->
  <rect x="20" y="108" width="480" height="56" rx="4" fill="#1E293B" stroke="#334155" stroke-width="1"/>
  <rect x="20" y="108" width="4" height="56" rx="2" fill="#9333EA"/>
  <text x="36" y="126" font-size="8" font-weight="700" fill="#9333EA" letter-spacing="1">JUDGMENT OPERATORS</text>
  <text x="195" y="126" font-size="7" fill="#64748B">(15–20% of workforce)</text>
  <text x="36" y="141" font-size="7.5" fill="#CBD5E1">Make daily trade-off decisions, manage exceptions,</text>
  <text x="36" y="153" font-size="7.5" fill="#CBD5E1">direct AI systems, own stakeholder relationships.</text>
  <!-- Layer 3: AI System Governors -->
  <rect x="20" y="172" width="480" height="56" rx="4" fill="#1E293B" stroke="#334155" stroke-width="1"/>
  <rect x="20" y="172" width="4" height="56" rx="2" fill="#06B6D4"/>
  <text x="36" y="190" font-size="8" font-weight="700" fill="#06B6D4" letter-spacing="1">AI SYSTEM GOVERNORS</text>
  <text x="200" y="190" font-size="7" fill="#64748B">(10–15% of workforce)</text>
  <text x="36" y="205" font-size="7.5" fill="#CBD5E1">Configure, monitor, and calibrate AI agent networks.</text>
  <text x="36" y="217" font-size="7.5" fill="#CBD5E1">Technical oversight without manual execution.</text>
  <!-- Layer 4: Specialist Practitioners -->
  <rect x="20" y="236" width="480" height="56" rx="4" fill="#1E293B" stroke="#334155" stroke-width="1"/>
  <rect x="20" y="236" width="4" height="56" rx="2" fill="#F59E0B"/>
  <text x="36" y="254" font-size="8" font-weight="700" fill="#F59E0B" letter-spacing="1">SPECIALIST PRACTITIONERS</text>
  <text x="225" y="254" font-size="7" fill="#64748B">(10–15% of workforce)</text>
  <text x="36" y="269" font-size="7.5" fill="#CBD5E1">Roles requiring physical presence, licensed authority,</text>
  <text x="36" y="281" font-size="7.5" fill="#CBD5E1">or irreducible human interaction (medical, legal, trades).</text>
  <!-- Layer 5: Eliminated -->
  <rect x="20" y="300" width="480" height="60" rx="4" fill="#DC262610" stroke="#DC2626" stroke-width="1" stroke-dasharray="4 3"/>
  <rect x="24" y="304" width="472" height="52" rx="3" fill="none" stroke="#DC2626" stroke-width="0.5" stroke-dasharray="2 2" opacity="0.4"/>
  <text x="36" y="320" font-size="8" font-weight="700" fill="#DC2626" letter-spacing="1">ELIMINATED LAYER</text>
  <text x="170" y="320" font-size="7" fill="#DC2626" opacity="0.7">(40–50% of current workforce)</text>
  <text x="36" y="336" font-size="7.5" fill="#FCA5A5">Execution-layer roles absorbed by AI systems.</text>
  <text x="36" y="348" font-size="7.5" fill="#FCA5A5">No replacement hiring. Functions automated.</text>
  <!-- Footer -->
  <text x="24" y="372" font-size="6.5" fill="#475569">hasanjaffal.com · 2028 Agentic AI Workforce Disruption Report</text>
</svg>'''


def svg_role_layer_stack():
    """The 5-layer professional role stack showing where AI automates."""
    return '''<svg width="520" height="320" viewBox="0 0 520 320" xmlns="http://www.w3.org/2000/svg" font-family="Inter, sans-serif">
  <rect width="520" height="320" rx="8" fill="#0F172A"/>
  <text x="24" y="26" font-size="8" font-weight="700" fill="#9333EA" letter-spacing="2">THE PROFESSIONAL ROLE STACK</text>
  <!-- Layer 5 -->
  <rect x="20" y="40" width="380" height="42" rx="3" fill="#1E293B" stroke="#10B981" stroke-width="1"/>
  <text x="32" y="56" font-size="7" font-weight="700" fill="#10B981">LAYER 5: Strategic Direction</text>
  <text x="32" y="70" font-size="7" fill="#94A3B8">Vision, capital allocation, organizational course</text>
  <!-- Layer 4 -->
  <rect x="20" y="88" width="380" height="42" rx="3" fill="#1E293B" stroke="#9333EA" stroke-width="1"/>
  <text x="32" y="104" font-size="7" font-weight="700" fill="#9333EA">LAYER 4: Judgment & Trade-offs</text>
  <text x="32" y="118" font-size="7" fill="#94A3B8">Decisions under ambiguity, stakeholder negotiation</text>
  <!-- Layer 3 -->
  <rect x="20" y="136" width="380" height="42" rx="3" fill="#1E293B" stroke="#F59E0B" stroke-width="1"/>
  <text x="32" y="152" font-size="7" font-weight="700" fill="#F59E0B">LAYER 3: Coordination & Communication</text>
  <text x="32" y="166" font-size="7" fill="#94A3B8">Aligning teams, translating between domains</text>
  <!-- Layer 2 -->
  <rect x="20" y="184" width="380" height="42" rx="3" fill="#1E293B" stroke="#DC2626" stroke-width="1"/>
  <text x="32" y="200" font-size="7" font-weight="700" fill="#DC2626">LAYER 2: Analysis & Synthesis</text>
  <text x="32" y="214" font-size="7" fill="#94A3B8">Processing data, identifying patterns, summarizing</text>
  <!-- Layer 1 -->
  <rect x="20" y="232" width="380" height="42" rx="3" fill="#1E293B" stroke="#DC2626" stroke-width="1.5"/>
  <text x="32" y="248" font-size="7" font-weight="700" fill="#DC2626">LAYER 1: Execution & Processing</text>
  <text x="32" y="262" font-size="7" fill="#94A3B8">Data entry, formatting, routing, standard operations</text>
  <!-- AI Arrow -->
  <line x1="420" y1="260" x2="420" y2="100" stroke="#DC2626" stroke-width="2" opacity="0.7"/>
  <polygon points="416,105 420,92 424,105" fill="#DC2626" opacity="0.7"/>
  <text x="432" y="140" font-size="7" fill="#DC2626" font-weight="600">AI</text>
  <text x="432" y="152" font-size="7" fill="#DC2626" font-weight="600">automates</text>
  <text x="432" y="164" font-size="7" fill="#DC2626" font-weight="600">upward</text>
  <!-- Status labels -->
  <text x="432" y="200" font-size="6.5" fill="#64748B">2026: Layers 1-2 fully</text>
  <text x="432" y="211" font-size="6.5" fill="#64748B">automated. Layer 3 partial.</text>
  <text x="432" y="230" font-size="6.5" fill="#64748B">2028: Layer 3 fully.</text>
  <text x="432" y="241" font-size="6.5" fill="#64748B">Layer 4 partially.</text>
  <!-- Footer -->
  <text x="24" y="310" font-size="6.5" fill="#475569">hasanjaffal.com · 2028 Agentic AI Workforce Disruption Report</text>
</svg>'''


def svg_analyzer_cta():
    """CTA banner for the AI Job Risk Analyzer tool."""
    return '''<svg width="510" height="180" viewBox="0 0 510 180" xmlns="http://www.w3.org/2000/svg" font-family="Inter, sans-serif">
  <rect width="510" height="180" rx="8" fill="#0F172A" stroke="#9333EA" stroke-width="2"/>
  <!-- Decorative accent -->
  <circle cx="470" cy="40" r="60" fill="none" stroke="#9333EA" stroke-width="0.5" opacity="0.3"/>
  <circle cx="480" cy="50" r="35" fill="none" stroke="#9333EA" stroke-width="0.3" opacity="0.2"/>
  <!-- Icon -->
  <rect x="28" y="38" width="48" height="48" rx="12" fill="#9333EA" opacity="0.15"/>
  <text x="52" y="70" text-anchor="middle" font-size="22" fill="#9333EA">⚡</text>
  <!-- Text -->
  <text x="92" y="52" font-size="14" font-weight="800" fill="#F8FAFC">Skip the 30-day wait.</text>
  <text x="92" y="72" font-size="14" font-weight="800" fill="#F8FAFC">Get your score in 3 minutes.</text>
  <text x="92" y="94" font-size="10" fill="#94A3B8">The AI Job Risk Analyzer uses the same framework as this report —</text>
  <text x="92" y="108" font-size="10" fill="#94A3B8">personalized to your exact role, tasks, and industry.</text>
  <!-- CTA -->
  <a href="https://hasanjaffal.com/ai-job-risk-analyzer/">
    <rect x="92" y="122" width="260" height="36" rx="6" fill="#9333EA"/>
    <text x="222" y="145" text-anchor="middle" font-size="12" font-weight="700" fill="#FFFFFF">Launch AI Job Risk Analyzer →</text>
  </a>
  <!-- URL -->
  <text x="92" y="172" font-size="8.5" fill="#64748B">hasanjaffal.com/ai-job-risk-analyzer</text>
</svg>'''


def svg_week1_template():
    """Week 1 output template — task decomposition form."""
    return '''<svg width="480" height="260" viewBox="0 0 480 260" xmlns="http://www.w3.org/2000/svg" font-family="Inter, sans-serif">
  <rect width="480" height="260" rx="6" fill="#0F172A" stroke="#334155" stroke-width="1"/>
  <text x="20" y="24" font-size="8" font-weight="700" fill="#9333EA" letter-spacing="2">WEEK 1 OUTPUT TEMPLATE</text>
  <!-- Fields -->
  <text x="20" y="50" font-size="9" fill="#94A3B8">Name: ________________</text>
  <text x="200" y="50" font-size="9" fill="#94A3B8">Role: ________________</text>
  <text x="20" y="70" font-size="9" fill="#94A3B8">Week of: ______________</text>
  <!-- Layer rows -->
  <rect x="20" y="88" width="440" height="24" rx="3" fill="#1E293B"/>
  <text x="30" y="104" font-size="9" fill="#CBD5E1">Layer 1 (Execution):</text>
  <text x="200" y="104" font-size="9" fill="#64748B">___% of time</text>
  <text x="320" y="104" font-size="9" fill="#64748B">[___] hours/week</text>
  <rect x="20" y="116" width="440" height="24" rx="3" fill="#1E293B"/>
  <text x="30" y="132" font-size="9" fill="#CBD5E1">Layer 2 (Analysis):</text>
  <text x="200" y="132" font-size="9" fill="#64748B">___% of time</text>
  <text x="320" y="132" font-size="9" fill="#64748B">[___] hours/week</text>
  <rect x="20" y="144" width="440" height="24" rx="3" fill="#1E293B"/>
  <text x="30" y="160" font-size="9" fill="#CBD5E1">Layer 3 (Coordination):</text>
  <text x="200" y="160" font-size="9" fill="#64748B">___% of time</text>
  <text x="320" y="160" font-size="9" fill="#64748B">[___] hours/week</text>
  <rect x="20" y="172" width="440" height="24" rx="3" fill="#1E293B"/>
  <text x="30" y="188" font-size="9" fill="#CBD5E1">Layer 4 (Judgment):</text>
  <text x="200" y="188" font-size="9" fill="#64748B">___% of time</text>
  <text x="320" y="188" font-size="9" fill="#64748B">[___] hours/week</text>
  <rect x="20" y="200" width="440" height="24" rx="3" fill="#1E293B"/>
  <text x="30" y="216" font-size="9" fill="#CBD5E1">Layer 5 (Strategy):</text>
  <text x="200" y="216" font-size="9" fill="#64748B">___% of time</text>
  <text x="320" y="216" font-size="9" fill="#64748B">[___] hours/week</text>
  <!-- Summary -->
  <line x1="20" y1="232" x2="460" y2="232" stroke="#334155" stroke-width="0.5"/>
  <text x="20" y="248" font-size="9" font-weight="600" fill="#F59E0B">EJR (Layers 1-3 / Total):  ___%</text>
  <text x="260" y="248" font-size="9" font-weight="600" fill="#DC2626">Personal Automation Index:  ___%</text>
</svg>'''


def svg_week3_reallocation():
    """Week 3 reallocation map template."""
    return '''<svg width="480" height="280" viewBox="0 0 480 280" xmlns="http://www.w3.org/2000/svg" font-family="Inter, sans-serif">
  <rect width="480" height="280" rx="6" fill="#0F172A" stroke="#334155" stroke-width="1"/>
  <text x="20" y="24" font-size="8" font-weight="700" fill="#9333EA" letter-spacing="2">REALLOCATION MAP</text>
  <!-- Eliminate section -->
  <text x="20" y="50" font-size="9" font-weight="700" fill="#DC2626">ELIMINATE / AUTOMATE:</text>
  <rect x="20" y="58" width="440" height="24" rx="3" fill="#1E293B"/>
  <text x="30" y="74" font-size="9" fill="#94A3B8">Task: ___________________________________</text>
  <text x="350" y="74" font-size="9" fill="#64748B">Time saved: ___ hrs</text>
  <rect x="20" y="86" width="440" height="24" rx="3" fill="#1E293B"/>
  <text x="30" y="102" font-size="9" fill="#94A3B8">Task: ___________________________________</text>
  <text x="350" y="102" font-size="9" fill="#64748B">Time saved: ___ hrs</text>
  <rect x="20" y="114" width="440" height="24" rx="3" fill="#1E293B"/>
  <text x="30" y="130" font-size="9" fill="#94A3B8">Task: ___________________________________</text>
  <text x="350" y="130" font-size="9" fill="#64748B">Time saved: ___ hrs</text>
  <!-- Total -->
  <text x="20" y="156" font-size="9" font-weight="600" fill="#F59E0B">Total time freed: ___ hours/week</text>
  <!-- Reinvest section -->
  <line x1="20" y1="168" x2="460" y2="168" stroke="#334155" stroke-width="0.5"/>
  <text x="20" y="186" font-size="9" font-weight="700" fill="#10B981">REINVEST IN:</text>
  <rect x="20" y="194" width="440" height="24" rx="3" fill="#1E293B"/>
  <text x="30" y="210" font-size="9" fill="#94A3B8">Moat activity: _________________________</text>
  <text x="350" y="210" font-size="9" fill="#64748B">+___ hrs/week</text>
  <rect x="20" y="222" width="440" height="24" rx="3" fill="#1E293B"/>
  <text x="30" y="238" font-size="9" fill="#94A3B8">Moat activity: _________________________</text>
  <text x="350" y="238" font-size="9" fill="#64748B">+___ hrs/week</text>
  <rect x="20" y="250" width="440" height="24" rx="3" fill="#1E293B"/>
  <text x="30" y="266" font-size="9" fill="#94A3B8">New judgment activity: __________________</text>
  <text x="350" y="266" font-size="9" fill="#64748B">+___ hrs/week</text>
</svg>'''


def svg_role_evolution_proposal():
    """The one-page role evolution proposal template."""
    return '''<svg width="480" height="380" viewBox="0 0 480 380" xmlns="http://www.w3.org/2000/svg" font-family="Inter, sans-serif">
  <rect width="480" height="380" rx="6" fill="#0F172A" stroke="#9333EA" stroke-width="1.5"/>
  <text x="20" y="24" font-size="8" font-weight="700" fill="#9333EA" letter-spacing="2">ROLE EVOLUTION PROPOSAL</text>
  <!-- Header fields -->
  <text x="20" y="48" font-size="9" fill="#94A3B8">Name: ________________</text>
  <text x="200" y="48" font-size="9" fill="#94A3B8">Current Title: ________________</text>
  <text x="20" y="66" font-size="9" fill="#94A3B8">Date: ________________</text>
  <!-- Current State -->
  <line x1="20" y1="80" x2="460" y2="80" stroke="#334155" stroke-width="0.5"/>
  <text x="20" y="98" font-size="9" font-weight="700" fill="#DC2626">CURRENT STATE:</text>
  <text x="20" y="116" font-size="9" fill="#CBD5E1">• EJR: ___% execution / ___% judgment</text>
  <text x="20" y="134" font-size="9" fill="#94A3B8">• Top 3 execution activities consuming my time:</text>
  <rect x="30" y="142" width="430" height="20" rx="2" fill="#1E293B"/>
  <text x="40" y="156" font-size="8.5" fill="#64748B">1. _______________________________________________</text>
  <rect x="30" y="164" width="430" height="20" rx="2" fill="#1E293B"/>
  <text x="40" y="178" font-size="8.5" fill="#64748B">2. _______________________________________________</text>
  <rect x="30" y="186" width="430" height="20" rx="2" fill="#1E293B"/>
  <text x="40" y="200" font-size="8.5" fill="#64748B">3. _______________________________________________</text>
  <!-- Proposed State -->
  <line x1="20" y1="216" x2="460" y2="216" stroke="#334155" stroke-width="0.5"/>
  <text x="20" y="234" font-size="9" font-weight="700" fill="#10B981">PROPOSED STATE:</text>
  <text x="20" y="252" font-size="9" fill="#CBD5E1">• Target EJR: ___% execution / ___% judgment</text>
  <text x="20" y="270" font-size="9" fill="#94A3B8">• Execution tasks to automate/delegate:</text>
  <text x="30" y="286" font-size="8.5" fill="#64748B">1. ___________________________________ → AI/Tool</text>
  <text x="30" y="300" font-size="8.5" fill="#64748B">2. ___________________________________ → Delegate</text>
  <text x="30" y="314" font-size="8.5" fill="#64748B">3. ___________________________________ → Eliminate</text>
  <!-- Outcomes -->
  <line x1="20" y1="328" x2="460" y2="328" stroke="#334155" stroke-width="0.5"/>
  <text x="20" y="346" font-size="9" font-weight="700" fill="#F59E0B">EXPECTED OUTCOMES:</text>
  <text x="20" y="364" font-size="9" fill="#CBD5E1">• ___% reduction in routine processing time</text>
  <text x="20" y="378" font-size="9" fill="#CBD5E1">• Specific decision I will own: ______________</text>
</svg>'''


def svg_eight_capabilities():
    """The 8 un-automatable capabilities — vertical list of cards (one per row for readability)."""
    capabilities = [
        ("1", "AMBIGUITY RESOLUTION", "Operating where the problem isn't defined, the data is incomplete, and multiple valid interpretations exist.", "No training signal for 'undefined'", "#DC2626"),
        ("2", "ACCOUNTABILITY OWNERSHIP", "Bearing personal consequences for decisions. Signing off. Saying 'this is my call and I own the outcome.'", "No mechanism for personal liability", "#F59E0B"),
        ("3", "STAKEHOLDER NAVIGATION", "Managing relationships where trust, history, and political dynamics determine what is possible.", "No access to social capital", "#9333EA"),
        ("4", "ETHICAL JUDGMENT", "Making decisions where 'correct' depends on values, culture, context, and unstated norms.", "No values, only objectives", "#06B6D4"),
        ("5", "CREATIVE ORIGINATION", "Generating novel directions that don't exist in training data. True invention, not recombination.", "Constrained to pattern interpolation", "#10B981"),
        ("6", "CRISIS LEADERSHIP", "Real-time decisions under extreme pressure where the cost of delay exceeds the cost of imperfection.", "No contextual urgency calibration", "#DC2626"),
        ("7", "TALENT JUDGMENT", "Evaluating human potential, not just metrics. Hiring and developing people based on instinct.", "No access to tacit human assessment", "#F59E0B"),
        ("8", "ORGANIZATIONAL REDESIGN", "Restructuring teams, incentives, and processes. Understanding human behavior and resistance.", "No model for organizational politics", "#9333EA"),
    ]
    cards = ""
    card_h = 95
    for i, (num, title, desc, fail, color) in enumerate(capabilities):
        y = 36 + i * (card_h + 8)
        cards += f'<rect x="10" y="{y}" width="490" height="{card_h}" rx="4" fill="#1E293B" stroke="{color}" stroke-width="1"/>'
        cards += f'<rect x="10" y="{y}" width="5" height="{card_h}" rx="2" fill="{color}"/>'
        cards += f'<text x="26" y="{y+20}" font-size="11" font-weight="800" fill="{color}">{num}. {title}</text>'
        cards += f'<text x="26" y="{y+40}" font-size="9.5" fill="#CBD5E1">{desc[:80]}</text>'
        if len(desc) > 80:
            cards += f'<text x="26" y="{y+54}" font-size="9.5" fill="#CBD5E1">{desc[80:]}</text>'
        cards += f'<text x="26" y="{y+66}" font-size="8.5" fill="#64748B" font-style="italic">AI fails: {fail}</text>'

    total_h = 36 + 8 * (card_h + 8) + 10
    return f'''<svg width="510" height="{total_h}" viewBox="0 0 510 {total_h}" xmlns="http://www.w3.org/2000/svg" font-family="Inter, sans-serif">
  <rect width="510" height="{total_h}" rx="8" fill="#0F172A"/>
  <text x="14" y="24" font-size="9" font-weight="700" fill="#9333EA" letter-spacing="2">THE EIGHT UN-AUTOMATABLE CAPABILITIES</text>
  {cards}
</svg>'''


def svg_three_paths():
    """Three separate SVG cards for the repositioning paths."""
    path_a = '''<svg width="480" height="180" viewBox="0 0 480 180" xmlns="http://www.w3.org/2000/svg" font-family="Inter, sans-serif">
  <rect width="480" height="180" rx="6" fill="#0F172A" stroke="#10B981" stroke-width="1.5"/>
  <rect x="0" y="0" width="6" height="180" rx="3" fill="#10B981"/>
  <text x="24" y="32" font-size="14" font-weight="800" fill="#10B981">PATH A: VERTICAL ASCENT</text>
  <text x="24" y="58" font-size="11" fill="#CBD5E1">Move upward within your current function.</text>
  <text x="24" y="82" font-size="10" fill="#94A3B8">From: executing tasks  →  To: owning decisions about those tasks</text>
  <text x="24" y="106" font-size="10" fill="#94A3B8">Example: Data Analyst → Analytics Strategy Lead</text>
  <text x="24" y="134" font-size="9.5" fill="#64748B">Requirement: Demonstrated judgment, stakeholder trust</text>
  <text x="24" y="158" font-size="9.5" fill="#64748B">Timeline: 6–12 months</text>
</svg>'''

    path_b = '''<svg width="480" height="180" viewBox="0 0 480 180" xmlns="http://www.w3.org/2000/svg" font-family="Inter, sans-serif">
  <rect width="480" height="180" rx="6" fill="#0F172A" stroke="#06B6D4" stroke-width="1.5"/>
  <rect x="0" y="0" width="6" height="180" rx="3" fill="#06B6D4"/>
  <text x="24" y="32" font-size="14" font-weight="800" fill="#06B6D4">PATH B: LATERAL MIGRATION</text>
  <text x="24" y="58" font-size="11" fill="#CBD5E1">Move sideways into a structurally protected function.</text>
  <text x="24" y="82" font-size="10" fill="#94A3B8">From: exposed role  →  To: adjacent role with higher judgment %</text>
  <text x="24" y="106" font-size="10" fill="#94A3B8">Example: Content Writer → Content Strategy / Brand Positioning</text>
  <text x="24" y="134" font-size="9.5" fill="#64748B">Requirement: Transferable domain knowledge, rapid upskilling</text>
  <text x="24" y="158" font-size="9.5" fill="#64748B">Timeline: 3–9 months</text>
</svg>'''

    path_c = '''<svg width="480" height="180" viewBox="0 0 480 180" xmlns="http://www.w3.org/2000/svg" font-family="Inter, sans-serif">
  <rect width="480" height="180" rx="6" fill="#0F172A" stroke="#F59E0B" stroke-width="1.5"/>
  <rect x="0" y="0" width="6" height="180" rx="3" fill="#F59E0B"/>
  <text x="24" y="32" font-size="14" font-weight="800" fill="#F59E0B">PATH C: AI SYSTEM GOVERNANCE</text>
  <text x="24" y="58" font-size="11" fill="#CBD5E1">Become the human who directs the AI that replaced your old role.</text>
  <text x="24" y="82" font-size="10" fill="#94A3B8">From: doing the work  →  To: configuring, monitoring, validating AI</text>
  <text x="24" y="106" font-size="10" fill="#94A3B8">Example: QA Engineer → AI Quality Systems Governor</text>
  <text x="24" y="134" font-size="9.5" fill="#64748B">Requirement: Technical fluency + domain knowledge</text>
  <text x="24" y="158" font-size="9.5" fill="#64748B">Timeline: 3–6 months</text>
</svg>'''

    return path_a + '\n' + path_b + '\n' + path_c


def replace_charts_in_html(html):
    """Replace <pre> blocks with SVG charts where applicable."""
    # Distribution chart
    html = re.sub(r'<pre><code>.*?AUTOMATION INDEX DISTRIBUTION.*?</code></pre>', svg_distribution_chart(), html, flags=re.DOTALL)
    # Sector/deployment bars
    html = re.sub(r'<pre><code>.*?DEPLOYMENT VELOCITY.*?</code></pre>', svg_sector_bars(), html, flags=re.DOTALL)
    html = re.sub(r'<pre><code>.*?SECTOR VULNERABILITY.*?</code></pre>', svg_sector_bars(), html, flags=re.DOTALL)
    # Seniority
    html = re.sub(r'<pre><code>.*?EXECUTION-TO-JUDGMENT RATIO BY ROLE.*?</code></pre>', svg_seniority_chart(), html, flags=re.DOTALL)
    # Professional stack
    html = re.sub(r'<pre><code>.*?POST-2028 PROFESSIONAL HIERARCHY.*?</code></pre>', svg_professional_stack(), html, flags=re.DOTALL)
    # Role stack (5 layers)
    html = re.sub(r'<pre><code>.*?THE PROFESSIONAL ROLE STACK.*?</code></pre>', svg_role_layer_stack(), html, flags=re.DOTALL)
    # Three repositioning paths
    html = re.sub(r'<pre><code>.*?PATH A: VERTICAL ASCENT.*?PATH C:.*?months.*?</code></pre>', svg_three_paths(), html, flags=re.DOTALL)
    # Eight capabilities
    html = re.sub(r'<pre><code>.*?1\. AMBIGUITY RESOLUTION.*?8\. ORGANIZATIONAL REDESIGN.*?</code></pre>', svg_eight_capabilities(), html, flags=re.DOTALL)
    # Week 1 output template
    html = re.sub(r'<pre><code>.*?WEEK 1 OUTPUT TEMPLATE.*?Personal Automation Index.*?</code></pre>', svg_week1_template(), html, flags=re.DOTALL)
    # Week 3 reallocation map
    html = re.sub(r'<pre><code>.*?REALLOCATION MAP.*?New EJR target.*?</code></pre>', svg_week3_reallocation(), html, flags=re.DOTALL)
    # Role evolution proposal
    html = re.sub(r'<pre><code>.*?ROLE EVOLUTION PROPOSAL.*?TIMELINE.*?</code></pre>', svg_role_evolution_proposal(), html, flags=re.DOTALL)
    # Ch6 distribution chart
    html = re.sub(r'<pre><code>.*?DISTRIBUTION OF 154 ROLES BY AUTOMATION INDEX.*?</code></pre>', svg_distribution_chart(), html, flags=re.DOTALL)
    # Analyzer CTA at end of chapter 4 (after "Act accordingly.")
    html = html.replace('Act accordingly.</p>', 'Act accordingly.</p>\n' + svg_analyzer_cta())
    return html


md_conv = markdown.Markdown(extensions=["tables", "fenced_code"])

prose_before = ""
for ch in ["chapter-01-executive-directive.md", "chapter-02-state-of-workforce.md"]:
    with open(os.path.join(REPORT_DIR, ch)) as f:
        html = md_conv.convert(f.read())
    md_conv.reset()
    html = replace_charts_in_html(html)
    # Remove ALL hr tags — the purple border-bottom on h1 is sufficient
    html = re.sub(r'<hr\s*/?>', '', html)
    prose_before += f'<section class="prose-chapter">{html}</section>\n'

prose_after = ""
for ch in ["chapter-04-strategic-adaptation.md", "chapter-05-methodology.md", "chapter-06-key-findings.md", "chapter-07-downloads.md"]:
    with open(os.path.join(REPORT_DIR, ch)) as f:
        html = md_conv.convert(f.read())
    md_conv.reset()
    html = replace_charts_in_html(html)
    html = re.sub(r'<hr\s*/?>', '', html)
    prose_after += f'<section class="prose-chapter">{html}</section>\n'

# Build Chapter 3
ch3_intro = '''<section class="ch3-intro">
<h1>Chapter III: The Threat Matrix</h1>
<h2>The 154-Role Forensic Audit Repository</h2>
<p>This chapter contains a standardized forensic audit for each of the 154 professional roles evaluated in this report. Each role is assessed against identical criteria, enabling direct comparison across functions, industries, and seniority levels.</p>
<p>Roles are ranked by automation index — from highest exposure (96%) to lowest (15%). Each entry occupies a full page and includes:</p>
<ul>
<li><strong>Automation Index</strong> — the percentage of daily task load facing machine execution within 24 months.</li>
<li><strong>Disruption Class</strong> — the organizational outcome: elimination, attrition, transformation, or preservation.</li>
<li><strong>Task-Level Exposure</strong> — individual task feasibility scores with visual representation.</li>
<li><strong>Execution-to-Judgment Ratio</strong> — the proportion of automatable vs. protected work.</li>
<li><strong>Human Survival Moat</strong> — the structural barriers protecting whatever remains.</li>
<li><strong>24-Month Timeline</strong> — deployment phases specific to this role.</li>
<li><strong>Narrative Assessment</strong> — contextual analysis of the role's structural position.</li>
</ul>
<p>The data in this chapter is designed to be referenced independently. Professionals can locate their specific role and assess their individual exposure without reading the full report.</p>
<h3>Master Reference Table</h3>
<table class="role-table" style="width:100%;font-size:7.5pt;">
<thead><tr><th>#</th><th>Role</th><th>Index</th><th>Class</th><th>Wave</th></tr></thead>
<tbody>'''

for i, role in enumerate(roles, 1):
    color = get_color(role["automation_index"])
    ch3_intro += f'<tr><td>{i}</td><td><a href="#role-{role["slug"]}" style="color:var(--dark);font-weight:600;">{role["title"]}</a></td><td style="color:{color};font-weight:700;">{role["automation_index"]}%</td><td>{role["disruption_class"]}</td><td>{get_wave(role["automation_index"])}</td></tr>'

ch3_intro += '</tbody></table></section>'
ch3_roles = ""
for i, role in enumerate(roles, 1):
    ch3_roles += build_role_page(role, i)
    if i % 50 == 0:
        print(f"  Built {i}/154 role pages...")

print(f"  Built 154/154 role pages.")

# ===== FINAL HTML =====
full_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="robots" content="noindex, nofollow">
<title>2028 Agentic AI Workforce Disruption Report</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

@page {{ size:A4; margin:16mm 14mm 20mm 14mm; }}
@page :first {{ margin:0; }}

:root {{ --dark:#0F172A; --accent:#9333EA; --text:#334155; --muted:#64748B; --soft:#94A3B8; --border:#E2E8F0; --bg:#FFF; --alt:#F8FAFC; }}
* {{ box-sizing:border-box; margin:0; padding:0; }}
body {{ font-family:'Inter',sans-serif; font-size:8.5pt; line-height:1.55; color:var(--text); }}

/* Cover */
.cover {{ page-break-after:always; width:210mm; height:297mm; background:linear-gradient(135deg,#0F172A,#1E293B,#0F172A); display:flex; flex-direction:column; justify-content:center; padding:40mm 30mm; position:relative; overflow:hidden; }}
.cover::before {{ content:''; position:absolute; top:-80px; right:-60px; width:300px; height:300px; border-radius:50%; background:radial-gradient(circle,rgba(147,51,234,0.15),transparent 70%); }}
.cover-label {{ font-size:7.5pt; font-weight:700; letter-spacing:0.25em; color:#9333EA; margin-bottom:14px; }}
.cover-title {{ font-size:30pt; font-weight:800; color:#F8FAFC; letter-spacing:-0.03em; line-height:1.1; margin-bottom:14px; }}
.cover-sub {{ font-size:11pt; color:#94A3B8; line-height:1.5; max-width:380px; margin-bottom:36px; }}
.cover-meta {{ font-size:8.5pt; color:#64748B; line-height:2; }}
.cover-meta strong {{ color:#CBD5E1; }}
.cover-footer {{ position:absolute; bottom:28mm; left:30mm; right:30mm; display:flex; justify-content:space-between; border-top:1px solid rgba(255,255,255,0.08); padding-top:14px; font-size:7.5pt; color:#64748B; }}
.cover-footer .brand {{ color:#9333EA; font-weight:700; }}

/* TOC */
.toc {{ page-break-after:always; padding:24mm 0; }}
.toc h2 {{ font-size:16pt; font-weight:800; color:var(--dark); margin-bottom:20px; }}
.toc-item {{ display:flex; justify-content:space-between; padding:7px 0; border-bottom:1px solid var(--border); font-size:9pt; }}
.toc-item span:first-child {{ font-weight:600; color:var(--dark); }}
.toc-item span:last-child {{ font-size:8pt; color:var(--muted); }}

/* Prose chapters — two-column */
.prose-chapter {{ page-break-before:always; columns:2; column-gap:7mm; column-rule:0.5px solid var(--border); }}
.prose-chapter h1 {{ font-size:18pt; font-weight:800; color:var(--dark); margin:0 0 5mm; padding:10mm 0 4mm; border-bottom:2.5px solid var(--accent); page-break-before:always; }}
.prose-chapter h1:first-child {{ page-break-before:avoid; }}
.prose-chapter h2 {{ font-size:11pt; font-weight:800; color:var(--dark); margin:6mm 0 3mm; padding-top:3mm; break-after:avoid; }}
.prose-chapter h3 {{ font-size:9pt; font-weight:700; color:var(--dark); margin:4mm 0 2mm; break-after:avoid; }}
.prose-chapter h4 {{ font-size:8pt; font-weight:700; color:var(--accent); margin:4mm 0 2mm; text-transform:uppercase; letter-spacing:0.04em; break-after:avoid; }}
.prose-chapter p {{ margin:0 0 2.5mm; text-align:justify; hyphens:auto; }}
.prose-chapter ul, .prose-chapter ol {{ margin:2mm 0 3mm 4mm; }}
.prose-chapter li {{ margin-bottom:1.5mm; }}
.prose-chapter strong {{ color:var(--dark); }}
.prose-chapter table {{ width:100%; border-collapse:collapse; margin:3mm 0 4mm; font-size:7.5pt; break-inside:avoid; }}
.prose-chapter thead {{ background:var(--dark); }}
.prose-chapter th {{ padding:2mm 2.5mm; font-size:6.5pt; font-weight:700; letter-spacing:0.05em; text-transform:uppercase; color:#F8FAFC; text-align:left; }}
.prose-chapter td {{ padding:1.8mm 2.5mm; border-bottom:1px solid var(--border); }}
.prose-chapter tbody tr:nth-child(even) {{ background:var(--alt); }}
.prose-chapter pre {{ background:var(--dark); color:#E2E8F0; padding:4mm; border-radius:2mm; font-size:7pt; line-height:1.4; margin:3mm 0; white-space:pre-wrap; break-inside:avoid; }}
.prose-chapter code {{ font-size:7.5pt; background:var(--alt); padding:0.3mm 1mm; border-radius:0.5mm; }}
.prose-chapter pre code {{ background:none; padding:0; }}
.prose-chapter blockquote {{ margin:3mm 0; padding:3mm 4mm; border-left:2.5px solid var(--accent); background:var(--alt); font-style:italic; color:var(--muted); break-inside:avoid; }}
.prose-chapter blockquote p {{ margin:0; text-align:left; }}
.prose-chapter svg {{ display:block; margin:3mm 0 4mm; max-width:100%; break-inside:avoid; }}

/* Chapter 3 intro */
.ch3-intro {{ page-break-before:always; padding:10mm 0; text-align:left; }}
.ch3-intro h1 {{ font-size:22pt; font-weight:800; color:var(--dark); margin-bottom:5mm; border-bottom:2.5px solid var(--accent); padding-bottom:4mm; }}
.ch3-intro h2 {{ font-size:12pt; font-weight:800; color:var(--dark); margin:5mm 0 3mm; }}
.ch3-intro h3 {{ font-size:10pt; font-weight:700; color:var(--dark); margin:6mm 0 3mm; page-break-before:always; }}
.ch3-intro p {{ font-size:9pt; color:var(--text); line-height:1.6; margin:0 0 3mm; text-align:left; }}
.ch3-intro ul {{ font-size:8.5pt; color:var(--text); margin:2mm 0 4mm 4mm; line-height:1.6; }}
.ch3-intro li {{ margin-bottom:1.5mm; }}
.ch3-intro p {{ font-size:10pt; color:var(--muted); }}

/* Role pages */
.role-page {{ page-break-before:always; padding:10mm 0; }}
.role-header {{ display:flex; align-items:center; gap:5mm; margin-bottom:7mm; padding-bottom:5mm; border-bottom:2px solid var(--border); }}
.role-rank-badge {{ font-size:8pt; font-weight:800; color:var(--soft); background:var(--alt); border:1px solid var(--border); border-radius:2mm; padding:1.5mm 3mm; }}
.role-title-area {{ flex:1; }}
.role-name {{ font-size:13pt; font-weight:800; color:var(--dark); margin:0 0 1.5mm; letter-spacing:-0.02em; }}
.role-tags {{ display:flex; gap:2mm; }}
.role-dc-tag {{ display:inline-block; font-size:6.5pt; font-weight:700; padding:1.5mm 3.5mm; border-radius:1mm; letter-spacing:0.05em; }}
.role-wave-tag {{ display:inline-block; font-size:6.5pt; font-weight:600; padding:1.5mm 3.5mm; border-radius:1mm; background:var(--alt); color:var(--muted); border:0.5px solid var(--border); }}
.role-gauge {{ flex-shrink:0; }}
.role-summary {{ font-size:8.5pt; color:var(--text); line-height:1.6; margin-bottom:7mm; padding:4mm 5mm; background:var(--alt); border-radius:2mm; border-left:2.5px solid var(--accent); }}
.role-grid {{ display:grid; grid-template-columns:1fr 1fr; gap:8mm; }}
.role-left h4, .role-right h4 {{ font-size:7.5pt; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:var(--muted); margin:0 0 3mm; padding-top:4mm; border-top:1px solid var(--border); }}
.role-left h4:first-child, .role-right h4:first-child {{ border-top:none; padding-top:0; }}
.role-table {{ width:100%; font-size:7.5pt; border-collapse:collapse; }}
.role-table td {{ padding:2.5mm 0; border-bottom:1px solid var(--border); }}
.role-table td:first-child {{ color:var(--muted); }}
.role-table td:last-child {{ text-align:right; font-weight:600; color:var(--dark); }}
.role-moat-text {{ font-size:7.5pt; color:var(--text); line-height:1.5; }}

/* Page numbers */
@page {{ @bottom-center {{ content:counter(page); font-family:'Inter',sans-serif; font-size:7pt; color:#94A3B8; }} }}
@page :first {{ @bottom-center {{ content:none; }} }}

/* Final page */
.final-page {{ page-break-before:always; padding:16mm 0; }}
.final-inner {{ max-width:100%; }}
.final-logo {{ font-size:10pt; font-weight:800; color:var(--accent); letter-spacing:0.05em; margin-bottom:4mm; }}
.final-title {{ font-size:14pt; font-weight:800; color:var(--dark); margin-bottom:2mm; }}
.final-edition {{ font-size:8.5pt; color:var(--muted); margin-bottom:10mm; }}
.final-section {{ margin-bottom:8mm; }}
.final-section h3 {{ font-size:9.5pt; font-weight:700; color:var(--dark); margin-bottom:3mm; padding-bottom:2mm; border-bottom:1px solid var(--border); }}
.final-section p {{ font-size:8.5pt; color:var(--text); line-height:1.6; margin-bottom:2mm; }}
.final-cite {{ font-size:8pt; color:var(--muted); padding:3mm 4mm; background:var(--alt); border-radius:2mm; margin:2mm 0 4mm; font-style:italic; }}
.final-footer {{ margin-top:12mm; padding-top:6mm; border-top:2px solid var(--dark); text-align:center; }}
.final-footer p {{ font-size:8pt; color:var(--muted); margin:1mm 0; }}
</style>
</head>
<body>

<div class="cover">
  <div class="cover-label">RESEARCH REPORT · 2026</div>
  <h1 class="cover-title">2028 Agentic AI<br>Workforce Disruption<br>Report</h1>
  <p class="cover-sub">A forensic audit of 154 professional roles against the 24-month agentic automation window.</p>
  <div class="cover-meta"><strong>154</strong> roles · <strong>4</strong> disruption classes · <strong>24-month</strong> window · <strong>Jan 2026 – Dec 2027</strong></div>
  <div class="cover-footer"><span>hasanjaffal.com · AI & Operational Intelligence</span><span class="brand">The Second Mind</span></div>
</div>

<div class="toc">
  <h2>Table of Contents</h2>
  <div class="toc-item"><span>I. Executive Directive</span><span>The Agentic Shift thesis</span></div>
  <div class="toc-item"><span>II. State of the 2028 Workforce</span><span>Macro analysis & compression theory</span></div>
  <div class="toc-item"><span>III. The Threat Matrix</span><span>154 role forensic audits</span></div>
  <div class="toc-item"><span>IV. Strategic Adaptation</span><span>Repositioning framework & 30-day protocol</span></div>
  <div class="toc-item"><span>V. Methodology</span><span>Scoring criteria & limitations</span></div>
  <div class="toc-item"><span>VI. Key Findings</span><span>Statistics & conclusions</span></div>
  <div class="toc-item"><span>VII. Downloads & Templates</span><span>30-day protocol printable worksheets</span></div>
</div>

{prose_before}
{ch3_intro}
{ch3_roles}
{prose_after}

<!-- FINAL PAGE: Rights & Citation -->
<div class="final-page">
  <div class="final-inner">
    <div class="final-logo">The Second Mind</div>
    <h2 class="final-title">2028 Agentic AI Workforce Disruption Report</h2>
    <p class="final-edition">First Edition · 2026 · Methodology Version 1.0</p>

    <div class="final-section">
      <h3>Copyright & Rights</h3>
      <p>© 2026 Hasan Jaffal. All rights reserved.</p>
      <p>No part of this publication may be reproduced, distributed, or transmitted in any form or by any means, including photocopying, recording, or other electronic or mechanical methods, without the prior written permission of the author, except in the case of brief quotations embodied in critical reviews and certain other noncommercial uses permitted by copyright law.</p>
    </div>

    <div class="final-section">
      <h3>Citation Guidelines</h3>
      <p><strong>Academic / Research:</strong></p>
      <p class="final-cite">Jaffal, H. (2026). <em>2028 Agentic AI Workforce Disruption Report.</em> AI &amp; Operational Intelligence Research Program. hasanjaffal.com.</p>
      <p><strong>Journalism / Media:</strong></p>
      <p class="final-cite">"2028 Agentic AI Workforce Disruption Report, hasanjaffal.com, 2026. 154 roles evaluated."</p>
      <p><strong>Individual Role Reference:</strong></p>
      <p class="final-cite">"[Role Title] Automation Index: [X]%. Source: 2028 Agentic AI Workforce Disruption Report, hasanjaffal.com."</p>
    </div>

    <div class="final-section">
      <h3>Usage Permissions</h3>
      <p><strong>Permitted:</strong> Quoting individual data points (automation indexes, disruption classes) with attribution. Referencing methodology framework with citation. Linking to the online directory.</p>
      <p><strong>Not Permitted:</strong> Reproducing full role audits without permission. Redistributing the complete report. Using data to build competing commercial products. Removing attribution or implying original authorship.</p>
      <p><strong>Commercial licensing:</strong> Contact hasan@hasanjaffal.com for bulk distribution, corporate training use, or integration into commercial products.</p>
    </div>

    <div class="final-section">
      <h3>Disclaimer</h3>
      <p>This report provides analytical assessments based on observable technology trends and deployment patterns. It does not constitute career advice, legal counsel, or employment guidance. Automation indexes represent structural role-level exposure and do not predict individual outcomes. The author bears no liability for decisions made based on this report's findings.</p>
    </div>

    <div class="final-footer">
      <p>hasanjaffal.com · AI &amp; Operational Intelligence Research Program</p>
      <p>Available online: hasanjaffal.com/ai-job-risk-directory</p>
    </div>
  </div>
</div>

</body>
</html>"""

with open(OUTPUT_HTML, "w") as f:
    f.write(full_html)
print(f"HTML: {len(full_html)//1024}KB")
print("Rendering PDF...")

result = subprocess.run(["weasyprint", OUTPUT_HTML, OUTPUT_PDF], capture_output=True, text=True, timeout=600)
if result.returncode == 0:
    size_mb = os.path.getsize(OUTPUT_PDF) / (1024*1024)
    pages = "?"
    try:
        import subprocess as sp
        r = sp.run(["mdls", "-name", "kMDItemNumberOfPages", OUTPUT_PDF], capture_output=True, text=True)
        pages = r.stdout.split("=")[1].strip() if "=" in r.stdout else "?"
    except: pass
    print(f"✓ PDF: {OUTPUT_PDF}")
    print(f"  Size: {size_mb:.1f} MB | Pages: {pages}")
else:
    print(f"Error: {result.stderr[:500]}")
