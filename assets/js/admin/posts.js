/**
 * Admin Panel — Posts Module
 *
 * Handles loading and normalizing posts from the posts-data JSON,
 * rendering a Grid.js table with sorting, pagination, and action buttons,
 * filtering posts by search term, status, and position tag,
 * and showing post detail panel.
 */

import { show, hide, $, escHtml, formatDate, getApiUrls, showNotification } from './main.js';

// --- Module-level State ---

let allPosts = [];
let postsGrid = null;
let postsLoaded = false;
let searchTimeout = null;

// --- Exported Functions (placeholders) ---

/**
 * Load the posts panel: parse posts-data JSON, normalize fields, and initialize the table.
 */
export function loadPostsPanel() {
  // Avoid re-parsing on every panel switch
  if (postsLoaded) return;

  const loading = $('posts-loading');
  const error = $('posts-error');
  const empty = $('posts-empty');
  const tableContainer = $('posts-content');

  // Show loading state
  show(loading);
  hide(error);
  hide(empty);
  hide(tableContainer);

  // Use setTimeout to allow the loading spinner to render before parsing
  setTimeout(function () {
    try {
      const scriptEl = $('posts-data');
      if (!scriptEl || !scriptEl.textContent.trim()) {
        throw new Error('Post data element not found');
      }

      const posts = JSON.parse(scriptEl.textContent);

      // Normalize missing metadata fields
      posts.forEach(function (post) {
        post.title = post.title || '—';
        post.slug = post.slug || '—';
        post.url = post.url || '—';
        post.date = post.date || '—';
        post.lastUpdated = post.lastUpdated || '—';
        post.author = post.author || '—';
        post.tags = post.tags || [];
        post.status = post.status || '—';
        post.shareTitle = post.shareTitle || '—';
        post.shareDescription = post.shareDescription || '—';
        post.canonicalUrl = post.canonicalUrl || '—';
        post.readingTime = post.readingTime || '—';
        post.thumbnailImg = post.thumbnailImg || '—';
        post.shareImg = post.shareImg || '—';
        post.excerpt = post.excerpt || '—';
        post.wordCount = post.wordCount || 0;
      });

      hide(loading);

      if (posts.length === 0) {
        show(empty);
        postsLoaded = true;
        return;
      }

      // Store normalized posts in module-level state
      allPosts = posts;
      postsLoaded = true;
      show(tableContainer);
      show($('posts-toolbar'));
      initPostsTable(allPosts);

      // Wire up event listeners (search, filters, etc.)
      initPosts();

    } catch (e) {
      hide(loading);
      error.textContent = 'Post data could not be loaded.';
      show(error);
    }
  }, 0);
}

/**
 * Copy a post URL to the clipboard and show visual feedback.
 * @param {string} url - The relative URL of the post
 */
export function copyPostUrl(url) {
  var fullUrl = window.location.origin + url;
  navigator.clipboard.writeText(fullUrl).then(function() {
    // Brief visual feedback — find the button that was clicked and temporarily change its text
    var activeBtn = document.activeElement;
    if (activeBtn && activeBtn.textContent === '📋') {
      activeBtn.textContent = '✓';
      setTimeout(function() { activeBtn.textContent = '📋'; }, 1500);
    }
  });
}

/**
 * Initialize (or re-initialize) the Grid.js posts table with the given posts array.
 * @param {Array} posts - Array of normalized post objects
 */
