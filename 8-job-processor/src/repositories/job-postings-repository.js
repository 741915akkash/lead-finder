const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function getJobPostingById(id) {
  const { data, error } = await supabase.from('job_postings').select('*').eq('id', id).maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

async function updateParsedJob(id, parsedJob, postedAt) {
  const now = new Date().toISOString();

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

      parsed_at: now,
      status: 'parsed',
      updated_at: now,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

async function updateJobAnalysis(id, analysis) {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('job_postings')
    .update({
      fit_score: analysis.fit_score,
      recommendation: analysis.recommendation,
      ai_reason: analysis.ai_reason,
      ai_red_flags: analysis.ai_red_flags,

      analyzed_at: now,
      status: 'analyzed',
      updated_at: now,
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
  updateJobAnalysis,
};
