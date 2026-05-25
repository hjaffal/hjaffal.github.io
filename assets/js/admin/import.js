/**
 * Admin Panel — Import Module
 *
 * Handles subscriber import functionality:
 * - Import button click handler
 * - JSON parsing and validation
 * - Confirmation dialog
 * - API submission and result display
 */

import { show, hide, $, apiFetch, getApiUrls, showNotification } from './main.js';

let initialized = false;

/**
 * Initialize the import panel.
 * Wires up the import button handler and sets up the import workflow.
 */
export function initImport() {
  if (initialized) return;
  initialized = true;

  const btn = $('import-btn');
  if (!btn) return;

  btn.addEventListener('click', async () => {
    const json = $('import-json').value.trim();
    const error = $('import-error');
    const success = $('import-success');
    const result = $('import-result');

    hide(error);
    hide(success);
    hide(result);

    // Validate non-empty input
    if (!json) {
      error.textContent = 'Paste a JSON array of subscribers.';
      show(error);
      return;
    }

    // Parse JSON and validate it's an array
    let subscribers;
    try {
      subscribers = JSON.parse(json);
      if (!Array.isArray(subscribers)) throw new Error('Must be an array');
    } catch (err) {
      error.textContent = 'Invalid JSON: ' + err.message;
      show(error);
      return;
    }

    // Validate each item has an email field
    const invalid = subscribers.some(item => !item || !item.email);
    if (invalid) {
      error.textContent = 'Each subscriber object must have an "email" field.';
      show(error);
      return;
    }

    // Confirmation dialog
    if (!confirm('Import ' + subscribers.length + ' subscriber(s)?')) return;

    // Loading state
    btn.disabled = true;
    btn.textContent = 'Importing…';

    try {
      const data = await apiFetch(getApiUrls().import, {
        method: 'POST',
        body: JSON.stringify({ subscribers })
      });

      // Display results
      $('import-imported').textContent = data.imported || 0;
      $('import-skipped').textContent = data.skipped || 0;
      $('import-rejected').textContent = data.rejected || 0;
      success.textContent = 'Import complete.';
      show(success);
      show(result);

      // Clear textarea on success
      $('import-json').value = '';
    } catch (err) {
      error.textContent = err.message;
      show(error);
    } finally {
      btn.disabled = false;
      btn.textContent = 'Import Subscribers';
    }
  });
}
