import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = createServiceClient()
  const { data, error } = await db.from('recipes').select('*, recipe_category_map(recipe_categories(id, name, slug))').eq('id', id).single()
  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json(data)
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { category_ids, ...recipeData } = body
  const db = createServiceClient()

  const { data, error } = await db.from('recipes').update(recipeData).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (category_ids !== undefined) {
    await db.from('recipe_category_map').delete().eq('recipe_id', id)
    if (category_ids.length > 0) {
      await db.from('recipe_category_map').insert(category_ids.map((category_id: string) => ({ recipe_id: id, category_id })))
    }
  }

  return NextResponse.json(data)
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = createServiceClient()
  await db.from('recipes').delete().eq('id', id)
  return NextResponse.json({ ok: true })
}
