const { supabase } = require('../db/db');
const { fetchFeed } = require('../rss/fetch-feed');

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function syncSubreddit(subreddit) {
  const posts = await fetchFeed(subreddit);

  for (const post of posts) {
    const { data, error } = await supabase.from('reddit_posts').upsert(
      {
        reddit_guid: post.id,
        subreddit,
        source: 'rss',
        title: post.title,
        url: post.link,
        author: post.author,
        published_at: post.pubDate,
      },
      {
        onConflict: 'reddit_guid',
      },
    );

    if (error) {
      console.error(error);
    }

    console.log(`data upserted for ${subreddit}:`, data);
  }
  console.log(`${subreddit}: ${posts.length}`);

  // wait 1 minute before next subreddit
  await sleep(60000);
}

module.exports = {
  syncSubreddit,
};
