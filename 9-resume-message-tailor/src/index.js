require('dotenv').config();

const { POLL_INTERVAL_MS } = require('./config/config');
const { processNextJob } = require('./worker/process-next-job');

let shuttingDown = false;

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function main() {
  console.log('======================================');
  console.log('RESUME MESSAGE TAILOR');
  console.log('======================================');
  console.log('');
  console.log('Status: ON');
  console.log(`Polling every ${POLL_INTERVAL_MS / 1000} seconds.`);
  console.log('');
  console.log('Waiting for eligible jobs...');
  console.log('');

  while (!shuttingDown) {
    try {
      await processNextJob();
    } catch (error) {
      console.error('Worker cycle failed:', error.message);
    }

    if (!shuttingDown) {
      await sleep(POLL_INTERVAL_MS);
    }
  }

  console.log('Resume/message tailor worker stopped.');
}

function shutdown(signal) {
  if (shuttingDown) {
    return;
  }

  console.log(`Received ${signal}. Shutting down...`);

  shuttingDown = true;
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

main().catch((error) => {
  console.error('Resume/message tailor failed:', error);

  process.exit(1);
});
