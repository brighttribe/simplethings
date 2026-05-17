import { createServiceClient } from '@/lib/supabase/service'
import { requireAuth } from '@/lib/auth'
import { notFound } from 'next/navigation'
import CategoryEditor from '@/components/admin/category-editor'

export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAuth()
  const { id } = await params
  const db = createServiceClient()
  const { data: category } = await db.from('categories').select('*').eq('id', id).single()
  if (!category) notFound()

  return (
    <CategoryEditor
      category={category}
      apiPath="/api/categories"
      backPath="/admin/categories"
      backLabel="categories"
    />
  )
}
