const { supabase } = require('../db/db');

async function updateExistingJob(job) {
  const { data, error } = await supabase
    .from('job_postings')
    .update({
      url: job.url,
      apply_url: job.apply_url,
      title: job.title,
      company: job.company,
      location: job.location,
      workplace_type: job.workplace_type,
      salary_min: job.salary_min,
      salary_max: job.salary_max,
      salary_currency: job.salary_currency,
      description: job.description,
      raw_text: job.raw_text,
      posted_at: job.posted_at,
      raw_data: job.raw_data,
      updated_at: new Date().toISOString(),
    })
    .eq('source', job.source)
    .eq('source_job_id', job.source_job_id)
    .select()
    .single();

  if (error) throw error;

  return data;
}

module.exports = {
  updateExistingJob,
};
