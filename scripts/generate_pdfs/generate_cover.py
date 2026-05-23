#!/usr/bin/env python3
"""Generate a cover image for the Sproochentest Adjective Guide PDF."""

from PIL import Image, ImageDraw, ImageFont
import os

# A4 at 150 DPI: 1240 x 1754 px
W, H = 1240, 1754

# Colors
DARK = (15, 23, 42)
DARK_SOFT = (30, 41, 59)
ACCENT = (147, 51, 234)
ACCENT_LIGHT = (167, 91, 244)
WHITE = (255, 255, 255)
SLATE_BG = (248, 250, 252)
TEXT_MUTED = (100, 116, 139)
TEXT_SOFT = (148, 163, 184)

def create_cover():
    img = Image.new('RGB', (W, H), DARK)
    draw = ImageDraw.Draw(img)

    # Background gradient effect with shapes
    # Large circle top-right
    for i in range(300, 0, -1):
        alpha = int(15 * (i / 300))
        color = (ACCENT[0], ACCENT[1], ACCENT[2])
        # Simulate glow with concentric circles
        x, y = 950, 200
        draw.ellipse([x - i, y - i, x + i, y + i], fill=(
            DARK[0] + (color[0] - DARK[0]) * alpha // 255,
            DARK[1] + (color[1] - DARK[1]) * alpha // 255,
            DARK[2] + (color[2] - DARK[2]) * alpha // 255,
        ))

    # Smaller circle bottom-left
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

    # Try to load system fonts
    font_dir = '/System/Library/Fonts/Supplemental/'
    try:
        font_label = ImageFont.truetype(font_dir + 'Arial Bold.ttf', 28)
        font_title = ImageFont.truetype(font_dir + 'Arial Bold.ttf', 96)
        font_subtitle = ImageFont.truetype(font_dir + 'Arial.ttf', 38)
        font_badge = ImageFont.truetype(font_dir + 'Arial Bold.ttf', 26)
        font_small = ImageFont.truetype(font_dir + 'Arial.ttf', 24)
        font_url = ImageFont.truetype(font_dir + 'Arial Bold.ttf', 28)
    except:
        font_label = ImageFont.load_default()
        font_title = ImageFont.load_default()
        font_subtitle = ImageFont.load_default()
        font_badge = ImageFont.load_default()
        font_small = ImageFont.load_default()
        font_url = ImageFont.load_default()

    # Content area
    left = 100
    y = 500

    # Label
    draw.text((left, y), 'SPROOCHENTEST A2  \u00b7  SPEAKING GUIDE', fill=ACCENT_LIGHT, font=font_label)
    y += 80

    # Title
    draw.text((left, y), 'Adjective', fill=WHITE, font=font_title)
    y += 110
    draw.text((left, y), 'Declension in', fill=WHITE, font=font_title)
    y += 110
    draw.text((left, y), 'Luxembourgish', fill=ACCENT_LIGHT, font=font_title)
    y += 160

    # Subtitle
    draw.text((left, y), 'A practical guide for the Sproochentest oral exam.', fill=TEXT_MUTED, font=font_subtitle)
    y += 50
    draw.text((left, y), 'Use correct adjective endings when describing', fill=TEXT_MUTED, font=font_subtitle)
    y += 50
    draw.text((left, y), 'pictures, clothes, colors, people, and objects.', fill=TEXT_MUTED, font=font_subtitle)
    y += 100

    # Badge
    badge_text = 'A2 Speaking  \u00b7  Image Description  \u00b7  Topic Conversation'
    bbox = draw.textbbox((0, 0), badge_text, font=font_badge)
    bw = bbox[2] - bbox[0] + 40
    bh = 50
    draw.rounded_rectangle([left, y, left + bw, y + bh], radius=8, fill=DARK_SOFT, outline=TEXT_SOFT)
    draw.text((left + 20, y + 12), badge_text, fill=WHITE, font=font_badge)
    y += 100

    # Note
    draw.text((left, y), 'This is not a full grammar course.', fill=TEXT_SOFT, font=font_small)
    y += 35
    draw.text((left, y), 'It is an exam-focused speaking guide with ready-to-use patterns.', fill=TEXT_SOFT, font=font_small)
    y += 80

    # URL
    draw.text((left, y), 'hasanjaffal.com/sproochentest', fill=ACCENT_LIGHT, font=font_url)

    # Bottom bar
    draw.rectangle([0, H - 12, W, H], fill=ACCENT)

    # Save
    output = '/Users/hjaffal/hasanjaffal.com/hjaffal.github.io/assets/pdf/cover.png'
    img.save(output, 'PNG', quality=95)
    print(f'Cover image saved: {output}')

if __name__ == '__main__':
    create_cover()
