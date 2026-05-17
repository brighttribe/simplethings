alter table blog_posts add column if not exists is_featured boolean default false;
alter table blog_posts add column if not exists featured_order int;
