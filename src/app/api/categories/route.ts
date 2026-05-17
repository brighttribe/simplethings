import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'
import { generateSlug } from '@/lib/blog-utils'

export async function GET() {
  const db = createServiceClient()
  const { data: cats } = await db.from('categories').select('*').order('sort_order').order('name')
  if (!cats) return NextResponse.json([])

  // Include post count per category
  const { data: counts } = await db
    .from('blog_post_categories')
    .select('category_id')

  const countMap: Record<string, number> = {}
  for (const row of counts ?? []) {
    countMap[row.category_id] = (countMap[row.category_id] ?? 0) + 1
  }

  return NextResponse.json(cats.map(c => ({ ...c, post_count: countMap[c.id] ?? 0 })))
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { name, parent_id } = await request.json()
  const db = createServiceClient()
  const { data: existing } = await db.from('categories').select('sort_order').order('sort_order', { ascending: false }).limit(1)
  const nextOrder = (existing?.[0]?.sort_order ?? -1) + 1
  const { data, error } = await db.from('categories').insert({ name, slug: generateSlug(name), parent_id: parent_id ?? null, sort_order: nextOrder }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, deletePosts } = await request.json()
  const db = createServiceClient()

  // Find all post IDs assigned to this category
  const { data: assignments } = await db
    .from('blog_post_categories')
    .select('post_id')
    .eq('category_id', id)

  const postIds = (assignments ?? []).map(a => a.post_id)

  if (postIds.length > 0) {
    if (deletePosts) {
      // Delete the posts themselves (cascade removes junction rows)
      await db.from('blog_posts').delete().in('id', postIds)
    } else {
      // Get or create the "Blog" fallback category
      let { data: fallback } = await db
        .from('categories')
        .select('id')
        .eq('slug', 'blog')
        .neq('id', id)
        .single()

      if (!fallback) {
        const { data: created } = await db
          .from('categories')
          .insert({ name: 'Blog', slug: 'blog' })
          .select('id')
          .single()
        fallback = created
      }

      if (fallback) {
        // Reassign posts — upsert to avoid conflicts if a post is already in "Blog"
        const rows = postIds.map(post_id => ({ post_id, category_id: fallback!.id }))
        await db.from('blog_post_categories').upsert(rows, { onConflict: 'post_id,category_id', ignoreDuplicates: true })
      }
    }
  }

  // Delete the category (cascade removes its junction rows)
  await db.from('categories').delete().eq('id', id)
  return NextResponse.json({ ok: true })
}
