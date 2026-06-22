const { scorePost } = require('../../../ollama-scorer/src/jobs/score-post');

module.exports = async function (job) {
  return scorePost(job.payload.postId);
};
