const { supabase } = require('./db');

async function getUnscoredPosts() {
  const { data, error } = await supabase.from('reddit_posts').select('*').eq('status', 'new').limit(50);

  if (error) throw error;

  return data;
}

module.exports = {
  getUnscoredPosts,
};
