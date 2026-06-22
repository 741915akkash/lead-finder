const { supabase } = require('../../db/db');

async function getSubredditData() {
  const { data, error } = await supabase
    .from('reddit_posts')
    .select(
      `
      subreddit,
      score,
      created_at
    `,
    )
    .not('subreddit', 'is', null);

  if (error) {
    throw error;
  }

  return data;
}

module.exports = {
  getSubredditData,
};
