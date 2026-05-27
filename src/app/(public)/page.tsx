import { createServiceClient } from '@/lib/supabase/service'
import Link from 'next/link'
import Image from 'next/image'
import HeroSlider from '@/components/hero-slider'
import NewsletterForm from '@/components/newsletter-form'

function formatDate(d: string | null) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

interface CatRef { categories: { name: string; slug: string } | null }
interface PostRow {
  id: string
  title: string
  slug: string
  hero_image_url: string | null
  published_at: string | null
  content_html: string | null
  is_hero: boolean
  is_featured: boolean
  featured_order: number | null
  blog_post_categories: CatRef[]
}

function primaryCat(post: PostRow) {
  return post.blog_post_categories?.[0]?.categories ?? null
}

interface MoodBoardRow {
  id: string
  title: string
  slug: string
  image_url: string | null
  description: string | null
}

export default async function HomePage() {
  const db = createServiceClient()

  const [{ data: raw }, { data: featuredBoards }] = await Promise.all([
    db.from('blog_posts')
      .select('id, title, slug, hero_image_url, published_at, content_html, is_hero, is_featured, featured_order, blog_post_categories(categories(name, slug))')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(30),
    db.from('mood_boards')
      .select('id, title, slug, image_url, description')
      .eq('status', 'published')
      .eq('is_featured', true)
      .limit(4),
  ])

  const posts = (raw ?? []) as unknown as PostRow[]

  // Single hero post (top of page)
  const heroPost = posts.find(p => p.is_hero) ?? posts[0] ?? null
  const heroIds = new Set(heroPost ? [heroPost.id] : [])

  // 2 featured posts below hero
  const featuredRaw = posts
    .filter(p => p.is_featured && !heroIds.has(p.id))
    .sort((a, b) => (a.featured_order ?? 99) - (b.featured_order ?? 99))
    .slice(0, 2)
  const featuredIds = new Set(featuredRaw.map(p => p.id))

  const rest = posts.filter(p => !heroIds.has(p.id) && !featuredIds.has(p.id))
  const twoup = featuredRaw.length > 0 ? featuredRaw : rest.slice(0, 2)
  const latestStart = featuredRaw.length > 0 ? 0 : 2
  const latestList = rest.slice(latestStart, latestStart + 7)

  const sliderPosts = heroPost ? (() => {
    const cat = primaryCat(heroPost)
    return [{ id: heroPost.id, title: heroPost.title, slug: heroPost.slug, hero_image_url: heroPost.hero_image_url, published_at: heroPost.published_at, category_name: cat?.name ?? null, category_slug: cat?.slug ?? null }]
  })() : []

  return (
    <div className="bg-[#faf7f2]">
      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* ── Main 2-column layout: content + persistent sidebar ── */}
        <div className="flex gap-8 items-start">

          {/* LEFT: Hero + 2-up + latest list */}
          <div className="flex-1 min-w-0 bg-white rounded-2xl overflow-hidden p-6">

            {/* Hero slider */}
            <div className="rounded-xl overflow-hidden">
              <HeroSlider posts={sliderPosts} showDotsBelow />
            </div>

            {/* ── 2-up posts ── */}
            {twoup.length > 0 && (
              <div className="grid grid-cols-2 gap-5 mt-8 pb-8 border-b border-[#e8e2d9]">
                {twoup.map(post => {
                  const cat = primaryCat(post)
                  return (
                    <article key={post.id} className="group">
                      <Link href={`/blog/${post.slug}`}>
                        <div className="aspect-[4/3] rounded-lg overflow-hidden bg-[#e4ede2] mb-3">
                          {post.hero_image_url
                            ? <Image src={post.hero_image_url} alt={post.title} width={500} height={375} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            : <div className="w-full h-full bg-[#c8d9c5]" />}
                        </div>
                      </Link>
                      <Link href={`/blog/${post.slug}`}>
                        <h3 className="font-serif text-base font-semibold text-[#1e1c19] leading-snug group-hover:text-[#3d5c3a] transition-colors">{post.title}</h3>
                      </Link>
                      {cat?.name && <p className="text-[11px] text-gray-400 mt-1">{cat.name}</p>}
                    </article>
                  )
                })}
              </div>
            )}

            {/* ── Latest posts list ── */}
            <div className="mt-8 space-y-6">
              {latestList.map(post => {
                const cat = primaryCat(post)
                const excerpt = post.content_html
                  ? post.content_html.replace(/<[^>]+>/g, '').slice(0, 110) + '…'
                  : ''
                return (
                  <article key={post.id} className="group flex gap-4 pb-6 border-b border-[#e8e2d9] last:border-0">
                    <Link href={`/blog/${post.slug}`} className="flex-shrink-0">
                      <div className="w-36 h-28 rounded-lg overflow-hidden bg-[#e4ede2]">
                        {post.hero_image_url
                          ? <Image src={post.hero_image_url} alt={post.title} width={180} height={140} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          : <div className="w-full h-full bg-[#c8d9c5]" />}
                      </div>
                    </Link>
                    <div className="flex-1 min-w-0">
                      {cat && (
                        <Link href={`/category/${cat.slug}`} className="text-[10px] font-semibold uppercase tracking-widest text-[#3d5c3a]">
                          {cat.name}
                        </Link>
                      )}
                      <Link href={`/blog/${post.slug}`}>
                        <h3 className="font-serif text-base font-semibold text-[#1e1c19] mt-0.5 leading-snug group-hover:text-[#3d5c3a] transition-colors">
                          {post.title}
                        </h3>
                      </Link>
                      {excerpt && <p className="text-xs text-gray-500 mt-1 leading-relaxed line-clamp-2">{excerpt}</p>}
                      <Link href={`/blog/${post.slug}`} className="inline-flex items-center gap-1 text-xs font-semibold text-[#3d5c3a] hover:text-[#2e4529] mt-2">
                        Read More <span>›</span>
                      </Link>
                    </div>
                  </article>
                )
              })}
              {!latestList.length && (
                <p className="text-gray-400 text-sm">Posts coming soon!</p>
              )}
            </div>
          </div>

          {/* RIGHT: Persistent sidebar */}
          <aside className="hidden lg:block w-72 shrink-0 space-y-8 sticky top-20">

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

            {/* Newsletter signup */}
            <div className="bg-[#e4ede2] rounded-xl p-5 text-center">
              <p className="font-serif text-base font-semibold text-[#1e1c19] mb-1">Get Home Inspiration</p>
              <p className="text-[11px] text-gray-600 mb-3">Decorating ideas delivered to your inbox.</p>
              <NewsletterForm layout="vertical" />
            </div>

            <div className="border-t border-[#e8e2d9]" />

            {/* Browse by Style (photo stories grid) */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-3">Browse by Style</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Decor & Styling', href: '/category/decor-styling', bg: '#c8d9c5' },
                  { label: 'Holiday', href: '/category/holiday-seasonal', bg: '#d9cfc0' },
                  { label: 'DIY', href: '/category/diy-refreshes', bg: '#c5d4dc' },
                  { label: 'Christmas', href: '/category/christmas', bg: '#d4c8c5' },
                  { label: 'Color & Paint', href: '/category/color-paint', bg: '#c8d9c5' },
                  { label: 'Thrift & Vintage', href: '/category/thrift-vintage', bg: '#d9cfc0' },
                ].map(cat => (
                  <Link key={cat.label} href={cat.href}
                    className="group relative aspect-square rounded-lg overflow-hidden flex items-end p-2"
                    style={{ backgroundColor: cat.bg }}>
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-black/25 transition-colors" />
                    <span className="relative font-serif text-white text-[10px] font-semibold leading-tight">{cat.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>

      </div>

      {/* ── Featured Mood Boards ── */}
      {featuredBoards && featuredBoards.length > 0 && (
        <div className="max-w-6xl mx-auto px-4 mt-14">
          <div className="flex items-baseline justify-between mb-6">
            <h2 className="font-serif text-2xl font-semibold text-[#1e1c19]">Shop the Look</h2>
            <Link href="/mood-boards" className="text-xs font-semibold uppercase tracking-widest text-[#3d5c3a] hover:text-[#2e4529] transition-colors">
              View All →
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(featuredBoards as MoodBoardRow[]).map(board => (
              <Link key={board.id} href={`/mood-boards/${board.slug}`} className="group">
                <div className="aspect-square rounded-xl overflow-hidden bg-[#e4ede2] mb-3">
                  {board.image_url
                    ? <Image src={board.image_url} alt={board.title} width={400} height={400} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    : <div className="w-full h-full bg-[#c8d9c5]" />}
                </div>
                <h3 className="font-serif text-sm font-semibold text-[#1e1c19] group-hover:text-[#3d5c3a] transition-colors leading-snug">{board.title}</h3>
                {board.description && (
                  <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{board.description}</p>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Newsletter strip (full width, horizontal) ── */}
      <div className="bg-white border-t border-b border-[#e8e2d9] mt-10">
        <div className="max-w-6xl mx-auto px-4 py-10 flex flex-col md:flex-row items-center gap-6">
          <div className="md:flex-1">
            <p className="font-serif text-xl font-semibold text-[#1e1c19]">Get Curated Home Inspiration</p>
            <p className="text-sm text-gray-500 mt-1">Sign up to receive decorating ideas, seasonal styling tips, and beautiful inspiration — delivered to your inbox.</p>
          </div>
          <div className="md:flex-none">
            <NewsletterForm layout="horizontal" />
          </div>
        </div>
      </div>

    </div>
  )
}
