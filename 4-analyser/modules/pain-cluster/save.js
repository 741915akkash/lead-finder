const { supabase } = require('../../db/db');

async function savePainClusters(clusters) {
  for (const cluster of clusters) {
    const { error } = await supabase.from('pain_clusters').upsert(
      {
        name: cluster.name,

        posts_count: cluster.posts_count,

        avg_score: cluster.avg_score,

        updated_at: cluster.updated_at,
      },
      {
        onConflict: 'name',
      },
    );

    if (error) {
      throw error;
    }
  }
}

module.exports = {
  savePainClusters,
};
