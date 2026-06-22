const Parser = require('rss-parser');

const parser = new Parser({
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/136.0 Safari/537.36',
  },
});

async function test() {
  const feed = await parser.parseURL('https://old.reddit.com/r/entrepreneur/new/.rss');

  console.log(feed.items.length);
}

test();
