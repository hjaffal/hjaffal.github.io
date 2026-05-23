#!/usr/bin/env python3
"""Generate the AI Weekly Business Review Template PDF."""
from fpdf import FPDF

FONT_DIR = '/System/Library/Fonts/Supplemental/'
DARK = (15, 23, 42)
ACCENT = (147, 51, 234)
WHITE = (255, 255, 255)
SLATE_BG = (248, 250, 252)
SLATE_BORDER = (226, 232, 240)
TEXT_MUTED = (100, 116, 139)


class TemplatePDF(FPDF):
    def __init__(self):
        super().__init__()
        self.set_auto_page_break(auto=True, margin=20)
        self.add_font('Arial', '', FONT_DIR + 'Arial Unicode.ttf')
        self.add_font('Arial', 'B', FONT_DIR + 'Arial Bold.ttf')

    def header(self):
        if self.page_no() == 1:
            return
        self.set_font('Arial', '', 7)
        self.set_text_color(*TEXT_MUTED)
        self.cell(0, 6, 'AI Weekly Business Review Template  |  hasanjaffal.com', align='L')
        self.ln(10)

    def footer(self):
        self.set_y(-15)
        self.set_font('Arial', '', 7)
        self.set_text_color(*TEXT_MUTED)
        self.cell(0, 5, f'Page {self.page_no()}', align='C')

    def section(self, title):
        self.set_font('Arial', 'B', 12)
        self.set_text_color(*DARK)
        self.ln(4)
        self.cell(0, 7, title, new_x='LMARGIN', new_y='NEXT')
        self.ln(2)

    def subsection(self, title):
        self.set_font('Arial', 'B', 10)
        self.set_text_color(*DARK)
        self.ln(2)
        self.cell(0, 6, title, new_x='LMARGIN', new_y='NEXT')
        self.ln(1)

    def body(self, text):
        self.set_font('Arial', '', 9)
        self.set_text_color(30, 41, 59)
        self.multi_cell(0, 4.5, text)
        self.ln(2)

    def bullet(self, text):
        self.set_font('Arial', '', 9)
        self.set_text_color(30, 41, 59)
        self.set_x(25)
        self.cell(4, 4.5, chr(8226))
        self.multi_cell(0, 4.5, text)

    def table(self, headers, rows, widths):
        self.set_fill_color(*DARK)
        self.set_text_color(*WHITE)
        self.set_font('Arial', 'B', 7.5)
        for i, h in enumerate(headers):
            self.cell(widths[i], 6, h, new_x='RIGHT', new_y='TOP', fill=True)
        self.ln()
        self.set_font('Arial', '', 8)
        for idx, row in enumerate(rows):
            bg = SLATE_BG if idx % 2 == 0 else WHITE
            self.set_fill_color(*bg)
            self.set_text_color(*DARK)
            for i, c in enumerate(row):
                self.cell(widths[i], 5.5, c, new_x='RIGHT', new_y='TOP', fill=True)
            self.ln()
        self.ln(3)


