import { createServiceClient } from '@/lib/supabase/service'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import NewsletterForm from '@/components/newsletter-form'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const db = createServiceClient()
  const { data } = await db.from('mood_boards').select('title, description').eq('slug', slug).single()
  if (!data) return {}
  const desc = data.description ? data.description.replace(/<[^>]+>/g, '').slice(0, 160) : undefined
  return { title: data.title, description: desc }
}

export default async function MoodBoardPage({ params }: PageProps) {
  const { slug } = await params
  const db = createServiceClient()

  const [{ data: board }, { data: otherBoards }, { data: categories }] = await Promise.all([
    db.from('mood_boards').select('*').eq('slug', slug).eq('status', 'published').single(),
    db.from('mood_boards')
      .select('id, title, slug, image_url, description')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(6),
    db.from('categories').select('id, name, slug').order('name'),
  ])

  if (!board) notFound()

  const { data: hotspots } = await db
    .from('mood_board_hotspots')
    .select('*')
    .eq('mood_board_id', board.id)
    .order('sort_order')

  const spots = hotspots ?? []
  const sidebarBoards = (otherBoards ?? []).filter(b => b.id !== board.id).slice(0, 4)

  const richText = `leading-relaxed prose prose-stone max-w-none
    prose-headings:font-serif prose-headings:text-[#1e1c19]
    prose-p:text-[#3c3a36] prose-p:leading-relaxed
    prose-a:text-[#3d5c3a] prose-a:no-underline hover:prose-a:underline
    prose-ul:text-[#3c3a36] prose-ol:text-[#3c3a36]
    prose-strong:text-[#1e1c19]`

  return (
    <div className="bg-[#faf7f2]">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex gap-10 items-start">

          {/* ── Main content ── */}
          <article className="flex-1 min-w-0 bg-white rounded-2xl p-8">

            {/* Label + title */}
            <Link href="/mood-boards"
              className="inline-block text-[10px] font-semibold uppercase tracking-widest text-[#3d5c3a] mb-3">
              Mood Boards
            </Link>
            <h1 className="font-serif text-3xl md:text-4xl font-bold text-[#1e1c19] leading-tight mb-6">
              {board.title}
            </h1>

            {/* Introduction */}
            {board.description && (
              <div
                className={`${richText} mb-8`}
                dangerouslySetInnerHTML={{ __html: board.description }}
              />
            )}

            {/* Image with hotspot dots */}
            {board.image_url && (
              <div className="relative select-none mb-8 rounded-xl overflow-hidden">
                <Image
                  src={board.image_url}
                  alt={board.title}
                  width={800}
                  height={1000}
                  className="w-full h-auto"
                  priority
                />
                {spots.map((spot, i) => (
                  <a
                    key={spot.id}
                    href={spot.url ?? '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ left: `${spot.position_x}%`, top: `${spot.position_y}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-[10px] sm:w-8 sm:h-8 sm:text-xs md:w-10 md:h-10 md:text-sm rounded-full bg-[#f5f0e8] border-2 border-[#1e1c19] flex items-center justify-center font-bold text-[#1e1c19] hover:bg-[#e4ede2] transition-colors shadow-md"
                    title={spot.title ?? ''}
                  >
                    {i + 1}
                  </a>
                ))}
              </div>
            )}

            {/* Additional notes */}
            {board.content_below && (
              <div
                className={`${richText} mb-8`}
                dangerouslySetInnerHTML={{ __html: board.content_below }}
              />
            )}

            {/* Shop list */}
            {spots.length > 0 && (
              <div className="border-t border-[#e8e2d9] pt-8">
                <h2 className="font-serif text-xl font-semibold text-[#1e1c19] mb-5">Shop This Board</h2>
                <ol className="space-y-4">
                  {spots.map((spot, i) => (
                    <li key={spot.id} className="flex items-start gap-3">
                      <span className="w-7 h-7 rounded-full bg-[#1e1c19] text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <div className="flex-1">
                        {spot.title && (
                          <span className="font-medium text-[#1e1c19]">{spot.title}</span>
                        )}
                        {spot.retailer && (
                          <span className="text-sm text-[#a8a098] ml-2">— {spot.retailer}</span>
                        )}
                        {spot.url && (
                          <a
                            href={spot.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-2 text-xs font-semibold text-[#3d5c3a] hover:underline"
                          >
                            Shop Now →
                          </a>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>

                {board.ltk_url && (
                  <a
                    href={board.ltk_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 mt-6 px-6 py-3 text-sm font-medium text-white bg-[#3d5c3a] rounded-xl hover:bg-[#2e4529] transition-colors"
                  >
                    See Full Shopping List on LTK →
                  </a>
                )}
              </div>
            )}

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

            {/* Other mood boards */}
            {sidebarBoards.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-4">More Mood Boards</p>
                <div className="space-y-4">
                  {sidebarBoards.map(b => (
                    <Link key={b.id} href={`/mood-boards/${b.slug}`} className="group flex gap-3 items-start">
                      <div className="w-16 h-12 rounded-lg overflow-hidden bg-[#e4ede2] shrink-0">
                        {b.image_url
                          ? <Image src={b.image_url} alt={b.title} width={64} height={48} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          : <div className="w-full h-full bg-[#c8d9c5]" />}
                      </div>
                      <p className="flex-1 text-xs font-medium text-[#1e1c19] leading-snug group-hover:text-[#3d5c3a] transition-colors line-clamp-3">{b.title}</p>
                    </Link>
                  ))}
                </div>
                <Link href="/mood-boards" className="inline-block mt-4 text-xs font-semibold text-[#3d5c3a] hover:underline">
                  View all mood boards →
                </Link>
              </div>
            )}

            <div className="border-t border-[#e8e2d9]" />

            {/* Categories */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-3">Browse by Category</p>
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

        {/* ── More mood boards grid ── */}
        {sidebarBoards.length > 0 && (
          <div className="mt-16 pt-10 border-t border-[#e8e2d9]">
            <div className="flex items-baseline justify-between mb-6">
              <h2 className="font-serif text-2xl font-semibold text-[#1e1c19]">More Mood Boards</h2>
              <Link href="/mood-boards" className="text-xs font-semibold uppercase tracking-widest text-[#3d5c3a] hover:text-[#2e4529] transition-colors">
                View All →
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {sidebarBoards.map(b => (
                <Link key={b.id} href={`/mood-boards/${b.slug}`} className="group">
                  <div className="aspect-square rounded-xl overflow-hidden bg-[#e4ede2] mb-3">
                    {b.image_url
                      ? <Image src={b.image_url} alt={b.title} width={400} height={400} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      : <div className="w-full h-full bg-[#c8d9c5]" />}
                  </div>
                  <h3 className="font-serif text-sm font-semibold text-[#1e1c19] group-hover:text-[#3d5c3a] transition-colors leading-snug">{b.title}</h3>
                  {b.description && (
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{b.description.replace(/<[^>]+>/g, '')}</p>
                  )}
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
