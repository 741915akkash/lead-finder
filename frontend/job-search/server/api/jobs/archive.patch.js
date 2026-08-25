import { getSupabase } from '../../utils/supabase';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  const jobId = body?.jobId;
  const note = body?.note || null;

  if (!jobId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'jobId is required',
    });
  }

  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('job_postings')
    .update({
      archived: true,
      archive_note: note,
      archived_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', jobId)
    .select('id, archived, archive_note, archived_at')
    .single();

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }

  return data;
});
