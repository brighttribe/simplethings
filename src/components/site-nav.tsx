'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

interface NavCategory {
  id: string
  name: string
  slug: string
  parent_id: string | null
  sort_order: number
}

const socialLinks = [
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/simple.things.made.beautiful',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>,
  },
  {
    label: 'Facebook',
    href: 'https://www.facebook.com/simplethingmadebeautiful',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>,
  },
  {
    label: 'Pinterest',
    href: 'https://www.pinterest.com/simplethingsmadebeautiful/',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/></svg>,
  },
]

export default function SiteNav({ navCategories = [] }: { navCategories?: NavCategory[] }) {
  const topLevel = navCategories
    .filter(c => !c.parent_id)
    .sort((a, b) => a.sort_order - b.sort_order)

  const navItems = [
    { label: 'Home', href: '/', children: undefined },
    { label: 'About', href: '/about', children: undefined },
    { label: 'Mood Boards', href: '/mood-boards', children: undefined },
    { label: 'Recipes', href: '/recipes', children: undefined },
    ...topLevel.map(cat => {
      const children = navCategories
        .filter(c => c.parent_id === cat.id)
        .sort((a, b) => a.sort_order - b.sort_order)
      return {
        label: cat.name,
        href: `/category/${cat.slug}`,
        children: children.length > 0
          ? children.map(c => ({ label: c.name, href: `/category/${c.slug}` }))
          : undefined,
      }
    }),
  ]

  const [open, setOpen] = useState<string | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus()
  }, [searchOpen])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
    setSearchOpen(false)
    setQuery('')
    router.push(`/search?q=${encodeURIComponent(q)}`)
  }

  return (
    <header className="bg-[#faf7f2] sticky top-0 z-50 shadow-[0_1px_0_0_#e8e2d9,0_2px_8px_0_rgba(0,0,0,0.04)]">

      {/* ── Top bar: social | logo | search ── */}
      <div className="max-w-6xl mx-auto px-6 pt-4 pb-2 flex items-center justify-between">

        {/* Social icons */}
        <div className="hidden lg:flex items-center gap-4 w-40">
          {socialLinks.map(s => (
            <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
              aria-label={s.label}
              className="text-[#a8a098] hover:text-[#3d5c3a] transition-colors duration-200">
              {s.icon}
            </a>
          ))}
        </div>

        {/* Logo — centered */}
        <Link href="/" className="mx-auto">
          <Image src="/logo.png" alt="Simple Things Made Beautiful" width={380} height={120}
            className="h-24 w-auto object-contain" priority />
        </Link>

        {/* Search + mobile toggle */}
        <div className="flex items-center gap-2 w-40 justify-end">
          <form onSubmit={handleSearch} className="flex items-center gap-2 justify-end">
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search…"
              className={`text-sm border border-[#e8e2d9] rounded-full px-4 py-1.5 focus:outline-none focus:border-[#3d5c3a] bg-white transition-all duration-300 ease-in-out ${
                searchOpen ? 'w-48 opacity-100' : 'w-0 opacity-0 px-0 border-transparent pointer-events-none'
              }`}
            />
            <button
              type={searchOpen ? 'submit' : 'button'}
              onClick={() => { if (!searchOpen) { setSearchOpen(true); setTimeout(() => searchRef.current?.focus(), 50) } }}
              className="text-[#a8a098] hover:text-[#3d5c3a] transition-colors duration-200 shrink-0"
              aria-label="Search">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </button>
            {searchOpen && (
              <button type="button" onClick={() => { setSearchOpen(false); setQuery('') }}
                className="text-[#a8a098] hover:text-[#3d5c3a] transition-colors duration-200 shrink-0"
                aria-label="Close search">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            )}
          </form>
          <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden text-[#2c2a27] ml-1" aria-label="Menu">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {mobileOpen
                ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
                : <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>}
            </svg>
          </button>
        </div>
      </div>

      {/* ── Nav links row ── */}
      <nav className="hidden lg:block border-t border-[#e8e2d9]">
        <div className="max-w-6xl mx-auto px-6">
          <ul className="flex items-center justify-center gap-8">
            {navItems.map(item => (
              <li key={item.label} className="relative"
                onMouseEnter={() => item.children && setOpen(item.label)}
                onMouseLeave={() => setOpen(null)}>
                <Link href={item.href}
                  className="flex items-center gap-1 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#2c2a27] hover:text-[#3d5c3a] transition-colors duration-200 whitespace-nowrap">
                  {item.label}
                  {item.children && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="opacity-40">
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  )}
                </Link>

                {/* Dropdown */}
                {item.children && open === item.label && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 pt-0 z-50 min-w-[200px]">
                    <div className="mt-0 bg-[#faf7f2] border border-[#e8e2d9] rounded-b-xl shadow-xl overflow-hidden">
                      {item.children.map((child, i) => (
                        <Link key={child.label} href={child.href}
                          className={`block px-5 py-2.5 text-[11px] font-medium tracking-wide text-[#2c2a27] hover:text-[#3d5c3a] hover:bg-[#f0ebe2] transition-colors ${i !== 0 ? 'border-t border-[#e8e2d9]/60' : ''}`}>
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* ── Mobile menu ── */}
      {mobileOpen && (
        <div className="lg:hidden bg-[#faf7f2] border-t border-[#e8e2d9] px-5 py-4 space-y-1">
          {navItems.map(item => (
            <div key={item.label}>
              <Link href={item.href} onClick={() => setMobileOpen(false)}
                className="block py-2.5 text-xs font-semibold uppercase tracking-widest text-[#2c2a27] hover:text-[#3d5c3a] transition-colors">
                {item.label}
              </Link>
              {item.children && (
                <div className="pl-4 space-y-0.5 mb-2">
                  {item.children.map(child => (
                    <Link key={child.label} href={child.href} onClick={() => setMobileOpen(false)}
                      className="block py-1.5 text-xs text-gray-500 hover:text-[#3d5c3a] transition-colors">
                      {child.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
          <div className="flex items-center gap-4 pt-3 border-t border-[#e8e2d9] mt-2">
            {socialLinks.map(s => (
              <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                className="text-[#a8a098] hover:text-[#3d5c3a] transition-colors">
                {s.icon}
              </a>
            ))}
          </div>
        </div>
      )}
    </header>
  )
}
