'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface RecipeCategory { id: string; name: string; slug: string; recipe_count: number }

interface DeleteTarget {
  id: string
  name: string
  recipeCount: number
}

export default function RecipeCategoriesPage() {
  const [categories, setCategories] = useState<RecipeCategory[]>([])
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null)
  const [deleteRecipes, setDeleteRecipes] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function load() {
    const res = await fetch('/api/recipe-categories')
    setCategories(await res.json())
  }

  useEffect(() => { load() }, [])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    await fetch('/api/recipe-categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    setName('')
    setSaving(false)
    load()
  }

  function openDeleteModal(cat: RecipeCategory) {
    setDeleteTarget({ id: cat.id, name: cat.name, recipeCount: cat.recipe_count })
    setDeleteRecipes(false)
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    await fetch('/api/recipe-categories', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: deleteTarget.id, deleteRecipes }),
    })
    setDeleting(false)
    setDeleteTarget(null)
    load()
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Recipe Categories</h1>

      <form onSubmit={handleAdd} className="flex gap-2 mb-6">
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Category name"
          className="w-[300px] px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-300"
        />
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 text-sm font-medium text-white bg-[#3d5c3a] rounded-lg hover:bg-[#2e4529] disabled:opacity-50"
        >
          Add
        </button>
      </form>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-100 bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Name</th>
              <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Slug</th>
              <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wide w-20">Recipes</th>
              <th className="text-right px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wide w-20">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {categories.map(cat => (
              <tr key={cat.id} className="hover:bg-gray-50">
                <td className="px-4 py-2.5 font-medium text-gray-900">
                  <Link href={`/admin/recipe-categories/${cat.id}`} className="hover:text-[#3d5c3a] transition-colors">{cat.name}</Link>
                </td>
                <td className="px-4 py-2.5 text-gray-400">{cat.slug}</td>
                <td className="px-4 py-2.5 text-gray-400">{cat.recipe_count}</td>
                <td className="px-4 py-2.5 text-right">
                  <button
                    onClick={() => openDeleteModal(cat)}
                    title={`Delete ${cat.name}`}
                    className="text-gray-300 hover:text-red-500 transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                      <path d="M10 11v6M14 11v6"/>
                      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-start gap-4 mb-5">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Delete "{deleteTarget.name}"?</h2>
                {deleteTarget.recipeCount > 0 ? (
                  <p className="text-sm text-gray-500 mt-1">
                    This category has{' '}
                    <span className="font-medium text-gray-700">{deleteTarget.recipeCount} recipe{deleteTarget.recipeCount !== 1 ? 's' : ''}</span>{' '}
                    assigned to it.
                  </p>
                ) : (
                  <p className="text-sm text-gray-500 mt-1">This category has no recipes and can be safely deleted.</p>
                )}
              </div>
            </div>

            {deleteTarget.recipeCount > 0 && (
              <div className="mb-5 space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={deleteRecipes}
                    onChange={e => setDeleteRecipes(e.target.checked)}
                    className="mt-0.5 rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                  <span className="text-sm text-gray-700">
                    Also delete all {deleteTarget.recipeCount} recipe{deleteTarget.recipeCount !== 1 ? 's' : ''} in this category
                  </span>
                </label>
                {!deleteRecipes && (
                  <p className="text-xs text-gray-400 pl-7">
                    Recipes will be moved to the <span className="font-medium text-gray-600">"Recipes"</span> category instead.
                  </p>
                )}
                {deleteRecipes && (
                  <p className="text-xs text-red-500 pl-7 font-medium">
                    This will permanently delete {deleteTarget.recipeCount} recipe{deleteTarget.recipeCount !== 1 ? 's' : ''}. This cannot be undone.
                  </p>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : deleteRecipes ? 'Delete Category & Recipes' : 'Delete Category'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
