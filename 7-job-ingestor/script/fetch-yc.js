// fetch-yc-company-sites.js

const fs = require('fs/promises');

const YC_API = 'https://yc-oss.github.io/api/companies/all.json';

const OUTPUT_FILE = 'yc-company-sites.txt';

async function main() {
  console.log('Fetching YC companies...');

  const response = await fetch(YC_API);

  if (!response.ok) {
    throw new Error(`Failed to fetch YC companies: ${response.status} ${response.statusText}`);
  }

  const companies = await response.json();

  console.log(`Fetched ${companies.length} companies`);

  const websites = companies
    .map((company) => company.website)
    .filter(Boolean)
    .map((url) => url.trim())
    .filter(Boolean);

  // Remove duplicates
  const uniqueWebsites = [...new Set(websites)];

  await fs.writeFile(OUTPUT_FILE, uniqueWebsites.join('\n') + '\n', 'utf8');

  console.log(`Saved ${uniqueWebsites.length} company websites`);
  console.log(`File: ${OUTPUT_FILE}`);
}

main().catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});
