import { createServiceClient } from '@/lib/supabase/service'
import Link from 'next/link'
import Image from 'next/image'

export const metadata = {
  title: 'Mood Boards',
}

export default async function MoodBoardsPage() {
  const db = createServiceClient()
  const { data: boards } = await db
    .from('mood_boards')
    .select('id, title, slug, description, image_url')
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  return (
    <div className="bg-[#faf7f2] min-h-screen">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <h1 className="font-serif text-4xl text-[#1e1c19] mb-2">Mood Boards</h1>
        <p className="text-[#a8a098] mb-10">Shop the look — clickable style boards with every source linked.</p>

        {(!boards || boards.length === 0) ? (
          <p className="text-[#a8a098] text-sm">No mood boards published yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {boards.map(board => (
              <Link
                key={board.id}
                href={`/mood-boards/${board.slug}`}
                className="group bg-white rounded-2xl overflow-hidden border border-[#e8e2d9] hover:shadow-lg transition-shadow"
              >
                <div className="aspect-[4/3] overflow-hidden bg-[#e4ede2]">
                  {board.image_url ? (
                    <Image
                      src={board.image_url}
                      alt={board.title}
                      width={600}
                      height={450}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[#a8a098]">
                        <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                      </svg>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h2 className="font-semibold text-[#1e1c19] text-base mb-1 group-hover:text-[#3d5c3a] transition-colors">
                    {board.title}
                  </h2>
                  {board.description && (
                    <p className="text-sm text-[#a8a098] line-clamp-2">{board.description}</p>
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
