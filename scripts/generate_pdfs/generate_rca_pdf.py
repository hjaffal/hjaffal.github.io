#!/usr/bin/env python3
"""Generate the AI Root Cause Analysis Template PDF."""

from fpdf import FPDF

FONT_DIR = '/System/Library/Fonts/Supplemental/'
DARK = (15, 23, 42)
DARK_SOFT = (30, 41, 59)
ACCENT = (147, 51, 234)
WHITE = (255, 255, 255)
SLATE_BG = (248, 250, 252)
SLATE_BORDER = (226, 232, 240)
TEXT_MUTED = (100, 116, 139)
TEXT_SOFT = (148, 163, 184)
GREEN = (22, 163, 74)
RED = (220, 38, 38)
AMBER = (217, 119, 6)
PURPLE_LIGHT = (247, 243, 254)


class RCA(FPDF):
    def __init__(self):
        super().__init__()
        self.set_auto_page_break(auto=False)
        self.add_font('A', '', FONT_DIR + 'Arial Unicode.ttf')
        self.add_font('A', 'B', FONT_DIR + 'Arial Bold.ttf')
        self.add_font('A', 'I', FONT_DIR + 'Arial Italic.ttf')

    def hbar(self):
        self.set_fill_color(*DARK)
        self.rect(0, 0, 210, 7, 'F')
        self.set_fill_color(*ACCENT)
        self.rect(0, 7, 210, 1.5, 'F')

    def ft(self, num):
        self.set_y(-15)
        self.set_draw_color(*SLATE_BORDER)
        self.line(20, self.get_y(), 190, self.get_y())
        self.set_y(self.get_y() + 2)
        self.set_font('A', '', 6.5)
        self.set_text_color(*TEXT_SOFT)
        self.cell(85, 4, 'AI Root Cause Analysis Template  |  hasanjaffal.com')
        self.cell(85, 4, f'Page {num}', align='R')

    def sec(self, num, title):
        self.ln(3)
        self.set_font('A', 'B', 7)
        self.set_text_color(*ACCENT)
        self.cell(0, 4, f'SECTION {num}', new_x='LMARGIN', new_y='NEXT')
        self.set_font('A', 'B', 13)
        self.set_text_color(*DARK)
        self.cell(0, 7, title, new_x='LMARGIN', new_y='NEXT')
        self.ln(2)

    def subsec(self, title):
        self.ln(2)
        self.set_font('A', 'B', 10)
        self.set_text_color(*DARK)
        self.cell(0, 5.5, title, new_x='LMARGIN', new_y='NEXT')
        self.ln(1.5)

    def p(self, text):
        self.set_font('A', '', 8.5)
        self.set_text_color(*DARK_SOFT)
        self.multi_cell(0, 4.2, text)
        self.ln(1.5)

    def bullet(self, text):
        self.set_font('A', '', 8.5)
        self.set_text_color(*DARK_SOFT)
        self.set_x(24)
        self.cell(4, 4.2, chr(8226), new_x='RIGHT', new_y='TOP')
        self.multi_cell(146, 4.2, text)
        self.set_x(20)

    def note(self, bold, rest, h=11):
        x, y = self.get_x(), self.get_y()
        self.set_fill_color(*SLATE_BG)
        self.rect(x, y, 170, h, 'F')
        self.set_fill_color(*ACCENT)
        self.rect(x, y, 2, h, 'F')
        self.set_xy(x + 6, y + 3)
        self.set_font('A', 'B', 8)
        self.set_text_color(*DARK)
        self.cell(self.get_string_width(bold) + 1, 4, bold, new_x='RIGHT', new_y='TOP')
        self.set_font('A', '', 8)
        self.set_text_color(*DARK_SOFT)
        self.multi_cell(120, 4, rest)
        self.set_y(y + h + 3)

    def tip(self, text, h=12):
        x, y = self.get_x(), self.get_y()
        self.set_fill_color(*PURPLE_LIGHT)
        self.set_draw_color(196, 167, 240)
        self.rect(x, y, 170, h, 'DF')
        self.set_xy(x + 5, y + 3.5)
        self.set_font('A', '', 8)
        self.set_text_color(*DARK_SOFT)
        self.multi_cell(160, 4, text)
        self.set_y(y + h + 2)

    def tbl(self, headers, rows, widths):
        self.set_fill_color(*DARK)
        self.set_text_color(*WHITE)
        self.set_font('A', 'B', 7)
        for i, h in enumerate(headers):
            self.cell(widths[i], 6.5, h, new_x='RIGHT', new_y='TOP', fill=True)
        self.ln()
        self.set_font('A', '', 8)
        for idx, row in enumerate(rows):
            bg = SLATE_BG if idx % 2 == 0 else WHITE
            self.set_fill_color(*bg)
            self.set_text_color(*DARK)
            for i, c in enumerate(row):
                self.cell(widths[i], 5.8, c, new_x='RIGHT', new_y='TOP', fill=True)
            self.ln()
        self.ln(3)

    def empty_tbl(self, headers, widths, n=4):
        self.set_fill_color(*DARK)
        self.set_text_color(*WHITE)
        self.set_font('A', 'B', 7)
        for i, h in enumerate(headers):
            self.cell(widths[i], 6.5, h, new_x='RIGHT', new_y='TOP', fill=True)
        self.ln()
        self.set_font('A', '', 8)
        for idx in range(n):
            bg = SLATE_BG if idx % 2 == 0 else WHITE
            self.set_fill_color(*bg)
            for i in range(len(headers)):
                self.cell(widths[i], 5.8, '', new_x='RIGHT', new_y='TOP', fill=True)
            self.ln()
        self.ln(3)


