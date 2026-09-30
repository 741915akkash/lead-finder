const fs = require('fs');
const path = require('path');

const { getDiscoveredCompanies } = require('./discover-companies');

const { findCareerPage } = require('./find-career-page');

const CAREER_PAGES_FILE = path.join(__dirname, '../../../data/career-pages.txt');

function readExistingCareerPages() {
  if (!fs.existsSync(CAREER_PAGES_FILE)) {
    return [];
  }

  return fs
    .readFileSync(CAREER_PAGES_FILE, 'utf8')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'));
}

function getDomain(url) {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return null;
  }
}

function appendCareerPage(url) {
  const existing = readExistingCareerPages();

  const existingDomains = new Set(existing.map(getDomain).filter(Boolean));

  const domain = getDomain(url);

  if (!domain) {
    return false;
  }

  if (existingDomains.has(domain)) {
    console.log(`  Already exists: ${url}`);
    return false;
  }

  fs.appendFileSync(CAREER_PAGES_FILE, `\n${url}\n`);

  console.log(`  ✓ Added: ${url}`);

  return true;
}

async function main() {
  console.log('======================================');
  console.log('COMPANY DISCOVERY');
  console.log('======================================');

  const companies = getDiscoveredCompanies();

  console.log(`\nProcessing ${companies.length} companies`);

  let found = 0;
  let added = 0;
  let failed = 0;

  for (const company of companies) {
    console.log('\n--------------------------------------');
    console.log(`Company: ${company.domain}`);
    console.log(`Website: ${company.website}`);
    console.log(`Sources: ${company.sources.join(', ')}`);

    try {
      const result = await findCareerPage(company.website);

      if (!result) {
        failed += 1;
        continue;
      }

      found += 1;

      /*
       * Prefer the ATS URL when one was found.
       *
       * Your existing discovery pipeline already knows
       * how to handle direct ATS URLs.
       */
      const urlToAdd = result.atsUrl || result.careerUrl;

      if (appendCareerPage(urlToAdd)) {
        added += 1;
      }
    } catch (error) {
      console.error(`  ✗ Failed: ${company.website}`, error.message);

      failed += 1;
    }
  }

  console.log('\n======================================');
  console.log('DISCOVERY COMPLETE');
  console.log('======================================');

  console.log({
    companies: companies.length,
    careerPagesFound: found,
    added,
    failed,
  });
}

main().catch((error) => {
  console.error('Company discovery failed:', error);
  process.exit(1);
});
