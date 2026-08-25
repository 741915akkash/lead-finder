import { getSupabase } from '../../utils/supabase';

const ALLOWED_STATUSES = ['seen','applied', 'interview', 'offer', 'rejected'];

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

  const supabase = getSupabase();

  /*
   * Create application first.
   */
  const { data: application, error: applicationError } = await supabase
    .from('applications')
    .insert({
      job_posting_id: jobPostingId,

      status,

      applied_at: body?.applied_at ? new Date(body.applied_at).toISOString() : new Date().toISOString(),

      application_url: body?.application_url || null,

      resume_version: body?.resume_version || null,

      notes: body?.notes || null,
    })
    .select()
    .single();

  if (applicationError) {
    if (applicationError.code === '23505') {
      throw createError({
        statusCode: 409,
        statusMessage: 'An application already exists for this job',
      });
    }

    throw createError({
      statusCode: 500,
      statusMessage: applicationError.message,
    });
  }

  /*
   * Then create zero or more
   * application/contact links.
   */
  const contacts = Array.isArray(body?.contacts) ? body.contacts : [];

  if (contacts.length) {
    const rows = contacts
      .map((contact) => ({
        application_id: application.id,

        crm_lead_id: Number(contact.crm_lead_id),

        crm_quiz_id: contact.crm_quiz_id || null,
      }))
      .filter((contact) => Number.isInteger(contact.crm_lead_id));

    if (rows.length) {
      const { error: contactsError } = await supabase.from('application_contacts').insert(rows);

      if (contactsError) {
        /*
         * Don't leave a half-created application.
         */
        await supabase.from('applications').delete().eq('id', application.id);

        throw createError({
          statusCode: 500,
          statusMessage: contactsError.message,
        });
      }
    }
  }

  return application;
});
