const { scorePost } = require('../../../3-ollama-scorer/src/jobs/score-post');

module.exports = async function (job) {
  console.log('Scoring post', job.payload.postId);
  return scorePost(job.payload.postId);
};
