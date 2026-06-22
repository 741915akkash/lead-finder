require('dotenv').config();

const { claimJob } = require('./queue/claim-job');
const { completeJob } = require('./queue/complete-job');
const { failJob } = require('./queue/fail-job');

const { dispatchJob } = require('./dispatcher/dispatch-job');

async function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function main() {
  while (true) {
    const job = await claimJob();

    if (!job) {
      await sleep(5000);
      continue;
    }

    try {
      console.log(`Processing ${job.job_type}`);

      const result = await dispatchJob(job);

      await completeJob(job.id, result);
    } catch (err) {
      console.error(err);

      await failJob(job.id, err.message);
    }
  }
}

main().catch(console.error);
