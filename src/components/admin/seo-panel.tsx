'use client'

import type { PostStatus, Category, BlogTag } from '@/lib/types'

interface SeoPanelProps {
  metaTitle: string
  metaDescription: string
  heroImageUrl: string
  status: PostStatus
  scheduledAt: string
  publishedAt: string
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
  categories, selectedCategoryIds, allTags, selectedTagIds,
  saving, savedIndicator,
  onMetaTitleChange, onMetaDescriptionChange, onHeroImageChange,
  onStatusChange, onScheduledAtChange, onPublishedAtChange,
  onCategoryToggle, onTagToggle, onTagCreate, onSave, onPublish,
}: SeoPanelProps) {
  return (
    <div className="w-72 shrink-0 space-y-4">
      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-2">
        <div className="flex gap-2">
          <button onClick={onSave} disabled={saving}
            className="flex-1 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50">
            {savedIndicator ? 'Saved!' : saving ? 'Saving...' : 'Save Draft'}
          </button>
          <button onClick={onPublish} disabled={saving}
            className="flex-1 py-2 text-xs font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50">
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

      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <label className="block text-xs font-medium text-gray-700 mb-2">Featured Image</label>
        <input type="text" value={heroImageUrl} onChange={e => onHeroImageChange(e.target.value)}
          placeholder="Image URL"
          className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none mb-2" />
        {heroImageUrl && <img src={heroImageUrl} alt="" className="w-full rounded-lg object-cover aspect-video" />}
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
