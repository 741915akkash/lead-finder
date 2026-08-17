require('dotenv').config();

const { processNextJob } = require('./jobs/process-job');

const POLL_INTERVAL_MS = 5000;

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function main() {
  console.log('======================================');
  console.log('JOB PROCESSOR');
  console.log('======================================');
  console.log('');
  console.log('Status: ON');
  console.log('Polling every 5 seconds.');
  console.log('');
  console.log('Waiting for jobs...');
  console.log('');

  while (true) {
    try {
      await processNextJob();
    } catch (err) {
      console.error('Processor cycle failed:', err.message);
    }

    await sleep(POLL_INTERVAL_MS);
  }
}

main().catch((err) => {
  console.error('Job processor failed:', err);

  process.exit(1);
});
