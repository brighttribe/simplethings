-- Add parent/child hierarchy and sort ordering to categories
alter table categories add column if not exists parent_id uuid references categories(id) on delete set null;
alter table categories add column if not exists sort_order int not null default 0;

-- Same for recipe categories
alter table recipe_categories add column if not exists parent_id uuid references recipe_categories(id) on delete set null;
alter table recipe_categories add column if not exists sort_order int not null default 0;
