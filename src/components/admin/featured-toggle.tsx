'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function FeaturedToggle({
  id,
  initialFeatured,
  featuredCount,
  limit,
}: {
  id: string
  initialFeatured: boolean
  featuredCount: number
  limit: number
}) {
  const [isFeatured, setIsFeatured] = useState(initialFeatured)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function toggle() {
    const newVal = !isFeatured
    if (newVal && featuredCount >= limit) return
    setLoading(true)
    setIsFeatured(newVal)
    await fetch(`/api/mood-boards/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_featured: newVal }),
    })
    setLoading(false)
    router.refresh()
  }

  const disabled = loading || (!isFeatured && featuredCount >= limit)

  return (
    <label
      title={disabled ? `${limit} of ${limit} slots filled` : isFeatured ? 'Remove from homepage' : 'Feature on homepage'}
      className={`flex items-center gap-1.5 ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <input
        type="checkbox"
        checked={isFeatured}
        onChange={toggle}
        disabled={disabled}
        className="rounded accent-[#3d5c3a]"
      />
      <span className="text-xs text-gray-500 whitespace-nowrap">Featured</span>
    </label>
  )
}
