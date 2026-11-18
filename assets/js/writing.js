/* Progressive enhancement for the article archive: URL-based discovery, search, and paging. */
(function () {
  'use strict';
  const root = document.querySelector('.writing-library');
  if (!root) return;
  const list = root.querySelector('#wr-articles-list');
  const articles = Array.from(list.querySelectorAll('.wl-essay'));
  const links = Array.from(root.querySelectorAll('[data-topic-link]'));
  const topics = new Set(links.map(link => link.dataset.topicLink));
  const search = root.querySelector('#wl-search');
  const sort = root.querySelector('#wl-sort');
  const reset = root.querySelector('#wl-reset');
  const status = root.querySelector('#wl-results-status');
  const more = root.querySelector('#wl-more');
  const pageSize = 8;
  const index = articles.map((element, order) => ({
    element, order,
    topics: element.dataset.topics.split(' '),
    date: Number(element.dataset.date),
    minutes: Number(element.dataset.minutes),
    text: (element.querySelector('h3').textContent + ' ' + element.querySelector('.wl-summary').textContent).toLocaleLowerCase()
  }));
  let topic = 'all';
  let visible = pageSize;
  let timer;
  function restore() {
    const params = new URLSearchParams(location.search);
    topic = topics.has(params.get('topic')) ? params.get('topic') : 'all';
    search.value = params.get('q') || '';
    sort.value = ['newest', 'oldest', 'shortest'].includes(params.get('sort')) ? params.get('sort') : 'newest';
    visible = pageSize;
  }
  function save(push) {
    const url = new URL(location.href);
    if (topic !== 'all') url.searchParams.set('topic', topic); else url.searchParams.delete('topic');
    if (search.value.trim()) url.searchParams.set('q', search.value.trim()); else url.searchParams.delete('q');
    if (sort.value !== 'newest') url.searchParams.set('sort', sort.value); else url.searchParams.delete('sort');
    if (url.href !== location.href) history[push ? 'pushState' : 'replaceState']({}, '', url);
  }
  function render() {
    const terms = search.value.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
    const filtered = index.filter(item => (topic === 'all' || item.topics.includes(topic)) && terms.every(term => item.text.includes(term)));
    filtered.sort((a, b) => sort.value === 'oldest' ? a.date - b.date || a.order - b.order : sort.value === 'shortest' ? a.minutes - b.minutes || b.date - a.date : b.date - a.date || a.order - b.order);
    articles.forEach(article => { article.hidden = true; });
    const shown = filtered.slice(0, visible);
    shown.forEach(item => { item.element.hidden = false; list.appendChild(item.element); });
    links.forEach(link => {
      const active = link.dataset.topicLink === topic;
      link.classList.toggle('is-active', active);
      if (active) link.setAttribute('aria-current', 'true'); else link.removeAttribute('aria-current');
    });
    const label = topic === 'all' ? 'All articles' : links.find(link => link.dataset.topicLink === topic && link.closest('.wl-filter-links')).textContent;
    root.querySelector('#archive-title').textContent = label;
    root.querySelector('#wl-topic-intro').hidden = topic === 'all';
    root.querySelectorAll('[data-topic-intro]').forEach(intro => { intro.hidden = intro.dataset.topicIntro !== topic; });
    status.textContent = filtered.length ? 'Showing ' + shown.length + ' of ' + filtered.length + ' article' + (filtered.length === 1 ? '' : 's') : 'No matching articles';
    root.querySelector('#wl-empty').hidden = filtered.length !== 0;
    root.querySelector('#wl-more-wrap').hidden = shown.length >= filtered.length;
    more.textContent = 'Show ' + Math.min(pageSize, filtered.length - shown.length) + ' more articles';
    reset.hidden = topic === 'all' && !terms.length && sort.value === 'newest';
    return shown;
  }
  links.forEach(link => link.addEventListener('click', event => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    clearTimeout(timer);
    topic = link.dataset.topicLink;
    visible = pageSize;
    save(true);
    render();
    if (link.closest('.wl-paths')) {
      const heading = root.querySelector('#archive-title');
      heading.setAttribute('tabindex', '-1');
      heading.focus({ preventScroll: true });
      root.querySelector('#wr-articles-section').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
    }
  }));
  search.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(() => { visible = pageSize; save(false); render(); }, 180);
  });
  search.addEventListener('search', () => { clearTimeout(timer); visible = pageSize; save(false); render(); });
  sort.addEventListener('change', () => { clearTimeout(timer); visible = pageSize; save(true); render(); });
  function clear() {
    clearTimeout(timer);
    topic = 'all'; search.value = ''; sort.value = 'newest'; visible = pageSize;
    save(true); render(); search.focus();
  }
  reset.addEventListener('click', clear);
  root.querySelector('#wl-empty-reset').addEventListener('click', clear);
  more.addEventListener('click', () => {
    clearTimeout(timer);
    save(false);
    const oldCount = visible;
    visible += pageSize;
    const shown = render();
    const next = shown[oldCount];
    if (next) next.element.querySelector('h3 a').focus();
  });
  window.addEventListener('popstate', () => { clearTimeout(timer); restore(); render(); });
  root.querySelector('#wl-controls').hidden = false;
  restore();
  render();
})();
