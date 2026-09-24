alter table public.conversations
add column if not exists human_takeover boolean not null default false;
