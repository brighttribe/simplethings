import { createServiceClient } from '@/lib/supabase/service'
import Link from 'next/link'
import Image from 'next/image'

function formatDate(d: string | null) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const query = q?.trim() ?? ''

  if (!query) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-400 text-sm">Enter a search term to find posts and recipes.</p>
      </div>
    )
  }

  const db = createServiceClient()
  const pattern = `%${query}%`

  const [{ data: posts }, { data: recipes }] = await Promise.all([
    db
      .from('blog_posts')
      .select('id, title, slug, hero_image_url, published_at, content_html')
      .eq('status', 'published')
      .or(`title.ilike.${pattern},content_html.ilike.${pattern}`)
      .order('published_at', { ascending: false })
      .limit(20),
    db
      .from('recipes')
      .select('id, title, slug, featured_image_url, published_at, description')
      .eq('status', 'published')
      .or(`title.ilike.${pattern},description.ilike.${pattern}`)
      .order('published_at', { ascending: false })
      .limit(20),
  ])

  const totalCount = (posts?.length ?? 0) + (recipes?.length ?? 0)

  return (
    <div className="bg-[#faf7f2] min-h-screen">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="bg-white rounded-2xl p-8">

        <div className="mb-8">
          <h1 className="font-serif text-2xl font-semibold text-[#1e1c19]">
            Search results for &ldquo;{query}&rdquo;
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            {totalCount === 0 ? 'No results found' : `${totalCount} result${totalCount === 1 ? '' : 's'}`}
          </p>
        </div>

        {totalCount === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-400 text-sm">Try a different search term.</p>
          </div>
        )}

        {/* Blog posts */}
        {(posts?.length ?? 0) > 0 && (
          <section className="mb-10">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-4">Blog Posts</p>
            <div className="space-y-5">
              {posts!.map(post => {
                const excerpt = post.content_html
                  ? post.content_html.replace(/<[^>]+>/g, '').slice(0, 120) + '…'
                  : ''
                return (
                  <article key={post.id} className="group flex gap-4 pb-5 border-b border-[#e8e2d9] last:border-0">
                    <Link href={`/blog/${post.slug}`} className="flex-shrink-0">
                      <div className="w-28 h-20 rounded-lg overflow-hidden bg-[#e4ede2]">
                        {post.hero_image_url
                          ? <Image src={post.hero_image_url} alt={post.title} width={140} height={100} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          : <div className="w-full h-full bg-[#c8d9c5]" />}
                      </div>
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link href={`/blog/${post.slug}`}>
                        <h2 className="font-serif text-base font-semibold text-[#1e1c19] leading-snug group-hover:text-[#3d5c3a] transition-colors">
                          {post.title}
                        </h2>
                      </Link>
                      {excerpt && <p className="text-xs text-gray-500 mt-1 leading-relaxed line-clamp-2">{excerpt}</p>}
                      <p className="text-[11px] text-gray-400 mt-1">{formatDate(post.published_at)}</p>
                    </div>
                  </article>
                )
              })}
            </div>
          </section>
        )}

        {/* Recipes */}
        {(recipes?.length ?? 0) > 0 && (
          <section>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-4">Recipes</p>
            <div className="space-y-5">
              {recipes!.map(recipe => (
                <article key={recipe.id} className="group flex gap-4 pb-5 border-b border-[#e8e2d9] last:border-0">
                  <Link href={`/recipes/${recipe.slug}`} className="flex-shrink-0">
                    <div className="w-28 h-20 rounded-lg overflow-hidden bg-[#e4ede2]">
                      {recipe.featured_image_url
                        ? <Image src={recipe.featured_image_url} alt={recipe.title} width={140} height={100} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        : <div className="w-full h-full bg-[#c8d9c5]" />}
                    </div>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link href={`/recipes/${recipe.slug}`}>
                      <h2 className="font-serif text-base font-semibold text-[#1e1c19] leading-snug group-hover:text-[#3d5c3a] transition-colors">
                        {recipe.title}
                      </h2>
                    </Link>
                    {recipe.description && (
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed line-clamp-2">{recipe.description}</p>
                    )}
                    <p className="text-[11px] text-gray-400 mt-1">{formatDate(recipe.published_at)}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        </div>
      </div>
    </div>
  )
}
