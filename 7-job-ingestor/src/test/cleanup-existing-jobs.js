require('dotenv').config();

const { supabase } = require('../db/db');

const { isTargetJob } = require('../nfilters/title-filter');
const { isTargetLocation } = require('../nfilters/location-filter');
const { requiresMoreThanThreeYears } = require('../nfilters/experience-filter');
const { hasNoVisaSponsorship } = require('../nfilters/visa-filter');

async function getAllJobs() {
  const pageSize = 1000;
  let allJobs = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from('job_postings')
      .select(
        `
        id,
        source,
        source_job_id,
        company,
        title,
        location,
        workplace_type,
        description,
        raw_text,
        raw_data
      `,
      )
      .eq('source', 'ashby')
      .range(from, from + pageSize - 1);

    if (error) throw error;

    allJobs.push(...(data || []));

    if (!data || data.length < pageSize) {
      break;
    }

    from += pageSize;
  }

  return allJobs;
}

function passesFilters(job) {
  const rawJob = job.raw_data || {};

  const description =
    job.description || job.raw_text || rawJob.descriptionPlain || rawJob.description || rawJob.content || '';

  const titlePass = isTargetJob(rawJob);
  const locationPass = isTargetLocation(rawJob);
  const experiencePass = !requiresMoreThanThreeYears(description);
  const visaPass = !hasNoVisaSponsorship(description);

  return {
    titlePass,
    locationPass,
    experiencePass,
    visaPass,
    finalPass: titlePass && locationPass && experiencePass && visaPass,
  };
}

async function deleteJobs(ids) {
  if (!ids.length) return;

  const batchSize = 100;

  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = ids.slice(i, i + batchSize);

    const { error } = await supabase.from('job_postings').delete().in('id', batch);

    if (error) {
      throw error;
    }

    console.log(`Deleted ${batch.length} jobs`);
  }
}

async function main() {
  console.log('======================================');
  console.log('CLEANUP EXISTING JOBS');
  console.log('======================================');

  const jobs = await getAllJobs();

  console.log(`Found ${jobs.length} jobs\n`);

  const jobsToDelete = [];
  const jobsToKeep = [];

  let titleRejected = 0;
  let locationRejected = 0;
  let experienceRejected = 0;
  let visaRejected = 0;

  for (const job of jobs) {
    const result = passesFilters(job);

    if (result.finalPass) {
      jobsToKeep.push(job);
      continue;
    }

    jobsToDelete.push(job);

    if (!result.titlePass) titleRejected++;
    if (!result.locationPass) locationRejected++;
    if (!result.experiencePass) experienceRejected++;
    if (!result.visaPass) visaRejected++;

    console.log(`DELETE | ${job.id} | ${job.company} | ${job.title}`);
  }

  console.log('\n======================================');
  console.log('CLEANUP SUMMARY');
  console.log('======================================');

  console.log(`Total jobs:          ${jobs.length}`);
  console.log(`Jobs to keep:        ${jobsToKeep.length}`);
  console.log(`Jobs to delete:      ${jobsToDelete.length}`);
  console.log('');
  console.log(`Title rejected:      ${titleRejected}`);
  console.log(`Location rejected:   ${locationRejected}`);
  console.log(`Experience rejected: ${experienceRejected}`);
  console.log(`Visa rejected:       ${visaRejected}`);

  if (!jobsToDelete.length) {
    console.log('\nNothing to delete.');
    return;
  }

  console.log('\n======================================');
  console.log('DELETING');
  console.log('======================================');

  await deleteJobs(jobsToDelete.map((job) => job.id));
  // console.log('\nDRY RUN — nothing was deleted.');

  console.log('\nCleanup completed.');
}

main().catch((error) => {
  console.error('\nCleanup failed:', error);
  process.exit(1);
});
