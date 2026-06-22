const { supabase } = require('../../db/db');

async function getKeywordData() {
  const { data, error } = await supabase
    .from('reddit_posts')
    .select(
      `
      keyword,
      score,
      created_at
    `,
    )
    .not('keyword', 'is', null);

  if (error) {
    throw error;
  }

  return data;
}

module.exports = {
  getKeywordData,
};
