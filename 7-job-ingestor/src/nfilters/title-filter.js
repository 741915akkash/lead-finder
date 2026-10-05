function isTargetJob(job) {
  const title = (job?.title || '').toLowerCase().trim();

  const targetPatterns = [/\bfull[\s-]?stack\b/, /\bsoftware[\s-]?engineer\b/, /\bproduct[\s-]?engineer\b/];

  return targetPatterns.some((pattern) => pattern.test(title));
}
module.exports = {
  isTargetJob,
};
