import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const body = await request.json()
  const { first_name, last_name, email, phone, subject, details } = body

  if (!first_name || !last_name || !email) {
    return NextResponse.json({ error: 'Required fields missing' }, { status: 400 })
  }

  const db = createServiceClient()
  const { error } = await db.from('contact_submissions').insert({
    first_name, last_name, email,
    phone: phone || null,
    subject: subject || null,
    details: details || null,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
