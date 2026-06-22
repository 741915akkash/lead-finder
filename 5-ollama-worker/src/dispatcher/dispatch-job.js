const scorePost = require('../handlers/score-post');

const postAnalysis = require('../handlers/post-analysis');

const keywordAnalysis = require('../handlers/keyword-analysis');

const subredditAnalysis = require('../handlers/subreddit-analysis');

const painAnalysis = require('../handlers/pain-analysis');

const icpAnalysis = require('../handlers/icp-analysis');

async function dispatchJob(job) {
  switch (job.job_type) {
    case 'score_post':
      return scorePost(job);

    case 'post_analysis':
      return postAnalysis(job);

    case 'keyword_analysis':
      return keywordAnalysis(job);

    case 'subreddit_analysis':
      return subredditAnalysis(job);

    case 'pain_analysis':
      return painAnalysis(job);

    case 'icp_analysis':
      return icpAnalysis(job);

    default:
      throw new Error(`Unknown job type ${job.job_type}`);
  }
}

module.exports = {
  dispatchJob,
};
