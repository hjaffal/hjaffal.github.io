/**
 * Admin Panel — Compose Module
 *
 * Handles the newsletter compose panel:
 * - Fetching available posts from the API and rendering a selection list
 *   with checkboxes and a featured radio button
 * - Compose form submission with validation, segment selection, and
 *   multi-segment sending
 * - Rich text toolbar (execCommand handlers for bold, italic, lists, links)
 * - Tool dropdown auto-fill from preset options
 */

import { show, hide, $, escHtml, apiFetch, getApiUrls, showNotification, getToken } from './main.js';

// --- Module State ---

/** Cached posts fetched from the API for compose selection */
let postsData = [];

// --- Public Functions ---

/**
 * Fetch posts from the API and render the selection list.
 * Called when the compose panel is activated.
 */
export async function loadPosts() {
  const loading = $('compose-loading');
  const error = $('compose-error');
  const content = $('compose-content');
  show(loading); hide(error); hide(content);

  try {
    const urls = getApiUrls();
    const data = await apiFetch(urls.send + '?action=listPosts');
    postsData = data.posts || [];

    const postsHtml = postsData.map((p, i) => `
      <div class="nla-post-item">
        <input type="checkbox" id="post-check-${i}" value="${i}" aria-label="Include ${escHtml(p.title)}">
        <div class="nla-post-info">
          <div class="nla-post-title">${escHtml(p.title)}</div>
          <div class="nla-post-date">${p.date || ''}</div>
        </div>
        <div class="nla-post-featured">
          <label class="nla-featured-radio">
            <input type="radio" name="featured" value="${i}" aria-label="Feature ${escHtml(p.title)}">
            Featured
          </label>
        </div>
      </div>
    `).join('');

    $('compose-posts').innerHTML = postsHtml || '<p class="nla-empty">No posts available.</p>';
    hide(loading); show(content);
    initCompose();
  } catch (err) {
    hide(loading);
    error.textContent = err.message;
    show(error);
  }
}

/**
 * Handle compose form submission.
 * Validates inputs, collects form data, and sends the newsletter
 * to each selected segment via the send API endpoint.
 *
 * @param {Event} e - The form submit event
 */
export async function handleComposeSubmit(e) {
  e.preventDefault();

  const sendErr = $('compose-send-error');
  const sendOk = $('compose-send-success');
  const btn = $('compose-send-btn');
  hide(sendErr);
  hide(sendOk);

  // --- Collect form data ---
  const subject = $('compose-subject').value.trim();
  const introHtml = $('compose-intro').innerHTML.trim();
  const introText = $('compose-intro').textContent.trim();

  // Segment checkboxes
  const segments = [];
  if ($('seg-main').checked) segments.push('main_website');
  if ($('seg-sproochentest').checked) segments.push('sproochentest_prep');
  if ($('seg-testing').checked) segments.push('testing');

  // Post selection checkboxes and featured radio
  const checked = document.querySelectorAll('#compose-posts input[type="checkbox"]:checked');
  const featuredRadio = document.querySelector('#compose-posts input[name="featured"]:checked');

  // --- Validation ---
  if (!subject) {
    sendErr.textContent = 'Subject is required.';
    show(sendErr);
    return;
  }
  if (checked.length === 0 && !introText) {
    sendErr.textContent = 'Add intro text or select at least one post.';
    show(sendErr);
    return;
  }
  if (segments.length === 0) {
    sendErr.textContent = 'Select at least one segment.';
    show(sendErr);
    return;
  }

  // --- Build payload ---
  const selectedPosts = Array.from(checked).map(cb => {
    const p = postsData[parseInt(cb.value)];
    return { title: p.title, excerpt: p.excerpt || '', url: p.url };
  });

  let featuredPost = null;
  if (featuredRadio) {
    const fp = postsData[parseInt(featuredRadio.value)];
    featuredPost = { title: fp.title, excerpt: fp.excerpt || '', url: fp.url };
  }

  let toolInvitation = null;
  const toolName = $('tool-name').value.trim();
  const toolUrl = $('tool-url').value.trim();
  if (toolName && toolUrl) {
    toolInvitation = { name: toolName, description: $('tool-desc').value.trim(), url: toolUrl };
  }

  // --- Confirmation ---
  if (!confirm('Send newsletter to ' + segments.join(' + ') + ' with subject:\n\n' + subject + '\n\nProceed?')) return;

  // --- Send (one API call per segment) ---
  btn.disabled = true;
  btn.textContent = 'Sending…';

  let totalRecipients = 0;
  let editionIds = [];

  try {
    const urls = getApiUrls();
    for (const segment of segments) {
      const result = await apiFetch(urls.send, {
        method: 'POST',
        body: JSON.stringify({
          subject,
          introHtml: introText ? introHtml : null,
          posts: selectedPosts,
          featuredPost,
          toolInvitation,
          segment
        })
      });
      totalRecipients += (result.recipientCount || 0);
      if (result.editionId) editionIds.push(result.editionId);
    }
    sendOk.textContent = 'Sent to ' + totalRecipients + ' recipients across ' + segments.length + ' segment(s).';
    show(sendOk);
  } catch (err) {
    sendErr.textContent = err.message;
    show(sendErr);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Send Newsletter';
  }
}

/**
 * Wire up rich text toolbar buttons for the compose intro text field.
 * Each button uses document.execCommand to apply formatting to the
 * contenteditable div (#compose-intro).
 *
 * Supported commands (from data-cmd attribute):
 * - bold, italic, insertUnorderedList, insertOrderedList
 * - createLink (prompts for URL)
 * - removeFormat
 */
export function initToolbar() {
  document.querySelectorAll('.nla-editor-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      const cmd = this.dataset.cmd;
      if (cmd === 'createLink') {
        const url = prompt('Enter URL:');
        if (url) document.execCommand(cmd, false, url);
      } else {
        document.execCommand(cmd, false, null);
      }
      $('compose-intro').focus();
    });
  });
}

/**
 * Handle the tool dropdown (#tool-select) auto-fill behavior.
 * When a tool is selected, auto-fill the tool name, description,
 * and URL fields from the selected option's data attributes.
 * When "None" is selected, clear all tool fields.
 */
export function initToolDropdown() {
  $('tool-select').addEventListener('change', function() {
    const opt = this.options[this.selectedIndex];
    if (this.value) {
      $('tool-name').value = opt.dataset.name || '';
      $('tool-desc').value = opt.dataset.desc || '';
      $('tool-url').value = opt.dataset.url || '';
    } else {
      $('tool-name').value = '';
      $('tool-desc').value = '';
      $('tool-url').value = '';
    }
  });
}

// --- Double-initialization guard ---
let composeInitialized = false;

/**
 * Initialize the compose panel: wire up toolbar buttons,
 * tool-select change handler, and form submit listener.
 * Guarded against double-initialization.
 */
export function initCompose() {
  if (composeInitialized) return;
  composeInitialized = true;

  initToolbar();
  initToolDropdown();
  $('compose-form').addEventListener('submit', handleComposeSubmit);
}
