import { requireAuth } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import { generateSlug } from '@/lib/blog-utils'

export default async function NewPostPage() {
  await requireAuth()
  const db = createServiceClient()
  const slug = generateSlug(`draft-${Date.now()}`)
  const { data } = await db
    .from('blog_posts')
    .insert({ title: 'New Post', slug, status: 'draft' })
    .select()
    .single()
  if (data) redirect(`/admin/posts/${data.id}/edit`)
  redirect('/admin/posts')
}
