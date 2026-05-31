/**
 * Admin Panel — Lexicon Module
 * CRUD + AI generation for lexicon terms.
 */

import { show, hide, $, apiFetch, escHtml, getApiUrls, showNotification } from './main.js';

let lexiconGrid = null;

export async function loadLexicon() {
  const loading = $('lexicon-loading');
  const error = $('lexicon-error');
  const content = $('lexicon-content');

  show(loading); hide(error); hide(content);

  try {
    // Read from embedded Jekyll data (same pattern as posts)
    let terms = [];
    const scriptEl = document.getElementById('lexicon-data');
    if (scriptEl && scriptEl.textContent.trim()) {
      terms = JSON.parse(scriptEl.textContent);
    }

    hide(loading); show(content);
    renderTermsList(terms);
  } catch (err) {
    hide(loading);
    error.textContent = err.message;
    show(error);
  }
}

function renderTermsList(terms) {
  const listEl = $('lexicon-list');
  if (!listEl) return;

  if (lexiconGrid) { lexiconGrid.destroy(); lexiconGrid = null; }
  listEl.innerHTML = '';

  if (terms.length === 0) {
    listEl.innerHTML = '<p class="nla-dash-empty">No terms yet. Generate some using AI.</p>';
    return;
  }

  lexiconGrid = new gridjs.Grid({
    columns: [
      { name: 'Term', sort: true },
      { name: 'Topic', sort: true, formatter: (cell) => gridjs.html('<span class="nla-badge">' + escHtml((cell || '').replace(/-/g, ' ')) + '</span>') },
      { name: 'Actions', sort: false, formatter: (cell) => {
        var slug = cell;
        return gridjs.html(
          '<button class="nla-btn-sm" onclick="editLexiconTerm(\'' + slug + '\')">Edit</button> ' +
          '<button class="nla-btn-sm" onclick="previewLexiconTerm(\'' + slug + '\')">Preview</button>'
        );
      }}
    ],
    data: terms.map(t => [t.name, t.topic || '—', t.slug]),
    search: { enabled: true, placeholder: 'Search terms...' },
    sort: true,
    pagination: { enabled: true, limit: 20 },
    className: { container: 'nla-gridjs', table: 'nla-gridjs-table', th: 'nla-gridjs-th', td: 'nla-gridjs-td' }
  }).render(listEl);
}

// --- Window functions for Grid.js onclick ---
window.editLexiconTerm = async function(id) {
  // Read from embedded data (id is the slug here)
  let terms = [];
  const scriptEl = document.getElementById('lexicon-data');
  if (scriptEl && scriptEl.textContent.trim()) {
    terms = JSON.parse(scriptEl.textContent);
  }
  const term = terms.find(t => t.slug === id || t.name === id);
  if (!term) { showNotification('Term not found', 'error'); return; }
  showTermForm(term);
};

window.previewLexiconTerm = function(slug) {
  window.open('/lexicon/' + slug + '/', '_blank');
};

window.deleteLexiconTerm = async function(id) {
  if (!confirm('Delete this term?')) return;
  const API = getApiUrls();
  try {
    await apiFetch(API.manageLexicon + '?action=delete', { method: 'POST', body: JSON.stringify({ id }) });
    showNotification('Term deleted', 'success');
    loadLexicon();
  } catch (err) { showNotification(err.message, 'error'); }
};

function showTermForm(term) {
  const formEl = $('lexicon-form');
  const listEl = $('lexicon-list');
  const actionsEl = $('lexicon-actions');
  if (!formEl) return;

  hide(listEl); hide(actionsEl); show(formEl);

  $('lex-form-id').value = term ? term.id || '' : '';
  $('lex-form-name').value = term ? term.name || '' : '';
  $('lex-form-slug').value = term ? term.slug || '' : '';
  $('lex-form-pos').value = term ? term.pos || 'n.' : 'n.';
  $('lex-form-definition').value = term ? term.definition || '' : '';
  $('lex-form-topic').value = term ? term.topic || 'slow-decision-cultures' : 'slow-decision-cultures';
  $('lex-form-explanation').value = term ? term.explanation || '' : '';
  $('lex-form-example').value = term ? term.example || '' : '';
  $('lex-form-why').value = term ? term.why_it_matters || '' : '';
  $('lex-form-wrong').value = term ? term.teams_get_wrong || '' : '';
  $('lex-form-strong').value = term ? term.strong_teams || '' : '';
  $('lex-form-keywords').value = term ? (term.keywords || []).join(', ') : '';
}

window.showNewTermForm = function() { showTermForm(null); };

window.cancelTermForm = function() {
  hide($('lexicon-form'));
  show($('lexicon-list'));
  show($('lexicon-actions'));
};

