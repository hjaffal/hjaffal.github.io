#!/usr/bin/env python3
"""Generate the Sproochentest Picture Description Master Sheet PDF."""

from fpdf import FPDF
from PIL import Image, ImageDraw, ImageFont

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
    W, H = 1240, 1754
    img = Image.new('RGB', (W, H), DARK)
    draw = ImageDraw.Draw(img)

    for i in range(300, 0, -1):
        alpha = int(15 * (i / 300))
        x, y = 950, 200
        draw.ellipse([x-i, y-i, x+i, y+i], fill=(
            DARK[0]+(ACCENT[0]-DARK[0])*alpha//255,
            DARK[1]+(ACCENT[1]-DARK[1])*alpha//255,
            DARK[2]+(ACCENT[2]-DARK[2])*alpha//255))

    for i in range(200, 0, -1):
        alpha = int(12 * (i / 200))
        x, y = 200, 1400
        draw.ellipse([x-i, y-i, x+i, y+i], fill=(
            DARK[0]+(14-DARK[0])*alpha//255,
            DARK[1]+(165-DARK[1])*alpha//255,
            DARK[2]+(233-DARK[2])*alpha//255))

    draw.rectangle([0, 0, W, 50], fill=ACCENT)

    fd = '/System/Library/Fonts/Supplemental/'
    try:
        fl = ImageFont.truetype(fd+'Arial Bold.ttf', 28)
        ft = ImageFont.truetype(fd+'Arial Bold.ttf', 88)
        fs = ImageFont.truetype(fd+'Arial.ttf', 36)
        fb = ImageFont.truetype(fd+'Arial Bold.ttf', 26)
        fsm = ImageFont.truetype(fd+'Arial.ttf', 24)
        fu = ImageFont.truetype(fd+'Arial Bold.ttf', 28)
    except:
        fl=ft=fs=fb=fsm=fu=ImageFont.load_default()

    left, y = 100, 480
    draw.text((left, y), 'SPROOCHENTEST  \u00b7  SPEAKING GUIDE', fill=ACCENT_LIGHT, font=fl)
    y += 80
    draw.text((left, y), 'Picture Description', fill=WHITE, font=ft)
    y += 105
    draw.text((left, y), 'Master Sheet', fill=ACCENT_LIGHT, font=ft)
    y += 150
    draw.text((left, y), 'A complete cheat sheet for describing any image', fill=TEXT_MUTED, font=fs)
    y += 50
    draw.text((left, y), 'in the Sproochentest oral exam. Structure, vocabulary,', fill=TEXT_MUTED, font=fs)
    y += 50
    draw.text((left, y), 'ready-made sentences, and emergency fillers.', fill=TEXT_MUTED, font=fs)
    y += 100
    badge = 'Speaking  \u00b7  Image Description  \u00b7  Vocabulary'
    bbox = draw.textbbox((0, 0), badge, font=fb)
    bw = bbox[2]-bbox[0]+40
    draw.rounded_rectangle([left, y, left+bw, y+50], radius=8, fill=DARK_SOFT, outline=TEXT_SOFT)
    draw.text((left+20, y+12), badge, fill=WHITE, font=fb)
    y += 100
    draw.text((left, y), 'Keep speaking. Describe what you see. Stay organized.', fill=TEXT_SOFT, font=fsm)
    y += 80
    draw.text((left, y), 'hasanjaffal.com/sproochentest', fill=ACCENT_LIGHT, font=fu)
    draw.rectangle([0, H-12, W, H], fill=ACCENT)

    out = PDF_DIR + 'cover_picture.png'
    img.save(out, 'PNG', quality=95)
    return out


class PictureGuide(FPDF):
    def __init__(self):
        super().__init__()
        self.set_auto_page_break(auto=False)
        self.add_font('Arial', '', FONT_DIR+'Arial Unicode.ttf')
        self.add_font('Arial', 'B', FONT_DIR+'Arial Bold.ttf')
        self.add_font('Arial', 'I', FONT_DIR+'Arial Italic.ttf')

    def header_bar(self):
        self.set_fill_color(*DARK)
        self.rect(0, 0, 210, 8, 'F')
        self.set_fill_color(60, 40, 100)
        self.rect(140, 0, 70, 8, 'F')

    def footer_line(self, num):
        self.set_draw_color(*SLATE_BORDER)
        self.line(20, 282, 190, 282)
        self.set_y(284)
        self.set_font('Arial', '', 6)
        self.set_text_color(*TEXT_SOFT)
        self.set_x(20)
        self.cell(85, 4, 'Picture Description Master Sheet  |  hasanjaffal.com')
        self.cell(85, 4, f'Page {num}', align='R')

    def sec_num(self, n):
        self.set_font('Arial', 'B', 7)
        self.set_text_color(*ACCENT)
        self.cell(0, 4, f'{n:02d}', new_x='LMARGIN', new_y='NEXT')
        self.ln(1)

    def sec_title(self, t):
        self.set_font('Arial', 'B', 12)
        self.set_text_color(*DARK)
        self.cell(0, 6, t, new_x='LMARGIN', new_y='NEXT')
        self.ln(2)

    def txt(self, t):
        self.set_font('Arial', '', 8.5)
        self.set_text_color(*DARK_SOFT)
        self.multi_cell(0, 4.2, t)
        self.ln(1.5)

    def table(self, headers, rows, widths):
        self.set_fill_color(*DARK)
        self.set_text_color(*WHITE)
        self.set_font('Arial', 'B', 7)
        for i, h in enumerate(headers):
            self.cell(widths[i], 6, h, new_x='RIGHT', new_y='TOP', fill=True)
        self.ln()
        self.set_font('Arial', '', 8)
        for idx, row in enumerate(rows):
            bg = SLATE_BG if idx % 2 == 1 else WHITE
            self.set_fill_color(*bg)
            self.set_text_color(*DARK)
            for i, c in enumerate(row):
                self.cell(widths[i], 5.5, c, new_x='RIGHT', new_y='TOP', fill=True)
            self.ln()
        self.ln(2)

    def tip(self, label, text, h=14):
        x, y = self.get_x(), self.get_y()
        self.set_fill_color(*PURPLE_LIGHT)
        self.set_draw_color(196, 167, 240)
        self.rect(x, y, 170, h, 'DF')
        self.set_xy(x+5, y+2)
        self.set_font('Arial', 'B', 6.5)
        self.set_text_color(*ACCENT)
        self.cell(0, 3.5, label.upper(), new_x='LMARGIN', new_y='NEXT')
        self.set_x(x+5)
        self.set_font('Arial', '', 7.5)
        self.set_text_color(*DARK_SOFT)
        self.multi_cell(160, 3.5, text)
        self.set_y(y+h+2)

    def rule(self, bold, rest, h=12):
        x, y = self.get_x(), self.get_y()
        self.set_fill_color(*SLATE_BG)
        self.rect(x, y, 170, h, 'F')
        self.set_fill_color(*ACCENT)
        self.rect(x, y, 2.5, h, 'F')
        self.set_xy(x+6, y+3)
        self.set_font('Arial', 'B', 8)
        self.set_text_color(*DARK)
        self.cell(self.get_string_width(bold)+1, 4, bold, new_x='RIGHT', new_y='TOP')
        self.set_font('Arial', '', 8)
        self.multi_cell(130, 4, rest)
        self.set_y(y+h+2)

    def block(self, label, lines):
        x, y = self.get_x(), self.get_y()
        h = 5 + len(lines)*5
        self.set_fill_color(*SLATE_BG)
        self.set_draw_color(*SLATE_BORDER)
        self.rect(x, y, 170, h, 'DF')
        self.set_xy(x+5, y+2)
        self.set_font('Arial', 'B', 6)
        self.set_text_color(*TEXT_MUTED)
        self.cell(0, 3, label.upper(), new_x='LMARGIN', new_y='NEXT')
        self.set_font('Arial', '', 8)
        self.set_text_color(*DARK)
        for l in lines:
            self.set_x(x+5)
            self.cell(0, 5, l, new_x='LMARGIN', new_y='NEXT')
        self.set_y(y+h+2)

    def compare(self, wrong, right):
        x, y = self.get_x(), self.get_y()
        self.set_fill_color(*RED_BG)
        self.rect(x, y, 82, 6.5, 'F')
        self.set_xy(x+3, y+1.2)
        self.set_font('Arial', 'B', 7.5)
        self.set_text_color(*RED_TEXT)
        self.cell(3, 4, 'X ')
        self.set_font('Arial', '', 7.5)
        self.set_text_color(*DARK)
        self.cell(75, 4, wrong)

        self.set_fill_color(*GREEN_BG)
        self.rect(x+85, y, 85, 6.5, 'F')
        self.set_xy(x+88, y+1.2)
        self.set_font('Arial', 'B', 7.5)
        self.set_text_color(*GREEN_TEXT)
        self.cell(3, 4, '> ')
        self.set_font('Arial', '', 7.5)
        self.set_text_color(*DARK)
        self.cell(78, 4, right)
        self.set_y(y+8)


def build_pdf():
    cover = create_cover()
    pdf = PictureGuide()
    pdf.set_left_margin(20)
    pdf.set_right_margin(20)

    # PAGE 1: COVER
    pdf.add_page()
    pdf.image(cover, x=0, y=0, w=210, h=297)

    # PAGE 2: Structure & Openings
    pdf.add_page()
    pdf.header_bar()
    pdf.set_y(14)

    pdf.sec_num(1)
    pdf.sec_title('The Goal of the Exercise')
    pdf.txt('The examiner does NOT expect perfect grammar. The goal is simple: keep speaking, describe what you see, organize your ideas, and use simple vocabulary correctly. A simple fluent description is much better than complicated broken grammar.')

    pdf.sec_num(2)
    pdf.sec_title('The Perfect Structure')
    pdf.txt('Always follow the same order. This makes you sound organized.')
    pdf.table(
        ['STEP', 'WHAT TO DO', 'EXAMPLE FOCUS'],
        [
            ['1. General Situation', 'Where? Inside/outside? Weather?', 'Set the scene'],
            ['2. Foreground', 'Describe the closest things', 'Am Vierdergrond...'],
            ['3. Middle', 'Describe the center', 'An der M\u00ebtt...'],
            ['4. Background', 'Describe distant things', 'Am Hannergrond...'],
            ['5. Opinion', 'Say what you think is happening', 'Ech mengen datt...'],
        ],
        [40, 65, 65]
    )

    pdf.sec_num(3)
    pdf.sec_title('Start Every Description the Same Way')
    pdf.block('BEST OPENINGS', [
        'Op der Foto gesinn ech ...',
        'Um Bild gesinn ech ...',
        'D\u00ebst Bild weist ...',
    ])
    pdf.ln(1)
    pdf.block('EXAMPLES', [
        'Op der Foto gesinn ech eng Famill.',
        'Um Bild gesinn ech eng Stad.',
        'D\u00ebst Bild weist eng Kichen.',
    ])

    pdf.ln(1)
    pdf.sec_num(4)
    pdf.sec_title('General Situation: Inside / Outside')
    pdf.block('LOCATION SENTENCES', [
        'Si sinn dobannen. / Si sinn dobaussen.',
        "D'Leit sinn doheem.",
        "D'Leit sinn an enger Stuff.",
        "D'Leit sinn an engem Restaurant.",
    ])

    pdf.footer_line(1)

    # PAGE 3: Weather, Seasons, Activities
    pdf.add_page()
    pdf.header_bar()
    pdf.set_y(14)

    pdf.sec_num(5)
    pdf.sec_title('Weather Vocabulary')
    pdf.txt('The weather is one of the easiest ways to speak longer.')
    pdf.table(
        ['LUXEMBOURGISH', 'ENGLISH'],
        [
            ["D'Wieder ass sch\u00e9in.", 'The weather is nice.'],
            ['Et ass sonneg.', 'It is sunny.'],
            ['Et ass waarm. / Et ass kal.', 'It is warm. / It is cold.'],
            ['Et reent. / Et schneit.', 'It is raining. / It is snowing.'],
            ['Et ass wollekeg.', 'It is cloudy.'],
            ["D'Sonn sch\u00e9ngt.", 'The sun is shining.'],
            ['Den Himmel ass blo. / Den Himmel ass gro.', 'The sky is blue. / grey.'],
        ],
        [85, 85]
    )

    pdf.sec_num(6)
    pdf.sec_title('Seasons')

    pdf.block('SUMMER', [
        'Ech mengen datt et Summer ass.',
        "D'Leit droen T-Shirten a Shorts.",
        'Et ass waarm a sonneg.',
    ])
    pdf.block('WINTER', [
        'Ech mengen datt et Wanter ass.',
        "D'Leit droen d\u00e9ck Jacketten.",
        'Et schneit. Et ass kal.',
    ])
    pdf.block('AUTUMN', [
        'Ech mengen datt et Hierscht ass.',
        "D'Beem hu giel Blieder.",
        "D'Wieder ass gro.",
    ])
    pdf.block('SPRING', [
        'Ech mengen datt et Fr\u00e9ijoer ass.',
        "Et g\u00ebtt vill Blummen.",
        "D'Wieder ges\u00e4it flott aus.",
    ])

    pdf.ln(1)
    pdf.sec_num(7)
    pdf.sec_title('Activities')
    pdf.table(
        ['LUXEMBOURGISH', 'ENGLISH'],
        [
            ['Si iessen. / Si dr\u00e9nken.', 'They eat. / They drink.'],
            ['Si schw\u00e4tzen. / Si schaffen.', 'They talk. / They work.'],
            ['Si maachen Sport.', 'They do sports.'],
            ['Si entspanen sech.', 'They relax.'],
            ["D'Kanner spillen.", 'The children play.'],
            ['Hien liest. / Si schreift.', 'He reads. / She writes.'],
        ],
        [85, 85]
    )

    pdf.footer_line(2)

    # PAGE 4: Position, Patterns, Clothing, Colors
    pdf.add_page()
    pdf.header_bar()
    pdf.set_y(14)

    pdf.sec_num(8)
    pdf.sec_title('Position Vocabulary')
    pdf.table(
        ['LUXEMBOURGISH', 'ENGLISH', 'USE'],
        [
            ['Am Vierdergrond', 'In the foreground', 'Closest things'],
            ['An der M\u00ebtt', 'In the middle', 'Center of image'],
            ['Am Hannergrond', 'In the background', 'Distant things'],
            ['l\u00e9nks / riets', 'left / right', 'Sides'],
            ['uewen / \u00ebnnen', 'top / bottom', 'Vertical'],
            ['nieft / hannert / virun', 'next to / behind / in front of', 'Relative'],
        ],
        [50, 55, 65]
    )

    pdf.sec_num(9)
    pdf.sec_title('Most Useful Sentence Patterns')
    pdf.block('PEOPLE', [
        'Ech gesinn ee Mann. / Ech gesinn eng Fra.',
        'Ech gesinn e Kand. / Et gi vill Leit.',
    ])
    pdf.block('ACTIONS', [
        'Hien s\u00ebtzt. / Si steet. / Hatt leeft.',
        'Si schw\u00e4tzen. / Hien dr\u00e9nkt. / Si schaffen.',
    ])
    pdf.block('OBJECTS', [
        'Um D\u00ebsch steet eng Taass.',
        'Um Buedem l\u00e4it e Buch.',
        'Um Sofa leien K\u00ebssen.',
    ])

    pdf.ln(1)
    pdf.sec_num(10)
    pdf.sec_title('Clothing & Colors')
    pdf.table(
        ['LUXEMBOURGISH', 'ENGLISH', 'COLOR', 'ENGLISH'],
        [
            ['den T-Shirt', 't-shirt', 'blo', 'blue'],
            ['de Pullover', 'sweater', 'rout', 'red'],
            ["d'Jackett", 'jacket', 'gr\u00e9ng', 'green'],
            ["d'Box", 'pants', 'schwaarz', 'black'],
            ["d'Schong", 'shoes', 'w\u00e4iss', 'white'],
            ['de Sonnebr\u00ebll', 'sunglasses', 'gro', 'grey'],
            ["d'Kap", 'cap', 'brong / giel', 'brown / yellow'],
        ],
        [38, 38, 38, 56]
    )

    pdf.ln(1)
    pdf.sec_num(11)
    pdf.sec_title('Ready-Made Clothing Sentences')
    pdf.block('CLOTHING DESCRIPTIONS', [
        'Hien huet e bloen T-Shirt un.',
        'Si huet eng schwaarz Jackett un.',
        'Hatt huet eng rout Box un.',
        'Hien huet Sportschong un.',
        "D'Fra huet e w\u00e4isst Hiem un.",
    ])

    pdf.footer_line(3)

    # PAGE 5: Ready descriptions, opinions, fillers, mistakes
    pdf.add_page()
    pdf.header_bar()
    pdf.set_y(14)

    pdf.sec_num(12)
    pdf.sec_title('Ready-to-Use Full Descriptions')

    pdf.block('FAMILY PICTURE', [
        'Op der Foto gesinn ech eng Famill.',
        'Si sinn dobaussen. D\'Wieder ass sch\u00e9in.',
        'D\'Eltere schw\u00e4tzen. D\'Kanner spillen.',
        'Ech mengen datt si an der Vakanz sinn.',
    ])
    pdf.block('OFFICE PICTURE', [
        'Op der Foto gesinn ech eng Fra.',
        'Si schafft op hirem Computer. Si s\u00ebtzt um B\u00fcro.',
        'Um D\u00ebsch stinn e Laptop an eng Taass Kaffi.',
        'Ech mengen datt si midd ass.',
    ])
    pdf.block('RESTAURANT PICTURE', [
        'Op der Foto gesinn ech vill Leit.',
        'Si s\u00ebtze beim D\u00ebsch. Si iessen an dr\u00e9nken.',
        'D\'Atmosph\u00e4r ges\u00e4it flott aus.',
        'Ech mengen datt si Spaass hunn.',
    ])
    pdf.block('WINTER PICTURE', [
        'Op der Foto gesinn ech eng Strooss.',
        'Et schneit. D\'Leit droen d\u00e9ck Jacketten.',
        'Et ass kal. Den Himmel ass gro.',
    ])

    pdf.ln(1)
    pdf.sec_num(13)
    pdf.sec_title('Opinion Sentences')
    pdf.block('USE THESE TO CONTINUE SPEAKING', [
        'Ech mengen datt si an der Vakanz sinn.',
        'Ech mengen datt si gl\u00e9cklech sinn.',
        'Ech mengen datt et Summer ass.',
        'Ech mengen datt si Spaass hunn.',
        'Ech fannen d\'Bild sch\u00e9in.',
        'D\'Atmosph\u00e4r ges\u00e4it roueg aus.',
    ])

    pdf.ln(1)
    pdf.sec_num(14)
    pdf.sec_title('Emergency Fillers')
    pdf.txt('Use these when you forget vocabulary. They stop silence.')
    pdf.block('FILLERS THAT SAVE YOU', [
        'Ech weess net genee wat dat ass.',
        'Ech mengen datt ...',
        'Vl\u00e4icht ...',
        'Et ges\u00e4it aus w\u00e9i ...',
        'Ech sinn net s\u00e9cher mee ...',
    ])

    pdf.footer_line(4)

    # PAGE 6: Mistakes & Final Strategy
    pdf.add_page()
    pdf.header_bar()
    pdf.set_y(14)

    pdf.sec_num(15)
    pdf.sec_title('Common Mistakes')
    pdf.txt('Avoid these errors that candidates make frequently.')
    pdf.ln(1)

    pdf.compare('Op der Foto ech gesinn ...', 'Op der Foto gesinn ech ...')
    pdf.compare('Hien huet un e bloen T-Shirt.', 'Hien huet e bloen T-Shirt un.')
    pdf.compare('Si ass um Kichen.', 'Si ass an der Kichen.')
    pdf.compare('Et ass Sonne.', 'Et ass sonneg.')

    pdf.ln(4)
    pdf.sec_num(16)
    pdf.sec_title('Final Strategy')
    pdf.txt('Never panic if you do not know a word. You can survive the entire exercise with simple vocabulary.')

    pdf.rule('If stuck, describe: ', 'colors, weather, clothes, actions, emotions, positions.')

    pdf.ln(2)
    pdf.txt('The examiner mainly wants to see:')
    pdf.table(
        ['WHAT THEY LOOK FOR', 'WHAT THIS MEANS'],
        [
            ['Communication', 'You can get your message across'],
            ['Organization', 'You follow a logical structure'],
            ['Fluency', 'You keep speaking without long pauses'],
            ['Confidence', 'You sound natural, not panicked'],
        ],
        [60, 110]
    )

    pdf.ln(2)
    pdf.tip(
        'The Real Objective',
        'Keep speaking continuously. A simple fluent description beats complicated broken grammar every time. Use the structure, use the chunks, and never stop talking.',
        h=16
    )

    pdf.footer_line(5)

    # Output
    out = PDF_DIR + 'Sproochentest Picture Description Guide.pdf'
    pdf.output(out)
    print(f'PDF generated: {out}')


if __name__ == '__main__':
    build_pdf()
