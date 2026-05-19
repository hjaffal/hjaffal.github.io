#!/usr/bin/env python3
"""Generate the Sproochentest Articles & Prepositions Guide PDF."""

from fpdf import FPDF
from PIL import Image, ImageDraw, ImageFont

# Theme colors
DARK = (15, 23, 42)
DARK_SOFT = (30, 41, 59)
ACCENT = (147, 51, 234)
ACCENT_LIGHT = (167, 91, 244)
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
PDF_DIR = '/Users/hjaffal/hasanjaffal.com/hjaffal.github.io/assets/pdf/'


def create_cover():
    """Generate cover image for Articles & Prepositions guide."""
    W, H = 1240, 1754
    img = Image.new('RGB', (W, H), DARK)
    draw = ImageDraw.Draw(img)

    # Background glow - top right
    for i in range(300, 0, -1):
        alpha = int(15 * (i / 300))
        x, y = 950, 200
        draw.ellipse([x - i, y - i, x + i, y + i], fill=(
            DARK[0] + (ACCENT[0] - DARK[0]) * alpha // 255,
            DARK[1] + (ACCENT[1] - DARK[1]) * alpha // 255,
            DARK[2] + (ACCENT[2] - DARK[2]) * alpha // 255,
        ))

    # Background glow - bottom left
    for i in range(200, 0, -1):
        alpha = int(12 * (i / 200))
        x, y = 200, 1400
        draw.ellipse([x - i, y - i, x + i, y + i], fill=(
            DARK[0] + (14 - DARK[0]) * alpha // 255,
            DARK[1] + (165 - DARK[1]) * alpha // 255,
            DARK[2] + (233 - DARK[2]) * alpha // 255,
        ))

    # Top accent bar
    draw.rectangle([0, 0, W, 50], fill=ACCENT)

    font_dir = '/System/Library/Fonts/Supplemental/'
    try:
        font_label = ImageFont.truetype(font_dir + 'Arial Bold.ttf', 28)
        font_title = ImageFont.truetype(font_dir + 'Arial Bold.ttf', 92)
        font_subtitle = ImageFont.truetype(font_dir + 'Arial.ttf', 38)
        font_badge = ImageFont.truetype(font_dir + 'Arial Bold.ttf', 26)
        font_small = ImageFont.truetype(font_dir + 'Arial.ttf', 24)
        font_url = ImageFont.truetype(font_dir + 'Arial Bold.ttf', 28)
    except:
        font_label = font_title = font_subtitle = font_badge = font_small = font_url = ImageFont.load_default()

    left = 100
    y = 480

    draw.text((left, y), 'SPROOCHENTEST  \u00b7  SPEAKING GUIDE', fill=ACCENT_LIGHT, font=font_label)
    y += 80

    draw.text((left, y), 'Articles &', fill=WHITE, font=font_title)
    y += 108
    draw.text((left, y), 'Prepositions in', fill=WHITE, font=font_title)
    y += 108
    draw.text((left, y), 'Luxembourgish', fill=ACCENT_LIGHT, font=font_title)
    y += 160

    draw.text((left, y), 'an, am, op, um, un, mam, vum, bei, zu', fill=TEXT_MUTED, font=font_subtitle)
    y += 55
    draw.text((left, y), 'A step-by-step guide to choosing the right', fill=TEXT_MUTED, font=font_subtitle)
    y += 50
    draw.text((left, y), 'preposition for location, movement, and transport.', fill=TEXT_MUTED, font=font_subtitle)
    y += 100

    badge_text = 'Speaking  \u00b7  Image Description  \u00b7  Topic Conversation'
    bbox = draw.textbbox((0, 0), badge_text, font=font_badge)
    bw = bbox[2] - bbox[0] + 40
    bh = 50
    draw.rounded_rectangle([left, y, left + bw, y + bh], radius=8, fill=DARK_SOFT, outline=TEXT_SOFT)
    draw.text((left + 20, y + 12), badge_text, fill=WHITE, font=font_badge)
    y += 100

    draw.text((left, y), 'Start here: first decide location or movement.', fill=TEXT_SOFT, font=font_small)
    y += 35
    draw.text((left, y), 'Everything else becomes easier.', fill=TEXT_SOFT, font=font_small)
    y += 80

    draw.text((left, y), 'hasanjaffal.com/sproochentest', fill=ACCENT_LIGHT, font=font_url)

    # Bottom bar
    draw.rectangle([0, H - 12, W, H], fill=ACCENT)

    output = PDF_DIR + 'cover_articles.png'
    img.save(output, 'PNG', quality=95)
    return output


