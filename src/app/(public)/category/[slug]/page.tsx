import { createServiceClient } from '@/lib/supabase/service'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import NewsletterForm from '@/components/newsletter-form'

const SITE_URL = 'https://simplethingsmadebeautiful.com'
const SITE_NAME = 'Simple Things Made Beautiful'

function formatDate(d: string | null) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

async function getCategory(slug: string) {
  const db = createServiceClient()
  const { data } = await db
    .from('categories')
    .select('id, name, slug, description, image_url')
    .eq('slug', slug)
    .single()
  return data
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const cat = await getCategory(slug)
  if (!cat) return {}
  const url = `${SITE_URL}/category/${slug}`
  const title = cat.name
  const description = cat.description || `Browse all ${cat.name} posts`
  return {
    title: `${title} | ${SITE_NAME}`,
    description,
    alternates: { canonical: url },
    openGraph: { type: 'website', url, title, description, siteName: SITE_NAME },
  }
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const db = createServiceClient()

  const [cat, { data: recentPosts }] = await Promise.all([
    getCategory(slug),
    db
      .from('blog_posts')
      .select('id, title, slug, hero_image_url, published_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(5),
  ])

  if (!cat) notFound()

  const { data: postsRaw } = await db
    .from('blog_posts')
    .select('id, title, slug, hero_image_url, published_at, content_html, blog_post_categories!inner(category_id)')
    .eq('status', 'published')
    .eq('blog_post_categories.category_id', cat.id)
    .order('published_at', { ascending: false })

  const posts = (postsRaw ?? []) as {
    id: string
    title: string
    slug: string
    hero_image_url: string | null
    published_at: string | null
    content_html: string | null
  }[]

  return (
    <div className="bg-[#faf7f2]">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex gap-10 items-start">

          {/* ── Main content ── */}
          <div className="flex-1 min-w-0">

            {/* Category header */}
            <div className="bg-white rounded-2xl p-8 mb-6">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#3d5c3a] mb-2">Category</p>
              <h1 className="font-serif text-3xl md:text-4xl font-bold text-[#1e1c19] leading-tight">{cat.name}</h1>
              {cat.description && (
                <p className="text-sm text-gray-500 mt-3 leading-relaxed">{cat.description}</p>
              )}
            </div>

            {/* Posts grid */}
            {posts.length > 0 ? (
              <div className="space-y-5">
                {posts.map(post => {
                  const excerpt = post.content_html
                    ? post.content_html.replace(/<[^>]+>/g, '').slice(0, 120) + '…'
                    : ''
                  return (
                    <article key={post.id} className="group bg-white rounded-2xl overflow-hidden flex gap-5 p-5">
                      <Link href={`/blog/${post.slug}`} className="shrink-0">
                        <div className="w-44 h-32 rounded-xl overflow-hidden bg-[#e4ede2]">
                          {post.hero_image_url
                            ? <Image src={post.hero_image_url} alt={post.title} width={220} height={160}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            : <div className="w-full h-full bg-[#c8d9c5]" />}
                        </div>
                      </Link>
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <Link href={`/blog/${post.slug}`}>
                          <h2 className="font-serif text-lg font-semibold text-[#1e1c19] leading-snug group-hover:text-[#3d5c3a] transition-colors">
                            {post.title}
                          </h2>
                        </Link>
                        <p className="text-[11px] text-gray-400 mt-1">{formatDate(post.published_at)}</p>
                        {excerpt && (
                          <p className="text-sm text-gray-500 mt-2 leading-relaxed line-clamp-2">{excerpt}</p>
                        )}
                        <Link href={`/blog/${post.slug}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[#3d5c3a] hover:text-[#2e4529] mt-3">
                          Read More <span>›</span>
                        </Link>
                      </div>
                    </article>
                  )
                })}
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-10 text-center">
                <p className="text-gray-400 text-sm">No posts yet in this category.</p>
              </div>
            )}
          </div>

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
              <Link href="/about"
                className="inline-block px-5 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-white bg-[#1e1c19] rounded hover:bg-[#3d5c3a] transition-colors">
                About Me
              </Link>
              <p className="font-serif italic text-[#3d5c3a] text-lg mt-3 opacity-70">Holly</p>
            </div>

            <div className="border-t border-[#e8e2d9]" />

            {/* Newsletter signup */}
            <div className="bg-[#e4ede2] rounded-xl p-5 text-center">
              <p className="font-serif text-base font-semibold text-[#1e1c19] mb-1">Get Home Inspiration</p>
              <p className="text-[11px] text-gray-600 mb-3">Decorating ideas delivered to your inbox.</p>
              <NewsletterForm layout="vertical" />
            </div>

            <div className="border-t border-[#e8e2d9]" />

            {/* Recent posts */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-4">Recent Posts</p>
              <div className="space-y-4">
                {(recentPosts ?? []).map(p => (
                  <Link key={p.id} href={`/blog/${p.slug}`} className="group flex gap-3 items-start">
                    <div className="w-16 h-12 rounded-lg overflow-hidden bg-[#e4ede2] shrink-0">
                      {p.hero_image_url
                        ? <Image src={p.hero_image_url} alt={p.title} width={64} height={48}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
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

          </aside>
        </div>
      </div>
    </div>
  )
}
