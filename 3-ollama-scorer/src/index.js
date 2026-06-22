require('dotenv').config();

const { enqueueJob, JOB_TYPES } = require('ollama-queue');

const repository = require('./repositories/job-repository');

const { getUnscoredPosts } = require('./db/get-unscored-posts');

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

  console.log('Done');
}

run().catch(console.error);
