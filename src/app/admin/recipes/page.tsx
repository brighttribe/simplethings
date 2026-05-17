import { createServiceClient } from '@/lib/supabase/service'
import { requireAuth } from '@/lib/auth'
import Link from 'next/link'
import { Suspense } from 'react'
import { SearchBar } from '@/components/admin/search-bar'
import { DeleteRowButton } from '@/components/admin/delete-row-button'
import { CategorySelect } from '@/components/admin/category-select'

const PAGE_SIZES = [10, 20, 50, 100]

export default async function RecipesPage({
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
    .from('recipes')
    .select('id, title, status, published_at, created_at, recipe_category_map(category_id)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, from + perPage - 1)

  if (q) {
    query = query.ilike('title', `%${q}%`)
  }

  const [{ data: recipes, count }, { data: allCategories }] = await Promise.all([
    query,
    db.from('recipe_categories').select('id, name').order('name'),
  ])

  const total = count ?? 0
  const totalPages = Math.max(1, Math.ceil(total / perPage))

  function pageUrl(p: number) {
    const sp = new URLSearchParams()
    if (q) sp.set('q', q)
    if (perPage !== 10) sp.set('per', String(perPage))
    sp.set('page', String(p))
    return `/admin/recipes?${sp}`
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-5">
        <h1 className="text-xl font-semibold text-gray-900">Recipes</h1>
        <Link
          href="/admin/recipes/new"
          className="px-4 py-2 text-sm font-medium text-white bg-[#3d5c3a] rounded-lg hover:bg-[#2e4529] transition-colors"
        >
          New Recipe
        </Link>
      </div>

      {/* Search + per-page */}
      <div className="flex items-center gap-3 mb-4">
        <Suspense fallback={
          <div className="relative flex-1 max-w-sm">
            <input disabled placeholder="Search recipes..." className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-white opacity-60" />
          </div>
        }>
          <SearchBar placeholder="Search recipes..." basePath="/admin/recipes" />
        </Suspense>
        <form method="get" action="/admin/recipes" className="flex items-center gap-2">
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
              <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wide w-24">Status</th>
              <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wide w-28">Date</th>
              <th className="px-4 py-3 w-12"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {recipes?.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-400">No recipes found</td></tr>
            )}
            {recipes?.map(recipe => {
              const currentCategoryId = (recipe.recipe_category_map as { category_id: string }[])?.[0]?.category_id ?? null
              return (
                <tr key={recipe.id} className="odd:bg-white even:bg-[#f2f7f2] hover:bg-[#e8f0e8] transition-colors">
                  <td className="px-4 py-2.5">
                    <Link href={`/admin/recipes/${recipe.id}/edit`} className="font-medium text-gray-900 hover:text-stone-600 transition-colors">
                      {recipe.title}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5">
                    <CategorySelect
                      postId={recipe.id}
                      currentCategoryId={currentCategoryId}
                      categories={allCategories ?? []}
                      apiPath="/api/recipes"
                    />
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium ${
                      recipe.status === 'published' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {recipe.status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-gray-400 text-xs">
                    {recipe.published_at ? new Date(recipe.published_at).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <DeleteRowButton id={recipe.id} label={recipe.title} apiPath="/api/recipes" />
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