def build():
    pdf = RCA()
    pdf.set_left_margin(20)
    pdf.set_right_margin(20)

    # ===== COVER =====
    pdf.add_page()
    pdf.hbar()
    pdf.set_y(50)
    pdf.set_font('A', 'B', 7)
    pdf.set_text_color(*ACCENT)
    pdf.cell(0, 4, 'AI TEMPLATE  |  RISK MANAGEMENT', new_x='LMARGIN', new_y='NEXT')
    pdf.ln(6)
    pdf.set_font('A', 'B', 28)
    pdf.set_text_color(*DARK)
    pdf.cell(0, 11, 'Root Cause Analysis', new_x='LMARGIN', new_y='NEXT')
    pdf.set_text_color(*ACCENT)
    pdf.cell(0, 11, 'Template', new_x='LMARGIN', new_y='NEXT')
    pdf.ln(8)
    pdf.set_font('A', '', 10)
    pdf.set_text_color(*TEXT_MUTED)
    pdf.multi_cell(145, 5, 'A structured investigation framework for operations teams. Move from symptoms to true root causes using the 5-Why chain, evidence grading, contributing factor mapping, and corrective action tracking.')
    pdf.ln(12)

    # Info box
    x, y = pdf.get_x(), pdf.get_y()
    pdf.set_fill_color(*SLATE_BG)
    pdf.set_draw_color(*SLATE_BORDER)
    pdf.rect(x, y, 170, 44, 'DF')
    info = [
        ('Category:', 'Risk Management / Operations'),
        ('Audience:', 'Managers, analysts, investigators, quality leads'),
        ('Use When:', 'Incidents, repeated failures, near-misses, process breakdowns'),
        ('Sections:', '12 structured sections with investigation tables'),
        ('Principle:', 'Separate facts from assumptions. Fix systems, not people.'),
    ]
    for i, (label, val) in enumerate(info):
        pdf.set_xy(x + 10, y + 5 + i * 7.5)
        pdf.set_font('A', 'B', 8)
        pdf.set_text_color(*DARK)
        pdf.cell(32, 4, label, new_x='RIGHT', new_y='TOP')
        pdf.set_font('A', '', 8)
        pdf.set_text_color(*DARK_SOFT)
        pdf.cell(0, 4, val)
    pdf.set_y(y + 50)

    pdf.ln(8)
    pdf.set_font('A', 'B', 8)
    pdf.set_text_color(*ACCENT)
    pdf.cell(0, 4, 'hasanjaffal.com/ai-templates', new_x='LMARGIN', new_y='NEXT')

    # ===== PAGE 2: INCIDENT CAPTURE =====
    pdf.add_page()
    pdf.hbar()
    pdf.set_y(14)

    pdf.sec(1, 'Incident Summary')
    pdf.p('Capture the basic facts before investigating. Do not interpret yet. Just record what happened, when, where, and who was involved.')

    pdf.empty_tbl(
        ['FIELD', 'DETAILS'],
        [50, 120],
        n=1
    )
    # Manual rows for the incident form
    fields = [
        ('Incident Title', ''),
        ('Date & Time Detected', ''),
        ('Date & Time Started (if different)', ''),
        ('Location / System / Process', ''),
        ('Reported By', ''),
        ('Severity', 'Critical / High / Medium / Low'),
        ('Impact Summary', ''),
        ('Immediate Action Taken', ''),
    ]
    pdf.tbl(
        ['FIELD', 'DETAILS'],
        fields,
        [50, 120]
    )

    pdf.note('Rule: ', 'Write what happened, not why. The "why" comes later. Premature conclusions poison the investigation.')

    pdf.ln(2)
    pdf.sec(2, 'Timeline of Events')
    pdf.p('Reconstruct the sequence. Include what was observed, by whom, and what action was taken at each point. Gaps in the timeline are clues.')

    pdf.empty_tbl(
        ['TIME', 'EVENT', 'OBSERVED BY', 'ACTION TAKEN', 'EVIDENCE'],
        [22, 45, 28, 40, 35],
        n=8
    )

    pdf.tip('If you cannot fill a row with evidence, mark it as "assumed" or "unknown". Gaps matter as much as facts.')

    pdf.ft(1)

    # ===== PAGE 3: 5-WHY ANALYSIS =====
    pdf.add_page()
    pdf.hbar()
    pdf.set_y(14)

    pdf.sec(3, 'The 5-Why Chain')
    pdf.p('Start with the problem statement. Ask "why" repeatedly until you reach a systemic cause. Most teams stop too early. Push past the comfortable answer.')

    pdf.subsec('Problem Statement')
    pdf.empty_tbl(['WHAT HAPPENED (FACTUAL, SPECIFIC, MEASURABLE)'], [170], n=2)

    pdf.tbl(
        ['LEVEL', 'WHY?', 'ANSWER', 'EVIDENCE TYPE'],
        [
            ['Why 1', 'Why did this happen?', '', 'Data / Observation / Testimony'],
            ['Why 2', 'Why did that cause occur?', '', 'Data / Observation / Testimony'],
            ['Why 3', 'Why was that possible?', '', 'Data / Observation / Testimony'],
            ['Why 4', 'Why did the system allow it?', '', 'Data / Observation / Testimony'],
            ['Why 5', 'Why was there no safeguard?', '', 'Data / Observation / Testimony'],
        ],
        [18, 42, 65, 45]
    )

    pdf.note('Depth test: ', 'If your root cause is a person ("John made a mistake"), you stopped too early. Ask: why was the system designed so that one person could cause this?')

    pdf.ln(3)
    pdf.sec(4, 'Evidence Grading')
    pdf.p('Not all evidence is equal. Grade each piece to understand how confident you are in your conclusions.')

    pdf.tbl(
        ['GRADE', 'MEANING', 'EXAMPLE', 'CONFIDENCE'],
        [
            ['A - Hard Data', 'System logs, metrics, timestamps', 'Server log shows timeout at 14:03', 'High'],
            ['B - Direct Observation', 'Witnessed by a person present', 'Operator saw the alert fire', 'Medium-High'],
            ['C - Testimony', 'Reported after the fact', '"I think I clicked approve"', 'Medium'],
            ['D - Inference', 'Logical deduction, no direct proof', 'Must have been X because Y', 'Low-Medium'],
            ['E - Assumption', 'No evidence, just belief', '"It always works that way"', 'Low'],
        ],
        [30, 40, 55, 45]
    )

    pdf.tip('If your root cause relies only on Grade C-E evidence, you need more investigation before declaring it solved.')

    pdf.ft(2)

    # ===== PAGE 4: CONTRIBUTING FACTORS =====
    pdf.add_page()
    pdf.hbar()
    pdf.set_y(14)

    pdf.sec(5, 'Contributing Factor Map')
    pdf.p('Root causes rarely act alone. Map the contributing factors across these categories to see the full picture.')

    pdf.tbl(
        ['CATEGORY', 'CONTRIBUTING FACTOR', 'EVIDENCE', 'GRADE', 'FIXABLE?'],
        [
            ['Process', '', '', '', 'Yes / No / Partial'],
            ['People / Training', '', '', '', 'Yes / No / Partial'],
            ['Technology / Tools', '', '', '', 'Yes / No / Partial'],
            ['Communication', '', '', '', 'Yes / No / Partial'],
            ['Oversight / Controls', '', '', '', 'Yes / No / Partial'],
            ['External / Environment', '', '', '', 'Yes / No / Partial'],
            ['Incentives / Pressure', '', '', '', 'Yes / No / Partial'],
        ],
        [32, 42, 38, 20, 38]
    )

    pdf.note('Key insight: ', 'If you find 3+ contributing factors in the same category, that category is your systemic weakness, not the individual incident.')

    pdf.ln(3)
    pdf.sec(6, 'Barrier Analysis')
    pdf.p('What defenses should have prevented this? Why did they fail? This reveals where your safety net has holes.')

    pdf.empty_tbl(
        ['BARRIER (CONTROL)', 'EXPECTED BEHAVIOR', 'ACTUAL BEHAVIOR', 'WHY IT FAILED', 'FIX PRIORITY'],
        [32, 35, 35, 38, 30],
        n=5
    )

    pdf.subsec('Barrier Types to Check')
    pdf.bullet('Prevention barriers: Should have stopped the event from starting')
    pdf.bullet('Detection barriers: Should have caught it early')
    pdf.bullet('Mitigation barriers: Should have limited the damage')
    pdf.bullet('Recovery barriers: Should have restored normal state quickly')

    pdf.ft(3)

    # ===== PAGE 5: ROOT CAUSE STATEMENT & CORRECTIVE ACTIONS =====
    pdf.add_page()
    pdf.hbar()
    pdf.set_y(14)

    pdf.sec(7, 'Root Cause Statement')
    pdf.p('Write the root cause as a clear, testable statement. It must be systemic (not a person), supported by evidence, and actionable.')

    pdf.empty_tbl(
        ['COMPONENT', 'YOUR ANSWER'],
        [45, 125],
        n=1
    )
    pdf.tbl(
        ['COMPONENT', 'YOUR ANSWER'],
        [
            ['Root Cause (1 sentence)', ''],
            ['Category', 'Process / People / Technology / Controls / External'],
            ['Evidence Grade', 'A / B / C / D / E'],
            ['Confidence Level', 'High / Medium / Low'],
            ['Could this cause other incidents?', 'Yes / No / Unknown'],
            ['Has this happened before?', 'Yes (when?) / No / Unknown'],
        ],
        [45, 125]
    )

    pdf.note('Quality check: ', 'A good root cause statement passes this test: "If we fix X, this specific failure mode cannot recur." If it can still recur, dig deeper.')

    pdf.ln(3)
    pdf.sec(8, 'Corrective Actions')
    pdf.p('Define actions that fix the root cause, not just the symptom. Each action must have an owner, deadline, and success measure.')

    pdf.empty_tbl(
        ['ACTION', 'TYPE', 'OWNER', 'DUE DATE', 'SUCCESS MEASURE', 'STATUS'],
        [38, 22, 25, 22, 38, 25],
        n=6
    )

    pdf.subsec('Action Types')
    pdf.bullet('Immediate containment: Stop the bleeding now (hours)')
    pdf.bullet('Short-term fix: Prevent recurrence this week (days)')
    pdf.bullet('Systemic fix: Redesign the process or control (weeks)')
    pdf.bullet('Verification: Confirm the fix actually works (ongoing)')

    pdf.ft(4)

    # ===== PAGE 6: VERIFICATION & LEARNING =====
    pdf.add_page()
    pdf.hbar()
    pdf.set_y(14)

    pdf.sec(9, 'Verification Plan')
    pdf.p('How will you prove the fix works? Define what you will measure, when you will check, and what "fixed" looks like.')

    pdf.empty_tbl(
        ['CORRECTIVE ACTION', 'VERIFICATION METHOD', 'CHECK DATE', 'EXPECTED RESULT', 'ACTUAL RESULT', 'CLOSED?'],
        [32, 32, 22, 30, 30, 24],
        n=5
    )

    pdf.note('Discipline: ', 'An RCA is not complete until verification confirms the fix works. Schedule the check date now, not later.')

    pdf.ln(3)
    pdf.sec(10, 'Lessons Learned')
    pdf.p('What did this investigation teach the team? Capture insights that apply beyond this single incident.')

    pdf.empty_tbl(
        ['LESSON', 'APPLIES TO', 'ACTION TO EMBED', 'OWNER'],
        [50, 40, 50, 30],
        n=4
    )

    pdf.ln(2)
    pdf.sec(11, 'Recurrence Risk Assessment')
    pdf.p('Before closing, assess whether this could happen again elsewhere.')

    pdf.tbl(
        ['QUESTION', 'ANSWER'],
        [
            ['Could this happen in another team/location?', ''],
            ['Are similar processes at risk?', ''],
            ['Do other systems share the same weakness?', ''],
            ['Is the fix scalable or local only?', ''],
            ['Who else needs to know about this?', ''],
        ],
        [85, 85]
    )

    pdf.ft(5)

    # ===== PAGE 7: AI PROMPT =====
    pdf.add_page()
    pdf.hbar()
    pdf.set_y(14)

    pdf.sec(12, 'AI Prompt - Copy and Paste')
    pdf.p('Use this prompt with any AI assistant. Paste your incident data where indicated.')

    x, y = pdf.get_x(), pdf.get_y()
    pdf.set_fill_color(*DARK)
    pdf.rect(x, y, 170, 120, 'F')
    pdf.set_xy(x + 8, y + 6)
    pdf.set_font('A', '', 7.5)
    pdf.set_text_color(226, 232, 240)

    lines = [
        'Act as a senior operations investigator.',
        '',
        'Conduct a Root Cause Analysis using the incident data below.',
        'Be rigorous. Separate facts from assumptions.',
        '',
        'Structure:',
        '1. Incident Summary (what, when, where, severity)',
        '2. Timeline of Events (sequence with evidence)',
        '3. 5-Why Chain (push past the obvious)',
        '4. Evidence Grading (rate each piece A through E)',
        '5. Contributing Factor Map (process, people, tech, controls)',
        '6. Barrier Analysis (what should have prevented this)',
        '7. Root Cause Statement (systemic, testable, actionable)',
        '8. Corrective Actions (immediate, short-term, systemic)',
        '9. Verification Plan (how to prove the fix works)',
        '10. Lessons Learned (what applies beyond this incident)',
        '11. Recurrence Risk (could this happen elsewhere)',
        '',
        'Rules:',
        '- Never blame a person. Find the system failure.',
        '- Grade every piece of evidence.',
        '- If evidence is weak, say so explicitly.',
        '- Every action must have an owner and deadline.',
        '- The root cause must be fixable and testable.',
        '',
        'Incident data: [PASTE HERE]',
        'Timeline: [PASTE HERE]',
        'Known facts: [PASTE HERE]',
        'Assumptions: [PASTE HERE]',
        'Previous similar incidents: [PASTE HERE]',
    ]
    for line in lines:
        pdf.set_x(x + 8)
        pdf.cell(0, 3.8, line, new_x='LMARGIN', new_y='NEXT')

    pdf.set_y(y + 125)
    pdf.set_text_color(*DARK)

    pdf.subsec('Investigation Principles')
    pdf.bullet('Fix systems, not people. If a person could cause it, the system allowed it.')
    pdf.bullet('Evidence over opinion. Grade everything.')
    pdf.bullet('Depth over speed. A shallow RCA is worse than none.')
    pdf.bullet('Verify before closing. An unverified fix is a hope, not a solution.')

    pdf.ft(6)

    # ===== PAGE 8: COMMON MISTAKES & BEST PRACTICES =====
    pdf.add_page()
    pdf.hbar()
    pdf.set_y(14)

    pdf.sec('', 'Common Mistakes in Root Cause Analysis')
    pdf.ln(1)

    mistakes = [
        'Stopping at the first "why" - the obvious answer is rarely the root cause.',
        'Blaming individuals instead of finding systemic failures.',
        'Confusing correlation with causation.',
        'Accepting testimony as fact without corroboration.',
        'Declaring a root cause with only Grade D-E evidence.',
        'Defining corrective actions that only fix the symptom.',
        'Closing the RCA before verifying the fix works.',
        'Ignoring contributing factors outside your team.',
        'Treating every incident as unique when patterns exist.',
        'Writing the RCA to satisfy compliance, not to learn.',
    ]
    for m in mistakes:
        pdf.bullet(m)

    pdf.ln(4)
    pdf.subsec('Best Practices')
    pdf.ln(1)

    practices = [
        'Start with the timeline. Facts first, interpretation second.',
        'Use the 5-Why chain but branch when multiple causes exist.',
        'Grade every piece of evidence before drawing conclusions.',
        'Map contributing factors across all categories, not just the obvious one.',
        'Check all four barrier types: prevention, detection, mitigation, recovery.',
        'Write the root cause as a testable hypothesis.',
        'Define verification criteria before implementing the fix.',
        'Share lessons learned with teams who face similar risks.',
        'Track recurrence. If it happens again, your RCA failed.',
        'Time-box the investigation. 80% of value comes in the first 48 hours.',
    ]
    for p_item in practices:
        pdf.bullet(p_item)

    pdf.ln(4)
    pdf.note('Final principle: ', 'The purpose of RCA is not to explain the past. It is to prevent the future. If your analysis does not change a system, it was documentation, not investigation.', h=14)

    pdf.ft(7)

    # Output
    out = '/Users/hjaffal/hasanjaffal.com/hjaffal.github.io/ai-templates-section/pdf/ai-root-cause-analysis-template.pdf'
    pdf.output(out)
    print(f'PDF generated: {out}')
    print(f'Pages: {pdf.page_no()}')


if __name__ == '__main__':
    build()
