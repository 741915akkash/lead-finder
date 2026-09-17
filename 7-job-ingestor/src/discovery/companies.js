require('dotenv').config();

const fs = require('fs');
const path = require('path');

const { discoverCareerPage } = require('./discover-career-page');
const { upsertCompany, updateCompanyATS } = require('../services/company');
const { supabase } = require('../db/db');

const CAREER_PAGES_FILE = path.join(__dirname, '../../data/career-pages.txt');

function readCareerPages() {
  if (!fs.existsSync(CAREER_PAGES_FILE)) {
    throw new Error(`Career pages file not found: ${CAREER_PAGES_FILE}`);
  }

  return [
    ...new Set(
      fs
        .readFileSync(CAREER_PAGES_FILE, 'utf8')
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith('#')),
    ),
  ];
}

async function getExistingCareerUrls() {
  const { data, error } = await supabase.from('companies').select('career_url');

  if (error) {
    throw error;
  }

  return new Set((data || []).map((company) => company.career_url));
}

async function discoverCompanies() {
  const careerPages = readCareerPages();

  console.log(`Found ${careerPages.length} career pages`);

  const existingUrls = await getExistingCareerUrls();

  let skipped = 0;
  let discovered = 0;
  let failed = 0;

  for (const careerUrl of careerPages) {
    if (existingUrls.has(careerUrl)) {
      console.log(`✓ Already registered: ${careerUrl}`);
      skipped += 1;
      continue;
    }

    console.log('\n======================================');
    console.log(`New career page: ${careerUrl}`);
    console.log('======================================');

    try {
      const company = await upsertCompany(careerUrl);

      console.log(`✓ Company registered: ${company.name} (${company.domain})`);

      const result = await discoverCareerPage(careerUrl);

      if (!result) {
        console.log('✗ No supported ATS found');
        discovered += 1;
        existingUrls.add(careerUrl);
        continue;
      }

      console.log('✓ ATS discovered:');
      console.log(result);

      const updatedCompany = await updateCompanyATS(company.id, result);

      console.log(`✓ Company updated: ${updatedCompany.name} → ${updatedCompany.ats}`);

      discovered += 1;
      existingUrls.add(careerUrl);
    } catch (error) {
      console.error(`✗ Discovery failed: ${careerUrl}`, error.message);

      failed += 1;
    }
  }

  return {
    total: careerPages.length,
    discovered,
    skipped,
    failed,
  };
}

async function main() {
  console.log('======================================');
  console.log('COMPANY DISCOVERY');
  console.log('======================================');

  const result = await discoverCompanies();

  console.log('\nCompany discovery completed.');
  console.log(result);
}

main().catch((err) => {
  console.error('Company discovery failed:', err);
  process.exit(1);
});
