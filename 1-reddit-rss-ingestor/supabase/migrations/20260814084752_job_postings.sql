create table job_postings (
  id bigint generated always as identity primary key,

  source text not null,
  source_job_id text not null,

  url text not null,
  apply_url text,

  title text not null,
  company text,
  location text,

  employment_type text,
  workplace_type text,

  salary_min numeric,
  salary_max numeric,
  salary_currency text,

  description text,

  posted_at timestamptz,
  discovered_at timestamptz default now(),

  status text not null default 'new',

  fit_score numeric,
  priority_score numeric,
  recommendation text,
  ai_reason text,
  ai_red_flags jsonb,

  raw_data jsonb,

  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  constraint job_postings_source_job_unique
    unique (source, source_job_id)
);

create index idx_job_postings_source
on job_postings(source);

create index idx_job_postings_posted
on job_postings(posted_at desc);

create index idx_job_postings_discovered
on job_postings(discovered_at desc);

create index idx_job_postings_status
on job_postings(status);

create index idx_job_postings_fit_score
on job_postings(fit_score desc);

create index idx_job_postings_priority_score
on job_postings(priority_score desc);

create index idx_job_postings_company
on job_postings(company);

create index idx_job_postings_title
on job_postings(title);


create table job_sources (
  id bigint generated always as identity primary key,

  name text not null unique,
  source_type text not null,

  enabled boolean not null default true,

  last_run_at timestamptz,
  last_success_at timestamptz,
  last_error_at timestamptz,

  last_error text,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

insert into job_sources (name, source_type)
values
  ('greenhouse', 'api'),
  ('lever', 'api'),
  ('ashby', 'api'),
  ('smartrecruiters', 'api'),
  ('recruitee', 'api'),
  ('bamboohr', 'api'),
  ('personio', 'api'),
  ('breezy', 'api'),
  ('workable', 'api'),
  ('workday', 'api');