class ArticlesGuide(FPDF):
    def __init__(self):
        super().__init__()
        self.set_auto_page_break(auto=False)
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
        self.cell(85, 4, 'Sproochentest Articles & Prepositions Guide  |  hasanjaffal.com')
        if page_num:
            self.cell(85, 4, f'Page {page_num}', align='R')
        self.ln()

    def section_number(self, num):
        self.set_font('Arial', 'B', 7)
        self.set_text_color(*ACCENT)
        num_str = f'0{num}' if num < 10 else str(num)
        self.cell(0, 4, num_str, new_x='LMARGIN', new_y='NEXT')
        self.ln(1)

    def section_title(self, text):
        self.set_font('Arial', 'B', 13)
        self.set_text_color(*DARK)
        self.cell(0, 7, text, new_x='LMARGIN', new_y='NEXT')
        self.ln(2)

    def body_text(self, text):
        self.set_font('Arial', '', 9)
        self.set_text_color(*DARK_SOFT)
        self.multi_cell(0, 4.5, text)
        self.ln(2)

    def draw_table(self, headers, rows, col_widths):
        self.set_fill_color(*DARK)
        self.set_text_color(*WHITE)
        self.set_font('Arial', 'B', 7.5)
        for i, h in enumerate(headers):
            self.cell(col_widths[i], 7, h, new_x='RIGHT', new_y='TOP', fill=True)
        self.ln()

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
        self.multi_cell(140, 4, rest)
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

    def compare_row(self, wrong, right, reason=''):
        x, y = self.get_x(), self.get_y()
        cw = 70
        h = 7

        self.set_fill_color(*RED_BG)
        self.rect(x, y, cw, h, 'F')
        self.set_xy(x + 3, y + 1.5)
        self.set_font('Arial', 'B', 8)
        self.set_text_color(*RED_TEXT)
        self.cell(4, 4, 'X ')
        self.set_font('Arial', '', 8)
        self.set_text_color(*DARK)
        self.cell(cw - 10, 4, wrong)

        self.set_fill_color(*GREEN_BG)
        self.rect(x + cw + 3, y, cw, h, 'F')
        self.set_xy(x + cw + 6, y + 1.5)
        self.set_font('Arial', 'B', 8)
        self.set_text_color(*GREEN_TEXT)
        self.cell(4, 4, '> ')
        self.set_font('Arial', '', 8)
        self.set_text_color(*DARK)
        self.cell(cw - 10, 4, right)

        if reason:
            self.set_xy(x + 2 * cw + 8, y + 1.5)
            self.set_font('Arial', '', 7.5)
            self.set_text_color(*TEXT_MUTED)
            self.cell(30, 4, reason)

        self.set_y(y + h + 2)


