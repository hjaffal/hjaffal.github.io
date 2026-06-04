/**
 * Full integration test for subscription system.
 * Tests:
 * - Built site: all pages load subscribe.js + have honeypots
 * - Cloud Functions: subscribe endpoint responds correctly
 * - Segment routing: correct segment per source
 * - Bot detection: honeypot, Gmail dots, role prefixes
 * - All subscribe entry points wired correctly
 *
 * Run: node scripts/test-full-subscribe.cjs
 */

const fs = require('fs');
const path = require('path');

const SITE_DIR = path.join(__dirname, '..', '_site');
const FN_DIR = path.join(__dirname, '..', 'functions');
let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) { passed++; console.log('  ✓ ' + message); }
  else { failed++; console.log('  ✗ FAIL: ' + message); }
}

function readFile(rel) {
  const p = path.join(__dirname, '..', rel);
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null;
}

function readSite(rel) {
  const p = path.join(SITE_DIR, rel);
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null;
}

// ===== SECTION 1: Built pages load subscribe.js =====
console.log('═══ 1. subscribe.js loaded on all pages ═══');
const pagesToCheck = [
  'index.html',
  'sproochentest/index.html',
  'sproochentest/vocab/index.html',
  'sproochentest/gesondheet/index.html',
  'newsletter/index.html',
  'writing/index.html',
  'aboutme/index.html',
  'contact/index.html',
  'ai-job-risk-analyzer/index.html',
];
pagesToCheck.forEach(p => {
  const content = readSite(p);
  if (!content) { assert(false, p + ' — page not found in _site'); return; }
  assert(content.includes('/assets/js/subscribe.js'), p + ' loads subscribe.js');
});

// ===== SECTION 2: subscribe.js loads BEFORE custom-script.js =====
console.log('\n═══ 2. Load order correct ═══');
pagesToCheck.slice(0, 3).forEach(p => {
  const content = readSite(p);
  if (!content) return;
  const subIdx = content.indexOf('subscribe.js');
  const cusIdx = content.indexOf('custom-script.js');
  assert(subIdx > 0 && subIdx < cusIdx, p + ' — subscribe.js before custom-script.js');
});

// ===== SECTION 3: Honeypot field on all forms =====
console.log('\n═══ 3. Honeypot field on all subscribe forms ═══');
const formPages = [
  { page: 'index.html', name: 'Homepage' },
  { page: 'sproochentest/index.html', name: 'Sproochentest home' },
  { page: 'newsletter/index.html', name: 'Newsletter page' },
  { page: 'sproochentest/gesondheet/index.html', name: 'Sproochentest topic (gate)' },
];
formPages.forEach(item => {
  const content = readSite(item.page);
  if (!content) { assert(false, item.name + ' — not found'); return; }
  // Count forms vs honeypots
  const formCount = (content.match(/onsubmit.*handleNewsletterSubscribe|onsubmit.*handleGatedSubscribe|id="sp-gate-form"/g) || []).length;
  const honeypotCount = (content.match(/name="website_url"/g) || []).length;
  assert(honeypotCount >= formCount, item.name + ' — honeypots(' + honeypotCount + ') >= forms(' + formCount + ')');
});

// ===== SECTION 4: No direct fetch to subscribe endpoint =====
console.log('\n═══ 4. No direct fetch to fn_subscribe in frontend ═══');
const frontendJsFiles = [
  'assets/js/custom-script.js',
  'assets/js/vocab-engine.js',
  'assets/js/subscribe.js',
];
frontendJsFiles.forEach(f => {
  const content = readFile(f);
  if (!content) return;
  if (f === 'assets/js/subscribe.js') {
    // subscribe.js IS allowed to call the endpoint
    assert(content.includes('fn-subscribe'), f + ' — calls endpoint (expected)');
  } else {
    const direct = content.includes("querySelector('meta[name=\"fn-subscribe\"]')") ||
                   content.includes('fn-subscribe') && !content.includes('HJ.');
    assert(!direct || content.includes('HJ.subscribe'), f + ' — uses HJ.subscribe, not direct fetch');
  }
});

// Check HTML files with inline scripts
const htmlWithScripts = [
  '_layouts/sproochentest-topic.html',
  '_layouts/template.html',
  'sproochentest-materials/materials.html',
  'future-proof-skills.html',
];
htmlWithScripts.forEach(f => {
  const content = readFile(f);
  if (!content) { assert(false, f + ' — not found'); return; }
  const hasDirect = content.includes("fetch('{{ site.data.firebase.fn_subscribe }}");
  assert(!hasDirect, f + ' — no direct fetch to subscribe');
  assert(content.includes('HJ.subscribe'), f + ' — uses HJ.subscribe');
});

// ===== SECTION 5: Server-side segment mapping =====
console.log('\n═══ 5. Server-side segment mapping ═══');
const subscribeFn = readFile('functions/newsletter/subscribe.js');