window.saveTermForm = async function() {
  const API = getApiUrls();
  const payload = {
    name: $('lex-form-name').value.trim(),
    slug: $('lex-form-slug').value.trim() || $('lex-form-name').value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    pos: $('lex-form-pos').value,
    definition: $('lex-form-definition').value.trim(),
    topic: $('lex-form-topic').value || 'slow-decision-cultures',
    explanation: $('lex-form-explanation').value.trim(),
    example: $('lex-form-example').value.trim(),
    why_it_matters: $('lex-form-why').value.trim(),
    teams_get_wrong: $('lex-form-wrong').value.trim(),
    strong_teams: $('lex-form-strong').value.trim(),
    keywords: $('lex-form-keywords').value.split(',').map(s => s.trim()).filter(Boolean),
  };

  if (!payload.name) { showNotification('Name is required', 'error'); return; }

  // Show publishing state
  var saveBtn = document.querySelector('#lexicon-form .nla-btn-primary');
  if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'Publishing…'; }

  try {
    // Publish to GitHub via Cloud Function
    const result = await apiFetch(API.manageLexicon + '?action=publish', { method: 'POST', body: JSON.stringify(payload) });

    showNotification('Term published to GitHub! Building…', 'success');
    if (saveBtn) { saveBtn.textContent = '☁️ Saved to GitHub'; }

    // Poll for deployment (check if the page is live)
    pollLexiconDeployment(payload.slug, saveBtn);

  } catch (err) {
    showNotification('Publish failed: ' + err.message, 'error');
    if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = 'Publish'; }
  }
};

/**
 * Poll for lexicon term deployment by checking if the page is accessible.
 */
function pollLexiconDeployment(slug, btn) {
  var attempts = 0;
  var maxAttempts = 18; // 3 minutes

  var interval = setInterval(async function() {
    attempts++;
    if (attempts > maxAttempts) {
      clearInterval(interval);
      if (btn) { btn.disabled = false; btn.textContent = 'Publish'; }
      return;
    }

    if (btn) { btn.textContent = '🔄 Building… (' + (attempts * 10) + 's)'; }

    try {
      var res = await fetch('/lexicon/' + slug + '/', { method: 'HEAD' });
      if (res.ok) {
        clearInterval(interval);
        showNotification('Term is live!', 'success');
        if (btn) { btn.textContent = '✓ Published'; btn.disabled = false; }
        setTimeout(function() {
          if (btn) btn.textContent = 'Publish';
          cancelTermForm();
          loadLexicon();
        }, 3000);
      }
    } catch (e) { /* continue polling */ }
  }, 10000);
}

