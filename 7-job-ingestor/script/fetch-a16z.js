const fs = require('fs/promises');

const URL = 'https://a16z.com/portfolio/';
const OUTPUT = 'a16z-company-sites.txt';

function decodeHtmlEntities(value) {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

async function main() {
  console.log('Fetching a16z portfolio...');

  const response = await fetch(URL);

  if (!response.ok) {
    throw new Error(`a16z request failed: ${response.status}`);
  }

  const html = await response.text();

  const match = html.match(/data-companies="([^"]+)"/);

  if (!match) {
    throw new Error('Could not find data-companies attribute');
  }

  const json = decodeHtmlEntities(match[1]);

  const companies = JSON.parse(json);

  const websites = [
    ...new Set(
      companies
        .map((company) => company.url || company.company_url || company.external_url)
        .filter(Boolean)
        .map((url) => url.trim())
        .filter(Boolean),
    ),
  ];

  await fs.mkdir('./data', { recursive: true });

  await fs.writeFile(OUTPUT, websites.join('\n') + '\n', 'utf8');

  console.log(`a16z companies: ${companies.length}`);
  console.log(`Websites: ${websites.length}`);
  console.log(`Saved: ${OUTPUT}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
