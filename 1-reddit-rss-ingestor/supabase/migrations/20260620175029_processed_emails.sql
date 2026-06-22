create table if not exists processed_emails (
    gmail_message_id text primary key,

    processed_at timestamptz not null default now()
);