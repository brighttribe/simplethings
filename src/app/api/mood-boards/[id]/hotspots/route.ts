import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = createServiceClient()
  const { data, error } = await db
    .from('mood_board_hotspots')
    .select('*')
    .eq('mood_board_id', id)
    .order('sort_order')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { position_x, position_y, title, retailer, url } = body

  const db = createServiceClient()

  // Get max sort_order
  const { data: maxRow } = await db
    .from('mood_board_hotspots')
    .select('sort_order')
    .eq('mood_board_id', id)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle()

  const sort_order = (maxRow?.sort_order ?? -1) + 1

  const { data, error } = await db
    .from('mood_board_hotspots')
    .insert({ mood_board_id: id, position_x, position_y, title, retailer, url, sort_order })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
