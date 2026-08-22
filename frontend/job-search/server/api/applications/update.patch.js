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

  const supabase = getSupabase();

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
    updates.application_url = body.application_url || null;
  }

  if (body.resume_version !== undefined) {
    updates.resume_version = body.resume_version || null;
  }

  if (body.notes !== undefined) {
    updates.notes = body.notes || null;
  }

  if (Object.keys(updates).length) {
    updates.updated_at = new Date().toISOString();

    const { error } = await supabase.from('applications').update(updates).eq('id', id);

    if (error) {
      throw createError({
        statusCode: 500,
        statusMessage: error.message,
      });
    }
  }

  /*
   * Replace the contact links when
   * contacts[] is supplied.
   *
   * This lets the modal represent
   * the complete current contact list.
   */
  if (Array.isArray(body.contacts)) {
    const { error: deleteError } = await supabase.from('application_contacts').delete().eq('application_id', id);

    if (deleteError) {
      throw createError({
        statusCode: 500,
        statusMessage: deleteError.message,
      });
    }

    const rows = body.contacts
      .map((contact) => ({
        application_id: id,

        crm_lead_id: Number(contact.crm_lead_id),

        crm_quiz_id: contact.crm_quiz_id || null,
      }))
      .filter((contact) => Number.isInteger(contact.crm_lead_id));

    if (rows.length) {
      const { error: insertError } = await supabase.from('application_contacts').insert(rows);

      if (insertError) {
        throw createError({
          statusCode: 500,
          statusMessage: insertError.message,
        });
      }
    }
  }

  const { data, error } = await supabase
    .from('applications')
    .select(
      `
          id,
          job_posting_id,
          status,
          applied_at,
          application_url,
          resume_version,
          notes,
          created_at,
          updated_at,
          application_contacts (
            id,
            crm_lead_id,
            crm_quiz_id,
            created_at
          )
        `,
    )
    .eq('id', id)
    .single();

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }

  return data;
});
