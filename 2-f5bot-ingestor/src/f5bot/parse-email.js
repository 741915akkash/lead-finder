const cheerio = require('cheerio');
const ALLOWED_SUBREDDITS = require('../config/subreddits');

function parseEmail(html) {
  const $ = cheerio.load(html);

  const keywordText = $('body').text();
  const keywordMatch = keywordText.match(/Keyword:\s*"([^"]+)"/i);
  const keyword = keywordMatch?.[1] || null;

  const results = [];

  $('p[style*="margin-left"]').each((_, el) => {
    const p = $(el);
    const link = p.find('a').first();

    if (!link.length) return;

    const title = link.text().trim();
    const href = link.attr('href');
    const body = p.find('span').text().trim();
    const firstTextNode = p.contents().first().text();

    const sourceMatch =
      firstTextNode.match(/(Reddit Comments|Reddit Posts)\s+\(\/r\/([^)]+)\)/) ||
      p.text().match(/(Reddit Comments|Reddit Posts)\s+\(\/r\/([^)]+)\)/);
    const subreddit = (sourceMatch?.[2] || '').replace(/\/$/, '');

    if (!subreddit || !ALLOWED_SUBREDDITS.includes(subreddit.toLowerCase())) {
      return;
    }

    const authorText = p.text();
    const authorMatch = authorText.match(/by\s+([A-Za-z0-9_-]+)/);
    const author = authorMatch?.[1] || null;

    results.push({
      source: 'f5bot',
      keyword,
      subreddit: subreddit.toLowerCase(),
      title,
      body,
      author,
      url: href ? extractRedditUrl(href) : null,
      reddit_guid: href ? extractRedditGuid(href) : null,
    });
  });

  return results;
}

function extractRedditGuid(redditUrl) {
  const parsed = new URL(extractRedditUrl(redditUrl));
  const pathname = parsed.pathname;

  const commentMatch = pathname.match(/\/comments\/([a-z0-9]+)\/.*?\/([a-z0-9]+)(?:\/|$)/i);

  if (commentMatch) {
    return `t1_${commentMatch[2]}`;
  }

  const postMatch = pathname.match(/\/comments\/([a-z0-9]+)(?:\/|$)/i);

  if (postMatch) {
    return `t3_${postMatch[1]}`;
  }

  return redditUrl;
}

function extractRedditUrl(f5botUrl) {
  const parsed = new URL(f5botUrl);

  return decodeURIComponent(parsed.searchParams.get('u'));
}

module.exports = {
  parseEmail,
};
