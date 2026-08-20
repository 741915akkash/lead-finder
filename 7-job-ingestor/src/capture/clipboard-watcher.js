const clipboard = require('clipboardy');
const fs = require('fs');
const path = require('path');

const INBOX_DIR = path.join(__dirname, '../../data/captures/inbox');

const POLL_INTERVAL_MS = 500;
const URL_TIMEOUT_MS = 60 * 1000;

const MIN_JOB_TEXT_LENGTH = 500;
const MIN_JOB_SIGNALS = 2;

const JOB_SIGNALS = [
  'about the role',
  'about the company',
  'responsibilities',
  'requirements',
  'required skills',
  'must have',
  'what you’ll do',
  "what you'll do",
  'what we offer',
  'what we value',
  'qualifications',
  'experience',
  'employment type',
  'location:',
  'job title:',
  'salary',
  'compensation',
  'recruiter',
  'apply',
  'full-time',
  'part-time',
  'years of experience',
];

let state = 'IDLE';

let lastClipboard = '';
let capturedJobText = '';
let urlTimeout = null;
let pollInterval = null;

function ensureDirectories() {
  fs.mkdirSync(INBOX_DIR, {
    recursive: true,
  });
}

function getJobSignals(text) {
  if (!text || typeof text !== 'string') {
    return [];
  }

  const normalized = text.toLowerCase();

  return JOB_SIGNALS.filter((signal) => normalized.includes(signal.toLowerCase()));
}

function isJobPosting(text) {
  if (!text || typeof text !== 'string') {
    return false;
  }

  if (text.length < MIN_JOB_TEXT_LENGTH) {
    return false;
  }

  const signals = getJobSignals(text);

  return signals.length >= MIN_JOB_SIGNALS;
}

function isValidUrl(text) {
  if (!text || typeof text !== 'string') {
    return false;
  }

  try {
    const url = new URL(text.trim());

    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function createFilename() {
  const now = new Date();

  const timestamp = now.toISOString().replace(/[:.]/g, '-');

  return `job-${timestamp}.json`;
}

function saveCapture(jobText, url) {
  const capture = {
    captured_at: new Date().toISOString(),
    url,
    raw_text: jobText,
  };

  const filename = createFilename();

  const filepath = path.join(INBOX_DIR, filename);

  fs.writeFileSync(filepath, JSON.stringify(capture, null, 2), 'utf8');

  return filepath;
}

function getJobTitle(text) {
  const match = text.match(/^Job Title:\s*(.+)$/im);

  if (match) {
    return match[1].trim();
  }

  // Fallback for postings such as:
  //
  // Full Stack Developer at DrCode.ai
  //
  // where there is no "Job Title:" marker.
  const firstLine = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line.length > 0);

  return firstLine || 'Unknown job';
}

function clearUrlTimeout() {
  if (urlTimeout) {
    clearTimeout(urlTimeout);
    urlTimeout = null;
  }
}

function resetCaptureState() {
  clearUrlTimeout();

  capturedJobText = '';
  state = 'IDLE';
}

function startUrlTimeout() {
  clearUrlTimeout();

  urlTimeout = setTimeout(() => {
    if (state !== 'WAITING_FOR_URL') {
      return;
    }

    console.log('');
    console.log('URL timeout reached.');
    console.log('No valid job URL was copied within 60 seconds.');
    console.log('Discarding pending job capture.');
    console.log('');
    console.log('Waiting for job postings...');

    resetCaptureState();
  }, URL_TIMEOUT_MS);
}

function handleJobCapture(text) {
  capturedJobText = text;

  const title = getJobTitle(text);
  const signals = getJobSignals(text);

  console.log('');
  console.log('======================================');
  console.log('JOB CAPTURED');
  console.log('======================================');
  console.log(`Title: ${title}`);
  console.log(`Length: ${text.length} characters`);
  console.log(`Job signals: ${signals.length}`);
  console.log('');
  console.log('Now copy the job URL.');
  console.log('Waiting for next clipboard change...');
  console.log('');

  state = 'WAITING_FOR_URL';

  startUrlTimeout();
}

function handleUrlCapture(text) {
  const url = text.trim();

  clearUrlTimeout();

  const filepath = saveCapture(capturedJobText, url);

  console.log('');
  console.log('======================================');
  console.log('✓ JOB CAPTURED');
  console.log('======================================');
  console.log(`✓ URL: ${url}`);
  console.log(`✓ Saved: ${filepath}`);
  console.log('');

  resetCaptureState();

  console.log('Waiting for job postings...');
  console.log('');
}

async function pollClipboard() {
  try {
    const currentClipboard = await clipboard.read();

    if (!currentClipboard) {
      return;
    }

    // Ignore unchanged clipboard content.
    if (currentClipboard === lastClipboard) {
      return;
    }

    // Remember every new clipboard value.
    lastClipboard = currentClipboard;

    // ==========================================
    // STATE 1: WAITING FOR A JOB
    // ==========================================

    if (state === 'IDLE') {
      if (!isJobPosting(currentClipboard)) {
        return;
      }

      handleJobCapture(currentClipboard);

      return;
    }

    // ==========================================
    // STATE 2: WAITING FOR URL
    // ==========================================

    if (state === 'WAITING_FOR_URL') {
      // The captured job remains untouched if the
      // next clipboard value isn't a URL.
      if (!isValidUrl(currentClipboard)) {
        console.log('Clipboard changed, but it is not a valid URL.');
        console.log('Still waiting for the job URL...');

        return;
      }

      handleUrlCapture(currentClipboard);

      return;
    }
  } catch (err) {
    console.error('Clipboard watcher error:', err.message);
  }
}

async function startClipboardWatcher() {
  ensureDirectories();

  // Capture the current clipboard value so something
  // copied before starting the session isn't processed.
  try {
    lastClipboard = await clipboard.read();
  } catch (err) {
    console.error('Unable to read clipboard at startup. Will retry during polling:', err.message);

    lastClipboard = '';
  }

  console.log('======================================');
  console.log('JOB CLIPBOARD CAPTURE SESSION');
  console.log('======================================');
  console.log('');
  console.log('Status: ON');
  console.log('');
  console.log('Job detection:');
  console.log(`  Minimum text: ${MIN_JOB_TEXT_LENGTH} characters`);
  console.log(`  Minimum signals: ${MIN_JOB_SIGNALS}`);
  console.log('');
  console.log('Waiting for job postings...');
  console.log('');
  console.log('Press Ctrl+C to stop.');
  console.log('');

  pollInterval = setInterval(pollClipboard, POLL_INTERVAL_MS);

  process.on('SIGINT', () => {
    console.log('');
    console.log('Stopping job capture session...');

    clearUrlTimeout();

    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }

    process.exit(0);
  });
}

module.exports = {
  startClipboardWatcher,
};
