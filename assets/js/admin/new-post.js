/**
 * Admin Panel — New Post Module
 *
 * Handles post creation form setup, character counters, mode toggle,
 * EasyMDE markdown editor initialization, AI direction card selection
 * and generation flow, form validation and submission to the createPost
 * Cloud Function, and the edit post placeholder flow.
 */

import { show, hide, $, escHtml, apiFetch, getApiUrls, showNotification, slugify, switchPanel } from './main.js';

// --- Module State ---

/** Whether the new-post panel has been initialized */
let newPostPanelInitialized = false;

/** EasyMDE editor instance */
let easyMDE = null;

/** Default HTML of the new-post panel (stored on first init for restore) */
let newPostPanelDefaultHTML = null;

/** Currently selected AI direction position */
let selectedPosition = null;

/** State for the post currently being edited (filename, sha) */
let editingPostState = null;

/** Current draft ID (if editing a Firestore draft) */
let currentDraftId = null;

/** Generated metadata (topic, archetype, keywords) — set after AI generation */
let generatedTopic = null;
let generatedArchetype = null;
let generatedKeywords = null;

// --- Draft API Helpers ---

/**
 * Save the current form state as a draft to Firestore.
 * @param {boolean} silent - If true, don't show notification
 * @returns {Promise<string>} The draft ID
 */
async function saveDraft(silent) {
  const title = document.getElementById('post-title').value.trim();
  const slug = document.getElementById('post-slug').value.trim() || slugify(title);
  const selectedPositions = Array.from(document.querySelectorAll('#post-position-group input:checked')).map(cb => cb.value);
  const date = document.getElementById('post-date').value;
  const excerpt = document.getElementById('post-excerpt').value.trim();
  const metaTitle = document.getElementById('post-meta-title').value.trim();
  const metaDesc = document.getElementById('post-meta-desc').value.trim();
  const featuredImg = document.getElementById('post-featured-img').value.trim();
  const bodyMarkdown = getEditorContent();

  if (!title) {
    if (!silent) showNotification('Title is required to save draft.', 'error');
    return null;
  }

  const API = getApiUrls();
  const payload = {
    action: 'save',
    title,
    slug,
    content: bodyMarkdown,
    tags: selectedPositions,
    position: selectedPositions[0] || '',
    excerpt,
    metaTitle,
    metaDescription: metaDesc,
    featuredImage: featuredImg,
    publishDate: date,
    topic: generatedTopic || '',
    archetype: generatedArchetype || '',
    keywords: generatedKeywords || [],
  };

  if (currentDraftId) {
    payload.id = currentDraftId;
  }

  const result = await apiFetch(API.manageDrafts + '?action=save', {
    method: 'POST',
    body: JSON.stringify(payload)
  });

  currentDraftId = result.id;
  if (!silent) showNotification('Draft saved.', 'success');
  return result.id;
}

/**
 * Validate post content before publish. Returns warnings (non-blocking).
 */
function validateBeforePublish() {
  const body = getEditorContent();
  if (!body) return [];

  const warnings = [];

  // Internal links check (markdown links to hasanjaffal.com or relative paths)
  const internalLinks = (body.match(/\[.*?\]\(\/.*?\)/g) || []).length;
  if (internalLinks < 2) warnings.push('Fewer than 2 internal links');

  // External reference check (links to external URLs)
  const extLinks = (body.match(/\[.*?\]\(https?:\/\/(?!hasanjaffal).*?\)/g) || []).length;
  if (extLinks < 1) warnings.push('No external reference found');

  // Forced-position question check
  const questionMarks = (body.match(/\?/g) || []).length;
  if (questionMarks < 1) warnings.push('No question mark found (forced-position question missing)');

  // Comparison table check
  const hasTable = body.includes('|') && (body.includes('---') || body.includes('| -'));
  if (!hasTable) warnings.push('No comparison table or contrast block found');

  return warnings;
}

/**
 * Show validation warnings in a dismissible box.
 * Returns true if user can proceed (always true — non-blocking).
 */
function showValidationWarnings(warnings) {
  // Remove any existing warning box
  const existing = document.getElementById('publish-warnings');
  if (existing) existing.remove();

  if (warnings.length === 0) return true;

  const box = document.createElement('div');
  box.id = 'publish-warnings';
  box.className = 'nla-publish-warnings';
  box.innerHTML = '<div class="nla-publish-warnings-header"><strong>⚠ Quality warnings</strong><button type="button" onclick="this.parentElement.parentElement.remove()">✕</button></div>' +
    '<ul>' + warnings.map(function(w) { return '<li>' + w + '</li>'; }).join('') + '</ul>' +
    '<p class="nla-publish-warnings-note">These are advisory only. You can still publish.</p>';

  const form = document.getElementById('post-creation-form');
  if (form) {
    const actions = form.querySelector('.nla-form-actions');
    if (actions) actions.insertAdjacentElement('beforebegin', box);
  }
  return true;
}

/**
 * Publish the current draft (commit to GitHub).
 */
