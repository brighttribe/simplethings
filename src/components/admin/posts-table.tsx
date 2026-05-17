'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { HeroFeaturedToggle } from '@/components/admin/hero-featured-toggle'
import { DeleteRowButton } from '@/components/admin/delete-row-button'
import type { Category } from '@/lib/types'

interface PostRow {
  id: string
  title: string
  status: string
  published_at: string | null
  created_at: string
  is_hero: boolean
  is_featured: boolean
  featured_order: number | null
  slug?: string
  blog_post_categories: { category_id: string }[]
}

interface Props {
  posts: PostRow[]
  allCategories: Category[]
  heroCount: number
  featuredCount: number
}

function buildCategoryTree(categories: Category[]) {
  const parents = categories.filter(c => !c.parent_id).sort((a, b) => a.name.localeCompare(b.name))
  return parents.flatMap(p => [
    p,
    ...categories.filter(c => c.parent_id === p.id).sort((a, b) => a.name.localeCompare(b.name)),
  ])
}

export function PostsTable({ posts, allCategories, heroCount, featuredCount }: Props) {
  const router = useRouter()
  const [openId, setOpenId] = useState<string | null>(null)
  // Quick edit form state
  const [qeTitle, setQeTitle] = useState('')
  const [qeSlug, setQeSlug] = useState('')
  const [qeStatus, setQeStatus] = useState('draft')
  const [qeCategoryIds, setQeCategoryIds] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const slugManual = useRef(false)

  const sortedCategories = buildCategoryTree(allCategories)

  function openQuickEdit(post: PostRow) {
    if (openId === post.id) { setOpenId(null); return }
    setQeTitle(post.title)
    setQeSlug((post as PostRow & { slug?: string }).slug ?? '')
    setQeStatus(post.status)
    setQeCategoryIds(post.blog_post_categories.map(c => c.category_id))
    slugManual.current = false
    setOpenId(post.id)
  }

  function handleTitleChange(val: string) {
    setQeTitle(val)
    if (!slugManual.current) {
      setQeSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''))
    }
  }

  function toggleCategory(id: string) {
    setQeCategoryIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  async function handleSave() {
    if (!openId) return
    setSaving(true)
    await Promise.all([
      fetch(`/api/posts/${openId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: qeTitle, slug: qeSlug, status: qeStatus }),
      }),
      fetch(`/api/posts/${openId}/categories`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category_ids: qeCategoryIds }),
      }),
    ])
    setSaving(false)
    setOpenId(null)
    router.refresh()
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="border-b border-gray-100 bg-gray-50">
          <tr>
            <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Title</th>
            <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wide w-28">Homepage</th>
            <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wide w-24">Status</th>
            <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wide w-28">Date</th>
            <th className="px-4 py-3 w-12" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {posts.length === 0 && (
            <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-400">No posts found</td></tr>
          )}
          {posts.map(post => (
            <>
              <tr key={post.id} className="group odd:bg-white even:bg-[#f2f7f2] hover:bg-[#e8f0e8] transition-colors">
                <td className="px-4 py-2.5">
                  <Link href={`/admin/posts/${post.id}/edit`} className="font-medium text-gray-900 hover:text-stone-600 transition-colors block">
                    {post.title}
                  </Link>
                  <div className="mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openQuickEdit(post)}
                      className="text-[11px] text-blue-600 hover:text-blue-800 hover:underline">
                      {openId === post.id ? 'Cancel' : 'Quick Edit'}
                    </button>
                  </div>
                </td>
                <td className="px-4 py-2.5">
                  <HeroFeaturedToggle
                    postId={post.id}
                    isHero={post.is_hero ?? false}
                    isFeatured={post.is_featured ?? false}
                    featuredOrder={post.featured_order}
                    heroSlotTaken={heroCount >= 1 && !post.is_hero}
                    featuredSlotsFull={featuredCount >= 2 && !post.is_featured}
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

              {/* Quick Edit panel */}
              {openId === post.id && (
                <tr key={`qe-${post.id}`}>
                  <td colSpan={5} className="p-0">
                    <div className="bg-gray-50 border-y border-gray-200 px-6 py-4">
                      <div className="grid grid-cols-2 gap-x-8 gap-y-0">

                        {/* Left: core fields */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <label className="w-12 text-xs text-gray-500 text-right shrink-0">Title</label>
                            <input type="text" value={qeTitle} onChange={e => handleTitleChange(e.target.value)}
                              className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-gray-400 bg-white" />
                          </div>
                          <div className="flex items-center gap-3">
                            <label className="w-12 text-xs text-gray-500 text-right shrink-0">Slug</label>
                            <input type="text" value={qeSlug}
                              onChange={e => { slugManual.current = true; setQeSlug(e.target.value) }}
                              className="flex-1 text-xs font-mono border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-gray-400 bg-white" />
                          </div>
                          <div className="flex items-center gap-3">
                            <label className="w-12 text-xs text-gray-500 text-right shrink-0">Status</label>
                            <select value={qeStatus} onChange={e => setQeStatus(e.target.value)}
                              className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-gray-400 bg-white">
                              <option value="draft">Draft</option>
                              <option value="scheduled">Scheduled</option>
                              <option value="published">Published</option>
                            </select>
                          </div>
                          <div className="flex gap-2 pl-15 pt-1" style={{ paddingLeft: '60px' }}>
                            <button onClick={handleSave} disabled={saving}
                              className="px-4 py-1.5 text-sm font-medium text-white bg-[#3d5c3a] rounded-lg hover:bg-[#2e4529] disabled:opacity-50 transition-colors">
                              {saving ? 'Saving…' : 'Update'}
                            </button>
                            <button onClick={() => setOpenId(null)}
                              className="px-4 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                              Cancel
                            </button>
                          </div>
                        </div>

                        {/* Right: categories */}
                        <div className="flex gap-3">
                          <label className="w-20 text-xs text-gray-500 text-right shrink-0 pt-1">Categories</label>
                          <div className="flex-1 border border-gray-200 rounded-lg bg-white overflow-y-auto max-h-36 p-2 space-y-0.5">
                            {sortedCategories.map(cat => (
                              <label key={cat.id} className={`flex items-center gap-2 cursor-pointer rounded px-1 py-0.5 hover:bg-gray-50 ${cat.parent_id ? 'pl-5' : ''}`}>
                                <input type="checkbox" checked={qeCategoryIds.includes(cat.id)} onChange={() => toggleCategory(cat.id)}
                                  className="rounded border-gray-300 text-gray-900 focus:ring-0 shrink-0" />
                                <span className={`text-xs ${cat.parent_id ? 'text-gray-600' : 'text-gray-800 font-medium'}`}>{cat.name}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>
    </div>
  )
}
