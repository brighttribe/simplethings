import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'
import { generateSlug } from '@/lib/blog-utils'

export async function GET() {
  const db = createServiceClient()
  const { data: cats } = await db.from('recipe_categories').select('*').order('name')
  if (!cats) return NextResponse.json([])

  const { data: counts } = await db
    .from('recipe_category_map')
    .select('category_id')

  const countMap: Record<string, number> = {}
  for (const row of counts ?? []) {
    countMap[row.category_id] = (countMap[row.category_id] ?? 0) + 1
  }

  return NextResponse.json(cats.map(c => ({ ...c, recipe_count: countMap[c.id] ?? 0 })))
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { name } = await request.json()
  const db = createServiceClient()
  const { data, error } = await db.from('recipe_categories').insert({ name, slug: generateSlug(name) }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, deleteRecipes } = await request.json()
  const db = createServiceClient()

  // Find all recipe IDs assigned to this category
  const { data: assignments } = await db
    .from('recipe_category_map')
    .select('recipe_id')
    .eq('category_id', id)

  const recipeIds = (assignments ?? []).map(a => a.recipe_id)

  if (recipeIds.length > 0) {
    if (deleteRecipes) {
      // Delete the recipes themselves (cascade removes junction rows)
      await db.from('recipes').delete().in('id', recipeIds)
    } else {
      // Get or create the "Recipes" fallback category
      let { data: fallback } = await db
        .from('recipe_categories')
        .select('id')
        .eq('slug', 'recipes')
        .neq('id', id)
        .single()

      if (!fallback) {
        const { data: created } = await db
          .from('recipe_categories')
          .insert({ name: 'Recipes', slug: 'recipes' })
          .select('id')
          .single()
        fallback = created
      }

      if (fallback) {
        // Reassign recipes — upsert to avoid conflicts if a recipe is already in "Recipes"
        const rows = recipeIds.map(recipe_id => ({ recipe_id, category_id: fallback!.id }))
        await db.from('recipe_category_map').upsert(rows, { onConflict: 'recipe_id,category_id', ignoreDuplicates: true })
      }
    }
  }

  // Delete the category (cascade removes its junction rows)
  await db.from('recipe_categories').delete().eq('id', id)
  return NextResponse.json({ ok: true })
}
