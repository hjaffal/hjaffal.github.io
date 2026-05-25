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
 */
function initAIDirections() {
  const container = document.getElementById('ai-directions');
  if (!container) return;

  selectedPosition = null;

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

      const result = await apiFetch(generatePostUrl, {
        method: 'POST',
        body: JSON.stringify({ positionTag: selectedPosition }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Success: clear status and switch to scratch/manual mode
      if (statusEl) statusEl.innerHTML = '';
      document.getElementById('mode-scratch').click();

      // Populate form fields with generated data
      if (result.title) document.getElementById('post-title').value = result.title;
      if (result.title) document.getElementById('post-slug').value = slugify(result.title);
      if (result.subtitle) document.getElementById('post-meta-desc').value = result.subtitle;
      if (result.shareDescription) document.getElementById('post-meta-desc').value = result.shareDescription;
      if (result.tags && result.tags.length > 0) {
        result.tags.forEach(function(tag) {
          var cb = document.querySelector('#post-position-group input[value="' + tag + '"]');
          if (cb) cb.checked = true;
        });
      }
      if (result.body) setEditorContent(result.body);

      // Update char counts
      updateCharCount('post-title', 150);
      updateCharCount('post-slug', 80);
      updateCharCount('post-meta-desc', 160);

      showNotification('Post generated successfully! Review and edit before saving.', 'success');

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
  const status = document.getElementById('post-status').value;
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

  if (slug.length > 80) {
    showFieldError('post-slug-count', 'Slug must be 80 characters or less.');
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

  if (metaDesc.length > 160) {
    showFieldError('post-meta-desc-count', 'Meta description must be 160 characters or less.');
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
        status: status,
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
  const status = document.getElementById('post-status').value;
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
        status: status,
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

  // Initialize the EasyMDE markdown editor
  initPostEditor();

  // Initialize AI direction card selection
  initAIDirections();

  // Wire up AI generate button click handler
  initAIGenerateButton();

  // Wire up form submission handler
  const form = document.getElementById('post-creation-form');
  if (form) {
    form.addEventListener('submit', handlePostFormSubmit);
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

    const statusSelect = document.getElementById('post-status');
    if (statusSelect && post.status !== '—') statusSelect.value = post.status;

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

  // Show mode toggle
  const modeToggle = document.getElementById('post-mode-toggle');
  if (modeToggle) modeToggle.hidden = false;

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
