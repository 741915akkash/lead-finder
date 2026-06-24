require('dotenv').config();

const { cleanupLowScorePosts } = require('./service/cleanup');

async function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function run() {
  try {
    await cleanupLowScorePosts();

    console.log('Cleanup completed');
  } catch (err) {
    console.error('Cleanup failed:', err.message);
  }
}

async function main() {
  while (true) {
    await run();

    console.log('Sleeping for 1 hour...');
    await sleep(60 * 60 * 1000);
  }
}

main().catch(console.error);
