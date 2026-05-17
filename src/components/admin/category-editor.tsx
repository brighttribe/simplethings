'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { generateSlug } from '@/lib/blog-utils'
import { MediaPicker } from '@/components/admin/media-picker'

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  image_url: string | null
}

interface CategoryEditorProps {
  category: Category
  apiPath: string
  backPath: string
  backLabel: string
}

export default function CategoryEditor({ category, apiPath, backPath, backLabel }: CategoryEditorProps) {
  const router = useRouter()
  const [name, setName] = useState(category.name)
  const [slug, setSlug] = useState(category.slug)
  const [slugEdited, setSlugEdited] = useState(false)
  const [description, setDescription] = useState(category.description ?? '')
  const [imageUrl, setImageUrl] = useState(category.image_url ?? '')
  const [saving, setSaving] = useState(false)
  const [savedIndicator, setSavedIndicator] = useState(false)
  const [showPicker, setShowPicker] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function uploadImage(file: File) {
    if (!file.type.startsWith('image/')) return
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/upload-image', { method: 'POST', body: fd })
    if (res.ok) {
      const { url } = await res.json()
      setImageUrl(url)
    }
    setUploading(false)
  }

  function handleNameChange(v: string) {
    setName(v)
    if (!slugEdited) setSlug(generateSlug(v))
  }

  async function handleSave() {
    setSaving(true)
    const res = await fetch(`${apiPath}/${category.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, slug, description: description || null, image_url: imageUrl || null }),
    })
    setSaving(false)
    if (res.ok) {
      setSavedIndicator(true)
      setTimeout(() => setSavedIndicator(false), 2500)
      router.refresh()
    }
  }

  const inputClass = "w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-300"
  const labelClass = "block text-xs font-medium text-gray-600 mb-1"

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <span className="text-gray-400 font-medium">Set URL:</span>
          <a href={backPath} className="hover:text-gray-600">{backLabel}</a>
          <span>/</span>
          <input
            type="text"
            value={slug}
            onChange={e => { setSlugEdited(true); setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')) }}
            className="text-gray-600 bg-transparent outline-none border-b border-dashed border-gray-300 hover:border-gray-500 focus:border-stone-400 focus:text-gray-900 transition-colors min-w-0 w-48"
          />
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 text-sm font-medium text-white bg-[#3d5c3a] rounded-lg hover:bg-[#2e4529] disabled:opacity-50"
        >
          {savedIndicator ? 'Saved!' : saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      <div className="flex gap-6 items-start">
        <div className="flex-1 space-y-5">
          <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
            <div>
              <label className={labelClass}>Name</label>
              <input type="text" value={name} onChange={e => handleNameChange(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} className={inputClass + ' resize-none'} />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="flex items-center justify-between mb-2">
              <label className={labelClass}>Category Image</label>
              <button type="button" onClick={() => setShowPicker(true)} className="text-[10px] text-stone-500 hover:text-stone-700 transition-colors">Media Library</button>
            </div>
            {showPicker && <MediaPicker onSelect={url => { setImageUrl(url); setShowPicker(false) }} onClose={() => setShowPicker(false)} />}
            {imageUrl ? (
              <div className="relative group mt-1">
                <img src={imageUrl} alt="" className="w-full rounded-lg object-cover aspect-video" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 rounded-lg transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="px-2.5 py-1.5 bg-white text-gray-800 text-xs font-medium rounded-lg hover:bg-gray-100">Replace</button>
                  <button type="button" onClick={() => setImageUrl('')} className="px-2.5 py-1.5 bg-white text-red-600 text-xs font-medium rounded-lg hover:bg-red-50">Remove</button>
                </div>
              </div>
            ) : (
              <div
                onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) uploadImage(f) }}
                onDragOver={e => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onClick={() => fileInputRef.current?.click()}
                className={`mt-1 border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${dragging ? 'border-stone-400 bg-stone-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
              >
                {uploading ? (
                  <p className="text-xs text-gray-400">Uploading & converting...</p>
                ) : (
                  <>
                    <svg className="w-6 h-6 mx-auto mb-2 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                    <p className="text-xs text-gray-400">Drop image here or click to upload</p>
                    <p className="text-[10px] text-gray-300 mt-1">Auto-converted to WebP · 1500px</p>
                  </>
                )}
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) uploadImage(f); e.target.value = '' }} />
          </div>
        </div>
      </div>
    </div>
  )
}
