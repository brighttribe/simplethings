import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'
import { generateSlug } from '@/lib/blog-utils'

export async function GET() {
  const db = createServiceClient()
  const { data } = await db.from('recipes').select('id, title, slug, status, published_at, created_at').order('created_at', { ascending: false })
  return NextResponse.json(data ?? [])
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = createServiceClient()
  const slug = generateSlug(`draft-recipe-${Date.now()}`)
  const { data, error } = await db.from('recipes').insert({ title: 'New Recipe', slug, status: 'draft', ingredients: [], instructions: [] }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
