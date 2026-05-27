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

async function getPost(slug: string) {
  const db = createServiceClient()
  const { data } = await db
    .from('blog_posts')
    .select('*, blog_post_categories(categories(id, name, slug)), blog_post_tags(blog_tags(name, slug))')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()
  return data
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) return {}
  const url = `${SITE_URL}/blog/${slug}`
  const title = post.meta_title || post.title
  const description = post.meta_description || ''
  return {
    title: `${title} | ${SITE_NAME}`,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      url,
      title,
      description,
      publishedTime: post.published_at ?? undefined,
      authors: ['Holly Dempsey'],
      siteName: SITE_NAME,
      ...(post.hero_image_url ? { images: [{ url: post.hero_image_url, width: 1500, alt: title }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(post.hero_image_url ? { images: [post.hero_image_url] } : {}),
    },
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const db = createServiceClient()

  const [post, { data: recentPosts }, { data: categories }] = await Promise.all([
    getPost(slug),
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

  if (!post) notFound()

  const primaryCat = (post.blog_post_categories as any[])?.[0]?.categories ?? null
  const tags = (post.blog_post_tags as any[])?.map((t: any) => t.blog_tags).filter(Boolean) ?? []

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.meta_description || '',
    url: `${SITE_URL}/blog/${slug}`,
    datePublished: post.published_at,
    dateModified: post.published_at,
    author: { '@type': 'Person', name: 'Holly Dempsey', url: `${SITE_URL}/about` },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo.png` },
    },
    ...(post.hero_image_url ? { image: { '@type': 'ImageObject', url: post.hero_image_url } } : {}),
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}/blog/${slug}` },
  }

  // Related posts: same category, excluding current
  let relatedPosts: any[] = []
  if (primaryCat) {
    const { data: catPosts } = await db
      .from('blog_post_categories')
      .select('blog_posts(id, title, slug, hero_image_url, published_at)')
      .eq('category_id', primaryCat.id)
      .limit(5)
    relatedPosts = (catPosts ?? [])
      .map((r: any) => r.blog_posts)
      .filter((p: any) => p && p.id !== post.id)
      .slice(0, 4)
  }
  if (relatedPosts.length < 4) {
    const { data: fallback } = await db
      .from('blog_posts')
      .select('id, title, slug, hero_image_url, published_at')
      .eq('status', 'published')
      .neq('id', post.id)
      .order('published_at', { ascending: false })
      .limit(4 - relatedPosts.length)
    const existingIds = new Set(relatedPosts.map((p: any) => p.id))
    relatedPosts = [...relatedPosts, ...(fallback ?? []).filter((p: any) => !existingIds.has(p.id))]
  }

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
              {post.title}
            </h1>
            <div className="flex items-center gap-3 text-xs text-gray-400 mb-5">
              <span>By Holly Dempsey</span>
            </div>

            {/* Hero image */}
            {post.hero_image_url && (
              <div className="aspect-[16/9] rounded-xl overflow-hidden bg-[#e4ede2] mb-8">
                <Image src={post.hero_image_url} alt={post.title} width={800} height={450}
                  className="w-full h-full object-cover" priority />
              </div>
            )}

            {/* Content */}
            {post.content_html && (
              <div
                className="prose prose-stone prose-lg max-w-none
                  prose-headings:font-serif prose-headings:text-[#1e1c19]
                  prose-p:text-[#3c3a36] prose-p:leading-relaxed
                  prose-a:text-[#3d5c3a] prose-a:no-underline hover:prose-a:underline
                  prose-blockquote:border-l-[#3d5c3a] prose-blockquote:font-serif prose-blockquote:text-xl prose-blockquote:text-[#1e1c19] prose-blockquote:not-italic
                  prose-img:rounded-xl prose-img:w-full"
                dangerouslySetInnerHTML={{ __html: post.content_html }}
              />
            )}

            {/* Tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mt-8 pt-6 border-t border-[#e8e2d9]">
                <span className="text-xs text-gray-400">Tags:</span>
                {tags.map((tag: any) => (
                  <Link key={tag.slug} href={`/tag/${tag.slug}`}
                    className="px-3 py-1 rounded-full text-xs bg-[#e4ede2] text-[#3d5c3a] hover:bg-[#c8d9c5] transition-colors">
                    {tag.name}
                  </Link>
                ))}
              </div>
            )}

            {/* Share buttons – bottom */}
            <div className="mt-8 pt-6 border-t border-[#e8e2d9]">
              <ShareButtons title={post.title} image={post.hero_image_url ?? undefined} />
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
                {(recentPosts ?? []).filter(p => p.id !== post.id).slice(0, 4).map(p => (
                  <Link key={p.id} href={`/blog/${p.slug}`} className="group flex gap-3 items-start">
                    <div className="w-16 h-12 rounded-lg overflow-hidden bg-[#e4ede2] shrink-0">
                      {p.hero_image_url
                        ? <Image src={p.hero_image_url} alt={p.title} width={64} height={48} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        : <div className="w-full h-full bg-[#c8d9c5]" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-[#1e1c19] leading-snug group-hover:text-[#3d5c3a] transition-colors line-clamp-2">{p.title}</p>
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

        {/* ── Related posts ── */}
        {relatedPosts.length > 0 && (
          <div className="mt-16 pt-10 border-t border-[#e8e2d9]">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-6">Related Posts</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {relatedPosts.map((p: any) => (
                <Link key={p.id} href={`/blog/${p.slug}`} className="group">
                  <div className="aspect-[4/3] rounded-xl overflow-hidden bg-[#e4ede2] mb-3">
                    {p.hero_image_url
                      ? <Image src={p.hero_image_url} alt={p.title} width={300} height={225} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      : <div className="w-full h-full bg-[#c8d9c5]" />}
                  </div>
                  <p className="font-serif text-sm font-semibold text-[#1e1c19] leading-snug group-hover:text-[#3d5c3a] transition-colors">{p.title}</p>
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
          <div className="md:flex-none">
            <NewsletterForm layout="horizontal" />
          </div>
        </div>

      </div>
    </div>
  )
}
