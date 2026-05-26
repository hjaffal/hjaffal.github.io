/**
 * Admin Panel — Dashboard Module
 *
 * Renders a health-check dashboard with:
 * - Newsletter metrics (active, unsubscribed, bounced, avg rates, last edition stats)
 * - Posts metrics (published total, this week, this month, latest post, posts-per-month chart)
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
 * Render the newsletter metrics section with last edition stats.
 */
function renderNewsletterMetrics(data, editions) {
  const container = $('dash-newsletter-metrics');
  if (!container) return;

  const latestEdition = editions.length > 0 ? editions[0] : null;

  // Compute average open/click rates
  const editionsWithRates = editions.filter(e => e.openRate != null);
  const avgOpen = editionsWithRates.length > 0
    ? (editionsWithRates.reduce((sum, e) => sum + e.openRate, 0) / editionsWithRates.length).toFixed(1)
    : '—';
  const editionsWithClicks = editions.filter(e => e.clickRate != null);
  const avgClick = editionsWithClicks.length > 0
    ? (editionsWithClicks.reduce((sum, e) => sum + e.clickRate, 0) / editionsWithClicks.length).toFixed(1)
    : '—';

  let html =
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
    '</div>';

  // Last edition statistics
  if (latestEdition) {
    html += '<div class="nla-dash-metric-group nla-dash-metric-wide">' +
      '<h4 class="nla-dash-metric-group-title">Last Edition</h4>' +
      '<div class="nla-dash-metric-group-content">' +
        '<span class="nla-dash-last-edition-title">' + escHtml(latestEdition.subject) + '</span>' +
        '<div class="nla-dash-last-edition-stats">' +
          '<span>' + (latestEdition.recipientCount || 0) + ' recipients</span>' +
          '<span>' + (latestEdition.openRate != null ? latestEdition.openRate.toFixed(1) + '% opened' : '— opened') + '</span>' +
          '<span>' + (latestEdition.clickRate != null ? latestEdition.clickRate.toFixed(1) + '% clicked' : '— clicked') + '</span>' +
          '<span>' + formatDate(latestEdition.sentAt) + '</span>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  container.innerHTML = html;
}

/**
 * Compute cumulative post count over time (only on days with posts).
 */
function getPostsCumulative(posts, numDays) {
  const now = new Date();
  const postDates = {};

  posts.forEach(function(p) {
    if (p.date === '—') return;
    var key = p.date.substring(0, 10);
    postDates[key] = (postDates[key] || 0) + 1;
  });

  var allDates = Object.keys(postDates).sort();
  if (allDates.length === 0) return [];

  var startDate;
  if (!numDays || numDays === 0) {
    startDate = new Date(allDates[0]);
  } else {
    startDate = new Date(now.getTime() - numDays * 24 * 60 * 60 * 1000);
  }

  var cumulative = 0;
  allDates.forEach(function(date) {
    if (new Date(date) < startDate) cumulative += postDates[date];
  });

  var points = [];
  allDates.forEach(function(date) {
    if (new Date(date) < startDate) return;
    if (new Date(date) > now) return;
    cumulative += postDates[date];
    var d = new Date(date);
    points.push({
      label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      count: cumulative
    });
  });

  return points;
}

/**
 * Render the posts metrics section (without chart — chart is separate).
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

  const items = [];

  const recentPosts = posts
    .filter(p => p.status === 'published' && p.date !== '—')
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  recentPosts.forEach(function(p) {
    items.push({ type: 'post', title: p.title, date: p.date, url: p.url });
  });

  editions.slice(0, 5).forEach(function(e) {
    items.push({ type: 'edition', title: e.subject, date: e.sentAt, id: e.id, recipients: e.recipientCount });
  });

  items.sort((a, b) => new Date(b.date) - new Date(a.date));

  if (items.length === 0) {
    container.innerHTML = '<p class="nla-dash-empty">No recent activity.</p>';
    return;
  }

  let html = '<div class="nla-dash-activity-list">';
  items.slice(0, 8).forEach(function(item) {
    const icon = item.type === 'post' ? '📝' : '✉️';
    const label = item.type === 'post' ? 'Published' : 'Sent to ' + (item.recipients || '?') + ' subscribers';
    const encodedTitle = btoa(unescape(encodeURIComponent(item.title)));

    let action = '';
    if (item.type === 'edition') {
      action = ' data-action="view-edition" data-id="' + item.id + '"';
    } else if (item.type === 'post') {
      action = ' data-action="edit-post" data-title="' + encodedTitle + '"';
    }

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

  // Event delegation for activity items
  container.addEventListener('click', function(e) {
    const item = e.target.closest('[data-action]');
    if (!item) return;
    const action = item.dataset.action;
    if (action === 'view-edition' && window.viewEditionFromOverview) {
      window.viewEditionFromOverview(item.dataset.id);
    } else if (action === 'edit-post' && window.editPost) {
      const title = decodeURIComponent(escape(atob(item.dataset.title)));
      window.editPost(title);
    }
  });
}

/**
 * Render a simple SVG line chart.
 * @param {Array} data - Array of {label, value} objects
 * @param {string} color - Line color
 * @param {string} title - Chart title
 * @returns {string} HTML string
 */
function renderLineChart(data, color, title) {
  if (!data || data.length === 0) return '<p class="nla-dash-empty">No data available.</p>';

  const width = 100;
  const height = 40;
  const maxVal = Math.max(...data.map(d => d.value), 1);
  const points = data.map(function(d, i) {
    const x = (i / (data.length - 1)) * width;
    const y = height - (d.value / maxVal) * (height - 4);
    return x.toFixed(1) + ',' + y.toFixed(1);
  }).join(' ');

  const lastVal = data[data.length - 1].value;
  const firstVal = data[0].value;
  const change = lastVal - firstVal;
  const changeStr = change >= 0 ? '+' + change : '' + change;

  return '<div class="nla-dash-line-chart">' +
    '<div class="nla-dash-line-chart-header">' +
      '<span class="nla-dash-line-chart-title">' + title + '</span>' +
      '<span class="nla-dash-line-chart-value">' + lastVal + ' <small style="color:' + (change >= 0 ? '#10B981' : '#EF4444') + '">' + changeStr + '</small></span>' +
    '</div>' +
    '<svg viewBox="0 0 ' + width + ' ' + height + '" preserveAspectRatio="none" class="nla-dash-line-svg">' +
      '<polyline points="' + points + '" fill="none" stroke="' + color + '" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<polyline points="0,' + height + ' ' + points + ' ' + width + ',' + height + '" fill="' + color + '" fill-opacity="0.08" stroke="none"/>' +
    '</svg>' +
    '<div class="nla-dash-line-chart-labels">' +
      '<span>' + data[0].label + '</span>' +
      '<span>' + data[data.length - 1].label + '</span>' +
    '</div>' +
  '</div>';
}

// --- Chart.js Interactive Charts ---

let subscriberChart = null;
let postsChart = null;
let subscriberGrowthData = null;
let allPostsData = null;

/**
 * Create or update the subscriber growth Chart.js line chart.
 */
function renderSubscriberChartJS(growthData, days) {
  const canvas = document.getElementById('dash-subscriber-canvas');
  if (!canvas || !growthData || !growthData.days) return;
  if (typeof Chart === 'undefined') { console.warn('Chart.js not loaded'); return; }

  subscriberGrowthData = growthData;

  // Filter to requested range (0 = all)
  const allDays = growthData.days;
  const sliced = days === 0 ? allDays : allDays.slice(-days);

  const labels = sliced.map(d => {
    const date = new Date(d.date);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  });
  const values = sliced.map(d => d.total);

  if (subscriberChart) {
    subscriberChart.data.labels = labels;
    subscriberChart.data.datasets[0].data = values;
    subscriberChart.update();
    return;
  }

  subscriberChart = new Chart(canvas, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Subscribers',
        data: values,
        borderColor: '#9333EA',
        backgroundColor: 'rgba(147, 51, 234, 0.06)',
        borderWidth: 2,
        pointRadius: 2,
        pointHoverRadius: 5,
        pointBackgroundColor: '#9333EA',
        fill: true,
        tension: 0.3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#0F172A',
          titleFont: { size: 11 },
          bodyFont: { size: 12, weight: '600' },
          padding: 10,
          cornerRadius: 6
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { size: 10 }, maxTicksLimit: 8, color: '#94A3B8' }
        },
        y: {
          grid: { color: 'rgba(148,163,184,0.1)' },
          ticks: { font: { size: 10 }, color: '#94A3B8' },
          beginAtZero: false
        }
      }
    }
  });
}

