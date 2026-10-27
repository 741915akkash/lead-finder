require('dotenv').config();

const fs = require('fs');
const path = require('path');

const { tryAts } = require('./try-ats');
const { registerCompany } = require('../services/company');

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

async function discoverCompanies() {
  const careerPages = readCareerPages();

  console.log(`Found ${careerPages.length} career pages`);

  let discovered = 0;
  let failed = 0;

  for (const careerUrl of careerPages) {
    console.log('\n======================================');
    console.log(`Processing: ${careerUrl}`);
    console.log('======================================');

    try {
      /*
       * tryAts handles:
       *
       * 1. Direct ATS URLs
       * 2. Existing career-page discovery
       * 3. Predictable ATS URL probing
       */
      const result = await tryAts(careerUrl);

      console.log('ATS result:');
      console.log(result);

      /*
       * Register or update the company.
       */
      const company = await registerCompany({
        careerUrl,
        atsUrl: result.ats?.atsUrl || null,
        ats: result.ats?.ats || null,
        boardName: result.ats?.boardName || null,
        discoverySource: 'career-page',
        atsStatus: result.status,
      });

      console.log(`✓ Company registered: ${company.name} (${company.domain})`);

      if (result.status === 'detected') {
        console.log(`✓ ATS detected: ${result.ats.ats} → ${result.ats.atsUrl}`);
      } else if (result.status === 'manual') {
        console.log('✓ No supported ATS found');
      }

      discovered += 1;
    } catch (error) {
      console.error(`✗ Discovery failed: ${careerUrl}`, error.message);

      failed += 1;
    }
  }

  return {
    total: careerPages.length,
    discovered,
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
