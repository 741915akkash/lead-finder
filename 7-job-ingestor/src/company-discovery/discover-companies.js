const fs = require('fs');
const path = require('path');

const SOURCES_DIR = path.join(__dirname, '../../../data/company-sources');
const CAREER_PAGES_FILE = path.join(__dirname, '../../../data/career-pages.txt');

const SOURCE_FILES = ['yc.txt', 'wellfound.txt', 'vc.txt'];

function readUrlsFromFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return [];
  }

  return fs
    .readFileSync(filePath, 'utf8')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'));
}

function normalizeUrl(url) {
  try {
    const parsed = new URL(url);

    parsed.hash = '';
    parsed.search = '';

    let normalized = parsed.toString();

    if (normalized.endsWith('/')) {
      normalized = normalized.slice(0, -1);
    }

    return normalized;
  } catch {
    return null;
  }
}

function getDomain(url) {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return null;
  }
}

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

function discoverCompanies() {
  const companies = new Map();

  for (const sourceFile of SOURCE_FILES) {
    const filePath = path.join(SOURCES_DIR, sourceFile);
    const source = sourceFile.replace('.txt', '');

    const urls = readUrlsFromFile(filePath);

    for (const url of urls) {
      const normalizedUrl = normalizeUrl(url);

      if (!normalizedUrl) {
        console.log(`⚠ Invalid URL: ${url}`);
        continue;
      }

      const domain = getDomain(normalizedUrl);

      if (!domain) {
        continue;
      }

      if (!companies.has(domain)) {
        companies.set(domain, {
          domain,
          website: normalizedUrl,
          sources: [],
        });
      }

      const company = companies.get(domain);

      if (!company.sources.includes(source)) {
        company.sources.push(source);
      }
    }
  }

  return [...companies.values()];
}

function removeExistingCompanies(companies) {
  const existingUrls = readExistingCareerPages();

  const existingDomains = new Set(existingUrls.map(getDomain).filter(Boolean));

  return companies.filter((company) => !existingDomains.has(company.domain));
}

function getDiscoveredCompanies() {
  const companies = discoverCompanies();
  const newCompanies = removeExistingCompanies(companies);

  console.log(`Found ${companies.length} unique companies`);
  console.log(`Already in career-pages.txt: ${companies.length - newCompanies.length}`);
  console.log(`New companies to process: ${newCompanies.length}`);

  return newCompanies;
}

module.exports = {
  discoverCompanies,
  getDiscoveredCompanies,
};
