require('dotenv').config();

const { enqueueJob, JOB_TYPES } = require('ollama-queue');

const repository = require('./repositories/job-repository');
const { getUnscoredPosts } = require('./db/get-unscored-posts');

async function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function run() {
  console.log('Loading posts...');

  const posts = await getUnscoredPosts();

  console.log(`Found ${posts.length} posts`);

  let queued = 0;

  for (const post of posts) {
    try {
      await enqueueJob(repository, {
        jobType: JOB_TYPES.SCORE_POST,
        payload: {
          postId: post.id,
        },
        priority: 10,
      });

      queued++;

      console.log(`Queued: ${post.title}`);
    } catch (err) {
      console.error(`Failed to queue ${post.id}`, err.message);
    }
  }

  console.log(`Queued ${queued} jobs`);
}

async function main() {
  while (true) {
    try {
      await run();
    } catch (err) {
      console.error('Scorer failed:', err);
    }

    console.log('Sleeping for 15 minutes...');
    await sleep(15 * 60 * 1000);
  }
}

main().catch(console.error);
