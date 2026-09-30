// fetch-accelerator-sites.js

const fs = require('fs/promises');

const BASE_URL = 'https://cdn.jsdelivr.net/gh/yigitmeteozcan/startups@main/data/by-source';

const SOURCES = {
  plugandplay: 'plugandplay-company-sites.txt',
  techstars: 'techstars-company-sites.txt',
  500: '500-company-sites.txt',
  antler: 'antler-company-sites.txt',
  alchemist: 'alchemist-company-sites.txt',
  ef: 'ef-company-sites.txt',
};

async function fetchSource(source, outputFile) {
  const url = `${BASE_URL}/${source}.json`;

  console.log(`\nFetching ${source}...`);

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`${source}: HTTP ${response.status}`);
  }

  const companies = await response.json();

  const websites = [
    ...new Set(
      companies
        .map((company) => company.website)
        .filter(Boolean)
        .map((url) => url.trim())
        .filter(Boolean),
    ),
  ];

  await fs.writeFile(outputFile, websites.join('\n') + '\n', 'utf8');

  console.log(`Companies: ${companies.length}`);
  console.log(`Websites: ${websites.length}`);
  console.log(`Saved: ${outputFile}`);
}

async function main() {
  for (const [source, outputFile] of Object.entries(SOURCES)) {
    await fetchSource(source, outputFile);
  }

  console.log('\nDone.');
}

main().catch((error) => {
  console.error('\nError:', error.message);
  process.exit(1);
});
