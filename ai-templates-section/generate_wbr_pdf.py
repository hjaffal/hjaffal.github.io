#!/usr/bin/env python3
"""Generate a sophisticated AI Weekly Business Review Template PDF."""

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


class WBR(FPDF):
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

    def ft(self):
        self.set_y(-15)
        self.set_draw_color(*SLATE_BORDER)
        self.line(20, self.get_y(), 190, self.get_y())
        self.set_y(self.get_y() + 2)
        self.set_font('A', '', 6.5)
        self.set_text_color(*TEXT_SOFT)
        self.cell(85, 4, 'AI Weekly Business Review Template  |  hasanjaffal.com')
        self.cell(85, 4, f'Page {self.page_no() - 1}', align='R')

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

    def note(self, bold, rest):
        x, y = self.get_x(), self.get_y()
        self.set_fill_color(*SLATE_BG)
        h = 11
        self.rect(x, y, 170, h, 'F')
        self.set_fill_color(*ACCENT)
        self.rect(x, y, 2, h, 'F')
        self.set_xy(x + 6, y + 3)
        self.set_font('A', 'B', 8)
        self.set_text_color(*DARK)
        self.cell(self.get_string_width(bold) + 1, 4, bold, new_x='RIGHT', new_y='TOP')
        self.set_font('A', '', 8)
        self.set_text_color(*DARK_SOFT)
        self.cell(0, 4, rest)
        self.set_y(y + h + 3)

    def tip(self, text):
        x, y = self.get_x(), self.get_y()
        self.set_fill_color(*PURPLE_LIGHT)
        self.set_draw_color(196, 167, 240)
        self.rect(x, y, 170, 12, 'DF')
        self.set_xy(x + 5, y + 3.5)
        self.set_font('A', '', 8)
        self.set_text_color(*DARK_SOFT)
        self.multi_cell(160, 4, text)
        self.set_y(y + 14)
        self.set_y(y + 14)

    def tbl(self, headers, rows, widths, highlight_col=None):
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
                if highlight_col is not None and i == highlight_col:
                    if 'Up' in c or '+' in c or 'On Track' in c:
                        self.set_text_color(*GREEN)
                    elif 'Down' in c or '-' in c or 'Below' in c or 'At Risk' in c:
                        self.set_text_color(*RED)
                    elif 'Flat' in c or 'Watch' in c:
                        self.set_text_color(*AMBER)
                    else:
                        self.set_text_color(*DARK)
                self.cell(widths[i], 5.8, c, new_x='RIGHT', new_y='TOP', fill=True)
                self.set_text_color(*DARK)
            self.ln()
        self.ln(3)

    def empty_tbl(self, headers, widths, rows_count=4):
        self.set_fill_color(*DARK)
        self.set_text_color(*WHITE)
        self.set_font('A', 'B', 7)
        for i, h in enumerate(headers):
            self.cell(widths[i], 6.5, h, new_x='RIGHT', new_y='TOP', fill=True)
        self.ln()
        self.set_font('A', '', 8)
        for idx in range(rows_count):
            bg = SLATE_BG if idx % 2 == 0 else WHITE
            self.set_fill_color(*bg)
            self.set_text_color(*TEXT_SOFT)
            for i in range(len(headers)):
                self.cell(widths[i], 5.8, '', new_x='RIGHT', new_y='TOP', fill=True)
            self.ln()
            self.set_draw_color(*SLATE_BORDER)
            self.line(20, self.get_y(), 190, self.get_y())
        self.ln(3)