// --- AI Generation ---
window.generateTermIdeas = async function() {
  const API = getApiUrls();
  const statusEl = $('lexicon-gen-status');
  const resultsEl = $('lexicon-gen-results');

  statusEl.textContent = 'Generating…';
  resultsEl.innerHTML = '';

  try {
    const result = await apiFetch(API.manageLexicon + '?action=generate', {
      method: 'POST',
      body: JSON.stringify({
        pillar: $('lex-gen-pillar') ? $('lex-gen-pillar').value : '',
        tone: $('lex-gen-tone') ? $('lex-gen-tone').value : 'sharp',
        count: 10
      })
    });

    statusEl.textContent = '✓ Generated ' + (result.ideas || []).length + ' ideas';

    var html = '';
    (result.ideas || []).forEach(function(idea) {
      html += '<div class="nla-lex-idea">';
      html += '<strong>' + escHtml(idea.name) + '</strong> (' + escHtml(idea.pos) + ') ';
      html += '<span>' + escHtml(idea.definition) + '</span>';
      html += '<div class="nla-lex-idea-meta">' + escHtml(idea.topic) + ' · ' + escHtml(idea.seo_angle || '') + '</div>';
      html += '<button class="nla-btn-sm" onclick="expandTermIdea(\'' + escHtml(idea.name).replace(/'/g, "\\'") + '\',\'' + escHtml(idea.definition).replace(/'/g, "\\'") + '\',\'' + escHtml(idea.topic) + '\')">Use this →</button>';
      html += '</div>';
    });
    resultsEl.innerHTML = html;
  } catch (err) {
    statusEl.textContent = '✗ ' + err.message;
  }
};

window.expandTermIdea = async function(name, definition, topic) {
  const API = getApiUrls();
  const statusEl = $('lexicon-gen-status');
  statusEl.textContent = 'Expanding "' + name + '"…';

  try {
    const result = await apiFetch(API.manageLexicon + '?action=expand', {
      method: 'POST',
      body: JSON.stringify({ name, definition, topic })
    });

    const expanded = result.expanded;
    // Pre-fill the form with expanded data
    showTermForm({
      name: name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      pos: 'n.',
      definition: definition,
      topic: topic,
      explanation: expanded.explanation || '',
      example: expanded.example || '',
      why_it_matters: expanded.why_it_matters || '',
      teams_get_wrong: expanded.teams_get_wrong || '',
      strong_teams: expanded.strong_teams || '',
      related_terms: expanded.related_terms || [],
      keywords: expanded.keywords || [],
    });

    statusEl.textContent = '✓ Expanded — review and save';
  } catch (err) {
    statusEl.textContent = '✗ ' + err.message;
  }
};


// --- AI Tool Handlers ---

function getFormData() {
  return {
    name: $('lex-form-name').value.trim(),
    definition: $('lex-form-definition').value.trim(),
    explanation: $('lex-form-explanation').value.trim(),
    example: $('lex-form-example').value.trim(),
    topic: $('lex-form-topic').value || 'slow-decision-cultures',
  };
}

function showAiOutput(html) {
  var el = $('lex-ai-output');
  el.innerHTML = html;
  el.hidden = false;
}

window.lexAiAlternatives = async function() {
  var data = getFormData();
  if (!data.name) { showNotification('Enter a term name first', 'error'); return; }
  showAiOutput('<p>Generating alternatives…</p>');
  try {
    var API = getApiUrls();
    var result = await apiFetch(API.manageLexicon + '?action=alternatives', { method: 'POST', body: JSON.stringify(data) });
    var alts = result.alternatives || [];
    var html = '<strong>Alternative Names:</strong><ul>' + alts.map(function(a) { return '<li>' + escHtml(a) + '</li>'; }).join('') + '</ul>';
    showAiOutput(html);
  } catch (err) { showAiOutput('<p class="nla-error">' + escHtml(err.message) + '</p>'); }
};

window.lexAiSharpen = async function() {
  var data = getFormData();
  if (!data.name) { showNotification('Enter a term name first', 'error'); return; }
  showAiOutput('<p>Generating sharper definitions…</p>');
  try {
    var API = getApiUrls();
    var result = await apiFetch(API.manageLexicon + '?action=sharpen', { method: 'POST', body: JSON.stringify(data) });
    var defs = result.definitions || [];
    var html = '<strong>Sharper Definitions:</strong><ul>' + defs.map(function(d) {
      return '<li>' + escHtml(d) + ' <button class="nla-btn-sm" onclick="document.getElementById(\'lex-form-definition\').value=\'' + d.replace(/'/g, "\\'") + '\'">Use</button></li>';
    }).join('') + '</ul>';
    showAiOutput(html);
  } catch (err) { showAiOutput('<p class="nla-error">' + escHtml(err.message) + '</p>'); }
};

window.lexAiSEO = async function() {
  var data = getFormData();
  if (!data.name) { showNotification('Enter a term name first', 'error'); return; }
  showAiOutput('<p>Generating SEO metadata…</p>');
  try {
    var API = getApiUrls();
    var result = await apiFetch(API.manageLexicon + '?action=seo', { method: 'POST', body: JSON.stringify(data) });
    var seo = result.seo || {};
    var html = '<strong>SEO Title:</strong> ' + escHtml(seo.title || '') + '<br>';
    html += '<strong>Meta Description:</strong> ' + escHtml(seo.description || '') + '<br>';
    html += '<strong>Keywords:</strong> ' + (seo.keywords || []).join(', ');
    showAiOutput(html);
  } catch (err) { showAiOutput('<p class="nla-error">' + escHtml(err.message) + '</p>'); }
};

window.lexAiLinkedIn = async function() {
  var data = getFormData();
  if (!data.name) { showNotification('Enter a term name first', 'error'); return; }
  showAiOutput('<p>Generating LinkedIn post…</p>');
  try {
    var API = getApiUrls();
    var result = await apiFetch(API.manageLexicon + '?action=linkedin', { method: 'POST', body: JSON.stringify(data) });
    var post = (result.linkedin && result.linkedin.post) || '';
    var html = '<strong>LinkedIn Post:</strong><textarea class="nla-linkedin-textarea" rows="8" style="width:100%;margin-top:8px;">' + escHtml(post) + '</textarea>';
    html += '<button class="nla-btn-sm" style="margin-top:8px;" onclick="navigator.clipboard.writeText(this.previousElementSibling.value);this.textContent=\'✓ Copied\';setTimeout(()=>this.textContent=\'Copy\',2000)">Copy</button>';
    showAiOutput(html);
  } catch (err) { showAiOutput('<p class="nla-error">' + escHtml(err.message) + '</p>'); }
};

window.lexAiNote = async function() {
  var data = getFormData();
  if (!data.name) { showNotification('Enter a term name first', 'error'); return; }
  showAiOutput('<p>Generating newsletter note…</p>');
  try {
    var API = getApiUrls();
    var result = await apiFetch(API.manageLexicon + '?action=note', { method: 'POST', body: JSON.stringify(data) });
    var note = (result.note && result.note.note) || '';
    var html = '<strong>Newsletter Note:</strong><textarea class="nla-linkedin-textarea" rows="5" style="width:100%;margin-top:8px;">' + escHtml(note) + '</textarea>';
    html += '<button class="nla-btn-sm" style="margin-top:8px;" onclick="navigator.clipboard.writeText(this.previousElementSibling.value);this.textContent=\'✓ Copied\';setTimeout(()=>this.textContent=\'Copy\',2000)">Copy</button>';
    showAiOutput(html);
  } catch (err) { showAiOutput('<p class="nla-error">' + escHtml(err.message) + '</p>'); }
};
