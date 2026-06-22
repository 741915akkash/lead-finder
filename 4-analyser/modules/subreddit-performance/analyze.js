function analyzeSubreddits(posts) {
  const subredditMap = {};

  for (const post of posts) {
    const subreddit = post.subreddit;

    if (!subredditMap[subreddit]) {
      subredditMap[subreddit] = {
        subreddit,
        posts_count: 0,
        total_score: 0,
        high_score_posts: 0,
        last_seen: null,
      };
    }

    const row = subredditMap[subreddit];

    row.posts_count += 1;

    row.total_score += Number(post.score || 0);

    if (Number(post.score || 0) >= 80) {
      row.high_score_posts += 1;
    }

    if (!row.last_seen || new Date(post.created_at) > new Date(row.last_seen)) {
      row.last_seen = post.created_at;
    }
  }

  return Object.values(subredditMap).map((row) => ({
    subreddit: row.subreddit,

    posts_count: row.posts_count,

    avg_score: Number((row.total_score / row.posts_count).toFixed(2)),

    high_score_posts: row.high_score_posts,

    last_seen: row.last_seen,

    updated_at: new Date().toISOString(),
  }));
}

module.exports = {
  analyzeSubreddits,
};
