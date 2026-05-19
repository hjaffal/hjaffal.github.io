# AI Templates Section

A clean, static, SEO-friendly AI Templates repository for hasanjaffal.com.

## Folder Structure

```
ai-templates-section/
├── _aiTemplates/          # Markdown source files for each template
├── pdf/                   # Downloadable PDF files
├── layouts/               # Reusable HTML layout templates
├── pages/                 # Public HTML pages
├── assets/css/            # Stylesheets
├── generate_pdf.py        # PDF generation script
└── README.md
```

## How to Add a New Template

1. Create a Markdown file in `_aiTemplates/` with the naming convention:
   `ai-[template-name].md`

2. Add front matter:
   ```yaml
   ---
   title: "AI [Template Name]"
   slug: "ai-[template-name]"
   description: "Short description."
   category: "Management | Risk Management | Reporting | Decision-Making | Data Analysis"
   audience: "Target audience"
   download: "/pdf/ai-[template-name].pdf"
   last_updated: "YYYY-MM-DD"
   ---
   ```

3. Create the HTML page in `pages/` using `layouts/template-page.html` as reference.

4. Generate a PDF and place it in `pdf/`.

5. Add a card to `pages/ai-templates.html` hub page.

## Naming Rules

- File names: lowercase, hyphenated, prefixed with `ai-`
- URLs: `/ai-templates/ai-[template-name]`
- PDFs: `pdf/ai-[template-name].pdf`

## SEO Rules

- Every page must have a unique `<title>` and `<meta name="description">`
- Every page must have a canonical URL
- Every page must include JSON-LD structured data (CreativeWork or HowTo)
- Every page must have Open Graph tags
- Internal links between related templates

## PDF Rules

- Clean, printable, professional
- Include title, description, all sections, tables
- No heavy branding — keep it functional
- Generate using `generate_pdf.py` (requires `fpdf2` and system fonts)