def build():
    pdf = TemplatePDF()
    pdf.set_left_margin(20)
    pdf.set_right_margin(20)

    # Cover
    pdf.add_page()
    pdf.set_fill_color(*DARK)
    pdf.rect(0, 0, 210, 50, 'F')
    pdf.set_fill_color(*ACCENT)
    pdf.rect(0, 50, 210, 3, 'F')

    pdf.set_y(60)
    pdf.set_font('Arial', 'B', 7)
    pdf.set_text_color(*ACCENT)
    pdf.cell(0, 4, 'AI TEMPLATE', new_x='LMARGIN', new_y='NEXT')
    pdf.ln(4)
    pdf.set_font('Arial', 'B', 24)
    pdf.set_text_color(*DARK)
    pdf.cell(0, 10, 'AI Weekly Business Review', new_x='LMARGIN', new_y='NEXT')
    pdf.cell(0, 10, 'Template', new_x='LMARGIN', new_y='NEXT')
    pdf.ln(6)
    pdf.set_font('Arial', '', 10)
    pdf.set_text_color(*TEXT_MUTED)
    pdf.multi_cell(140, 5, 'A practical template for managers, analysts, and operations teams who need to turn metrics, risks, blockers, and decisions into a clear business update.')
    pdf.ln(8)
    pdf.set_font('Arial', 'B', 8)
    pdf.set_text_color(*ACCENT)
    pdf.cell(0, 4, 'hasanjaffal.com/ai-templates', new_x='LMARGIN', new_y='NEXT')

    # Content pages
    pdf.add_page()
    pdf.section('Template Structure')
    items = ['Executive Summary', 'Key Metrics', 'What Changed This Week',
             'Main Risks', 'Root Causes', 'Actions Taken', 'Blockers',
             'Decisions Needed', 'Next Week Focus', 'Owner Action Plan']
    for i, item in enumerate(items, 1):
        pdf.bullet(f'{i}. {item}')

    pdf.section('Who This Is For')
    pdf.body('Managers, analysts, operations leaders, program managers, and business owners who need to turn weekly performance data into a useful business review.')

    pdf.section('When To Use It')
    for item in ['Weekly Business Reviews', 'Leadership updates', 'Operational performance reviews', 'Risk reviews', 'Team status updates', 'Project health checks']:
        pdf.bullet(item)

    pdf.section('Inputs Needed')
    for item in ['Key metrics for the week', 'Week-over-week changes', 'Target vs actual performance', 'Main risks', 'Root causes', 'Open blockers', 'Decisions needed', 'Actions already taken', 'Owners and deadlines']:
        pdf.bullet(item)

    pdf.section('Key Metrics Table')
    pdf.table(
        ['Metric', 'Current', 'Previous', 'Target', 'Status', 'Comment'],
        [['Metric 1', '', '', '', '', ''], ['Metric 2', '', '', '', '', ''], ['Metric 3', '', '', '', '', '']],
        [35, 22, 22, 22, 22, 47]
    )

    pdf.section('Main Risks Table')
    pdf.table(
        ['Risk', 'Impact', 'Likelihood', 'Owner', 'Next Action'],
        [['Risk 1', 'H/M/L', 'H/M/L', '', ''], ['Risk 2', 'H/M/L', 'H/M/L', '', '']],
        [40, 28, 28, 35, 39]
    )

    pdf.section('Actions Taken')
    pdf.table(['Action', 'Owner', 'Status', 'Result'], [['', '', '', '']], [50, 35, 40, 45])

    pdf.section('Blockers')
    pdf.table(['Blocker', 'Impact', 'Support Needed', 'Owner'], [['', '', '', '']], [50, 35, 50, 35])

    pdf.section('Decisions Needed')
    pdf.table(['Decision', 'Why It Matters', 'Deadline', 'Recommended'], [['', '', '', '']], [45, 50, 35, 40])

    pdf.section('Owner Action Plan')
    pdf.table(['Owner', 'Action', 'Due Date', 'Success Measure'], [['', '', '', '']], [35, 55, 35, 45])

    # Common Mistakes & Tips
    pdf.add_page()
    pdf.section('Common Mistakes')
    mistakes = [
        'Reporting numbers without explaining what changed.',
        'Hiding bad news under neutral language.',
        'Listing actions without owners.',
        'Treating symptoms as root causes.',
        'Using the review as a status update instead of a decision tool.',
        'Adding too many metrics.',
        'Failing to separate facts from assumptions.',
    ]
    for m in mistakes:
        pdf.bullet(m)

    pdf.section('Better Usage Tips')
    tips = [
        'Start with the business problem, not the metric.',
        'Use fewer metrics and explain them better.',
        'Make risks visible early.',
        'State what decision is needed.',
        'Show what changed since last week.',
        'End with owner-based actions.',
        'Keep the review short enough for leaders to act on it.',
    ]
    for t in tips:
        pdf.bullet(t)

    pdf.section('Related Templates')
    related = [
        'AI Executive Summary Template',
        'AI Risk Assessment Template',
        'AI Root Cause Analysis Template',
        'AI Dashboard Review Template',
        'AI Project Status Update Template',
    ]
    for r in related:
        pdf.bullet(r)

    out = '/Users/hjaffal/hasanjaffal.com/hjaffal.github.io/ai-templates-section/pdf/ai-weekly-business-review-template.pdf'
    pdf.output(out)
    print(f'PDF generated: {out}')


if __name__ == '__main__':
    build()
