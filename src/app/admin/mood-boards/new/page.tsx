import { redirect } from 'next/navigation'
import { requireAuth } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/service'
import { generateSlug } from '@/lib/blog-utils'

export default async function NewMoodBoardPage() {
  await requireAuth()

  async function create(formData: FormData) {
    'use server'
    const title = formData.get('title') as string
    if (!title?.trim()) return
    const db = createServiceClient()
    const { data } = await db
      .from('mood_boards')
      .insert({ title, slug: generateSlug(title) })
      .select('id')
      .single()
    if (data) redirect(`/admin/mood-boards/${data.id}/edit`)
  }

  return (
    <div className="max-w-md">
      <h1 className="text-xl font-semibold text-gray-900 mb-6">New Mood Board</h1>
      <form action={create} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input
            name="title"
            required
            autoFocus
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-300"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-[#3d5c3a] rounded-lg hover:bg-[#2e4529] transition-colors"
        >
          Create &amp; Edit
        </button>
      </form>
    </div>
  )
}
