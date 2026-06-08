/**
 * Admin Panel — Vocab Engine Analytics Module
 */

import { show, hide, $, escHtml, apiFetch, getApiUrls, formatDate } from './main.js';

let vocabGrid = null;

export async function loadVocabAnalytics() {
  const loading = $('vocab-analytics-loading');
  const error = $('vocab-analytics-error');
  const content = $('vocab-analytics-content');
  show(loading); hide(error); hide(content);

  try {
    const data = await apiFetch(getApiUrls().analytics + '?type=vocabAnalytics');

    hide(loading); show(content);

    // Render metrics
    const metrics = $('vocab-analytics-metrics');
    metrics.innerHTML =
      '<div class="nla-dash-metric"><span class="nla-dash-metric-value">' + data.totalLearners + '</span><span class="nla-dash-metric-label">Registered Learners</span></div>' +
      '<div class="nla-dash-metric"><span class="nla-dash-metric-value">' + data.totalXp + '</span><span class="nla-dash-metric-label">Total XP Earned</span></div>' +
      '<div class="nla-dash-metric"><span class="nla-dash-metric-value">' + data.totalWordsLearned + '</span><span class="nla-dash-metric-label">Total Words Learned</span></div>' +
      '<div class="nla-dash-metric"><span class="nla-dash-metric-value">' + data.avgXpPerLearner + '</span><span class="nla-dash-metric-label">Avg XP / Learner</span></div>';

    // Render grid
    if (vocabGrid) { vocabGrid.destroy(); vocabGrid = null; }

    if (data.learners.length === 0) {
      $('vocab-analytics-grid').innerHTML = '<div class="nla-empty"><div class="nla-empty-icon">🗣️</div>No learners yet.</div>';
      return;
    }

    vocabGrid = new window.gridjs.Grid({
      columns: [
        { name: 'Name', sort: true },
        { name: 'XP', sort: true },
        { name: 'Words', sort: true },
        { name: 'Last Active', sort: true },
      ],
      data: data.learners.map(l => [
        l.name,
        l.xp,
        l.wordsLearned,
        formatDate(l.lastUpdated),
      ]),
      search: { enabled: true, placeholder: 'Search learners...' },
      sort: true,
      pagination: { enabled: true, limit: 20 },
      className: {
        container: 'nla-gridjs',
        table: 'nla-gridjs-table',
        th: 'nla-gridjs-th',
        td: 'nla-gridjs-td',
      }
    }).render($('vocab-analytics-grid'));
  } catch (err) {
    hide(loading);
    error.textContent = err.message;
    show(error);
  }
}
