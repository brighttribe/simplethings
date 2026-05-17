import { createServiceClient } from '@/lib/supabase/service'
import SiteNav from '@/components/site-nav'
import SiteFooter from '@/components/site-footer'

export const dynamic = 'force-dynamic'

export interface NavCategory {
  id: string
  name: string
  slug: string
  parent_id: string | null
  sort_order: number
}

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const db = createServiceClient()

  const [{ data: allCats }, { data: publishedPosts }] = await Promise.all([
    db.from('categories').select('id, name, slug, parent_id, sort_order').order('sort_order'),
    db.from('blog_posts').select('id').eq('status', 'published'),
  ])

  const pubIds = (publishedPosts ?? []).map(p => p.id)
  let activeCatIds = new Set<string>()

  if (pubIds.length > 0) {
    const { data: assignments } = await db
      .from('blog_post_categories')
      .select('category_id')
      .in('post_id', pubIds)
    for (const a of assignments ?? []) activeCatIds.add(a.category_id)
  }

  const cats = (allCats ?? []) as NavCategory[]

  // Include parent category if any child has content
  function hasContent(id: string): boolean {
    if (activeCatIds.has(id)) return true
    return cats.some(c => c.parent_id === id && hasContent(c.id))
  }

  const navCategories = cats.filter(c => hasContent(c.id))

  return (
    <>
      <SiteNav navCategories={navCategories} />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </>
  )
}
