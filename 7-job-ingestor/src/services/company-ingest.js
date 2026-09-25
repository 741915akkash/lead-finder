const fs = require('fs');
const path = require('path');

const { supabase } = require('../db/db');

const { updateExistingJob } = require('../services/update-job');

const { fetchJobs: fetchGreenhouseJobs } = require('../sources/greenhouse/fetch-jobs');
const { normalizeGreenhouseJob } = require('../sources/greenhouse/normalize-job');

const { fetchJobs: fetchAshbyJobs } = require('../sources/ashby/fetch-jobs');
const { normalizeAshbyJob } = require('../sources/ashby/normalize-job');

const { ingestJobs } = require('./ingest-job');

const { isTargetJob } = require('../nfilters/title-filter');
const { isTargetLocation } = require('../nfilters/location-filter');
const { requiresMoreThanThreeYears } = require('../nfilters/experience-filter');
const { hasNoVisaSponsorship } = require('../nfilters/visa-filter');
const { isRecentJob } = require('../nfilters/time-filter');

// ----------------------------------
// GET COMPANIES
// ----------------------------------

async function getCompanies() {
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .not('ats', 'is', null)
    .not('ats_board_name', 'is', null);

  if (error) {
    throw error;
  }

  return data || [];
}

// ----------------------------------
// COMPANY EXCLUSION
// ----------------------------------

function getTargetCompanies(companies) {
  const filePath = path.join(__dirname, '../data/company-not-to-take.txt');

  if (!fs.existsSync(filePath)) {
    return companies;
  }

  const excludedCompanies = new Set(
    fs
      .readFileSync(filePath, 'utf8')
      .split('\n')
      .map((line) => line.trim().toLowerCase())
      .filter((line) => line && !line.startsWith('#')),
  );

  return companies.filter((company) => {
    const companyName = (company.name || '').trim().toLowerCase();
    const domain = (company.domain || '').trim().toLowerCase();
    const boardName = (company.ats_board_name || '').trim().toLowerCase();

    return !excludedCompanies.has(companyName) && !excludedCompanies.has(domain) && !excludedCompanies.has(boardName);
  });
}

// ----------------------------------
// EXISTING JOBS
// ----------------------------------

async function getExistingJobs(source, sourceJobIds) {
  if (!sourceJobIds.length) {
    return new Set();
  }

  const { data, error } = await supabase
    .from('job_postings')
    .select('source_job_id')
    .eq('source', source)
    .in('source_job_id', sourceJobIds);

  if (error) {
    throw error;
  }

  return new Set((data || []).map((job) => String(job.source_job_id)));
}

// ----------------------------------
// INGEST ONE COMPANY
// ----------------------------------