def build_pdf():
    # Generate cover
    cover_path = create_cover()

    pdf = ArticlesGuide()
    pdf.set_left_margin(20)
    pdf.set_right_margin(20)

    # ===== PAGE 1: COVER =====
    pdf.add_page()
    pdf.image(cover_path, x=0, y=0, w=210, h=297)

    # ===== PAGE 2: Steps 1-3 =====
    pdf.add_page()
    pdf.header_bar()
    pdf.set_y(16)

    pdf.section_number(1)
    pdf.section_title('Location or Movement?')
    pdf.body_text('Ask one question before choosing the preposition. This is the foundation for everything else.')

    pdf.draw_table(
        ['MEANING', 'QUESTION', 'EXAMPLES'],
        [
            ['Location', 'Where is it?', 'Ech sinn am Kino. / D\'Taass steet um D\u00ebsch.'],
            ['Movement', 'Where are you going?', 'Ech ginn an de Kino. / Ech ginn op de Maart.'],
        ],
        [35, 45, 90]
    )

    pdf.tip_box(
        'Key Principle',
        'Location = am / um (contracted forms). Movement = an / op (with article). Master this distinction and most preposition choices become automatic.'
    )

    pdf.ln(1)
    pdf.section_number(2)
    pdf.section_title('AN and AM')
    pdf.body_text('an = in / into.  am = an dem = in the / at the. Use "an" for movement, "am" for location.')

    pdf.draw_table(
        ['USE', 'LUXEMBOURGISH', 'MEANING'],
        [
            ['Movement', 'Ech ginn an de Kino.', 'I go to the cinema.'],
            ['Location', 'Ech sinn am Kino.', 'I am at the cinema.'],
            ['Movement', "Ech ginn an d'Kichen.", 'I go into the kitchen.'],
            ['Location', 'Ech sinn an der Kichen.', 'I am in the kitchen.'],
        ],
        [30, 70, 70]
    )

    pdf.ln(1)
    pdf.section_number(3)
    pdf.section_title('OP and UM')
    pdf.body_text('"op" is often used for going to a place. um = op dem = at / on the.')

    pdf.draw_table(
        ['USE', 'LUXEMBOURGISH', 'MEANING'],
        [
            ['Movement', "Ech ginn op d'Aarbecht.", 'I go to work.'],
            ['Movement', 'Ech ginn op de Maart.', 'I go to the market.'],
            ['Location', 'Ech sinn um Maart.', 'I am at the market.'],
            ['Position', "D'Buch l\u00e4it um D\u00ebsch.", 'The book is on the table.'],
        ],
        [30, 70, 70]
    )

    pdf.ln(1)
    pdf.section_number(4)
    pdf.section_title('UN')
    pdf.body_text('"un" usually means at / on / attached to. Common with walls, doors, windows, and clothes.')

    pdf.draw_table(
        ['PATTERN', 'EXAMPLE'],
        [
            ['un der Mauer', "D'Bild h\u00e4nkt un der Mauer."],
            ['un der Dier', 'De Mann steet un der Dier.'],
            ['un hunn (to wear)', 'Si huet eng rout Box un. / Hien huet e bloen T-Shirt un.'],
        ],
        [50, 120]
    )

    pdf.tip_box(
        'Essential for Image Description',
        '"un hunn" = to wear. You will use this in almost every picture description: "Hien/Si huet ... un."',
        height=14
    )

    pdf.page_footer_content(1)

    # ===== PAGE 3: Steps 5-7 =====
    pdf.add_page()
    pdf.header_bar()
    pdf.set_y(16)

    pdf.section_number(5)
    pdf.section_title('Contractions')
    pdf.body_text('A preposition often joins with an article. Learn these as fixed chunks.')

    pdf.draw_table(
        ['FULL FORM', 'SHORT FORM', 'EXAMPLE'],
        [
            ['an dem', 'am', 'Ech sinn am Restaurant.'],
            ['op dem', 'um', "D'Taass steet um D\u00ebsch."],
            ['mat dem', 'mam', 'Ech fuere mam Auto.'],
            ['vun dem', 'vum', "Ech kommen vum B\u00fcro."],
            ['bei dem', 'beim', 'Ech sinn beim Dokter.'],
        ],
        [40, 35, 95]
    )

    pdf.ln(1)
    pdf.section_number(6)
    pdf.section_title('Countries: Why "an D\u00e4itschland" but "am Libanon"?')
    pdf.body_text('Some countries have no article. Some have one. That decides the form.')

    pdf.draw_table(
        ['COUNTRY TYPE', 'LOCATION', 'MOVEMENT'],
        [
            ['No article', 'Ech sinn an D\u00e4itschland.', 'Ech ginn an D\u00e4itschland.'],
            ['No article', 'Ech sinn an Italien.', 'Ech ginn an Italien.'],
            ['With article: de Libanon', 'Ech sinn am Libanon.', 'Ech ginn an de Libanon.'],
            ['With article: den Iran', 'Ech sinn am Iran.', 'Ech ginn an den Iran.'],
        ],
        [55, 57, 58]
    )

    pdf.rule_box(
        'Why? ',
        'am = an dem. If there is no article, there is no "dem". So: an D\u00e4itschland, not "am D\u00e4itschland".',
        height=12
    )

    pdf.ln(1)
    pdf.section_number(7)
    pdf.section_title('Cities and Villages Use ZU')

    pdf.draw_table(
        ['EXAMPLE', 'MEANING'],
        [
            ['Ech wunnen zu L\u00ebtzebuerg.', 'I live in Luxembourg.'],
            ['Ech schaffen zu Esch.', 'I work in Esch.'],
            ['Ech sinn zu Ettelbr\u00e9ck.', 'I am in Ettelbruck.'],
        ],
        [85, 85]
    )

    pdf.ln(1)
    pdf.section_number(8)
    pdf.section_title('Transport Uses MAM')
    pdf.body_text('mam = mat dem = with the. Use it for all transport.')

    pdf.draw_table(
        ['LUXEMBOURGISH', 'MEANING'],
        [
            ['Ech fuere mam Auto.', 'I go by car.'],
            ['Ech kommen mam Bus.', 'I come by bus.'],
            ['Ech fuere mam Zuch.', 'I travel by train.'],
            ["Ech ginn mam V\u00eblo op d'Aarbecht.", 'I go to work by bike.'],
        ],
        [85, 85]
    )

    pdf.page_footer_content(2)

    # ===== PAGE 4: Steps 9-10 =====
    pdf.add_page()
    pdf.header_bar()
    pdf.set_y(16)

    pdf.section_number(9)
    pdf.section_title('Picture Description Patterns')
    pdf.body_text('Use these sentence starters when describing images in the exam.')

    pdf.pattern_block('LOCATION PATTERNS FOR IMAGE DESCRIPTION', [
        'Um Bild gesinn ech eng Famill.',
        'Am Hannergrond gesinn ech e Gebai.',
        'An der M\u00ebtt gesinn ech eng Fra.',
        'Um D\u00ebsch steet eng Taass.',
        'Un der Mauer h\u00e4nkt e Bild.',
    ])

    pdf.draw_table(
        ['PATTERN', 'MEANING', 'USE FOR'],
        [
            ['Um Bild...', 'In the picture...', 'Opening sentence'],
            ['Am Hannergrond...', 'In the background...', 'Background details'],
            ['An der M\u00ebtt...', 'In the middle...', 'Central focus'],
            ['Um D\u00ebsch...', 'On the table...', 'Objects on surfaces'],
            ['Un der Mauer...', 'On the wall...', 'Things attached/hanging'],
        ],
        [45, 50, 75]
    )

    pdf.ln(2)
    pdf.section_number(10)
    pdf.section_title('Common Mistakes to Avoid')
    pdf.body_text('These are the errors candidates make most often. The key is location vs. movement.')

    pdf.compare_row('Ech sinn an de Kino.', 'Ech sinn am Kino.')
    pdf.compare_row('Ech ginn am Kino.', 'Ech ginn an de Kino.')
    pdf.compare_row('Ech sinn op de Maart.', 'Ech sinn um Maart.')
    pdf.compare_row('Ech fueren mat dem Auto.', 'Ech fuere mam Auto.')
    pdf.compare_row('Ech sinn am D\u00e4itschland.', 'Ech sinn an D\u00e4itschland.')

    pdf.ln(4)
    pdf.tip_box(
        'Final Rule',
        'Movement uses an / op. Location uses am / um. Transport uses mam. Cities use zu. Master these four rules and you cover 90% of preposition use in the exam.',
        height=18
    )

    pdf.ln(2)
    pdf.rule_box(
        'Quick Reference: ',
        'Movement = an/op  |  Location = am/um  |  Transport = mam  |  Cities = zu  |  Wearing = un hunn',
        height=10
    )

    pdf.page_footer_content(3)

    # Output
    output_path = PDF_DIR + 'Sproochentest Articles and Prepositions Guide.pdf'
    pdf.output(output_path)
    print(f'PDF generated: {output_path}')


if __name__ == '__main__':
    build_pdf()
