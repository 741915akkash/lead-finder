-- ==========================================
-- keyword_stats
-- ==========================================

create table if not exists keyword_stats (
  keyword text primary key,

  posts_count integer not null default 0,

  avg_score numeric(5,2),

  high_score_posts integer not null default 0,

  last_seen timestamptz,

  updated_at timestamptz not null default now()
);

create index if not exists idx_keyword_stats_avg_score
on keyword_stats(avg_score desc);


-- ==========================================
-- subreddit_stats
-- ==========================================

create table if not exists subreddit_stats (
  subreddit text primary key,

  posts_count integer not null default 0,

  avg_score numeric(5,2),

  high_score_posts integer not null default 0,

  last_seen timestamptz,

  updated_at timestamptz not null default now()
);

create index if not exists idx_subreddit_stats_avg_score
on subreddit_stats(avg_score desc);


-- ==========================================
-- pain_clusters
-- ==========================================

create table if not exists pain_clusters (
  id bigint generated always as identity primary key,

  name text not null unique,

  description text,

  posts_count integer not null default 0,

  avg_score numeric(5,2),

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now()
);

create index if not exists idx_pain_clusters_posts
on pain_clusters(posts_count desc);


-- ==========================================
-- icp_profiles
-- ==========================================

create table if not exists icp_profiles (
  id bigint generated always as identity primary key,

  name text not null unique,

  description text,

  posts_count integer not null default 0,

  avg_score numeric(5,2),

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now()
);

create index if not exists idx_icp_profiles_posts
on icp_profiles(posts_count desc);


-- ==========================================
-- post_analysis
-- ==========================================

create table if not exists post_analysis (
  reddit_post_id bigint primary key
    references reddit_posts(id)
    on delete cascade,

  pain_cluster_id bigint
    references pain_clusters(id)
    on delete set null,

  icp_profile_id bigint
    references icp_profiles(id)
    on delete set null,

  pain_cluster text,

  icp text,

  confidence integer,

  summary text,

  analyzed_at timestamptz not null default now()
);

create index if not exists idx_post_analysis_pain_cluster
on post_analysis(pain_cluster);

create index if not exists idx_post_analysis_icp
on post_analysis(icp);

create index if not exists idx_post_analysis_confidence
on post_analysis(confidence desc);