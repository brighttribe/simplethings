import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { category_ids } = await request.json()
  const db = createServiceClient()
  await db.from('recipe_category_map').delete().eq('recipe_id', id)
  if (category_ids?.length) {
    await db.from('recipe_category_map').insert(
      category_ids.map((category_id: string) => ({ recipe_id: id, category_id }))
    )
  }
  return NextResponse.json({ ok: true })
}
