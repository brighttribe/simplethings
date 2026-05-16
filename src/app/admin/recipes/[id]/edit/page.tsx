import { requireAuth } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/service'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import RecipeEditor from '@/components/admin/recipe-editor'
import type { Recipe, RecipeCategory } from '@/lib/types'

export default async function EditRecipePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await requireAuth()
  const db = createServiceClient()

  const [{ data: recipe }, { data: categories }] = await Promise.all([
    db.from('recipes').select('*, recipe_category_map(recipe_categories(id, name, slug))').eq('id', id).single(),
    db.from('recipe_categories').select('*').order('name'),
  ])

  if (!recipe) notFound()

  return (
    <Suspense>
      <RecipeEditor recipe={recipe as Recipe} categories={(categories ?? []) as RecipeCategory[]} />
    </Suspense>
  )
}
