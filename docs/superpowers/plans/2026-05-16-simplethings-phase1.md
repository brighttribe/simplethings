# Simple Things Made Beautiful — Phase 1: Foundation + Admin

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold the Next.js project, set up Supabase schema, implement admin auth, and build the full admin panel (post editor + recipe editor).

**Architecture:** Next.js 15 App Router with Supabase for database/auth/storage. Admin panel lives at `/admin`, protected by middleware. Post editor adapted directly from BrandBlueprint. Recipe editor is a new structured-fields editor.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS 4, Supabase, Vercel

---

## Task 1: Scaffold Project + Connect GitHub

**Files:**
- Create: `~/AI Sites/simplethings/` (entire project)

- [ ] **Step 1: Scaffold Next.js app**

```bash
cd ~/AI\ Sites
npx create-next-app@latest simplethings \
  --typescript \
  --tailwind \
  --app \
  --src-dir \
  --no-turbopack \
  --import-alias "@/*"
cd simplethings
```

- [ ] **Step 2: Init git + connect to GitHub**

```bash
git init
git remote add origin https://github.com/brighttribe/simp.git
git add .
git commit -m "feat: initial Next.js scaffold"
git branch -M main
git push -u origin main
```

- [ ] **Step 3: Install dependencies**

```bash
npm install @supabase/supabase-js @supabase/ssr
```

- [ ] **Step 4: Create `.env.local`**

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_GA_MEASUREMENT_ID=
INDEXNOW_API_KEY=
NEXT_PUBLIC_BEEHIIV_EMBED_URL=
```

- [ ] **Step 5: Set dev port to 3001 (ClarityLab uses 3000)**

In `package.json`, update the dev script:
```json
"dev": "next dev -p 3001"
```

- [ ] **Step 6: Verify dev server starts**

```bash
npm run dev
```
Expected: Site loads at http://localhost:3001

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json .env.local
git commit -m "feat: install supabase dependencies"
```

---

## Task 2: Supabase Schema

**Files:**
- Create: `supabase/migrations/001_schema.sql`

- [ ] **Step 1: Create Supabase project**

Go to supabase.com → New project → name it `simplethings`. Copy URL + anon key + service role key into `.env.local`.

- [ ] **Step 2: Create migration file**

Create `supabase/migrations/001_schema.sql`:

```sql
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
```

- [ ] **Step 3: Run migration in Supabase dashboard**

Go to Supabase → SQL Editor → paste and run the SQL above.

- [ ] **Step 4: Create full-text search indexes**

Run this in Supabase SQL Editor:

```sql
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
```

- [ ] **Step 5: Create Supabase storage bucket**

Go to Supabase → Storage → New bucket → name: `media` → Public: yes.

- [ ] **Step 6: Set bucket policy**

In Supabase SQL Editor:

```sql
create policy "Public read media" on storage.objects
  for select using (bucket_id = 'media');

create policy "Auth upload media" on storage.objects
  for insert with check (bucket_id = 'media' and auth.role() = 'authenticated');
```

- [ ] **Step 7: Commit**

```bash
git add supabase/
git commit -m "feat: add supabase schema and migrations"
```

---

## Task 3: Supabase Clients + Auth Helper + Types

**Files:**
- Create: `src/lib/supabase/server.ts`
- Create: `src/lib/supabase/client.ts`
- Create: `src/lib/supabase/service.ts`
- Create: `src/lib/auth.ts`
- Create: `src/lib/types.ts`
- Create: `src/lib/blog-utils.ts`

- [ ] **Step 1: Create server Supabase client**

`src/lib/supabase/server.ts`:

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}
```

- [ ] **Step 2: Create browser Supabase client**

`src/lib/supabase/client.ts`:

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Step 3: Create service role client**

`src/lib/supabase/service.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'

export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
```

- [ ] **Step 4: Create auth helper**

`src/lib/auth.ts`:

```typescript
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function requireAuth() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return user
}
```

- [ ] **Step 5: Create TypeScript types**

`src/lib/types.ts`:

```typescript
export type PostStatus = 'draft' | 'scheduled' | 'published'
export type RecipeStatus = 'draft' | 'published'

export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  image_url: string | null
  created_at: string
}

export interface BlogTag {
  id: string
  name: string
  slug: string
  created_at: string
}

export interface BlogPost {
  id: string
  title: string
  subtitle: string | null
  slug: string
  content_html: string | null
  meta_title: string | null
  meta_description: string | null
  hero_image_url: string | null
  status: PostStatus
  published_at: string | null
  scheduled_at: string | null
  created_at: string
  blog_post_tags?: { blog_tags: BlogTag | null }[]
  blog_post_categories?: { categories: Category | null }[]
}

export interface RecipeCategory {
  id: string
  name: string
  slug: string
  description: string | null
  image_url: string | null
  created_at: string
}

export interface Recipe {
  id: string
  title: string
  slug: string
  description: string | null
  featured_image_url: string | null
  prep_time: string | null
  cook_time: string | null
  total_time: string | null
  servings: string | null
  ingredients: string[]
  instructions: string[]
  notes: string | null
  meta_title: string | null
  meta_description: string | null
  status: RecipeStatus
  published_at: string | null
  created_at: string
  recipe_category_map?: { recipe_categories: RecipeCategory | null }[]
}

