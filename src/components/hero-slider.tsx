'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'

interface Post {
  id: string
  title: string
  slug: string
  hero_image_url: string | null
  published_at: string | null
  category_name: string | null
  category_slug: string | null
}

interface HeroSliderProps {
  posts: Post[]
  showDotsBelow?: boolean
}

export default function HeroSlider({ posts, showDotsBelow = false }: HeroSliderProps) {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    if (posts.length <= 1) return
    const t = setInterval(() => setCurrent(i => (i + 1) % posts.length), 5000)
    return () => clearInterval(t)
  }, [posts.length])

  if (!posts.length) return null
  const post = posts[current]

  return (
    <div>
      {/* Image area */}
      <Link href={`/blog/${post.slug}`} className="relative block w-full aspect-[3/2] overflow-hidden bg-[#1e1c19] group cursor-pointer">
        {posts.map((p, i) => (
          <div
            key={p.id}
            className={`absolute inset-0 transition-opacity duration-700 ${i === current ? 'opacity-100' : 'opacity-0'}`}
          >
            {p.hero_image_url ? (
              <Image src={p.hero_image_url} alt={p.title} fill className="object-cover group-hover:scale-105 transition-transform duration-700" priority={i === 0} />
            ) : (
              <div className="w-full h-full bg-[#2e4529]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />
          </div>
        ))}

        {/* Title overlay at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
          {post.category_name && (
            <span className="inline-block text-[10px] font-semibold uppercase tracking-widest text-[#a8c4a5] mb-2">
              {post.category_name}
            </span>
          )}
          <h2 className="font-serif text-xl md:text-2xl font-semibold leading-snug max-w-lg group-hover:underline">
            {post.title}
          </h2>
        </div>
      </Link>

      {/* Numbered dots below image */}
      {posts.length > 1 && showDotsBelow && (
        <div className="flex items-center justify-center gap-4 py-3 bg-white border border-t-0 border-[#e8e2d9] rounded-b-xl">
          {posts.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`text-xs font-semibold tabular-nums transition-colors ${
                i === current ? 'text-[#1e1c19]' : 'text-gray-300 hover:text-gray-500'
              }`}
            >
              {String(i + 1).padStart(2, '0')}
            </button>
          ))}
        </div>
      )}

      {/* Dots overlaid (original style) */}
      {posts.length > 1 && !showDotsBelow && (
        <div className="absolute bottom-5 right-5 flex items-center gap-3">
          {posts.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`text-xs font-semibold tabular-nums transition-colors ${
                i === current ? 'text-white' : 'text-white/40 hover:text-white/70'
              }`}
            >
              {String(i + 1).padStart(2, '0')}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
