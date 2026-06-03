/**
 * Admin Panel — Subscribers Module
 *
 * Manages the subscriber list panel: fetching subscribers from the API,
 * rendering a Grid.js table with segment filtering, adding/editing/deactivating/deleting
 * subscribers, and exporting the list as CSV.
 */

import { show, hide, $, escHtml, apiFetch, getApiUrls, showNotification, formatDate } from './main.js';

// --- Module State ---

let allSubscribers = [];
let subscribersGrid = null;
let subscribersInitialized = false;

/**
 * Calculate engagement score (0-5) from opens and clicks.
 * Clicks weighted 2x higher than opens.
 * Score = min(5, floor((opens * 1 + clicks * 2) / 3))
 * 0 = no engagement, 5 = highly engaged
 */
function calcEngagement(opens, clicks) {
  if (!opens && !clicks) return 0;
  const raw = (opens * 1 + clicks * 2) / 3;
  return Math.min(5, Math.max(1, Math.ceil(raw)));
}

// --- Public Functions ---

/**
 * Fetch subscribers from the API, apply segment filter, and render the Grid.js table.
 */
export async function loadSubscribers() {
  // Wire up event listeners on first load
  if (!subscribersInitialized) {
    initSubscribers();
    subscribersInitialized = true;
  }

  const API = getApiUrls();
  const loading = $('sub-loading');
  const content = $('sub-content');
  const error = $('sub-error');

  show(loading);
  hide(content);
  hide(error);
  hide($('sub-success'));
  hide($('sub-edit-form'));

  try {
    const data = await apiFetch(API.subscribers + '?action=list');
    const subs = data.subscribers || [];

    // Store all fetched subscribers
    allSubscribers = subs;

    // Apply segment filter client-side
    const segmentFilter = $('sub-filter-segment').value;
    const statusFilter = $('sub-filter-status') ? $('sub-filter-status').value : '';
    let filtered = subs;
    if (segmentFilter) {
      filtered = filtered.filter(s => (s.segments || []).includes(segmentFilter));
    }
    if (statusFilter) {
      filtered = filtered.filter(s => s.status === statusFilter);
    }

    $('sub-total-count').textContent = '(' + filtered.length + ')';

    if (filtered.length === 0) {
      if (subscribersGrid) { subscribersGrid.destroy(); subscribersGrid = null; }
      $('sub-grid').innerHTML = '';
      hide(loading);
      show(content);
      show($('sub-empty'));
      return;
    }
    hide($('sub-empty'));

    // Destroy existing Grid.js instance
    if (subscribersGrid) { subscribersGrid.destroy(); subscribersGrid = null; }

    hide(loading);
    show(content);

    // Initialize Grid.js
    subscribersGrid = new window.gridjs.Grid({
      columns: [
        { name: 'Email', sort: true },
        { name: 'Name', sort: true },
        { name: 'Status', sort: true, formatter: (cell) => window.gridjs.html('<span class="nla-badge nla-badge-' + cell + '">' + cell + '</span>') },
        { name: 'Segments', sort: true },
        { name: 'Opens', sort: true, formatter: (cell) => window.gridjs.html('<span style="font-weight:600;color:' + (cell > 0 ? '#10B981' : '#94A3B8') + '">' + cell + '</span>') },
        { name: 'Clicks', sort: true, formatter: (cell) => window.gridjs.html('<span style="font-weight:600;color:' + (cell > 0 ? '#9333EA' : '#94A3B8') + '">' + cell + '</span>') },
        { name: 'Engagement', sort: true, formatter: (cell) => {
          const colors = ['#94A3B8', '#EF4444', '#F59E0B', '#F59E0B', '#10B981', '#10B981', '#9333EA'];
          const labels = ['None', '⚡1', '⚡2', '⚡3', '⚡4', '⚡5'];
          const c = Math.min(Math.max(cell, 0), 5);
          return window.gridjs.html('<span style="font-weight:700;color:' + colors[c] + '">' + labels[c] + '</span>');
        }},
        { name: 'Subscribed', sort: true },
        { name: 'Actions', sort: false, formatter: (_, row) => {
          const id = row.cells[9].data;
          const email = row.cells[0].data;
          const status = row.cells[2].data;
          const deactivateBtn = status === 'active'
            ? '<button class="nla-btn-sm" data-action="deactivate" data-id="' + id + '">Deactivate</button>'
            : '';
          return window.gridjs.html(
            '<div class="nla-table-actions">' +
              '<button class="nla-btn-sm" data-action="edit" data-id="' + id + '">Edit</button>' +
              deactivateBtn +
              '<button class="nla-btn-sm danger" data-action="delete" data-id="' + id + '" data-email="' + escHtml(email) + '">Delete</button>' +
            '</div>'
          );
        }},
        { name: 'id', hidden: true }
      ],
      data: filtered.map(s => [
        s.email,
        s.name || '',
        s.status,
        (s.segments || []).join(', '),
        s.openCount || 0,
        s.clickCount || 0,
        calcEngagement(s.openCount || 0, s.clickCount || 0),
        formatDate(s.subscribedAt),
        '',
        s.id
      ]),
      search: { enabled: true, placeholder: 'Search subscribers...' },
      sort: true,
      pagination: { enabled: true, limit: 25 },
      className: {
        container: 'nla-gridjs',
        table: 'nla-gridjs-table',
        th: 'nla-gridjs-th',
        td: 'nla-gridjs-td'
      }
    }).render($('sub-grid'));
  } catch (err) {
    hide(loading);
    error.textContent = err.message;
    show(error);
  }
}

