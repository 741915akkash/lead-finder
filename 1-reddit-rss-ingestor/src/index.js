require('dotenv').config();

const subreddits = require('./config/subreddits');

const { syncSubreddit } = require('./services/sync-subreddit');
const { cleanupLowScorePosts } = require('./services/cleanup-low-score-posts');

async function run() {
  for (const subreddit of subreddits) {
    try {
      await syncSubreddit(subreddit);
    } catch (err) {
      console.error(subreddit, err.message);
    }
  }

  try {
    await cleanupLowScorePosts();
  } catch (err) {
    console.error('cleanup failed:', err.message);
  }

  process.exit(0);
}

run();
