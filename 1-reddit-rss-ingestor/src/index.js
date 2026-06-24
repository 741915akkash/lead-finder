require('dotenv').config();

const subreddits = require('./config/subreddits');
const { syncSubreddit } = require('./services/sync-subreddit');

async function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function run() {
  console.log('Starting RSS sync...');

  for (const subreddit of subreddits) {
    try {
      await syncSubreddit(subreddit);
    } catch (err) {
      console.error(subreddit, err.message);
    }
  }

  console.log('RSS sync completed');
}

async function main() {
  while (true) {
    try {
      await run();
    } catch (err) {
      console.error('RSS ingestor failed:', err);
    }

    console.log('Sleeping for 15 minutes...');
    await sleep(15 * 60 * 1000);
  }
}

main().catch(console.error);
