-- Full-text search on blog posts
alter table blog_posts add column if not exists search_vector tsvector
  generated always as (
    to_tsvector('english', coalesce(title,'') || ' ' || coalesce(subtitle,'') || ' ' || coalesce(meta_description,''))
  ) stored;

create index if not exists blog_posts_search_idx on blog_posts using gin(search_vector);

-- Full-text search on recipes
alter table recipes add column if not exists search_vector tsvector
  generated always as (
    to_tsvector('english', coalesce(title,'') || ' ' || coalesce(description,''))
  ) stored;

create index if not exists recipes_search_idx on recipes using gin(search_vector);
