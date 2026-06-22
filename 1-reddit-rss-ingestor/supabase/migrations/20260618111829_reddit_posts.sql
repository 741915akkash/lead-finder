create table reddit_posts (
  id bigint generated always as identity primary key,

  reddit_guid text unique,

  subreddit text,

  title text,

  url text,

  author text,

  published_at timestamptz,

  fetched_at timestamptz default now(),

  created_at timestamptz default now()
);

create index idx_reddit_posts_subreddit
on reddit_posts(subreddit);

create index idx_reddit_posts_published
on reddit_posts(published_at desc);