export function initPostsTable(posts) {
  // Destroy existing instance if re-rendering
  if (postsGrid) {
    postsGrid.destroy();
    postsGrid = null;
  }

  const container = $('posts-content');
  container.innerHTML = '';

  // Helper: format position tag for display
  function positionDisplayName(tag) {
    const names = {
      'ai-operations': 'AI Operations',
      'decision-authority': 'Decision Authority',
      'risk-intelligence': 'Risk Intelligence',
      'ai-and-work': 'AI and Work'
    };
    return names[tag] || tag;
  }

  // Pre-sort by published date descending (newest first) for default view
  const sortedPosts = posts.slice().sort(function(a, b) {
    if (a.date === '—' && b.date === '—') return 0;
    if (a.date === '—') return 1;
    if (b.date === '—') return -1;
    return new Date(b.date) - new Date(a.date);
  });

  // Store sorted posts for detail panel index lookup
  window.postsFiltered = sortedPosts;

  const tableData = sortedPosts.map(function(post, idx) {
    return [
      post.title,
      post.status,
      post.date,
      post.tags,
      post.url,
      idx
    ];
  });

  postsGrid = new gridjs.Grid({
    columns: [
      {
        id: 'title',
        name: 'Title',
        sort: {
          compare: function(a, b) {
            if (a === '—' && b === '—') return 0;
            if (a === '—') return 1;
            if (b === '—') return -1;
            return a.localeCompare(b);
          }
        },
        formatter: function(cell) {
          if (!cell || cell === '—') return '—';
          if (cell.length > 60) {
            return gridjs.html('<span class="nla-truncate" title="' + escHtml(cell) + '">' + escHtml(cell.substring(0, 60)) + '…</span>');
          }
          return escHtml(cell);
        }
      },
      {
        id: 'status',
        name: 'Status',
        sort: true,
        formatter: function(cell) {
          if (!cell || cell === '—') return '—';
          const badgeClass = 'nla-badge-' + cell;
          const label = cell.charAt(0).toUpperCase() + cell.slice(1);
          return gridjs.html('<span class="nla-badge ' + badgeClass + '">' + escHtml(label) + '</span>');
        }
      },
      {
        id: 'published',
        name: 'Published',
        sort: {
          compare: function(a, b) {
            if (a === '—' && b === '—') return 0;
            if (a === '—') return 1;
            if (b === '—') return -1;
            return new Date(a) - new Date(b);
          }
        },
        formatter: function(cell) {
          if (!cell || cell === '—') return '—';
          return formatDate(cell);
        }
      },
      {
        id: 'position',
        name: 'Position',
        sort: true,
        formatter: function(cell) {
          if (!cell || !Array.isArray(cell) || cell.length === 0) return '—';
          var badges = cell.map(function(tag) {
            return '<span class="nla-badge nla-badge-position">' + escHtml(positionDisplayName(tag)) + '</span>';
          }).join(' ');
          return gridjs.html(badges);
        }
      },
      {
        id: 'url',
        name: 'url',
        hidden: true
      },
      {
        id: 'idx',
        name: 'idx',
        hidden: true
      },
      {
        id: 'actions',
        name: 'Actions',
        sort: false,
        formatter: function(_, row) {
          const url = row.cells[4].data;
          const title = row.cells[0].data || 'post';
          const postIdx = row.cells[5].data;
          const safeTitle = escHtml(title).replace(/'/g, '&#39;');
          const safeUrl = escHtml(url).replace(/'/g, '&#39;');
          return gridjs.html(
            '<div class="nla-table-actions">' +
              '<a class="nla-btn-sm" href="' + escHtml(url) + '" target="_blank" rel="noopener" aria-label="View ' + escHtml(title) + '">View</a>' +
              '<button class="nla-btn-sm" onclick="editPost(\'' + safeTitle + '\')" aria-label="Edit ' + escHtml(title) + '">Edit</button>' +
              '<button class="nla-btn-sm" onclick="copyPostUrl(\'' + safeUrl + '\')" aria-label="Copy URL for ' + escHtml(title) + '" title="Copy URL">📋</button>' +
              '<button class="nla-btn-sm" onclick="showPostDetail(' + postIdx + ')" aria-label="Details for ' + escHtml(title) + '" title="Show details">▼</button>' +
            '</div>'
          );
        }
      }
    ],
    data: tableData,
    sort: {
      multiColumn: false,
      server: false
    },
    pagination: {
      enabled: true,
      limit: 20
    },
    className: {
      container: 'nla-gridjs',
      table: 'nla-gridjs-table',
      th: 'nla-gridjs-th',
      td: 'nla-gridjs-td'
    }
  }).render(container);
}

/**
 * Pure filtering logic for posts. Accepts all parameters explicitly for testability.
 * @param {Array} posts - Array of post objects to filter
 * @param {string} searchTerm - Search term (will be lowercased and trimmed)
 * @param {string} statusFilter - Status filter value ("all" means no filter)
 * @param {string} positionFilter - Position tag filter value ("all" means no filter)
 * @returns {Array} Filtered array of posts
 */
export function filterPostsLogic(posts, searchTerm, statusFilter, positionFilter) {
  const normalizedSearch = (searchTerm || '').toLowerCase().trim();

  return posts.filter(function(post) {
    // Search filter
    if (normalizedSearch) {
      const titleMatch = (post.title || '').toLowerCase().indexOf(normalizedSearch) !== -1;
      const slugMatch = (post.slug || '').toLowerCase().indexOf(normalizedSearch) !== -1;
      const tagsMatch = (post.tags || []).some(function(tag) {
        return tag.toLowerCase().indexOf(normalizedSearch) !== -1;
      });
      if (!titleMatch && !slugMatch && !tagsMatch) return false;
    }

    // Status filter (AND logic)
    if (statusFilter && statusFilter !== 'all') {
      if (post.status !== statusFilter) return false;
    }

    // Position filter (AND logic)
    if (positionFilter && positionFilter !== 'all') {
      if (!post.tags || !Array.isArray(post.tags) || post.tags.length === 0) return false;
      if (!post.tags.includes(positionFilter)) return false;
    }

    return true;
  });
}

/**
 * Filter posts by search term, status dropdown, and position dropdown.
 * Re-renders the table with matching results.
 */
export function filterPosts() {
  // Hide detail panel when filters change
  const detailPanel = $('post-detail-panel');
  if (detailPanel) detailPanel.hidden = true;

  const searchTerm = ($('posts-search').value || '').toLowerCase().trim();

  // Get active status filter value
  const statusFilter = $('posts-filter-status') ? $('posts-filter-status').value : 'all';
  // Get active position filter value
  const positionFilter = $('posts-filter-position') ? $('posts-filter-position').value : 'all';

  let filtered = filterPostsLogic(allPosts, searchTerm, statusFilter, positionFilter);

  // Update Grid.js table with filtered results
  if (filtered.length === 0) {
    hide($('posts-content'));
    const emptyEl = $('posts-empty');
    emptyEl.innerHTML = '<span class="nla-empty-icon">🔍</span><p>No posts match the current filters.</p>';
    show(emptyEl);
  } else {
    hide($('posts-empty'));
    show($('posts-content'));
    initPostsTable(filtered);
  }
}

/**
 * Show the detail panel for a post at the given index.
 * @param {number} index - Index of the post in the current filtered/full array
 */
export function showPostDetail(index) {
  var posts = window.postsFiltered;
  var post = posts[index];
  if (!post) return;

  var panel = $('post-detail-panel');
  var content = $('post-detail-content');
  if (!panel || !content) return;

  // Calculate reading time from post data or word count
  var readingTime = calculateReadingTime(post);

  // Determine featured image (thumbnail preferred, fallback to share image)
  var featuredImage = (post.thumbnailImg && post.thumbnailImg !== '—' && post.thumbnailImg !== null)
    ? post.thumbnailImg
    : (post.shareImg && post.shareImg !== '—' && post.shareImg !== null ? post.shareImg : null);

  // Build status badge HTML
  var statusHtml = '—';
  if (post.status && post.status !== '—') {
    var badgeClass = 'nla-badge-' + post.status;
    var label = post.status.charAt(0).toUpperCase() + post.status.slice(1);
    statusHtml = '<span class="nla-badge ' + badgeClass + '">' + escHtml(label) + '</span>';
  }

  // Build URL as clickable link
  var urlHtml = '—';
  if (post.url && post.url !== '—') {
    urlHtml = '<a href="' + escHtml(post.url) + '" target="_blank" rel="noopener">' + escHtml(post.url) + '</a>';
  }

  // Build tags/position display
  var tagsHtml = '—';
  if (post.tags && Array.isArray(post.tags) && post.tags.length > 0) {
    tagsHtml = post.tags.map(function(tag) {
      return '<span class="nla-badge nla-badge-position">' + escHtml(tag) + '</span>';
    }).join(' ');
  }

  // Build image preview if available
  var thumbnailHtml = '—';
  if (featuredImage) {
    thumbnailHtml = '<img src="' + escHtml(featuredImage) + '" alt="Thumbnail" style="max-width:120px;max-height:80px;border-radius:4px;">';
  }

  // Build share image preview
  var shareImgHtml = '—';
  if (post.shareImg && post.shareImg !== '—' && post.shareImg !== null) {
    shareImgHtml = '<img src="' + escHtml(post.shareImg) + '" alt="Share image" style="max-width:120px;max-height:80px;border-radius:4px;">';
  }

  // Build canonical URL as clickable link
  var canonicalHtml = '—';
  if (post.canonicalUrl && post.canonicalUrl !== '—') {
    canonicalHtml = '<a href="' + escHtml(post.canonicalUrl) + '" target="_blank" rel="noopener">' + escHtml(post.canonicalUrl) + '</a>';
  }

  content.innerHTML = '<div class="nla-post-detail-grid">' +
    detailField('Title', post.title) +
    detailFieldRaw('Status', statusHtml) +
    detailField('Published', post.date !== '—' ? formatDate(post.date) : '—') +
    detailField('Last Updated', post.lastUpdated !== '—' ? formatDate(post.lastUpdated) : '—') +
    detailField('Author', post.author) +
    detailField('Slug', post.slug) +
    detailFieldRaw('URL', urlHtml) +
    detailFieldRaw('Tags / Position', tagsHtml) +
    detailField('Reading Time', readingTime) +
    detailField('Word Count', post.wordCount ? String(post.wordCount) : '—') +
    detailField('Excerpt', post.excerpt) +
    detailField('Share Title', post.shareTitle) +
    detailField('Share Description', post.shareDescription) +
    detailFieldRaw('Canonical URL', canonicalHtml) +
    detailFieldRaw('Thumbnail Image', thumbnailHtml) +
    detailFieldRaw('Share Image', shareImgHtml) +
    '</div>';

  panel.hidden = false;
  panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// --- Private Helpers ---

/**
 * Calculate reading time from post metadata or word count.
 * @param {Object} post - Post object
 * @returns {string} Reading time string
 */
function calculateReadingTime(post) {
  if (post.readingTime && post.readingTime !== '—' && post.readingTime !== null) return post.readingTime;
  if (post.wordCount && post.wordCount > 0) {
    return Math.ceil(post.wordCount / 200) + ' min read';
  }
  return '—';
}

/**
 * Build a detail field with escaped value.
 * @param {string} label - Field label
 * @param {string} value - Field value (will be HTML-escaped)
 * @returns {string} HTML string
 */
function detailField(label, value) {
  return '<div class="nla-post-detail-field">' +
    '<span class="nla-post-detail-label">' + escHtml(label) + '</span>' +
    '<span class="nla-post-detail-value">' + escHtml(value || '—') + '</span>' +
    '</div>';
}

/**
 * Build a detail field with raw HTML value (for badges, links, images).
 * @param {string} label - Field label (will be HTML-escaped)
 * @param {string} rawHtml - Pre-built HTML string for the value
 * @returns {string} HTML string
 */
function detailFieldRaw(label, rawHtml) {
  return '<div class="nla-post-detail-field">' +
    '<span class="nla-post-detail-label">' + escHtml(label) + '</span>' +
    '<span class="nla-post-detail-value">' + (rawHtml || '—') + '</span>' +
    '</div>';
}

/**
 * Initialize the posts module: wire up search debounce, filter listeners, and close-detail button.
 * Called once when the posts panel is first activated.
 */
export function initPosts() {
  // Search input with debounce (300ms)
  const searchInput = $('posts-search');
  if (searchInput) {
    searchInput.addEventListener('input', function () {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(filterPosts, 300);
    });
  }

  // Status filter dropdown — filter immediately on change
  const statusSelect = $('posts-filter-status');
  if (statusSelect) {
    statusSelect.addEventListener('change', filterPosts);
  }

  // Position filter dropdown — filter immediately on change
  const positionSelect = $('posts-filter-position');
  if (positionSelect) {
    positionSelect.addEventListener('change', filterPosts);
  }

  // Close-detail button hides the post detail panel
  const closeBtn = $('close-detail-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', function () {
      const panel = $('post-detail-panel');
      if (panel) panel.hidden = true;
    });
  }
}

// --- Window Exposure for Inline Handlers ---
// Grid.js cell formatters use onclick handlers that call these functions via window.
if (typeof window !== 'undefined') {
  window.showPostDetail = showPostDetail;
  window.copyPostUrl = copyPostUrl;
  window.filterPosts = filterPosts;

  // editPost wrapper: dynamically imports new-post.js on first call to ensure
  // the module is loaded even if the user hasn't visited the New Post panel yet.
  if (!window.editPost) {
    window.editPost = async function(title) {
      const { editPost } = await import('./new-post.js');
      editPost(title);
    };
  }
}
