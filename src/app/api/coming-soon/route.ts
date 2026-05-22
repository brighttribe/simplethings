import { createServiceClient } from '@/lib/supabase/service'
import { requireAuth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  await requireAuth()
  const { enabled } = await req.json()
  const db = createServiceClient()
  await db.from('site_settings').update({ value: String(enabled) }).eq('key', 'coming_soon')
  return NextResponse.json({ ok: true })
}
