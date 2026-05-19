#!/usr/bin/env python3
"""Generate the Sproochentest Adjective Guide PDF with website theme styling."""

from fpdf import FPDF

# Theme colors (from website)
DARK = (15, 23, 42)
DARK_SOFT = (30, 41, 59)
ACCENT = (147, 51, 234)
SLATE_BG = (248, 250, 252)
SLATE_BORDER = (226, 232, 240)
TEXT_MUTED = (100, 116, 139)
TEXT_SOFT = (148, 163, 184)
WHITE = (255, 255, 255)
GREEN_BG = (240, 253, 244)
GREEN_TEXT = (22, 163, 74)
RED_BG = (254, 242, 242)
RED_TEXT = (220, 38, 38)
PURPLE_LIGHT = (247, 243, 254)

FONT_DIR = '/System/Library/Fonts/Supplemental/'


class AdjGuide(FPDF):
    def __init__(self):
        super().__init__()
        self.set_auto_page_break(auto=False)
        # Register Unicode fonts
        self.add_font('Arial', '', FONT_DIR + 'Arial Unicode.ttf')
        self.add_font('Arial', 'B', FONT_DIR + 'Arial Bold.ttf')
        self.add_font('Arial', 'I', FONT_DIR + 'Arial Italic.ttf')
        self.add_font('Arial', 'BI', FONT_DIR + 'Arial Bold Italic.ttf')

    def header_bar(self):
        self.set_fill_color(*DARK)
        self.rect(0, 0, 210, 8, 'F')
        self.set_fill_color(60, 40, 100)
        self.rect(140, 0, 70, 8, 'F')

    def page_footer_content(self, page_num=None):
        y = 282
        self.set_draw_color(*SLATE_BORDER)
        self.line(20, y, 190, y)
        self.set_y(y + 2)
        self.set_font('Arial', '', 6)
        self.set_text_color(*TEXT_SOFT)
        self.set_x(20)
        self.cell(85, 4, 'Sproochentest Adjective Guide  |  hasanjaffal.com/sproochentest')
        if page_num:
            self.cell(85, 4, f'Page {page_num}', align='R')
        self.ln()

    def section_number(self, num):
        self.set_font('Arial', 'B', 7)
        self.set_text_color(*ACCENT)
        self.cell(0, 4, f'0{num}', new_x='LMARGIN', new_y='NEXT')
        self.ln(1)

    def section_title(self, text):
        self.set_font('Arial', 'B', 14)
        self.set_text_color(*DARK)
        self.cell(0, 7, text, new_x='LMARGIN', new_y='NEXT')
        self.ln(3)

    def body_text(self, text):
        self.set_font('Arial', '', 9)
        self.set_text_color(*DARK_SOFT)
        self.multi_cell(0, 4.5, text)
        self.ln(2)

    def draw_table(self, headers, rows, col_widths):
        # Header
        self.set_fill_color(*DARK)
        self.set_text_color(*WHITE)
        self.set_font('Arial', 'B', 7.5)
        for i, h in enumerate(headers):
            self.cell(col_widths[i], 7, h, new_x='RIGHT', new_y='TOP', fill=True)
        self.ln()

        # Rows
        self.set_font('Arial', '', 8.5)
        for idx, row in enumerate(rows):
            bg = SLATE_BG if idx % 2 == 1 else WHITE
            self.set_fill_color(*bg)
            self.set_text_color(*DARK)
            for i, cell in enumerate(row):
                self.cell(col_widths[i], 6.5, cell, new_x='RIGHT', new_y='TOP', fill=True)
            self.ln()
            self.set_draw_color(*SLATE_BORDER)
            self.line(20, self.get_y(), 190, self.get_y())
        self.ln(3)

    def rule_box(self, bold_part, rest, height=14):
        x, y = self.get_x(), self.get_y()
        self.set_fill_color(*SLATE_BG)
        self.rect(x, y, 170, height, 'F')
        self.set_fill_color(*ACCENT)
        self.rect(x, y, 2.5, height, 'F')
        self.set_xy(x + 6, y + 3)
        self.set_font('Arial', 'B', 8.5)
        self.set_text_color(*DARK)
        self.cell(self.get_string_width(bold_part) + 1, 4, bold_part, new_x='RIGHT', new_y='TOP')
        self.set_font('Arial', '', 8.5)
        self.multi_cell(145, 4, rest)
        self.set_y(y + height + 3)

    def tip_box(self, label, text, height=16):
        x, y = self.get_x(), self.get_y()
        self.set_fill_color(*PURPLE_LIGHT)
        self.set_draw_color(196, 167, 240)
        self.rect(x, y, 170, height, 'DF')
        self.set_xy(x + 5, y + 2.5)
        self.set_font('Arial', 'B', 6.5)
        self.set_text_color(*ACCENT)
        self.cell(0, 3.5, label.upper(), new_x='LMARGIN', new_y='NEXT')
        self.set_x(x + 5)
        self.set_font('Arial', '', 8)
        self.set_text_color(*DARK_SOFT)
        self.multi_cell(160, 3.8, text)
        self.set_y(y + height + 3)

    def pattern_block(self, label, lines):
        x, y = self.get_x(), self.get_y()
        h = 6 + len(lines) * 5.5
        self.set_fill_color(*SLATE_BG)
        self.set_draw_color(*SLATE_BORDER)
        self.rect(x, y, 170, h, 'DF')
        self.set_xy(x + 5, y + 2)
        self.set_font('Arial', 'B', 6.5)
        self.set_text_color(*TEXT_MUTED)
        self.cell(0, 3.5, label.upper(), new_x='LMARGIN', new_y='NEXT')
        self.set_font('Arial', '', 8.5)
        self.set_text_color(*DARK)
        for line in lines:
            self.set_x(x + 5)
            self.cell(0, 5.5, line, new_x='LMARGIN', new_y='NEXT')
        self.set_y(y + h + 3)

    def compare_row(self, wrong, right, reason):
        x, y = self.get_x(), self.get_y()
        cw = 55
        h = 7

        # Wrong
        self.set_fill_color(*RED_BG)
        self.rect(x, y, cw, h, 'F')
        self.set_xy(x + 3, y + 1.5)
        self.set_font('Arial', 'B', 8)
        self.set_text_color(*RED_TEXT)
        self.cell(4, 4, 'X ')
        self.set_font('Arial', '', 8)
        self.set_text_color(*DARK)
        self.cell(cw - 10, 4, wrong)

        # Right
        self.set_fill_color(*GREEN_BG)
        self.rect(x + cw + 3, y, cw, h, 'F')
        self.set_xy(x + cw + 6, y + 1.5)
        self.set_font('Arial', 'B', 8)
        self.set_text_color(*GREEN_TEXT)
        self.cell(4, 4, '> ')
        self.set_font('Arial', '', 8)
        self.set_text_color(*DARK)
        self.cell(cw - 10, 4, right)

        # Reason
        self.set_xy(x + 2 * cw + 8, y + 1.5)
        self.set_font('Arial', '', 7.5)
        self.set_text_color(*TEXT_MUTED)
        self.cell(60, 4, reason)

        self.set_y(y + h + 2)

    def practice_item(self, num, question, answer):
        x, y = self.get_x(), self.get_y()

        # Number circle
        self.set_fill_color(*DARK)
        self.ellipse(x, y, 6, 6, 'F')
        self.set_xy(x + 0.5, y + 1)
        self.set_font('Arial', 'B', 7)
        self.set_text_color(*WHITE)
        self.cell(5, 4, str(num), align='C')

        # Question
        self.set_xy(x + 9, y + 1)
        self.set_font('Arial', '', 9)
        self.set_text_color(*DARK_SOFT)
        self.cell(90, 4, question)

        # Answer
        self.set_font('Arial', 'B', 9)
        self.set_text_color(*ACCENT)
        self.cell(60, 4, answer)

        # Separator
        self.set_y(y + 8)
        self.set_draw_color(*SLATE_BG)
        self.line(x, self.get_y(), x + 170, self.get_y())
        self.ln(1)


