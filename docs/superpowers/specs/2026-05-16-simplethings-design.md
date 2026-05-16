# Simple Things Made Beautiful — Design Spec
**Date:** 2026-05-16
**Project:** Holly's lifestyle blog and recipe site
**Folder:** `~/AI Sites/simplethings/`
**GitHub:** https://github.com/brighttribe/simp

---

## Overview

A personal lifestyle blog and recipe site for Holly Dempsey. Clean, minimal, image-heavy design based on the Inkcraft theme from Envato. Two content types: blog posts and recipes. Admin panel for Holly to write and publish content herself.

---

## Tech Stack

- **Framework:** Next.js 15 / React 19 / TypeScript
- **Styling:** Tailwind CSS
- **Database + Auth + Storage:** Supabase
- **Hosting:** Vercel (connected to `brighttribe/simp`)
- **Newsletter:** Beehiiv (embed placeholder — wire up later)
- **Analytics:** Google Analytics 4
- **Search indexing:** IndexNow (ping on every post/recipe publish)
- **No AI, no Stripe, no PDF**

---

## Public Site

### Navigation
- Logo (left) + nav links + search icon + social icons (right)
- Nav items: Home, Lifestyle, Travel, About Me, Recipes, Contact
- Categories (Lifestyle, Travel, Second Brain, Productivity, Culture, Finance) accessible via nav or dropdown
- Predictive search: debounced dropdown appears as Holly types, searches posts + recipes simultaneously

### Pages

#### Home (`/`)
- Hero image slider (featured posts)
- Beehiiv newsletter strip (name + email)
- Featured Posts section (4-column grid)
- Lifestyle section (mixed large + small grid layout) with "View All" link
- Travel section (large + grid layout) with "View All" link
- Latest Posts (2-column + sidebar)
- Sidebar: author bio card, recent posts, categories
- Category photo blocks at bottom
- Instagram-style photo strip before footer (static/manual images)

#### Single Post (`/blog/[slug]`)
- Breadcrumb (category > post title)
- Featured image full-width
- Title, author, date
- Article body (rich HTML from WYSIWYG editor)
- Inline images, pull quotes
- Social sharing buttons (Facebook, Twitter, LinkedIn, WhatsApp)
- Related posts (4-column)
- No comments
- JSON-LD Article schema auto-generated

#### Category Archive (`/category/[slug]`)
- Page title (category name)
- 2-column post grid + sidebar
- Sidebar: author bio, recent posts, categories
- Pagination

#### Tag Archive (`/tag/[slug]`)
- Page title ("Tag: [name]")
- 4-column post grid
- Pagination

#### Recipes Listing (`/recipes`)
- Page title
- Grid layout of recipe cards (image, title, category, times)
- Filter by recipe category

#### Single Recipe (`/recipes/[slug]`)
- Featured image
- Title, description
- Meta bar: prep time, cook time, total time, servings
- Ingredients list (formatted)
- Instructions (numbered steps)
- Notes/tips section (optional)
- Print button
- Social sharing
- Related recipes
- JSON-LD Recipe schema auto-generated

#### Recipe Category Archive (`/recipes/category/[slug]`)
- Grid of recipe cards filtered by category

#### About Me (`/about`)
- Hero photo + bio text
- Stats counters (posts published, years blogging, etc.)
- Signature graphic
- Pull quote block
- Biography timeline
- Photo grid
- Category blocks (image + label)
- Newsletter strip

#### Contact (`/contact`)
- Heading + intro text
- Contact form: first name, last name, email, phone, subject, details, submit
- Submissions stored in Supabase `contact_submissions` table; Holly reviews from admin
- Sidebar: author photo, bio, social links, contact info

#### Search (`/search?q=`)
- Search bar at top (pre-filled with query)
- Results: posts + recipes combined
- 3-column grid (title, author/type, date)
- Predictive dropdown in nav header (debounced, live results)
- Pagination

#### Coming Soon (`/coming-soon`)
- Logo + circular author photo
- Tagline
- Countdown timer (days, hours, minutes, seconds)
- Social links + contact info
- Togglable from admin

### Global Footer
- Instagram photo strip (static images, links to Instagram)
- Dark section: logo, nav links (Disclaimer, Cookie Policy, Privacy Policy)
- Social icons row
- Copyright

---

## Admin Panel (`/admin`)

### Auth
- Simple email/password login via Supabase auth
- Single user (Holly) — no roles, no signup
- Protected all `/admin` routes, redirect to `/login` if not authenticated

### Dashboard
- Quick stats: total posts, total recipes, drafts pending
- Recent posts list
- Quick links to new post, new recipe
- Coming Soon toggle (on/off switch — redirects all public traffic to `/coming-soon` when enabled)

### Blog Posts

**Posts List (`/admin/posts`)**
- Table: title, category, status (draft/scheduled/published), published date, actions (edit, delete)
- Filter by status
- "New Post" button

