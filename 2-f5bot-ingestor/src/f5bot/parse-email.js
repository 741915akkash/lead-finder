const ALLOWED_SUBREDDITS = require('../config/subreddits');

function extractRedditUrl(f5botUrl) {
  const parsed = new URL(f5botUrl);

  return decodeURIComponent(parsed.searchParams.get('u'));
}

function extractRedditGuid(redditUrl) {
  const commentMatch = redditUrl.match(/\/comments\/([a-z0-9]+)\/.*?\/([a-z0-9]+)(?:\?|$)/i);

  if (commentMatch) {
    return `t1_${commentMatch[2]}`;
  }

  const postMatch = redditUrl.match(/\/comments\/([a-z0-9]+)/i);

  if (postMatch) {
    return `t3_${postMatch[1]}`;
  }

  return redditUrl;
}

function parseEmail(body, urls = []) {
  const keywordMatch = body.match(/Keyword:\s*"([^"]+)"/i);

  const keyword = keywordMatch?.[1] || null;

  const alerts = [];

  const regex = /Reddit\s+(Posts|Comments)\s+\(\/r\/([^/]+)\/\):\s*(.*?)\s+by\s+([^\n]+)/gi;

  let match;
  let index = 0;

  while ((match = regex.exec(body)) !== null) {
    const subreddit = match[2].toLowerCase();

    const redditUrl = urls[index] ? extractRedditUrl(urls[index]) : null;

    if (!ALLOWED_SUBREDDITS.includes(subreddit)) {
      index++;
      continue;
    }

    alerts.push({
      source: 'f5bot',

      keyword,

      type: match[1].toLowerCase(),

      subreddit,

      title: match[3].trim(),

      author: match[4].trim(),

      url: redditUrl,

      reddit_guid: redditUrl ? extractRedditGuid(redditUrl) : null,
    });

    index++;
  }

  return alerts;
}

module.exports = {
  parseEmail,
};
