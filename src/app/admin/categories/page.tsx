'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

interface Category {
  id: string
  name: string
  slug: string
  post_count: number
  parent_id: string | null
  sort_order: number
}

interface DeleteTarget {
  id: string
  name: string
  postCount: number
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [name, setName] = useState('')
  const [parentId, setParentId] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null)
  const [deletePosts, setDeletePosts] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const dragItem = useRef<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)

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
      body: JSON.stringify({ name, parent_id: parentId || null }),
    })
    setName('')
    setParentId('')
    setSaving(false)
    load()
  }

  async function moveTopLevel(id: string, direction: 'up' | 'down') {
    const siblings = categories.filter(c => !c.parent_id).sort((a, b) => a.sort_order - b.sort_order)
    const idx = siblings.findIndex(c => c.id === id)
    if (direction === 'up' && idx === 0) return
    if (direction === 'down' && idx === siblings.length - 1) return
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    const a = siblings[idx], b = siblings[swapIdx]
    await fetch('/api/categories/reorder', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([{ id: a.id, sort_order: b.sort_order }, { id: b.id, sort_order: a.sort_order }]),
    })
    load()
  }

  async function handleSubDrop(targetId: string, parentCatId: string) {
    setDragOverId(null)
    if (!dragItem.current || dragItem.current === targetId) return

    const siblings = categories
      .filter(c => c.parent_id === parentCatId)
      .sort((a, b) => a.sort_order - b.sort_order)

    const fromIdx = siblings.findIndex(c => c.id === dragItem.current)
    const toIdx = siblings.findIndex(c => c.id === targetId)
    if (fromIdx === -1 || toIdx === -1) return

    const reordered = [...siblings]
    const [moved] = reordered.splice(fromIdx, 1)
    reordered.splice(toIdx, 0, moved)

    await fetch('/api/categories/reorder', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reordered.map((c, i) => ({ id: c.id, sort_order: i + 1 }))),
    })
    dragItem.current = null
    load()
  }

  function openDeleteModal(cat: Category) {
    setDeleteTarget({ id: cat.id, name: cat.name, postCount: cat.post_count })
    setDeletePosts(false)
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    await fetch('/api/categories', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: deleteTarget.id, deletePosts }),
    })
    setDeleting(false)
    setDeleteTarget(null)
    load()
  }

  const topLevel = categories.filter(c => !c.parent_id).sort((a, b) => a.sort_order - b.sort_order)
  const childrenOf = (pid: string) =>
    categories.filter(c => c.parent_id === pid).sort((a, b) => a.sort_order - b.sort_order)

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Blog Categories</h1>

      <form onSubmit={handleAdd} className="flex gap-2 mb-6 flex-wrap">
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Category name"
          className="w-[220px] px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-300"
        />
        <select
          value={parentId}
          onChange={e => setParentId(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-300 text-gray-600"
        >
          <option value="">None — top level</option>
          {topLevel.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
        <button type="submit" disabled={saving}
          className="px-4 py-2 text-sm font-medium text-white bg-[#3d5c3a] rounded-lg hover:bg-[#2e4529] disabled:opacity-50">
          Add
        </button>
      </form>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-100 bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Name</th>
              <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Slug</th>
              <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wide w-20">Posts</th>
              <th className="text-right px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wide w-28">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {topLevel.map((cat, idx) => (
              <>
                {/* Top-level row — up/down arrows */}
                <tr key={cat.id} className="hover:bg-gray-50 bg-gray-50/50">
                  <td className="px-4 py-2.5 font-semibold text-gray-800">
                    <div className="flex items-center gap-1">
                      <div className="flex flex-col mr-1">
                        <button
                          onClick={() => moveTopLevel(cat.id, 'up')}
                          disabled={idx === 0}
                          className="p-0.5 text-gray-300 hover:text-gray-600 disabled:opacity-0 disabled:pointer-events-none"
                          aria-label="Move up"
                        >
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
                        </button>
                        <button
                          onClick={() => moveTopLevel(cat.id, 'down')}
                          disabled={idx === topLevel.length - 1}
                          className="p-0.5 text-gray-300 hover:text-gray-600 disabled:opacity-0 disabled:pointer-events-none"
                          aria-label="Move down"
                        >
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                        </button>
                      </div>
                      <Link href={`/admin/categories/${cat.id}`} className="hover:text-[#3d5c3a] transition-colors">{cat.name}</Link>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-gray-400 text-sm">{cat.slug}</td>
                  <td className="px-4 py-2.5 text-gray-400 text-sm">{cat.post_count}</td>
                  <td className="px-4 py-2.5 text-right">
                    <button onClick={() => openDeleteModal(cat)} className="text-gray-300 hover:text-red-500 transition-colors">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                      </svg>
                    </button>
                  </td>
                </tr>

                {/* Subcategory rows — drag handles */}
                {childrenOf(cat.id).map(child => (
                  <tr
                    key={child.id}
                    draggable
                    onDragStart={() => { dragItem.current = child.id }}
                    onDragOver={e => { e.preventDefault(); setDragOverId(child.id) }}
                    onDragLeave={() => setDragOverId(null)}
                    onDrop={() => handleSubDrop(child.id, cat.id)}
                    onDragEnd={() => { dragItem.current = null; setDragOverId(null) }}
                    className={`transition-colors ${dragOverId === child.id ? 'bg-[#e4ede2]' : 'hover:bg-gray-50'}`}
                  >
                    <td className="px-4 py-2.5 text-gray-700">
                      <div className="flex items-center gap-2 pl-6">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-gray-300 cursor-grab active:cursor-grabbing shrink-0">
                          <line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="18" x2="16" y2="18"/>
                        </svg>
                        <span className="text-gray-300 text-xs">↳</span>
                        <Link href={`/admin/categories/${child.id}`} className="hover:text-[#3d5c3a] transition-colors">{child.name}</Link>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-gray-400 text-sm">{child.slug}</td>
                    <td className="px-4 py-2.5 text-gray-400 text-sm">{child.post_count}</td>
                    <td className="px-4 py-2.5 text-right">
                      <button onClick={() => openDeleteModal(child)} className="text-gray-300 hover:text-red-500 transition-colors">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </>
            ))}
          </tbody>
        </table>
      </div>

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
                <h2 className="text-sm font-semibold text-gray-900">Delete &quot;{deleteTarget.name}&quot;?</h2>
                {deleteTarget.postCount > 0 ? (
                  <p className="text-sm text-gray-500 mt-1">This category has <span className="font-medium text-gray-700">{deleteTarget.postCount} blog post{deleteTarget.postCount !== 1 ? 's' : ''}</span> assigned to it.</p>
                ) : (
                  <p className="text-sm text-gray-500 mt-1">This category has no posts and can be safely deleted.</p>
                )}
              </div>
            </div>
            {deleteTarget.postCount > 0 && (
              <div className="mb-5 space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={deletePosts} onChange={e => setDeletePosts(e.target.checked)} className="mt-0.5 rounded border-gray-300 text-red-600 focus:ring-red-500" />
                  <span className="text-sm text-gray-700">Also delete all {deleteTarget.postCount} post{deleteTarget.postCount !== 1 ? 's' : ''} in this category</span>
                </label>
                {!deletePosts && <p className="text-xs text-gray-400 pl-7">Posts will be moved to <span className="font-medium text-gray-600">&quot;Blog&quot;</span> instead.</p>}
                {deletePosts && <p className="text-xs text-red-500 pl-7 font-medium">This will permanently delete {deleteTarget.postCount} post{deleteTarget.postCount !== 1 ? 's' : ''}. Cannot be undone.</p>}
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteTarget(null)} disabled={deleting} className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={confirmDelete} disabled={deleting} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50">
                {deleting ? 'Deleting...' : deletePosts ? 'Delete Category & Posts' : 'Delete Category'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