// --- Add Subscriber Handler ---

/**
 * Handle adding a new subscriber from the add form inputs.
 * Validates email, calls the API, shows notification, and reloads the list.
 */
export async function handleAddSubscriber() {
  const API = getApiUrls();
  const email = $('sub-add-email').value.trim();
  const name = $('sub-add-name').value.trim();
  const error = $('sub-error');
  const success = $('sub-success');
  hide(error);
  hide(success);

  if (!email) {
    error.textContent = 'Enter an email address.';
    show(error);
    return;
  }

  try {
    await apiFetch(API.subscribers + '?action=add', {
      method: 'POST',
      body: JSON.stringify({ action: 'add', email, name })
    });
    success.textContent = 'Subscriber added: ' + email;
    show(success);
    $('sub-add-email').value = '';
    $('sub-add-name').value = '';
    loadSubscribers();
  } catch (err) {
    error.textContent = err.message;
    show(error);
  }
}

// --- Edit Form ---

/** ID of the subscriber currently being edited */
let editingSubscriberId = null;

/**
 * Populate the edit form with subscriber data and show it.
 * @param {string} id - Subscriber ID to edit
 */
export function populateEditForm(id) {
  const sub = allSubscribers.find(s => s.id === id);
  if (!sub) return;

  editingSubscriberId = id;
  $('edit-sub-id').value = id;
  $('edit-email').value = sub.email;
  $('edit-name').value = sub.name || '';
  $('edit-status').value = sub.status;
  $('edit-seg-main').checked = (sub.segments || []).includes('main_website');
  $('edit-seg-sproochentest').checked = (sub.segments || []).includes('sproochentest_prep');
  $('edit-seg-testing').checked = (sub.segments || []).includes('testing');
  show($('sub-edit-form'));
  $('sub-edit-form').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * Save the edited subscriber data from the edit form.
 */
export async function handleEditSave() {
  const API = getApiUrls();
  const id = $('edit-sub-id').value;
  const name = $('edit-name').value.trim();
  const segments = [];
  if ($('edit-seg-main').checked) segments.push('main_website');
  if ($('edit-seg-sproochentest').checked) segments.push('sproochentest_prep');
  if ($('edit-seg-testing').checked) segments.push('testing');

  const error = $('sub-error');
  const success = $('sub-success');
  hide(error);
  hide(success);

  try {
    await apiFetch(API.subscribers + '?action=update', {
      method: 'POST',
      body: JSON.stringify({ action: 'update', id, name, segments })
    });
    success.textContent = 'Subscriber updated successfully.';
    show(success);
    hide($('sub-edit-form'));
    editingSubscriberId = null;
    loadSubscribers();
  } catch (err) {
    error.textContent = err.message;
    show(error);
  }
}

/**
 * Cancel editing and hide the edit form.
 */
export function handleEditCancel() {
  hide($('sub-edit-form'));
  editingSubscriberId = null;
}

// --- Deactivate / Delete Handlers ---

/**
 * Deactivate a subscriber after user confirmation.
 * @param {string} id - Subscriber ID to deactivate
 */
export async function handleDeactivate(id) {
  if (!confirm('Deactivate this subscriber?')) return;
  const API = getApiUrls();
  try {
    await apiFetch(API.subscribers + '?action=deactivate', {
      method: 'POST',
      body: JSON.stringify({ action: 'deactivate', id })
    });
    loadSubscribers();
  } catch (err) {
    $('sub-error').textContent = err.message;
    show($('sub-error'));
  }
}

/**
 * Delete a subscriber after user confirmation (showing email).
 * @param {string} id - Subscriber ID to delete
 * @param {string} email - Subscriber email (shown in confirmation)
 */
export async function handleDelete(id, email) {
  if (!confirm('Permanently delete ' + email + '? This cannot be undone.')) return;
  const API = getApiUrls();
  try {
    await apiFetch(API.subscribers + '?action=delete', {
      method: 'POST',
      body: JSON.stringify({ action: 'delete', id })
    });
    loadSubscribers();
  } catch (err) {
    $('sub-error').textContent = err.message;
    show($('sub-error'));
  }
}

// --- CSV Export ---

/**
 * Escape a single CSV field value.
 * Wraps the field in double quotes if it contains commas, double quotes, or newlines.
 * Any existing double quotes are escaped by doubling them.
 * @param {string} value - The field value to escape
 * @returns {string} The escaped CSV field
 */
function escapeCSVField(value) {
  const str = String(value == null ? '' : value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

/**
 * Generate a CSV string from an array of subscriber objects.
 * Returns a CSV with a header row (Email, Name, Status, Segments, Subscribed Date)
 * followed by one data row per subscriber.
 *
 * The output will always contain exactly subscribers.length + 1 lines.
 *
 * @param {Array} subscribers - Array of subscriber objects
 * @returns {string} The generated CSV string
 */
export function generateCSV(subscribers) {
  const headers = ['Email', 'Name', 'Status', 'Segments', 'Subscribed Date'];
  const rows = [headers.join(',')];

  for (const s of subscribers) {
    const row = [
      escapeCSVField(s.email || ''),
      escapeCSVField(s.name || ''),
      escapeCSVField(s.status || ''),
      escapeCSVField((s.segments || []).join('; ')),
      escapeCSVField(s.subscribedAt || '')
    ];
    rows.push(row.join(','));
  }

  return rows.join('\n');
}

/**
 * Export the current subscriber list as a CSV file download.
 * Uses the module-level allSubscribers array (or filtered list based on segment filter).
 * Creates a Blob, generates a temporary download link, and triggers the download.
 * File name format: subscribers-export-YYYY-MM-DD.csv
 */
export function handleExportCSV() {
  if (!allSubscribers.length) return;

  // Apply segment and status filters to match what the user sees
  const segmentFilter = $('sub-filter-segment') ? $('sub-filter-segment').value : '';
  const statusFilter = $('sub-filter-status') ? $('sub-filter-status').value : '';
  let subscribers = allSubscribers;
  if (segmentFilter) {
    subscribers = subscribers.filter(s => (s.segments || []).includes(segmentFilter));
  }
  if (statusFilter) {
    subscribers = subscribers.filter(s => s.status === statusFilter);
  }

  if (!subscribers.length) return;

  const csv = generateCSV(subscribers);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'subscribers-export-' + new Date().toISOString().slice(0, 10) + '.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// --- Event Delegation ---

/**
 * Handle click events on subscriber table action buttons via event delegation.
 * Routes to the appropriate handler based on the data-action attribute.
 * @param {Event} e - Click event
 */
export function handleSubscriberAction(e) {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const action = btn.dataset.action;
  const id = btn.dataset.id;
  if (!id) return;

  if (action === 'edit') {
    populateEditForm(id);
  } else if (action === 'deactivate') {
    handleDeactivate(id);
  } else if (action === 'delete') {
    const email = btn.dataset.email || '';
    handleDelete(id, email);
  }
}

/**
 * Initialize the subscribers panel: wire up segment filter, export button,
 * add form, edit form save/cancel, and event delegation for table actions.
 */
export function initSubscribers() {
  // Segment filter — reload subscribers when filter changes
  const segmentFilter = $('sub-filter-segment');
  if (segmentFilter) {
    segmentFilter.addEventListener('change', () => loadSubscribers());
  }

  // Status filter — reload subscribers when filter changes
  const statusFilter = $('sub-filter-status');
  if (statusFilter) {
    statusFilter.addEventListener('change', () => loadSubscribers());
  }

  // Export CSV button
  const exportBtn = $('sub-export-btn');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => handleExportCSV());
  }

  // Add subscriber button
  const addBtn = $('sub-add-btn');
  if (addBtn) {
    addBtn.addEventListener('click', () => handleAddSubscriber());
  }

  // Edit form save button
  const saveBtn = $('edit-save-btn');
  if (saveBtn) {
    saveBtn.addEventListener('click', () => handleEditSave());
  }

  // Edit form cancel button
  const cancelBtn = $('edit-cancel-btn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => handleEditCancel());
  }

  // Event delegation for table action buttons (edit, deactivate, delete)
  const grid = $('sub-grid');
  if (grid) {
    grid.addEventListener('click', (e) => handleSubscriberAction(e));
  }
}
