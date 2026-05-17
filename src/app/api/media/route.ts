import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = createServiceClient()
  const [{ data: storageData, error }, { data: metaRows }] = await Promise.all([
    db.storage.from('media').list('', {
      limit: 500,
      offset: 0,
      sortBy: { column: 'created_at', order: 'desc' },
    }),
    db.from('media_metadata').select('name, alt_text, caption'),
  ])

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const metaMap = Object.fromEntries((metaRows ?? []).map(r => [r.name, r]))

  const files = (storageData ?? [])
    .filter(f => f.name !== '.emptyFolderPlaceholder')
    .map(f => ({
      name: f.name,
      size: f.metadata?.size ?? 0,
      created_at: f.created_at,
      url: db.storage.from('media').getPublicUrl(f.name).data.publicUrl,
      alt_text: metaMap[f.name]?.alt_text ?? '',
      caption: metaMap[f.name]?.caption ?? '',
    }))

  return NextResponse.json(files)
}

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, alt_text, caption } = await request.json()
  if (!name) return NextResponse.json({ error: 'No filename' }, { status: 400 })

  const db = createServiceClient()
  const { error } = await db.from('media_metadata').upsert(
    { name, alt_text: alt_text ?? '', caption: caption ?? '', updated_at: new Date().toISOString() },
    { onConflict: 'name' }
  )
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name } = await request.json()
  if (!name) return NextResponse.json({ error: 'No filename' }, { status: 400 })

  const db = createServiceClient()
  await Promise.all([
    db.storage.from('media').remove([name]),
    db.from('media_metadata').delete().eq('name', name),
  ])

  return NextResponse.json({ ok: true })
}
