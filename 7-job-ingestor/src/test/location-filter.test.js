require('dotenv').config();

const { supabase } = require('../db/db');

const { isTargetLocation, getJobLocationTypes } = require('../nfilters/location-filter');

async function main() {
  const { data, error } = await supabase
    .from('job_postings')
    .select(
      `
      id,
      company,
      title,
      location,
      workplace_type,
      raw_data
    `,
    )
    .eq('source', 'ashby')
    .limit(100);

  if (error) {
    throw error;
  }

  let targetCount = 0;

  for (const job of data) {
    const rawJob = job.raw_data || {};

    const target = isTargetLocation(rawJob);
    const types = getJobLocationTypes(rawJob);

    if (target) {
      targetCount++;

      console.log('✓ TARGET');
      console.log(`  ${job.id} | ${job.company} | ${job.title}`);
      console.log(`  DB location: ${job.location}`);
      console.log(`  Types: ${types.join(', ')}`);
      console.log(`  Raw location: ${rawJob.location}`);
      console.log(`  Remote: ${rawJob.isRemote}`);
      console.log(`  Workplace: ${rawJob.workplaceType}`);
      console.log();
    }
  }

  console.log('================================');
  console.log(`Total Ashby jobs: ${data.length}`);
  console.log(`Target locations: ${targetCount}`);
  console.log(`Rejected: ${data.length - targetCount}`);
  console.log('================================');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
