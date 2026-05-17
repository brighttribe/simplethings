'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  postId: string
  isHero: boolean
  isFeatured: boolean
  featuredOrder: number | null
  heroSlotTaken: boolean
  featuredSlotsFull: boolean
}

export function HeroFeaturedToggle({ postId, isHero, isFeatured, featuredOrder, heroSlotTaken, featuredSlotsFull }: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  async function patch(body: Record<string, unknown>) {
    setSaving(true)
    await fetch(`/api/posts/${postId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    router.refresh()
    setSaving(false)
  }

  return (
    <div className="flex items-center gap-1.5">
      {/* Hero toggle */}
      <button
        disabled={saving || (heroSlotTaken && !isHero)}
        onClick={() => patch({ is_hero: !isHero })}
        title={heroSlotTaken && !isHero ? 'Hero slot taken' : isHero ? 'Unset hero' : 'Set as hero'}
        className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors ${
          isHero
            ? 'bg-amber-400 text-amber-900'
            : heroSlotTaken
            ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
            : 'bg-gray-100 text-gray-400 hover:bg-amber-100 hover:text-amber-700'
        }`}
      >
        Hero
      </button>

      {/* Featured toggle */}
      <button
        disabled={saving || (featuredSlotsFull && !isFeatured)}
        onClick={() => patch({
          is_featured: !isFeatured,
          featured_order: !isFeatured ? (featuredOrder ?? 1) : null,
        })}
        title={featuredSlotsFull && !isFeatured ? 'Both featured slots taken' : isFeatured ? 'Unset featured' : 'Set as featured'}
        className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors ${
          isFeatured
            ? 'bg-blue-400 text-blue-900'
            : featuredSlotsFull
            ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
            : 'bg-gray-100 text-gray-400 hover:bg-blue-100 hover:text-blue-700'
        }`}
      >
        {isFeatured ? `F${featuredOrder ?? ''}` : 'Feat'}
      </button>
    </div>
  )
}