export interface ContactSubmission {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string | null
  subject: string | null
  details: string | null
  created_at: string
}
```

- [ ] **Step 6: Create blog utilities**

`src/lib/blog-utils.ts`:

```typescript
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}
```

- [ ] **Step 7: Commit**

```bash
git add src/lib/
git commit -m "feat: add supabase clients, auth helper, and types"
```

---

## Task 4: Middleware (Auth + Coming Soon)

**Files:**
- Create: `src/middleware.ts`

- [ ] **Step 1: Create middleware**

`src/middleware.ts`:

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  // Protect /admin routes
  if (pathname.startsWith('/admin') && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Redirect logged-in users away from /login
  if (pathname === '/login' && user) {
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
```

- [ ] **Step 2: Commit**

```bash
git add src/middleware.ts
git commit -m "feat: add auth + coming-soon middleware"
```

---

## Task 5: Login Page

**Files:**
- Create: `src/app/login/page.tsx`

- [ ] **Step 1: Create login page**

`src/app/login/page.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Invalid email or password.')
      setLoading(false)
      return
    }
    router.push('/admin')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Simple Things</h1>
        <p className="text-sm text-gray-500 mb-6">Sign in to manage your site</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create Holly's admin account**

Go to Supabase → Authentication → Users → Invite user → enter Holly's email. She'll set her password via email link.

- [ ] **Step 3: Test login**

Run `npm run dev`, go to http://localhost:3000/login. Sign in with Holly's credentials. Should redirect to `/admin`.

- [ ] **Step 4: Commit**

```bash
git add src/app/login/
git commit -m "feat: add login page with supabase auth"
```

---

## Task 6: Admin Layout + Sidebar

**Files:**
- Create: `src/app/admin/layout.tsx`
- Create: `src/components/layout/admin-sidebar.tsx`

- [ ] **Step 1: Create admin sidebar**

`src/components/layout/admin-sidebar.tsx`:

```tsx
'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const links = [
  { href: '/admin', label: 'Dashboard', exact: true },
  { href: '/admin/posts', label: 'Blog Posts' },
  { href: '/admin/recipes', label: 'Recipes' },
  { href: '/admin/categories', label: 'Blog Categories' },
  { href: '/admin/recipe-categories', label: 'Recipe Categories' },
  { href: '/admin/tags', label: 'Tags' },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="w-56 shrink-0 bg-white border-r border-gray-200 h-screen flex flex-col">
      <div className="px-5 py-5 border-b border-gray-100">
        <p className="text-sm font-bold text-gray-900">Simple Things</p>
        <p className="text-xs text-gray-400">Admin</p>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {links.map(link => {
          const active = link.exact ? pathname === link.href : pathname.startsWith(link.href)
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                active ? 'bg-stone-100 text-stone-900 font-medium' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              {link.label}
            </Link>
          )
        })}
      </nav>
      <div className="px-3 py-4 border-t border-gray-100">
        <a
          href="/"
          target="_blank"
          className="block px-3 py-2 text-sm text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition-colors"
        >
          View Site →
        </a>
        <button
          onClick={handleLogout}
          className="w-full text-left px-3 py-2 text-sm text-gray-500 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
        >
          Sign Out
        </button>
      </div>
    </aside>
  )
}
```

- [ ] **Step 2: Create admin layout**

`src/app/admin/layout.tsx`:

```tsx
import { requireAuth } from '@/lib/auth'
import AdminSidebar from '@/components/layout/admin-sidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAuth()
  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/layout.tsx src/components/layout/admin-sidebar.tsx
git commit -m "feat: add admin layout and sidebar"
```

---

## Task 7: Admin Dashboard

**Files:**
- Create: `src/app/admin/page.tsx`

- [ ] **Step 1: Create dashboard page**

`src/app/admin/page.tsx`:

```tsx
import { createServiceClient } from '@/lib/supabase/service'
import Link from 'next/link'

