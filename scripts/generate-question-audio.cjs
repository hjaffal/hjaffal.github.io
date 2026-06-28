/**
 * Generate TTS audio for sproochentest speaking questions using Sproochmaschinn API
 * Usage: node scripts/generate-question-audio.cjs [topic-slug]
 * Example: node scripts/generate-question-audio.cjs stot-machen
 *
 * Reads the markdown file for the topic, extracts Luxembourgish questions,
 * and generates audio files in assets/audio/questions/{topic}/
 */

const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://sproochmaschinn.lu';
const DELAY_MS = 7000; // 7s between requests (rate limit: 10/min)
const OUTPUT_DIR = path.join(__dirname, '..', 'assets', 'audio', 'questions');

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

function extractQuestions(mdPath) {
  const content = fs.readFileSync(mdPath, 'utf8');
  // Remove front matter
  const body = content.replace(/^---[\s\S]*?---\n*/, '');
  // Match numbered questions: "1. Wunnt Dir eleng? — *Do you live alone?*"
  const lines = body.split('\n').filter(l => /^\d+\./.test(l.trim()));
  return lines.map((line, i) => {
    // Extract Luxembourgish part (before the — or *)
    const match = line.match(/^\d+\.\s*(.+?)\s*—/);
    const lbText = match ? match[1].trim() : line.replace(/^\d+\.\s*/, '').trim();
    return {
      id: `q${String(i + 1).padStart(2, '0')}`,
      text: lbText
    };
  });
}

async function main() {
  const topicSlug = process.argv[2] || 'stot-machen';
  
  // Find the topic markdown file
  const mdPath = path.join(__dirname, '..', 'sproochentest-materials', 'sample-topics', `${topicSlug}.md`);
  if (!fs.existsSync(mdPath)) {
    console.error(`File not found: ${mdPath}`);
    process.exit(1);
  }

  // Extract questions
  const questions = extractQuestions(mdPath);
  console.log(`Loaded ${questions.length} questions from ${topicSlug}`);

  // Create output directory
  const topicDir = path.join(OUTPUT_DIR, topicSlug);
  fs.mkdirSync(topicDir, { recursive: true });

  // Create session
  const sessionId = await createSession();

  let generated = 0;
  let skipped = 0;
  let failed = 0;

  for (const q of questions) {
    const outputFile = path.join(topicDir, `${q.id}.m4a`);

    // Skip if already generated
    if (fs.existsSync(outputFile)) {
      console.log(`[${generated + skipped + failed + 1}/${questions.length}] SKIP: ${q.id} (exists)`);
      skipped++;
      continue;
    }

    console.log(`[${generated + skipped + failed + 1}/${questions.length}] Generating: "${q.text}" → ${q.id}.m4a`);

    try {
      const requestId = await generateTTS(sessionId, q.text);
      const result = await pollResult(requestId);

      // Save base64 WAV to file, then convert to m4a
      const audioBuffer = Buffer.from(result.data, 'base64');
      const wavFile = outputFile.replace('.m4a', '.wav');
      fs.writeFileSync(wavFile, audioBuffer);

      // Convert to m4a using macOS afconvert
      const { execSync } = require('child_process');
      try {
        execSync(`afconvert "${wavFile}" "${outputFile}" -d aac -f m4af -b 64000`, { stdio: 'ignore' });
        fs.unlinkSync(wavFile);
      } catch (e) {
        fs.renameSync(wavFile, outputFile);
      }

      generated++;
      const fileSize = fs.statSync(outputFile).size;
      console.log(`  ✓ Saved (${(fileSize / 1024).toFixed(1)} KB)`);
    } catch (err) {
      failed++;
      console.error(`  ✗ Failed: ${err.message}`);
    }

    await sleep(DELAY_MS);
  }

  console.log(`\nDone! Generated: ${generated}, Skipped: ${skipped}, Failed: ${failed}`);
  console.log(`Audio files in: ${topicDir}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
