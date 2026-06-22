function analyzePainClusters(rows) {
  const clusterMap = {};

  for (const row of rows) {
    const cluster = row.pain_cluster;

    const score = Number(row.reddit_posts?.score || 0);

    if (!clusterMap[cluster]) {
      clusterMap[cluster] = {
        name: cluster,
        posts_count: 0,
        total_score: 0,
      };
    }

    clusterMap[cluster].posts_count += 1;

    clusterMap[cluster].total_score += score;
  }

  return Object.values(clusterMap).map((cluster) => ({
    name: cluster.name,

    posts_count: cluster.posts_count,

    avg_score: Number((cluster.total_score / cluster.posts_count).toFixed(2)),

    updated_at: new Date().toISOString(),
  }));
}

module.exports = {
  analyzePainClusters,
};
