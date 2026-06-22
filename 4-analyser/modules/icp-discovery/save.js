const { supabase } = require('../../db/db');

async function saveIcps(icps) {
  for (const icp of icps) {
    const { error } = await supabase.from('icp_profiles').upsert(
      {
        name: icp.name,

        posts_count: icp.posts_count,

        avg_score: icp.avg_score,

        updated_at: icp.updated_at,
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
  saveIcps,
};
