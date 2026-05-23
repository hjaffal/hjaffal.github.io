#!/usr/bin/env python3
"""Generate the AI Dashboard Review Template PDF."""

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


class DashPDF(FPDF):
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
        self.cell(85, 4, 'AI Dashboard Review Template  |  hasanjaffal.com')
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
    pdf = DashPDF()
    pdf.set_left_margin(20)
    pdf.set_right_margin(20)

    # ===== COVER =====
    pdf.add_page()
    pdf.hbar()
    pdf.set_y(50)
    pdf.set_font('A', 'B', 7)
    pdf.set_text_color(*ACCENT)
    pdf.cell(0, 4, 'AI TEMPLATE  |  REPORTING & ANALYTICS', new_x='LMARGIN', new_y='NEXT')
    pdf.ln(6)
    pdf.set_font('A', 'B', 28)
    pdf.set_text_color(*DARK)
    pdf.cell(0, 11, 'Dashboard Review', new_x='LMARGIN', new_y='NEXT')
    pdf.set_text_color(*ACCENT)
    pdf.cell(0, 11, 'Template', new_x='LMARGIN', new_y='NEXT')
    pdf.ln(8)
    pdf.set_font('A', '', 10)
    pdf.set_text_color(*TEXT_MUTED)
    pdf.multi_cell(145, 5, 'Turn dashboard data into executive-ready narrative. A structured framework for interpreting metrics, identifying anomalies, explaining context, and recommending actions — so dashboards drive decisions, not just decoration.')
    pdf.ln(12)

    x, y = pdf.get_x(), pdf.get_y()
    pdf.set_fill_color(*SLATE_BG)
    pdf.set_draw_color(*SLATE_BORDER)
    pdf.rect(x, y, 170, 44, 'DF')
    info = [
        ('Category:', 'Reporting & Analytics'),
        ('Audience:', 'Analysts, managers, data leads, operations teams'),
        ('Use When:', 'Weekly reviews, stakeholder updates, metric deep-dives'),
        ('Sections:', '11 structured sections with interpretation frameworks'),
        ('Principle:', 'A dashboard without narrative is noise. Add the story.'),
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

    # ===== PAGE 2: DASHBOARD HEALTH CHECK =====
    pdf.add_page()
    pdf.hbar()
    pdf.set_y(14)

    pdf.sec(1, 'Dashboard Health Check')
    pdf.p('Before interpreting data, verify the dashboard itself is trustworthy. Stale data, broken filters, or missing sources will poison your analysis.')

    pdf.tbl(
        ['CHECK', 'STATUS', 'NOTES'],
        [
            ['Data freshness (last updated)', 'OK / Stale / Unknown', ''],
            ['All data sources connected', 'OK / Missing / Partial', ''],
            ['Filters applied correctly', 'OK / Wrong / None', ''],
            ['Time range matches review period', 'OK / Mismatch', ''],
            ['Known data gaps or outages', 'None / Listed below', ''],
            ['Metric definitions unchanged', 'OK / Changed', ''],
        ],
        [55, 45, 70]
    )

    pdf.note('Rule: ', 'If any check fails, state it upfront in your review. Never present stale or incomplete data as if it were current truth.')

    pdf.ln(3)
    pdf.sec(2, 'Metric Inventory')
    pdf.p('List every metric on the dashboard. For each, define what it measures, who owns it, and what "good" looks like. Metrics without context are just numbers.')

    pdf.empty_tbl(
        ['METRIC', 'DEFINITION', 'OWNER', 'TARGET', 'CURRENT', 'STATUS'],
        [28, 40, 22, 22, 22, 36],
        n=7
    )

    pdf.tip('If you cannot define a metric in one sentence, it should not be on the dashboard. Remove or replace it.')

    pdf.ft(1)

    # ===== PAGE 3: ANOMALY DETECTION & NARRATIVE =====
    pdf.add_page()
    pdf.hbar()
    pdf.set_y(14)

    pdf.sec(3, 'Anomaly Detection')
    pdf.p('Scan for anything unexpected. An anomaly is any metric that moved significantly, broke a trend, crossed a threshold, or behaved differently from its peers.')

    pdf.empty_tbl(
        ['METRIC', 'EXPECTED RANGE', 'ACTUAL VALUE', 'DEVIATION', 'ANOMALY TYPE', 'SEVERITY'],
        [28, 28, 25, 22, 35, 32],
        n=5
    )

    pdf.subsec('Anomaly Types')
    pdf.bullet('Spike: Sudden increase beyond normal variance')
    pdf.bullet('Drop: Sudden decrease below expected floor')
    pdf.bullet('Trend break: Direction change after consistent pattern')
    pdf.bullet('Divergence: One metric moves while its pair stays flat')
    pdf.bullet('Flatline: No movement when movement is expected')

    pdf.ln(3)
    pdf.sec(4, 'Context Layer')
    pdf.p('Numbers without context mislead. For every significant movement, add the "why" layer. What happened in the business, market, or operations that explains this?')

    pdf.empty_tbl(
        ['METRIC MOVEMENT', 'BUSINESS CONTEXT', 'EXTERNAL FACTORS', 'ONE-TIME OR RECURRING'],
        [35, 50, 45, 40],
        n=5
    )

    pdf.note('Discipline: ', 'If you cannot explain a movement, say "cause unknown, investigating" rather than guessing. Speculation presented as fact erodes trust.')

    pdf.ft(2)

    # ===== PAGE 4: SO-WHAT & RECOMMENDATIONS =====
    pdf.add_page()
    pdf.hbar()
    pdf.set_y(14)

    pdf.sec(5, 'The "So What?" Framework')
    pdf.p('For each insight, answer three questions: What happened? Why does it matter? What should we do? If you cannot answer all three, the insight is incomplete.')

    pdf.empty_tbl(
        ['INSIGHT', 'WHAT HAPPENED', 'WHY IT MATTERS', 'RECOMMENDED ACTION', 'OWNER'],
        [25, 35, 35, 40, 35],
        n=5
    )

    pdf.ln(2)
    pdf.sec(6, 'Metric Relationships')
    pdf.p('Dashboards show metrics in isolation. Strong analysis connects them. When one metric moves, which others should move with it? Which ones did not?')

    pdf.empty_tbl(
        ['PRIMARY METRIC', 'EXPECTED CORRELATED METRIC', 'DID IT MOVE?', 'IMPLICATION IF NOT'],
        [38, 48, 30, 54],
        n=4
    )

    pdf.tip('Broken correlations are often more interesting than the metrics themselves. If revenue went up but orders stayed flat, something structural changed.')

    pdf.ln(3)
    pdf.sec(7, 'Narrative Summary')
    pdf.p('Write the story the dashboard is telling. This is what you present to leadership. Structure: situation, key changes, risks, and recommended focus.')

    pdf.empty_tbl(
        ['SECTION', 'YOUR NARRATIVE (2-3 SENTENCES MAX)'],
        [40, 130],
        n=1
    )
    pdf.tbl(
        ['SECTION', 'YOUR NARRATIVE'],
        [
            ['Overall situation', ''],
            ['Biggest positive signal', ''],
            ['Biggest concern', ''],
            ['What changed vs last period', ''],
            ['What needs attention now', ''],
            ['Recommended leadership focus', ''],
        ],
        [40, 130]
    )

    pdf.ft(3)

    # ===== PAGE 5: AUDIENCE & ACTIONS =====
    pdf.add_page()
    pdf.hbar()
    pdf.set_y(14)

    pdf.sec(8, 'Audience-Specific Views')
    pdf.p('Different stakeholders need different things from the same dashboard. Tailor your narrative to who is reading.')

    pdf.tbl(
        ['AUDIENCE', 'THEY CARE ABOUT', 'DEPTH NEEDED', 'FORMAT'],
        [
            ['C-Suite / Exec', 'Trend direction, risks, decisions', 'High-level only', '3-5 bullets'],
            ['Director / VP', 'Root causes, trade-offs, resource needs', 'Medium depth', 'Narrative + table'],
            ['Manager / Lead', 'Specific actions, timelines, owners', 'Detailed', 'Full breakdown'],
            ['Analyst / IC', 'Methodology, data quality, edge cases', 'Deep', 'Technical notes'],
        ],
        [32, 48, 35, 55]
    )

    pdf.ln(2)
    pdf.sec(9, 'Action Items from Dashboard')
    pdf.p('Every dashboard review should produce actions. If it does not, the review was a viewing, not a decision session.')

    pdf.empty_tbl(
        ['INSIGHT SOURCE', 'ACTION', 'PRIORITY', 'OWNER', 'DUE DATE', 'SUCCESS MEASURE'],
        [30, 38, 20, 22, 22, 38],
        n=6
    )

    pdf.note('Test: ', 'If your dashboard review produces zero actions for three consecutive weeks, either the dashboard is wrong or the review process is broken.')

    pdf.ln(3)
    pdf.sec(10, 'Dashboard Improvement Log')
    pdf.p('Track what is missing, misleading, or broken. Use this to continuously improve the dashboard itself.')

    pdf.empty_tbl(
        ['ISSUE', 'TYPE', 'IMPACT ON DECISIONS', 'FIX NEEDED', 'OWNER', 'STATUS'],
        [30, 22, 38, 35, 22, 23],
        n=4
    )

    pdf.subsec('Issue Types')
    pdf.bullet('Missing metric: Something important is not tracked')
    pdf.bullet('Misleading visual: Chart type or scale distorts reality')
    pdf.bullet('Stale data: Source is delayed or broken')
    pdf.bullet('Wrong granularity: Too aggregated or too detailed')
    pdf.bullet('No owner: Metric exists but nobody acts on it')

    pdf.ft(4)

    # ===== PAGE 6: AI PROMPT =====
    pdf.add_page()
    pdf.hbar()
    pdf.set_y(14)

    pdf.sec(11, 'AI Prompt - Copy and Paste')
    pdf.p('Use this prompt to generate a dashboard review narrative from your data.')

    x, y = pdf.get_x(), pdf.get_y()
    pdf.set_fill_color(*DARK)
    pdf.rect(x, y, 170, 115, 'F')
    pdf.set_xy(x + 8, y + 6)
    pdf.set_font('A', '', 7.5)
    pdf.set_text_color(226, 232, 240)

    lines = [
        'Act as a senior data analytics leader.',
        '',
        'Review the dashboard data below and produce an executive-ready',
        'narrative that turns numbers into decisions.',
        '',
        'Structure:',
        '1. Dashboard Health Check (data freshness, gaps, filters)',
        '2. Metric Inventory (current vs target, status)',
        '3. Anomaly Detection (spikes, drops, trend breaks, divergences)',
        '4. Context Layer (business reasons behind movements)',
        '5. "So What?" Analysis (what happened, why it matters, what to do)',
        '6. Metric Relationships (correlations that held or broke)',
        '7. Narrative Summary (situation, changes, risks, focus)',
        '8. Audience-Specific Takeaways (exec vs manager vs analyst)',
        '9. Action Items (specific, owned, time-bound)',
        '10. Dashboard Improvement Notes (what to fix for next time)',
        '',
        'Rules:',
        '- Lead with insight, not description.',
        '- Every metric needs context. Numbers alone are noise.',
        '- Flag anomalies explicitly. Do not bury them.',
        '- Separate facts from interpretation.',
        '- End with actions, not observations.',
        '- If data is missing or stale, say so upfront.',
        '',
        'Dashboard data: [PASTE METRICS/SCREENSHOTS HERE]',
        'Time period: [PASTE PERIOD]',
        'Business context: [PASTE CONTEXT]',
        'Known issues: [PASTE KNOWN ISSUES]',
    ]
    for line in lines:
        pdf.set_x(x + 8)
        pdf.cell(0, 3.8, line, new_x='LMARGIN', new_y='NEXT')

    pdf.set_y(y + 120)
    pdf.set_text_color(*DARK)

    pdf.subsec('How to Use This Template')
    pdf.bullet('Run the health check first. Do not analyze bad data.')
    pdf.bullet('Identify anomalies before writing narrative.')
    pdf.bullet('Always answer "so what?" for every insight.')
    pdf.bullet('Tailor depth to your audience.')
    pdf.bullet('End every review with owned action items.')

    pdf.ft(5)

    # ===== PAGE 7: MISTAKES & BEST PRACTICES =====
    pdf.add_page()
    pdf.hbar()
    pdf.set_y(14)

    pdf.sec('', 'Common Mistakes in Dashboard Reviews')
    pdf.ln(1)

    mistakes = [
        'Describing what the chart shows instead of what it means.',
        'Presenting all metrics equally when only 3-4 matter this week.',
        'Ignoring broken correlations between related metrics.',
        'Using the dashboard as a status update instead of a decision tool.',
        'Showing green/red without explaining what changed.',
        'Averaging away important spikes or local problems.',
        'Presenting stale data without flagging the delay.',
        'Adding more metrics instead of explaining fewer better.',
        'Skipping the "so what?" — insight without recommendation.',
        'Never improving the dashboard based on review feedback.',
    ]
    for m in mistakes:
        pdf.bullet(m)

    pdf.ln(4)
    pdf.subsec('Best Practices')
    pdf.ln(1)

    practices = [
        'Start with anomalies. What is different this period?',
        'Add context to every movement. Numbers need stories.',
        'Use the "So What?" framework for every insight you present.',
        'Show metric relationships, not just individual metrics.',
        'Write the narrative summary last, after full analysis.',
        'Tailor the message to your audience level.',
        'Produce at least one action item per review.',
        'Track dashboard improvement items like product backlog.',
        'Kill metrics nobody acts on. Less is more.',
        'Review the review: did last week\'s actions happen?',
    ]
    for p_item in practices:
        pdf.bullet(p_item)

    pdf.ln(4)
    pdf.note('Final principle: ', 'A dashboard is a lens, not a conclusion. Your job is to add the interpretation layer that turns data into decisions. Without you, it is just pixels.', h=14)

    pdf.ft(6)

    # Output
    out = '/Users/hjaffal/hasanjaffal.com/hjaffal.github.io/ai-templates-section/pdf/ai-dashboard-review-template.pdf'
    pdf.output(out)
    print(f'PDF generated: {out}')
    print(f'Pages: {pdf.page_no()}')


if __name__ == '__main__':
    build()
