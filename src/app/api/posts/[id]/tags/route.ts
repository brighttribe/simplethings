import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = createServiceClient()
  const { data } = await db.from('blog_post_tags').select('blog_tags(*)').eq('post_id', id)
  return NextResponse.json(data?.map(r => r.blog_tags).filter(Boolean) ?? [])
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { tag_ids } = await request.json()
  const db = createServiceClient()
  await db.from('blog_post_tags').delete().eq('post_id', id)
  if (tag_ids?.length) {
    await db.from('blog_post_tags').insert(tag_ids.map((tag_id: string) => ({ post_id: id, tag_id })))
  }
  return NextResponse.json({ ok: true })
}
