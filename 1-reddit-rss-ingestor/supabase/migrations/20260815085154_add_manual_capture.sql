alter table job_postings
add column raw_text text;

alter table job_postings
add column parsed_at timestamptz;

alter table job_postings
add column analyzed_at timestamptz;