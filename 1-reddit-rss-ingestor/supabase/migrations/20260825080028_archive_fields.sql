alter table job_postings
add column if not exists archived boolean not null default false;

alter table job_postings
add column if not exists archive_reason text;

alter table job_postings
add column if not exists archive_note text;

alter table job_postings
add column if not exists archived_at timestamp with time zone;