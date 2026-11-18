/* Searchable, server-rendered resource collections. All entries remain available without JS. */
(function () {
  document.querySelectorAll('[data-resource-browser]').forEach(function (root) {
    var controls = root.querySelector('[data-controls]'), search = root.querySelector('[data-search]');
    var category = root.querySelector('[data-category]'), sort = root.querySelector('[data-sort]');
    var list = root.querySelector('[data-list]'), items = Array.from(list.querySelectorAll('[data-item]'));
    var count = root.querySelector('[data-count]'), empty = root.querySelector('[data-empty]');
    var reset = root.querySelector('[data-reset]'), more = root.querySelector('[data-more]');
    var limit = Number(root.dataset.pageSize) || Infinity, shown = limit;
    var key = root.dataset.categoryParam || 'category', params = new URLSearchParams(location.search);
    search.value = params.get('q') || '';
    if (category && Array.from(category.options).some(function (o) { return o.value === params.get(key); })) category.value = params.get(key);
    if (sort && Array.from(sort.options).some(function (o) { return o.value === params.get('sort'); })) sort.value = params.get('sort');
    controls.hidden = false;
    function update(writeURL) {
      var q = search.value.trim().toLocaleLowerCase(), cat = category ? category.value : '';
      var filtered = items.filter(function (item) { return (!cat || item.dataset.category === cat) && (!q || item.textContent.toLocaleLowerCase().includes(q)); });
      if (sort) filtered.sort(function (a, b) { return sort.value === 'high' ? Number(b.dataset.score) - Number(a.dataset.score) : sort.value === 'low' ? Number(a.dataset.score) - Number(b.dataset.score) : a.dataset.title.localeCompare(b.dataset.title); });
      items.forEach(function (item) { item.hidden = true; });
      filtered.forEach(function (item, i) { if (sort) list.appendChild(item); item.hidden = i >= shown; });
      count.textContent = filtered.length + ' of ' + items.length + ' ' + root.dataset.noun + (filtered.length > shown ? ' · showing ' + shown : '');
      empty.hidden = filtered.length > 0;
      if (more) more.hidden = filtered.length <= shown;
      reset.hidden = !q && !cat && (!sort || sort.value === 'title');
      if (writeURL) { var url = new URL(location.href); [['q', search.value.trim()], [key, cat], ['sort', sort && sort.value !== 'title' ? sort.value : '']].forEach(function (pair) { if (pair[1]) url.searchParams.set(pair[0], pair[1]); else url.searchParams.delete(pair[0]); }); history.replaceState(null, '', url); }
    }
    [search, category, sort].filter(Boolean).forEach(function (control) { control.addEventListener(control === search ? 'input' : 'change', function () { shown = limit; update(true); }); });
    reset.addEventListener('click', function () { search.value = ''; if (category) category.value = ''; if (sort) sort.value = 'title'; shown = limit; update(true); search.focus(); });
    if (more) more.addEventListener('click', function () { shown += limit; update(false); var visible = Array.from(list.children).filter(function (item) { return !item.hidden; }); var next = visible[shown - limit]; if (next) { var link = next.querySelector('a') || next; link.focus(); } });
    update(false);
  });
})();
