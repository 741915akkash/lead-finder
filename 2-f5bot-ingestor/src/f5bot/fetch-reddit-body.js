function extractIdsFromRedditUrl(redditUrl) {
  const commentMatch = redditUrl.match(/\/comments\/([a-z0-9]+)\/.*?\/([a-z0-9]+)(?:\/|\?|$)/i);
  const postMatch = redditUrl.match(/\/comments\/([a-z0-9]+)(?:\/|\?|$)/i);

  return {
    postId: postMatch?.[1] || null,
    commentId: commentMatch?.[2] || null,
  };
}

function toJsonUrl(redditUrl) {
  const parsed = new URL(redditUrl);

  parsed.hostname = 'www.reddit.com';
  parsed.pathname = parsed.pathname.replace(/\/$/, '') + '.json';
  parsed.searchParams.set('raw_json', '1');

  return parsed.toString();
}

function findCommentBody(node, commentId) {
  if (!node) return null;

  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findCommentBody(item, commentId);
      if (found) return found;
    }
    return null;
  }

  if (typeof node !== 'object') {
    return null;
  }

  const data = node.data || node;

  if (commentId && data?.id === commentId && typeof data.body === 'string') {
    return data.body.trim();
  }

  if (!commentId && typeof data?.selftext === 'string' && data.selftext.trim()) {
    return data.selftext.trim();
  }

  for (const value of Object.values(node)) {
    const found = findCommentBody(value, commentId);
    if (found) return found;
  }

  return null;
}

async function fetchRedditBody(redditUrl) {
  if (!redditUrl) {
    return '';
  }

  const { commentId } = extractIdsFromRedditUrl(redditUrl);
  const jsonUrl = toJsonUrl(redditUrl);

  const response = await fetch(jsonUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (lead-finder f5bot ingestor)',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch Reddit JSON: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  return findCommentBody(data, commentId) || '';
}

module.exports = {
  fetchRedditBody,
};
