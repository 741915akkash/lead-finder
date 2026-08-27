require('dotenv').config();

const { processNextJob } = require('./jobs/process-job');

const {
  recoverStaleJobs,
  requeueFetchFailedJobs,
  clearCompletedFetchErrors,
} = require('./repositories/jobs-repository');

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

  /*
   * Clean up completed jobs that still contain an old
   * "fetch failed" error.
   */
  try {
    await clearCompletedFetchErrors();
  } catch (err) {
    console.error('Initial completed-job error cleanup failed:', err.message);
  }

  /*
   * Requeue jobs from previous processor runs that
   * permanently failed with a temporary Ollama/network
   * "fetch failed" error.
   *
   * These jobs start over with attempt 1.
   */
  try {
    await requeueFetchFailedJobs();
  } catch (err) {
    console.error('Initial fetch-failed job requeue failed:', err.message);
  }

  /*
   * Recover jobs that may have been left in
   * "processing" after a previous worker crash.
   */
  try {
    await recoverStaleJobs();
  } catch (err) {
    console.error('Initial stale-job recovery failed:', err.message);
  }

  let recoveryCounter = 0;

  while (true) {
    try {
      /*
       * Run stale-job recovery periodically rather than
       * on every 5-second polling cycle.
       *
       * 60 cycles × 5 seconds = 5 minutes.
       */
      if (recoveryCounter >= 60) {
        await recoverStaleJobs();
        recoveryCounter = 0;
      }

      await processNextJob();

      recoveryCounter++;
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
