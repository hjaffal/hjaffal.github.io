/**
 * Admin Panel — Analytics Module
 *
 * Handles newsletter edition analytics:
 * - Fetching editions and rendering a Grid.js table
 * - Viewing edition detail (stats + clicked links)
 * - Switching from overview to analytics panel to show detail
 * - Back to list navigation
 */

import { show, hide, $, escHtml, apiFetch, getApiUrls, formatDate, switchPanel } from './main.js';

// --- Module State ---
let analyticsGrid = null;
let analyticsInitialized = false;

// --- Public Functions ---

/**
 * Fetch editions and render the analytics Grid.js table.
 */
export async function loadAnalytics() {
  // Wire up event listeners on first load
  if (!analyticsInitialized) {
    initAnalytics();
    analyticsInitialized = true;
  }

  const loading = $('analytics-loading');
  const error = $('analytics-error');
  const list = $('analytics-list');
  const detail = $('analytics-detail');
  show(loading); hide(error); hide(list); hide(detail);

  try {
    const data = await apiFetch(getApiUrls().analytics + '?type=editions');
    const editions = data.editions || [];

    // Destroy existing Grid.js instance
    if (analyticsGrid) {
      analyticsGrid.destroy();
      analyticsGrid = null;
    }

    hide(loading); show(list);

    if (editions.length === 0) {
      $('analytics-grid').innerHTML = '<div class="nla-empty">No editions yet.</div>';
      return;
    }

    // Initialize Grid.js for analytics
    analyticsGrid = new gridjs.Grid({
      columns: [
        { name: 'Subject', sort: true },
        { name: 'Sent', sort: true },
        { name: 'Recipients', sort: true },
        { name: 'Open Rate', sort: true },
        { name: 'CTR', sort: true },
        { name: 'CTOR', sort: true },
        { name: 'Actions', sort: false, formatter: (_, row) => {
          const id = row.cells[7].data;
          return gridjs.html(`<button class="nla-btn-sm" onclick="viewEdition('${id}')">Detail</button>`);
        }},
        { name: 'id', hidden: true }
      ],
      data: editions.map(e => [
        e.subject,
        formatDate(e.sentAt),
        e.recipientCount,
        e.openRate != null ? e.openRate.toFixed(1) + '%' : '—',
        e.clickRate != null ? e.clickRate.toFixed(1) + '%' : '—',
        e.ctor != null ? e.ctor.toFixed(1) + '%' : '—',
        '',
        e.id
      ]),
      search: { enabled: true, placeholder: 'Search editions...' },
      sort: true,
      pagination: { enabled: true, limit: 15 },
      className: {
        container: 'nla-gridjs',
        table: 'nla-gridjs-table',
        th: 'nla-gridjs-th',
        td: 'nla-gridjs-td',
      }
    }).render($('analytics-grid'));
  } catch (err) {
    hide(loading);
    error.textContent = err.message;
    show(error);
  }
}

/**
 * Fetch and render edition detail (stats + clicked links).
 * @param {string} id - Edition identifier
 */
