create table jobs (
  id bigint generated always as identity primary key,

  job_type text not null,

  payload jsonb not null,

  priority integer not null default 50,

  status text not null default 'pending',

  result jsonb,

  error text,

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now()
);

create index idx_jobs_status
on jobs(status);

create index idx_jobs_status_priority
on jobs(status, priority, created_at);