def build():
    pdf = WBR()
    pdf.set_left_margin(20)
    pdf.set_right_margin(20)

    # ===== COVER =====
    pdf.add_page()
    pdf.hbar()
    pdf.set_y(50)
    pdf.set_font('A', 'B', 7)
    pdf.set_text_color(*ACCENT)
    pdf.cell(0, 4, 'AI TEMPLATE  |  MANAGEMENT', new_x='LMARGIN', new_y='NEXT')
    pdf.ln(6)
    pdf.set_font('A', 'B', 28)
    pdf.set_text_color(*DARK)
    pdf.cell(0, 11, 'Weekly Business Review', new_x='LMARGIN', new_y='NEXT')
    pdf.set_font('A', 'B', 28)
    pdf.set_text_color(*ACCENT)
    pdf.cell(0, 11, 'Template', new_x='LMARGIN', new_y='NEXT')
    pdf.ln(8)
    pdf.set_font('A', '', 10)
    pdf.set_text_color(*TEXT_MUTED)
    pdf.multi_cell(145, 5, 'A comprehensive, structured template for turning weekly performance data into executive-ready business reviews. Covers metrics, movement analysis, risks, root causes, decisions, and owner accountability.')
    pdf.ln(12)

    # Quick info box
    pdf.set_fill_color(*SLATE_BG)
    pdf.set_draw_color(*SLATE_BORDER)
    x, y = pdf.get_x(), pdf.get_y()
    pdf.rect(x, y, 170, 40, 'DF')
    pdf.set_xy(x + 10, y + 6)
    pdf.set_font('A', 'B', 8)
    pdf.set_text_color(*DARK)
    pdf.cell(40, 4, 'Category:', new_x='RIGHT', new_y='TOP')
    pdf.set_font('A', '', 8)
    pdf.cell(0, 4, 'Management / Operations', new_x='LMARGIN', new_y='NEXT')
    pdf.set_x(x + 10)
    pdf.set_font('A', 'B', 8)
    pdf.cell(40, 4, 'Audience:', new_x='RIGHT', new_y='TOP')
    pdf.set_font('A', '', 8)
    pdf.cell(0, 4, 'Managers, analysts, operations leaders, program managers', new_x='LMARGIN', new_y='NEXT')
    pdf.set_x(x + 10)
    pdf.set_font('A', 'B', 8)
    pdf.cell(40, 4, 'Use When:', new_x='RIGHT', new_y='TOP')
    pdf.set_font('A', '', 8)
    pdf.cell(0, 4, 'Weekly reviews, leadership updates, risk reviews, project health checks', new_x='LMARGIN', new_y='NEXT')
    pdf.set_x(x + 10)
    pdf.set_font('A', 'B', 8)
    pdf.cell(40, 4, 'Sections:', new_x='RIGHT', new_y='TOP')
    pdf.set_font('A', '', 8)
    pdf.cell(0, 4, '10 structured sections with tables and guidance', new_x='LMARGIN', new_y='NEXT')
    pdf.set_y(y + 44)

    pdf.ln(12)
    pdf.set_font('A', 'B', 8)
    pdf.set_text_color(*ACCENT)
    pdf.cell(0, 4, 'hasanjaffal.com/ai-templates', new_x='LMARGIN', new_y='NEXT')

    # ===== PAGE 2: METRICS SCORECARD =====
    pdf.add_page()
    pdf.hbar()
    pdf.set_y(14)

    pdf.sec(1, 'Performance Scorecard')
    pdf.p('Start every WBR with the numbers. This table shows each metric, its current value, prior week, target, week-over-week movement, and status. Fill this first — everything else interprets it.')

    pdf.tbl(
        ['METRIC', 'THIS WEEK', 'LAST WEEK', 'TARGET', 'WoW CHANGE', 'STATUS'],
        [
            ['Revenue', '$1.2M', '$1.15M', '$1.3M', '+4.3%  Up', 'Below Target'],
            ['Gross Margin', '38.2%', '37.8%', '40%', '+0.4pp  Up', 'Watch'],
            ['Order Volume', '8,420', '8,100', '9,000', '+3.9%  Up', 'Below Target'],
            ['Fraud Rate', '0.42%', '0.38%', '<0.5%', '+0.04pp  Up', 'On Track'],
            ['Avg Resolution Time', '4.2h', '5.1h', '<4h', '-17.6%  Down', 'Watch'],
            ['Customer NPS', '62', '64', '65', '-2pts  Down', 'At Risk'],
            ['Shrink Rate', '1.8%', '1.9%', '<2%', '-0.1pp  Down', 'On Track'],
            ['Open Incidents', '14', '11', '<10', '+27%  Up', 'At Risk'],
        ],
        [30, 22, 22, 20, 28, 28],
        highlight_col=5
    )

    pdf.note('How to read this table: ', 'Green = on track. Red = needs action. Amber = trending toward risk. Focus discussion on red and amber rows.')

    pdf.ln(3)
    pdf.subsec('Movement Analysis')
    pdf.p('For each metric that moved significantly (>5% or crossed a threshold), explain:')
    pdf.bullet('What moved and by how much')
    pdf.bullet('Why it moved (root cause hypothesis)')
    pdf.bullet('Whether the movement is expected to continue')
    pdf.bullet('What action is needed, if any')

    pdf.ln(2)
    pdf.empty_tbl(
        ['METRIC', 'MOVEMENT', 'ROOT CAUSE HYPOTHESIS', 'EXPECTED TREND', 'ACTION NEEDED'],
        [30, 22, 48, 30, 40],
        rows_count=5
    )

    pdf.ft()

    # ===== PAGE 3: EXECUTIVE SUMMARY & INTERPRETATION =====
    pdf.add_page()
    pdf.hbar()
    pdf.set_y(14)

    pdf.sec(2, 'Executive Summary')
    pdf.p('Write 4-6 bullets that a senior leader can read in 30 seconds. Cover: overall performance, biggest win, biggest concern, key decision needed, and one forward-looking signal.')

    pdf.empty_tbl(
        ['#', 'EXECUTIVE SUMMARY BULLET'],
        [8, 162],
        rows_count=6
    )

    pdf.tip('Rule: If a leader reads only this section, they should know the state of the business and what they need to decide.')

    pdf.ln(2)
    pdf.sec(3, 'Highly Debated Topics')
    pdf.p('List the 2-3 topics where the team disagrees, where data is ambiguous, or where a trade-off must be made. These are the items that need live discussion — not email.')

    pdf.empty_tbl(
        ['TOPIC', 'POSITION A', 'POSITION B', 'DATA AVAILABLE', 'DECISION OWNER'],
        [35, 35, 35, 30, 35],
        rows_count=3
    )

    pdf.note('Purpose: ', 'This section prevents the WBR from becoming a one-way status update. It forces the room to debate what matters.')

    pdf.ln(3)
    pdf.sec(4, 'What Changed This Week')
    pdf.p('Narrative explanation of the most important changes. Focus on surprises, breaks from trend, and new information that was not available last week.')

    pdf.subsec('Key Changes')
    pdf.empty_tbl(
        ['CHANGE', 'IMPACT', 'NEW OR RECURRING', 'REQUIRES ACTION'],
        [55, 40, 35, 40],
        rows_count=4
    )

    pdf.ft()

    # ===== PAGE 4: RISKS & ROOT CAUSES =====
    pdf.add_page()
    pdf.hbar()
    pdf.set_y(14)

    pdf.sec(5, 'Risk Register')
    pdf.p('Active risks that could impact next week or beyond. Score impact and likelihood. Assign an owner and a concrete next action with a deadline.')

    pdf.empty_tbl(
        ['RISK', 'IMPACT', 'LIKELIHOOD', 'EXPOSURE', 'OWNER', 'NEXT ACTION', 'DUE'],
        [30, 18, 20, 18, 22, 38, 24],
        rows_count=5
    )

    pdf.subsec('Risk Escalation Criteria')
    pdf.bullet('Impact = High AND Likelihood = High: Escalate immediately to leadership.')
    pdf.bullet('Impact = High AND Likelihood = Medium: Assign owner, review daily.')
    pdf.bullet('Any risk open > 2 weeks without progress: Escalate.')

    pdf.ln(3)
    pdf.sec(6, 'Root Cause Analysis')
    pdf.p('For each major issue this week, document the root cause investigation. Separate facts from assumptions. Identify what is still unknown.')

    pdf.empty_tbl(
        ['ISSUE', 'WHAT HAPPENED', 'WHY (HYPOTHESIS)', 'EVIDENCE', 'UNKNOWN', 'NEXT CHECK'],
        [25, 30, 30, 28, 28, 29],
        rows_count=3
    )

    pdf.note('Discipline: ', 'Do not list symptoms as root causes. Ask "why" at least 3 times. If you cannot state evidence, mark it as assumption.')

    pdf.ln(3)
    pdf.sec(7, 'Actions Taken This Week')
    pdf.p('What was completed. Include result and whether it resolved the issue or needs follow-up.')

    pdf.empty_tbl(
        ['ACTION', 'OWNER', 'STATUS', 'RESULT', 'FOLLOW-UP NEEDED'],
        [40, 25, 22, 45, 38],
        rows_count=5
    )

    pdf.ft()

    # ===== PAGE 5: BLOCKERS, DECISIONS, UPDATES =====
    pdf.add_page()
    pdf.hbar()
    pdf.set_y(14)

    pdf.sec(8, 'Blockers')
    pdf.p('Anything preventing progress. Be specific about what support is needed and from whom.')

    pdf.empty_tbl(
        ['BLOCKER', 'BLOCKED SINCE', 'IMPACT IF UNRESOLVED', 'SUPPORT NEEDED FROM', 'ESCALATED TO'],
        [38, 24, 38, 38, 32],
        rows_count=4
    )

    pdf.ln(2)
    pdf.sec(9, 'Decisions Needed')
    pdf.p('Decisions that leadership must make this week. Include why it matters, the deadline, options, and a recommendation.')

    pdf.empty_tbl(
        ['DECISION', 'WHY IT MATTERS', 'DEADLINE', 'OPTIONS', 'RECOMMENDATION'],
        [35, 35, 22, 40, 38],
        rows_count=3
    )

    pdf.tip('Rule: Every decision should have a recommended option. Do not present problems without a proposed path forward.')

    pdf.ln(3)
    pdf.sec(10, 'Operational Updates')
    pdf.p('Brief updates on ongoing initiatives, projects, or process changes. Keep each to 1-2 lines. Only include what changed since last week.')

    pdf.empty_tbl(
        ['INITIATIVE', 'STATUS', 'WHAT CHANGED', 'NEXT MILESTONE', 'OWNER'],
        [35, 20, 45, 40, 30],
        rows_count=5
    )

    pdf.ft()

    # ===== PAGE 6: NEXT WEEK & OWNER PLAN =====
    pdf.add_page()
    pdf.hbar()
    pdf.set_y(14)

    pdf.sec(11, 'Next Week Focus')
    pdf.p('The 3-5 priorities for next week. Each must have an owner, expected outcome, and due date. If it does not have an owner, it is not a priority — it is a wish.')

    pdf.empty_tbl(
        ['PRIORITY', 'OWNER', 'EXPECTED OUTCOME', 'DUE DATE', 'SUCCESS MEASURE'],
        [35, 25, 40, 25, 45],
        rows_count=5
    )

    pdf.ln(2)
    pdf.sec(12, 'Owner Accountability Matrix')
    pdf.p('Every open action, risk, and decision mapped to a single owner. This is the contract for next week. Review it at the start of the next WBR.')

    pdf.empty_tbl(
        ['OWNER', 'OPEN ACTIONS', 'OPEN RISKS', 'PENDING DECISIONS', 'TOTAL ITEMS', 'OVERDUE'],
        [30, 28, 28, 30, 24, 30],
        rows_count=5
    )

    pdf.note('Accountability rule: ', 'If an item has no owner, assign one now. If an item is overdue, explain why and set a new date.')

    pdf.ln(4)
    pdf.sec(13, 'Signals to Watch')
    pdf.p('Early indicators that may become issues next week. These are not yet risks — they are weak signals worth monitoring.')

    pdf.empty_tbl(
        ['SIGNAL', 'SOURCE', 'WHY IT MATTERS', 'THRESHOLD TO ESCALATE', 'WHO IS WATCHING'],
        [30, 25, 40, 40, 35],
        rows_count=4
    )

    pdf.ft()

    # ===== PAGE 7: AI PROMPT & USAGE GUIDE =====
    pdf.add_page()
    pdf.hbar()
    pdf.set_y(14)

    pdf.sec(14, 'AI Prompt — Copy and Paste')
    pdf.p('Use this prompt with ChatGPT, Claude, or any AI assistant. Paste your data where indicated.')

    # Prompt block
    x, y = pdf.get_x(), pdf.get_y()
    pdf.set_fill_color(*DARK)
    pdf.rect(x, y, 170, 105, 'F')
    pdf.set_xy(x + 8, y + 6)
    pdf.set_font('A', '', 7.5)
    pdf.set_text_color(226, 232, 240)

    prompt_lines = [
        'Act as a senior business operations leader.',
        '',
        'Create a Weekly Business Review using the data below.',
        'Output must be clear, concise, and executive-ready.',
        '',
        'Structure:',
        '1. Performance Scorecard (table with WoW movement)',
        '2. Executive Summary (4-6 bullets)',
        '3. Highly Debated Topics (2-3 items needing discussion)',
        '4. What Changed This Week (surprises and breaks from trend)',
        '5. Risk Register (impact, likelihood, owner, action)',
        '6. Root Cause Analysis (facts vs assumptions)',
        '7. Actions Taken (status and result)',
        '8. Blockers (what support is needed)',
        '9. Decisions Needed (with recommendation)',
        '10. Operational Updates (what changed since last week)',
        '11. Next Week Focus (owner + outcome + date)',
        '12. Owner Accountability Matrix',
        '13. Signals to Watch',
        '',
        'Rules: Plain English. No fluff. Highlight risks early.',
        'Separate facts from assumptions. Assign owners.',
        '',
        'Input data: [PASTE METRICS HERE]',
        'Context: [PASTE CONTEXT HERE]',
        'Known risks: [PASTE RISKS HERE]',
        'Blockers: [PASTE BLOCKERS HERE]',
        'Decisions needed: [PASTE DECISIONS HERE]',
    ]
    for line in prompt_lines:
        pdf.set_x(x + 8)
        pdf.cell(0, 3.8, line, new_x='LMARGIN', new_y='NEXT')

    pdf.set_y(y + 110)
    pdf.set_text_color(*DARK)

    pdf.ln(2)
    pdf.subsec('How to Use This Template')
    pdf.bullet('Collect your metrics and fill Section 1 first.')
    pdf.bullet('Write the Executive Summary last (after you understand the data).')
    pdf.bullet('Use the AI prompt to generate a first draft, then edit for accuracy.')
    pdf.bullet('Bring Highly Debated Topics to the live meeting for discussion.')
    pdf.bullet('End every WBR by confirming the Owner Accountability Matrix.')

    pdf.ft()

    # ===== PAGE 8: COMMON MISTAKES & BEST PRACTICES =====
    pdf.add_page()
    pdf.hbar()
    pdf.set_y(14)

    pdf.sec(15, 'Common Mistakes')
    pdf.p('Avoid these patterns that make WBRs ineffective:')
    pdf.ln(1)

    mistakes = [
        'Reporting numbers without explaining what changed or why.',
        'Hiding bad news under neutral language or averages.',
        'Listing actions without named owners or deadlines.',
        'Treating symptoms as root causes.',
        'Using the WBR as a status update instead of a decision forum.',
        'Including too many metrics — focus on the 5-8 that drive decisions.',
        'Failing to separate facts from assumptions.',
        'Presenting problems without a recommended path forward.',
        'Skipping the "Highly Debated" section and avoiding conflict.',
        'Not reviewing last week\'s commitments at the start.',
    ]
    for m in mistakes:
        pdf.bullet(m)

    pdf.ln(4)
    pdf.sec(16, 'Best Practices')
    pdf.p('What the best operators do differently:')
    pdf.ln(1)

    practices = [
        'Start with the scorecard. Let the numbers set the agenda.',
        'Write the Executive Summary last — after you understand the full picture.',
        'Keep the WBR under 30 minutes. Longer means unfocused.',
        'Use the "Debated Topics" section to force real conversation.',
        'Every metric must have an owner. Unowned metrics drift.',
        'Review last week\'s Owner Accountability Matrix first.',
        'Close every WBR with: "Who owns what by when?"',
        'Track time-to-decision, not just time-to-detect.',
        'Use the Signals section to build early warning muscle.',
        'Rotate the WBR presenter to build team-wide ownership.',
    ]
    for p_item in practices:
        pdf.bullet(p_item)

    pdf.ln(4)
    pdf.note('Final principle: ', 'A WBR is not a report. It is a decision-making ritual. Design it for action, not for comfort.')

    pdf.ft()

    # Output
    out = '/Users/hjaffal/hasanjaffal.com/hjaffal.github.io/ai-templates-section/pdf/ai-weekly-business-review-template.pdf'
    pdf.output(out)
    print(f'PDF generated: {out}')
    print(f'Pages: {pdf.page_no()}')


if __name__ == '__main__':
    build()
