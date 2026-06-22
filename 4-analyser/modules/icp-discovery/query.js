const { supabase } = require('../../db/db');

async function getIcpData() {
  const { data, error } = await supabase.from('post_analysis').select(`
      icp,
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
  getIcpData,
};
