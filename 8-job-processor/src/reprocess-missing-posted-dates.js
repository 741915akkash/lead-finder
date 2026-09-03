require('dotenv').config();

const { getJobsMissingPostedAt, updatePostedAt } = require('./repositories/job-postings-repository');

const { extractPostedAtRaw } = require('./ai/parse-job');
const { resolvePostedAt } = require('./normalizers/posted-at');

async function main() {
  console.log('Finding jobs with missing posted_at...');

  const jobs = await getJobsMissingPostedAt();

  console.log(`Found ${jobs.length} jobs with missing posted_at.`);
  console.log('');

  let recovered = 0;
  let unresolved = 0;
  let failed = 0;

  for (const job of jobs) {
    try {
      const postedAtRaw = extractPostedAtRaw(job.raw_text);

      if (!postedAtRaw) {
        console.log(`[NO DATE] #${job.id} ${job.title ?? ''} — ${job.company ?? ''}`);

        unresolved += 1;
        continue;
      }

      const postedAt = resolvePostedAt(postedAtRaw, job.discovered_at);

      if (!postedAt) {
        console.log(`[UNRESOLVED] #${job.id} ${job.title ?? ''} — ${postedAtRaw}`);

        unresolved += 1;
        continue;
      }

      await updatePostedAt(job.id, postedAt);

      console.log(`[RECOVERED] #${job.id} ${job.title ?? ''} — ${postedAtRaw} → ${postedAt}`);

      recovered += 1;
    } catch (error) {
      console.error(`[FAILED] #${job.id} ${job.title ?? ''}: ${error.message}`);

      failed += 1;
    }
  }

  console.log('');
  console.log('--------------------------------------');
  console.log('DATE REPROCESSING COMPLETE');
  console.log('--------------------------------------');
  console.log(`Total:       ${jobs.length}`);
  console.log(`Recovered:   ${recovered}`);
  console.log(`Unresolved:  ${unresolved}`);
  console.log(`Failed:      ${failed}`);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
