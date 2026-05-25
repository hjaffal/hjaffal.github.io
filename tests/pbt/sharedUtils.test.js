/**
 * Property-based tests for shared utility functions: slugify and escHtml.
 * Tests Properties 4 and 5 from the design document.
 *
 * Since main.js imports Firebase from CDN URLs that cannot resolve in Node,
 * we replicate the pure function implementations here for testing.
 * These functions have zero dependencies and are safe to test in isolation.
 */
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';

// --- Pure function implementations (copied from assets/js/admin/main.js) ---

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function escHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// --- Property Tests ---

describe('slugify Property Tests', () => {
  /**
   * Property 4: slugify idempotence
   *
   * For any string input, applying slugify twice produces the same result
   * as applying it once. A slug that is already slugified should not change.
   *
   * **Validates: Requirements 1.1**
   */
  it('slugify is idempotent — slugify(slugify(x)) === slugify(x)', () => {
    fc.assert(
      fc.property(fc.string(), (input) => {
        const once = slugify(input);
        const twice = slugify(once);
        expect(twice).toBe(once);
      }),
      { numRuns: 500 }
    );
  });
});

describe('escHtml Property Tests', () => {
  /**
   * Property 5: escHtml round-trip safety
   *
   * For any string input, escHtml(input) output contains no unescaped
   * <, >, &, or " characters. After escaping, the output should not contain
   * raw <, >, or " characters. For &, it should only appear as part of
   * entity references (&amp;, &lt;, &gt;, &quot;).
   *
   * **Validates: Requirements 1.1**
   */
  it('escHtml output contains no unescaped <, >, &, or " characters', () => {
    fc.assert(
      fc.property(fc.string(), (input) => {
        const escaped = escHtml(input);

        // The output must not contain raw < or > or "
        expect(escaped).not.toMatch(/</);
        expect(escaped).not.toMatch(/>/);
        expect(escaped).not.toMatch(/"/);

        // Every & in the output must be part of a valid entity reference
        // Replace all known entities, then check no bare & remains
        const withoutEntities = escaped
          .replace(/&amp;/g, '')
          .replace(/&lt;/g, '')
          .replace(/&gt;/g, '')
          .replace(/&quot;/g, '');
        expect(withoutEntities).not.toMatch(/&/);
      }),
      { numRuns: 500 }
    );
  });
});
