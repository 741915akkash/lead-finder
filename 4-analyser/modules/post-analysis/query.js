const { supabase } = require('../../db/db');

async function getPostsForAnalysis(limit = 10) {
  const { data, error } = await supabase
    .from('reddit_posts')
    .select('*')
    .eq('status', 'scored')
    .is('analyzed_at', null)
    .order('score', { ascending: false })
    .limit(limit);

  if (error) throw error;

  return data;
}

module.exports = {
  getPostsForAnalysis,
};
