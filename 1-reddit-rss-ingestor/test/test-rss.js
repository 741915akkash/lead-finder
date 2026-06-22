require('dotenv').config();

const { fetchFeed } = require('../src/rss/fetch-feed');

async function run() {
  const posts = await fetchFeed('smallbusiness');

  console.log(
    posts.slice(0, 3).map((post) => ({
      title: post.title,
      url: post.link,
    })),
  );
}

run();
