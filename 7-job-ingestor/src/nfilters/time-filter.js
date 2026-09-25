function getCutoffDate(days = 14) {
  const cutoffDate = new Date();

  cutoffDate.setDate(cutoffDate.getDate() - days);

  return cutoffDate;
}

function isRecentJob(job, days = 14) {
  if (!job || !job.publishedAt) {
    return false;
  }

  const postedDate = new Date(job.publishedAt);

  if (Number.isNaN(postedDate.getTime())) {
    return false;
  }

  const cutoffDate = getCutoffDate(days);

  return postedDate >= cutoffDate;
}

module.exports = {
  getCutoffDate,
  isRecentJob,
};
