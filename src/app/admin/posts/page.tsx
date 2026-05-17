import { createServiceClient } from '@/lib/supabase/service'
import { requireAuth } from '@/lib/auth'
import Link from 'next/link'
import { Suspense } from 'react'
import { SearchBar } from '@/components/admin/search-bar'
import { DeleteRowButton } from '@/components/admin/delete-row-button'
import { CategorySelect } from '@/components/admin/category-select'
import { HeroFeaturedToggle } from '@/components/admin/hero-featured-toggle'

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
    .select('id, title, status, published_at, created_at, is_hero, is_featured, featured_order, blog_post_categories(category_id)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, from + perPage - 1)

  if (q) {
    query = query.ilike('title', `%${q}%`)
  }

  const [{ data: posts, count }, { data: allCategories }, { count: heroCount }, { count: featuredCount }] = await Promise.all([
    query,
    db.from('categories').select('id, name').order('name'),
    db.from('blog_posts').select('id', { count: 'exact', head: true }).eq('is_hero', true),
    db.from('blog_posts').select('id', { count: 'exact', head: true }).eq('is_featured', true),
  ])

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
        <Link
          href="/admin/posts/new"
          className="px-4 py-2 text-sm font-medium text-white bg-[#3d5c3a] rounded-lg hover:bg-[#2e4529] transition-colors"
        >
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
          <select
            name="per"
            defaultValue={perPage}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none bg-white text-gray-700"
          >
            {PAGE_SIZES.map(n => <option key={n} value={n}>{n} per page</option>)}
          </select>
          <button type="submit" className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">Apply</button>
        </form>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-100 bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Title</th>
              <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wide w-28">Category</th>
              <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wide w-28">Homepage</th>
              <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wide w-24">Status</th>
              <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wide w-28">Date</th>
              <th className="px-4 py-3 w-12"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {posts?.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-400">No posts found</td></tr>
            )}
            {posts?.map(post => {
              const currentCategoryId = (post.blog_post_categories as { category_id: string }[])?.[0]?.category_id ?? null
              const p = post as typeof post & { is_hero: boolean; is_featured: boolean; featured_order: number | null }
              return (
                <tr key={post.id} className="odd:bg-white even:bg-[#f2f7f2] hover:bg-[#e8f0e8] transition-colors">
                  <td className="px-4 py-2.5">
                    <Link href={`/admin/posts/${post.id}/edit`} className="font-medium text-gray-900 hover:text-stone-600 transition-colors">
                      {post.title}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5">
                    <CategorySelect
                      postId={post.id}
                      currentCategoryId={currentCategoryId}
                      categories={allCategories ?? []}
                      apiPath="/api/posts"
                    />
                  </td>
                  <td className="px-4 py-2.5">
                    <HeroFeaturedToggle
                      postId={post.id}
                      isHero={p.is_hero ?? false}
                      isFeatured={p.is_featured ?? false}
                      featuredOrder={p.featured_order}
                      heroSlotTaken={(heroCount ?? 0) >= 1 && !p.is_hero}
                      featuredSlotsFull={(featuredCount ?? 0) >= 2 && !p.is_featured}
                    />
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium ${
                      post.status === 'published' ? 'bg-green-50 text-green-700' :
                      post.status === 'scheduled' ? 'bg-amber-50 text-amber-700' :
                      'bg-gray-100 text-gray-500'
                    }`}>
                      {post.status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-gray-400 text-xs">
                    {post.published_at ? new Date(post.published_at).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <DeleteRowButton id={post.id} label={post.title} apiPath="/api/posts" />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-gray-400">
            Showing {from + 1}–{Math.min(from + perPage, total)} of {total}
          </p>
          <div className="flex items-center gap-1">
            <Link
              href={pageUrl(page - 1)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                page <= 1 ? 'pointer-events-none opacity-40 border-gray-100 text-gray-300' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >← Prev</Link>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i
              return (
                <Link
                  key={p}
                  href={pageUrl(p)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                    p === page ? 'border-[#3d5c3a] bg-[#3d5c3a] text-white' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >{p}</Link>
              )
            })}
            <Link
              href={pageUrl(page + 1)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                page >= totalPages ? 'pointer-events-none opacity-40 border-gray-100 text-gray-300' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >Next →</Link>
          </div>
        </div>
      )}
    </div>
  )
}
