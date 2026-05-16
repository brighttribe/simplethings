import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'
import { generateSlug } from '@/lib/blog-utils'

export async function GET() {
  const db = createServiceClient()
  const { data } = await db.from('categories').select('*').order('name')
  return NextResponse.json(data ?? [])
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { name } = await request.json()
  const db = createServiceClient()
  const { data, error } = await db.from('categories').insert({ name, slug: generateSlug(name) }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await request.json()
  const db = createServiceClient()
  await db.from('categories').delete().eq('id', id)
  return NextResponse.json({ ok: true })
}