export default async function AdminDashboard() {
  const db = createServiceClient()

  const [postsRes, recipesRes, draftsRes] = await Promise.all([
    db.from('blog_posts').select('id', { count: 'exact', head: true }).eq('status', 'published'),
    db.from('recipes').select('id', { count: 'exact', head: true }).eq('status', 'published'),
    db.from('blog_posts').select('id', { count: 'exact', head: true }).eq('status', 'draft'),
  ])

  const stats = [
    { label: 'Published Posts', value: postsRes.count ?? 0 },
    { label: 'Published Recipes', value: recipesRes.count ?? 0 },
    { label: 'Draft Posts', value: draftsRes.count ?? 0 },
  ]

  const { data: recentPosts } = await db
    .from('blog_posts')
    .select('id, title, status, published_at, created_at')
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
        <div className="flex gap-2">
          <Link href="/admin/posts/new" className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-700 transition-colors">
            New Post
          </Link>
          <Link href="/admin/recipes/new" className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            New Recipe
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {stats.map(s => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-lg p-5">
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Recent Posts</h2>
        </div>
        <table className="w-full text-xs">
          <tbody className="divide-y divide-gray-100">
            {recentPosts?.map(post => (
              <tr key={post.id} className="hover:bg-gray-50">
                <td className="px-5 py-3 font-medium text-gray-900">{post.title}</td>
                <td className="px-5 py-3 text-gray-400 capitalize">{post.status}</td>
                <td className="px-5 py-3 text-gray-400">
                  {post.published_at ? new Date(post.published_at).toLocaleDateString() : '—'}
                </td>
                <td className="px-5 py-3 text-right">
                  <Link href={`/admin/posts/${post.id}/edit`} className="text-stone-600 hover:text-stone-900">Edit</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/admin/page.tsx
git commit -m "feat: add admin dashboard with stats and recent posts"
```

---

## Task 8: Image Upload API

**Files:**
- Create: `src/app/api/upload-image/route.ts`

- [ ] **Step 1: Create upload route**

`src/app/api/upload-image/route.ts`:

```typescript
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get('file') as File
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

  const ext = file.name.split('.').pop()
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const db = createServiceClient()
  const { error } = await db.storage.from('media').upload(filename, file, {
    contentType: file.type,
    upsert: false,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: { publicUrl } } = db.storage.from('media').getPublicUrl(filename)
  return NextResponse.json({ url: publicUrl })
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/upload-image/
git commit -m "feat: add image upload API route"
```

---

## Task 9: WYSIWYG Toolbar + Post Editor (adapted from BrandBlueprint)

**Files:**
- Create: `src/components/admin/wysiwyg-toolbar.tsx`
- Create: `src/components/admin/seo-panel.tsx`
- Create: `src/components/admin/post-editor.tsx`

- [ ] **Step 1: Copy and adapt toolbar from BrandBlueprint**

Copy `~/AI Sites/blueprintai/src/components/ui/wysiwyg-toolbar.tsx` to `src/components/admin/wysiwyg-toolbar.tsx`. Update the import path if needed. Remove any BB-specific references.

- [ ] **Step 2: Create SEO panel**

`src/components/admin/seo-panel.tsx`:

```tsx
'use client'

import type { PostStatus, Category, BlogTag } from '@/lib/types'

interface SeoPanelProps {
  metaTitle: string
  metaDescription: string
  heroImageUrl: string
  status: PostStatus
  scheduledAt: string
  publishedAt: string
  postTitle: string
  categories: Category[]
  selectedCategoryIds: string[]
  allTags: BlogTag[]
  selectedTagIds: string[]
  saving: boolean
  savedIndicator: boolean
  onMetaTitleChange: (v: string) => void
  onMetaDescriptionChange: (v: string) => void
  onHeroImageChange: (v: string) => void
  onStatusChange: (v: PostStatus) => void
  onScheduledAtChange: (v: string) => void
  onPublishedAtChange: (v: string) => void
  onCategoryToggle: (id: string) => void
  onTagToggle: (id: string) => void
  onTagCreate: (tag: BlogTag) => void
  onSave: () => void
  onPublish: () => void
}

export default function SeoPanel({
  metaTitle, metaDescription, heroImageUrl, status, scheduledAt, publishedAt,
  postTitle, categories, selectedCategoryIds, allTags, selectedTagIds,
  saving, savedIndicator,
  onMetaTitleChange, onMetaDescriptionChange, onHeroImageChange,
  onStatusChange, onScheduledAtChange, onPublishedAtChange,
  onCategoryToggle, onTagToggle, onTagCreate, onSave, onPublish,
}: SeoPanelProps) {
  return (
    <div className="w-72 shrink-0 space-y-4">
      {/* Actions */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-2">
        <div className="flex gap-2">
          <button
            onClick={onSave}
            disabled={saving}
            className="flex-1 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {savedIndicator ? 'Saved!' : saving ? 'Saving...' : 'Save Draft'}
          </button>
          <button
            onClick={onPublish}
            disabled={saving}
            className="flex-1 py-2 text-xs font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            Publish
          </button>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Status</label>
          <select
            value={status}
            onChange={e => onStatusChange(e.target.value as PostStatus)}
            className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none"
          >
            <option value="draft">Draft</option>
            <option value="scheduled">Scheduled</option>
            <option value="published">Published</option>
          </select>
        </div>
        {status === 'published' && (
          <div>
            <label className="block text-xs text-gray-500 mb-1">Publish Date</label>
            <input type="datetime-local" value={publishedAt}
              onChange={e => onPublishedAtChange(e.target.value)}
              className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none" />
          </div>
        )}
        {status === 'scheduled' && (
          <div>
            <label className="block text-xs text-gray-500 mb-1">Schedule For</label>
            <input type="datetime-local" value={scheduledAt}
              onChange={e => onScheduledAtChange(e.target.value)}
              className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none" />
          </div>
        )}
      </div>

      {/* Featured Image */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <label className="block text-xs font-medium text-gray-700 mb-2">Featured Image</label>
        <input
          type="text"
          value={heroImageUrl}
          onChange={e => onHeroImageChange(e.target.value)}
          placeholder="Image URL"
          className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none mb-2"
        />
        {heroImageUrl && (
          <img src={heroImageUrl} alt="" className="w-full rounded-lg object-cover aspect-video" />
        )}
      </div>

      {/* SEO */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
        <p className="text-xs font-medium text-gray-700">SEO</p>
        <div>
          <label className="block text-xs text-gray-500 mb-1">
            Meta Title <span className="text-gray-400">({metaTitle.length}/60)</span>
          </label>
          <input
            type="text"
            value={metaTitle}
            onChange={e => onMetaTitleChange(e.target.value)}
            maxLength={60}
            className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">
            Meta Description <span className="text-gray-400">({metaDescription.length}/160)</span>
          </label>
          <textarea
            value={metaDescription}
            onChange={e => onMetaDescriptionChange(e.target.value)}
            maxLength={160}
            rows={3}
            className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none resize-none"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <p className="text-xs font-medium text-gray-700 mb-2">Categories</p>
        <div className="space-y-1.5">
          {categories.map(cat => (
            <label key={cat.id} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedCategoryIds.includes(cat.id)}
                onChange={() => onCategoryToggle(cat.id)}
                className="rounded"
              />
              <span className="text-xs text-gray-700">{cat.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <p className="text-xs font-medium text-gray-700 mb-2">Tags</p>
        <div className="flex flex-wrap gap-1.5">
          {allTags.map(tag => (
            <button
              key={tag.id}
              onClick={() => onTagToggle(tag.id)}
              className={`px-2 py-1 rounded-full text-xs transition-colors ${
                selectedTagIds.includes(tag.id)
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tag.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create post editor**

`src/components/admin/post-editor.tsx` — adapt from `~/AI Sites/blueprintai/src/components/site-manager/post-editor.tsx`. Key changes:
- Remove `revisionInstructions`, `revising`, `handleRevise`, `showRevisionBar` (no AI revision)
- Remove `imageScene`, `primaryKeyword` fields
- Add `selectedCategoryIds` + `onCategoryToggle` + `categories` props threaded through to SeoPanel
- Change import paths from `@/components/ui/wysiwyg-toolbar` → `@/components/admin/wysiwyg-toolbar`
- Change import paths from `./seo-panel` → `@/components/admin/seo-panel`
- Update fetch URLs from `/api/blog/posts/` → `/api/posts/`
- Update fetch URLs from `/api/blog/tags` → `/api/tags`
- Update fetch URL from `/api/blog/upload-image` → `/api/upload-image`
- After publish, redirect to `/admin/posts` instead of `/admin/site/blog/posts`

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/
git commit -m "feat: add wysiwyg toolbar, seo panel, and post editor"
```

---

## Task 10: Blog Posts API

**Files:**
- Create: `src/app/api/posts/route.ts`
- Create: `src/app/api/posts/[id]/route.ts`
- Create: `src/app/api/posts/[id]/tags/route.ts`
- Create: `src/app/api/posts/[id]/categories/route.ts`
- Create: `src/app/api/tags/route.ts`

- [ ] **Step 1: Posts list + create**

`src/app/api/posts/route.ts`:

```typescript
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'
import { generateSlug } from '@/lib/blog-utils'

export async function GET() {
  const db = createServiceClient()
  const { data, error } = await db
    .from('blog_posts')
    .select('id, title, slug, status, published_at, created_at')
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = createServiceClient()
  const slug = generateSlug(`new-post-${Date.now()}`)
  const { data, error } = await db
    .from('blog_posts')
    .insert({ title: 'New Post', slug, status: 'draft' })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
```

- [ ] **Step 2: Post get + update + delete**

`src/app/api/posts/[id]/route.ts`:

```typescript
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = createServiceClient()
  const { data, error } = await db
    .from('blog_posts')
    .select('*, blog_post_tags(blog_tags(id, name, slug)), blog_post_categories(categories(id, name, slug))')
    .eq('id', id)
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json(data)
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const db = createServiceClient()

  // Check slug uniqueness
  if (body.slug) {
    const { data: existing } = await db.from('blog_posts').select('id').eq('slug', body.slug).neq('id', id).maybeSingle()
    if (existing) return NextResponse.json({ error: 'Slug already in use' }, { status: 409 })
  }

  const { data, error } = await db.from('blog_posts').update(body).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = createServiceClient()
  const { error } = await db.from('blog_posts').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 3: Post tags API**

`src/app/api/posts/[id]/tags/route.ts`:

```typescript
import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = createServiceClient()
  const { data } = await db.from('blog_post_tags').select('blog_tags(*)').eq('post_id', id)
  return NextResponse.json(data?.map(r => r.blog_tags).filter(Boolean) ?? [])
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { tag_ids } = await request.json()
  const db = createServiceClient()
  await db.from('blog_post_tags').delete().eq('post_id', id)
  if (tag_ids?.length) {
    await db.from('blog_post_tags').insert(tag_ids.map((tag_id: string) => ({ post_id: id, tag_id })))
  }
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 4: Post categories API**

`src/app/api/posts/[id]/categories/route.ts`:

```typescript
import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { category_ids } = await request.json()
  const db = createServiceClient()
  await db.from('blog_post_categories').delete().eq('post_id', id)
  if (category_ids?.length) {
    await db.from('blog_post_categories').insert(
      category_ids.map((category_id: string) => ({ post_id: id, category_id }))
    )
  }
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 5: Tags CRUD API**

`src/app/api/tags/route.ts`:

```typescript
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'
import { generateSlug } from '@/lib/blog-utils'

export async function GET() {
  const db = createServiceClient()
  const { data } = await db.from('blog_tags').select('*').order('name')
  return NextResponse.json(data ?? [])
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name } = await request.json()
  const db = createServiceClient()
  const { data, error } = await db.from('blog_tags').insert({ name, slug: generateSlug(name) }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
```

- [ ] **Step 6: Commit**

```bash
git add src/app/api/posts/ src/app/api/tags/
git commit -m "feat: add blog posts and tags API routes"
```

---

## Task 11: Admin Posts Pages

**Files:**
- Create: `src/app/admin/posts/page.tsx`
- Create: `src/app/admin/posts/new/page.tsx`
- Create: `src/app/admin/posts/[id]/edit/page.tsx`

- [ ] **Step 1: Posts list page**

`src/app/admin/posts/page.tsx`:

```tsx
import { createServiceClient } from '@/lib/supabase/service'
import { requireAuth } from '@/lib/auth'
import Link from 'next/link'

export default async function PostsPage() {
  await requireAuth()
  const db = createServiceClient()
  const { data: posts } = await db
    .from('blog_posts')
    .select('id, title, status, published_at, created_at')
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Blog Posts</h1>
        <Link href="/admin/posts/new" className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-700 transition-colors">
          New Post
        </Link>
      </div>
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-xs">
          <thead className="border-b border-gray-100 bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Title</th>
              <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Status</th>
              <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Date</th>
              <th className="text-right px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {posts?.map(post => (
              <tr key={post.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-2.5 font-medium text-gray-900">{post.title}</td>
                <td className="px-4 py-2.5 capitalize text-gray-500">{post.status}</td>
                <td className="px-4 py-2.5 text-gray-400">
                  {post.published_at ? new Date(post.published_at).toLocaleDateString() : '—'}
                </td>
                <td className="px-4 py-2.5 text-right">
                  <Link href={`/admin/posts/${post.id}/edit`} className="text-stone-600 hover:text-stone-900 font-medium">Edit</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: New post page (create + redirect to editor)**

`src/app/admin/posts/new/page.tsx`:

```tsx
import { requireAuth } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import { generateSlug } from '@/lib/blog-utils'

export default async function NewPostPage() {
  await requireAuth()
  const db = createServiceClient()
  const slug = generateSlug(`draft-${Date.now()}`)
  const { data } = await db
    .from('blog_posts')
    .insert({ title: 'New Post', slug, status: 'draft' })
    .select()
    .single()
  if (data) redirect(`/admin/posts/${data.id}/edit`)
  redirect('/admin/posts')
}
```

- [ ] **Step 3: Edit post page**

`src/app/admin/posts/[id]/edit/page.tsx`:

```tsx
import { requireAuth } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/service'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import PostEditor from '@/components/admin/post-editor'
import type { BlogPost, Category } from '@/lib/types'

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await requireAuth()
  const db = createServiceClient()

  const [{ data: post }, { data: categories }] = await Promise.all([
    db.from('blog_posts')
      .select('*, blog_post_tags(blog_tags(id, name, slug)), blog_post_categories(categories(id, name, slug))')
      .eq('id', id)
      .single(),
    db.from('categories').select('*').order('name'),
  ])

  if (!post) notFound()

  return (
    <Suspense>
      <PostEditor post={post as BlogPost} categories={(categories ?? []) as Category[]} />
    </Suspense>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/admin/posts/
git commit -m "feat: add admin posts list, new, and edit pages"
```

---

## Task 12: Categories + Tags Admin Pages

**Files:**
- Create: `src/app/admin/categories/page.tsx`
- Create: `src/app/admin/tags/page.tsx`
- Create: `src/app/api/categories/route.ts`

- [ ] **Step 1: Categories API**

`src/app/api/categories/route.ts`:

```typescript
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'
import { generateSlug } from '@/lib/blog-utils'

export async function GET() {
  const db = createServiceClient()
  const { data } = await db.from('categories').select('*').order('name')
  return NextResponse.json(data ?? [])
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name } = await request.json()
  const db = createServiceClient()
  const { data, error } = await db.from('categories').insert({ name, slug: generateSlug(name) }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await request.json()
  const db = createServiceClient()
  await db.from('categories').delete().eq('id', id)
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2: Categories admin page**

`src/app/admin/categories/page.tsx`:

```tsx
'use client'

import { useState, useEffect } from 'react'

interface Category { id: string; name: string; slug: string }

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)

  async function load() {
    const res = await fetch('/api/categories')
    setCategories(await res.json())
  }

  useEffect(() => { load() }, [])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    setName('')
    setSaving(false)
    load()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this category?')) return
    await fetch('/api/categories', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    load()
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Blog Categories</h1>
      <form onSubmit={handleAdd} className="flex gap-2 mb-6">
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Category name"
          className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400"
        />
        <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50">
          Add
        </button>
      </form>
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-xs">
          <thead className="border-b border-gray-100 bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Name</th>
              <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Slug</th>
              <th className="text-right px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {categories.map(cat => (
              <tr key={cat.id} className="hover:bg-gray-50">
                <td className="px-4 py-2.5 font-medium text-gray-900">{cat.name}</td>
                <td className="px-4 py-2.5 text-gray-400">{cat.slug}</td>
                <td className="px-4 py-2.5 text-right">
                  <button onClick={() => handleDelete(cat.id)} className="text-red-500 hover:text-red-700 text-xs">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Tags admin page** — same pattern as Categories page but fetches `/api/tags` and uses DELETE on `/api/tags` (add DELETE handler to `src/app/api/tags/route.ts`):

```typescript
// Add to src/app/api/tags/route.ts
export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await request.json()
  const db = createServiceClient()
  await db.from('blog_tags').delete().eq('id', id)
  return NextResponse.json({ ok: true })
}
```

`src/app/admin/tags/page.tsx` — identical structure to categories page, replace "Category" with "Tag", use `/api/tags` endpoint.

- [ ] **Step 4: Commit**

```bash
git add src/app/admin/categories/ src/app/admin/tags/ src/app/api/categories/ src/app/api/tags/
git commit -m "feat: add categories and tags admin pages"
```

---

## Task 13: Recipes API + Admin Pages

**Files:**
- Create: `src/app/api/recipes/route.ts`
- Create: `src/app/api/recipes/[id]/route.ts`
- Create: `src/app/api/recipe-categories/route.ts`
- Create: `src/components/admin/recipe-editor.tsx`
- Create: `src/app/admin/recipes/page.tsx`
- Create: `src/app/admin/recipes/new/page.tsx`
- Create: `src/app/admin/recipes/[id]/edit/page.tsx`
- Create: `src/app/admin/recipe-categories/page.tsx`

- [ ] **Step 1: Recipes API**

`src/app/api/recipes/route.ts`:

```typescript
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'
import { generateSlug } from '@/lib/blog-utils'

export async function GET() {
  const db = createServiceClient()
  const { data } = await db.from('recipes').select('id, title, slug, status, published_at, created_at').order('created_at', { ascending: false })
  return NextResponse.json(data ?? [])
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = createServiceClient()
  const slug = generateSlug(`new-recipe-${Date.now()}`)
  const { data, error } = await db.from('recipes').insert({ title: 'New Recipe', slug, status: 'draft', ingredients: [], instructions: [] }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
```

`src/app/api/recipes/[id]/route.ts` — same structure as posts `[id]/route.ts` but references `recipes` table and no slug uniqueness needed for initial version:

```typescript
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = createServiceClient()
  const { data, error } = await db.from('recipes').select('*, recipe_category_map(recipe_categories(id, name, slug))').eq('id', id).single()
  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json(data)
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()

  // Handle categories separately
  const { category_ids, ...recipeData } = body
  const db = createServiceClient()
  const { data, error } = await db.from('recipes').update(recipeData).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (category_ids !== undefined) {
    await db.from('recipe_category_map').delete().eq('recipe_id', id)
    if (category_ids.length > 0) {
      await db.from('recipe_category_map').insert(category_ids.map((category_id: string) => ({ recipe_id: id, category_id })))
    }
  }

  return NextResponse.json(data)
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = createServiceClient()
  await db.from('recipes').delete().eq('id', id)
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2: Recipe categories API**

`src/app/api/recipe-categories/route.ts` — same as `categories/route.ts` but uses `recipe_categories` table.

- [ ] **Step 3: Recipe editor component**

`src/components/admin/recipe-editor.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Recipe, RecipeCategory, RecipeStatus } from '@/lib/types'
import { generateSlug } from '@/lib/blog-utils'

interface RecipeEditorProps {
  recipe: Recipe
  categories: RecipeCategory[]
}

export default function RecipeEditor({ recipe, categories }: RecipeEditorProps) {
  const router = useRouter()
  const [title, setTitle] = useState(recipe.title)
  const [slug, setSlug] = useState(recipe.slug)
  const [slugEdited, setSlugEdited] = useState(false)
  const [description, setDescription] = useState(recipe.description ?? '')
  const [featuredImageUrl, setFeaturedImageUrl] = useState(recipe.featured_image_url ?? '')
  const [prepTime, setPrepTime] = useState(recipe.prep_time ?? '')
  const [cookTime, setCookTime] = useState(recipe.cook_time ?? '')
  const [totalTime, setTotalTime] = useState(recipe.total_time ?? '')
  const [servings, setServings] = useState(recipe.servings ?? '')
  const [ingredients, setIngredients] = useState<string[]>(recipe.ingredients.length ? recipe.ingredients : [''])
  const [instructions, setInstructions] = useState<string[]>(recipe.instructions.length ? recipe.instructions : [''])
  const [notes, setNotes] = useState(recipe.notes ?? '')
  const [metaTitle, setMetaTitle] = useState(recipe.meta_title ?? '')
  const [metaDescription, setMetaDescription] = useState(recipe.meta_description ?? '')
  const [status, setStatus] = useState<RecipeStatus>(recipe.status)
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(
    (recipe.recipe_category_map ?? []).flatMap(r => r.recipe_categories ? [r.recipe_categories.id] : [])
  )
  const [saving, setSaving] = useState(false)
  const [savedIndicator, setSavedIndicator] = useState(false)

  function handleTitleChange(v: string) {
    setTitle(v)
    if (!slugEdited) setSlug(generateSlug(v))
    if (!metaTitle) setMetaTitle(v.slice(0, 60))
  }

  function toggleCategory(id: string) {
    setSelectedCategoryIds(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id])
  }

  async function save(overrides: Record<string, unknown> = {}) {
    setSaving(true)
    const res = await fetch(`/api/recipes/${recipe.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title, slug, description: description || null,
        featured_image_url: featuredImageUrl || null,
        prep_time: prepTime || null, cook_time: cookTime || null,
        total_time: totalTime || null, servings: servings || null,
        ingredients, instructions, notes: notes || null,
        meta_title: metaTitle || null, meta_description: metaDescription || null,
        status, category_ids: selectedCategoryIds,
        ...overrides,
      }),
    })
    setSaving(false)
    return res
  }

  async function handleSave() {
    const res = await save()
    if (res.ok) { setSavedIndicator(true); setTimeout(() => setSavedIndicator(false), 2500); router.refresh() }
  }

  async function handlePublish() {
    const res = await save({ status: 'published', published_at: new Date().toISOString() })
    if (res.ok) router.push('/admin/recipes')
  }

  function updateIngredient(i: number, v: string) {
    setIngredients(prev => prev.map((ing, idx) => idx === i ? v : ing))
  }
  function addIngredient() { setIngredients(prev => [...prev, '']) }
  function removeIngredient(i: number) { setIngredients(prev => prev.filter((_, idx) => idx !== i)) }

  function updateInstruction(i: number, v: string) {
    setInstructions(prev => prev.map((ins, idx) => idx === i ? v : ins))
  }
  function addInstruction() { setInstructions(prev => [...prev, '']) }
  function removeInstruction(i: number) { setInstructions(prev => prev.filter((_, idx) => idx !== i)) }

  const inputClass = "w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-300"
  const labelClass = "block text-xs font-medium text-gray-600 mb-1"

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Edit Recipe</h1>
        <div className="flex gap-2">
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50">
            {savedIndicator ? 'Saved!' : saving ? 'Saving...' : 'Save Draft'}
          </button>
          <button onClick={handlePublish} disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-700 disabled:opacity-50">
            Publish
          </button>
        </div>
      </div>

      <div className="flex gap-6 items-start">
        {/* Main fields */}
        <div className="flex-1 space-y-5">
          <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
            <div>
              <label className={labelClass}>Title</label>
              <input type="text" value={title} onChange={e => handleTitleChange(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>URL Slug</label>
              <input type="text" value={slug}
                onChange={e => { setSlugEdited(true); setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')) }}
                className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className={inputClass + ' resize-none'} />
            </div>
            <div>
              <label className={labelClass}>Featured Image URL</label>
              <input type="text" value={featuredImageUrl} onChange={e => setFeaturedImageUrl(e.target.value)} className={inputClass} />
              {featuredImageUrl && <img src={featuredImageUrl} alt="" className="mt-2 w-full rounded-lg object-cover aspect-video" />}
            </div>
          </div>

          {/* Times + servings */}
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <p className="text-sm font-medium text-gray-900 mb-4">Details</p>
            <div className="grid grid-cols-2 gap-4">
              {[
                ['Prep Time', prepTime, setPrepTime],
                ['Cook Time', cookTime, setCookTime],
                ['Total Time', totalTime, setTotalTime],
                ['Servings', servings, setServings],
              ].map(([label, value, setter]) => (
                <div key={label as string}>
                  <label className={labelClass}>{label as string}</label>
                  <input type="text" value={value as string} onChange={e => (setter as (v: string) => void)(e.target.value)}
                    placeholder={label === 'Servings' ? 'e.g. 4' : 'e.g. 15 minutes'}
                    className={inputClass} />
                </div>
              ))}
            </div>
          </div>

          {/* Ingredients */}
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <p className="text-sm font-medium text-gray-900 mb-4">Ingredients</p>
            <div className="space-y-2">
              {ingredients.map((ing, i) => (
                <div key={i} className="flex gap-2">
                  <input type="text" value={ing} onChange={e => updateIngredient(i, e.target.value)}
                    placeholder={`Ingredient ${i + 1}`} className={inputClass} />
                  <button onClick={() => removeIngredient(i)} className="px-2 text-gray-400 hover:text-red-500">✕</button>
                </div>
              ))}
            </div>
            <button onClick={addIngredient} className="mt-3 text-sm text-stone-600 hover:text-stone-900">+ Add ingredient</button>
          </div>

          {/* Instructions */}
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <p className="text-sm font-medium text-gray-900 mb-4">Instructions</p>
            <div className="space-y-3">
              {instructions.map((ins, i) => (
                <div key={i} className="flex gap-2">
                  <span className="mt-2 text-xs font-bold text-gray-400 w-5 shrink-0">{i + 1}.</span>
                  <textarea value={ins} onChange={e => updateInstruction(i, e.target.value)}
                    rows={2} placeholder={`Step ${i + 1}`} className={inputClass + ' resize-none flex-1'} />
                  <button onClick={() => removeInstruction(i)} className="mt-2 px-2 text-gray-400 hover:text-red-500">✕</button>
                </div>
              ))}
            </div>
            <button onClick={addInstruction} className="mt-3 text-sm text-stone-600 hover:text-stone-900">+ Add step</button>
          </div>

          {/* Notes */}
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <label className={labelClass}>Notes / Tips (optional)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4} className={inputClass + ' resize-none'} />
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-72 shrink-0 space-y-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <label className={labelClass}>Status</label>
            <select value={status} onChange={e => setStatus(e.target.value as RecipeStatus)} className={inputClass}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
            <p className="text-xs font-medium text-gray-700">SEO</p>
            <div>
              <label className={labelClass}>Meta Title ({metaTitle.length}/60)</label>
              <input type="text" value={metaTitle} onChange={e => setMetaTitle(e.target.value)} maxLength={60} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Meta Description ({metaDescription.length}/160)</label>
              <textarea value={metaDescription} onChange={e => setMetaDescription(e.target.value)} maxLength={160} rows={3} className={inputClass + ' resize-none'} />
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-xs font-medium text-gray-700 mb-2">Categories</p>
            <div className="space-y-1.5">
              {categories.map(cat => (
                <label key={cat.id} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={selectedCategoryIds.includes(cat.id)} onChange={() => toggleCategory(cat.id)} className="rounded" />
                  <span className="text-xs text-gray-700">{cat.name}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Admin recipes pages**

`src/app/admin/recipes/page.tsx` — same structure as posts list page but uses recipes data and links.

`src/app/admin/recipes/new/page.tsx`:
```tsx
import { requireAuth } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import { generateSlug } from '@/lib/blog-utils'

export default async function NewRecipePage() {
  await requireAuth()
  const db = createServiceClient()
  const slug = generateSlug(`draft-recipe-${Date.now()}`)
  const { data } = await db.from('recipes').insert({ title: 'New Recipe', slug, status: 'draft', ingredients: [], instructions: [] }).select().single()
  if (data) redirect(`/admin/recipes/${data.id}/edit`)
  redirect('/admin/recipes')
}
```

`src/app/admin/recipes/[id]/edit/page.tsx`:
```tsx
import { requireAuth } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/service'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import RecipeEditor from '@/components/admin/recipe-editor'
import type { Recipe, RecipeCategory } from '@/lib/types'

export default async function EditRecipePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await requireAuth()
  const db = createServiceClient()
  const [{ data: recipe }, { data: categories }] = await Promise.all([
    db.from('recipes').select('*, recipe_category_map(recipe_categories(id, name, slug))').eq('id', id).single(),
    db.from('recipe_categories').select('*').order('name'),
  ])
  if (!recipe) notFound()
  return <Suspense><RecipeEditor recipe={recipe as Recipe} categories={(categories ?? []) as RecipeCategory[]} /></Suspense>
}
```

`src/app/admin/recipe-categories/page.tsx` — same as blog categories page but uses `/api/recipe-categories`.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/recipes/ src/app/api/recipe-categories/ src/components/admin/recipe-editor.tsx src/app/admin/recipes/ src/app/admin/recipe-categories/
git commit -m "feat: add recipes API, recipe editor, and admin pages"
```

---

## Task 14: Search API

**Files:**
- Create: `src/app/api/search/route.ts`

- [ ] **Step 1: Create search route**

`src/app/api/search/route.ts`:

```typescript
import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim() ?? ''
  if (!q) return NextResponse.json({ posts: [], recipes: [] })

  const db = createServiceClient()
  const tsQuery = q.split(/\s+/).filter(Boolean).join(' & ')

  const [postsRes, recipesRes] = await Promise.all([
    db.from('blog_posts')
      .select('id, title, slug, hero_image_url, published_at, meta_description')
      .eq('status', 'published')
      .textSearch('search_vector', tsQuery, { type: 'websearch' })
      .limit(10),
    db.from('recipes')
      .select('id, title, slug, featured_image_url, published_at, description')
      .eq('status', 'published')
      .textSearch('search_vector', tsQuery, { type: 'websearch' })
      .limit(10),
  ])

  return NextResponse.json({
    posts: postsRes.data ?? [],
    recipes: recipesRes.data ?? [],
  })
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/search/
git commit -m "feat: add full-text search API"
```

---

**End of Phase 1 Plan**

Phase 2 covers the public-facing site (all pages matching the Inkcraft mockups).
Phase 3 covers integrations (GA4, IndexNow, Beehiiv, sitemap, JSON-LD, social sharing).