async function publishDraft() {
  // Run soft validation
  const warnings = validateBeforePublish();
  showValidationWarnings(warnings);

  if (!currentDraftId) {
    // Save first
    const id = await saveDraft(true);
    if (!id) return;
  }

  const API = getApiUrls();
  const publishBtn = document.getElementById('post-publish-btn');
  if (publishBtn) { publishBtn.disabled = true; publishBtn.textContent = 'Publishing…'; }

  try {
    const result = await apiFetch(API.manageDrafts + '?action=publish', {
      method: 'POST',
      body: JSON.stringify({ id: currentDraftId })
    });

    updateStatusBadge('saved_to_github');
    showNotification(result.message || 'Saved to GitHub. Building…', 'success');

    // Start polling for deployment status
    pollDeploymentStatus(currentDraftId);

  } catch (err) {
    showNotification('Publish failed: ' + err.message, 'error');
    updateStatusBadge('publish_failed');
    if (publishBtn) { publishBtn.disabled = false; publishBtn.textContent = 'Publish'; }
  }
}

/** Polling interval ID */
let deployPollInterval = null;

/**
 * Poll deployment status every 10s for up to 3 minutes.
 */
function pollDeploymentStatus(draftId) {
  if (deployPollInterval) clearInterval(deployPollInterval);

  const maxPolls = 18;
  let pollCount = 0;
  const publishBtn = document.getElementById('post-publish-btn');

  deployPollInterval = setInterval(async function() {
    pollCount++;
    if (pollCount > maxPolls) {
      clearInterval(deployPollInterval);
      deployPollInterval = null;
      if (publishBtn) { publishBtn.disabled = false; publishBtn.textContent = 'Publish'; }
      return;
    }

    try {
      const API = getApiUrls();
      const result = await apiFetch(API.manageDrafts + '?action=checkDeployment&id=' + draftId);
      updateStatusBadge(result.status);

      if (result.status === 'published') {
        clearInterval(deployPollInterval);
        deployPollInterval = null;
        showNotification('Post is live!', 'success');
        if (publishBtn) { publishBtn.textContent = '✓ Published'; }
        setTimeout(function() {
          if (publishBtn) { publishBtn.disabled = false; publishBtn.textContent = 'Publish'; }
        }, 5000);
      } else if (result.status === 'publish_failed') {
        clearInterval(deployPollInterval);
        deployPollInterval = null;
        showNotification('Build failed.', 'error');
        if (publishBtn) { publishBtn.disabled = false; publishBtn.textContent = 'Publish'; }
      }
    } catch (err) {
      // Silently continue polling
    }
  }, 10000);
}

/**
 * Open preview for the current draft.
 */
async function previewDraft() {
  if (!currentDraftId) {
    const id = await saveDraft(true);
    if (!id) {
      showNotification('Save the draft first (title required).', 'error');
      return;
    }
  }
  window.open('/newsletter/admin/preview/?id=' + currentDraftId, '_blank');
}

/**
 * Load a draft into the form by ID.
 */
async function loadDraftIntoForm(draftId) {
  const API = getApiUrls();
  try {
    const draft = await apiFetch(API.manageDrafts + '?action=get&id=' + draftId);
    currentDraftId = draftId;

    // Fill form fields
    const titleInput = document.getElementById('post-title');
    if (titleInput) titleInput.value = draft.title || '';
    const slugInput = document.getElementById('post-slug');
    if (slugInput) slugInput.value = draft.slug || '';
    const dateInput = document.getElementById('post-date');
    if (dateInput) dateInput.value = draft.publishDate || '';
    const excerptInput = document.getElementById('post-excerpt');
    if (excerptInput) excerptInput.value = draft.excerpt || '';
    const metaTitleInput = document.getElementById('post-meta-title');
    if (metaTitleInput) metaTitleInput.value = draft.metaTitle || '';
    const metaDescInput = document.getElementById('post-meta-desc');
    if (metaDescInput) metaDescInput.value = draft.metaDescription || '';
    const featuredImgInput = document.getElementById('post-featured-img');
    if (featuredImgInput) featuredImgInput.value = draft.featuredImage || '';

    // Check position checkboxes
    document.querySelectorAll('#post-position-group input[type="checkbox"]').forEach(cb => {
      cb.checked = (draft.tags || []).includes(cb.value);
    });

    // Set editor content
    if (draft.content) setEditorContent(draft.content);

    // Update header
    const panelTitle = document.querySelector('#panel-new-post .nla-panel-title');
    if (panelTitle) panelTitle.textContent = draft.status === 'published' ? 'Edit Post' : 'Edit Draft';

    // Show status badge
    updateStatusBadge(draft.status);

  } catch (err) {
    showNotification('Failed to load draft: ' + err.message, 'error');
  }
}

/**
 * Update the status badge display.
 */
function updateStatusBadge(status) {
  const badge = document.getElementById('post-status-badge');
  if (!badge) return;
  const labels = {
    draft: '📝 Draft',
    publishing: '⏳ Publishing…',
    saved_to_github: '☁️ Saved to GitHub',
    build_queued: '⏳ Build Queued',
    build_running: '🔄 Building…',
    published: '✓ Published',
    publish_failed: '✗ Publish Failed'
  };
  badge.textContent = labels[status] || status;
  badge.className = 'nla-post-status-badge nla-post-status-' + (status || 'draft').replace(/_/g, '-');
  badge.hidden = false;
}

// Expose for use by posts module
export { saveDraft, publishDraft, previewDraft, loadDraftIntoForm, currentDraftId };

// --- Internal Helpers ---

/**
 * Update the character count display for a given input field.
 * @param {string} inputId - The element ID of the input/textarea
 * @param {number} max - The maximum character count to display
 */
function updateCharCount(inputId, max) {
  const input = $(inputId);
  const count = $(inputId + '-count');
  if (input && count) {
    count.textContent = input.value.length + '/' + max;
  }
}

