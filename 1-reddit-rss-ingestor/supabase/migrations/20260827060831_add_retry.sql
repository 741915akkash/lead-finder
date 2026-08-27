ALTER TABLE jobs_2
ADD COLUMN IF NOT EXISTS attempts integer NOT NULL DEFAULT 0;

ALTER TABLE jobs_2
ADD COLUMN IF NOT EXISTS retry_at timestamptz NULL;

CREATE INDEX IF NOT EXISTS jobs_2_pending_retry_idx
ON jobs_2 (status, retry_at, priority, created_at);