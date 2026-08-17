create table jobs_2 (
  id bigint generated always as identity primary key,

  job_type text not null,

  payload jsonb not null,

  priority int not null default 0,

  status text not null default 'pending',

  result jsonb,

  error text,

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now()
);

create index idx_jobs_2_status_priority_created
on jobs_2(status, priority, created_at);

create index idx_jobs_2_job_type
on jobs_2(job_type);

create index idx_jobs_2_created
on jobs_2(created_at);