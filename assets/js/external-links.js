// Links to other websites open in a new tab; screen readers are told so.
(function () {
  function sameSite(a, b) { return a.replace(/^www\./, '') === b.replace(/^www\./, ''); }

  function isExternal(href, base) {
    var url;
    try { url = new URL(href, base); } catch (e) { return false; }
    return /^https?:$/.test(url.protocol) && !sameSite(url.hostname, new URL(base).hostname);
  }

  function mark(root) {
    root.querySelectorAll('a[href]:not([data-ext])').forEach(function (a) {
      a.setAttribute('data-ext', '');
      if (!isExternal(a.getAttribute('href'), location.href)) return;
      a.target = '_blank';
      var rel = (a.rel || '').split(/\s+/).filter(Boolean);
      if (rel.indexOf('noopener') < 0) rel.push('noopener');
      a.rel = rel.join(' ');
      var hint = document.createElement('span');
      hint.className = 'ext-hint';
      hint.textContent = ' (opens in a new tab)';
      a.appendChild(hint);
    });
  }

  if (typeof document === 'undefined') { globalThis.isExternalLink = isExternal; return; } // tests run without a page
  function start() {
    mark(document);
    // Pages such as the directory and report render links after load.
    new MutationObserver(function () { mark(document); }).observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
