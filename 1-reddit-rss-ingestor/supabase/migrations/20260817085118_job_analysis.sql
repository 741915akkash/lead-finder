ALTER TABLE job_postings
  ADD COLUMN IF NOT EXISTS role_label text,
  ADD COLUMN IF NOT EXISTS work_score numeric(4,3),
  ADD COLUMN IF NOT EXISTS technology_score numeric(4,3),
  ADD COLUMN IF NOT EXISTS technology_labels text[],
  ADD COLUMN IF NOT EXISTS company_score numeric(4,3),
  ADD COLUMN IF NOT EXISTS company_size_label text,
  ADD COLUMN IF NOT EXISTS company_stage_label text,
  ADD COLUMN IF NOT EXISTS salary_score numeric(4,3),
  ADD COLUMN IF NOT EXISTS salary_label text,
  ADD COLUMN IF NOT EXISTS analysis jsonb,
  ADD COLUMN IF NOT EXISTS analysis_version integer DEFAULT 1;

ALTER TABLE job_postings
  ADD CONSTRAINT job_postings_role_label_check
  CHECK (
    role_label IS NULL
    OR role_label IN ('direct', 'adjacent', 'unrelated')
  );

ALTER TABLE job_postings
  ADD CONSTRAINT job_postings_work_score_check
  CHECK (
    work_score IS NULL
    OR (work_score >= 0 AND work_score <= 1)
  );

ALTER TABLE job_postings
  ADD CONSTRAINT job_postings_technology_score_check
  CHECK (
    technology_score IS NULL
    OR (technology_score >= 0 AND technology_score <= 1)
  );

ALTER TABLE job_postings
  ADD CONSTRAINT job_postings_company_score_check
  CHECK (
    company_score IS NULL
    OR (company_score >= 0 AND company_score <= 1)
  );

ALTER TABLE job_postings
  ADD CONSTRAINT job_postings_salary_score_check
  CHECK (
    salary_score IS NULL
    OR (salary_score >= 0 AND salary_score <= 1)
  );

ALTER TABLE job_postings
  ADD CONSTRAINT job_postings_salary_label_check
  CHECK (
    salary_label IS NULL
    OR salary_label IN (
      'below_minimum',
      'acceptable',
      'desired_range',
      'above_desired',
      'unknown'
    )
  );