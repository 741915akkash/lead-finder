const { detectAtsFromUrl } = require('./detect-ats');

function extractCompanyName(atsResult) {
  if (!atsResult) {
    return null;
  }

  return atsResult.companyName || atsResult.boardName || null;
}

async function discoverCareerPage(url) {
  console.log(`\nDiscovering ATS: ${url}`);

  /*
   * First check whether the supplied URL is already
   * an ATS board.
   */
  const directAts = detectAtsFromUrl(url);

  if (directAts) {
    const result = {
      ...directAts,
      companyName: extractCompanyName(directAts),
    };

    console.log(`✓ ATS detected directly: ${result.ats} (${result.boardName})`);

    return result;
  }

  /*
   * Fetch the career page.
   *
   * fetch() follows normal redirects automatically.
   */
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Career page returned ${response.status} ${response.statusText}`);
  }

  const finalUrl = response.url;

  /*
   * The career page may redirect directly to an ATS.
   */
  const redirectedAts = detectAtsFromUrl(finalUrl);

  if (redirectedAts) {
    const result = {
      ...redirectedAts,
      companyName: extractCompanyName(redirectedAts),
    };

    console.log(`✓ ATS detected after redirect: ${result.ats} (${result.boardName})`);

    return result;
  }

  const html = await response.text();

  /*
   * Extract hrefs from the page.
   *
   * We intentionally keep this simple.
   * We are only looking for known ATS links.
   */
  const hrefs = [];

  const hrefRegex = /href\s*=\s*["']([^"']+)["']/gi;

  let match;

  while ((match = hrefRegex.exec(html)) !== null) {
    hrefs.push(match[1]);
  }

  /*
   * Resolve relative links against the career page.
   */
  for (const href of hrefs) {
    let absoluteUrl;

    try {
      absoluteUrl = new URL(href, response.url).toString();
    } catch {
      continue;
    }

    const ats = detectAtsFromUrl(absoluteUrl);

    if (ats) {
      const result = {
        ...ats,
        companyName: extractCompanyName(ats),
      };

      console.log(`✓ ATS detected from career page: ${result.ats} (${result.boardName})`);

      return result;
    }
  }

  console.log('✗ No supported ATS found');

  return null;
}

module.exports = {
  discoverCareerPage,
};
