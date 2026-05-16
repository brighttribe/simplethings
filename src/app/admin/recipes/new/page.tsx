import { requireAuth } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import { generateSlug } from '@/lib/blog-utils'

export default async function NewRecipePage() {
  await requireAuth()
  const db = createServiceClient()
  const slug = generateSlug(`draft-recipe-${Date.now()}`)
  const { data } = await db
    .from('recipes')
    .insert({ title: 'New Recipe', slug, status: 'draft', ingredients: [], instructions: [] })
    .select()
    .single()
  if (data) redirect(`/admin/recipes/${data.id}/edit`)
  redirect('/admin/recipes')
}
