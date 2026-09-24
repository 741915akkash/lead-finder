require('dotenv').config();

const { supabase } = require('../db/db');
const { isTargetJob } = require('../nfilters/title-filter');

async function main() {
  const { data, error } = await supabase
    .from('job_postings')
    .select('id, company, title, location')
    .eq('source', 'ashby')
    .limit(100);

  if (error) {
    throw error;
  }

  let targetCount = 0;

  for (const job of data) {
    const target = isTargetJob(job);

    if (target) {
      targetCount++;

      console.log('✓ TARGET');
      console.log(`  ${job.id} | ${job.company} | ${job.title}`);
      console.log(`  Location: ${job.location}`);
      console.log();
    }
  }

  console.log('================================');
  console.log(`Total jobs: ${data.length}`);
  console.log(`Target titles: ${targetCount}`);
  console.log(`Rejected: ${data.length - targetCount}`);
  console.log('================================');
}

main().catch((error) => {
  console.error('Title filter test failed:', error);
  process.exit(1);
});
