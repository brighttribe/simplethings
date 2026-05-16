'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const links = [
  { href: '/admin', label: 'Dashboard', exact: true },
  { href: '/admin/posts', label: 'Blog Posts' },
  { href: '/admin/recipes', label: 'Recipes' },
  { href: '/admin/categories', label: 'Blog Categories' },
  { href: '/admin/recipe-categories', label: 'Recipe Categories' },
  { href: '/admin/tags', label: 'Tags' },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="w-56 shrink-0 bg-white border-r border-gray-200 h-screen flex flex-col">
      <div className="px-5 py-5 border-b border-gray-100">
        <p className="text-sm font-bold text-gray-900">Simple Things</p>
        <p className="text-xs text-gray-400">Admin</p>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {links.map(link => {
          const active = link.exact ? pathname === link.href : pathname.startsWith(link.href)
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                active ? 'bg-stone-100 text-stone-900 font-medium' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              {link.label}
            </Link>
          )
        })}
      </nav>
      <div className="px-3 py-4 border-t border-gray-100">
        <a href="/" target="_blank" className="block px-3 py-2 text-sm text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition-colors">
          View Site →
        </a>
        <button
          onClick={handleLogout}
          className="w-full text-left px-3 py-2 text-sm text-gray-500 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
        >
          Sign Out
        </button>
      </div>
    </aside>
  )
}
