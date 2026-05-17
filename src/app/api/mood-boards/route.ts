import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { generateSlug } from '@/lib/blog-utils'
import { NextResponse } from 'next/server'

export async function GET() {
  const db = createServiceClient()
  const { data, error } = await db
    .from('mood_boards')
    .select('id, title, slug, status, published_at, image_url, created_at')
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { title, slug, description, image_url, ltk_url, status } = body
  if (!title?.trim()) return NextResponse.json({ error: 'Title is required' }, { status: 400 })

  const db = createServiceClient()
  const { data, error } = await db
    .from('mood_boards')
    .insert({
      title,
      slug: slug ?? generateSlug(title),
      description,
      image_url,
      ltk_url,
      status: status ?? 'draft',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
