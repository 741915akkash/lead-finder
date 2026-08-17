function normalizeJob(job) {
  if (!job.source) {
    throw new Error('Job source is required');
  }

  if (!job.source_job_id) {
    throw new Error('Job source_job_id is required');
  }

  if (!job.url) {
    throw new Error('Job URL is required');
  }

  if (!job.title) {
    throw new Error('Job title is required');
  }

  return {
    source: job.source,
    source_job_id: String(job.source_job_id),

    url: job.url,
    apply_url: job.apply_url || null,

    title: job.title,
    company: job.company || null,
    location: job.location || null,

    employment_type: job.employment_type || null,
    workplace_type: job.workplace_type || null,

    salary_min: job.salary_min ?? null,
    salary_max: job.salary_max ?? null,
    salary_currency: job.salary_currency || null,

    description: job.description || null,

    posted_at: job.posted_at || null,

    raw_data: job.raw_data || job,
  };
}

module.exports = {
  normalizeJob,
};
