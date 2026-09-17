function extractSalary(job) {
  const components = job.compensation?.summaryComponents || [];

  const salary = components.find((component) => component.compensationType === 'Salary');

  if (!salary) {
    return {
      salary_min: null,
      salary_max: null,
      salary_currency: null,
    };
  }

  return {
    salary_min: salary.minValue ?? null,
    salary_max: salary.maxValue ?? null,
    salary_currency: salary.currencyCode || null,
  };
}

function normalizeAshbyJob(job, company) {
  if (!job.jobUrl) {
    throw new Error('Ashby job is missing jobUrl');
  }

  const salary = extractSalary(job);

  return {
    source: 'ashby',

    // Ashby's public posting API does not expose the job UUID
    // in this response, so use the stable public job URL.
    source_job_id: job.jobUrl,

    url: job.jobUrl,

    apply_url: job.applyUrl || job.jobUrl,

    title: job.title,

    company,

    location: job.location || null,

    workplace_type: job.workplaceType || null,

    salary_min: salary.salary_min,
    salary_max: salary.salary_max,
    salary_currency: salary.salary_currency,

    description: job.descriptionPlain || null,

    raw_text: job.descriptionPlain || null,

    posted_at: job.publishedAt || null,

    raw_data: job,
  };
}

module.exports = {
  normalizeAshbyJob,
};
