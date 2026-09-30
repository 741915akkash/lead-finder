const { detectAtsFromUrl } = require('../detect-ats');

const CAREER_PATHS = ['/careers', '/career', '/jobs', '/job', '/join-us', '/join', '/work-with-us', '/work-with-us/'];

function extractLinks(html, baseUrl) {
  const links = [];

  const hrefRegex = /href\s*=\s*["']([^"']+)["']/gi;

  let match;

  while ((match = hrefRegex.exec(html)) !== null) {
    try {
      const absoluteUrl = new URL(match[1], baseUrl).toString();
      links.push(absoluteUrl);
    } catch {
      // Ignore invalid URLs
    }
  }

  return links;
}

async function fetchPage(url) {
  try {
    const response = await fetch(url, {
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
    });

    if (!response.ok) {
      return null;
    }

    return {
      url: response.url,
      html: await response.text(),
    };
  } catch {
    return null;
  }
}

async function findCareerPage(companyUrl) {
  console.log(`\nSearching careers: ${companyUrl}`);

  /*
   * First check whether the supplied URL is already
   * an ATS URL.
   */
  const directAts = detectAtsFromUrl(companyUrl);

  if (directAts) {
    return {
      companyUrl,
      careerUrl: companyUrl,
      ...directAts,
    };
  }

  /*
   * Try common career-page paths.
   */
  for (const careerPath of CAREER_PATHS) {
    const careerUrl = new URL(careerPath, companyUrl).toString();

    console.log(`  Checking ${careerUrl}`);

    const page = await fetchPage(careerUrl);

    if (!page) {
      continue;
    }

    /*
     * The page itself may redirect to an ATS.
     */
    const redirectedAts = detectAtsFromUrl(page.url);

    if (redirectedAts) {
      console.log(`  ✓ ATS redirect: ${page.url}`);

      return {
        companyUrl,
        careerUrl: page.url,
        ...redirectedAts,
      };
    }

    /*
     * Look for ATS links inside the career page.
     */
    const links = extractLinks(page.html, page.url);

    for (const link of links) {
      const ats = detectAtsFromUrl(link);

      if (ats) {
        console.log(`  ✓ ATS found: ${link}`);

        return {
          companyUrl,
          careerUrl: page.url,
          ...ats,
        };
      }
    }

    /*
     * We found a working careers page even if
     * we don't recognize the ATS yet.
     */
    console.log(`  ✓ Career page found: ${page.url}`);

    return {
      companyUrl,
      careerUrl: page.url,
      ats: null,
      boardName: null,
      atsUrl: null,
    };
  }

  /*
   * Finally, check the homepage itself.
   *
   * Some companies put the careers link there
   * instead of using /careers.
   */
  const homepage = await fetchPage(companyUrl);

  if (homepage) {
    const links = extractLinks(homepage.html, homepage.url);

    for (const link of links) {
      const ats = detectAtsFromUrl(link);

      if (ats) {
        return {
          companyUrl,
          careerUrl: homepage.url,
          ...ats,
        };
      }

      const pathname = new URL(link).pathname.toLowerCase();

      if (pathname.includes('career') || pathname.includes('job') || pathname.includes('join')) {
        console.log(`  ✓ Career link found: ${link}`);

        return {
          companyUrl,
          careerUrl: link,
          ats: null,
          boardName: null,
          atsUrl: null,
        };
      }
    }
  }

  console.log(`  ✗ No career page found`);

  return null;
}

module.exports = {
  findCareerPage,
};
