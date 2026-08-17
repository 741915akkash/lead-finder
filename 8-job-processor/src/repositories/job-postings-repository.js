const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function getJobPostingById(id) {
  const { data, error } = await supabase.from('job_postings').select('*').eq('id', id).single();

  if (error) {
    throw error;
  }

  return data;
}

async function updateParsedJob(id, parsedJob, postedAt) {
  const { data, error } = await supabase
    .from('job_postings')
    .update({
      title: parsedJob.title,
      company: parsedJob.company,
      location: parsedJob.location,
      employment_type: parsedJob.employment_type,
      workplace_type: parsedJob.workplace_type,
      salary_original: parsedJob.salary_original,
      salary_min: parsedJob.salary_min,
      salary_max: parsedJob.salary_max,
      salary_currency: parsedJob.salary_currency,
      description: parsedJob.description,
      posted_at: postedAt,
      parsed_at: new Date().toISOString(),
      status: 'parsed',
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

module.exports = {
  getJobPostingById,
  updateParsedJob,
};
