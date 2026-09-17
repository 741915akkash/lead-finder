require('dotenv').config();

const fs = require('fs');
const path = require('path');

const { discoverCareerPage } = require('./discovery/discover-career-page');

const { fetchJobs: fetchGreenhouseJobs } = require('./sources/greenhouse/fetch-jobs');
const { normalizeGreenhouseJob } = require('./sources/greenhouse/normalize-job');

const { fetchJobs: fetchAshbyJobs } = require('./sources/ashby/fetch-jobs');
const { normalizeAshbyJob } = require('./sources/ashby/normalize-job');

const { ingestJobs } = require('./services/ingest-job');

const { upsertCompany, updateCompanyATS } = require('./services/company');

const CAREER_PAGES_FILE = path.join(__dirname, '../data/career-pages.txt');

function readCareerPages() {
  if (!fs.existsSync(CAREER_PAGES_FILE)) {
    throw new Error(`Career pages file not found: ${CAREER_PAGES_FILE}`);
  }

  return fs
    .readFileSync(CAREER_PAGES_FILE, 'utf8')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'));
}

function isTargetJob(job) {
  const title = job?.title || '';

  return /\bfull[\s-]?stack\b/i.test(title) || /\bengineer\b/i.test(title);
}

async function ingestDiscoveredJobs(result) {
  if (result.ats === 'greenhouse') {
    const rawJobs = await fetchGreenhouseJobs(result.boardName);

    console.log(`${result.boardName}: fetched ${rawJobs.length} jobs`);

    const targetJobs = rawJobs.filter(isTargetJob);

    console.log(`${result.boardName}: ${targetJobs.length} target jobs found`);

    const jobs = targetJobs.map((job) => normalizeGreenhouseJob(job, result.companyName || result.boardName));

    return ingestJobs(jobs);
  }

  if (result.ats === 'ashby') {
    const rawJobs = await fetchAshbyJobs(result.boardName);

    console.log(`${result.boardName}: fetched ${rawJobs.length} jobs`);

    const targetJobs = rawJobs.filter(isTargetJob);

    console.log(`${result.boardName}: ${targetJobs.length} target jobs found`);

    const jobs = targetJobs.map((job) => normalizeAshbyJob(job, result.companyName || result.boardName));

    return ingestJobs(jobs);
  }

  throw new Error(`Unsupported ATS: ${result.ats}`);
}

async function runCareerPagePipeline() {
  const careerPages = readCareerPages();

  console.log(`Found ${careerPages.length} career pages`);

  for (const careerUrl of careerPages) {
    console.log('\n======================================');
    console.log(`Career page: ${careerUrl}`);
    console.log('======================================');

    try {
      // 1. Create/update company
      const company = await upsertCompany(careerUrl);

      console.log(`✓ Company registered: ${company.name} (${company.domain})`);

      // 2. Discover ATS
      console.log(`Discovering ATS: ${careerUrl}`);

      const result = await discoverCareerPage(careerUrl);

      if (!result) {
        console.log(`✗ No supported ATS found`);

        continue;
      }

      console.log('✓ ATS discovered:');
      console.log(result);

      // 3. Save ATS information
      const updatedCompany = await updateCompanyATS(company.id, result);

      console.log(`✓ Company updated: ${updatedCompany.name} → ${updatedCompany.ats}`);

      // 4. Fetch + filter + ingest jobs
      const ingestResult = await ingestDiscoveredJobs({
        ...result,
        companyName: updatedCompany.name,
      });

      console.log(`${updatedCompany.name}:`, ingestResult);
    } catch (error) {
      console.error(`✗ Pipeline failed: ${careerUrl}`, error.message);
    }
  }
}

async function main() {
  console.log('======================================');
  console.log('JOB INGESTOR');
  console.log('======================================');

  await runCareerPagePipeline();

  console.log('\nJob ingestion completed.');
}

main().catch((err) => {
  console.error('Job ingestion failed:', err);
  process.exit(1);
});
