require('dotenv').config();

const subreddits = require('./config/subreddits');

const { syncSubreddit } = require('./services/sync-subreddit');

async function run() {
  for (const subreddit of subreddits) {
    try {
      await syncSubreddit(subreddit);
    } catch (err) {
      console.error(subreddit, err.message);
    }
  }

  process.exit(0);
}

run();
