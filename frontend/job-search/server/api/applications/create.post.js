import { getSupabase } from '../../utils/supabase';

const ALLOWED_STATUSES = ['applied', 'interview', 'offer', 'rejected'];

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  const jobPostingId = Number(body?.job_posting_id);

  if (!Number.isInteger(jobPostingId)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid job_posting_id',
    });
  }

  const status = body?.status || 'applied';

  if (!ALLOWED_STATUSES.includes(status)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid application status',
    });
  }

  let crmLeadId = null;

  if (body?.crm_lead_id !== null && body?.crm_lead_id !== undefined && body?.crm_lead_id !== '') {
    crmLeadId = Number(body.crm_lead_id);

    if (!Number.isInteger(crmLeadId)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid crm_lead_id',
      });
    }
  }

  const crmQuizId = body?.crm_quiz_id ? String(body.crm_quiz_id).trim() : null;

  let appliedAt = new Date();

  if (body?.applied_at) {
    appliedAt = new Date(body.applied_at);

    if (Number.isNaN(appliedAt.getTime())) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid applied_at',
      });
    }
  }

  const applicationUrl = body?.application_url ? String(body.application_url).trim() : null;

  const resumeVersion = body?.resume_version ? String(body.resume_version).trim() : null;

  const notes = body?.notes ? String(body.notes).trim() : null;

  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('applications')
    .insert({
      job_posting_id: jobPostingId,

      crm_lead_id: crmLeadId,

      crm_quiz_id: crmQuizId,

      status,

      applied_at: appliedAt.toISOString(),

      application_url: applicationUrl,

      resume_version: resumeVersion,

      notes,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw createError({
        statusCode: 409,
        statusMessage: 'An application already exists for this job',
      });
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }

  return data;
});
