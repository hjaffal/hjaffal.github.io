/**
 * Property-based tests for computePostStats.
 * Tests Property 1 from the design document.
 *
 * **Validates: Requirements 2.3**
 */
import { describe, it, expect, vi } from 'vitest';
import fc from 'fast-check';

// Mock main.js since it imports Firebase from CDN URLs that can't resolve in Node
vi.mock('../../assets/js/admin/main.js', () => ({
  show: vi.fn(),
  hide: vi.fn(),
  $: vi.fn(),
  apiFetch: vi.fn(),
  formatDate: vi.fn(),
  escHtml: vi.fn(),
  getApiUrls: vi.fn(),
  switchPanel: vi.fn(),
}));

import { computePostStats } from '../../assets/js/admin/dashboard.js';

// --- Generators ---

/** Generate a random post status (mix of valid and invalid values) */
const postStatus = fc.oneof(
  fc.constant('published'),
  fc.constant('draft'),
  fc.constant('archived'),
  fc.string({ minLength: 1, maxLength: 20 }) // random/invalid statuses
);

/** Generate a random date string or the placeholder '—' */
const postDate = fc.oneof(
  fc.constant('—'),
  fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }).map(d => d.toISOString().split('T')[0])
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
  title: fc.string({ minLength: 0, maxLength: 100 }),
  slug: fc.string({ minLength: 0, maxLength: 50 }),
  url: fc.string({ minLength: 0, maxLength: 100 }),
  date: postDate,
  lastUpdated: postDate,
  author: fc.string({ minLength: 0, maxLength: 30 }),
  tags: postTags,
  status: postStatus,
});

/** Generate an array of posts */
const postsArbitrary = fc.array(postArbitrary, { minLength: 0, maxLength: 50 });

// --- Property Tests ---

describe('computePostStats Property Tests', () => {
  /**
   * Property 1a: stats.total === posts.length
   *
   * For any array of post objects, the total count must always equal
   * the input array length.
   *
   * **Validates: Requirements 2.3**
   */
  it('total always equals input array length', () => {
    fc.assert(
      fc.property(postsArbitrary, (posts) => {
        const stats = computePostStats(posts);
        expect(stats.total).toBe(posts.length);
      }),
      { numRuns: 200 }
    );
  });

  /**
   * Property 1b: stats.published + stats.draft + stats.archived <= stats.total
   *
   * Status counts are subsets and cannot exceed the total. Posts with
   * unrecognized status are not counted in any status bucket.
   *
   * **Validates: Requirements 2.3**
   */
  it('status counts do not exceed total', () => {
    fc.assert(
      fc.property(postsArbitrary, (posts) => {
        const stats = computePostStats(posts);
        expect(stats.published + stats.draft + stats.archived).toBeLessThanOrEqual(stats.total);
      }),
      { numRuns: 200 }
    );
  });
});
