import { getSupabase } from '../utils/supabase';

export default defineEventHandler(async () => {
  const supabase = getSupabase();

  const [keywords, subreddits, sources, statuses] = await Promise.all([
    supabase.from('reddit_posts').select('keyword').not('keyword', 'is', null),

    supabase.from('reddit_posts').select('subreddit').not('subreddit', 'is', null),

    supabase.from('reddit_posts').select('source').not('source', 'is', null),

    supabase.from('reddit_posts').select('status').not('status', 'is', null),

    
  ]);

  return {
    keywords: [...new Set(keywords.data.map((r) => r.keyword))].sort(),
    subreddits: [...new Set(subreddits.data.map((r) => r.subreddit))].sort(),
    sources: [...new Set(sources.data.map((r) => r.source))].sort(),
    statuses: [...new Set(statuses.data.map((r) => r.status))].sort(),
  };
});
