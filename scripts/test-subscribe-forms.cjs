/**
 * Test: Verify all subscription forms are correctly wired.
 * Checks:
 * 1. Every form that subscribes uses HJ.subscribe (no direct fetch)
 * 2. Every form has a honeypot field
 * 3. The subscribe.js module is loaded before custom-script.js
 * 4. Server-side segment mapping is correct
 * 5. No form subscribes to both segments
 *
 * Run: node scripts/test-subscribe-forms.cjs
 */

const fs = require('fs');
const path = require('path');

const SITE_DIR = path.join(__dirname, '..', '_site');
let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log('  ✓ ' + message);
  } else {
    failed++;
    console.log('  ✗ FAIL: ' + message);
  }
}

function readFile(relativePath) {
  const fullPath = path.join(__dirname, '..', relativePath);
  if (!fs.existsSync(fullPath)) return null;
  return fs.readFileSync(fullPath, 'utf8');
}

function readSiteFile(relativePath) {
  const fullPath = path.join(SITE_DIR, relativePath);
  if (!fs.existsSync(fullPath)) return null;
  return fs.readFileSync(fullPath, 'utf8');
}

console.log('=== Subscribe Module Integration Tests ===\n');

// --- Test 1: subscribe.js exists and is valid ---
console.log('1. subscribe.js module:');
const subscribeJs = readFile('assets/js/subscribe.js');
assert(subscribeJs !== null, 'subscribe.js exists');
assert(subscribeJs.includes('HJ.subscribe = function'), 'HJ.subscribe function defined');
assert(subscribeJs.includes('HJ.isSubscribed'), 'HJ.isSubscribed function defined');
assert(subscribeJs.includes('HJ.getHoneypot'), 'HJ.getHoneypot function defined');
assert(subscribeJs.includes('hj_subscribed'), 'Uses unified localStorage key');
assert(subscribeJs.includes('website_url'), 'Sends honeypot field in payload');

// --- Test 2: subscribe.js loaded before custom-script.js ---
console.log('\n2. Load order in _config.yml:');
const config = readFile('_config.yml');
const subscribeIdx = config.indexOf('subscribe.js');
const customIdx = config.indexOf('custom-script.js');
assert(subscribeIdx < customIdx, 'subscribe.js loads before custom-script.js');

// --- Test 3: No direct fetch to subscribe endpoint in frontend files ---
console.log('\n3. No direct fetch calls to subscribe endpoint:');
const frontendFiles = [
  'assets/js/custom-script.js',
  'assets/js/vocab-engine.js',
  '_layouts/sproochentest-topic.html',
  '_layouts/template.html',
  'sproochentest-materials/materials.html',
  'future-proof-skills.html',
  'index.html',
  'newsletter.html',
];
frontendFiles.forEach(f => {
  const content = readFile(f);
  if (!content) { assert(false, f + ' — file not found'); return; }
  const hasDirect = content.includes("fetch('{{ site.data.firebase.fn_subscribe }}") ||
                    content.includes('fetch(fnUrl') && content.includes('fn-subscribe');
  // The only allowed pattern is via HJ.subscribe
  const usesHJ = content.includes('HJ.subscribe') || content.includes('handleNewsletterSubscribe');
  assert(!hasDirect, f + ' — no direct fetch to subscribe endpoint');
});

// --- Test 4: All forms have honeypot fields ---
console.log('\n4. Honeypot field presence:');
const formsToCheck = [
  { file: '_includes/newsletter.html', name: 'Main newsletter include' },
  { file: '_includes/sproochentest-newsletter.html', name: 'Sproochentest newsletter include' },
  { file: '_layouts/sproochentest-topic.html', name: 'Sproochentest topic gate' },
  { file: 'sproochentest-materials/materials.html', name: 'Materials download gate' },
  { file: 'index.html', name: 'Homepage forms' },
  { file: 'newsletter.html', name: 'Newsletter page' },
  { file: 'future-proof-skills.html', name: 'Future-proof skills gate' },
];
formsToCheck.forEach(item => {
  const content = readFile(item.file);
  if (!content) { assert(false, item.name + ' — file not found'); return; }
  assert(content.includes('name="website_url"'), item.name + ' has honeypot field');
});

// --- Test 5: Server-side segment mapping ---
console.log('\n5. Server-side segment mapping:');
const subscribeFn = readFile('functions/newsletter/subscribe.js');
assert(subscribeFn.includes('sproochentest_gate'), 'Recognizes sproochentest_gate source');
assert(subscribeFn.includes('materials_download'), 'Recognizes materials_download source');
assert(subscribeFn.includes('utmSource === "sproochentest"'), 'Recognizes sproochentest source');
assert(subscribeFn.includes('["sproochentest_prep"]'), 'Assigns sproochentest_prep segment');
assert(subscribeFn.includes('["main_website"]'), 'Assigns main_website segment');
// Ensure no dual-segment assignment
const dualSegment = subscribeFn.match(/\["main_website".*"sproochentest_prep"\]|\["sproochentest_prep".*"main_website"\]/);
assert(!dualSegment, 'No dual-segment assignment in subscribe function');

// --- Test 6: Bot detection ---
console.log('\n6. Bot detection (utils.js):');
const utils = readFile('functions/newsletter/utils.js');
assert(utils.includes('detectBot'), 'detectBot function exists');
assert(utils.includes('website_url'), 'Checks honeypot field');
assert(utils.includes('gmail_dot_abuse'), 'Detects Gmail dot abuse');
assert(utils.includes('BLOCKED_PREFIXES'), 'Has role-based prefix blocklist');
assert(utils.includes('normalizeEmail'), 'normalizeEmail function exists');
assert(utils.includes('.replace(/\\./g,'), 'Strips dots from Gmail');
assert(utils.includes("split(\"+\")"), 'Strips +aliases from Gmail');

// --- Test 7: AI Job Risk Analyzer uses shared utils ---
console.log('\n7. AI Job Risk Analyzer:');
const indexJs = readFile('functions/index.js');
assert(indexJs.includes('normalizeEmail') || indexJs.includes('normEmail'), 'Uses normalizeEmail');
assert(indexJs.includes('detectBot'), 'Uses detectBot');
assert(indexJs.includes('segments: ["main_website"]'), 'Assigns main_website only');
assert(!indexJs.includes('segments: ["main_website", "sproochentest_prep"]'), 'No dual segment in job analyzer');

// --- Test 8: downloads.js no longer creates subscribers ---
console.log('\n8. downloads.js cleanup:');
const downloadsJs = readFile('functions/newsletter/downloads.js');
assert(!downloadsJs.includes('generateUnsubscribeToken'), 'No subscriber creation in downloads.js');
assert(!downloadsJs.includes('segments:'), 'No segment assignment in downloads.js');

// --- Test 9: Built site loads subscribe.js ---
console.log('\n9. Built site verification:');
const builtIndex = readSiteFile('index.html');
if (builtIndex) {
  assert(builtIndex.includes('subscribe.js'), 'Homepage loads subscribe.js');
  assert(builtIndex.indexOf('subscribe.js') < builtIndex.indexOf('custom-script.js'), 'subscribe.js before custom-script.js in built HTML');
} else {
  assert(false, 'Built site index.html not found (run jekyll build first)');
}

// --- Summary ---
console.log('\n' + '='.repeat(50));
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log('='.repeat(50));
process.exit(failed > 0 ? 1 : 0);
