import { createServiceClient } from '@/lib/supabase/service'
import Link from 'next/link'
import Image from 'next/image'

export const metadata = {
  title: 'Recipes',
}

export default async function RecipesPage() {
  const db = createServiceClient()
  const { data: recipes } = await db
    .from('recipes')
    .select('id, title, slug, featured_image_url, description')
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  return (
    <div className="bg-[#faf7f2] min-h-screen">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <h1 className="font-serif text-4xl text-[#1e1c19] mb-2">Recipes</h1>
        <p className="text-[#a8a098] mb-10">Simple, beautiful food for everyday life.</p>

        {(!recipes || recipes.length === 0) ? (
          <p className="text-[#a8a098] text-sm">No recipes published yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recipes.map(recipe => (
              <Link
                key={recipe.id}
                href={`/recipes/${recipe.slug}`}
                className="group bg-white rounded-2xl overflow-hidden border border-[#e8e2d9] hover:shadow-lg transition-shadow"
              >
                <div className="aspect-[4/3] overflow-hidden bg-[#e4ede2]">
                  {recipe.featured_image_url ? (
                    <Image
                      src={recipe.featured_image_url}
                      alt={recipe.title}
                      width={600}
                      height={450}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[#a8a098]">
                        <path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>
                      </svg>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h2 className="font-semibold text-[#1e1c19] text-base mb-1 group-hover:text-[#3d5c3a] transition-colors">
                    {recipe.title}
                  </h2>
                  {recipe.description && (
                    <p className="text-sm text-[#a8a098] line-clamp-2">{recipe.description}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
