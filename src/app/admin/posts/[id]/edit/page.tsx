import { requireAuth } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/service'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import PostEditor from '@/components/admin/post-editor'
import type { BlogPost, Category } from '@/lib/types'

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await requireAuth()
  const db = createServiceClient()

  const [{ data: post }, { data: categories }] = await Promise.all([
    db.from('blog_posts')
      .select('*, blog_post_tags(blog_tags(id, name, slug)), blog_post_categories(categories(id, name, slug))')
      .eq('id', id)
      .single(),
    db.from('categories').select('*').order('name'),
  ])

  if (!post) notFound()

  return (
    <Suspense>
      <PostEditor post={post as BlogPost} categories={(categories ?? []) as Category[]} />
    </Suspense>
  )
}
