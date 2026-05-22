import { createServiceClient } from '@/lib/supabase/service'
import { requireAuth } from '@/lib/auth'
import Link from 'next/link'
import ComingSoonToggle from '@/components/coming-soon-toggle'

export default async function AdminDashboard() {
  await requireAuth()
  const db = createServiceClient()

  const [postsRes, recipesRes, draftsRes, settingsRes] = await Promise.all([
    db.from('blog_posts').select('id', { count: 'exact', head: true }).eq('status', 'published'),
    db.from('recipes').select('id', { count: 'exact', head: true }).eq('status', 'published'),
    db.from('blog_posts').select('id', { count: 'exact', head: true }).eq('status', 'draft'),
    db.from('site_settings').select('value').eq('key', 'coming_soon').single(),
  ])

  const comingSoon = settingsRes.data?.value === 'true'

  const stats = [
    {
      label: 'Published Posts',
      value: postsRes.count ?? 0,
      href: '/admin/posts',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10 9 9 9 8 9"/>
        </svg>
      ),
      cardBg: 'bg-[#e4ede2]',
      iconBg: 'bg-[#c8d9c5] text-[#3d5c3a]',
    },
    {
      label: 'Published Recipes',
      value: recipesRes.count ?? 0,
      href: '/admin/recipes',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8h1a4 4 0 0 1 0 8h-1"/>
          <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
          <line x1="6" y1="1" x2="6" y2="4"/>
          <line x1="10" y1="1" x2="10" y2="4"/>
          <line x1="14" y1="1" x2="14" y2="4"/>
        </svg>
      ),
      cardBg: 'bg-[#e2e8ed]',
      iconBg: 'bg-[#c5d4dc] text-[#3a5568]',
    },
    {
      label: 'Draft Posts',
      value: draftsRes.count ?? 0,
      href: '/admin/posts?status=draft',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20h9"/>
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
        </svg>
      ),
      cardBg: 'bg-[#ede8de]',
      iconBg: 'bg-[#d9d0c0] text-[#6b5f4a]',
    },
  ]

  const { data: recentPosts } = await db
    .from('blog_posts')
    .select('id, title, status, published_at, created_at')
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
        <Link href="/admin/posts/new" className="px-4 py-2 text-sm font-medium text-white bg-[#3d5c3a] rounded-lg hover:bg-[#2e4529] transition-colors">
          New Post
        </Link>
        <Link href="/admin/recipes/new" className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
          New Recipe
        </Link>
        <div className="ml-auto">
          <ComingSoonToggle initial={comingSoon} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {stats.map(s => (
          <Link key={s.label} href={s.href} className={`rounded-xl p-5 hover:brightness-95 transition-all ${s.cardBg}`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-3xl font-bold text-gray-800">{s.value}</p>
                <p className="text-sm text-gray-600 mt-1">{s.label}</p>
              </div>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${s.iconBg}`}>
                {s.icon}
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Recent Posts</h2>
          <Link href="/admin/posts" className="text-xs text-[#3d5c3a] hover:text-[#2e4529] font-medium">View all →</Link>
        </div>
        <table className="w-full text-xs">
          <tbody className="divide-y divide-gray-100">
            {recentPosts?.map(post => (
              <tr key={post.id} className="hover:bg-gray-50">
                <td className="px-5 py-3">
                  <Link href={`/admin/posts/${post.id}/edit`} className="font-medium text-gray-900 hover:text-stone-600 transition-colors">
                    {post.title}
                  </Link>
                </td>
                <td className="px-5 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium ${
                    post.status === 'published' ? 'bg-green-50 text-green-700' :
                    post.status === 'scheduled' ? 'bg-amber-50 text-amber-700' :
                    'bg-gray-100 text-gray-500'
                  }`}>
                    {post.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-gray-400">
                  {post.published_at ? new Date(post.published_at).toLocaleDateString() : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
