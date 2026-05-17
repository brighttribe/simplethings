import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import NewsletterForm from '@/components/newsletter-form'

export const metadata: Metadata = {
  title: 'About Holly | Simple Things Made Beautiful',
  description: 'Meet Holly — certified interior designer, Georgia girl, wife, mom, and grandma, sharing home decorating ideas that make your space feel like the best version of you.',
}

export default function AboutPage() {
  return (
    <div className="bg-[#faf7f2]">
      <div className="max-w-4xl mx-auto px-4 py-12">

        {/* Hero: photo + intro */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm mb-8">
          <div className="md:flex">
            {/* Photo */}
            <div className="md:w-2/5 shrink-0">
              <div className="relative h-80 md:h-full min-h-[400px]">
                <Image
                  src="/holly-about.webp"
                  alt="Holly Dempsey"
                  fill
                  className="object-cover object-top"
                  priority
                />
              </div>
            </div>

            {/* Intro */}
            <div className="md:w-3/5 p-8 md:p-12 flex flex-col justify-center">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-[#3d5c3a] mb-3">About</span>
              <h1 className="font-serif text-3xl md:text-4xl font-bold text-[#1e1c19] leading-tight mb-5">
                Hello, I&apos;m Holly
              </h1>
              <p className="text-[#3c3a36] leading-relaxed mb-4">
                I&apos;m a certified interior designer and HSR Certified Home Stager &amp; Redesigner — but really, I&apos;m just a Georgia girl who believes your home should feel like the best version of you.
              </p>
              <p className="text-[#3c3a36] leading-relaxed mb-6">
                Wife, mom, grandma, and lifelong lover of beautiful spaces. I created this little corner of the internet to share the ideas, tricks, and simple touches that turn a house into a home.
              </p>
              <p className="font-serif italic text-[#3d5c3a] text-xl opacity-80">Holly</p>
            </div>
          </div>
        </div>

        {/* Story */}
        <div className="bg-white rounded-2xl p-8 md:p-12 mb-8">
          <h2 className="font-serif text-2xl font-semibold text-[#1e1c19] mb-6">My Story</h2>

          <div className="prose prose-stone max-w-none prose-p:text-[#3c3a36] prose-p:leading-relaxed prose-headings:font-serif prose-headings:text-[#1e1c19]">
            <p>
              I&apos;ve always been drawn to the way a room can make you feel. Walk into the right space and something shifts — you breathe a little easier, you feel at home. That feeling is what I chase, and it&apos;s what I want to help you create.
            </p>
            <p>
              After spending years designing spaces for clients, I realized that so many people felt like a beautiful home was out of reach for them — too expensive, too complicated, too much. I started Simple Things Made Beautiful to prove that isn&apos;t true. You don&apos;t need a renovation budget or a decorator on speed dial. You need the right ideas and a little inspiration.
            </p>
            <p>
              Here you&apos;ll find seasonal decorating ideas, room refreshes, color advice, DIY projects, and all the little styling details that add up to a home that feels intentional and warm. I write from experience — both professional and personal. I&apos;ve decorated my own home through many seasons of life, from raising kids to welcoming grandchildren, and I know that real homes are lived in.
            </p>
            <p>
              My philosophy is simple: start with what you love, edit ruthlessly, and don&apos;t take it too seriously. A home should make you happy, not stressed.
            </p>
          </div>

          {/* Credentials strip */}
          <div className="mt-8 pt-8 border-t border-[#e8e2d9] grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { title: 'Certified Interior Designer', desc: 'Formally trained with professional credentials in interior design.' },
              { title: 'HSR Certified', desc: 'Home Stager & Redesigner certified — helping homes show their best.' },
              { title: 'Georgia Based', desc: 'Southern roots, warm style, and a love for the details that make a house a home.' },
            ].map(item => (
              <div key={item.title} className="text-center">
                <div className="w-10 h-10 rounded-full bg-[#e4ede2] flex items-center justify-center mx-auto mb-3">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3d5c3a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <p className="font-serif text-sm font-semibold text-[#1e1c19] mb-1">{item.title}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* What you'll find here */}
        <div className="bg-white rounded-2xl p-8 md:p-12 mb-8">
          <h2 className="font-serif text-2xl font-semibold text-[#1e1c19] mb-6">What You&apos;ll Find Here</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: 'Seasonal Decorating', desc: 'Fresh ideas for every season — from cozy fall layering to bright spring refreshes.', href: '/category/holiday-seasonal' },
              { label: 'Room Styling', desc: 'Living rooms, bedrooms, kitchens — practical ideas for every space in your home.', href: '/category/decor-styling' },
              { label: 'DIY & Quick Fixes', desc: 'Simple projects and refreshes that make a big impact without a big budget.', href: '/category/diy-refreshes' },
              { label: 'Color & Paint', desc: 'Choosing the right colors is everything. Let\'s get it right together.', href: '/category/color-paint' },
            ].map(cat => (
              <Link key={cat.label} href={cat.href}
                className="group flex gap-4 p-4 rounded-xl border border-[#e8e2d9] hover:border-[#c8d9c5] hover:bg-[#f7faf6] transition-colors">
                <div className="w-8 h-8 rounded-lg bg-[#e4ede2] flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-[#c8d9c5] transition-colors">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3d5c3a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </div>
                <div>
                  <p className="font-serif text-sm font-semibold text-[#1e1c19] mb-0.5 group-hover:text-[#3d5c3a] transition-colors">{cat.label}</p>
                  <p className="text-xs text-gray-500 leading-relaxed">{cat.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Newsletter */}
        <div className="bg-[#e4ede2] rounded-2xl px-8 py-10 text-center">
          <p className="font-serif text-2xl font-semibold text-[#1e1c19] mb-2">Let&apos;s Stay Connected</p>
          <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
            Sign up and I&apos;ll send you decorating ideas, seasonal inspiration, and my favorite simple styling tips — straight to your inbox.
          </p>
          <div className="flex justify-center">
            <NewsletterForm layout="horizontal" />
          </div>
        </div>

      </div>
    </div>
  )
}
