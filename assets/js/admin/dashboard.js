/**
 * Admin Panel — Dashboard Module
 *
 * Renders a health-check dashboard with:
 * - Newsletter metrics (active, unsubscribed, bounced, latest edition, avg rates)
 * - Posts metrics (published total, this week, this month, latest post)
 * - Position breakdown (per-position post count + latest post)
 * - Recent activity feed (latest posts + editions combined)
 */

import { show, hide, $, apiFetch, formatDate, escHtml, getApiUrls, switchPanel } from './main.js';

/**
 * Compute post statistics from an array of post objects.
 * Pure function — no side effects or DOM access.
 */
export function computePostStats(posts) {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const published = posts.filter(p => p.status === 'published');

  const stats = {
    total: posts.length,
    published: published.length,
    draft: posts.filter(p => p.status === 'draft').length,
    archived: posts.filter(p => p.status === 'archived').length,
    thisWeek: published.filter(p => p.date !== '—' && new Date(p.date) >= weekAgo).length,
    thisMonth: published.filter(p => p.date !== '—' && new Date(p.date) >= monthStart).length,
    perPosition: {},
    latestPost: null
  };

  const positions = ['ai-operations', 'decision-authority', 'risk-intelligence', 'ai-and-work'];
  positions.forEach(function(tag) {
    const positionPosts = published.filter(p => (p.tags || []).includes(tag));
    const sorted = positionPosts.filter(p => p.date !== '—').sort((a, b) => new Date(b.date) - new Date(a.date));
    stats.perPosition[tag] = {
      count: positionPosts.length,
      latest: sorted.length > 0 ? { title: sorted[0].title, date: sorted[0].date } : null
    };
  });

  const sortedPublished = published.filter(p => p.date !== '—').sort((a, b) => new Date(b.date) - new Date(a.date));
  if (sortedPublished.length > 0) {
    stats.latestPost = { title: sortedPublished[0].title, date: sortedPublished[0].date };
  }

  return stats;
}

/**
 * Parse posts from the embedded JSON.
 */
function getPosts() {
  try {
    const scriptEl = $('posts-data');
    if (scriptEl && scriptEl.textContent.trim()) {
      const posts = JSON.parse(scriptEl.textContent);
      posts.forEach(function(post) {
        post.title = post.title || '—';
        post.slug = post.slug || '—';
        post.url = post.url || '—';
        post.date = post.date || '—';
        post.tags = post.tags || [];
        post.status = post.status || '—';
      });
      return posts;
    }
  } catch (e) { /* ignore */ }
  return [];
}

/**
 * Render the newsletter metrics section.
 */
function renderNewsletterMetrics(data, editions) {
  const container = $('dash-newsletter-metrics');
  if (!container) return;

  const latestEdition = editions.length > 0 ? editions[0] : null;

  // Compute average open/click rates from editions
  const editionsWithRates = editions.filter(e => e.openRate != null);
  const avgOpen = editionsWithRates.length > 0
    ? (editionsWithRates.reduce((sum, e) => sum + e.openRate, 0) / editionsWithRates.length).toFixed(1)
    : '—';
  const editionsWithClicks = editions.filter(e => e.clickRate != null);
  const avgClick = editionsWithClicks.length > 0
    ? (editionsWithClicks.reduce((sum, e) => sum + e.clickRate, 0) / editionsWithClicks.length).toFixed(1)
    : '—';

  container.innerHTML =
    '<div class="nla-dash-metric">' +
      '<span class="nla-dash-metric-value">' + (data.totalActive || 0) + '</span>' +
      '<span class="nla-dash-metric-label">Active subscribers</span>' +
    '</div>' +
    '<div class="nla-dash-metric">' +
      '<span class="nla-dash-metric-value">' + (data.totalUnsubscribed || 0) + '</span>' +
      '<span class="nla-dash-metric-label">Unsubscribed</span>' +
    '</div>' +
    '<div class="nla-dash-metric">' +
      '<span class="nla-dash-metric-value">' + (data.totalBounced || 0) + '</span>' +
      '<span class="nla-dash-metric-label">Bounced</span>' +
    '</div>' +
    '<div class="nla-dash-metric">' +
      '<span class="nla-dash-metric-value">' + (avgOpen !== '—' ? avgOpen + '%' : '—') + '</span>' +
      '<span class="nla-dash-metric-label">Avg open rate</span>' +
    '</div>' +
    '<div class="nla-dash-metric">' +
      '<span class="nla-dash-metric-value">' + (avgClick !== '—' ? avgClick + '%' : '—') + '</span>' +
      '<span class="nla-dash-metric-label">Avg click rate</span>' +
    '</div>' +
    '<div class="nla-dash-metric nla-dash-metric-wide">' +
      '<span class="nla-dash-metric-value nla-dash-metric-value-sm">' + (latestEdition ? escHtml(latestEdition.subject) : 'No editions yet') + '</span>' +
      '<span class="nla-dash-metric-label">Latest edition' + (latestEdition ? ' · ' + formatDate(latestEdition.sentAt) : '') + '</span>' +
    '</div>';
}

/**
 * Render the posts metrics section.
 */
