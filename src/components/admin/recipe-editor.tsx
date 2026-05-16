'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Recipe, RecipeCategory, RecipeStatus } from '@/lib/types'
import { generateSlug } from '@/lib/blog-utils'

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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Edit Recipe</h1>
        <div className="flex gap-2">
          <button onClick={handleSave} disabled={saving}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50">
            {savedIndicator ? 'Saved!' : saving ? 'Saving...' : 'Save Draft'}
          </button>
          <button onClick={handlePublish} disabled={saving}
            className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-700 disabled:opacity-50">
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
              <label className={labelClass}>URL Slug</label>
              <input type="text" value={slug}
                onChange={e => { setSlugEdited(true); setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')) }}
                className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className={inputClass + ' resize-none'} />
            </div>
            <div>
              <label className={labelClass}>Featured Image URL</label>
              <input type="text" value={featuredImageUrl} onChange={e => setFeaturedImageUrl(e.target.value)} className={inputClass} />
              {featuredImageUrl && <img src={featuredImageUrl} alt="" className="mt-2 w-full rounded-lg object-cover aspect-video" />}
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
