create table mood_boards (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  description text,
  image_url text,
  ltk_url text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  created_at timestamptz not null default now()
);

create table mood_board_hotspots (
  id uuid primary key default gen_random_uuid(),
  mood_board_id uuid not null references mood_boards(id) on delete cascade,
  position_x float not null,
  position_y float not null,
  sort_order int not null default 0,
  title text,
  retailer text,
  url text,
  created_at timestamptz not null default now()
);

create index on mood_board_hotspots(mood_board_id, sort_order);
