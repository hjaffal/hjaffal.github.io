#!/usr/bin/env python3
"""Generate the Sproochentest Vocabulary Sheet PDF."""
from fpdf import FPDF

FONT_DIR = '/System/Library/Fonts/Supplemental/'
DARK = (15, 23, 42)
ACCENT = (147, 51, 234)
AMBER = (217, 119, 6)
WHITE = (255, 255, 255)
SLATE_BG = (248, 250, 252)
TEXT_MUTED = (100, 116, 139)


class VocabPDF(FPDF):
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
        self.cell(0, 6, 'Sproochentest Vocabulary Sheet  |  hasanjaffal.com', align='L')
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

    def table(self, headers, rows, widths):
        self.set_fill_color(*DARK)
        self.set_text_color(*WHITE)
        self.set_font('Arial', 'B', 7)
        for i, h in enumerate(headers):
            self.cell(widths[i], 6, h, new_x='RIGHT', new_y='TOP', fill=True)
        self.ln()
        self.set_font('Arial', '', 7.5)
        for idx, row in enumerate(rows):
            bg = SLATE_BG if idx % 2 == 0 else WHITE
            self.set_fill_color(*bg)
            self.set_text_color(*DARK)
            for i, c in enumerate(row):
                self.cell(widths[i], 5, c, new_x='RIGHT', new_y='TOP', fill=True)
            self.ln()
        self.ln(3)


