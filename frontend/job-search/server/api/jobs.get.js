import { getSupabase } from '../utils/supabase';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);

  const search = query.search || '';
  const source = query.source || '';
  const status = query.status || '';
  const recommendation = query.recommendation || '';

  const days = Number(query.days || 30);

  const page = Number(query.page || 1);
  const pageSize = Number(query.pageSize || 50);

  const allowedSorts = ['fit_score', 'priority_score', 'posted_at'];

  const sort = allowedSorts.includes(query.sort) ? query.sort : 'fit_score';

  const order = query.order === 'asc' ? 'asc' : 'desc';

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const supabase = getSupabase();

  let db = supabase
    .from('job_postings')
    .select(
      `
      id,
      title,
      company,
      location,
      url,
      source,
      status,
      posted_at,
      fit_score,
      priority_score,
      recommendation
      `,
      {
        count: 'exact',
      },
    )
    .or(`posted_at.gte.${cutoff.toISOString()},posted_at.is.null`);

  if (search) {
    db = db.or(`title.ilike.%${search}%,company.ilike.%${search}%`);
  }

  if (source) {
    db = db.eq('source', source);
  }

  if (status) {
    db = db.eq('status', status);
  }

  if (recommendation) {
    db = db.eq('recommendation', recommendation);
  }

  const { data, count, error } = await db
    .order(sort, {
      ascending: order === 'asc',
      nullsFirst: false,
    })
    .range(from, to);

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }

  return {
    page,
    pageSize,
    total: count,
    totalPages: Math.ceil(count / pageSize),
    rows: data || [],
    days,
  };
});
