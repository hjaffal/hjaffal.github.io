/**
 * Admin Panel — Main Entry Point
 *
 * Shared utility functions used across all panel modules.
 * Firebase initialization, auth, navigation, and panel module coordination.
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getAuth, signInWithPopup, signOut, onAuthStateChanged, GoogleAuthProvider } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

// Firebase auth instance — set during init()
let auth = null;
let currentToken = null;

// API URLs — set during init()
let apiUrls = null;

// --- Shared Utilities ---

export function show(el) { el.hidden = false; }
export function hide(el) { el.hidden = true; }
export function $(id) { return document.getElementById(id); }

export function escHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch (e) {
    return dateStr;
  }
}

export async function getToken() {
  const user = auth.currentUser;
  if (!user) return null;
  currentToken = await user.getIdToken();
  return currentToken;
}

export async function apiFetch(url, options = {}) {
  const token = await getToken();
  if (!token) throw new Error('Not authenticated');
  const headers = { 'Authorization': 'Bearer ' + token, ...options.headers };
  // Only set Content-Type for requests with a body (POST, PUT, etc.)
  if (options.body || options.method === 'POST' || options.method === 'PUT') {
    headers['Content-Type'] = 'application/json';
  }
  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'Request failed (' + res.status + ')');
  }
  return res.json();
}

export function showNotification(message, type) {
  const notif = document.createElement('div');
  notif.className = 'nla-notification nla-notification-' + type;
  notif.textContent = message;
  notif.setAttribute('role', 'status');
  notif.setAttribute('aria-live', 'polite');
  document.body.appendChild(notif);
  setTimeout(function() { notif.remove(); }, 5000);
}

export function slugify(title) {
  return title
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Returns the API URLs object set during init().
 * Panel modules use this to get endpoint URLs.
 */
export function getApiUrls() {
  return apiUrls;
}

// --- Navigation ---

// Track new-post panel initialization state
let newPostPanelInitialized = false;
let newPostPanelDefaultHTML = null;

/**
 * Switch to a named panel.
 * Hides all panels, shows the target, updates sidebar active state,
 * dynamically imports and calls the appropriate panel module loader.
 *
 * @param {string} panelName - Panel identifier (e.g. 'dashboard', 'posts', 'new-post')
 */
export async function switchPanel(panelName) {
  const navItems = document.querySelectorAll('.nla-nav-item');
  const panels = document.querySelectorAll('.nla-panel');

  // Remove active state from all nav items and hide all panels
  navItems.forEach(n => n.classList.remove('active'));
  panels.forEach(p => { p.classList.remove('active'); p.hidden = true; });

  // Activate the clicked nav item
  const navBtn = document.querySelector('[data-panel="' + panelName + '"]');
  if (navBtn) navBtn.classList.add('active');

  // Show the target panel
  const panel = $('panel-' + panelName);
  if (panel) { panel.classList.add('active'); panel.hidden = false; }

  // Hide post detail panel when switching panels
  const detailPanel = document.getElementById('post-detail-panel');
  if (detailPanel) detailPanel.hidden = true;

  // Close mobile sidebar
  const sidebar = $('nla-sidebar');
  const overlay = $('nla-sidebar-overlay');
  if (sidebar) sidebar.classList.remove('open');
  if (overlay) overlay.classList.remove('open');

  // Dynamically import and call the appropriate panel module loader
  if (panelName === 'dashboard' || panelName === 'overview') {
    const { loadOverview } = await import('./dashboard.js');
    loadOverview();
  } else if (panelName === 'posts') {
    const { loadPostsPanel } = await import('./posts.js');
    loadPostsPanel();
  } else if (panelName === 'new-post') {
    const { initNewPostPanel, resetToCreateMode } = await import('./new-post.js');
    if (!newPostPanelInitialized) {
      // Store default HTML on first init for restore capability
      const newPostPanel = $('panel-new-post');
      if (newPostPanel && !newPostPanelDefaultHTML) {
        newPostPanelDefaultHTML = newPostPanel.innerHTML;
      }
      initNewPostPanel();
      newPostPanelInitialized = true;
    } else if (!$('post-creation-form')) {
      // Panel was replaced by editPost, restore it
      const newPostPanel = $('panel-new-post');
      if (newPostPanel && newPostPanelDefaultHTML) {
        newPostPanel.innerHTML = newPostPanelDefaultHTML;
        newPostPanelInitialized = false;
        initNewPostPanel();
        newPostPanelInitialized = true;
      }
    } else {
      // Panel exists but may be in edit mode — reset to create mode
      resetToCreateMode();
    }
  } else if (panelName === 'compose') {
    const { loadPosts } = await import('./compose.js');
    loadPosts();
  } else if (panelName === 'subscribers') {
    const { loadSubscribers } = await import('./subscribers.js');
    loadSubscribers();
  } else if (panelName === 'analytics') {
    const { loadAnalytics } = await import('./analytics.js');
    loadAnalytics();
  } else if (panelName === 'downloads') {
    const { loadDownloads } = await import('./downloads.js');
    loadDownloads();
  }
}

