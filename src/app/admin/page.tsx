import { createServiceClient } from '@/lib/supabase/service'
import { requireAuth } from '@/lib/auth'
import Link from 'next/link'

export default async function AdminDashboard() {
  await requireAuth()
  const db = createServiceClient()

  const [postsRes, recipesRes, draftsRes] = await Promise.all([
    db.from('blog_posts').select('id', { count: 'exact', head: true }).eq('status', 'published'),
    db.from('recipes').select('id', { count: 'exact', head: true }).eq('status', 'published'),
    db.from('blog_posts').select('id', { count: 'exact', head: true }).eq('status', 'draft'),
  ])

  const stats = [
    { label: 'Published Posts', value: postsRes.count ?? 0 },
    { label: 'Published Recipes', value: recipesRes.count ?? 0 },
    { label: 'Draft Posts', value: draftsRes.count ?? 0 },
  ]

  const { data: recentPosts } = await db
    .from('blog_posts')
    .select('id, title, status, published_at, created_at')
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
        <div className="flex gap-2">
          <Link href="/admin/posts/new" className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-700 transition-colors">
            New Post
          </Link>
          <Link href="/admin/recipes/new" className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            New Recipe
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {stats.map(s => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-lg p-5">
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Recent Posts</h2>
        </div>
        <table className="w-full text-xs">
          <tbody className="divide-y divide-gray-100">
            {recentPosts?.map(post => (
              <tr key={post.id} className="hover:bg-gray-50">
                <td className="px-5 py-3 font-medium text-gray-900">{post.title}</td>
                <td className="px-5 py-3 text-gray-400 capitalize">{post.status}</td>
                <td className="px-5 py-3 text-gray-400">
                  {post.published_at ? new Date(post.published_at).toLocaleDateString() : '—'}
                </td>
                <td className="px-5 py-3 text-right">
                  <Link href={`/admin/posts/${post.id}/edit`} className="text-stone-600 hover:text-stone-900">Edit</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
