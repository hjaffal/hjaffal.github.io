(function () {
  'use strict';
  const prose = document.querySelector('#article-prose');
  if (!prose) return;
  const headings = Array.from(prose.querySelectorAll('h2, h3'));
  if (headings.length > 1) {
    const list = document.querySelector('#article-contents-list');
    headings.forEach(function (heading, index) {
      if (!heading.id) {
        let id = 'essay-section-' + (index + 1);
        while (document.getElementById(id)) id += '-section';
        heading.id = id;
      }
      const item = document.createElement('li');
      const link = document.createElement('a');
      link.href = '#' + heading.id;
      link.textContent = heading.textContent;
      item.appendChild(link);
      list.appendChild(item);
      link.addEventListener('click', function () {
        heading.tabIndex = -1;
        heading.focus({ preventScroll: true });
      });
    });
    document.querySelector('#article-contents').hidden = false;
  }
  const button = document.querySelector('#article-copy');
  if (navigator.clipboard && window.isSecureContext) {
    button.hidden = false;
    button.addEventListener('click', async function () {
      const status = document.querySelector('#article-copy-status');
      try {
        const canonical = document.querySelector('link[rel="canonical"]');
        await navigator.clipboard.writeText(canonical ? canonical.href : location.href.split('#')[0]);
        status.textContent = 'Link copied.';
      } catch (error) {
        status.textContent = 'Could not copy. You can copy the address from your browser.';
      }
    });
  }
})();
