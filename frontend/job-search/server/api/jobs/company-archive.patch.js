import { getSupabase } from '../../utils/supabase';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  const company = body?.company;

  const note = body?.note || null;

  if (!company) {
    throw createError({
      statusCode: 400,
      statusMessage: 'company is required',
    });
  }

  const supabase = getSupabase();

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('job_postings')
    .update({
      archived: true,
      archive_reason: 'company',
      archive_note: note,
      archived_at: now,
      updated_at: now,
    })
    .eq('company', company)
    .select('id, company, archived, archive_note, archived_at');

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }

  return {
    company,
    archivedCount: data?.length || 0,
  };
});
