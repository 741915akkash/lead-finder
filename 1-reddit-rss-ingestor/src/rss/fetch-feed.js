const Parser = require('rss-parser');

const parser = new Parser({
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/136.0 Safari/537.36',
  },
});

async function fetchFeed(subreddit) {
  const url = `https://old.reddit.com/r/${subreddit}/new/.rss`;

  try {
    console.log('Fetching:', url);

    const feed = await parser.parseURL(url);

    return feed.items;
  } catch (err) {
    console.error('----------');
    console.error('Subreddit:', subreddit);
    console.error('Status:', err.statusCode);
    console.error('Message:', err.message);

    if (err.response?.headers) {
      console.error('Headers:', err.response.headers);
    }

    console.error('----------');

    return [];
  }
}

module.exports = {
  fetchFeed,
};