// Sproochentest sources → sproochentest_prep
const sproochSources = ['sproochentest', 'sproochentest_gate', 'materials_download'];
sproochSources.forEach(src => {
  assert(subscribeFn.includes('"' + src + '"'), 'Source "' + src + '" recognized as sproochentest');
});

// Non-sproochentest sources → main_website (by exclusion)
const mainSources = ['website', 'homepage', 'newsletter_page', 'lexicon', 'gated_content', 'template_download', 'future_proof_skills'];
mainSources.forEach(src => {
  const isInSproochCheck = subscribeFn.includes('utmSource === "' + src + '"') &&
    subscribeFn.indexOf('utmSource === "' + src + '"') > subscribeFn.indexOf('isSproochentest');
  assert(!isInSproochCheck, 'Source "' + src + '" → main_website (not in sproochentest check)');
});

// No dual segment
assert(!subscribeFn.includes('["main_website", "sproochentest_prep"]'), 'No dual segment in subscribe');
assert(!subscribeFn.includes('["sproochentest_prep", "main_website"]'), 'No reverse dual segment');

// ===== SECTION 6: Bot detection in subscribe function =====
console.log('\n═══ 6. Bot detection active ═══');
assert(subscribeFn.includes('detectBot'), 'subscribe.js imports detectBot');
assert(subscribeFn.includes('botCheck.isBot'), 'subscribe.js checks botCheck.isBot');
assert(subscribeFn.includes('botCheck.isBot') && subscribeFn.includes('result: "success"'),
  'Bot check returns fake 200 (silent drop)');

// ===== SECTION 7: Gmail normalization =====
console.log('\n═══ 7. Gmail normalization ═══');
const utils = readFile('functions/newsletter/utils.js');
assert(utils.includes('gmail.com'), 'normalizeEmail handles gmail.com');
assert(utils.includes('googlemail.com'), 'normalizeEmail handles googlemail.com');
assert(utils.includes('.replace(/\\./g,'), 'Strips dots from local part');
assert(utils.includes('.split("+")'), 'Strips +alias from local part');
assert(utils.includes('gmail_dot_abuse'), 'detectBot catches excessive dots');

// ===== SECTION 8: AI Job Risk Analyzer =====
console.log('\n═══ 8. AI Job Risk Analyzer ═══');
const indexJs = readFile('functions/index.js');
assert(indexJs.includes('detectBot'), 'analyzeJobRisk uses detectBot');
assert(indexJs.includes('normEmail') || indexJs.includes('normalizeEmail'), 'analyzeJobRisk normalizes email');
assert(indexJs.includes('segments: ["main_website"]'), 'analyzeJobRisk → main_website only');
assert(!indexJs.includes('segments: ["sproochentest_prep"]') ||
  indexJs.indexOf('segments: ["sproochentest_prep"]') === -1 ||
  indexJs.indexOf('segments: ["main_website"]') < indexJs.indexOf('// v2'),
  'No sproochentest_prep in job analyzer');

// ===== SECTION 9: downloads.js cleanup =====
console.log('\n═══ 9. downloads.js — no subscriber creation ═══');
const downloadsJs = readFile('functions/newsletter/downloads.js');
assert(!downloadsJs.includes('generateUnsubscribeToken'), 'No token generation in downloads');
assert(!downloadsJs.includes('segments:'), 'No segment assignment in downloads');
assert(!downloadsJs.includes('segments:'), 'No subscriber creation in downloads (no segments)');

// ===== SECTION 10: Vocab engine =====
console.log('\n═══ 10. Vocab engine subscribe ═══');
const vocabJs = readFile('assets/js/vocab-engine.js');
assert(vocabJs.includes("HJ.subscribe"), 'Vocab engine uses HJ.subscribe');
assert(vocabJs.includes("source: 'sproochentest'"), 'Vocab engine source is sproochentest');
assert(!vocabJs.includes("fetch(url,") || !vocabJs.includes('fn-subscribe'), 'No direct fetch in vocab engine');

// ===== SECTION 11: Sproochentest materials =====
console.log('\n═══ 11. Sproochentest materials download ═══');
const materialsHtml = readFile('sproochentest-materials/materials.html');
assert(materialsHtml.includes("HJ.subscribe"), 'Materials uses HJ.subscribe');
assert(materialsHtml.includes("source: 'materials_download'"), 'Materials source is materials_download');
assert(materialsHtml.includes('name="website_url"'), 'Materials has honeypot');

// ===== SECTION 12: Template download =====
console.log('\n═══ 12. Template download gate ═══');
const templateLayout = readFile('_layouts/template.html');
assert(templateLayout.includes("HJ.subscribe"), 'Template uses HJ.subscribe');
assert(templateLayout.includes("source: 'template_download'"), 'Template source is template_download');

// ===== SUMMARY =====
console.log('\n' + '═'.repeat(50));
console.log(`RESULTS: ${passed} passed, ${failed} failed`);
console.log('═'.repeat(50));
if (failed > 0) {
  console.log('\n⚠️  Fix the failures above before pushing.');
}
process.exit(failed > 0 ? 1 : 0);
