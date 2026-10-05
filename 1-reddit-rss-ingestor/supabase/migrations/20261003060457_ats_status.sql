ALTER TABLE companies
ADD COLUMN ats_status TEXT NOT NULL DEFAULT 'unknown';

ALTER TABLE companies
ADD CONSTRAINT companies_ats_status_check
CHECK (
  ats_status IN (
    'pending',
    'detected',
    'manual',
    'unknown'
  )
);