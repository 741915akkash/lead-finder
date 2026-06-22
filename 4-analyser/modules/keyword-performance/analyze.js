function analyzeKeywords(posts) {
  const map = {};

  for (const post of posts) {
    if (!map[post.keyword]) {
      map[post.keyword] = {
        keyword: post.keyword,
        posts_count: 0,
        total_score: 0,
        high_score_posts: 0,
        last_seen: null,
      };
    }

    const row = map[post.keyword];

    row.posts_count++;

    row.total_score += post.score || 0;

    if ((post.score || 0) >= 80) {
      row.high_score_posts++;
    }

    if (!row.last_seen || post.created_at > row.last_seen) {
      row.last_seen = post.created_at;
    }
  }

  return Object.values(map).map((row) => ({
    keyword: row.keyword,

    posts_count: row.posts_count,

    avg_score: row.posts_count === 0 ? 0 : Number((row.total_score / row.posts_count).toFixed(2)),

    high_score_posts: row.high_score_posts,

    last_seen: row.last_seen,

    updated_at: new Date(),
  }));
}

module.exports = {
  analyzeKeywords,
};
