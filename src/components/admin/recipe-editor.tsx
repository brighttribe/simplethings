'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import type { Recipe, RecipeCategory, RecipeStatus } from '@/lib/types'
import { generateSlug } from '@/lib/blog-utils'
import { MediaPicker } from '@/components/admin/media-picker'

interface RecipeEditorProps {
  recipe: Recipe
  categories: RecipeCategory[]
}

export default function RecipeEditor({ recipe, categories }: RecipeEditorProps) {
  const router = useRouter()
  const [title, setTitle] = useState(recipe.title)
  const [slug, setSlug] = useState(recipe.slug)
  const [slugEdited, setSlugEdited] = useState(false)
  const [description, setDescription] = useState(recipe.description ?? '')
  const [featuredImageUrl, setFeaturedImageUrl] = useState(recipe.featured_image_url ?? '')
  const [prepTime, setPrepTime] = useState(recipe.prep_time ?? '')
  const [cookTime, setCookTime] = useState(recipe.cook_time ?? '')
  const [totalTime, setTotalTime] = useState(recipe.total_time ?? '')
  const [servings, setServings] = useState(recipe.servings ?? '')
  const [ingredients, setIngredients] = useState<string[]>(recipe.ingredients.length ? recipe.ingredients : [''])
  const [instructions, setInstructions] = useState<string[]>(recipe.instructions.length ? recipe.instructions : [''])
  const [notes, setNotes] = useState(recipe.notes ?? '')
  const [metaTitle, setMetaTitle] = useState(recipe.meta_title ?? '')
  const [metaDescription, setMetaDescription] = useState(recipe.meta_description ?? '')
  const [status, setStatus] = useState<RecipeStatus>(recipe.status)
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(
    (recipe.recipe_category_map ?? []).flatMap(r => r.recipe_categories ? [r.recipe_categories.id] : [])
  )
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
      setFeaturedImageUrl(url)
    }
    setUploading(false)
  }

  function handleTitleChange(v: string) {
    setTitle(v)
    if (!slugEdited) setSlug(generateSlug(v))
    if (!metaTitle) setMetaTitle(v.slice(0, 60))
  }

  function toggleCategory(id: string) {
    setSelectedCategoryIds(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id])
  }

  async function save(overrides: Record<string, unknown> = {}) {
    setSaving(true)
    const res = await fetch(`/api/recipes/${recipe.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title, slug,
        description: description || null,
        featured_image_url: featuredImageUrl || null,
        prep_time: prepTime || null,
        cook_time: cookTime || null,
        total_time: totalTime || null,
        servings: servings || null,
        ingredients: ingredients.filter(i => i.trim()),
        instructions: instructions.filter(i => i.trim()),
        notes: notes || null,
        meta_title: metaTitle || null,
        meta_description: metaDescription || null,
        status,
        category_ids: selectedCategoryIds,
        ...overrides,
      }),
    })
    setSaving(false)
    return res
  }

  async function handleSave() {
    const res = await save()
    if (res.ok) {
      setSavedIndicator(true)
      setTimeout(() => setSavedIndicator(false), 2500)
      router.refresh()
    }
  }

  async function handlePublish() {
    const res = await save({ status: 'published', published_at: new Date().toISOString() })
    if (res.ok) router.push('/admin/recipes')
  }

  const inputClass = "w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-300"
  const labelClass = "block text-xs font-medium text-gray-600 mb-1"

  return (
    <div>
      {/* Header: slug breadcrumb + save/publish */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <span className="text-gray-400 font-medium">Set URL:</span>
          <a href="/admin/recipes" className="hover:text-gray-600">recipes</a>
          <span>/</span>
          <input
            type="text"
            value={slug}
            onChange={e => { setSlugEdited(true); setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')) }}
            className="text-gray-600 bg-transparent outline-none border-b border-dashed border-gray-300 hover:border-gray-500 focus:border-stone-400 focus:text-gray-900 transition-colors min-w-0 w-72"
          />
        </div>
        <div className="flex gap-2">
          <button onClick={handleSave} disabled={saving}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50">
            {savedIndicator ? 'Saved!' : saving ? 'Saving...' : 'Save Draft'}
          </button>
          <button onClick={handlePublish} disabled={saving}
            className="px-4 py-2 text-sm font-medium text-white bg-[#3d5c3a] rounded-lg hover:bg-[#2e4529] disabled:opacity-50">
            Publish
          </button>
        </div>
      </div>

      <div className="flex gap-6 items-start">
        <div className="flex-1 space-y-5">
          <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
            <div>
              <label className={labelClass}>Title</label>
              <input type="text" value={title} onChange={e => handleTitleChange(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className={inputClass + ' resize-none'} />
            </div>
            {showPicker && <MediaPicker onSelect={url => { setFeaturedImageUrl(url); setShowPicker(false) }} onClose={() => setShowPicker(false)} />}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className={labelClass}>Featured Image</label>
                <button type="button" onClick={() => setShowPicker(true)} className="text-[10px] text-stone-500 hover:text-stone-700 transition-colors">Media Library</button>
              </div>
              {featuredImageUrl ? (
                <div className="relative group mt-1">
                  <img src={featuredImageUrl} alt="" className="w-full rounded-lg object-cover aspect-video" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 rounded-lg transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="px-2.5 py-1.5 bg-white text-gray-800 text-xs font-medium rounded-lg hover:bg-gray-100">Replace</button>
                    <button type="button" onClick={() => setFeaturedImageUrl('')} className="px-2.5 py-1.5 bg-white text-red-600 text-xs font-medium rounded-lg hover:bg-red-50">Remove</button>
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

          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <p className="text-sm font-medium text-gray-900 mb-4">Details</p>
            <div className="grid grid-cols-2 gap-4">
              {([['Prep Time', prepTime, setPrepTime], ['Cook Time', cookTime, setCookTime], ['Total Time', totalTime, setTotalTime], ['Servings', servings, setServings]] as const).map(([label, value, setter]) => (
                <div key={label}>
                  <label className={labelClass}>{label}</label>
                  <input type="text" value={value as string} onChange={e => (setter as (v: string) => void)(e.target.value)}
                    placeholder={label === 'Servings' ? 'e.g. 4' : 'e.g. 15 minutes'} className={inputClass} />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <p className="text-sm font-medium text-gray-900 mb-4">Ingredients</p>
            <div className="space-y-2">
              {ingredients.map((ing, i) => (
                <div key={i} className="flex gap-2">
                  <input type="text" value={ing} onChange={e => setIngredients(prev => prev.map((x, idx) => idx === i ? e.target.value : x))}
                    placeholder={`Ingredient ${i + 1}`} className={inputClass} />
                  <button onClick={() => setIngredients(prev => prev.filter((_, idx) => idx !== i))} className="px-2 text-gray-400 hover:text-red-500">&#x2715;</button>
                </div>
              ))}
            </div>
            <button onClick={() => setIngredients(prev => [...prev, ''])} className="mt-3 text-sm text-stone-600 hover:text-stone-900">+ Add ingredient</button>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <p className="text-sm font-medium text-gray-900 mb-4">Instructions</p>
            <div className="space-y-3">
              {instructions.map((ins, i) => (
                <div key={i} className="flex gap-2">
                  <span className="mt-2 text-xs font-bold text-gray-400 w-5 shrink-0">{i + 1}.</span>
                  <textarea value={ins} onChange={e => setInstructions(prev => prev.map((x, idx) => idx === i ? e.target.value : x))}
                    rows={2} placeholder={`Step ${i + 1}`} className={inputClass + ' resize-none flex-1'} />
                  <button onClick={() => setInstructions(prev => prev.filter((_, idx) => idx !== i))} className="mt-2 px-2 text-gray-400 hover:text-red-500">&#x2715;</button>
                </div>
              ))}
            </div>
            <button onClick={() => setInstructions(prev => [...prev, ''])} className="mt-3 text-sm text-stone-600 hover:text-stone-900">+ Add step</button>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <label className={labelClass}>Notes / Tips (optional)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4} className={inputClass + ' resize-none'} />
          </div>
        </div>

        <div className="w-72 shrink-0 space-y-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <label className={labelClass}>Status</label>
            <select value={status} onChange={e => setStatus(e.target.value as RecipeStatus)} className={inputClass}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
            <p className="text-xs font-medium text-gray-700">SEO</p>
            <div>
              <label className={labelClass}>Meta Title ({metaTitle.length}/60)</label>
              <input type="text" value={metaTitle} onChange={e => setMetaTitle(e.target.value)} maxLength={60} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Meta Description ({metaDescription.length}/160)</label>
              <textarea value={metaDescription} onChange={e => setMetaDescription(e.target.value)} maxLength={160} rows={3} className={inputClass + ' resize-none'} />
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-xs font-medium text-gray-700 mb-2">Categories</p>
            <div className="space-y-1.5">
              {categories.map(cat => (
                <label key={cat.id} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={selectedCategoryIds.includes(cat.id)} onChange={() => toggleCategory(cat.id)} className="rounded" />
                  <span className="text-xs text-gray-700">{cat.name}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