def build():
    pdf = VocabPDF()
    pdf.set_left_margin(15)
    pdf.set_right_margin(15)

    # Cover
    pdf.add_page()
    pdf.set_fill_color(*DARK)
    pdf.rect(0, 0, 210, 50, 'F')
    pdf.set_fill_color(*AMBER)
    pdf.rect(0, 50, 210, 3, 'F')

    pdf.set_y(60)
    pdf.set_font('Arial', 'B', 7)
    pdf.set_text_color(*AMBER)
    pdf.cell(0, 4, 'SPROOCHENTEST PREP', new_x='LMARGIN', new_y='NEXT')
    pdf.ln(4)
    pdf.set_font('Arial', 'B', 22)
    pdf.set_text_color(*DARK)
    pdf.cell(0, 9, 'Vocabulary Sheet', new_x='LMARGIN', new_y='NEXT')
    pdf.set_font('Arial', '', 11)
    pdf.set_text_color(*TEXT_MUTED)
    pdf.ln(4)
    pdf.cell(0, 6, 'Your Bible for Image Description', new_x='LMARGIN', new_y='NEXT')
    pdf.ln(8)
    pdf.set_font('Arial', '', 9)
    pdf.set_text_color(30, 41, 59)
    pdf.multi_cell(0, 4.5, 'Complete Luxembourgish vocabulary organized by category with articles, genders, and plurals. Covers general objects, kitchen, fruits, vegetables, living room, clothes, household chores, and verbs.')
    pdf.ln(12)
    pdf.set_font('Arial', '', 8)
    pdf.set_text_color(*TEXT_MUTED)
    pdf.cell(0, 4, 'hasanjaffal.com/sproochentest-materials/', new_x='LMARGIN', new_y='NEXT')

    # --- General Vocabulary ---
    pdf.add_page()
    pdf.section('General Vocabulary')
    w = [40, 12, 22, 40, 56]
    headers = ['Luxembourgish', 'Article', 'Gender', 'Plural', 'English']
    rows = [
        ['Stroosseluucht', "d'", 'feminine', 'Stroosseluuchten', 'street light'],
        ['Këscht', "d'", 'feminine', 'Këschten', 'bin / box'],
        ['Dreckskëscht', "d'", 'feminine', 'Dreckskëschten', 'garbage bin'],
        ['Dëppen', 'den', 'masculine', 'Dëppen', 'pot'],
        ['Blummendëppen', 'den', 'masculine', 'Blummendëppen', 'flower pot'],
        ['Blieder', "d'", 'plural', '—', 'leaves'],
        ['Schëld', 'dat', 'neuter', 'Schëlter', 'sign'],
        ['Pfeil', 'de(n)', 'masculine', 'Pfeiler', 'arrow'],
        ['Stand', 'de(n)', 'masculine', 'Stänn', 'stand'],
        ['Sonneparabelli', "d'", 'feminine', 'Sonneparabellien', 'sun umbrella'],
        ['Schaf', 'de(n)', 'masculine', 'Schief', 'wardrobe'],
        ['Dësch', 'den', 'masculine', 'Dëscher', 'table'],
        ['Stull', 'de(n)', 'masculine', 'Still', 'chair'],
        ['Dier', "d'", 'feminine', 'Dieren', 'door'],
        ['Stuff', "d'", 'feminine', 'Stuffen', 'living room'],
        ['Iesszëmmer', 'dat', 'neuter', 'Iesszëmmer', 'dining room'],
        ['Kichen', "d'", 'feminine', 'Kichen', 'kitchen'],
        ['Buedzëmmer', 'dat', 'neuter', 'Buedzëmmer', 'bathroom'],
        ['Keller', 'de(n)', 'masculine', 'Keller', 'cellar'],
        ['Gebai', 'dat', 'neuter', 'Gebaier', 'building'],
        ['Geschäft', 'dat', 'neuter', 'Geschäfter', 'shop'],
        ['Buttek', 'de(n)', 'masculine', 'Butteker', 'shop'],
        ['Daach', 'den', 'masculine', 'Diecher', 'roof'],
        ['Plafong', "d'", 'feminine', 'Plafongen', 'ceiling'],
        ['Buedem', 'de(n)', 'masculine', 'Biedem', 'floor'],
        ['Foussgängerstrooss', "d'", 'feminine', 'Foussgängerstroossen', 'pedestrian street'],
        ['Trottoir', 'den', 'masculine', 'Trottoiren', 'sidewalk'],
        ['Bank', "d'", 'feminine', 'Banken', 'bench'],
        ['Rasen', 'de(n)', 'masculine', 'Rasen', 'grass'],
        ['Wiss', 'de(n)', 'masculine', 'Wisen', 'meadow'],
        ['Beruffsverkéier', 'den', 'masculine', '—', 'rush hour'],
        ['Iesel', 'den', 'masculine', 'Ieselen', 'donkey'],
        ['Schëff', 'dat', 'neuter', 'Schëffer', 'ship'],
        ['Kamäin', 'de(n)', 'masculine', 'Kamäiner', 'chimney'],
        ['Schaukel', "d'", 'feminine', 'Schaukelen', 'swing'],
        ['Rutsch', "d'", 'feminine', 'Rutschen', 'slide'],
        ['Fiels', 'de(n)', 'masculine', 'Fielsen', 'rock'],
        ['Kloter-Mauer', "d'", 'feminine', 'Kloter-Maueren', 'climbing wall'],
        ['Spillbuerg', "d'", 'feminine', 'Spillbuergen', 'play castle'],
        ['Halsband', 'dat', 'neuter', 'Halsbänner', 'dog collar'],
        ['Waasserbuerg', "d'", 'feminine', 'Waasserbuergen', 'water playground'],
        ['Schmuck', 'de(n)', 'masculine', '—', 'jewelry'],
        ['Ballon', 'de(n)', 'masculine', 'Ballonen', 'balloon'],
        ['Loftballon', 'de(n)', 'masculine', 'Loftballonen', 'hot-air balloon'],
        ['Floss', 'de(n)', 'masculine', 'Flëss', 'river'],
        ['Bierg', 'de(n)', 'masculine', 'Bierger', 'mountain'],
        ['Mier', 'dat', 'neuter', 'Mierer', 'sea'],
        ['Strand', 'de(n)', 'masculine', 'Stränn', 'beach'],
        ['Iessbud', "d'", 'feminine', 'Iessbuden', 'food stand'],
        ['Verkeefer', 'de(n)', 'masculine', 'Verkeefer', 'seller'],
        ['Client', 'de(n)', 'masculine', 'Clienten', 'client'],
        ['Këssen', 'dat', 'neuter', 'Këssen', 'cushion'],
        ['Spigel', 'de(n)', 'masculine', 'Spigelen', 'mirror'],
        ['Bréifkëscht', "d'", 'feminine', 'Bréifkëschten', 'mailbox'],
        ['Riserad', 'dat', 'neuter', 'Riserieder', 'Ferris wheel'],
        ['Kuerf', 'den', 'masculine', 'Kierf', 'basket'],
        ['Tafel', "d'", 'feminine', 'Tafelen', 'blackboard'],
        ['Schlessel', 'den', 'masculine', 'Schlesselen', 'key'],
        ['Kuch', 'de', 'masculine', 'Kuchen', 'cake'],
        ['Kaerz', "d'", 'feminine', 'Kaerzen', 'candle'],
        ['Menuskaart', "d'", 'feminine', 'Menuskaarten', 'menu card'],
        ['Trap', "d'", 'feminine', 'Trappen', 'stairs'],
    ]
    pdf.table(headers, rows, w)

    # --- Kitchen ---
    pdf.add_page()
    pdf.section('Kitchen (Kichen)')
    w4 = [45, 45, 45, 35]
    pdf.table(['Luxembourgish', 'Plural', 'English', 'Gender'], [
        ['de Läffel', "d'Läffelen", 'spoon', 'masculine'],
        ["d'Forschett", "d'Forschett", 'fork', 'feminine'],
        ['de Messer', "d'Messeren", 'knife', 'masculine'],
        ['den Teller', "d'Teller", 'plate', 'masculine'],
        ['de Plat', "d'Platen", 'platter / dish', 'masculine'],
        ["d'Schossel", "d'Schosselen", 'bowl (large)', 'feminine'],
        ["d'Bol", "d'Bolen", 'bowl', 'feminine'],
        ["d'Taass", "d'Tassen", 'cup', 'feminine'],
        ["d'Glas", "d'Glieser", 'glass', 'neuter'],
        ["d'Fläsch", "d'Fläschen", 'bottle', 'feminine'],
        ['den Dëppen', "d'Dëppen", 'pot', 'masculine'],
        ['den Kachendëppen', "d'Kachendëppen", 'cooking pot', 'masculine'],
        ["d'Pan", "d'Pannen", 'pan', 'feminine'],
        ['de Frigo', "d'Frigoen", 'fridge', 'masculine'],
        ['den Uewen', "d'Uewen", 'oven', 'masculine'],
        ["d'Kachplack", "d'Kachplacken", 'cooktop', 'feminine'],
        ['de Spull', "d'Spullen", 'sink', 'masculine'],
    ], w4)

    # --- Fruits ---
    pdf.section('Fruits (Uebst)')
    pdf.table(['Luxembourgish', 'Plural', 'English', 'Gender'], [
        ['den Apel', "d'Äppel", 'apple', 'masculine'],
        ["d'Banann", "d'Banannen", 'banana', 'feminine'],
        ["d'Orange", "d'Orangen", 'orange', 'feminine'],
        ["d'Mandarin", "d'Mandarinen", 'mandarin', 'feminine'],
        ["d'Drauf", "d'Drauwen", 'grape', 'feminine'],
        ["d'Kiischt", "d'Kiischten", 'cherry', 'feminine'],
        ["d'Äerdbier", "d'Äerdbieren", 'strawberry', 'neuter'],
        ["d'Bier", "d'Birnen", 'pear', 'feminine'],
        ["d'Ananas", "d'Ananassen", 'pineapple', 'feminine'],
        ["d'Waassermeloun", "d'Waassermelounen", 'watermelon', 'feminine'],
        ["d'Zitroun", "d'Zitrounen", 'lemon', 'feminine'],
    ], w4)

    # --- Vegetables ---
    pdf.section('Vegetables (Geméis)')
    pdf.table(['Luxembourgish', 'Plural', 'English', 'Gender'], [
        ["d'Muert", "d'Muerten", 'carrot', 'feminine'],
        ["d'Tomat", "d'Tomaten", 'tomato', 'feminine'],
        ["d'Gromper", "d'Gromperen", 'potato', 'feminine'],
        ['den Ënn', "d'Ënnen", 'onion', 'masculine'],
        ["d'Gurke", "d'Gurken", 'cucumber', 'feminine'],
        ["d'Paprika", "d'Paprikaen", 'pepper', 'feminine'],
        ['de Zalot', "d'Zaloten", 'lettuce / salad', 'masculine'],
        ['de Broccoli', '—', 'broccoli', 'masculine'],
    ], w4)

    # --- Living Room ---
    pdf.add_page()
    pdf.section('Living Room (Salon)')
    pdf.table(['Luxembourgish', 'Plural', 'English', 'Gender'], [
        ['de Kannapee', "d'Kannapeen", 'sofa', 'masculine'],
        ['de Fotel', "d'Fotellen", 'armchair', 'masculine'],
        ['den Dësch', "d'Dëscher", 'table', 'masculine'],
        ['de Stull', "d'Still", 'chair', 'masculine'],
        ['den Teppech', "d'Teppecher", 'carpet', 'masculine'],
        ["d'Fënster", "d'Fënsteren", 'window', 'feminine'],
        ["d'Dier", "d'Dieren", 'door', 'feminine'],
        ["d'Luucht", "d'Luuchten", 'lamp / light', 'feminine'],
        ["d'Tëlee", "d'Tëleen", 'television', 'feminine'],
        ['de Bicherregal', "d'Bicherregaler", 'bookshelf', 'masculine'],
        ["d'Auer", "d'Aueren", 'clock', 'feminine'],
        ["d'Planz", "d'Planzen", 'plant', 'feminine'],
        ["d'Mauer", "d'Maueren", 'wall', 'feminine'],
        ['de Rideau', "d'Rideauen", 'curtain', 'masculine'],
        ['de Buedem', "d'Biedem", 'floor', 'masculine'],
        ["d'Bild", "d'Biller", 'picture', 'neuter'],
    ], w4)

    # --- Clothes ---
    pdf.section('Clothes (Kleeder)')
    w3 = [60, 60, 50]
    pdf.table(['Feminine', 'Masculine', 'Neutral'], [
        ['Eng Blus (blouse)', 'En Tshirt', 'En Hiem (shirt)'],
        ['Eng Jackett (jacket)', 'E Pullover', 'Stemp (socks)'],
        ['Eng Jupe (skirt)', 'E Mantel (coat)', 'Schong (shoes)'],
        ['Eng Mutz (hat/cap)', 'E Reemantel (raincoat)', 'Tallekeschong (heels)'],
        ['Eng Box (trousers)', 'E Short', 'Stiwwelen (boots)'],
        ['', 'E Rack (suit jacket)', 'Sandalen (sandals)'],
        ['', 'E Kostum (suit)', ''],
        ['', 'E Schal (scarf)', ''],
        ['', 'En Hut (hat)', ''],
        ['', 'En Topp (top)', ''],
    ], w3)

    # --- Household Chores ---
    pdf.section('Household Chores (Stot Machen)')
    w3b = [60, 20, 90]
    pdf.table(['Luxembourgish', 'Type', 'English'], [
        ['Raum raumen', 'verb', 'to tidy the room'],
        ['Staubsaugen', 'verb', 'to vacuum'],
        ['Stepsen', 'verb', 'to mop'],
        ['Spullen / Maachen', 'verb', 'to wash dishes'],
        ['Buedem wäschen', 'verb', 'to wash the floor'],
        ['Strecken', 'verb', 'to iron'],
        ['Wäschen', 'verb', 'to wash clothes'],
    ], w3b)

    # --- Verbs ---
    pdf.section('Verbs')
    w2 = [85, 85]
    pdf.table(['Luxembourgish', 'English'], [
        ['drécken', 'to push / press'],
        ['waarden', 'to wait'],
        ['verstoen', 'to understand'],
        ['dréien', 'to turn'],
        ['bestellen', 'to order'],
        ['wanderen', 'to hike'],
    ], w2)

    # Save
    pdf.output('assets/pdf/Sproochentest Vocabulary Sheet.pdf')
    print('Generated: assets/pdf/Sproochentest Vocabulary Sheet.pdf')


if __name__ == '__main__':
    build()
