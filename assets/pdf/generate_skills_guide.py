#!/usr/bin/env python3
"""Generate the Future-Proof Skills Guide PDF."""

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
PURPLE_LIGHT = (247, 243, 254)


class SkillsPDF(FPDF):
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
        self.cell(85, 4, 'Future-Proof Skills Guide  |  hasanjaffal.com')
        self.cell(85, 4, f'Page {num}', align='R')

    def sec(self, title):
        self.ln(4)
        self.set_font('A', 'B', 13)
        self.set_text_color(*DARK)
        self.cell(0, 7, title, new_x='LMARGIN', new_y='NEXT')
        self.ln(3)

    def p(self, text):
        self.set_font('A', '', 9)
        self.set_text_color(*DARK_SOFT)
        self.multi_cell(0, 4.5, text)
        self.ln(2)

    def bullet(self, text):
        self.set_font('A', '', 9)
        self.set_text_color(*DARK_SOFT)
        self.set_x(24)
        self.cell(4, 4.5, chr(8226), new_x='RIGHT', new_y='TOP')
        self.multi_cell(146, 4.5, text)
        self.set_x(20)

    def numbered(self, num, bold, rest):
        self.set_font('A', 'B', 9)
        self.set_text_color(*ACCENT)
        self.set_x(24)
        self.cell(8, 4.5, f'{num}.', new_x='RIGHT', new_y='TOP')
        self.set_text_color(*DARK)
        self.cell(self.get_string_width(bold) + 1, 4.5, bold, new_x='RIGHT', new_y='TOP')
        self.set_font('A', '', 9)
        self.set_text_color(*DARK_SOFT)
        self.multi_cell(120, 4.5, ' ' + rest)
        self.set_x(20)

    def note(self, text, h=12):
        x, y = self.get_x(), self.get_y()
        self.set_fill_color(*PURPLE_LIGHT)
        self.set_draw_color(196, 167, 240)
        self.rect(x, y, 170, h, 'DF')
        self.set_xy(x + 5, y + 3.5)
        self.set_font('A', '', 8.5)
        self.set_text_color(*DARK_SOFT)
        self.multi_cell(160, 4, text)
        self.set_y(y + h + 3)


