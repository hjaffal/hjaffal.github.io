/**
 * Property-based tests for generateCSV.
 * Tests Property 6 from the design document.
 *
 * **Validates: Requirements 6.5**
 */
import { describe, it, expect, vi } from 'vitest';
import fc from 'fast-check';

// Mock main.js since subscribers.js imports from it
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

import { generateCSV } from '../../assets/js/admin/subscribers.js';

// --- Generators ---

/** Generate a string without newlines (to allow naive line splitting) */
const safeString = fc.string({ minLength: 0, maxLength: 50 }).map(s => s.replace(/[\n\r]/g, ''));

/** Generate a subscriber status */
const subscriberStatus = fc.oneof(
  fc.constant('active'),
  fc.constant('inactive'),
  fc.constant('unsubscribed')
);

/** Generate a segments array */
const segmentsArbitrary = fc.array(
  fc.oneof(
    fc.constant('main_website'),
    fc.constant('sproochentest_prep'),
    fc.constant('testing'),
    safeString
  ),
  { minLength: 0, maxLength: 4 }
);

/** Generate a date string */
const dateArbitrary = fc.oneof(
  fc.constant(''),
  fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }).map(d => d.toISOString())
);

/** Generate a single subscriber object (fields without newlines) */
const subscriberArbitrary = fc.record({
  email: safeString,
  name: safeString,
  status: subscriberStatus,
  segments: segmentsArbitrary,
  subscribedAt: dateArbitrary,
});

/** Generate an array of subscribers */
const subscribersArbitrary = fc.array(subscriberArbitrary, { minLength: 0, maxLength: 50 });

// --- Property Tests ---

describe('generateCSV Property Tests', () => {
  /**
   * Property 6: CSV export row count
   *
   * For any array of subscriber objects, the generated CSV string SHALL
   * contain exactly subscribers.length + 1 lines (one header row plus
   * one data row per subscriber).
   *
   * **Validates: Requirements 6.5**
   */
  it('produces exactly subscribers.length + 1 lines', () => {
    fc.assert(
      fc.property(subscribersArbitrary, (subscribers) => {
        const csv = generateCSV(subscribers);
        const lines = csv.split('\n');
        expect(lines.length).toBe(subscribers.length + 1);
      }),
      { numRuns: 200 }
    );
  });

  /**
   * Property 6 (header check): The first line is always the expected header row.
   *
   * **Validates: Requirements 6.5**
   */
  it('first line is always the header row', () => {
    fc.assert(
      fc.property(subscribersArbitrary, (subscribers) => {
        const csv = generateCSV(subscribers);
        const firstLine = csv.split('\n')[0];
        expect(firstLine).toBe('Email,Name,Status,Segments,Subscribed Date');
      }),
      { numRuns: 200 }
    );
  });

  /**
   * Edge case: empty array produces exactly 1 line (just the header).
   *
   * **Validates: Requirements 6.5**
   */
  it('empty array produces exactly 1 line (header only)', () => {
    const csv = generateCSV([]);
    const lines = csv.split('\n');
    expect(lines.length).toBe(1);
    expect(lines[0]).toBe('Email,Name,Status,Segments,Subscribed Date');
  });
});