/**
 * Create or update the cumulative posts Chart.js line chart.
 */
function renderPostsChartJS(posts, days) {
  const canvas = document.getElementById('dash-posts-canvas');
  if (!canvas) return;
  if (typeof Chart === 'undefined') { console.warn('Chart.js not loaded'); return; }

  allPostsData = posts;

  const data = getPostsCumulative(posts, days);
  const labels = data.map(d => d.label);
  const values = data.map(d => d.count);

  if (postsChart) {
    postsChart.data.labels = labels;
    postsChart.data.datasets[0].data = values;
    postsChart.update();
    return;
  }

  postsChart = new Chart(canvas, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Total Posts',
        data: values,
        borderColor: '#2563EB',
        backgroundColor: 'rgba(37, 99, 235, 0.06)',
        borderWidth: 2,
        pointRadius: 2,
        pointHoverRadius: 5,
        pointBackgroundColor: '#2563EB',
        fill: true,
        tension: 0.3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#0F172A',
          titleFont: { size: 11 },
          bodyFont: { size: 12, weight: '600' },
          padding: 10,
          cornerRadius: 6
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { size: 10 }, maxTicksLimit: 8, color: '#94A3B8' }
        },
        y: {
          grid: { color: 'rgba(148,163,184,0.1)' },
          ticks: { font: { size: 10 }, color: '#94A3B8', stepSize: 1 },
          beginAtZero: true
        }
      }
    }
  });
}

