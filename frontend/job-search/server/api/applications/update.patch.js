import { getSupabase } from '../../utils/supabase';

const ALLOWED_STATUSES = ['applied', 'interview', 'offer', 'rejected'];

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  const id = Number(body?.id);

  if (!Number.isInteger(id)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid application id',
    });
  }

  const updates = {};

  if (body.status !== undefined) {
    if (!ALLOWED_STATUSES.includes(body.status)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid application status',
      });
    }

    updates.status = body.status;
  }

  if (body.crm_lead_id !== undefined) {
    if (body.crm_lead_id === null || body.crm_lead_id === '') {
      updates.crm_lead_id = null;
    } else {
      const crmLeadId = Number(body.crm_lead_id);

      if (!Number.isInteger(crmLeadId)) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Invalid crm_lead_id',
        });
      }

      updates.crm_lead_id = crmLeadId;
    }
  }

  if (body.crm_quiz_id !== undefined) {
    updates.crm_quiz_id = body.crm_quiz_id === null || body.crm_quiz_id === '' ? null : String(body.crm_quiz_id).trim();
  }

  if (body.applied_at !== undefined) {
    if (body.applied_at === null || body.applied_at === '') {
      updates.applied_at = new Date().toISOString();
    } else {
      const date = new Date(body.applied_at);

      if (Number.isNaN(date.getTime())) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Invalid applied_at',
        });
      }

      updates.applied_at = date.toISOString();
    }
  }

  if (body.application_url !== undefined) {
    updates.application_url =
      body.application_url === null || body.application_url === '' ? null : String(body.application_url).trim();
  }

  if (body.resume_version !== undefined) {
    updates.resume_version =
      body.resume_version === null || body.resume_version === '' ? null : String(body.resume_version).trim();
  }

  if (body.notes !== undefined) {
    updates.notes = body.notes === null || body.notes === '' ? null : String(body.notes).trim();
  }

  if (!Object.keys(updates).length) {
    throw createError({
      statusCode: 400,
      statusMessage: 'No fields to update',
    });
  }

  updates.updated_at = new Date().toISOString();

  const supabase = getSupabase();

  const { data, error } = await supabase.from('applications').update(updates).eq('id', id).select().single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw createError({
        statusCode: 404,
        statusMessage: 'Application not found',
      });
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }

  return data;
});
