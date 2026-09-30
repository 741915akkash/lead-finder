const fs = require('fs/promises');
const yaml = require('js-yaml');

const SOURCES = {
  lightspeed: {
    url: 'https://raw.githubusercontent.com/api-evangelist/lightspeed-venture-partners/main/portfolio/lightspeed-venture-partners-portfolio.yml',
    output: 'lightspeed-company-sites.txt',
  },

  generalCatalyst: {
    url: 'https://raw.githubusercontent.com/api-evangelist/general-catalyst/main/portfolio/general-catalyst-portfolio.yml',
    output: 'general-catalyst-company-sites.txt',
  },

  bessemer: {
    url: 'https://raw.githubusercontent.com/api-evangelist/bessemer-venture-partners/main/portfolio/bessemer-venture-partners-portfolio.yml',
    output: 'bessemer-company-sites.txt',
  },

  index: {
    url: 'https://raw.githubusercontent.com/api-evangelist/index-ventures/main/portfolio/index-ventures-portfolio.yml',
    output: 'index-company-sites.txt',
  },

  gv: {
    url: 'https://raw.githubusercontent.com/api-evangelist/gv/main/portfolio/gv-portfolio.yml',
    output: 'gv-company-sites.txt',
  },

  insight: {
    url: 'https://raw.githubusercontent.com/api-evangelist/insight-partners/main/portfolio/insight-partners-portfolio.yml',
    output: 'insight-company-sites.txt',
  },
};

async function fetchSource(sourceName, config) {
  console.log(`\nFetching ${sourceName}...`);
  console.log(config.url);

  const response = await fetch(config.url);

  if (!response.ok) {
    throw new Error(`${sourceName}: HTTP ${response.status} ${response.statusText}`);
  }

  const text = await response.text();

  const data = yaml.load(text);

  if (!data || !Array.isArray(data.companies)) {
    throw new Error(`${sourceName}: invalid portfolio format - companies[] not found`);
  }

  const websites = [
    ...new Set(
      data.companies
        .map((company) => company.url)
        .filter(Boolean)
        .map((url) => url.trim())
        .filter(Boolean),
    ),
  ];

  await fs.writeFile(config.output, websites.join('\n') + '\n', 'utf8');

  console.log(`Companies: ${data.companies.length}`);
  console.log(`Websites: ${websites.length}`);
  console.log(`Missing websites: ${data.companies.length - websites.length}`);
  console.log(`Saved: ${config.output}`);
}

async function main() {
  for (const [sourceName, config] of Object.entries(SOURCES)) {
    try {
      await fetchSource(sourceName, config);
    } catch (error) {
      console.error(`\n❌ Failed: ${sourceName}`);
      console.error(error.message);
    }
  }

  console.log('\nDone.');
}

main();