**Post Editor (`/admin/posts/new` and `/admin/posts/[id]/edit`)**
Reused directly from BrandBlueprint — adapted without AI revision features:
- Title input (auto-generates slug + pre-fills meta title)
- Subtitle input
- WYSIWYG body editor (contenteditable, custom toolbar)
  - Bold, italic, underline, strikethrough
  - H2, H3, H4
  - Ordered + unordered lists
  - Blockquote
  - Insert image (uploads to Supabase storage)
  - Insert/remove link (with hover tooltip)
  - Code view (raw HTML, dark terminal style)
- SEO panel (right sidebar):
  - Meta title (with character counter)
  - Meta description (with character counter)
  - Featured image upload
  - URL slug (editable)
  - Status: Draft / Scheduled / Published
  - Publish date picker
  - Categories (checkboxes)
  - Tags (select existing or create new inline)
  - Save / Publish buttons
- "View Live" link when published

### Recipes

**Recipes List (`/admin/recipes`)**
- Table: title, category, status, published date, actions
- "New Recipe" button

**Recipe Editor (`/admin/recipes/new` and `/admin/recipes/[id]/edit`)**
- Title
- Featured image upload
- Description (short textarea)
- Prep time, cook time, total time (text fields, e.g. "15 minutes")
- Servings (number)
- Ingredients (dynamic list — add/remove rows, each row is one ingredient)
- Instructions (dynamic numbered steps — add/remove, textarea per step)
- Notes/tips (optional textarea)
- Recipe categories (checkboxes)
- Meta title + meta description
- URL slug
- Status: Draft / Published
- Save / Publish buttons

### Categories

**Blog Categories (`/admin/categories`)**
- List: name, slug, post count, actions
- Create/edit/delete
- Each category has: name, slug, description (optional), cover image (optional)

**Recipe Categories (`/admin/recipe-categories`)**
- Same structure as blog categories

### Tags (`/admin/tags`)
- List: name, slug, post count
- Create/edit/delete (tags are blog-posts only)

---

## Database Schema

### `blog_posts`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| title | text | |
| subtitle | text | nullable |
| slug | text | unique |
| content_html | text | |
| meta_title | text | nullable |
| meta_description | text | nullable |
| hero_image_url | text | nullable |
| status | enum | draft, scheduled, published |
| published_at | timestamptz | nullable |
| scheduled_at | timestamptz | nullable |
| created_at | timestamptz | default now() |

### `categories`
| Column | Type |
|--------|------|
| id | uuid PK |
| name | text |
| slug | text unique |
| description | text nullable |
| image_url | text nullable |
| created_at | timestamptz |

### `blog_post_categories`
| Column | Type |
|--------|------|
| post_id | uuid FK blog_posts |
| category_id | uuid FK categories |

### `blog_tags`
| Column | Type |
|--------|------|
| id | uuid PK |
| name | text |
| slug | text unique |

### `blog_post_tags`
| Column | Type |
|--------|------|
| post_id | uuid FK blog_posts |
| tag_id | uuid FK blog_tags |

### `recipes`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| title | text | |
| slug | text unique | |
| description | text | nullable |
| featured_image_url | text | nullable |
| prep_time | text | e.g. "15 minutes" |
| cook_time | text | nullable |
| total_time | text | nullable |
| servings | text | nullable |
| ingredients | jsonb | array of strings |
| instructions | jsonb | array of step strings |
| notes | text | nullable |
| meta_title | text | nullable |
| meta_description | text | nullable |
| status | enum | draft, published |
| published_at | timestamptz | nullable |
| created_at | timestamptz | |

### `recipe_categories`
| Column | Type |
|--------|------|
| id | uuid PK |
| name | text |
| slug | text unique |

### `recipe_category_map`
| Column | Type |
|--------|------|
| recipe_id | uuid FK recipes |
| category_id | uuid FK recipe_categories |

---

## Integrations

### Google Analytics 4
- GA4 measurement ID stored in env var
- Script added to root layout

### IndexNow
- API key stored in env var + `/[key].txt` route
- Ping sent automatically on post/recipe publish via API route

### Beehiiv Newsletter
- Embed URL stored in env var
- Newsletter strip component accepts the embed and renders an iframe or form
- Placeholder until Holly connects her Beehiiv account

### Social Sharing
- On single posts and single recipes
- Buttons: Facebook, Twitter/X, LinkedIn, WhatsApp
- Uses current page URL + title, no external SDK needed

### Predictive Search
- Supabase full-text search on `blog_posts` and `recipes` (tsvector columns)
- Debounced API route `/api/search?q=` returns mixed results
- Dropdown in nav header, full results page at `/search`

### Image Storage
- Supabase Storage bucket: `media`
- Featured images and inline post images uploaded via admin
- Returned as public URLs

---

## SEO

- JSON-LD Article schema on every blog post (title, author, datePublished, image)
- JSON-LD Recipe schema on every recipe (name, recipeIngredient, recipeInstructions, prepTime, cookTime, recipeYield)
- Meta title + description from database fields, fallback to site defaults
- Canonical URLs
- Open Graph tags (title, description, image) for social sharing previews
- Sitemap at `/sitemap.xml` (auto-generated, includes posts + recipes)
- Robots.txt at `/robots.txt`

---

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_GA_MEASUREMENT_ID=
INDEXNOW_API_KEY=
NEXT_PUBLIC_BEEHIIV_EMBED_URL=
```
