/**
 * Admin Panel — Downloads Module
 *
 * Shows download analytics for materials using Grid.js.
 */

import { show, hide, $, apiFetch, formatDate, escHtml, getApiUrls } from './main.js';

let downloadsGrid = null;

/**
 * Load the downloads panel.
 */
export async function loadDownloads() {
  const loading = $('downloads-loading');
  const error = $('downloads-error');
  const content = $('downloads-content');
  const list = $('downloads-list');
  const detail = $('downloads-detail');

  show(loading); hide(error); hide(content); hide(detail);

  try {
    const API = getApiUrls();
    const data = await apiFetch(API.trackDownload + '?action=list');
    const files = data.files || [];

    hide(loading); show(content); show(list);

    if (files.length === 0) {
      list.innerHTML = '<p class="nla-dash-empty">No materials registered yet. Downloads will appear here automatically.</p>';
      return;
    }

    // Destroy existing grid
    if (downloadsGrid) { downloadsGrid.destroy(); downloadsGrid = null; }
    list.innerHTML = '';

    downloadsGrid = new gridjs.Grid({
      columns: [
        { name: 'Title', sort: true },
        { name: 'Category', sort: true, formatter: function(cell) {
          return gridjs.html('<span class="nla-badge">' + escHtml(cell) + '</span>');
        }},
        { name: 'Downloads', sort: true },
        { name: 'Actions', sort: false, formatter: function(_, row) {
          var file = row.cells[4].data;
          var title = row.cells[0].data;
          var encoded = btoa(unescape(encodeURIComponent(file)));
          var safeTitle = escHtml(title).replace(/'/g, "\\'");
          return gridjs.html('<button class="nla-btn-sm" onclick="viewDownloadDetail(\'' + encoded + '\',\'' + safeTitle + '\')">View Downloads</button>');
        }},
        { name: 'file', hidden: true }
      ],
      data: files.map(function(f) {
        return [f.title || f.fileName, f.category || 'other', f.count, '', f.file];
      }),
      search: { enabled: true, placeholder: 'Search materials...' },
      sort: true,
      pagination: { enabled: true, limit: 20 },
      className: {
        container: 'nla-gridjs',
        table: 'nla-gridjs-table',
        th: 'nla-gridjs-th',
        td: 'nla-gridjs-td'
      }
    }).render(list);

    // Back button
    $('downloads-back').addEventListener('click', function() {
      hide(detail); show(list);
    });

  } catch (err) {
    hide(loading);
    error.textContent = err.message;
    show(error);
  }
}

/**
 * View download detail for a specific file.
 */
window.viewDownloadDetail = async function(encodedFile, fileName) {
  var file = decodeURIComponent(escape(atob(encodedFile)));
  var list = $('downloads-list');
  var detail = $('downloads-detail');
  var detailTitle = $('downloads-detail-title');
  var detailList = $('downloads-detail-list');

  hide(list);
  detailTitle.textContent = fileName;
  detailList.innerHTML = '<p>Loading…</p>';
  show(detail);

  try {
    var API = getApiUrls();
    var data = await apiFetch(API.trackDownload + '?action=detail&file=' + encodeURIComponent(file));
    var downloads = data.downloads || [];

    if (downloads.length === 0) {
      detailList.innerHTML = '<p class="nla-dash-empty">No downloads for this file yet.</p>';
    } else {
      // Use Grid.js for detail too
      detailList.innerHTML = '';
      new gridjs.Grid({
        columns: [
          { name: 'Email', sort: true },
          { name: 'Downloaded', sort: true }
        ],
        data: downloads.map(function(d) {
          return [d.email, d.downloadedAt ? formatDate(d.downloadedAt) : '—'];
        }),
        sort: true,
        pagination: { enabled: true, limit: 20 },
        className: {
          container: 'nla-gridjs',
          table: 'nla-gridjs-table',
          th: 'nla-gridjs-th',
          td: 'nla-gridjs-td'
        }
      }).render(detailList);
    }
  } catch (err) {
    detailList.innerHTML = '<p class="nla-error">' + escHtml(err.message) + '</p>';
  }
};
