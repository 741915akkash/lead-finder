-- source metadata

alter table reddit_posts
add column if not exists source text;

alter table reddit_posts
add column if not exists keyword text;


-- scoring

alter table reddit_posts
add column if not exists score integer;

alter table reddit_posts
add column if not exists score_reason text;

alter table reddit_posts
add column if not exists scored_at timestamptz;


-- processing status

alter table reddit_posts
add column if not exists status text
default 'new';


-- useful indexes

create index if not exists idx_reddit_posts_status
on reddit_posts(status);

create index if not exists idx_reddit_posts_score
on reddit_posts(score desc);

create index if not exists idx_reddit_posts_source
on reddit_posts(source);

create index if not exists idx_reddit_posts_keyword
on reddit_posts(keyword);