def build():
    pdf = SkillsPDF()
    pdf.set_left_margin(20)
    pdf.set_right_margin(20)

    # COVER
    pdf.add_page()
    pdf.hbar()
    pdf.set_y(50)
    pdf.set_font('A', 'B', 7)
    pdf.set_text_color(*ACCENT)
    pdf.cell(0, 4, 'FREE GUIDE  |  HASAN JAFFAL', new_x='LMARGIN', new_y='NEXT')
    pdf.ln(6)
    pdf.set_font('A', 'B', 26)
    pdf.set_text_color(*DARK)
    pdf.cell(0, 10, 'How to Future-Proof', new_x='LMARGIN', new_y='NEXT')
    pdf.cell(0, 10, 'Your Skills in the', new_x='LMARGIN', new_y='NEXT')
    pdf.set_text_color(*ACCENT)
    pdf.cell(0, 10, 'Age of AI', new_x='LMARGIN', new_y='NEXT')
    pdf.ln(8)
    pdf.set_font('A', '', 10)
    pdf.set_text_color(*TEXT_MUTED)
    pdf.multi_cell(145, 5, 'The skills that made you successful today will not be enough tomorrow. AI is not replacing people \u2014 it is replacing tasks, reshaping roles, and redefining what expertise means.')
    pdf.ln(6)
    pdf.multi_cell(145, 5, 'This guide covers what to focus on, what to let go of, and how to stay relevant when the ground keeps shifting.')
    pdf.ln(12)
    pdf.set_font('A', 'B', 8)
    pdf.set_text_color(*ACCENT)
    pdf.cell(0, 4, 'hasanjaffal.com', new_x='LMARGIN', new_y='NEXT')

    # PAGE 2
    pdf.add_page()
    pdf.hbar()
    pdf.set_y(14)

    pdf.sec('The shift is already happening')
    pdf.p('Five years ago, expertise meant having answers. Knowing more than the person next to you. Being the one in the room who could recall the right framework, cite the right data, or explain the right model.')
    pdf.p('That version of expertise is losing value \u2014 fast.')
    pdf.p('AI systems can now summarize research in seconds, generate code in minutes, draft strategies before the meeting starts, and detect patterns across datasets that would take a human team weeks to process.')
    pdf.p('This does not mean humans are irrelevant. It means the type of human contribution that matters is changing.')

    pdf.sec('What AI replaces vs. what it cannot')
    pdf.set_font('A', 'B', 9)
    pdf.set_text_color(*DARK)
    pdf.cell(0, 5, 'AI replaces:', new_x='LMARGIN', new_y='NEXT')
    pdf.ln(1)
    for item in ['Routine information retrieval', 'Pattern matching at scale', 'First-draft generation (text, code, analysis)', 'Repetitive decision-making with clear rules', 'Data summarization and reporting']:
        pdf.bullet(item)

    pdf.ln(3)
    pdf.set_font('A', 'B', 9)
    pdf.set_text_color(*DARK)
    pdf.cell(0, 5, 'AI cannot replace:', new_x='LMARGIN', new_y='NEXT')
    pdf.ln(1)
    for item in ['Judgment under ambiguity', 'Contextual interpretation (politics, culture, relationships)', 'Ownership and accountability for outcomes', 'Cross-domain synthesis (connecting unrelated fields)', 'Trust-building and stakeholder navigation', 'Asking the right question when the problem is unclear']:
        pdf.bullet(item)

    pdf.ft(1)

    # PAGE 3
    pdf.add_page()
    pdf.hbar()
    pdf.set_y(14)

    pdf.sec('The durable skills')
    pdf.p('If you want to stay relevant in the next decade, focus on skills that compound and cannot be automated:')
    pdf.ln(1)

    skills = [
        ('Problem framing', 'The ability to define what the real problem is before anyone starts solving it.'),
        ('Decision-making under uncertainty', 'Acting when data is incomplete, stakes are high, and time is short.'),
        ('Systems thinking', 'Understanding how parts connect, where second-order effects emerge, and why local fixes create global problems.'),
        ('Communication with consequence', 'Not just presenting information, but changing what people do with it.'),
        ('Learning velocity', 'The speed at which you can become competent in a new domain, not just familiar with it.'),
        ('Operational judgment', 'Knowing when to trust the model, when to override it, and when to ask a different question entirely.'),
    ]
    for i, (bold, rest) in enumerate(skills, 1):
        pdf.numbered(i, bold, rest)
        pdf.ln(1)

    pdf.ln(2)
    pdf.note('These skills compound over time. They do not expire when tools change. They become more valuable as AI handles the routine.', h=14)

    pdf.ft(2)

    # PAGE 4
    pdf.add_page()
    pdf.hbar()
    pdf.set_y(14)

    pdf.sec('What to do now')
    pdf.p('You do not need to become a machine learning engineer. You do not need to learn to code (though it helps). What you need is a deliberate strategy:')
    pdf.ln(1)

    actions = [
        ('Use AI tools daily.', 'Not to replace your thinking, but to accelerate it. Understand what they do well and where they fail.'),
        ('Build at the edges.', 'The most valuable people will sit between domains \u2014 between data and operations, between strategy and execution, between technology and human systems.'),
        ('Own outcomes, not tasks.', 'Tasks get automated. Outcomes require judgment, coordination, and accountability.'),
        ('Invest in writing and thinking.', 'Clear writing is clear thinking. AI can generate text, but it cannot generate insight that comes from lived experience and deep reflection.'),
        ('Stay close to real problems.', 'Theory ages fast. Proximity to operational reality \u2014 where things break, where incentives conflict, where decisions have consequences \u2014 is the best protection against irrelevance.'),
    ]
    for bold, rest in actions:
        self_x = pdf.get_x()
        pdf.set_x(24)
        pdf.set_font('A', 'B', 9)
        pdf.set_text_color(*DARK)
        pdf.cell(4, 4.5, chr(8226), new_x='RIGHT', new_y='TOP')
        pdf.cell(pdf.get_string_width(bold) + 1, 4.5, bold, new_x='RIGHT', new_y='TOP')
        pdf.set_font('A', '', 9)
        pdf.set_text_color(*DARK_SOFT)
        pdf.multi_cell(115, 4.5, ' ' + rest)
        pdf.set_x(20)
        pdf.ln(1)

    pdf.ln(4)
    pdf.sec('The bottom line')
    pdf.p('The future does not belong to the people who know the most. It belongs to the people who understand the deepest \u2014 who can interpret, decide, and act when the situation is uncertain and the stakes are real.')
    pdf.p('AI is a tool. A powerful one. But tools do not replace the people who know what to build, why it matters, and what to do when things go wrong.')
    pdf.p('That is the skill worth investing in.')

    pdf.ln(4)
    pdf.note('Take the Future-Proof Skills Assessment at hasanjaffal.com/tools/future-proof-skills-assessment/', h=10)

    pdf.ft(3)

    out = '/Users/hjaffal/hasanjaffal.com/hjaffal.github.io/assets/pdf/future-proof-skills-guide.pdf'
    pdf.output(out)
    print(f'PDF generated: {out}')
    print(f'Pages: {pdf.page_no()}')


if __name__ == '__main__':
    build()