/**
 * Wire up sidebar nav item click handlers.
 * Each nav item has a data-panel attribute that maps to a panel name.
 */
function initNavigation() {
  const navItems = document.querySelectorAll('.nla-nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const panelName = item.dataset.panel;
      // Map 'dashboard' data-panel value to 'overview' loader (or handle directly)
      switchPanel(panelName);
    });
  });

  // Mobile sidebar toggle
  const mobileToggle = $('nla-mobile-toggle');
  if (mobileToggle) {
    mobileToggle.addEventListener('click', () => {
      $('nla-sidebar').classList.toggle('open');
      $('nla-sidebar-overlay').classList.toggle('open');
    });
  }

  // Overlay click closes sidebar
  const overlay = $('nla-sidebar-overlay');
  if (overlay) {
    overlay.addEventListener('click', () => {
      $('nla-sidebar').classList.remove('open');
      $('nla-sidebar-overlay').classList.remove('open');
    });
  }

  // Config submenu toggle
  const configToggle = $('config-toggle');
  if (configToggle) {
    configToggle.addEventListener('click', () => {
      const items = $('config-items');
      const arrow = configToggle.querySelector('.nla-submenu-arrow');
      items.hidden = !items.hidden;
      arrow.textContent = items.hidden ? '›' : '‹';
    });
  }
}

// Expose switchPanel on window for inline onclick handlers in HTML
window.switchPanel = switchPanel;

// --- Initialization ---

/**
 * Initialize the admin panel.
 * Called from the HTML bootstrap script with Firebase config and API URLs.
 *
 * @param {Object} config
 * @param {Object} config.firebaseConfig - Firebase app config (apiKey, authDomain, projectId)
 * @param {Object} config.api - API endpoint URLs (send, analytics, subscribers, import, createPost, generatePost)
 */
export function init(config) {
  // Store API URLs for use by apiFetch and panel modules
  apiUrls = config.api;

  // Initialize Firebase
  const app = initializeApp(config.firebaseConfig);
  auth = getAuth(app);
  const provider = new GoogleAuthProvider();

  // DOM references
  const authEl = $('nla-auth');
  const dashEl = $('nla-dashboard');

  // Sign-in button: Google popup
  $('nla-google-signin').addEventListener('click', () => {
    signInWithPopup(auth, provider).catch(err => {
      console.error('Sign-in error:', err);
    });
  });

  // Sign-out button
  $('nla-signout').addEventListener('click', () => {
    signOut(auth);
  });

  // Wire up sidebar navigation
  initNavigation();

  // Auth state listener: show/hide login vs dashboard
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      hide(authEl);
      show(dashEl);
      $('nla-user-email').textContent = user.email;
      // Load dashboard overview on sign-in
      const { loadOverview } = await import('./dashboard.js');
      loadOverview();
    } else {
      show(authEl);
      hide(dashEl);
      currentToken = null;
    }
  });
}
