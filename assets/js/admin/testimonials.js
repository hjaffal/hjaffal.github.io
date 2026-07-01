/**
 * Admin Panel — Testimonials Module
 *
 * Review and manage Sproochentest community testimonials.
 * Supports filtering by status, approving, rejecting, and deleting.
 */

import { show, hide, $, escHtml, apiFetch, getApiUrls, showNotification } from './main.js';

let testimonialsInitialized = false;

/**
 * Load and render testimonials list.
 * Called when the testimonials panel is activated.
 */
export async function loadTestimonials() {
  if (!testimonialsInitialized) {
    initTestimonials();
    testimonialsInitialized = true;
  }

  const loading = $('testimonials-loading');
  const list = $('testimonials-list');
  const error = $('testimonials-error');
  const empty = $('testimonials-empty');
  const filter = $('testimonials-filter-status').value;

  show(loading);
  hide(list);
  hide(error);
  hide(empty);

  try {
    const API = getApiUrls();
    const data = await apiFetch(API.testimonials + '?action=admin-list&status=' + filter);
    const items = data.testimonials || [];

    hide(loading);

    if (items.length === 0) {
      show(empty);
      return;
    }

    show(list);
    list.innerHTML = items.map(t => {
      const date = t.createdAt ? new Date(t.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
      const charLabel = { student: '📚 Still learning', exam: '📝 Exam ready', passed: '🎉 Bestoungen!' }[t.character] || t.character;
      const statusBadge = t.status === 'approved'
        ? '<span class="nla-badge nla-badge-active">approved</span>'
        : t.status === 'rejected'
          ? '<span class="nla-badge nla-badge-unsubscribed">rejected</span>'
          : '<span class="nla-badge nla-badge-pending">pending</span>';

      return `
        <div class="nla-testimonial-card" data-id="${t.id}" style="background:var(--card-bg,#fff);border:1px solid var(--border,#e2e8f0);border-radius:10px;padding:16px 20px;margin-bottom:12px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
            <div>
              <strong style="font-size:0.9rem;">${escHtml(t.name)}</strong>
              <span style="font-size:0.75rem;color:#94a3b8;margin-left:8px;">${charLabel}</span>
            </div>
            <div style="display:flex;align-items:center;gap:8px;">
              ${statusBadge}
              <span style="font-size:0.72rem;color:#94a3b8;">${date}</span>
            </div>
          </div>
          <p style="font-size:0.85rem;color:#334155;margin:0 0 6px;line-height:1.5;"><strong>Experience:</strong> ${escHtml(t.experience)}</p>
          ${t.improvement ? `<p style="font-size:0.85rem;color:#64748b;margin:0 0 10px;line-height:1.5;"><strong>Improvement:</strong> ${escHtml(t.improvement)}</p>` : ''}
          <div style="display:flex;gap:8px;margin-top:10px;">
            ${t.status !== 'approved' ? `<button class="nla-btn-sm" data-action="approve" data-id="${t.id}">✓ Approve</button>` : ''}
            ${t.status !== 'rejected' ? `<button class="nla-btn-sm danger" data-action="reject" data-id="${t.id}">✗ Reject</button>` : ''}
            <button class="nla-btn-sm" data-action="delete" data-id="${t.id}" style="margin-left:auto;">Delete</button>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    hide(loading);
    error.textContent = err.message;
    show(error);
  }
}

/**
 * Handle approve, reject, or delete action on a testimonial.
 */
async function handleAction(action, id) {
  const API = getApiUrls();
  try {
    await apiFetch(API.testimonials + '?action=admin-update', {
      method: 'POST',
      body: JSON.stringify({ id, status: action === 'delete' ? 'delete' : action === 'approve' ? 'approved' : 'rejected' })
    });
    showNotification(action === 'delete' ? 'Testimonial deleted.' : `Testimonial ${action}d.`, 'success');
    loadTestimonials();
  } catch (err) {
    showNotification('Action failed: ' + err.message, 'error');
  }
}

/**
 * Initialize event listeners for testimonials panel.
 */
function initTestimonials() {
  $('testimonials-filter-status').addEventListener('change', () => loadTestimonials());

  $('testimonials-list').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    const id = btn.dataset.id;
    if (action === 'delete') {
      if (!confirm('Delete this testimonial permanently?')) return;
    }
    handleAction(action, id);
  });
}
