const { getIcpData } = require('../modules/icp-discovery/query');
const { analyzeIcps } = require('../modules/icp-discovery/analyze');
const { saveIcps } = require('../modules/icp-discovery/save');

async function runIcpAnalysis() {
  console.log('Running ICP analysis...');

  const rows = await getIcpData();

  const icps = analyzeIcps(rows);

  await saveIcps(icps);

  console.log(`Updated ${icps.length} ICPs`);
}

module.exports = {
  runIcpAnalysis,
};
