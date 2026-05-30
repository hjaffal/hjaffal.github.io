/**
 * Admin Panel — LinkedIn Posts Module
 *
 * Generates LinkedIn post variations for articles using Gemini.
 * Stores in Firestore, allows editing and copying.
 */

import { $, apiFetch, getApiUrls, showNotification, escHtml } from './main.js';

let currentSlug = null;
let currentPostData = null;

/**
 * Open the LinkedIn panel for a specific post.
 */
export async function openLinkedInPanel(postData) {
  currentSlug = postData.slug;
  currentPostData = postData;

  const panel = $('linkedin-panel');
  const overlay = $('linkedin-overlay');
  const titleEl = $('linkedin-article-title');
  const postsList = $('linkedin-posts-list');
  const statusEl = $('linkedin-status');

  titleEl.textContent = postData.title;
  postsList.innerHTML = '<p class="nla-linkedin-loading">Loading saved posts…</p>';
  statusEl.textContent = '';

  panel.hidden = false;
  overlay.hidden = false;

  // Load existing posts from Firestore
  try {
    const API = getApiUrls();
    const data = await apiFetch(API.linkedinPosts + '?action=get&slug=' + encodeURIComponent(currentSlug));
    renderPosts(data.posts || []);
  } catch (err) {
    postsList.innerHTML = '<p class="nla-linkedin-empty">No posts generated yet. Click "Generate with AI" to create 5 LinkedIn post variations.</p>';
  }
}

/**
 * Close the LinkedIn panel.
 */
function closePanel() {
  $('linkedin-panel').hidden = true;
  $('linkedin-overlay').hidden = true;
  currentSlug = null;
  currentPostData = null;
}

/**
 * Generate 5 new LinkedIn posts.
 */
async function generatePosts() {
  if (!currentSlug || !currentPostData) return;

  const btn = $('linkedin-generate-btn');
  const statusEl = $('linkedin-status');

  btn.disabled = true;
  btn.textContent = '⏳ Generating…';
  statusEl.textContent = '';

  try {
    const API = getApiUrls();
    const result = await apiFetch(API.linkedinPosts, {
      method: 'POST',
      body: JSON.stringify({
        slug: currentSlug,
        title: currentPostData.title,
        excerpt: currentPostData.excerpt || '',
        body: currentPostData.body || currentPostData.excerpt || '',
        tags: currentPostData.tags || [],
      })
    });

    statusEl.textContent = '✓ Generated ' + result.posts.length + ' posts';
    showNotification('LinkedIn posts generated!', 'success');

    // Reload all posts
    const allData = await apiFetch(API.linkedinPosts + '?action=get&slug=' + encodeURIComponent(currentSlug));
    renderPosts(allData.posts || []);

  } catch (err) {
    statusEl.textContent = '✗ ' + err.message;
    showNotification('Generation failed: ' + err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = '🤖 Generate with AI';
  }
}

/**
 * Render LinkedIn posts in the panel.
 */
function renderPosts(posts) {
  const container = $('linkedin-posts-list');

  if (!posts || posts.length === 0) {
    container.innerHTML = '<p class="nla-linkedin-empty">No posts generated yet. Click "Generate with AI" to create 5 LinkedIn post variations.</p>';
    return;
  }

  let html = '';
  posts.forEach(function(post, index) {
    const text = post.text || post;
    const id = post.id || ('post-' + index);
    const date = post.generatedAt ? new Date(post.generatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';

    html += '<div class="nla-linkedin-post-card" data-id="' + id + '">';
    html += '<div class="nla-linkedin-post-header">';
    html += '<span class="nla-linkedin-post-num">#' + (index + 1) + '</span>';
    if (date) html += '<span class="nla-linkedin-post-date">' + date + '</span>';
    html += '<button class="nla-linkedin-copy-btn" onclick="copyLinkedInPost(this)" title="Copy to clipboard">📋 Copy</button>';
    html += '</div>';
    html += '<textarea class="nla-linkedin-textarea" rows="8">' + escHtml(text) + '</textarea>';
    html += '</div>';
  });

  container.innerHTML = html;
}

/**
 * Copy a LinkedIn post to clipboard.
 */
window.copyLinkedInPost = function(btn) {
  const card = btn.closest('.nla-linkedin-post-card');
  const textarea = card.querySelector('.nla-linkedin-textarea');
  const text = textarea.value;

  navigator.clipboard.writeText(text).then(function() {
    btn.textContent = '✓ Copied';
    setTimeout(function() { btn.textContent = '📋 Copy'; }, 2000);
  });
};

// Wire up event listeners when module loads
document.addEventListener('DOMContentLoaded', function() {
  const closeBtn = $('linkedin-close');
  if (closeBtn) closeBtn.addEventListener('click', closePanel);

  const overlay = $('linkedin-overlay');
  if (overlay) overlay.addEventListener('click', closePanel);

  const genBtn = $('linkedin-generate-btn');
  if (genBtn) genBtn.addEventListener('click', generatePosts);
});

// Also wire immediately (for dynamic panel loading)
setTimeout(function() {
  const closeBtn = $('linkedin-close');
  if (closeBtn && !closeBtn.dataset.wired) {
    closeBtn.dataset.wired = '1';
    closeBtn.addEventListener('click', closePanel);
  }
  const overlay = $('linkedin-overlay');
  if (overlay && !overlay.dataset.wired) {
    overlay.dataset.wired = '1';
    overlay.addEventListener('click', closePanel);
  }
  const genBtn = $('linkedin-generate-btn');
  if (genBtn && !genBtn.dataset.wired) {
    genBtn.dataset.wired = '1';
    genBtn.addEventListener('click', generatePosts);
  }
}, 500);
