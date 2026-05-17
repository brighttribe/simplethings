import { createServiceClient } from '@/lib/supabase/service'
import { requireAuth } from '@/lib/auth'
import Link from 'next/link'
import Image from 'next/image'
import { DeleteRowButton } from '@/components/admin/delete-row-button'
import { FeaturedToggle } from '@/components/admin/featured-toggle'

export default async function MoodBoardsPage() {
  await requireAuth()
  const db = createServiceClient()
  const [{ data: boards }, { count: featuredCount }] = await Promise.all([
    db.from('mood_boards')
      .select('id, title, slug, status, published_at, image_url, is_featured')
      .order('created_at', { ascending: false }),
    db.from('mood_boards').select('id', { count: 'exact', head: true }).eq('is_featured', true),
  ])

  const fc = featuredCount ?? 0

  return (
    <div>
      <div className="flex items-center gap-4 mb-5">
        <h1 className="text-xl font-semibold text-gray-900">Mood Boards</h1>
        <Link
          href="/admin/mood-boards/new"
          className="px-4 py-2 text-sm font-medium text-white bg-[#3d5c3a] rounded-lg hover:bg-[#2e4529] transition-colors"
        >
          New Mood Board
        </Link>
        <span className="text-xs text-gray-400">{fc}/4 featured on homepage</span>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-100 bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wide w-16">Image</th>
              <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Title</th>
              <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wide w-28">Homepage</th>
              <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wide w-24">Status</th>
              <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wide w-28">Date</th>
              <th className="px-4 py-3 w-12"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(!boards || boards.length === 0) && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-400">
                  No mood boards yet
                </td>
              </tr>
            )}
            {boards?.map(board => (
              <tr key={board.id} className="odd:bg-white even:bg-[#f2f7f2] hover:bg-[#e8f0e8] transition-colors">
                <td className="px-4 py-2.5">
                  {board.image_url ? (
                    <Image
                      src={board.image_url}
                      alt={board.title}
                      width={40}
                      height={30}
                      className="rounded object-cover w-10 h-8"
                    />
                  ) : (
                    <div className="w-10 h-8 rounded bg-gray-100 border border-gray-200" />
                  )}
                </td>
                <td className="px-4 py-2.5">
                  <Link
                    href={`/admin/mood-boards/${board.id}/edit`}
                    className="font-medium text-gray-900 hover:text-stone-600 transition-colors"
                  >
                    {board.title}
                  </Link>
                </td>
                <td className="px-4 py-2.5">
                  <FeaturedToggle
                    id={board.id}
                    initialFeatured={board.is_featured ?? false}
                    featuredCount={fc}
                    limit={4}
                  />
                </td>
                <td className="px-4 py-2.5">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium ${
                    board.status === 'published' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {board.status}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-gray-400 text-xs">
                  {board.published_at ? new Date(board.published_at).toLocaleDateString() : '—'}
                </td>
                <td className="px-4 py-2.5 text-right">
                  <DeleteRowButton id={board.id} label={board.title} apiPath="/api/mood-boards" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
