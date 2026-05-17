'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Category { id: string; name: string }

interface CategorySelectProps {
  postId: string
  currentCategoryId: string | null
  categories: Category[]
  apiPath: string
}

export function CategorySelect({ postId, currentCategoryId, categories, apiPath }: CategorySelectProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value
    setSaving(true)
    await fetch(`${apiPath}/${postId}/categories`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category_ids: value ? [value] : [] }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
    router.refresh()
  }

  return (
    <div className="relative">
      <select
        defaultValue={currentCategoryId ?? ''}
        onChange={handleChange}
        disabled={saving}
        className="text-xs text-gray-600 border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-stone-300 rounded px-1 py-0.5 cursor-pointer hover:bg-gray-100 disabled:opacity-50 max-w-[100px]"
      >
        <option value="">— none —</option>
        {categories.map(c => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
      {saved && <span className="absolute -top-4 left-0 text-[10px] text-green-600 font-medium">Saved</span>}
    </div>
  )
}
