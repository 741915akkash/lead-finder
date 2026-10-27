require('dotenv').config();

const fs = require('fs');
const path = require('path');

const { tryAts } = require('../discovery/try-ats');
const { registerCompany } = require('../services/company');

const SCRIPT_DIR = path.resolve(__dirname, '../../script');

function readCompanySiteFiles() {
  if (!fs.existsSync(SCRIPT_DIR)) {
    throw new Error(`Script directory not found: ${SCRIPT_DIR}`);
  }

  const files = fs.readdirSync(SCRIPT_DIR).filter((file) => file.endsWith('-company-sites.txt'));

  const urls = [];

  for (const file of files) {
    const filePath = path.join(SCRIPT_DIR, file);

    console.log(`Reading: ${file}`);

    const lines = fs
      .readFileSync(filePath, 'utf8')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'));

    urls.push(...lines);
  }

  return {
    files,
    urls: [...new Set(urls)],
  };
}

async function importCompanySites() {
  const { files, urls } = readCompanySiteFiles();

  console.log('\n======================================');
  console.log('COMPANY SITE DISCOVERY');
  console.log('======================================');

  console.log(`Files: ${files.length}`);
  console.log(`Unique URLs: ${urls.length}`);

  const stats = {
    total: urls.length,
    detected: 0,
    ashby: 0,
    greenhouse: 0,
    lever: 0,
    workable: 0,
    manual: 0,
    failed: 0,
  };

  for (let i = 0; i < urls.length; i += 1) {
    const input = urls[i];

    console.log('\n--------------------------------------');
    console.log(`[${i + 1}/${urls.length}] ${input}`);
    console.log('--------------------------------------');

    try {
      const result = await tryAts(input);

      if (result.status === 'unknown') {
        stats.failed += 1;

        console.log('✗ Discovery failed');

        if (result.error) {
          console.log(`  ${result.error}`);
        }

        continue;
      }

      if (result.status === 'manual') {
        await registerCompany({
          careerUrl: input,
          atsUrl: null,
          ats: null,
          boardName: null,
          discoverySource: 'company-site',
          atsStatus: 'manual',
        });

        stats.manual += 1;

        console.log('✓ No supported ATS found');

        continue;
      }

      if (result.status === 'detected') {
        const ats = result.ats;

        await registerCompany({
          careerUrl: input,
          atsUrl: ats.atsUrl,
          ats: ats.ats,
          boardName: ats.boardName,
          discoverySource: 'company-site',
          atsStatus: 'detected',
        });

        stats.detected += 1;

        if (ats.ats === 'ashby') {
          stats.ashby += 1;
        } else if (ats.ats === 'greenhouse') {
          stats.greenhouse += 1;
        } else if (ats.ats === 'lever') {
          stats.lever += 1;
        } else if (ats.ats === 'workable') {
          stats.workable += 1;
        }

        console.log(`✓ ATS: ${ats.ats} → ${ats.atsUrl}`);
      }
    } catch (error) {
      stats.failed += 1;

      console.error(`✗ Failed: ${error.message}`);
    }
  }

  return stats;
}

async function main() {
  try {
    const stats = await importCompanySites();

    console.log('\n======================================');
    console.log('DISCOVERY SUMMARY');
    console.log('======================================');

    console.log(`Total URLs:       ${stats.total}`);
    console.log(`Detected:         ${stats.detected}`);
    console.log(`Ashby:            ${stats.ashby}`);
    console.log(`Greenhouse:       ${stats.greenhouse}`);
    console.log(`Lever:            ${stats.lever}`);
    console.log(`Workable:         ${stats.workable}`);
    console.log(`Manual:           ${stats.manual}`);
    console.log(`Failed:           ${stats.failed}`);
  } catch (error) {
    console.error('Company site discovery failed:', error);

    process.exit(1);
  }
}

main();
