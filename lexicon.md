---
layout: null
permalink: /lexicon.md
sitemap: false
---
# The AI Operations Lexicon

New words for old failures made faster by AI.
By Hasan Jaffal — hasanjaffal.com

---

{% assign lex_pages = site.pages | where: "layout", "lexicon-term" %}
{% for term in lex_pages %}
## {{ term.term_name }}

**{{ term.term_name }}** ({{ term.pos }}) {{ term.definition }}

{{ term.explanation }}

**Operational example:** {{ term.example }}

**Why it matters:** {{ term.why_it_matters }}

**What strong teams do:** {{ term.strong_teams }}

URL: https://hasanjaffal.com{{ term.url }}

---

{% endfor %}
