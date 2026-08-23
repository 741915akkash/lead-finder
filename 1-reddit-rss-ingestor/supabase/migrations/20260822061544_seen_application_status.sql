-- Add "seen" application status and make it the default.

ALTER TABLE public.applications
  ALTER COLUMN status SET DEFAULT 'seen';

ALTER TABLE public.applications
  DROP CONSTRAINT IF EXISTS applications_status_check;

ALTER TABLE public.applications
  ADD CONSTRAINT applications_status_check
  CHECK (
    status IN (
      'seen',
      'applied',
      'interview',
      'offer',
      'rejected'
    )
  );