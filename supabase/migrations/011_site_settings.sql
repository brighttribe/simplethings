-- site_settings table already exists as key/value store
-- ensure coming_soon key exists
insert into site_settings (key, value) values ('coming_soon', 'false')
on conflict (key) do nothing;
