require('dotenv').config();

const fs = require('fs/promises');
const path = require('path');

const { tryAts } = require('../discovery/try-ats');
const { registerCompany } = require('../services/company');

const ASHBY_URLS_FILE = path.resolve(__dirname, '../../../6.5-ashby-url-collector/ashby-urls.txt');

async function readAshbyUrls() {
  const content = await fs.readFile(ASHBY_URLS_FILE, 'utf8');

  return [
    ...new Set(
      content
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean),
    ),
  ];
}

async function importAshbyUrls() {
  const urls = await readAshbyUrls();

  console.log(`Found ${urls.length} Ashby URLs`);

  for (const atsUrl of urls) {
    console.log(`\nProcessing: ${atsUrl}`);

    try {
      /*
       * The URL is already known to be an ATS URL,
       * so tryAts() will detect it directly.
       */
      const result = await tryAts(atsUrl);

      if (result.status !== 'detected' || !result.ats) {
        console.log('  Could not detect ATS');
        continue;
      }

      const company = await registerCompany({
        careerUrl: null,
        atsUrl: result.ats.atsUrl,
        ats: result.ats.ats,
        boardName: result.ats.boardName,
        discoverySource: 'ashby-collector',
        atsStatus: 'detected',
      });

      console.log(`  Registered: ${company.name} (${company.ats_url})`);
    } catch (error) {
      console.error(`  Failed: ${error.message}`);
    }
  }
}

importAshbyUrls();
