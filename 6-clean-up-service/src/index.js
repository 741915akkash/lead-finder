require('dotenv').config();

const { cleanupLowScorePosts } = require('./service/cleanup');

async function run() {
  try {
    await cleanupLowScorePosts();
  } catch (err) {
    console.error('cleanup failed:', err.message);
  }

  process.exit(0);
}

run();