/**
 * Initialize the EasyMDE markdown editor on the post body textarea.
 * Destroys any existing instance before creating a new one.
 */
function initPostEditor() {
  // Destroy existing instance if re-initializing
  if (easyMDE) {
    easyMDE.toTextArea();
    easyMDE = null;
  }

  const textarea = document.getElementById('post-body-textarea');
  if (!textarea) return;

  easyMDE = new window.EasyMDE({
    element: textarea,
    spellChecker: false,
    autosave: { enabled: false },
    placeholder: 'Write your post content in Markdown...',
    toolbar: ['bold', 'italic', 'heading', '|', 'unordered-list', 'ordered-list', '|', 'link', 'quote', 'code', 'horizontal-rule', '|', 'preview', 'side-by-side', 'fullscreen'],
    status: ['lines', 'words'],
    minHeight: '300px'
  });
}

/**
 * Initialize AI direction card click handlers.
 * Clicking a card highlights it and stores the selected position.
 * Also populates the angle dropdown with position-specific angles.
 */
function initAIDirections() {
  const container = document.getElementById('ai-directions');
  if (!container) return;

  selectedPosition = null;

  // Topics per position (mirrors _data/topics.yml)
  const POSITION_TOPICS = {
    'ai-decision-operations': [
      { slug: 'ai-theater', name: 'AI Theater' },
      { slug: 'fake-ai-transformation', name: 'Fake AI Transformation' },
      { slug: 'slow-decision-cultures', name: 'Slow Decision Cultures' },
      { slug: 'ai-accountability-vacuum', name: 'AI Accountability Vacuum' },
      { slug: 'automation-failure-loops', name: 'Automation Failure Loops' },
      { slug: 'human-bottleneck-myth', name: 'Human Bottleneck Myth' },
      { slug: 'ai-governance-bureaucracy', name: 'AI Governance Bureaucracy' },
      { slug: 'meeting-driven-operations', name: 'Meeting-Driven Operations' },
      { slug: 'escalation-collapse', name: 'Escalation Collapse' },
      { slug: 'operational-cowardice', name: 'Operational Cowardice' },
    ],
    'risk-intelligence': [
      { slug: 'dashboard-addiction', name: 'Dashboard Addiction' },
      { slug: 'kpi-theater', name: 'KPI Theater' },
      { slug: 'reporting-bureaucracy', name: 'Reporting Bureaucracy' },
      { slug: 'alert-spam', name: 'Alert Spam' },
      { slug: 'data-without-ownership', name: 'Data Without Ownership' },
      { slug: 'false-confidence-metrics', name: 'False Confidence Metrics' },
      { slug: 'vanity-analytics', name: 'Vanity Analytics' },
      { slug: 'intelligence-vs-reporting', name: 'Intelligence vs Reporting' },
      { slug: 'data-team-irrelevance', name: 'Data Team Irrelevance' },
      { slug: 'metric-manipulation', name: 'Metric Manipulation' },
    ],
    'ai-job-risk': [
      { slug: 'white-collar-automation', name: 'White-Collar Automation' },
      { slug: 'fake-ai-safety-advice', name: 'Fake AI Safety Advice' },
      { slug: 'productivity-trap', name: 'Productivity Trap' },
      { slug: 'middle-management-exposure', name: 'Middle Management Exposure' },
      { slug: 'collapse-of-busy-work', name: 'The Collapse of Busy Work' },
      { slug: 'prompt-engineer-hype', name: 'Prompt Engineer Hype' },
      { slug: 'knowledge-worker-oversupply', name: 'Knowledge Worker Oversupply' },
      { slug: 'credential-irrelevance', name: 'Credential Irrelevance' },
      { slug: 'ai-career-delusion', name: 'AI Career Delusion' },
      { slug: 'death-of-information-work', name: 'The Death of Information Work' },
    ]
  };

  container.addEventListener('click', function(e) {
    const card = e.target.closest('.nla-ai-direction-card');
    if (!card) return;

    // Remove selected from all cards
    container.querySelectorAll('.nla-ai-direction-card').forEach(function(c) {
      c.classList.remove('selected');
    });

    // Select this card
    card.classList.add('selected');
    selectedPosition = card.dataset.position;

    // Enable generate button
    const genBtn = document.getElementById('ai-generate-btn');
    if (genBtn) genBtn.disabled = false;

    // Populate topic dropdown
    const topicSelect = document.getElementById('ai-topic');
    if (topicSelect) {
      topicSelect.innerHTML = '<option value="">Random</option>';
      const topics = POSITION_TOPICS[selectedPosition] || [];
      topics.forEach(function(topic) {
        var opt = document.createElement('option');
        opt.value = topic.slug;
        opt.textContent = topic.name;
        topicSelect.appendChild(opt);
      });
    }
  });

  // Expose getter for use by the AI generation flow
  window.getSelectedPosition = function() { return selectedPosition; };
}

/**
 * Wire up the AI generate button click handler.
 * Validates direction selection, calls the generatePost API with a 60s timeout,
 * populates the form on success, and handles errors/timeouts.
 */
