function normalizeGreenhouseJob(job, company) {
  return {
    source: 'greenhouse',

    source_job_id: String(job.id),

    url: job.absolute_url,

    apply_url: job.absolute_url,

    title: job.title,

    company,

    location: job.location?.name || null,

    employment_type: null,

    workplace_type: null,

    salary_min: null,

    salary_max: null,

    salary_currency: null,

    description: job.content || null,

    posted_at: job.first_published || job.updated_at || null,

    raw_data: job,
  };
}

module.exports = {
  normalizeGreenhouseJob,
};
