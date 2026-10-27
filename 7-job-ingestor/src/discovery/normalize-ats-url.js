function normalizeAtsUrl(url, ats) {
  if (!url) return null;

  try {
    const parsed = new URL(url);

    if (ats === 'ashby') {
      const boardName = parsed.pathname.split('/').filter(Boolean)[0];

      if (!boardName) return null;

      return `https://jobs.ashbyhq.com/${boardName}`;
    }

    if (ats === 'greenhouse') {
      const boardName = parsed.pathname.split('/').filter(Boolean)[0];

      if (!boardName) return null;

      return `https://boards.greenhouse.io/${boardName}`;
    }

    return url;
  } catch {
    return null;
  }
}

module.exports = {
  normalizeAtsUrl,
};
