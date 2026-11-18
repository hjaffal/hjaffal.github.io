#!/usr/bin/env python3
"""Validate a built Jekyll site: historical routes, links, visible terminology, and search metadata.
Run after `bundle exec jekyll build`: python3 scripts/check-publication.py
"""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit, urljoin
from urllib.robotparser import RobotFileParser
import json
import re
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / '_site'
BASELINE = json.loads((ROOT / 'scripts/fixtures/legacy-routes.json').read_text())
CORE = ['/ai-templates/', '/lexicon/', '/future-proof-skills-assessment/', '/ai-job-risk-directory/', '/ai-job-risk-analyzer/', '/', '/cv/', '/books/', '/tools/', '/aboutme/', '/newsletter/', '/contact/', '/writing/', '/topics/', '/topics/opportunities/', '/topics/investment-decisions/', '/topics/people-and-adoption/', '/topics/outcomes-and-evidence/']


def destination(url):
    path = SITE / unquote(urlsplit(url).path).lstrip('/')
    return path if path.is_file() else path / 'index.html' if (path / 'index.html').exists() else path.with_suffix('.html')


class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links, self.text, self.canonicals, self.titles = [], [], [], []
        self.skip = 0
        self.h1 = 0
        self.in_title = False
        self.description = None

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag in ('script', 'style'):
            self.skip += 1
        if tag == 'h1':
            self.h1 += 1
        if tag == 'title':
            self.in_title = True
        if tag == 'link' and attrs.get('rel') == 'canonical':
            self.canonicals.append(attrs.get('href'))
        if tag == 'meta' and attrs.get('name') == 'description':
            self.description = attrs.get('content')
        if tag == 'a':
            self.links.append(attrs.get('href', ''))

    def handle_endtag(self, tag):
        if tag in ('script', 'style'):
            self.skip = max(0, self.skip - 1)
        if tag == 'title':
            self.in_title = False

    def handle_data(self, data):
        if not self.skip:
            self.text.append(data)
        if self.in_title:
            self.titles.append(data)


def main():
    errors = []
    for route in BASELINE['routes'] + BASELINE['original_urls']:
        if not destination(route).exists():
            errors.append('Missing legacy route: ' + route)
    for path in SITE.rglob('*.html'):
        source = path.read_text(errors='replace')
        page = Page()
        page.feed(source)
        if re.search(r'\bessays?\b', ' '.join(page.text), re.I):
            errors.append('Old visible terminology: ' + str(path.relative_to(SITE)))
        route = '/' + path.relative_to(SITE).as_posix()
        if route.endswith('index.html'):
            route = route[:-10]
        for url in page.links:
            if not url:
                continue
            parsed = urlsplit(urljoin('https://hasanjaffal.com' + route, url))
            if parsed.scheme in ('https', 'http') and parsed.netloc in ('hasanjaffal.com', 'www.hasanjaffal.com', 'hjaffal.github.io') and not destination(parsed.geturl()).exists():
                errors.append('Broken link: ' + url + ' in ' + str(path.relative_to(SITE)))
        for block in re.findall(r'<script type="application/ld\+json">(.*?)</script>', source, re.S):
            try:
                json.loads(block)
            except ValueError as error:
                errors.append('Invalid JSON-LD: ' + str(path) + ': ' + str(error))
    for url in CORE:
        page = Page()
        page.feed(destination(url).read_text())
        if page.h1 != 1 or len(page.canonicals) != 1 or not page.description:
            errors.append('Heading/canonical/description problem: ' + url)
        if ''.join(page.titles).count('Hasan Jaffal') != 1:
            errors.append('Author name missing or duplicated in title: ' + url)
    for name in ['opportunities', 'investment-decisions', 'people-and-adoption', 'outcomes-and-evidence']:
        source = destination('/topics/' + name + '/').read_text()
        guide = source.split('<section class="topic-guide"', 1)[1].split('</section>', 1)[0]
        page = Page()
        page.feed(guide)
        if len(' '.join(page.text).split()) < 400:
            errors.append('Topic guide lost substantive content: ' + name)
    for filename in ['sitemap.xml', 'feed.xml']:
        ET.parse(SITE / filename)
    robot = RobotFileParser()
    robot.parse((SITE / 'robots.txt').read_text().splitlines())
    for url in CORE:
        if not robot.can_fetch('OAI-SearchBot', 'https://hasanjaffal.com' + url):
            errors.append('Search crawler cannot access: ' + url)
    if robot.can_fetch('OAI-SearchBot', 'https://hasanjaffal.com/newsletter/admin/'):
        errors.append('Admin crawler restriction lost')
    llms = (SITE / 'llms.txt').read_text()
    for url in re.findall(r'\]\((https://hasanjaffal\.com/[^)]+)\)', llms):
        if not destination(url).exists():
            errors.append('Stale agent-guide link: ' + url)
    if errors:
        raise SystemExit('\n'.join(sorted(set(errors))))
    print('PASS: historical routes, all internal page links, article terminology, JSON-LD, core metadata, topic content, sitemap/feed, and search-crawler access.')
    print(f"Preserved {len(BASELINE['routes'])} existing HTML paths and {len(BASELINE['original_urls'])} original URL paths.")


if __name__ == '__main__':
    main()
