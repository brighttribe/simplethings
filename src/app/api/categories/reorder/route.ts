import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const updates: { id: string; sort_order: number }[] = await request.json()
  const db = createServiceClient()

  await Promise.all(
    updates.map(({ id, sort_order }) =>
      db.from('categories').update({ sort_order }).eq('id', id)
    )
  )

  return NextResponse.json({ ok: true })
}
