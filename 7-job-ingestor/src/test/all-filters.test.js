require('dotenv').config();

const { supabase } = require('../db/db');

const { isTargetJob } = require('../nfilters/title-filter');
const { isTargetLocation } = require('../nfilters/location-filter');
const { requiresMoreThanThreeYears } = require('../nfilters/experience-filter');
const { hasNoVisaSponsorship } = require('../nfilters/visa-filter');

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
      description,
      raw_text,
      raw_data
    `,
    )
    .eq('source', 'ashby')
    .limit(100);

  if (error) {
    throw error;
  }

  let titlePassed = 0;
  let locationPassed = 0;
  let experiencePassed = 0;
  let visaPassed = 0;
  let finalPassed = 0;

  console.log(`Fetched ${data.length} Ashby jobs\n`);

  for (const job of data) {
    const rawJob = job.raw_data || {};

    const description =
      job.description || job.raw_text || rawJob.descriptionPlain || rawJob.description || rawJob.content || '';

    const titlePass = isTargetJob(rawJob);
    const locationPass = isTargetLocation(rawJob);
    const experiencePass = !requiresMoreThanThreeYears(description);
    const visaPass = !hasNoVisaSponsorship(description);

    const finalPass = titlePass && locationPass && experiencePass && visaPass;

    if (titlePass) titlePassed++;
    if (locationPass) locationPassed++;
    if (experiencePass) experiencePassed++;
    if (visaPass) visaPassed++;
    if (finalPass) finalPassed++;

    console.log('--------------------------------');
    console.log(`${job.id} | ${job.company}`);
    console.log(`${job.title}`);
    console.log(`Location: ${job.location}`);

    console.log(`Title:      ${titlePass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`Location:   ${locationPass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`Experience: ${experiencePass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`Visa:       ${visaPass ? '✓ PASS' : '✗ FAIL'}`);

    if (finalPass) {
      console.log('>>> FINAL: ✓ TARGET JOB');
    } else {
      console.log('>>> FINAL: ✗ REJECTED');
    }
  }

  console.log('\n======================================');
  console.log('FILTER SUMMARY');
  console.log('======================================');
  console.log(`Fetched:              ${data.length}`);
  console.log(`Title passed:         ${titlePassed}`);
  console.log(`Location passed:      ${locationPassed}`);
  console.log(`Experience passed:    ${experiencePassed}`);
  console.log(`Visa passed:          ${visaPassed}`);
  console.log(`Final target jobs:    ${finalPassed}`);
  console.log(`Final target jobs:    ${finalPassed}`);
  console.log(`Rejected:             ${data.length - finalPassed}`);
  console.log('======================================');
}

main().catch((error) => {
  console.error('Filter test failed:', error);
  process.exit(1);
});
