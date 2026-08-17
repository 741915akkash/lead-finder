const { supabase } = require('../db/db');

async function upsertJob(job) {
  const { data, error } = await supabase
    .from('job_postings')
    .upsert(job, {
      onConflict: 'source,source_job_id',
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

module.exports = {
  upsertJob,
};
