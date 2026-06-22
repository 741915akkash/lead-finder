const { supabase } = require('../../db/db');

async function saveSubredditStats(stats) {
  for (const row of stats) {
    const { error } = await supabase.from('subreddit_stats').upsert(row, {
      onConflict: 'subreddit',
    });

    if (error) {
      throw error;
    }
  }
}

module.exports = {
  saveSubredditStats,
};
