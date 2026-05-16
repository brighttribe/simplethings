# Supabase Setup

## Steps

1. Go to [supabase.com](https://supabase.com) and create a new project called `simplethings`
2. Copy your Project URL, anon key, and service role key into `.env.local`
3. Go to **SQL Editor** and run `migrations/001_schema.sql` (paste and execute)
4. Go to **SQL Editor** and run `migrations/002_search_indexes.sql` (paste and execute)
5. Go to **Storage** → **New bucket** → name: `media` → Public: **yes**
6. In **SQL Editor**, run this to set storage permissions:

```sql
create policy "Public read media" on storage.objects
  for select using (bucket_id = 'media');

create policy "Auth upload media" on storage.objects
  for insert with check (bucket_id = 'media' and auth.role() = 'authenticated');
```

7. Go to **Authentication** → **Users** → **Invite user** → enter Holly's email
