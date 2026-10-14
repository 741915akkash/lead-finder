function isTargetJob(job) {
  const title = (job?.title || '').toLowerCase().trim();

  // Exclude senior and staff roles
  const excludedPatterns = [/\bsenior\b/, /\bstaff\b/];

  if (excludedPatterns.some((pattern) => pattern.test(title))) {
    return false;
  }

  const targetPatterns = [
    // Core
    /\bfull[\s-]?stack\b/,
    /\bsoftware[\s-]?engineer\b/,
    /\bsoftware[\s-]?developer\b/,
    /\bproduct[\s-]?engineer\b/,

    // Founding / early-stage
    /\bfounding[\s-]?engineer\b/,
    /\bfounding[\s-]?software[\s-]?engineer\b/,
    /\bfounding[\s-]?product[\s-]?engineer\b/,

    // Forward deployed
    /\bforward[\s-]?deployed\b/,
    /\bdeployment[\s-]?engineer\b/,

    // AI / agents
    /\bai[\s-]?engineer\b/,
    /\bapplied[\s-]?ai[\s-]?engineer\b/,
    /\bagent[\s-]?engineer\b/,
  ];

  return targetPatterns.some((pattern) => pattern.test(title));
}

module.exports = {
  isTargetJob,
};
