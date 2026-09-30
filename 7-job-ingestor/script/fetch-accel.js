const fs = require('fs/promises');

const BASE_URL = 'https://www.accel.com/companies';
const OUTPUT = 'accel-company-sites.txt';

async function main() {
  console.log('Fetching Accel portfolio...');

  const response = await fetch(BASE_URL);

  if (!response.ok) {
    throw new Error(`Accel request failed: ${response.status}`);
  }

  const html = await response.text();

  const websites = new Set();

  // Extract absolute URLs from the Accel page.
  // We deliberately only keep URLs that look like external
  // company websites, not Accel's own URLs.
  const urls = html.match(/https?:\/\/[^"'\\<>\s]+/g) || [];

  for (const rawUrl of urls) {
    try {
      const url = new URL(rawUrl);

      if (url.hostname === 'accel.com' || url.hostname.endsWith('.accel.com')) {
        continue;
      }

      websites.add(`${url.protocol}//${url.hostname}${url.pathname}`.replace(/\/$/, ''));
    } catch {
      // Ignore malformed URLs
    }
  }

  await fs.mkdir('./data', { recursive: true });

  await fs.writeFile(OUTPUT, [...websites].sort().join('\n') + '\n', 'utf8');

  console.log(`Websites found: ${websites.size}`);
  console.log(`Saved: ${OUTPUT}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
