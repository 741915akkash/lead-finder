const { getKeywordData } = require('../modules/keyword-performance/query');
const { analyzeKeywords } = require('../modules/keyword-performance/analyze');
const { saveKeywordStats } = require('../modules/keyword-performance/save');

async function runKeywordAnalysis() {
  const posts = await getKeywordData();

  const stats = analyzeKeywords(posts);

  await saveKeywordStats(stats);

  console.log(`Updated ${stats.length} keywords`);
}

module.exports = {
  runKeywordAnalysis,
};
