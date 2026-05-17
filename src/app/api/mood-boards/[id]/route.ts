import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = createServiceClient()
  const { data: board, error } = await db
    .from('mood_boards')
    .select('*')
    .eq('id', id)
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 404 })

  const { data: hotspots } = await db
    .from('mood_board_hotspots')
    .select('*')
    .eq('mood_board_id', id)
    .order('sort_order')

  return NextResponse.json({ ...board, hotspots: hotspots ?? [] })
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const db = createServiceClient()

  if (body.slug) {
    const { data: existing } = await db
      .from('mood_boards')
      .select('id')
      .eq('slug', body.slug)
      .neq('id', id)
      .maybeSingle()
    if (existing) return NextResponse.json({ error: 'Slug already in use' }, { status: 409 })
  }

  const { data, error } = await db
    .from('mood_boards')
    .update(body)
    .eq('id', id)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = createServiceClient()
  await db.from('mood_boards').delete().eq('id', id)
  return NextResponse.json({ ok: true })
}
