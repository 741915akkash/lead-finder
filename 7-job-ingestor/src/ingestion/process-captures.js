const fs = require('fs');
const path = require('path');

const { supabase } = require('../db/db');
const { detectSource } = require('../services/detect-source');
const { createJobId } = require('../services/create-job-id');
const { createProcessingJob } = require('../services/create-processing-job');

const CAPTURE_DIR = path.join(__dirname, '../../data/captures');

const INBOX_DIR = path.join(CAPTURE_DIR, 'inbox');

const PROCESSING_DIR = path.join(CAPTURE_DIR, 'processing');

const PROCESSED_DIR = path.join(CAPTURE_DIR, 'processed');

const FAILED_DIR = path.join(CAPTURE_DIR, 'failed');

const POLL_INTERVAL_MS = 5000;

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function ensureDirectories() {
  [INBOX_DIR, PROCESSING_DIR, PROCESSED_DIR, FAILED_DIR].forEach((dir) => {
    fs.mkdirSync(dir, {
      recursive: true,
    });
  });
}

function getCaptureFiles() {
  return fs.readdirSync(INBOX_DIR).filter((filename) => filename.endsWith('.json'));
}

function moveFile(filename, fromDir, toDir) {
  fs.renameSync(path.join(fromDir, filename), path.join(toDir, filename));
}

function cleanupProcessedFiles() {
  const ONE_HOUR_MS = 60 * 60 * 1000;
  const now = Date.now();

  let files;

  try {
    files = fs.readdirSync(PROCESSED_DIR);
  } catch (error) {
    console.error('Could not read processed directory:', error.message);
    return;
  }

  for (const filename of files) {
    const filepath = path.join(PROCESSED_DIR, filename);

    try {
      const stats = fs.statSync(filepath);

      if (!stats.isFile()) {
        continue;
      }

      const ageMs = now - stats.mtimeMs;

      if (ageMs > ONE_HOUR_MS) {
        fs.unlinkSync(filepath);

        console.log(`🗑 Deleted processed capture older than 1 hour: ${filename}`);
      }
    } catch (error) {
      console.error(`Could not clean processed file ${filename}:`, error.message);
    }
  }
}

async function ingestCapture(filename) {
  const inboxPath = path.join(INBOX_DIR, filename);

  const processingPath = path.join(PROCESSING_DIR, filename);

  // Claim the file before processing it.
  //
  // This prevents the same file from being picked up
  // repeatedly during the same processing cycle.
  fs.renameSync(inboxPath, processingPath);

  try {
    const rawFile = fs.readFileSync(processingPath, 'utf8');

    const capture = JSON.parse(rawFile);

    if (!capture.url) {
      throw new Error('Capture does not contain a URL');
    }

    if (!capture.raw_text) {
      throw new Error('Capture does not contain raw_text');
    }

    const source = detectSource(capture.url);

    const sourceJobId = createJobId(source, capture.url);

    const firstLine = capture.raw_text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find(Boolean);

    const { data, error } = await supabase
      .from('job_postings')
      .upsert(
        {
          source,
          source_job_id: sourceJobId,

          url: capture.url,
          apply_url: capture.url,

          title: firstLine || 'Unparsed job',

          company: null,
          location: null,

          description: capture.raw_text,
          raw_text: capture.raw_text,

          status: 'captured',

          raw_data: {
            capture_file: filename,
            captured_at: capture.captured_at,
          },
        },
        {
          onConflict: 'source,source_job_id',
        },
      )
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Create the downstream processing job.
    //
    // jobs_2 is the queue consumed by 8-job-processor.
    await createProcessingJob(data.id);

    // Only mark the capture as processed after both:
    //
    // 1. job_postings was successfully upserted
    // 2. jobs_2 processing job was successfully created
    //
    moveFile(filename, PROCESSING_DIR, PROCESSED_DIR);

    cleanupProcessedFiles();

    console.log(`✓ Ingested: ${data.title} (${source})`);
  } catch (err) {
    console.error(`✗ Failed: ${filename}`, err.message);

    try {
      moveFile(filename, PROCESSING_DIR, FAILED_DIR);
    } catch (moveError) {
      console.error('Could not move failed capture:', moveError.message);
    }
  }
}

async function processPendingCaptures() {
  const files = getCaptureFiles();

  if (files.length === 0) {
    return;
  }

  console.log(`Found ${files.length} capture(s).`);

  for (const filename of files) {
    await ingestCapture(filename);
  }
}

async function startIngestionWorker() {
  ensureDirectories();

  console.log('======================================');
  console.log('JOB CAPTURE INGESTION WORKER');
  console.log('======================================');
  console.log('');
  console.log('Status: ON');
  console.log(`Polling every ${POLL_INTERVAL_MS / 1000} seconds.`);
  console.log('');
  console.log('Watching:');
  console.log(INBOX_DIR);
  console.log('');
  console.log('Waiting for captures...');
  console.log('');

  while (true) {
    try {
      await processPendingCaptures();
    } catch (err) {
      console.error('Capture ingestion cycle failed:', err.message);
    }

    await sleep(POLL_INTERVAL_MS);
  }
}

module.exports = {
  startIngestionWorker,
};
