const { getPainClusterData } = require('../modules/pain-cluster/query');
const { analyzePainClusters } = require('../modules/pain-cluster/analyze');
const { savePainClusters } = require('../modules/pain-cluster/save');

async function runPainAnalysis() {
  console.log('Running pain cluster analysis...');

  const rows = await getPainClusterData();

  const clusters = analyzePainClusters(rows);

  await savePainClusters(clusters);

  console.log(`Updated ${clusters.length} pain clusters`);
}

module.exports = {
  runPainAnalysis,
};
