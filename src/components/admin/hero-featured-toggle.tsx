'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  postId: string
  isHero: boolean
  isFeatured: boolean
  featuredOrder: number | null
  heroPostId: string | null
  leftPostId: string | null
  rightPostId: string | null
}

export function HeroFeaturedToggle({ postId, isHero, isFeatured, featuredOrder, heroPostId, leftPostId, rightPostId }: Props) {
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

  const heroTaken = heroPostId !== null && heroPostId !== postId
  const leftActive = isFeatured && featuredOrder === 1
  const rightActive = isFeatured && featuredOrder === 2
  const leftTaken = leftPostId !== null && leftPostId !== postId
  const rightTaken = rightPostId !== null && rightPostId !== postId

  return (
    <div className="flex items-center gap-3">
      {/* Hero checkbox */}
      <label className={`flex items-center gap-1.5 ${heroTaken ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}>
        <input
          type="checkbox"
          checked={isHero}
          disabled={saving || heroTaken}
          onChange={() => patch({ is_hero: !isHero })}
          className="rounded border-gray-300 text-gray-900 focus:ring-0 cursor-pointer disabled:cursor-not-allowed"
        />
        <span className="text-xs text-gray-600">Hero</span>
      </label>

      {/* Featured Left / Right */}
      <div className="flex items-center gap-1">
        <button
          disabled={saving || leftTaken}
          onClick={() => patch({ is_featured: !leftActive, featured_order: !leftActive ? 1 : null })}
          className={`px-2 py-0.5 text-[10px] font-medium rounded transition-colors ${
            leftActive
              ? 'bg-blue-500 text-white'
              : leftTaken
              ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
              : 'bg-gray-100 text-gray-500 hover:bg-blue-50 hover:text-blue-600'
          }`}
        >
          Left
        </button>
        <button
          disabled={saving || rightTaken}
          onClick={() => patch({ is_featured: !rightActive, featured_order: !rightActive ? 2 : null })}
          className={`px-2 py-0.5 text-[10px] font-medium rounded transition-colors ${
            rightActive
              ? 'bg-blue-500 text-white'
              : rightTaken
              ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
              : 'bg-gray-100 text-gray-500 hover:bg-blue-50 hover:text-blue-600'
          }`}
        >
          Right
        </button>
      </div>
    </div>
  )
}
