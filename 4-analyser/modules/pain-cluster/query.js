const { supabase } = require('../../db/db');

async function getPainClusterData() {
  const { data, error } = await supabase.from('post_analysis').select(`
      pain_cluster,
      reddit_posts (
        score
      )
    `);

  if (error) {
    throw error;
  }

  return data;
}

module.exports = {
  getPainClusterData,
};
