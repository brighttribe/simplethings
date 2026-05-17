import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { email, name } = await request.json()

  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
  }

  const res = await fetch(
    `https://api.beehiiv.com/v2/publications/${process.env.BEEHIIV_PUBLICATION_ID}/subscriptions`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.BEEHIIV_API_KEY}`,
      },
      body: JSON.stringify({
        email,
        ...(name ? { custom_fields: [{ name: 'First Name', value: name }] } : {}),
        reactivate_existing: true,
        send_welcome_email: true,
        utm_source: 'website',
        utm_medium: 'organic',
      }),
    }
  )

  if (!res.ok) {
    const text = await res.text()
    console.error('Beehiiv error:', res.status, text)
    return NextResponse.json({ error: 'Subscription failed' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
