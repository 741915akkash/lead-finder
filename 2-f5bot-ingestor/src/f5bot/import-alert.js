const { supabase } = require('../db/db');

async function importAlert(lead) {
  const { error } = await supabase.from('reddit_posts').upsert(
    {
      reddit_guid: lead.reddit_guid,

      source: 'f5bot',

      keyword: lead.keyword,

      subreddit: lead.subreddit,

      title: lead.title,

      author: `/u/${lead.author}`,

      url: lead.url,
      published_at: lead.published_at,
    },
    {
      onConflict: 'reddit_guid',
    },
  );

  if (error) throw error;
}

module.exports = {
  importAlert,
};