export async function viewEdition(id) {
  const list = $('analytics-list');
  const detail = $('analytics-detail');
  const error = $('analytics-error');
  hide(list); hide(error);

  // Show loading state
  detail.innerHTML = '<div class="nla-loading"><div class="nla-spinner"></div><p>Loading edition…</p></div>';
  show(detail);

  try {
    const data = await apiFetch(getApiUrls().analytics + '?type=edition&id=' + encodeURIComponent(id));
    const clickedLinks = data.clickedLinks || [];

    detail.innerHTML = `
      <button class="nla-back-btn" onclick="backToAnalyticsList()" type="button">← Back to list</button>
      <div class="nla-edition-detail">
        <h3 class="nla-edition-subject">${escHtml(data.subject)}</h3>
        <p class="nla-edition-meta">Sent ${formatDate(data.sentAt)} · Segment: ${data.segment || '—'}</p>
        <div class="nla-edition-stats">
          <div class="nla-edition-stat"><div class="nla-edition-stat-value">${data.totalRecipients || 0}</div><div class="nla-edition-stat-label">Recipients</div></div>
          <div class="nla-edition-stat"><div class="nla-edition-stat-value">${data.uniqueOpens || 0}</div><div class="nla-edition-stat-label">Opens</div></div>
          <div class="nla-edition-stat"><div class="nla-edition-stat-value">${data.openRate != null ? data.openRate.toFixed(1) + '%' : '—'}</div><div class="nla-edition-stat-label">Open Rate</div></div>
          <div class="nla-edition-stat"><div class="nla-edition-stat-value">${data.uniqueClicks || 0}</div><div class="nla-edition-stat-label">Clicks</div></div>
          <div class="nla-edition-stat"><div class="nla-edition-stat-value">${data.clickRate != null ? data.clickRate.toFixed(1) + '%' : '—'}</div><div class="nla-edition-stat-label">CTR</div></div>
          <div class="nla-edition-stat"><div class="nla-edition-stat-value">${data.ctor != null ? data.ctor.toFixed(1) + '%' : '—'}</div><div class="nla-edition-stat-label">CTOR</div></div>
          <div class="nla-edition-stat"><div class="nla-edition-stat-value">${data.failedSends || 0}</div><div class="nla-edition-stat-label">Failed</div></div>
        </div>
        ${clickedLinks.length > 0 ? '<h4 class="nla-section-title">Clicked Links</h4><div id="edition-links-grid"></div>' : ''}
        ${(data.opensWithEmail || []).length > 0 ? '<h4 class="nla-section-title">Who Opened</h4><div id="edition-opens-grid"></div>' : ''}
        ${(data.clicksWithEmail || []).length > 0 ? '<h4 class="nla-section-title">Who Clicked</h4><div id="edition-clicks-grid"></div>' : ''}
      </div>
    `;

    // Render clicked links as Grid.js table
    if (clickedLinks.length > 0) {
      new gridjs.Grid({
        columns: [
          { name: 'URL', sort: true },
          { name: 'Clicks', sort: true }
        ],
        data: clickedLinks.map(function(l) {
          return [l.url, l.clicks];
        }),
        sort: true,
        pagination: { enabled: true, limit: 20 },
        className: {
          container: 'nla-gridjs',
          table: 'nla-gridjs-table',
          th: 'nla-gridjs-th',
          td: 'nla-gridjs-td'
        }
      }).render(document.getElementById('edition-links-grid'));
    }

    // Render who opened grid
    if ((data.opensWithEmail || []).length > 0) {
      new gridjs.Grid({
        columns: [
          { name: 'Email', sort: true },
          { name: 'Opened At', sort: true }
        ],
        data: data.opensWithEmail.map(function(o) {
          return [o.email, formatDate(o.timestamp)];
        }),
        sort: true,
        pagination: { enabled: true, limit: 20 },
        className: {
          container: 'nla-gridjs',
          table: 'nla-gridjs-table',
          th: 'nla-gridjs-th',
          td: 'nla-gridjs-td'
        }
      }).render(document.getElementById('edition-opens-grid'));
    }

    // Render who clicked grid
    if ((data.clicksWithEmail || []).length > 0) {
      new gridjs.Grid({
        columns: [
          { name: 'Email', sort: true },
          { name: 'Link', sort: true, formatter: (cell) => {
            if (!cell) return '—';
            const short = cell.length > 50 ? cell.substring(0, 50) + '…' : cell;
            return gridjs.html('<span title="' + escHtml(cell) + '" style="font-size:0.75rem;">' + escHtml(short) + '</span>');
          }},
          { name: 'Clicked At', sort: true }
        ],
        data: data.clicksWithEmail.map(function(c) {
          return [c.email, c.url, formatDate(c.timestamp)];
        }),
        sort: true,
        pagination: { enabled: true, limit: 20 },
        className: {
          container: 'nla-gridjs',
          table: 'nla-gridjs-table',
          th: 'nla-gridjs-th',
          td: 'nla-gridjs-td'
        }
      }).render(document.getElementById('edition-clicks-grid'));
    }
  } catch (err) {
    detail.innerHTML = '<button class="nla-back-btn" onclick="backToAnalyticsList()" type="button">← Back to list</button><div class="nla-error">' + escHtml(err.message) + '</div>';
  }
}

/**
 * Switch to the analytics panel and show edition detail.
 * Called from the overview/dashboard panel.
 * @param {string} id - Edition identifier
 */
export async function viewEditionFromOverview(id) {
  // Show the analytics panel manually (avoid switchPanel which calls loadAnalytics and overwrites the detail view)
  const navItems = document.querySelectorAll('.nla-nav-item');
  const panels = document.querySelectorAll('.nla-panel');
  navItems.forEach(n => n.classList.remove('active'));
  panels.forEach(p => { p.classList.remove('active'); p.hidden = true; });
  const navBtn = document.querySelector('[data-panel="analytics"]');
  if (navBtn) navBtn.classList.add('active');
  const panel = $('panel-analytics');
  if (panel) { panel.classList.add('active'); panel.hidden = false; }

  // Hide loading and list, show detail directly
  hide($('analytics-loading'));
  hide($('analytics-list'));
  show($('analytics-detail'));

  // Show the specific edition detail directly
  viewEdition(id);
}

/**
 * Return from edition detail view back to the analytics list.
 */
export function backToAnalyticsList() {
  hide($('analytics-detail'));
  show($('analytics-list'));
}

/**
 * Initialize the analytics module.
 * Wires up event listeners and exposes functions on window.
 */
export function initAnalytics() {
  window.viewEdition = viewEdition;
  window.viewEditionFromOverview = viewEditionFromOverview;
  window.backToAnalyticsList = backToAnalyticsList;
}

// --- Module-level window assignments ---
// Ensure these are available immediately when the module is imported,
// not just after initAnalytics() is called.
window.viewEdition = viewEdition;
window.viewEditionFromOverview = viewEditionFromOverview;
window.backToAnalyticsList = backToAnalyticsList;
