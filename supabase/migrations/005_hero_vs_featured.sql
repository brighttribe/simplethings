-- Separate hero (single top post) from featured (2-up below hero)
alter table blog_posts add column if not exists is_hero boolean not null default false;
