'use client'

import { useState, useRef } from 'react'
import type { PostStatus, Category, BlogTag } from '@/lib/types'
import { MediaPicker } from '@/components/admin/media-picker'

interface SeoPanelProps {
  metaTitle: string
  metaDescription: string
  heroImageUrl: string
  status: PostStatus
  scheduledAt: string
  publishedAt: string
  isHero: boolean
  heroCount: number
  isFeatured: boolean
  featuredOrder: number | null
  featuredCount: number
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
  onHeroChange: (isHero: boolean) => void
  onFeaturedChange: (isFeatured: boolean, order: number | null) => void
  onCategoryToggle: (id: string) => void
  onTagToggle: (id: string) => void
  onTagCreate: (tag: BlogTag) => void
  onSave: () => void
  onPublish: () => void
}

export default function SeoPanel({
  metaTitle, metaDescription, heroImageUrl, status, scheduledAt, publishedAt,
  isHero, heroCount, isFeatured, featuredOrder, featuredCount,
  categories, selectedCategoryIds, allTags, selectedTagIds,
  saving, savedIndicator,
  onMetaTitleChange, onMetaDescriptionChange, onHeroImageChange,
  onStatusChange, onScheduledAtChange, onPublishedAtChange,
  onHeroChange, onFeaturedChange, onCategoryToggle, onTagToggle, onTagCreate, onSave, onPublish,
}: SeoPanelProps) {
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [showPicker, setShowPicker] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function uploadFile(file: File) {
    if (!file.type.startsWith('image/')) return
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/upload-image', { method: 'POST', body: fd })
    if (res.ok) {
      const { url } = await res.json()
      onHeroImageChange(url)
    }
    setUploading(false)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) uploadFile(file)
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setDragging(true)
  }

  return (
    <div className="w-72 shrink-0 space-y-4">
      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-2">
        <div className="flex gap-2">
          <button onClick={onSave} disabled={saving}
            className="flex-1 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50">
            {savedIndicator ? 'Saved!' : saving ? 'Saving...' : 'Save Draft'}
          </button>
          <button onClick={onPublish} disabled={saving}
            className="flex-1 py-2 text-xs font-medium text-white bg-[#3d5c3a] rounded-lg hover:bg-[#2e4529] transition-colors disabled:opacity-50">
            Publish
          </button>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Status</label>
          <select value={status} onChange={e => onStatusChange(e.target.value as PostStatus)}
            className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none">
            <option value="draft">Draft</option>
            <option value="scheduled">Scheduled</option>
            <option value="published">Published</option>
          </select>
        </div>
        {status === 'published' && (
          <div>
            <label className="block text-xs text-gray-500 mb-1">Publish Date</label>
            <input type="datetime-local" value={publishedAt} onChange={e => onPublishedAtChange(e.target.value)}
              className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none" />
          </div>
        )}
        {status === 'scheduled' && (
          <div>
            <label className="block text-xs text-gray-500 mb-1">Schedule For</label>
            <input type="datetime-local" value={scheduledAt} onChange={e => onScheduledAtChange(e.target.value)}
              className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none" />
          </div>
        )}
      </div>

      {showPicker && <MediaPicker onSelect={onHeroImageChange} onClose={() => setShowPicker(false)} />}

      {/* Featured Image with drag-and-drop */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-xs font-medium text-gray-700">Featured Image</label>
          <button onClick={() => setShowPicker(true)} className="text-[10px] text-stone-500 hover:text-stone-700 transition-colors">
            Media Library
          </button>
        </div>
        {heroImageUrl ? (
          <div className="relative group">
            <img src={heroImageUrl} alt="" className="w-full rounded-lg object-cover aspect-video" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 rounded-lg transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-2.5 py-1.5 bg-white text-gray-800 text-xs font-medium rounded-lg hover:bg-gray-100 transition-colors"
              >
                Replace
              </button>
              <button
                onClick={() => onHeroImageChange('')}
                className="px-2.5 py-1.5 bg-white text-red-600 text-xs font-medium rounded-lg hover:bg-red-50 transition-colors"
              >
                Remove
              </button>
            </div>
          </div>
        ) : (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={() => setDragging(false)}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              dragging ? 'border-stone-400 bg-stone-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            {uploading ? (
              <p className="text-xs text-gray-400">Uploading & converting...</p>
            ) : (
              <>
                <svg className="w-6 h-6 mx-auto mb-2 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
                <p className="text-xs text-gray-400">Drop image here or click to upload</p>
                <p className="text-[10px] text-gray-300 mt-1">Auto-converted to WebP · 1500px</p>
              </>
            )}
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) uploadFile(f); e.target.value = '' }}
        />
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
        <p className="text-xs font-medium text-gray-700">SEO</p>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Meta Title ({metaTitle.length}/60)</label>
          <input type="text" value={metaTitle} onChange={e => onMetaTitleChange(e.target.value)} maxLength={60}
            className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Meta Description ({metaDescription.length}/160)</label>
          <textarea value={metaDescription} onChange={e => onMetaDescriptionChange(e.target.value)} maxLength={160} rows={3}
            className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none resize-none" />
        </div>
      </div>

      {/* Homepage Hero (1 slot) */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-gray-700">Homepage Hero</p>
          <span className={`text-[10px] font-medium tabular-nums ${heroCount >= 1 && !isHero ? 'text-amber-600' : 'text-gray-400'}`}>
            {isHero ? '1' : heroCount}/1 slot
          </span>
        </div>
        <label className={`flex items-center gap-2 ${heroCount >= 1 && !isHero ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}>
          <input
            type="checkbox"
            checked={isHero}
            disabled={heroCount >= 1 && !isHero}
            onChange={e => onHeroChange(e.target.checked)}
            className="rounded"
          />
          <span className="text-xs text-gray-700">Set as top hero post</span>
        </label>
        {heroCount >= 1 && !isHero && (
          <p className="text-[10px] text-amber-600 mt-1.5">Hero slot is taken. Unset the current hero first.</p>
        )}
      </div>

      {/* Homepage Featured (2 slots) */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-gray-700">Homepage Featured</p>
          <span className={`text-[10px] font-medium tabular-nums ${featuredCount >= 2 && !isFeatured ? 'text-amber-600' : 'text-gray-400'}`}>
            {featuredCount}/2 slots
          </span>
        </div>
        <label className={`flex items-center gap-2 mb-2 ${featuredCount >= 2 && !isFeatured ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}>
          <input
            type="checkbox"
            checked={isFeatured}
            disabled={featuredCount >= 2 && !isFeatured}
            onChange={e => onFeaturedChange(e.target.checked, e.target.checked ? (featuredOrder ?? 1) : null)}
            className="rounded"
          />
          <span className="text-xs text-gray-700">Show below hero</span>
        </label>
        {featuredCount >= 2 && !isFeatured && (
          <p className="text-[10px] text-amber-600 mb-2">Both featured slots are filled.</p>
        )}
        {isFeatured && (
          <div>
            <p className="text-[10px] text-gray-400 mb-1.5">Position</p>
            <div className="flex gap-2">
              {[1, 2].map(n => (
                <button key={n} onClick={() => onFeaturedChange(true, n)}
                  className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${featuredOrder === n ? 'bg-[#3d5c3a] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {n}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <p className="text-xs font-medium text-gray-700 mb-2">Categories</p>
        <div className="space-y-1.5">
          {categories.map(cat => (
            <label key={cat.id} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={selectedCategoryIds.includes(cat.id)} onChange={() => onCategoryToggle(cat.id)} className="rounded" />
              <span className="text-xs text-gray-700">{cat.name}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <p className="text-xs font-medium text-gray-700 mb-2">Tags</p>
        <div className="flex flex-wrap gap-1.5">
          {allTags.map(tag => (
            <button key={tag.id} onClick={() => onTagToggle(tag.id)}
              className={`px-2 py-1 rounded-full text-xs transition-colors ${
                selectedTagIds.includes(tag.id) ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>
              {tag.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
