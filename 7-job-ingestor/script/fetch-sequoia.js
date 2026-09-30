const fs = require('fs/promises');

const SEQUOIA_URL = 'https://sequoiacap.com/our-companies';
const OUTPUT = './sequoia-company-sites.txt';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/153.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
};

function extractCompanySlugs(html) {
  const slugs = new Set();

  /*
   * Look for:
   *
   * /companies/spacex
   * /companies/airbnb
   *
   * We don't require https://sequoiacap.com because
   * the current page may contain relative URLs.
   */

  const regex = /\/companies\/([a-zA-Z0-9][a-zA-Z0-9_-]*)/g;

  let match;

  while ((match = regex.exec(html)) !== null) {
    slugs.add(match[1]);
  }

  return [...slugs];
}

async function fetchCompanyWebsite(slug) {
  const url = `https://sequoiacap.com/companies/${slug}`;

  const response = await fetch(url, {
    headers: HEADERS,
  });

  if (!response.ok) {
    return null;
  }

  const html = await response.text();

  /*
   * Look for external href URLs.
   *
   * We want:
   *   https://spacex.com
   *
   * but NOT:
   *   https://sequoiacap.com/...
   *   https://linkedin.com/...
   *   https://twitter.com/...
   */

  const hrefRegex = /href=["'](https?:\/\/[^"'<>]+)["']/gi;

  let match;

  while ((match = hrefRegex.exec(html)) !== null) {
    const rawUrl = match[1];

    try {
      const parsed = new URL(rawUrl);

      const hostname = parsed.hostname.toLowerCase();

      // Ignore Sequoia
      if (hostname === 'sequoiacap.com' || hostname.endsWith('.sequoiacap.com')) {
        continue;
      }

      // Ignore social/media links
      if (
        hostname.includes('linkedin.com') ||
        hostname.includes('twitter.com') ||
        hostname === 'x.com' ||
        hostname.includes('facebook.com') ||
        hostname.includes('instagram.com') ||
        hostname.includes('youtube.com')
      ) {
        continue;
      }

      return `https://${hostname}`;
    } catch {
      // Ignore malformed URLs
    }
  }

  return null;
}

async function main() {
  console.log('Fetching Sequoia portfolio...');

  const response = await fetch(SEQUOIA_URL, {
    headers: HEADERS,
  });

  if (!response.ok) {
    throw new Error(`Sequoia request failed: ${response.status}`);
  }

  const html = await response.text();

  const slugs = extractCompanySlugs(html);

  console.log(`Company pages found: ${slugs.length}`);

  if (slugs.length === 0) {
    throw new Error('No company slugs found. Sequoia page structure may have changed.');
  }

  const websites = new Set();

  for (let i = 0; i < slugs.length; i++) {
    const slug = slugs[i];

    try {
      const website = await fetchCompanyWebsite(slug);

      if (website) {
        websites.add(website);

        console.log(`[${i + 1}/${slugs.length}] ${slug} -> ${website}`);
      } else {
        console.log(`[${i + 1}/${slugs.length}] ${slug} -> no website`);
      }
    } catch (error) {
      console.log(`[${i + 1}/${slugs.length}] ${slug} -> ERROR`);
    }
  }

  const result = [...websites].sort();

  await fs.writeFile(OUTPUT, result.join('\n') + '\n', 'utf8');

  console.log('');
  console.log(`Company pages: ${slugs.length}`);
  console.log(`Websites found: ${result.length}`);
  console.log(`Saved: ${OUTPUT}`);
}

main().catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});