function initAIGenerateButton() {
  const genBtn = document.getElementById('ai-generate-btn');
  if (!genBtn) return;

  genBtn.addEventListener('click', async function() {
    if (!selectedPosition) return;

    const btn = this;
    const statusEl = document.getElementById('ai-generate-status');

    // Show loading state
    btn.disabled = true;
    btn.textContent = 'Generating…';
    if (statusEl) {
      statusEl.innerHTML = '<div class="nla-ai-loading"><div class="nla-spinner"></div><span>Generating post…</span></div>';
    }

    // Set up timeout (60s)
    const controller = new AbortController();
    const timeoutId = setTimeout(function() {
      controller.abort();
    }, 60000);

    try {
      const generatePostUrl = getApiUrls().generatePost;
      if (!generatePostUrl) throw new Error('Generate post function URL not configured.');

      // Collect existing post titles to avoid duplicates
      let existingTitles = [];
      try {
        const scriptEl = document.getElementById('posts-data');
        if (scriptEl && scriptEl.textContent.trim()) {
          const posts = JSON.parse(scriptEl.textContent);
          existingTitles = posts.map(function(p) { return p.title; }).filter(Boolean);
        }
      } catch (e) { /* ignore */ }

      // Collect existing topics and keywords for duplication prevention
      let existingTopics = [];
      let existingKeywords = [];
      try {
        const scriptEl = document.getElementById('posts-data');
        if (scriptEl && scriptEl.textContent.trim()) {
          const posts = JSON.parse(scriptEl.textContent);
          existingTopics = posts.map(function(p) { return p.topic; }).filter(Boolean);
          existingKeywords = posts.flatMap(function(p) { return p.keywords || []; }).filter(Boolean);
        }
      } catch (e) { /* ignore */ }

      // Gather selected parameters
      var selectedTopic = document.getElementById('ai-topic') ? document.getElementById('ai-topic').value : '';
      var selectedArchetype = document.getElementById('ai-archetype') ? document.getElementById('ai-archetype').value : '';
      var selectedContentMix = document.getElementById('ai-content-mix') ? document.getElementById('ai-content-mix').value : '';
      var selectedTone = document.getElementById('ai-tone') ? document.getElementById('ai-tone').value : '';

      // Gather selected techniques (checkboxes)
      var selectedTechniques = [];
      var techCheckboxes = document.querySelectorAll('#ai-techniques-checkboxes input:checked');
      techCheckboxes.forEach(function(cb) { selectedTechniques.push(cb.value); });

      // Duplication pre-check: warn if selected topic is already heavily covered
      if (selectedTopic && existingTopics.length > 0) {
        var topicCount = existingTopics.filter(function(t) { return t === selectedTopic; }).length;
        if (topicCount >= 3 && statusEl) {
          statusEl.innerHTML = '<div class="nla-ai-dedup-warning">⚠ Topic "' + selectedTopic.replace(/-/g, ' ') + '" already has ' + topicCount + ' posts. Consider a different topic for variety.</div>';
          // Continue anyway — non-blocking
        }
      }

      const result = await apiFetch(generatePostUrl, {
        method: 'POST',
        body: JSON.stringify({
          positionTag: selectedPosition,
          existingTitles: existingTitles,
          existingTopics: existingTopics,
          existingKeywords: existingKeywords,
          topic: selectedTopic,
          archetype: selectedArchetype,
          contentMix: selectedContentMix,
          techniques: selectedTechniques,
          tone: selectedTone
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Success: clear status and switch to scratch/manual mode
      if (statusEl) statusEl.innerHTML = '';
      document.getElementById('mode-scratch').click();

      // Populate form fields with generated data
      if (result.title) document.getElementById('post-title').value = result.title;
      if (result.title) document.getElementById('post-slug').value = slugify(result.title);
      if (result.metaTitle) {
        document.getElementById('post-meta-title').value = result.metaTitle;
      }
      if (result.shareDescription) {
        document.getElementById('post-meta-desc').value = result.shareDescription;
      } else if (result.subtitle) {
        document.getElementById('post-meta-desc').value = result.subtitle;
      }
      if (result.excerpt) {
        document.getElementById('post-excerpt').value = result.excerpt;
      }
      if (result.tags && result.tags.length > 0) {
        result.tags.forEach(function(tag) {
          var cb = document.querySelector('#post-position-group input[value="' + tag + '"]');
          if (cb) cb.checked = true;
        });
      }
      if (result.body) setEditorContent(result.body);

      // Store generated metadata for publish
      generatedTopic = result.topic || null;
      generatedArchetype = result.archetype || null;
      generatedKeywords = result.keywords || null;

      // Update char counts
      updateCharCount('post-title', 150);
      updateCharCount('post-slug', 80);
      updateCharCount('post-meta-title', 70);
      updateCharCount('post-meta-desc', 160);
      updateCharCount('post-excerpt', 300);

      showNotification('Post generated successfully! Review and edit before saving.', 'success');

      // Show word count and editorial checklist
      var wordCountEl = document.getElementById('ai-word-count');
      if (wordCountEl) {
        var words = result._meta ? result._meta.wordCount : (result.body ? result.body.trim().split(/\s+/).length : 0);
        wordCountEl.textContent = words + ' words';
        if (result._meta && !result._meta.wordCountValid) {
          wordCountEl.textContent += ' ⚠️';
        }
        wordCountEl.hidden = false;
      }

      // Display editorial checklist if returned
      if (result.editorial_checklist && statusEl) {
        var checklist = result.editorial_checklist;
        var checklistHtml = '<div class="nla-ai-checklist"><h4>Editorial Checklist — ' + (checklist.score || '') + '</h4><ul>';
        (checklist.items || []).forEach(function(item) {
          var icon = item.passed ? '✓' : '✗';
          var cls = item.passed ? 'nla-ai-check-pass' : 'nla-ai-check-fail';
          checklistHtml += '<li class="' + cls + '"><span>' + icon + '</span> ' + item.name + '</li>';
        });
        checklistHtml += '</ul></div>';

        // Show external reference if returned
        if (result.external_reference && result.external_reference.url) {
          var ref = result.external_reference;
          checklistHtml += '<div class="nla-ai-ext-ref"><strong>External reference:</strong> ';
          checklistHtml += '<a href="' + ref.url + '" target="_blank" rel="noopener">' + (ref.title || ref.source || ref.url) + '</a>';
          checklistHtml += ' <span class="nla-ai-verify">(verify link)</span></div>';
        }

        statusEl.innerHTML = checklistHtml;
      }

    } catch (err) {
      clearTimeout(timeoutId);

      if (statusEl) {
        if (err.name === 'AbortError') {
          statusEl.innerHTML = '<div class="nla-ai-error">' +
            '<p>Generation timed out. The AI took too long to respond.</p>' +
            '<button class="nla-btn nla-btn-primary" onclick="document.getElementById(\'ai-generate-btn\').click()">Retry</button>' +
            '<button class="nla-btn" onclick="document.getElementById(\'mode-scratch\').click()">Start from Scratch</button>' +
            '</div>';
        } else {
          statusEl.innerHTML = '<div class="nla-ai-error">' +
            '<p>' + escHtml(err.message || 'Generation failed. Please try again.') + '</p>' +
            '<button class="nla-btn nla-btn-primary" onclick="document.getElementById(\'ai-generate-btn\').click()">Retry</button>' +
            '<button class="nla-btn" onclick="document.getElementById(\'mode-scratch\').click()">Start from Scratch</button>' +
            '</div>';
        }
      }
    } finally {
      btn.disabled = false;
      btn.textContent = 'Generate Post';
    }
  });
}

// --- Form Validation & Submission ---

/**
 * Clear all field error messages in the form.
 */
function clearFormErrors() {
  document.querySelectorAll('.nla-field-error').forEach(function(el) { el.textContent = ''; });
}

/**
 * Show an error message for a specific field.
 * @param {string} id - The element ID of the error container
 * @param {string} message - The error message to display
 */
function showFieldError(id, message) {
  const el = document.getElementById(id);
  if (el) el.textContent = message;
}

/**
 * Handle post creation form submission.
 * Validates fields, calls the createPost Cloud Function, and handles success/error.
 * @param {Event} e - The form submit event
 */
async function handlePostFormSubmit(e) {
  e.preventDefault();

  // Clear previous errors
  clearFormErrors();

  // Gather form data
  const title = document.getElementById('post-title').value.trim();
  const slug = document.getElementById('post-slug').value.trim() || slugify(title);
  const author = document.getElementById('post-author').value.trim() || 'Hasan J.';
  const selectedPositions = Array.from(document.querySelectorAll('#post-position-group input:checked')).map(function(cb) { return cb.value; });
  const date = document.getElementById('post-date').value;
  const excerpt = document.getElementById('post-excerpt').value.trim();
  const metaTitle = document.getElementById('post-meta-title').value.trim();
  const metaDesc = document.getElementById('post-meta-desc').value.trim();
  const featuredImg = document.getElementById('post-featured-img').value.trim();
  const bodyMarkdown = getEditorContent();

  // Validate required fields and length constraints
  let hasErrors = false;

  if (!title) {
    showFieldError('post-title-error', 'Title is required.');
    hasErrors = true;
  } else if (title.length > 150) {
    showFieldError('post-title-error', 'Title must be 150 characters or less.');
    hasErrors = true;
  }

  if (!bodyMarkdown) {
    showFieldError('post-body-error', 'Body content is required.');
    hasErrors = true;
  }

  if (slug.length > 150) {
    showFieldError('post-slug-count', 'Slug must be 150 characters or less.');
    hasErrors = true;
  }

  if (excerpt.length > 300) {
    showFieldError('post-excerpt-count', 'Excerpt must be 300 characters or less.');
    hasErrors = true;
  }

  if (metaTitle.length > 70) {
    showFieldError('post-meta-title-count', 'Meta title must be 70 characters or less.');
    hasErrors = true;
  }

  if (metaDesc.length > 300) {
    showFieldError('post-meta-desc-count', 'Meta description must be 300 characters or less.');
    hasErrors = true;
  }

  if (hasErrors) return;

  // Disable submit button to prevent double-clicks
  const saveBtn = document.getElementById('post-save-btn');
  saveBtn.disabled = true;
  saveBtn.textContent = 'Saving…';

  try {
    const createPostUrl = getApiUrls().createPost;
    if (!createPostUrl) throw new Error('Create post function URL not configured.');

    const response = await apiFetch(createPostUrl, {
      method: 'POST',
      body: JSON.stringify({
        title: title,
        slug: slug,
        author: author,
        tags: selectedPositions,
        status: 'published',
        date: date,
        excerpt: excerpt,
        shareTitle: metaTitle,
        shareDescription: metaDesc,
        featuredImage: featuredImg,
        body: bodyMarkdown
      })
    });

    // Success: show notification
    showNotification('Post created successfully!', 'success');

    // Switch to posts panel
    switchPanel('posts');

  } catch (err) {
    showFieldError('post-body-error', err.message || 'Failed to save post. Please try again.');
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = 'Save Post';
  }
}

/**
 * Handle post update form submission.
 * Similar to handlePostFormSubmit but calls the updatePost API with filename and sha.
 * @param {Event} e - The form submit event
 */
async function handlePostUpdateSubmit(e) {
  e.preventDefault();

  if (!editingPostState || !editingPostState.filename || !editingPostState.sha) {
    showNotification('Cannot update: post file information is missing. Try editing again.', 'error');
    return;
  }

  // Clear previous errors
  clearFormErrors();

  // Gather form data
  const title = document.getElementById('post-title').value.trim();
  const slug = document.getElementById('post-slug').value.trim() || slugify(title);
  const author = document.getElementById('post-author').value.trim() || 'Hasan J.';
  const selectedPositions = Array.from(document.querySelectorAll('#post-position-group input:checked')).map(function(cb) { return cb.value; });
  const date = document.getElementById('post-date').value;
  const excerpt = document.getElementById('post-excerpt').value.trim();
  const metaTitle = document.getElementById('post-meta-title').value.trim();
  const metaDesc = document.getElementById('post-meta-desc').value.trim();
  const featuredImg = document.getElementById('post-featured-img').value.trim();
  const bodyMarkdown = getEditorContent();

  // Validate required fields
  let hasErrors = false;

  if (!title) {
    showFieldError('post-title-error', 'Title is required.');
    hasErrors = true;
  } else if (title.length > 150) {
    showFieldError('post-title-error', 'Title must be 150 characters or less.');
    hasErrors = true;
  }

  if (!bodyMarkdown) {
    showFieldError('post-body-error', 'Body content is required.');
    hasErrors = true;
  }

  if (hasErrors) return;

  // Disable submit button
  const saveBtn = document.getElementById('post-save-btn');
  saveBtn.disabled = true;
  saveBtn.textContent = 'Updating…';

  try {
    const updatePostUrl = getApiUrls().updatePost;
    if (!updatePostUrl) throw new Error('Update post function URL not configured.');

    await apiFetch(updatePostUrl, {
      method: 'POST',
      body: JSON.stringify({
        filename: editingPostState.filename,
        sha: editingPostState.sha,
        title: title,
        slug: slug,
        author: author,
        tags: selectedPositions,
        status: 'published',
        date: date,
        excerpt: excerpt,
        shareTitle: metaTitle,
        shareDescription: metaDesc,
        featuredImage: featuredImg,
        body: bodyMarkdown
      })
    });

    showNotification('Post updated successfully!', 'success');
    editingPostState = null;

    // Restore form to create mode and switch to posts panel
    const form = document.getElementById('post-creation-form');
    if (form) {
      form.removeEventListener('submit', handlePostUpdateSubmit);
      form.addEventListener('submit', handlePostFormSubmit);
    }
    switchPanel('posts');

  } catch (err) {
    showFieldError('post-body-error', err.message || 'Failed to update post. Please try again.');
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = 'Update Post';
  }
}

// --- Public Functions ---

/**
 * Get the EasyMDE editor content as markdown.
 * Falls back to reading the textarea directly if EasyMDE is not initialized.
 * @returns {string} The editor content trimmed
 */
export function getEditorContent() {
  if (easyMDE) return easyMDE.value().trim();
  const textarea = document.getElementById('post-body-textarea');
  return textarea ? textarea.value.trim() : '';
}

/**
 * Set the EasyMDE editor content (used when AI generates content).
 * @param {string} markdown - The markdown content to set
 */
export function setEditorContent(markdown) {
  if (easyMDE) {
    easyMDE.value(markdown);
  } else {
    const textarea = document.getElementById('post-body-textarea');
    if (textarea) textarea.value = markdown;
  }
}

/**
 * Initialize the new-post panel.
 * Sets up the post creation form, character counters, mode toggle,
 * EasyMDE editor, and AI direction card listeners.
 */
export function initNewPostPanel() {
  // Early return if already initialized
  if (newPostPanelInitialized) return;

  const panel = $('panel-new-post');

  // Store default HTML on first call
  if (!newPostPanelDefaultHTML) {
    newPostPanelDefaultHTML = panel.innerHTML;
  }

  // Restore default HTML if it was replaced by editPost()
  if (!$('post-creation-form')) {
    panel.innerHTML = newPostPanelDefaultHTML;
  }

  // Pre-fill date with today
  const today = new Date().toISOString().split('T')[0];
  const dateInput = $('post-date');
  if (dateInput && !dateInput.value) {
    dateInput.value = today;
  }

  // Auto-generate slug from title and update char counts
  const titleInput = $('post-title');
  if (titleInput) {
    titleInput.addEventListener('input', function() {
      const slugInput = $('post-slug');
      if (slugInput) {
        slugInput.value = slugify(this.value);
        updateCharCount('post-slug', 80);
      }
      updateCharCount('post-title', 150);
    });
  }

  // Character count listeners for other fields
  const charCountFields = [
    { id: 'post-excerpt', max: 300 },
    { id: 'post-meta-title', max: 70 },
    { id: 'post-meta-desc', max: 160 },
    { id: 'post-slug', max: 80 }
  ];
  charCountFields.forEach(function(field) {
    const el = $(field.id);
    if (el) {
      el.addEventListener('input', function() {
        updateCharCount(field.id, field.max);
      });
    }
  });

  // Mode toggle (manual vs AI)
  const modeScratch = $('mode-scratch');
  const modeAi = $('mode-ai');
  if (modeScratch) {
    modeScratch.addEventListener('click', function() {
      this.classList.add('active');
      if (modeAi) modeAi.classList.remove('active');
      show($('post-form-container'));
      hide($('ai-generate-container'));
    });
  }
  if (modeAi) {
    modeAi.addEventListener('click', function() {
      this.classList.add('active');
      if (modeScratch) modeScratch.classList.remove('active');
      hide($('post-form-container'));
      show($('ai-generate-container'));
    });
  }

  // Cancel button — return to Posts panel
  const cancelBtn = $('post-cancel-btn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', function() {
      switchPanel('posts');
    });
  }

  // Save Draft button
  const draftBtn = document.getElementById('post-draft-btn');
  if (draftBtn) {
    draftBtn.addEventListener('click', async function() {
      try {
        draftBtn.disabled = true;
        draftBtn.textContent = 'Saving…';
        await saveDraft(false);
      } catch (err) {
        showNotification('Save failed: ' + err.message, 'error');
      } finally {
        draftBtn.disabled = false;
        draftBtn.textContent = 'Save Draft';
      }
    });
  }

  // Preview button
  const previewBtn = document.getElementById('post-preview-btn');
  if (previewBtn) {
    previewBtn.addEventListener('click', async function() {
      try { await previewDraft(); } catch (err) {
        showNotification('Preview failed: ' + err.message, 'error');
      }
    });
  }

  // Publish button
  const publishBtn = document.getElementById('post-publish-btn');
  if (publishBtn) {
    publishBtn.addEventListener('click', async function() {
      try { await publishDraft(); } catch (err) {
        showNotification('Publish failed: ' + err.message, 'error');
      }
    });
  }

  // Initialize the EasyMDE markdown editor
  initPostEditor();

  // Initialize AI direction card selection
  initAIDirections();

  // Wire up AI generate button click handler
  initAIGenerateButton();

  // Prevent form submission (we use button clicks instead)
  const form = document.getElementById('post-creation-form');
  if (form) {
    form.addEventListener('submit', function(e) { e.preventDefault(); });
  }

  // Mark as initialized
  newPostPanelInitialized = true;
}

/**
 * Switch to the new-post panel pre-filled with the post's full content for editing.
 * Fetches the raw markdown body from the getPost API endpoint.
 *
 * @param {string} title - The title of the post to edit
 */
export async function editPost(title) {
  // Find the post metadata from the posts-data JSON
  let post = null;
  try {
    const scriptEl = $('posts-data');
    if (scriptEl && scriptEl.textContent.trim()) {
      const posts = JSON.parse(scriptEl.textContent);
      post = posts.find(p => p.title === title);
    }
  } catch (e) { /* ignore parse errors */ }

  // Show the new-post panel (handle panel switching manually to avoid
  // switchPanel's auto-initialization overwriting our pre-filled data)
  const navItems = document.querySelectorAll('.nla-nav-item');
  const panels = document.querySelectorAll('.nla-panel');
  navItems.forEach(n => n.classList.remove('active'));
  panels.forEach(p => { p.classList.remove('active'); p.hidden = true; });
  const navBtn = document.querySelector('[data-panel="new-post"]');
  if (navBtn) navBtn.classList.add('active');
  const panel = $('panel-new-post');
  if (panel) { panel.classList.add('active'); panel.hidden = false; }

  // Ensure the form is initialized
  if (!newPostPanelInitialized) {
    if (!$('post-creation-form') && newPostPanelDefaultHTML) {
      panel.innerHTML = newPostPanelDefaultHTML;
    }
    initNewPostPanel();
  }

  // Make sure we're in scratch/manual mode
  const modeScratch = $('mode-scratch');
  if (modeScratch) modeScratch.click();

  // Hide the mode toggle — not relevant for editing
  const modeToggle = document.getElementById('post-mode-toggle');
  if (modeToggle) modeToggle.hidden = true;

  // Hide the AI generate container
  const aiContainer = $('ai-generate-container');
  if (aiContainer) aiContainer.hidden = true;

  // Fix nav highlighting — highlight "Posts" not "New Post"
  document.querySelectorAll('.nla-nav-item').forEach(n => n.classList.remove('active'));
  const postsNav = document.querySelector('[data-panel="posts"]');
  if (postsNav) postsNav.classList.add('active');

  // Update panel header to indicate edit mode
  const panelTitle = panel.querySelector('.nla-panel-title');
  const panelDesc = panel.querySelector('.nla-panel-desc');
  if (panelTitle) panelTitle.textContent = 'Edit Post';
  if (panelDesc) panelDesc.textContent = 'Editing: ' + (title || 'Untitled');

  // Change save button to update mode
  const saveBtn = document.getElementById('post-save-btn');
  if (saveBtn) saveBtn.textContent = 'Update Post';

  // Pre-fill metadata fields
  if (post) {
    const titleInput = document.getElementById('post-title');
    if (titleInput) {
      titleInput.value = post.title !== '—' ? post.title : '';
      updateCharCount('post-title', 150);
    }

    const slugInput = document.getElementById('post-slug');
    if (slugInput) {
      slugInput.value = post.slug !== '—' ? post.slug : '';
      updateCharCount('post-slug', 80);
    }

    const authorInput = document.getElementById('post-author');
    if (authorInput) authorInput.value = post.author !== '—' ? post.author : 'Hasan J.';

    const dateInput = document.getElementById('post-date');
    if (dateInput && post.date !== '—') dateInput.value = post.date;

    const excerptInput = document.getElementById('post-excerpt');
    if (excerptInput) {
      excerptInput.value = post.excerpt !== '—' ? post.excerpt : '';
      updateCharCount('post-excerpt', 300);
    }

    const metaTitleInput = document.getElementById('post-meta-title');
    if (metaTitleInput) {
      metaTitleInput.value = post.shareTitle !== '—' ? post.shareTitle : '';
      updateCharCount('post-meta-title', 70);
    }

    const metaDescInput = document.getElementById('post-meta-desc');
    if (metaDescInput) {
      metaDescInput.value = post.shareDescription !== '—' ? post.shareDescription : '';
      updateCharCount('post-meta-desc', 160);
    }

    const featuredImgInput = document.getElementById('post-featured-img');
    if (featuredImgInput) featuredImgInput.value = post.thumbnailImg !== '—' ? post.thumbnailImg : '';

    // Check position/tag checkboxes
    if (post.tags && Array.isArray(post.tags)) {
      document.querySelectorAll('#post-position-group input[type="checkbox"]').forEach(function(cb) {
        cb.checked = post.tags.includes(cb.value);
      });
    }

    // Fetch the post body from the API
    const slug = post.slug !== '—' ? post.slug : '';
    const date = post.date !== '—' ? post.date : '';
    if (slug) {
      setEditorContent('Loading post content…');
      try {
        const API = getApiUrls();
        const data = await apiFetch(API.getPost + '?slug=' + encodeURIComponent(slug) + '&date=' + encodeURIComponent(date));
        setEditorContent(data.body || '');

        // Store the file info for the update call
        editingPostState = {
          filename: data.filename,
          sha: data.sha,
          originalSlug: slug
        };
      } catch (err) {
        setEditorContent('<!-- Could not load post body: ' + (err.message || 'Unknown error') + ' -->\n\n');
        editingPostState = null;
      }
    }
  }

  // Switch form submission to update mode
  const form = document.getElementById('post-creation-form');
  if (form) {
    form.removeEventListener('submit', handlePostFormSubmit);
    form.addEventListener('submit', handlePostUpdateSubmit);
  }
}

/**
 * Restore the new-post panel to its default state after editPost replaced it.
 * Re-initializes the panel form and editor.
 */
export function restoreNewPostPanel() {
  const panel = $('panel-new-post');
  if (newPostPanelDefaultHTML) {
    panel.innerHTML = newPostPanelDefaultHTML;
  }
  newPostPanelInitialized = false;
  editingPostState = null;
  initNewPostPanel();
}

/**
 * Reset the new-post panel to create mode.
 * Clears all form fields, shows mode toggle, restores header,
 * and switches the submit handler back to create.
 */
export function resetToCreateMode() {
  const panel = $('panel-new-post');

  // Restore header
  const panelTitle = panel.querySelector('.nla-panel-title');
  const panelDesc = panel.querySelector('.nla-panel-desc');
  if (panelTitle) panelTitle.textContent = 'New Post';
  if (panelDesc) panelDesc.textContent = 'Create a new blog post.';

  // Show mode toggle and switch to scratch mode
  const modeToggle = document.getElementById('post-mode-toggle');
  if (modeToggle) modeToggle.hidden = false;
  const modeScratch = $('mode-scratch');
  if (modeScratch) modeScratch.click();

  // Reset AI generate state
  const aiContainer = $('ai-generate-container');
  if (aiContainer) aiContainer.hidden = true;
  const aiStatus = document.getElementById('ai-generate-status');
  if (aiStatus) aiStatus.innerHTML = '';
  const genBtn = document.getElementById('ai-generate-btn');
  if (genBtn) { genBtn.disabled = true; genBtn.textContent = 'Generate Post'; }
  // Deselect all direction cards
  document.querySelectorAll('.nla-ai-direction-card.selected').forEach(function(c) {
    c.classList.remove('selected');
  });
  selectedPosition = null;

  // Reset save button
  const saveBtn = document.getElementById('post-save-btn');
  if (saveBtn) saveBtn.textContent = 'Save Post';

  // Clear form fields
  const form = document.getElementById('post-creation-form');
  if (form) {
    form.reset();
    // Re-set default author
    const authorInput = document.getElementById('post-author');
    if (authorInput) authorInput.value = 'Hasan J.';
    // Re-set today's date
    const dateInput = document.getElementById('post-date');
    if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
  }

  // Clear editor content
  setEditorContent('');

  // Reset char counts
  ['post-title', 'post-slug', 'post-excerpt', 'post-meta-title', 'post-meta-desc'].forEach(function(id) {
    const countEl = document.getElementById(id + '-count');
    if (countEl) countEl.textContent = '0/' + (id === 'post-title' ? '150' : id === 'post-slug' ? '80' : id === 'post-excerpt' ? '300' : id === 'post-meta-title' ? '70' : '160');
  });

  // Uncheck all position checkboxes
  document.querySelectorAll('#post-position-group input[type="checkbox"]').forEach(function(cb) {
    cb.checked = false;
  });

  // Switch submit handler back to create mode
  if (form) {
    form.removeEventListener('submit', handlePostUpdateSubmit);
    form.addEventListener('submit', handlePostFormSubmit);
  }

  // Clear editing state
  editingPostState = null;
  currentDraftId = null;

  // Hide status badge
  const badge = document.getElementById('post-status-badge');
  if (badge) badge.hidden = true;
}

/**
 * Top-level initializer for the new-post module.
 * Called to wire up the module and expose functions on window.
 */
export function initNewPost() {
  window.editPost = editPost;
  window.restoreNewPostPanel = restoreNewPostPanel;
}

// Expose functions on window for inline onclick handlers
window.editPost = editPost;
window.restoreNewPostPanel = restoreNewPostPanel;
