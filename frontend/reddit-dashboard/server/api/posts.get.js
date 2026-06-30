import { getSupabase } from '../utils/supabase';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);

  const search = query.search || '';
  const keyword = query.keyword || '';
  const subreddit = query.subreddit || '';
  const source = query.source || '';
  const status = query.status || '';

  const days = Number(query.days);

  const page = Number(query.page || 1);
  const pageSize = Number(query.pageSize || 50);

  const allowedSorts = ['score', 'published_at'];
  const sort = allowedSorts.includes(query.sort) ? query.sort : 'score';
  const order = query.order === 'asc' ? 'asc' : 'desc';

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const supabase = getSupabase();

  let db = supabase
    .from('reddit_posts')
    .select(
      `
      id,
      title,
      url,
      score,
      keyword,
      subreddit,
      source,
      status,
      published_at
      `,
      {
        count: 'exact',
      },
    )
    .gt('score', 0)
    .gte('published_at', cutoff.toISOString());

  if (search) {
    db = db.ilike('title', `%${search}%`);
  }

  if (keyword) {
    db = db.eq('keyword', keyword);
  }

  if (subreddit) {
    db = db.eq('subreddit', subreddit);
  }

  if (source) {
    db = db.eq('source', source);
  }

  if (status) {
    db = db.eq('status', status);
  }

  const { data, count, error } = await db
    .order(sort, {
      ascending: order === 'asc',
    })
    .range(from, to);

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }

  const rows = data.map((post) => ({
    ...post,
    url: post.url
      ?.replace('https://old.reddit.com', 'https://www.reddit.com')
      ?.replace('http://old.reddit.com', 'https://www.reddit.com'),
  }));

  return {
    page,
    pageSize,
    total: count,
    totalPages: Math.ceil(count / pageSize),
    rows: rows,
    days: days,
  };
});
