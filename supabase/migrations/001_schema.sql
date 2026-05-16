-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Categories (blog)
create table categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  description text,
  image_url text,
  created_at timestamptz default now()
);

-- Blog posts
create table blog_posts (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  subtitle text,
  slug text not null unique,
  content_html text,
  meta_title text,
  meta_description text,
  hero_image_url text,
  status text not null default 'draft' check (status in ('draft','scheduled','published')),
  published_at timestamptz,
  scheduled_at timestamptz,
  created_at timestamptz default now()
);

-- Blog tags
create table blog_tags (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  created_at timestamptz default now()
);

-- Blog post <-> category
create table blog_post_categories (
  post_id uuid references blog_posts(id) on delete cascade,
  category_id uuid references categories(id) on delete cascade,
  primary key (post_id, category_id)
);

-- Blog post <-> tag
create table blog_post_tags (
  post_id uuid references blog_posts(id) on delete cascade,
  tag_id uuid references blog_tags(id) on delete cascade,
  primary key (post_id, tag_id)
);

-- Recipe categories
create table recipe_categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  description text,
  image_url text,
  created_at timestamptz default now()
);

-- Recipes
create table recipes (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  slug text not null unique,
  description text,
  featured_image_url text,
  prep_time text,
  cook_time text,
  total_time text,
  servings text,
  ingredients jsonb not null default '[]',
  instructions jsonb not null default '[]',
  notes text,
  meta_title text,
  meta_description text,
  status text not null default 'draft' check (status in ('draft','published')),
  published_at timestamptz,
  created_at timestamptz default now()
);

-- Recipe <-> category
create table recipe_category_map (
  recipe_id uuid references recipes(id) on delete cascade,
  category_id uuid references recipe_categories(id) on delete cascade,
  primary key (recipe_id, category_id)
);

-- Contact form submissions
create table contact_submissions (
  id uuid primary key default uuid_generate_v4(),
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text,
  subject text,
  details text,
  created_at timestamptz default now()
);

-- Site settings (coming soon toggle, etc.)
create table site_settings (
  key text primary key,
  value text not null
);

insert into site_settings (key, value) values ('coming_soon', 'false');
