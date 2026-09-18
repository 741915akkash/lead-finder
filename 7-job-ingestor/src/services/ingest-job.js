const { normalizeJob } = require('./normalize-job');
const { upsertJob } = require('./upsert-job');
const { createProcessingJob } = require('./create-processing-job');

async function ingestJobs(rawJobs) {
  let inserted = 0;
  let failed = 0;

  for (const rawJob of rawJobs) {
    try {
      const job = normalizeJob(rawJob);

      const data = await upsertJob(job);

      await createProcessingJob(data.id);

      inserted += 1;
    } catch (err) {
      failed += 1;

      console.error('Failed to ingest job:', rawJob?.title || 'unknown', err.message);
    }
  }

  return {
    total: rawJobs.length,
    processed: inserted,
    failed,
  };
}

module.exports = {
  ingestJobs,
};
