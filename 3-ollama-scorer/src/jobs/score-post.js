const { getPostById } = require('../db/get-post-by-id');

const { updateScore } = require('../db/update-score');

const { scoreLead } = require('../ai/score');

async function scorePost(postId) {
  const post = await getPostById(postId);

  const result = await scoreLead(post);

  await updateScore(post.id, result);

  return result;
}

module.exports = {
  scorePost,
};
