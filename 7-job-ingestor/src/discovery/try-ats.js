const { detectAtsFromUrl } = require('./detect-ats');
const { discoverCareerPage } = require('./discover-career-page');

const ATS_CANDIDATES = [
  {
    ats: 'ashby',
    buildUrl: (companySlug) => `https://jobs.ashbyhq.com/${companySlug}`,
  },
  {
    ats: 'greenhouse',
    buildUrl: (companySlug) => `https://boards.greenhouse.io/${companySlug}`,
  },
  {
    ats: 'lever',
    buildUrl: (companySlug) => `https://jobs.lever.co/${companySlug}`,
  },
  {
    ats: 'workable',
    buildUrl: (companySlug) => `https://apply.workable.com/${companySlug}`,
  },
];

async function urlExists(url) {
  try {
    const response = await fetch(url, {
      redirect: 'follow',
    });

    return response.ok;
  } catch {
    return false;
  }
}

function getCompanySlug(input) {
  try {
    const url = new URL(input);

    return url.hostname.replace(/^www\./, '').split('.')[0];
  } catch {
    return null;
  }
}

async function probeAtsUrls(input) {
  const companySlug = getCompanySlug(input);

  if (!companySlug) {
    return null;
  }

  for (const candidate of ATS_CANDIDATES) {
    const atsUrl = candidate.buildUrl(companySlug);

    const exists = await urlExists(atsUrl);

    if (!exists) {
      continue;
    }

    const ats = detectAtsFromUrl(atsUrl);

    if (!ats) {
      continue;
    }

    return ats;
  }

  return null;
}

async function tryAts(input) {
  if (!input) {
    return {
      status: 'unknown',
      input: null,
      ats: null,
    };
  }

  // 1. The input itself might already be an ATS URL.
  const directAts = detectAtsFromUrl(input);

  if (directAts) {
    return {
      status: 'detected',
      input,
      ats: directAts,
    };
  }

  // 2. Treat input as a company/career URL
  //    and use the existing career-page discovery.
  try {
    const result = await discoverCareerPage(input);

    if (result) {
      return {
        status: 'detected',
        input,
        ats: result,
      };
    }

    // 3. NEW:
    //    If the existing discovery didn't find an ATS,
    //    try predictable ATS URLs using the company slug.
    const probedAts = await probeAtsUrls(input);

    if (probedAts) {
      return {
        status: 'detected',
        input,
        ats: probedAts,
      };
    }

    return {
      status: 'manual',
      input,
      ats: null,
    };
  } catch (error) {
    return {
      status: 'unknown',
      input,
      ats: null,
      error: error.message,
    };
  }
}

module.exports = {
  tryAts,
};
