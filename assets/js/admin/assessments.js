/**
 * Admin Panel — Assessments Module
 *
 * Lists AI Job Risk Assessment submissions in a Grid.js table.
 * Clicking a row opens the user's dashboard in a new tab.
 */

import { show, hide, $, apiFetch, formatDate, escHtml, getApiUrls } from './main.js';

let assessmentsGrid = null;

/**
 * Load the assessments panel.
 */
export async function loadAssessments() {
  const loading = $('assessments-loading');
  const error = $('assessments-error');
  const content = $('assessments-content');

  show(loading); hide(error); hide(content);

  try {
    const API = getApiUrls();
    const data = await apiFetch(API.listAssessments);
    const assessments = data.assessments || [];

    hide(loading); show(content);

    if (assessments.length === 0) {
      content.innerHTML = '<p class="nla-dash-empty">No assessments submitted yet.</p>';
      return;
    }

    // Destroy existing grid
    if (assessmentsGrid) { assessmentsGrid.destroy(); assessmentsGrid = null; }
    content.innerHTML = '';

    assessmentsGrid = new gridjs.Grid({
      columns: [
        { name: 'Name', sort: true },
        { name: 'Email', sort: true },
        { name: 'Job Title', sort: true },
        { name: 'Score', sort: true, formatter: function(cell, row) {
          if (cell === null) return '—';
          var level = row.cells[7].data || '';
          var color = level === 'High' ? '#DC2626' : level === 'Medium' ? '#D97706' : '#0D9488';
          return gridjs.html('<span style="font-weight:700;color:' + color + '">' + cell + '/100</span> <span style="font-size:0.7rem;color:' + color + '">' + level + '</span>');
        }},
        { name: 'Country', sort: true },
        { name: 'Date', sort: true, formatter: function(cell) { return cell ? formatDate(cell) : '—'; } },
        { name: 'Actions', sort: false, formatter: function(_, row) {
          var token = row.cells[8].data;
          if (!token) return '—';
          return gridjs.html('<button class="nla-btn-sm" onclick="window.open(\'/tools/ai-job-risk-report/?token=' + token + '\', \'_blank\')">View Report</button>');
        }},
        { name: 'level', hidden: true },
        { name: 'token', hidden: true }
      ],
      data: assessments.map(function(a) {
        return [
          a.name,
          a.email,
          a.jobTitle,
          a.riskScore,
          a.country,
          a.submittedAt,
          '',
          a.riskLevel,
          a.reportToken || a.tokenHash
        ];
      }),
      search: { enabled: true, placeholder: 'Search by name, job title, country...' },
      sort: true,
      pagination: { enabled: true, limit: 25 },
      className: {
        container: 'nla-gridjs',
        table: 'nla-gridjs-table',
        th: 'nla-gridjs-th',
        td: 'nla-gridjs-td'
      }
    }).render(content);

  } catch (err) {
    hide(loading);
    error.textContent = err.message;
    show(error);
  }
}
