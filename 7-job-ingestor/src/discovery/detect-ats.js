function detectAtsFromUrl(url) {
  if (!url) {
    return null;
  }

  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();

    // Ashby
    if (hostname === 'jobs.ashbyhq.com' || hostname.endsWith('.ashbyhq.com')) {
      const parts = parsed.pathname.split('/').filter(Boolean);

      if (parts.length >= 1) {
        return {
          ats: 'ashby',
          boardName: parts[0],
          atsUrl: url,
        };
      }
    }

    // Greenhouse
    if (hostname === 'boards.greenhouse.io' || hostname === 'job-boards.greenhouse.io') {
      const parts = parsed.pathname.split('/').filter(Boolean);

      if (parts.length >= 1) {
        return {
          ats: 'greenhouse',
          boardName: parts[0],
          atsUrl: url,
        };
      }
    }

    return null;
  } catch {
    return null;
  }
}

module.exports = {
  detectAtsFromUrl,
};
