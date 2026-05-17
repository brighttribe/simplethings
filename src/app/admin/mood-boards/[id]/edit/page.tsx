import { requireAuth } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/service'
import { notFound } from 'next/navigation'
import MoodBoardEditor from '@/components/admin/mood-board-editor'

export default async function EditMoodBoardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await requireAuth()
  const db = createServiceClient()
  const [{ data: board }, { data: hotspots }, { count: featuredCount }] = await Promise.all([
    db.from('mood_boards').select('*').eq('id', id).single(),
    db.from('mood_board_hotspots').select('*').eq('mood_board_id', id).order('sort_order'),
    db.from('mood_boards').select('id', { count: 'exact', head: true }).eq('is_featured', true),
  ])
  if (!board) notFound()
  return <MoodBoardEditor board={board} initialHotspots={hotspots ?? []} featuredCount={featuredCount ?? 0} />
}
