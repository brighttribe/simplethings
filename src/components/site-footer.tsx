import Link from 'next/link'
import Image from 'next/image'

export default function SiteFooter() {
  return (
    <footer className="bg-[#1e1c19] text-gray-400 mt-20">
      <div className="max-w-6xl mx-auto px-4 py-14 grid grid-cols-1 md:grid-cols-4 gap-10">
        {/* Brand */}
        <div className="md:col-span-2">
          <Image src="/logo.png" alt="Simple Things Made Beautiful" width={200} height={66} className="h-16 w-auto object-contain mb-4 brightness-0 invert opacity-80" />
          <p className="text-sm leading-relaxed text-gray-500 max-w-xs mb-5">
            A lifestyle blog by Holly Dempsey — home decor ideas, seasonal styling, and making your home the most beautiful version of you.
          </p>
          <div className="flex items-center gap-4">
            <a href="https://www.instagram.com/simple.things.made.beautiful" target="_blank" rel="noopener noreferrer"
              className="text-gray-500 hover:text-[#e1306c] transition-colors" aria-label="Instagram">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
            </a>
            <a href="https://www.facebook.com/simplethingmadebeautiful" target="_blank" rel="noopener noreferrer"
              className="text-gray-500 hover:text-[#1877f2] transition-colors" aria-label="Facebook">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            </a>
            <a href="https://www.pinterest.com/simplethingsmadebeautiful/" target="_blank" rel="noopener noreferrer"
              className="text-gray-500 hover:text-[#e60023] transition-colors" aria-label="Pinterest">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/></svg>
            </a>
          </div>
        </div>

        {/* Navigate */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-widest text-gray-300 mb-4">Explore</h4>
          <ul className="space-y-2 text-sm">
            {[
              ['Home', '/'],
              ['Decor & Styling', '/category/decor-styling'],
              ['Holiday & Seasonal', '/category/holiday-seasonal'],
              ['DIY & Refreshes', '/category/diy-refreshes'],
              ['About Holly', '/about'],
              ['Blog', '/blog'],
              ['Resources', '/resources'],
            ].map(([label, href]) => (
              <li key={label}><Link href={href} className="hover:text-[#3d5c3a] transition-colors">{label}</Link></li>
            ))}
          </ul>
        </div>

        {/* Legal */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-widest text-gray-300 mb-4">Legal</h4>
          <ul className="space-y-2 text-sm">
            {[
              ['Privacy Policy', '/privacy-policy'],
              ['Disclaimer', '/disclaimer'],
              ['Terms of Use', '/terms'],
            ].map(([label, href]) => (
              <li key={label}><Link href={href} className="hover:text-[#3d5c3a] transition-colors">{label}</Link></li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/5 py-6 text-center text-xs text-gray-600">
        © {new Date().getFullYear()} Simple Things Made Beautiful · All rights reserved
      </div>
    </footer>
  )
}
