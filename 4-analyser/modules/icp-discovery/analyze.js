function analyzeIcps(rows) {
  const icpMap = {};

  for (const row of rows) {
    const icp = row.icp;

    const score = Number(row.reddit_posts?.score || 0);

    if (!icpMap[icp]) {
      icpMap[icp] = {
        name: icp,
        posts_count: 0,
        total_score: 0,
      };
    }

    icpMap[icp].posts_count += 1;

    icpMap[icp].total_score += score;
  }

  return Object.values(icpMap).map((icp) => ({
    name: icp.name,

    posts_count: icp.posts_count,

    avg_score: Number((icp.total_score / icp.posts_count).toFixed(2)),

    updated_at: new Date().toISOString(),
  }));
}

module.exports = {
  analyzeIcps,
};
