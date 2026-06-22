const { supabase } = require('./db');

async function getPostById(postId) {
  const { data, error } = await supabase.from('reddit_posts').select('*').eq('id', postId).single();

  if (error) throw error;

  return data;
}

module.exports = {
  getPostById,
};
