import { createServiceClient } from '@/lib/supabase/service'
import { requireAuth } from '@/lib/auth'
import Link from 'next/link'

export default async function RecipesPage() {
  await requireAuth()
  const db = createServiceClient()
  const { data: recipes } = await db
    .from('recipes')
    .select('id, title, status, published_at, created_at')
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Recipes</h1>
        <Link href="/admin/recipes/new" className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-700 transition-colors">
          New Recipe
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
            {recipes?.map(recipe => (
              <tr key={recipe.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-2.5 font-medium text-gray-900">{recipe.title}</td>
                <td className="px-4 py-2.5 capitalize text-gray-500">{recipe.status}</td>
                <td className="px-4 py-2.5 text-gray-400">
                  {recipe.published_at ? new Date(recipe.published_at).toLocaleDateString() : '—'}
                </td>
                <td className="px-4 py-2.5 text-right">
                  <Link href={`/admin/recipes/${recipe.id}/edit`} className="text-stone-600 hover:text-stone-900 font-medium">Edit</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
