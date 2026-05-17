import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'
import sharp from 'sharp'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get('file') as File
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

  const buffer = Buffer.from(await file.arrayBuffer())

  const webpBuffer = await sharp(buffer)
    .resize({ width: 1500, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer()

  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.webp`

  const db = createServiceClient()
  const { error } = await db.storage.from('media').upload(filename, webpBuffer, {
    contentType: 'image/webp',
    upsert: false,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: { publicUrl } } = db.storage.from('media').getPublicUrl(filename)
  return NextResponse.json({ url: publicUrl })
}
