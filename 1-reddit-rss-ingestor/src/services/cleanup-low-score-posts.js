const { supabase } = require('../db/db');

async function cleanupLowScorePosts() {
  const { error } = await supabase.from('reddit_posts').delete().lt('score', 50).not('score', 'is', null);

  if (error) {
    throw error;
  }

  console.log('Deleted analyzed posts with score < 50');
}

module.exports = {
  cleanupLowScorePosts,
};
