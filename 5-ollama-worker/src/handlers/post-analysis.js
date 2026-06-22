// handlers/post-analysis.js

const { runPostAnalysis } = require('../../../4-analyzer/src/jobs/run-post-analysis');

module.exports = async function () {
  return runPostAnalysis();
};
