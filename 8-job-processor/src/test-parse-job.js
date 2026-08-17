require('dotenv').config();

const { getJobPostingById } = require('./repositories/job-postings-repository');
const { parseJob } = require('./ai/parse-job');

async function main() {
  const job = await getJobPostingById(91);

  console.log('Job ID:', job.id);
  console.log('Raw text length:', job.raw_text?.length);

  const parsedJob = await parseJob(job.raw_text);

  console.log('\nParsed job:\n');
  console.log(JSON.stringify(parsedJob, null, 2));
}

main().catch((error) => {
  console.error('\nParser test failed:');
  console.error(error);
  process.exit(1);
});
