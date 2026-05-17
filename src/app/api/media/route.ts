import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = createServiceClient()
  const { data, error } = await db.storage.from('media').list('', {
    limit: 500,
    offset: 0,
    sortBy: { column: 'created_at', order: 'desc' },
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const files = (data ?? [])
    .filter(f => f.name !== '.emptyFolderPlaceholder')
    .map(f => ({
      name: f.name,
      size: f.metadata?.size ?? 0,
      created_at: f.created_at,
      url: db.storage.from('media').getPublicUrl(f.name).data.publicUrl,
    }))

  return NextResponse.json(files)
}

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name } = await request.json()
  if (!name) return NextResponse.json({ error: 'No filename' }, { status: 400 })

  const db = createServiceClient()
  const { error } = await db.storage.from('media').remove([name])
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
