import { getSupabase } from '../../utils/supabase';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);

  const jobPostingIdRaw = query.job_posting_id;

  const supabase = getSupabase();

  let db = supabase
    .from('applications')
    .select(
      `
      id,
      job_posting_id,
      crm_lead_id,
      crm_quiz_id,
      status,
      applied_at,
      application_url,
      resume_version,
      notes,
      created_at,
      updated_at
    `,
    )
    .order('created_at', {
      ascending: false,
    });

  if (jobPostingIdRaw !== undefined && jobPostingIdRaw !== '') {
    const jobPostingId = Number(jobPostingIdRaw);

    if (!Number.isInteger(jobPostingId)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid job_posting_id',
      });
    }

    db = db.eq('job_posting_id', jobPostingId);
  }

  const { data, error } = await db;

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }

  return data || [];
});
