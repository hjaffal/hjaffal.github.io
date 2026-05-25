/**
 * Property-based tests for filterPostsLogic.
 * Tests Property 2 and Property 3 from the design document.
 *
 * **Validates: Requirements 3.3**
 */
import { describe, it, expect, vi } from 'vitest';
import fc from 'fast-check';

// Provide a minimal window object for module-level window assignments in posts.js
globalThis.window = globalThis.window || {};

// Mock main.js since it imports Firebase from CDN URLs that can't resolve in Node
vi.mock('../../assets/js/admin/main.js', () => ({
  show: vi.fn(),
  hide: vi.fn(),
  $: vi.fn(),
  apiFetch: vi.fn(),
  formatDate: vi.fn(),
  escHtml: vi.fn(),
  getApiUrls: vi.fn(),
  showNotification: vi.fn(),
}));

import { filterPostsLogic } from '../../assets/js/admin/posts.js';

// --- Generators ---

/** Generate a random post status */
const postStatus = fc.oneof(
  fc.constant('published'),
  fc.constant('draft'),
  fc.constant('archived'),
  fc.string({ minLength: 1, maxLength: 15 })
);

/** Generate a random tags array (mix of known position tags and random strings) */
const postTags = fc.array(
  fc.oneof(
    fc.constant('ai-operations'),
    fc.constant('decision-authority'),
    fc.constant('risk-intelligence'),
    fc.constant('ai-and-work'),
    fc.string({ minLength: 1, maxLength: 15 })
  ),
  { minLength: 0, maxLength: 5 }
);

/** Generate a single post object */
const postArbitrary = fc.record({
  title: fc.string({ minLength: 0, maxLength: 80 }),
  slug: fc.string({ minLength: 0, maxLength: 50 }),
  url: fc.string({ minLength: 0, maxLength: 80 }),
  date: fc.oneof(
    fc.constant('—'),
    fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }).map(d => d.toISOString().split('T')[0])
  ),
  tags: postTags,
  status: postStatus,
});

/** Generate an array of posts */
const postsArbitrary = fc.array(postArbitrary, { minLength: 0, maxLength: 30 });

/** Generate a search term (could be empty or a short string) */
const searchTermArbitrary = fc.oneof(
  fc.constant(''),
  fc.string({ minLength: 1, maxLength: 20 })
);

/** Generate a status filter value (including "all" and valid statuses) */
const statusFilterArbitrary = fc.oneof(
  fc.constant('all'),
  fc.constant('published'),
  fc.constant('draft'),
  fc.constant('archived'),
  fc.string({ minLength: 1, maxLength: 15 })
);

/** Generate a position filter value (including "all" and valid position tags) */
const positionFilterArbitrary = fc.oneof(
  fc.constant('all'),
  fc.constant('ai-operations'),
  fc.constant('decision-authority'),
  fc.constant('risk-intelligence'),
  fc.constant('ai-and-work'),
  fc.string({ minLength: 1, maxLength: 15 })
);

// --- Property Tests ---

describe('filterPostsLogic Property Tests', () => {
  /**
   * Property 2: Subset property
   *
   * For any posts array and any combination of filter criteria,
   * the filtered result is always a subset of the input array
   * (every item in the result exists in the original array)
   * and result.length <= posts.length.
   *
   * **Validates: Requirements 3.3**
   */
  it('filtered result is always a subset of the input array', () => {
    fc.assert(
      fc.property(
        postsArbitrary,
        searchTermArbitrary,
        statusFilterArbitrary,
        positionFilterArbitrary,
        (posts, searchTerm, statusFilter, positionFilter) => {
          const result = filterPostsLogic(posts, searchTerm, statusFilter, positionFilter);

          // Result length must not exceed input length
          expect(result.length).toBeLessThanOrEqual(posts.length);

          // Every item in the result must exist in the original array (by reference)
          for (const item of result) {
            expect(posts).toContain(item);
          }
        }
      ),
      { numRuns: 200 }
    );
  });

  /**
   * Property 3: Status consistency
   *
   * When a status filter is applied (not "all"), every post in the
   * filtered result has a `status` field equal to the filter value.
   *
   * **Validates: Requirements 3.3**
   */
  it('status filter produces only posts with matching status', () => {
    fc.assert(
      fc.property(
        postsArbitrary,
        searchTermArbitrary,
        fc.oneof(
          fc.constant('published'),
          fc.constant('draft'),
          fc.constant('archived'),
          fc.string({ minLength: 1, maxLength: 15 })
        ),
        positionFilterArbitrary,
        (posts, searchTerm, statusFilter, positionFilter) => {
          // Only test with non-"all" status filters
          const result = filterPostsLogic(posts, searchTerm, statusFilter, positionFilter);

          // Every post in the result must have the matching status
          for (const post of result) {
            expect(post.status).toBe(statusFilter);
          }
        }
      ),
      { numRuns: 200 }
    );
  });
});
