import { createServiceClient } from '@/lib/supabase/service'
import { requireAuth } from '@/lib/auth'
import Link from 'next/link'
import { Suspense } from 'react'
import { SearchBar } from '@/components/admin/search-bar'
import { PostsTable } from '@/components/admin/posts-table'

const PAGE_SIZES = [10, 20, 50, 100]

export default async function PostsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; per?: string }>
}) {
  await requireAuth()
  const params = await searchParams
  const q = params.q?.trim() ?? ''
  const perPage = PAGE_SIZES.includes(Number(params.per)) ? Number(params.per) : 10
  const page = Math.max(1, Number(params.page) || 1)
  const from = (page - 1) * perPage

  const db = createServiceClient()
  let query = db
    .from('blog_posts')
    .select('id, title, slug, status, published_at, created_at, is_hero, is_featured, featured_order, blog_post_categories(category_id)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, from + perPage - 1)

  if (q) query = query.ilike('title', `%${q}%`)

  const [
    { data: posts, count },
    { data: allCategories },
    { data: heroPost },
    { data: featuredPosts },
  ] = await Promise.all([
    query,
    db.from('categories').select('id, name, slug, parent_id, sort_order, description, image_url, created_at').order('name'),
    db.from('blog_posts').select('id').eq('is_hero', true).maybeSingle(),
    db.from('blog_posts').select('id, featured_order').eq('is_featured', true),
  ])

  const heroPostId = heroPost?.id ?? null
  const leftPostId = featuredPosts?.find(p => p.featured_order === 1)?.id ?? null
  const rightPostId = featuredPosts?.find(p => p.featured_order === 2)?.id ?? null

  const total = count ?? 0
  const totalPages = Math.max(1, Math.ceil(total / perPage))

  function pageUrl(p: number) {
    const sp = new URLSearchParams()
    if (q) sp.set('q', q)
    if (perPage !== 10) sp.set('per', String(perPage))
    sp.set('page', String(p))
    return `/admin/posts?${sp}`
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-5">
        <h1 className="text-xl font-semibold text-gray-900">Blog Posts</h1>
        <Link href="/admin/posts/new"
          className="px-4 py-2 text-sm font-medium text-white bg-[#3d5c3a] rounded-lg hover:bg-[#2e4529] transition-colors">
          New Post
        </Link>
      </div>

      {/* Search + per-page */}
      <div className="flex items-center gap-3 mb-4">
        <Suspense fallback={
          <div className="relative flex-1 max-w-sm">
            <input disabled placeholder="Search posts..." className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-white opacity-60" />
          </div>
        }>
          <SearchBar placeholder="Search posts..." basePath="/admin/posts" />
        </Suspense>
        <form method="get" action="/admin/posts" className="flex items-center gap-2">
          {q && <input type="hidden" name="q" value={q} />}
          <select name="per" defaultValue={perPage}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none bg-white text-gray-700">
            {PAGE_SIZES.map(n => <option key={n} value={n}>{n} per page</option>)}
          </select>
          <button type="submit" className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">Apply</button>
        </form>
      </div>

      <PostsTable
        posts={(posts ?? []) as Parameters<typeof PostsTable>[0]['posts']}
        allCategories={allCategories ?? []}
        heroPostId={heroPostId}
        leftPostId={leftPostId}
        rightPostId={rightPostId}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-gray-400">
            Showing {from + 1}–{Math.min(from + perPage, total)} of {total}
          </p>
          <div className="flex items-center gap-1">
            <Link href={pageUrl(page - 1)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                page <= 1 ? 'pointer-events-none opacity-40 border-gray-100 text-gray-300' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}>← Prev</Link>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i
              return (
                <Link key={p} href={pageUrl(p)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                    p === page ? 'border-[#3d5c3a] bg-[#3d5c3a] text-white' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}>{p}</Link>
              )
            })}
            <Link href={pageUrl(page + 1)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                page >= totalPages ? 'pointer-events-none opacity-40 border-gray-100 text-gray-300' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}>Next →</Link>
          </div>
        </div>
      )}
    </div>
  )
}