async function ingestCompany(company) {
  console.log(`\n======================================`);
  console.log(`Company: ${company.name || company.domain}`);
  console.log(`ATS: ${company.ats}`);
  console.log(`Board: ${company.ats_board_name}`);
  console.log(`======================================`);

  let rawJobs;
  let source;

  // ----------------------------------
  // FETCH JOBS
  // ----------------------------------

  if (company.ats === 'ashby') {
    source = 'ashby';

    rawJobs = await fetchAshbyJobs(company.ats_board_name);
  } else if (company.ats === 'greenhouse') {
    source = 'greenhouse';

    rawJobs = await fetchGreenhouseJobs(company.ats_board_name);
  } else {
    console.log(`⚠ Unsupported ATS: ${company.ats}`);

    return {
      company: company.name,
      status: 'unsupported_ats',
      fetched: 0,
      target: 0,
      new: 0,
      processed: 0,
    };
  }

  console.log(`Fetched ${rawJobs.length} jobs`);

  // ----------------------------------
  // HARD FILTERS
  // ----------------------------------

  // 1. TIME
  const recentJobs = rawJobs.filter((job) => isRecentJob(job, 14));

  console.log(`After time filter: ${recentJobs.length}`);

  // 2. TITLE
  const titleJobs = recentJobs.filter(isTargetJob);

  console.log(`After title filter: ${titleJobs.length}`);

  // 3. LOCATION
  const locationJobs = titleJobs.filter(isTargetLocation);

  console.log(`After location filter: ${locationJobs.length}`);

  // 4. EXPERIENCE
  const experienceJobs = locationJobs.filter((job) => {
    const description = job.descriptionPlain || job.description || job.content || '';

    return !requiresMoreThanThreeYears(description);
  });

  console.log(`After experience filter: ${experienceJobs.length}`);

  // 5. VISA
  const targetJobs = experienceJobs.filter((job) => {
    const description = job.descriptionPlain || job.description || job.content || '';

    return !hasNoVisaSponsorship(description);
  });

  console.log(`After visa filter: ${targetJobs.length}`);

  // ----------------------------------
  // NO TARGET JOBS
  // ----------------------------------

  if (!targetJobs.length) {
    console.log('No target jobs found.');

    return {
      company: company.name,
      status: 'completed',
      fetched: rawJobs.length,
      target: 0,
      existing: 0,
      updated: 0,
      new: 0,
      processed: 0,
    };
  }

  /*
   * Get the IDs used by our normalized job records.
   *
   * Ashby:
   *   source_job_id = job.jobUrl
   *
   * Greenhouse:
   *   source_job_id = normalized source ID
   */

  let jobs;

  if (company.ats === 'ashby') {
    jobs = targetJobs.map((job) => normalizeAshbyJob(job, company.name));
  } else {
    jobs = targetJobs.map((job) => normalizeGreenhouseJob(job, company.name));
  }

  const sourceJobIds = jobs.map((job) => String(job.source_job_id));

  // ----------------------------------
  // EXISTING / NEW
  // ----------------------------------

  const existingIds = await getExistingJobs(source, sourceJobIds);

  const existingJobs = jobs.filter((job) => existingIds.has(String(job.source_job_id)));

  const newJobs = jobs.filter((job) => !existingIds.has(String(job.source_job_id)));

  console.log(`Existing jobs: ${existingJobs.length}`);
  console.log(`New jobs: ${newJobs.length}`);

  // ----------------------------------
  // UPDATE EXISTING JOBS
  // ----------------------------------

  let updated = 0;
  let updateFailed = 0;

  for (const job of existingJobs) {
    try {
      await updateExistingJob(job);

      updated += 1;
    } catch (error) {
      updateFailed += 1;

      console.error(`✗ Failed to update ${job.title}:`, error.message);
    }
  }

  console.log(`Updated existing jobs: ${updated}`);

  // ----------------------------------
  // INSERT NEW JOBS
  // ----------------------------------

  let processed = 0;
  let insertFailed = 0;

  if (newJobs.length) {
    const result = await ingestJobs(newJobs);

    processed = result.processed;
    insertFailed = result.failed;
  }

  console.log(`Inserted and queued: ${processed}`);

  // ----------------------------------
  // RESULT
  // ----------------------------------

  return {
    company: company.name,
    status: 'completed',
    fetched: rawJobs.length,
    target: targetJobs.length,
    existing: existingJobs.length,
    updated,
    new: newJobs.length,
    processed,
    failed: updateFailed + insertFailed,
  };
}

// ----------------------------------
// INGEST ALL COMPANIES
// ----------------------------------

async function ingestCompanies() {
  const companies = await getCompanies();

  console.log(`Found ${companies.length} companies with ATS`);

  const targetCompanies = getTargetCompanies(companies);

  console.log(`Excluded ${companies.length - targetCompanies.length} companies`);

  console.log(`Processing ${targetCompanies.length} companies`);

  const results = [];

  for (const company of targetCompanies) {
    try {
      const result = await ingestCompany(company);

      results.push(result);
    } catch (error) {
      console.error(`✗ Failed: ${company.name || company.domain}:`, error.message);

      results.push({
        company: company.name,
        status: 'failed',
        error: error.message,
      });
    }
  }

  return {
    companies: targetCompanies.length,
    results,
  };
}

module.exports = {
  ingestCompanies,
};
