const { runPostAnalysis } = require('./jobs/run-post-analysis');
const { runKeywordAnalysis } = require('./jobs/run-keyword-analysis');
const { runSubredditAnalysis } = require('./jobs/run-subreddit-analysis');
const { runPainAnalysis } = require('./jobs/run-pain-analysis');
const { runIcpAnalysis } = require('./jobs/run-icp-analysis');

async function main() {
  await runPostAnalysis();
  await runKeywordAnalysis();
  await runSubredditAnalysis();
  await runPainAnalysis();
  await runIcpAnalysis();
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

module.exports = {
  main,
};