/**
 * Wire up date range buttons for charts.
 */
function initChartRangeButtons() {
  // Subscriber chart range
  const subRange = document.getElementById('sub-chart-range');
  if (subRange) {
    subRange.addEventListener('click', function(e) {
      const btn = e.target.closest('.nla-dash-range-btn');
      if (!btn) return;
      subRange.querySelectorAll('.nla-dash-range-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const days = parseInt(btn.dataset.range);
      if (subscriberGrowthData) renderSubscriberChartJS(subscriberGrowthData, days);
    });
  }

  // Posts chart range
  const postsRange = document.getElementById('posts-chart-range');
  if (postsRange) {
    postsRange.addEventListener('click', function(e) {
      const btn = e.target.closest('.nla-dash-range-btn');
      if (!btn) return;
      postsRange.querySelectorAll('.nla-dash-range-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const days = parseInt(btn.dataset.range);
      if (allPostsData) renderPostsChartJS(allPostsData, days);
    });
  }
}

/**
 * Render subscriber growth chart (called from loadOverview).
 */
function renderSubscriberChart(growthData) {
  renderSubscriberChartJS(growthData, 30);
}

/**
 * Main dashboard loader.
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
  let subscriberGrowth = null;

  try {
    newsletterData = await apiFetch(API.analytics + '?type=overview');
  } catch (e) { /* continue */ }

  try {
    const editionsData = await apiFetch(API.analytics + '?type=editions');
    editions = editionsData.editions || [];
  } catch (e) { /* continue */ }

  try {
    subscriberGrowth = await apiFetch(API.analytics + '?type=subscriberGrowth');
  } catch (e) { /* continue */ }

  hide(loading); show(content);

  // Ensure activity link handlers are available
  if (!window.viewEditionFromOverview) {
    import('./analytics.js').then(function(m) { window.viewEditionFromOverview = m.viewEditionFromOverview; });
  }
  if (!window.editPost) {
    import('./new-post.js').then(function(m) { window.editPost = m.editPost; });
  }

  renderNewsletterMetrics(newsletterData, editions);
  renderSubscriberChart(subscriberGrowth);
  renderPostsMetrics(stats);
  renderPostsChartJS(posts, 90);
  renderPositions(stats);
  renderActivity(posts, editions);
  initChartRangeButtons();
}

export function renderPostStats() { /* no-op */ }
export function initDashboard() { /* no-op */ }
