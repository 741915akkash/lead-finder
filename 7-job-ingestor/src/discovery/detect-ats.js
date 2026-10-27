const { normalizeAtsUrl } = require('./normalize-ats-url');

const ATS_PATTERNS = [
  {
    ats: 'ashby',
    hostnames: ['jobs.ashbyhq.com'],
  },
  {
    ats: 'greenhouse',
    hostnames: ['boards.greenhouse.io', 'job-boards.greenhouse.io'],
  },
];

function detectAtsFromUrl(url) {
  if (!url) return null;

  let parsed;

  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  const hostname = parsed.hostname.toLowerCase().replace(/^www\./, '');

  const match = ATS_PATTERNS.find(({ hostnames }) => hostnames.includes(hostname));

  if (!match) {
    return null;
  }

  const atsUrl = normalizeAtsUrl(url, match.ats);

  if (!atsUrl) {
    return null;
  }

  const boardName = new URL(atsUrl).pathname.split('/').filter(Boolean)[0];

  if (!boardName) {
    return null;
  }

  return {
    ats: match.ats,
    boardName,
    atsUrl,
  };
}

module.exports = {
  detectAtsFromUrl,
};
