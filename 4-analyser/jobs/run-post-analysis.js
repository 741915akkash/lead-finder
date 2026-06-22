const { getPostsForAnalysis } = require('../modules/post-analysis/query');
const { analyzePost } = require('../modules/post-analysis/analyze');
const { saveAnalysis } = require('../modules/post-analysis/save');

async function runPostAnalysis() {
  const posts = await getPostsForAnalysis();

  for (const post of posts) {
    const analysis = await analyzePost(post);

    await saveAnalysis(post, analysis);
  }
}

module.exports = {
  runPostAnalysis,
};
