import { describe, it, expect } from 'vitest';
import '../../assets/js/external-links.js';
const isExternal = globalThis.isExternalLink;

const base = 'https://hasanjaffal.com/aboutme/';
describe('isExternal', () => {
  it('treats other websites as external', () => {
    expect(isExternal('https://gepackt.lu/', base)).toBe(true);
    expect(isExternal('http://example.org/page', base)).toBe(true);
  });
  it('keeps this site, www and relative links internal', () => {
    expect(isExternal('/writing/', base)).toBe(false);
    expect(isExternal('#top', base)).toBe(false);
    expect(isExternal('https://www.hasanjaffal.com/cv/', base)).toBe(false);
  });
  it('ignores non-web links', () => {
    expect(isExternal('mailto:someone@example.com', base)).toBe(false);
    expect(isExternal('tel:+352000', base)).toBe(false);
    expect(isExternal('javascript:void(0)', base)).toBe(false);
  });
});
