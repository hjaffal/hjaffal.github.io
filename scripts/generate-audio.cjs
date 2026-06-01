/**
 * Generate TTS audio for vocabulary words using Sproochmaschinn API
 * Usage: node scripts/generate-audio.js [category-file]
 * Example: node scripts/generate-audio.js essential-words
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const BASE_URL = 'https://sproochmaschinn.lu';
const DELAY_MS = 7000; // 7s between requests (rate limit: 10/min)
const OUTPUT_DIR = path.join(__dirname, '..', 'assets', 'audio', 'vocab');

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function createSession() {
  const res = await fetch(`${BASE_URL}/api/session`, { method: 'POST' });
  const data = await res.json();
  console.log(`Session created: ${data.session_id}`);
  return data.session_id;
}

async function generateTTS(sessionId, text) {
  const res = await fetch(`${BASE_URL}/api/tts/${sessionId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: text, model: 'claude' })
  });
  const data = await res.json();
  return data.request_id;
}

async function pollResult(requestId, maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    await sleep(2000);
    const res = await fetch(`${BASE_URL}/api/result/${requestId}`);
    const data = await res.json();
    if (data.status === 'completed') return data.result;
    if (data.status === 'error') throw new Error(`TTS error for request ${requestId}`);
  }
  throw new Error(`Timeout waiting for request ${requestId}`);
}

async function main() {
  const categorySlug = process.argv[2] || 'essential-words';
  const yamlPath = path.join(__dirname, '..', '_data', 'vocab', `${categorySlug}.yml`);

  if (!fs.existsSync(yamlPath)) {
    console.error(`File not found: ${yamlPath}`);
    process.exit(1);
  }

  // Load vocab
  const words = yaml.load(fs.readFileSync(yamlPath, 'utf8'));
  console.log(`Loaded ${words.length} words from ${categorySlug}.yml`);

  // Create output directory
  const categoryDir = path.join(OUTPUT_DIR, categorySlug);
  fs.mkdirSync(categoryDir, { recursive: true });

  // Create session
  const sessionId = await createSession();

  let generated = 0;
  let skipped = 0;
  let failed = 0;

  for (const word of words) {
    const outputFile = path.join(categoryDir, `${word.id}.m4a`);

    // Skip if already generated
    if (fs.existsSync(outputFile)) {
      skipped++;
      continue;
    }

    const text = word.lb;
    console.log(`[${generated + skipped + failed + 1}/${words.length}] Generating: "${text}" → ${word.id}.m4a`);

    try {
      const requestId = await generateTTS(sessionId, text);
      const result = await pollResult(requestId);

      // Save base64 WAV to file, then convert to m4a
      const audioBuffer = Buffer.from(result.data, 'base64');
      const wavFile = outputFile.replace('.m4a', '.wav');
      fs.writeFileSync(wavFile, audioBuffer);
      
      // Convert to m4a using macOS afconvert
      const { execSync } = require('child_process');
      try {
        execSync(`afconvert "${wavFile}" "${outputFile}" -d aac -f m4af -b 64000`, { stdio: 'ignore' });
        fs.unlinkSync(wavFile); // Remove WAV after conversion
      } catch (e) {
        // If afconvert fails, keep the wav and rename
        fs.renameSync(wavFile, outputFile);
      }
      
      generated++;
      const fileSize = fs.statSync(outputFile).size;
      console.log(`  ✓ Saved (${(fileSize / 1024).toFixed(1)} KB, ${result.duration}s)`);
    } catch (err) {
      failed++;
      console.error(`  ✗ Failed: ${err.message}`);
    }

    // Rate limit delay
    await sleep(DELAY_MS);
  }

  console.log(`\nDone! Generated: ${generated}, Skipped: ${skipped}, Failed: ${failed}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