def build_pdf():
    pdf = AdjGuide()
    pdf.set_left_margin(20)
    pdf.set_right_margin(20)

    # ===== PAGE 1: COVER =====
    pdf.add_page()
    # Full-page cover image
    pdf.image('/Users/hjaffal/hasanjaffal.com/hjaffal.github.io/assets/pdf/cover.png', x=0, y=0, w=210, h=297)

    # ===== PAGE 2: CORE RULES =====
    pdf.add_page()
    pdf.header_bar()
    pdf.set_y(16)

    pdf.section_number(1)
    pdf.section_title('Where Does the Adjective Go?')

    x = pdf.get_x()
    y = pdf.get_y()

    # Left column header
    pdf.set_xy(x, y)
    pdf.set_font('Arial', 'B', 9)
    pdf.set_text_color(*DARK)
    pdf.cell(80, 5, 'Before a noun --> it changes', new_x='LMARGIN', new_y='NEXT')
    # Left box
    pdf.set_fill_color(*SLATE_BG)
    pdf.rect(x, pdf.get_y(), 80, 20, 'F')
    pdf.set_xy(x + 4, pdf.get_y() + 3)
    pdf.set_font('Arial', '', 8.5)
    pdf.set_text_color(*DARK)
    pdf.cell(0, 4.5, 'e bloen T-Shirt', new_x='LMARGIN', new_y='NEXT')
    pdf.set_x(x + 4)
    pdf.cell(0, 4.5, 'eng schwaarz Jackett', new_x='LMARGIN', new_y='NEXT')
    pdf.set_x(x + 4)
    pdf.cell(0, 4.5, 'e klengt Kand', new_x='LMARGIN', new_y='NEXT')

    # Right column header
    pdf.set_xy(x + 90, y)
    pdf.set_font('Arial', 'B', 9)
    pdf.set_text_color(*DARK)
    pdf.cell(80, 5, 'After a verb --> stays basic', new_x='LMARGIN', new_y='NEXT')
    # Right box
    pdf.set_fill_color(*SLATE_BG)
    pdf.rect(x + 90, y + 5, 80, 20, 'F')
    pdf.set_xy(x + 94, y + 8)
    pdf.set_font('Arial', '', 8.5)
    pdf.set_text_color(*DARK)
    pdf.cell(0, 4.5, 'Den T-Shirt ass blo.', new_x='LMARGIN', new_y='NEXT')
    pdf.set_xy(x + 94, pdf.get_y())
    pdf.cell(0, 4.5, "D'Jackett ass schwaarz.", new_x='LMARGIN', new_y='NEXT')
    pdf.set_xy(x + 94, pdf.get_y())
    pdf.cell(0, 4.5, "D'Kand ass kleng.", new_x='LMARGIN', new_y='NEXT')

    pdf.set_y(y + 30)

    pdf.rule_box('Key rule: ', 'Only adjectives placed before a noun need an ending. After verbs like "ass" (is), the adjective stays in its base form.')

    pdf.section_number(2)
    pdf.section_title('The Core A2 Pattern')
    pdf.body_text('There are only three endings you need for the exam. Learn this table and you cover most situations.')

    pdf.draw_table(
        ['GENDER', 'ENDING', 'EXAMPLE', 'MEMORY AID'],
        [
            ['Masculine', '-en', 'e groussen Hond / e bloen T-Shirt', 'Add EN'],
            ['Feminine', 'no change', 'eng grouss Kaz / eng rout Box', 'Keep it simple'],
            ['Neuter', '-t', 'e grousst Haus / e bloot Hiem', 'Add T'],
        ],
        [30, 25, 75, 40]
    )

    pdf.tip_box(
        'Exam Shortcut',
        'If you panic: Masculine = EN, Feminine = no change, Neuter = T. This covers most A2 picture-description situations.'
    )

    pdf.section_number(3)
    pdf.section_title('High-Frequency Adjectives')

    pdf.draw_table(
        ['BASE FORM', 'MASCULINE (-EN)', 'FEMININE (--)', 'NEUTER (-T)'],
        [
            ['grouss', 'groussen', 'grouss', 'grousst'],
            ['kleng', 'klengen', 'kleng', 'klengt'],
            ['sch\u00e9in', 'sch\u00e9inen', 'sch\u00e9in', 'sch\u00e9int'],
            ['nei', 'neien', 'nei', 'neit'],
            ['blo', 'bloen', 'blo', 'bloot'],
            ['gr\u00e9ng', 'gr\u00e9ngen', 'gr\u00e9ng', 'gr\u00e9ngt'],
            ['rout', 'rouden', 'rout', 'rout'],
        ],
        [35, 45, 45, 45]
    )

    pdf.page_footer_content(1)

    # ===== PAGE 3: SPEAKING PATTERNS =====
    pdf.add_page()
    pdf.header_bar()
    pdf.set_y(16)

    pdf.section_number(4)
    pdf.section_title('Clothing Examples for the Exam')

    pdf.draw_table(
        ['MASCULINE (-EN)', 'FEMININE (NO CHANGE)', 'NEUTER (-T)'],
        [
            ['e bloen T-Shirt', 'eng schwaarz Jackett', 'e bloot Hiem'],
            ['e gr\u00e9ngen Pullover', 'eng rout Box', 'e klengt Kand'],
            ['e sch\u00e9inen Mantel', 'eng w\u00e4iss Bluse', 'e rout Buch'],
        ],
        [57, 57, 56]
    )

    pdf.ln(2)
    pdf.section_number(5)
    pdf.section_title('Ready-to-Use Sentences for Image Description')
    pdf.body_text('Use these patterns directly in the exam. Replace the noun and adjective as needed.')

    pdf.pattern_block('DESCRIBING WHAT SOMEONE IS WEARING', [
        'Hien huet e bloen T-Shirt un.',
        'Si huet eng schwaarz Jackett un.',
        "D'Kand huet e rout Hiem un.",
    ])

    pdf.pattern_block('DESCRIBING WHAT YOU SEE', [
        'Ech gesinn e groussen Hond.',
        'Ech gesinn eng kleng Kichen.',
        'Ech gesinn e sch\u00e9int Bild.',
    ])

    pdf.pattern_block('DESCRIBING OBJECTS IN A LOCATION', [
        'Um D\u00ebsch l\u00e4it e klengt Buch.',
        'Um D\u00ebsch steet eng w\u00e4iss Taass.',
        'Am Z\u00ebmmer steet e groussen D\u00ebsch.',
    ])

    pdf.ln(2)
    pdf.section_number(6)
    pdf.section_title('Common Mistakes to Avoid')
    pdf.body_text('These are the errors candidates make most often. Learn the correct form.')

    pdf.compare_row('eng bloen Jackett', 'eng blo Jackett', 'Feminine = no change')
    pdf.compare_row('eng klengen Box', 'eng kleng Box', 'Feminine = no change')
    pdf.compare_row('e grouss Hond', 'e groussen Hond', 'Masculine = add EN')
    pdf.compare_row('e blo Hiem', 'e bloot Hiem', 'Neuter = add T')

    pdf.page_footer_content(2)

    # ===== PAGE 4: PRACTICE =====
    pdf.add_page()
    pdf.header_bar()
    pdf.set_y(16)

    pdf.section_number(7)
    pdf.section_title('Quick Practice')
    pdf.body_text('Fill in the correct adjective form. Answers are on the right.')
    pdf.ln(2)

    exercises = [
        ('e ____ Hond (grouss)', 'e groussen Hond'),
        ('eng ____ Box (rout)', 'eng rout Box'),
        ('e ____ Kand (kleng)', 'e klengt Kand'),
        ('e ____ T-Shirt (gr\u00e9ng)', 'e gr\u00e9ngen T-Shirt'),
        ('eng ____ Bluse (w\u00e4iss)', 'eng w\u00e4iss Bluse'),
        ('e ____ Haus (nei)', 'e neit Haus'),
        ('e ____ Mantel (sch\u00e9in)', 'e sch\u00e9inen Mantel'),
        ('eng ____ Kaz (kleng)', 'eng kleng Kaz'),
    ]

    for i, (q, a) in enumerate(exercises, 1):
        pdf.practice_item(i, q, a)

    pdf.ln(8)
    pdf.tip_box(
        'Final Exam Advice',
        'The examiner does not need perfect grammar. Your goal is clear, continuous speech. Use these chunks automatically so you can focus on describing the picture. Speak confidently and keep going.',
        height=18
    )

    pdf.ln(2)
    pdf.rule_box(
        'Quick Reference: ',
        'Masculine = -en  |  Feminine = no change  |  Neuter = -t. When in doubt, use the masculine -en ending. It sounds natural and covers the most common nouns.',
        height=12
    )

    pdf.page_footer_content(3)

    # Output
    output_path = '/Users/hjaffal/hasanjaffal.com/hjaffal.github.io/assets/pdf/Sproochentest Adjective Guide.pdf'
    pdf.output(output_path)
    print(f'PDF generated successfully: {output_path}')


if __name__ == '__main__':
    build_pdf()
