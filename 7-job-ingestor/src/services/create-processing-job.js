const { supabase } = require('../db/db');

async function createProcessingJob(jobPostingId) {
  const { data, error } = await supabase
    .from('jobs_2')
    .insert({
      job_type: 'parse_job',

      payload: {
        job_posting_id: jobPostingId,
      },

      priority: 0,
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    // Duplicate processing job is expected when the
    // same job posting is ingested again.
    if (error.code === '23505') {
      console.log(`Processing job already exists for job posting: ${jobPostingId}`);

      return null;
    }

    throw error;
  }

  console.log(`✓ Created processing job: ${data.id}`);

  return data;
}

module.exports = {
  createProcessingJob,
};
