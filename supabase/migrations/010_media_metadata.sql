create table if not exists media_metadata (
  name text primary key,
  alt_text text not null default '',
  caption text not null default '',
  updated_at timestamptz default now()
);
