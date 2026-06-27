const { supabase } = require('../db/db');

async function cleanupLowScorePosts() {
  const { error } = await supabase.from('reddit_posts').delete().eq('score', 0).not('score', 'is', null);

  if (error) {
    throw error;
  }

  console.log('Deleted analyzed posts with score = 0');
}

module.exports = {
  cleanupLowScorePosts,
};
