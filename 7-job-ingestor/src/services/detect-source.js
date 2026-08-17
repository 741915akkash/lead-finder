function detectSource(url) {
  if (!url) {
    return 'unknown';
  }

  try {
    const hostname = new URL(url).hostname.toLowerCase();

    if (hostname === 'wellfound.com' || hostname.endsWith('.wellfound.com')) {
      return 'wellfound';
    }

    if (hostname === 'cutshort.io' || hostname.endsWith('.cutshort.io')) {
      return 'cutshort';
    }

    if (hostname === 'linkedin.com' || hostname.endsWith('.linkedin.com')) {
      return 'linkedin';
    }

    if (hostname === 'ycombinator.com' || hostname.endsWith('.ycombinator.com')) {
      return 'yc_jobs';
    }

    return 'manual';
  } catch {
    return 'unknown';
  }
}

module.exports = {
  detectSource,
};
