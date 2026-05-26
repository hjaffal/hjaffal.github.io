/**
 * Admin Panel — Downloads Module
 *
 * Shows download analytics for Sproochentest materials.
 */

import { show, hide, $, apiFetch, formatDate, escHtml, getApiUrls } from './main.js';

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

    if (files.length === 0) {
      list.innerHTML = '<p class="nla-dash-empty">No downloads recorded yet.</p>';
    } else {
      let html = '<div class="nla-dash-editions-table"><table class="nla-table">' +
        '<thead><tr><th>File</th><th>Downloads</th><th></th></tr></thead><tbody>';

      files.forEach(function(f) {
        const encodedFile = btoa(unescape(encodeURIComponent(f.file)));
        html += '<tr>' +
          '<td>' + escHtml(f.fileName) + '</td>' +
          '<td><strong>' + f.count + '</strong></td>' +
          '<td><button class="nla-btn-sm" onclick="viewDownloadDetail(\'' + encodedFile + '\', \'' + escHtml(f.fileName).replace(/'/g, "\\'") + '\')">View</button></td>' +
        '</tr>';
      });

      html += '</tbody></table></div>';
      list.innerHTML = html;
    }

    hide(loading); show(content); show(list);

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
  const file = decodeURIComponent(escape(atob(encodedFile)));
  const list = $('downloads-list');
  const detail = $('downloads-detail');
  const detailTitle = $('downloads-detail-title');
  const detailList = $('downloads-detail-list');

  hide(list);
  detailTitle.textContent = fileName;
  detailList.innerHTML = '<p>Loading…</p>';
  show(detail);

  try {
    const API = getApiUrls();
    const data = await apiFetch(API.trackDownload + '?action=detail&file=' + encodeURIComponent(file));
    const downloads = data.downloads || [];

    if (downloads.length === 0) {
      detailList.innerHTML = '<p class="nla-dash-empty">No downloads for this file.</p>';
    } else {
      let html = '<div class="nla-dash-editions-table"><table class="nla-table">' +
        '<thead><tr><th>Email</th><th>Downloaded</th></tr></thead><tbody>';

      downloads.forEach(function(d) {
        html += '<tr><td>' + escHtml(d.email) + '</td><td>' + (d.downloadedAt ? formatDate(d.downloadedAt) : '—') + '</td></tr>';
      });

      html += '</tbody></table></div>';
      detailList.innerHTML = html;
    }
  } catch (err) {
    detailList.innerHTML = '<p class="nla-error">' + escHtml(err.message) + '</p>';
  }
};
