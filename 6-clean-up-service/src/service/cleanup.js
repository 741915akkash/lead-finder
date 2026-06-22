const { supabase } = require('../db/db');

async function cleanupLowScorePosts() {
  const { error } = await supabase.from('reddit_posts').delete().lt('score', 60).not('score', 'is', null);

  if (error) {
    throw error;
  }

  console.log('Deleted analyzed posts with score < 60');
}

module.exports = {
  cleanupLowScorePosts,
};
