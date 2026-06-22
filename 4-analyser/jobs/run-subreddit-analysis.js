const { getSubredditData } = require('../modules/subreddit-performance/query');
const { analyzeSubreddits } = require('../modules/subreddit-performance/analyze');
const { saveSubredditStats } = require('../modules/subreddit-performance/save');

async function runSubredditAnalysis() {
  console.log('Running subreddit analysis...');

  const posts = await getSubredditData();

  const stats = analyzeSubreddits(posts);

  await saveSubredditStats(stats);

  console.log(`Updated ${stats.length} subreddits`);
}

module.exports = {
  runSubredditAnalysis,
};