function renderPostsMetrics(stats) {
  const container = $('dash-posts-metrics');
  if (!container) return;

  container.innerHTML =
    '<div class="nla-dash-metric">' +
      '<span class="nla-dash-metric-value">' + stats.published + '</span>' +
      '<span class="nla-dash-metric-label">Published posts</span>' +
    '</div>' +
    '<div class="nla-dash-metric">' +
      '<span class="nla-dash-metric-value">' + stats.thisWeek + '</span>' +
      '<span class="nla-dash-metric-label">This week</span>' +
    '</div>' +
    '<div class="nla-dash-metric">' +
      '<span class="nla-dash-metric-value">' + stats.thisMonth + '</span>' +
      '<span class="nla-dash-metric-label">This month</span>' +
    '</div>' +
    '<div class="nla-dash-metric nla-dash-metric-wide">' +
      '<span class="nla-dash-metric-value nla-dash-metric-value-sm">' + (stats.latestPost ? escHtml(stats.latestPost.title) : '—') + '</span>' +
      '<span class="nla-dash-metric-label">Latest post' + (stats.latestPost ? ' · ' + formatDate(stats.latestPost.date) : '') + '</span>' +
    '</div>';
}

/**
 * Render the position breakdown section.
 */
function renderPositions(stats) {
  const container = $('dash-positions');
  if (!container) return;

  const positionNames = {
    'ai-operations': 'AI Operations',
    'decision-authority': 'Decision Authority',
    'risk-intelligence': 'Risk Intelligence',
    'ai-and-work': 'AI and Work'
  };

  const positionColors = {
    'ai-operations': '#9333EA',
    'decision-authority': '#0D9488',
    'risk-intelligence': '#DC2626',
    'ai-and-work': '#2563EB'
  };

  let html = '';
  Object.keys(positionNames).forEach(function(tag) {
    const pos = stats.perPosition[tag];
    const color = positionColors[tag];
    const latestTitle = pos.latest ? escHtml(pos.latest.title) : 'No posts yet';
    const latestDate = pos.latest ? formatDate(pos.latest.date) : '';

    html += '<div class="nla-dash-position-card">' +
      '<div class="nla-dash-position-header">' +
        '<span class="nla-dash-position-dot" style="background:' + color + '"></span>' +
        '<span class="nla-dash-position-name">' + positionNames[tag] + '</span>' +
        '<span class="nla-dash-position-count">' + pos.count + ' posts</span>' +
      '</div>' +
      '<div class="nla-dash-position-latest">' +
        '<span class="nla-dash-position-latest-title">' + latestTitle + '</span>' +
        (latestDate ? '<span class="nla-dash-position-latest-date">' + latestDate + '</span>' : '') +
      '</div>' +
      '<button class="nla-dash-position-link" onclick="switchPanel(\'posts\');setTimeout(function(){var s=document.getElementById(\'posts-filter-position\');if(s){s.value=\'' + tag + '\';s.dispatchEvent(new Event(\'change\'))}},300)" type="button">View posts →</button>' +
    '</div>';
  });

  container.innerHTML = html;
}

/**
 * Render the recent activity feed.
 */
function renderActivity(posts, editions) {
  const container = $('dash-activity');
  if (!container) return;

  // Combine recent posts and editions into a single feed sorted by date
  const items = [];

  // Add recent published posts (last 5)
  const recentPosts = posts
    .filter(p => p.status === 'published' && p.date !== '—')
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  recentPosts.forEach(function(p) {
    items.push({ type: 'post', title: p.title, date: p.date, url: p.url });
  });

  // Add recent editions (last 5)
  editions.slice(0, 5).forEach(function(e) {
    items.push({ type: 'edition', title: e.subject, date: e.sentAt, id: e.id, recipients: e.recipientCount });
  });

  // Sort combined by date descending
  items.sort((a, b) => new Date(b.date) - new Date(a.date));

  if (items.length === 0) {
    container.innerHTML = '<p class="nla-dash-empty">No recent activity.</p>';
    return;
  }

  let html = '<div class="nla-dash-activity-list">';
  items.slice(0, 8).forEach(function(item) {
    const icon = item.type === 'post' ? '📝' : '✉️';
    const label = item.type === 'post' ? 'Published' : 'Sent to ' + (item.recipients || '?') + ' subscribers';
    const action = item.type === 'edition'
      ? ' onclick="viewEditionFromOverview(\'' + item.id + '\')"'
      : '';

    html += '<div class="nla-dash-activity-item"' + action + '>' +
      '<span class="nla-dash-activity-icon">' + icon + '</span>' +
      '<div class="nla-dash-activity-content">' +
        '<span class="nla-dash-activity-title">' + escHtml(item.title) + '</span>' +
        '<span class="nla-dash-activity-meta">' + label + ' · ' + formatDate(item.date) + '</span>' +
      '</div>' +
    '</div>';
  });
  html += '</div>';

  container.innerHTML = html;
}

/**
 * Main dashboard loader. Fetches newsletter data and renders all sections.
 */
export async function loadOverview() {
  const API = getApiUrls();
  const loading = $('overview-loading');
  const error = $('overview-error');
  const content = $('overview-content');
  show(loading); hide(error); hide(content);

  const posts = getPosts();
  const stats = computePostStats(posts);

  let newsletterData = { totalActive: 0, totalUnsubscribed: 0, totalBounced: 0 };
  let editions = [];

  try {
    newsletterData = await apiFetch(API.analytics + '?type=overview');
  } catch (e) {
    // Newsletter API might fail — continue with posts data
  }

  try {
    const editionsData = await apiFetch(API.analytics + '?type=editions');
    editions = editionsData.editions || [];
  } catch (e) {
    // Editions might fail — continue
  }

  hide(loading); show(content);

  renderNewsletterMetrics(newsletterData, editions);
  renderPostsMetrics(stats);
  renderPositions(stats);
  renderActivity(posts, editions);
}

/**
 * Kept for backward compatibility with existing renderPostStats calls.
 */
export function renderPostStats() {
  // No-op — dashboard now renders inline
}

/**
 * Initialize dashboard event handlers.
 */
export function initDashboard() {
  // No additional handlers needed — interactions are inline
}
