require('dotenv').config();

const fs = require('fs/promises');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '../..');
const SCRIPT_DIR = path.join(ROOT_DIR, 'script');
const DATA_DIR = path.join(ROOT_DIR, 'data');

const CAREER_URLS_FILE = path.join(DATA_DIR, 'career-urls.txt');
const FAILED_FILE = path.join(DATA_DIR, 'career-pages-failed.txt');

const CONCURRENCY = 5;

const CAREER_KEYWORDS =
  /\b(careers?|jobs?|join us|join our team|open positions|open roles|work with us|work at|opportunities)\b/i;

const CAREER_PATHS = [
  '/careers',
  '/career',
  '/jobs',
  '/join-us',
  '/join',
  '/work-with-us',
  '/company/careers',
  '/about/careers',
];

function normalizeUrl(value) {
  try {
    const url = new URL(/^[a-z][a-z\d+.-]*:\/\//i.test(value) ? value : `https://${value}`);

    if (!['http:', 'https:'].includes(url.protocol)) {
      return null;
    }

    url.hash = '';

    return url.toString();
  } catch {
    return null;
  }
}

function getDomain(value) {
  try {
    return new URL(value).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return null;
  }
}

async function readLines(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf8');

    return content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'));
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

async function readCompanyUrls() {
  const files = (await fs.readdir(SCRIPT_DIR)).filter((file) => file.endsWith('-company-sites.txt'));

  const companies = new Map();

  for (const file of files) {
    const filePath = path.join(SCRIPT_DIR, file);
    const urls = await readLines(filePath);

    for (const input of urls) {
      const url = normalizeUrl(input);

      if (!url) {
        console.log(`Invalid URL: ${input}`);
        continue;
      }

      const domain = getDomain(url);

      if (!companies.has(domain)) {
        companies.set(domain, url);
      }
    }
  }

  console.log(`Source files: ${files.length}`);

  return [...companies.values()];
}

async function fetchPage(url) {
  try {
    const response = await fetch(url, {
      redirect: 'follow',
      signal: AbortSignal.timeout(12000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CareerPageCollector/1.0)',
      },
    });

    if (!response.ok) return null;

    const contentType = response.headers.get('content-type') || '';

    if (!contentType.includes('text/html')) return null;

    return {
      url: response.url,
      html: await response.text(),
    };
  } catch {
    return null;
  }
}

function extractCareerLinks(html, baseUrl) {
  const candidates = [];
  const anchorRegex = /<a\b[^>]*\bhref\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a\s*>/gi;

  let match;

  while ((match = anchorRegex.exec(html)) !== null) {
    const href = match[1].trim();
    const text = match[2]
      .replace(/<[^>]*>/g, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/\s+/g, ' ')
      .trim();

    if (!CAREER_KEYWORDS.test(`${text} ${href}`)) continue;

    try {
      const url = new URL(href, baseUrl);

      if (!['http:', 'https:'].includes(url.protocol)) continue;

      url.hash = '';

      candidates.push(url.toString());
    } catch {
      // Ignore malformed links.
    }
  }

  return [...new Set(candidates)];
}

async function findCareerPage(companyUrl) {
  console.log(`Searching: ${companyUrl}`);

  const homepage = await fetchPage(companyUrl);

  if (homepage) {
    const candidates = extractCareerLinks(homepage.html, homepage.url);

    // First try career links found on the homepage.
    for (const candidate of candidates) {
      const page = await fetchPage(candidate);

      if (page) {
        console.log(`  Found: ${page.url}`);
        return page.url;
      }
    }

    // Then try conventional career-page paths.
    for (const careerPath of CAREER_PATHS) {
      const candidate = new URL(careerPath, homepage.url).toString();

      const page = await fetchPage(candidate);

      if (page) {
        console.log(`  Found: ${page.url}`);
        return page.url;
      }
    }
  }

  console.log('  Not found');

  return null;
}

async function appendUnique(filePath, values) {
  const existing = await readLines(filePath);
  const seen = new Set(existing);
  const additions = [];

  for (const value of values) {
    if (seen.has(value)) continue;

    seen.add(value);
    additions.push(value);
  }

  if (additions.length > 0) {
    await fs.appendFile(filePath, `${existing.length ? '\n' : ''}${additions.join('\n')}\n`, 'utf8');
  }

  return additions.length;
}

async function runWithConcurrency(items, worker, limit) {
  let nextIndex = 0;

  async function runWorker() {
    while (true) {
      const index = nextIndex++;

      if (index >= items.length) return;

      await worker(items[index], index);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => runWorker()));
}

async function main() {
  await fs.mkdir(DATA_DIR, { recursive: true });

  const companyUrls = await readCompanyUrls();

  const existingCareerPages = new Set((await readLines(CAREER_URLS_FILE)).map(normalizeUrl).filter(Boolean));

  const careerPages = [];
  const failedUrls = [];

  console.log(`Unique companies: ${companyUrls.length}`);
  console.log(`Concurrency: ${CONCURRENCY}`);

  await runWithConcurrency(
    companyUrls,
    async (companyUrl, index) => {
      console.log(`\n[${index + 1}/${companyUrls.length}] ${companyUrl}`);

      const careerUrl = await findCareerPage(companyUrl);

      if (!careerUrl) {
        failedUrls.push(companyUrl);
        return;
      }

      if (!existingCareerPages.has(careerUrl)) {
        careerPages.push(careerUrl);
        existingCareerPages.add(careerUrl);
      }
    },
    CONCURRENCY,
  );

  const added = await appendUnique(CAREER_URLS_FILE, careerPages);

  const failedAdded = await appendUnique(FAILED_FILE, failedUrls);

  console.log('\n======================================');
  console.log('CAREER URL COLLECTION COMPLETE');
  console.log('======================================');
  console.log(`Companies processed: ${companyUrls.length}`);
  console.log(`New career URLs:    ${added}`);
  console.log(`Failed this run:    ${failedUrls.length}`);
  console.log(`New failures saved: ${failedAdded}`);
  console.log(`Output: ${CAREER_URLS_FILE}`);
  console.log(`Failures: ${FAILED_FILE}`);
}

main().catch((error) => {
  console.error('Career URL collection failed:', error);
  process.exitCode = 1;
});
