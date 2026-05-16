import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim() ?? ''
  if (!q) return NextResponse.json({ posts: [], recipes: [] })

  const db = createServiceClient()

  const [postsRes, recipesRes] = await Promise.all([
    db.from('blog_posts')
      .select('id, title, slug, hero_image_url, published_at, meta_description')
      .eq('status', 'published')
      .textSearch('search_vector', q, { type: 'websearch' })
      .limit(10),
    db.from('recipes')
      .select('id, title, slug, featured_image_url, published_at, description')
      .eq('status', 'published')
      .textSearch('search_vector', q, { type: 'websearch' })
      .limit(10),
  ])

  return NextResponse.json({
    posts: postsRes.data ?? [],
    recipes: recipesRes.data ?? [],
  })
}
