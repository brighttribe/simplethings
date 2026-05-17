import { createServiceClient } from '@/lib/supabase/service'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import ShareButtons from '@/components/share-buttons'
import NewsletterForm from '@/components/newsletter-form'

const SITE_URL = 'https://simplethingsmadebeautiful.com'
const SITE_NAME = 'Simple Things Made Beautiful'

function formatDate(d: string | null) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

async function getRecipe(slug: string) {
  const db = createServiceClient()
  const { data } = await db
    .from('recipes')
    .select('*, recipe_category_map(recipe_categories(id, name, slug))')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()
  return data
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const recipe = await getRecipe(slug)
  if (!recipe) return {}
  const url = `${SITE_URL}/recipes/${slug}`
  const title = recipe.meta_title || recipe.title
  const description = recipe.meta_description || recipe.description || ''
  return {
    title: `${title} | ${SITE_NAME}`,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      url,
      title,
      description,
      publishedTime: recipe.published_at ?? undefined,
      authors: ['Holly Dempsey'],
      siteName: SITE_NAME,
      ...(recipe.featured_image_url ? { images: [{ url: recipe.featured_image_url, width: 1500, alt: title }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(recipe.featured_image_url ? { images: [recipe.featured_image_url] } : {}),
    },
  }
}

export default async function RecipePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const db = createServiceClient()

  const [{ data: recipe }, { data: recentPosts }, { data: categories }] = await Promise.all([
    db
      .from('recipes')
      .select('*, recipe_category_map(recipe_categories(id, name, slug))')
      .eq('slug', slug)
      .eq('status', 'published')
      .single(),
    db
      .from('blog_posts')
      .select('id, title, slug, hero_image_url, published_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(5),
    db
      .from('categories')
      .select('id, name, slug')
      .order('name'),
  ])

  if (!recipe) notFound()

  const primaryCat = (recipe.recipe_category_map as any[])?.[0]?.recipe_categories ?? null

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: recipe.title,
    description: recipe.description || '',
    url: `${SITE_URL}/recipes/${slug}`,
    datePublished: recipe.published_at,
    author: { '@type': 'Person', name: 'Holly Dempsey', url: `${SITE_URL}/about` },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo.png` },
    },
    ...(recipe.featured_image_url ? { image: recipe.featured_image_url } : {}),
    ...(recipe.prep_time ? { prepTime: recipe.prep_time } : {}),
    ...(recipe.cook_time ? { cookTime: recipe.cook_time } : {}),
    ...(recipe.total_time ? { totalTime: recipe.total_time } : {}),
    ...(recipe.servings ? { recipeYield: recipe.servings } : {}),
    ...(recipe.ingredients?.length ? { recipeIngredient: recipe.ingredients } : {}),
    ...(recipe.instructions?.length ? {
      recipeInstructions: recipe.instructions.map((step: string, i: number) => ({
        '@type': 'HowToStep',
        position: i + 1,
        text: step,
      })),
    } : {}),
  }

  // Related recipes
  let relatedRecipes: any[] = []
  if (primaryCat) {
    const { data: catRecipes } = await db
      .from('recipe_category_map')
      .select('recipes(id, title, slug, featured_image_url, published_at)')
      .eq('category_id', primaryCat.id)
      .limit(5)
    relatedRecipes = (catRecipes ?? [])
      .map((r: any) => r.recipes)
      .filter((r: any) => r && r.id !== recipe.id)
      .slice(0, 4)
  }
  if (relatedRecipes.length < 4) {
    const { data: fallback } = await db
      .from('recipes')
      .select('id, title, slug, featured_image_url, published_at')
      .eq('status', 'published')
      .neq('id', recipe.id)
      .order('published_at', { ascending: false })
      .limit(4 - relatedRecipes.length)
    const existingIds = new Set(relatedRecipes.map((r: any) => r.id))
    relatedRecipes = [...relatedRecipes, ...(fallback ?? []).filter((r: any) => !existingIds.has(r.id))]
  }

  const hasTimes = recipe.prep_time || recipe.cook_time || recipe.total_time || recipe.servings

  return (
    <div className="bg-[#faf7f2]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex gap-10 items-start">

          {/* ── Main content ── */}
          <article className="flex-1 min-w-0 bg-white rounded-2xl p-8">

            {/* Category + title + meta */}
            {primaryCat && (
              <Link href={`/category/${primaryCat.slug}`}
                className="inline-block text-[10px] font-semibold uppercase tracking-widest text-[#3d5c3a] mb-3">
                {primaryCat.name}
              </Link>
            )}
            <h1 className="font-serif text-3xl md:text-4xl font-bold text-[#1e1c19] leading-tight mb-4">
              {recipe.title}
            </h1>
            <div className="flex items-center gap-3 text-xs text-gray-400 mb-5">
              <span>By Holly Dempsey</span>
              <span>·</span>
              <span>{formatDate(recipe.published_at)}</span>
            </div>

            {/* Featured image */}
            {recipe.featured_image_url && (
              <div className="aspect-[16/9] rounded-xl overflow-hidden bg-[#e4ede2] mb-8">
                <Image src={recipe.featured_image_url} alt={recipe.title} width={800} height={450}
                  className="w-full h-full object-cover" priority />
              </div>
            )}

            {/* Description */}
            {recipe.description && (
              <p className="text-base text-[#3c3a36] leading-relaxed mb-8">{recipe.description}</p>
            )}

            {/* Time + servings card */}
            {hasTimes && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-[#e4ede2] rounded-xl p-5 mb-8">
                {recipe.prep_time && (
                  <div className="text-center">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1">Prep Time</p>
                    <p className="font-serif text-lg font-semibold text-[#1e1c19]">{recipe.prep_time}</p>
                  </div>
                )}
                {recipe.cook_time && (
                  <div className="text-center">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1">Cook Time</p>
                    <p className="font-serif text-lg font-semibold text-[#1e1c19]">{recipe.cook_time}</p>
                  </div>
                )}
                {recipe.total_time && (
                  <div className="text-center">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1">Total Time</p>
                    <p className="font-serif text-lg font-semibold text-[#1e1c19]">{recipe.total_time}</p>
                  </div>
                )}
                {recipe.servings && (
                  <div className="text-center">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1">Servings</p>
                    <p className="font-serif text-lg font-semibold text-[#1e1c19]">{recipe.servings}</p>
                  </div>
                )}
              </div>
            )}

            {/* Ingredients */}
            {recipe.ingredients?.length > 0 && (
              <div className="mb-8">
                <h2 className="font-serif text-xl font-semibold text-[#1e1c19] mb-4">Ingredients</h2>
                <ul className="space-y-2">
                  {recipe.ingredients.map((ing: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-[#3c3a36]">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#3d5c3a] shrink-0" />
                      {ing}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Instructions */}
            {recipe.instructions?.length > 0 && (
              <div className="mb-8">
                <h2 className="font-serif text-xl font-semibold text-[#1e1c19] mb-4">Instructions</h2>
                <ol className="space-y-4">
                  {recipe.instructions.map((step: string, i: number) => (
                    <li key={i} className="flex gap-4 text-sm text-[#3c3a36]">
                      <span className="font-serif text-lg font-bold text-[#3d5c3a] shrink-0 w-6 leading-tight">{i + 1}.</span>
                      <p className="leading-relaxed">{step}</p>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Notes */}
            {recipe.notes && (
              <div className="bg-[#e4ede2] rounded-xl p-5 mb-8">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[#3d5c3a] mb-2">Notes</p>
                <p className="text-sm text-[#3c3a36] leading-relaxed">{recipe.notes}</p>
              </div>
            )}

            {/* Share buttons – bottom */}
            <div className="mt-8 pt-6 border-t border-[#e8e2d9]">
              <ShareButtons title={recipe.title} image={recipe.featured_image_url ?? undefined} />
            </div>
          </article>

          {/* ── Sidebar ── */}
          <aside className="hidden lg:block w-72 shrink-0 space-y-8 sticky top-24">

            {/* Holly bio */}
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-[#e4ede2] mx-auto mb-3 overflow-hidden border-2 border-[#c8d9c5]">
                <Image src="/holly.webp" alt="Holly" width={80} height={80} className="w-full h-full object-cover" />
              </div>
              <p className="font-serif text-lg font-semibold text-[#1e1c19]">Hello, I&apos;m Holly</p>
              <p className="text-xs text-gray-500 leading-relaxed mt-1 mb-3 px-2">
                Certified interior designer, Georgia girl, wife, mom, and grandma. Making your home feel like the best version of you.
              </p>
              <Link href="/about" className="inline-block px-5 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-white bg-[#1e1c19] rounded hover:bg-[#3d5c3a] transition-colors">
                About Me
              </Link>
              <p className="font-serif italic text-[#3d5c3a] text-lg mt-3 opacity-70">Holly</p>
            </div>

            <div className="border-t border-[#e8e2d9]" />

            {/* Recent posts */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-4">Recent Posts</p>
              <div className="space-y-4">
                {(recentPosts ?? []).slice(0, 4).map(p => (
                  <Link key={p.id} href={`/blog/${p.slug}`} className="group flex gap-3 items-start">
                    <div className="w-16 h-12 rounded-lg overflow-hidden bg-[#e4ede2] shrink-0">
                      {p.hero_image_url
                        ? <Image src={p.hero_image_url} alt={p.title} width={64} height={48} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        : <div className="w-full h-full bg-[#c8d9c5]" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-[#1e1c19] leading-snug group-hover:text-[#3d5c3a] transition-colors line-clamp-2">{p.title}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{formatDate(p.published_at)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div className="border-t border-[#e8e2d9]" />

            {/* Categories */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-3">Categories</p>
              <div className="space-y-1">
                {(categories ?? []).map(cat => (
                  <Link key={cat.id} href={`/category/${cat.slug}`}
                    className="flex items-center justify-between py-1.5 text-sm text-[#2c2a27] hover:text-[#3d5c3a] transition-colors group">
                    <span>{cat.name}</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="opacity-30 group-hover:opacity-100 transition-opacity">
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>

        {/* ── Related recipes ── */}
        {relatedRecipes.length > 0 && (
          <div className="mt-16 pt-10 border-t border-[#e8e2d9]">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-6">More Recipes</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {relatedRecipes.map((r: any) => (
                <Link key={r.id} href={`/recipes/${r.slug}`} className="group">
                  <div className="aspect-[4/3] rounded-xl overflow-hidden bg-[#e4ede2] mb-3">
                    {r.featured_image_url
                      ? <Image src={r.featured_image_url} alt={r.title} width={300} height={225} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      : <div className="w-full h-full bg-[#c8d9c5]" />}
                  </div>
                  <p className="font-serif text-sm font-semibold text-[#1e1c19] leading-snug group-hover:text-[#3d5c3a] transition-colors">{r.title}</p>
                  <p className="text-[11px] text-gray-400 mt-1">{formatDate(r.published_at)}</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── Newsletter strip ── */}
        <div className="mt-16 bg-[#e4ede2] rounded-2xl px-8 py-10 flex flex-col md:flex-row items-center gap-6">
          <div className="md:flex-1">
            <p className="font-serif text-xl font-semibold text-[#1e1c19]">Get Curated Home Inspiration</p>
            <p className="text-sm text-gray-600 mt-1">Sign up to receive decorating ideas, seasonal styling tips, and beautiful inspiration — delivered to your inbox.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 md:flex-none">
            <input type="text" placeholder="Your name" className="px-4 py-2 text-sm border border-[#c8d9c5] rounded-lg focus:outline-none bg-white w-36" />
            <input type="email" placeholder="Your email" className="px-4 py-2 text-sm border border-[#c8d9c5] rounded-lg focus:outline-none bg-white w-48" />
            <button className="px-5 py-2 text-sm font-semibold text-white bg-[#1e1c19] rounded-lg hover:bg-[#3d5c3a] transition-colors whitespace-nowrap">Subscribe</button>
          </div>
        </div>

      </div>
    </div>
  )
}
