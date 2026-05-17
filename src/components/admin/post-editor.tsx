'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { WysiwygToolbar } from '@/components/admin/wysiwyg-toolbar'
import SeoPanel from '@/components/admin/seo-panel'
import { generateSlug } from '@/lib/blog-utils'
import type { BlogPost, BlogTag, Category } from '@/lib/types'

interface PostEditorProps {
  post: BlogPost
  categories: Category[]
  heroCount: number
  featuredCount: number
}

export default function PostEditor({ post, categories, heroCount, featuredCount }: PostEditorProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isDuplicate = searchParams.get('duplicate') === 'true'
  const [title, setTitle] = useState(post.title || '')
  const [subtitle, setSubtitle] = useState(post.subtitle || '')
  const [metaTitle, setMetaTitle] = useState(post.meta_title || '')
  const [metaDescription, setMetaDescription] = useState(post.meta_description || '')
  const [slug, setSlug] = useState(post.slug)
  const [heroImageUrl, setHeroImageUrl] = useState(post.hero_image_url || '')
  const [status, setStatus] = useState<'draft' | 'scheduled' | 'published'>(post.status)
  const [scheduledAt, setScheduledAt] = useState(post.scheduled_at || '')
  const [publishedAt, setPublishedAt] = useState(post.published_at || '')
  const [saving, setSaving] = useState(false)
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)
  const [allTags, setAllTags] = useState<BlogTag[]>([])
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
    () => (post.blog_post_tags || []).flatMap(pt => pt.blog_tags ? [pt.blog_tags.id] : [])
  )
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(
    () => (post.blog_post_categories || []).flatMap(pc => pc.categories ? [pc.categories.id] : [])
  )
  const [isHero, setIsHero] = useState<boolean>((post as unknown as Record<string, unknown>).is_hero as boolean ?? false)
  const [isFeatured, setIsFeatured] = useState<boolean>((post as unknown as Record<string, unknown>).is_featured as boolean ?? false)
  const [featuredOrder, setFeaturedOrder] = useState<number | null>((post as unknown as Record<string, unknown>).featured_order as number | null ?? null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const contentRef = useRef<HTMLDivElement | null>(null)
  const [codeView, setCodeView] = useState(false)
  const [codeHtml, setCodeHtml] = useState('')
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [savedIndicator, setSavedIndicator] = useState(false)
  const savedRangeRef = useRef<Range | null>(null)
  const [linkTooltip, setLinkTooltip] = useState<{ url: string; top: number; left: number } | null>(null)
  const tooltipHideRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [linkCopied, setLinkCopied] = useState(false)

  const draftKey = `post-draft-${post.id}`

  // Strip leading H1 from content once on mount (title is displayed separately)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const initialHtml = useMemo(() => {
    if (!post.content_html) return ''
    return post.content_html.replace(/^\s*<h1[^>]*>[\s\S]*?<\/h1>\s*/i, '')
  }, [])

  const liveHtmlRef = useRef(initialHtml)

  // On mount, restore from sessionStorage if available (survives dev hot-reloads)
  useEffect(() => {
    const saved = sessionStorage.getItem(draftKey)
    if (saved && contentRef.current) {
      contentRef.current.innerHTML = saved
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    async function fetchTags() {
      const [tagsRes, postTagsRes] = await Promise.all([
        fetch('/api/tags'),
        fetch(`/api/posts/${post.id}/tags`),
      ])
      if (tagsRes.ok) {
        const tags: BlogTag[] = await tagsRes.json()
        setAllTags(tags)
      }
      if (postTagsRes.ok) {
        const postTags: BlogTag[] = await postTagsRes.json()
        setSelectedTagIds(postTags.map((t) => t.id))
      }
    }
    fetchTags()
  }, [post.id])

  function handleTagToggle(id: string) {
    setSelectedTagIds((prev) =>
      prev.includes(id) ? prev.filter((tid) => tid !== id) : [...prev, id]
    )
  }

  function handleTagCreate(tag: BlogTag) {
    setAllTags((prev) => [...prev, tag].sort((a, b) => a.name.localeCompare(b.name)))
    setSelectedTagIds((prev) => [...prev, tag.id])
  }

  function handleCategoryToggle(id: string) {
    setSelectedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((cid) => cid !== id) : [...prev, id]
    )
  }

  async function saveTags() {
    await fetch(`/api/posts/${post.id}/tags`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tag_ids: selectedTagIds }),
    })
  }

  async function saveCategories() {
    await fetch(`/api/posts/${post.id}/categories`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category_ids: selectedCategoryIds }),
    })
  }

  function getHtml() {
    if (codeView) return codeHtml
    return liveHtmlRef.current || contentRef.current?.innerHTML || ''
  }

  function getPayload(overrides: Record<string, unknown> = {}) {
    return {
      title,
      slug,
      subtitle: subtitle || null,
      content_html: getHtml(),
      meta_title: metaTitle || null,
      meta_description: metaDescription || null,
      hero_image_url: heroImageUrl || null,
      status,
      scheduled_at: scheduledAt || null,
      published_at: publishedAt || null,
      is_hero: isHero,
      is_featured: isFeatured,
      featured_order: isFeatured ? featuredOrder : null,
      ...overrides,
    }
  }

  async function callUpdate(payload: object) {
    setSaving(true)
    const res = await fetch(`/api/posts/${post.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    setSaving(false)
    return res
  }

  async function handleSave() {
    const res = await callUpdate(getPayload())
    if (res.ok) {
      await saveTags()
      await saveCategories()
      sessionStorage.removeItem(draftKey)
      router.refresh()
      setSavedIndicator(true)
      setTimeout(() => setSavedIndicator(false), 2500)
    } else {
      const body = await res.json().catch(() => ({}))
      if (res.status === 409) {
        alert('This slug is already in use. Please change the URL slug and try again.')
      } else {
        alert(body.error || 'Failed to save. Please try again.')
      }
    }
  }

  async function handlePublish() {
    const res = await callUpdate(getPayload({ status: 'published', scheduled_at: null }))
    if (res.ok) {
      await saveTags()
      await saveCategories()
      setStatus('published')
      setScheduledAt('')
      router.push('/admin/posts')
    } else {
      const body = await res.json().catch(() => ({}))
      if (res.status === 409) {
        alert('This slug is already in use. Please change the URL slug and try again.')
      } else {
        alert(body.error || 'Failed to publish. Please try again.')
      }
    }
  }

  function handleTitleChange(value: string) {
    setTitle(value)
    if (!slugManuallyEdited) setSlug(generateSlug(value))
    if (!metaTitle) setMetaTitle(value.slice(0, 60))
  }

  function toggleCodeView() {
    if (!codeView) {
      setCodeHtml(contentRef.current?.innerHTML || '')
      setCodeView(true)
    } else {
      if (contentRef.current) contentRef.current.innerHTML = codeHtml
      setCodeView(false)
    }
  }

  function handleImageUpload() {
    imageInputRef.current?.click()
  }

  async function handleImageInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/upload-image', { method: 'POST', body: fd })
    if (res.ok) {
      const { url } = await res.json()
      const img = document.createElement('img')
      img.src = url
      img.style.maxWidth = '100%'
      const selection = window.getSelection()
      if (selection?.rangeCount && contentRef.current?.contains(selection.anchorNode)) {
        const range = selection.getRangeAt(0)
        range.insertNode(img)
        range.collapse(false)
      } else if (contentRef.current) {
        contentRef.current.appendChild(img)
      }
    }
    e.target.value = ''
  }

  function handleInsertLink() {
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      savedRangeRef.current = selection.getRangeAt(0).cloneRange()
    }
    setLinkUrl('')
    setShowLinkModal(true)
  }

  function handleConfirmLink() {
    const url = linkUrl.trim()
    if (!url) return
    const selection = window.getSelection()
    if (savedRangeRef.current && selection) {
      selection.removeAllRanges()
      selection.addRange(savedRangeRef.current)
    }
    document.execCommand('createLink', false, url.startsWith('http') ? url : `https://${url}`)
    setShowLinkModal(false)
    setLinkUrl('')
    savedRangeRef.current = null
  }

  function handleCancelLink() {
    setShowLinkModal(false)
    setLinkUrl('')
    savedRangeRef.current = null
  }

  function handleUnlink() {
    const selection = window.getSelection()
    if (!selection) return
    let node: Node | null = selection.anchorNode
    while (node && (node as Element).nodeName !== 'A') {
      node = node.parentNode
    }
    if (node && (node as Element).nodeName === 'A') {
      const range = document.createRange()
      range.selectNodeContents(node)
      selection.removeAllRanges()
      selection.addRange(range)
    }
    document.execCommand('unlink')
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault()
    const text = e.clipboardData.getData('text/plain')
    document.execCommand('insertText', false, text)
  }

  function handleEditorMouseOver(e: React.MouseEvent) {
    const a = (e.target as HTMLElement).closest('a') as HTMLAnchorElement | null
    if (a?.href) {
      if (tooltipHideRef.current) clearTimeout(tooltipHideRef.current)
      const rect = a.getBoundingClientRect()
      setLinkTooltip({ url: a.href, top: rect.bottom + 6, left: rect.left })
    }
  }

  function scheduleLinkTooltipHide() {
    tooltipHideRef.current = setTimeout(() => setLinkTooltip(null), 300)
  }

  function cancelLinkTooltipHide() {
    if (tooltipHideRef.current) clearTimeout(tooltipHideRef.current)
  }

  const rightButtons = (
    <div className="flex items-center gap-1">
      <div className="w-px h-4 bg-gray-200 mx-0.5" />
      <button
        type="button"
        title="Insert Image"
        onMouseDown={(e) => { e.preventDefault(); handleImageUpload() }}
        className="w-7 h-7 flex items-center justify-center rounded text-gray-600 hover:bg-gray-200 hover:text-gray-900 transition-colors"
      >
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      </button>
      <button
        type="button"
        title="Insert Link"
        onMouseDown={(e) => { e.preventDefault(); handleInsertLink() }}
        className="w-7 h-7 flex items-center justify-center rounded text-gray-600 hover:bg-gray-200 hover:text-gray-900 transition-colors"
      >
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
      </button>
      <button
        type="button"
        title="Remove link"
        onMouseDown={(e) => { e.preventDefault(); handleUnlink() }}
        className="w-7 h-7 flex items-center justify-center rounded text-gray-600 hover:bg-gray-200 hover:text-gray-900 transition-colors"
      >
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M18.84 12.25l1.72-1.71h-.02a5.004 5.004 0 0 0-.12-7.07 5.006 5.006 0 0 0-6.95 0l-1.72 1.71" />
          <path d="M5.17 11.75l-1.71 1.71a5.004 5.004 0 0 0 .12 7.07 5.006 5.006 0 0 0 6.95 0l1.71-1.71" />
          <line x1="8" y1="2" x2="8" y2="5" />
          <line x1="2" y1="8" x2="5" y2="8" />
          <line x1="16" y1="19" x2="16" y2="22" />
          <line x1="19" y1="16" x2="22" y2="16" />
        </svg>
      </button>
    </div>
  )

  return (
    <div>
      {isDuplicate && (
        <div className="flex items-center gap-3 mb-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <span>This post has a duplicate title. Consider updating the URL slug or title above before publishing.</span>
        </div>
      )}
      {/* Header: slug breadcrumb + View Live */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <span className="text-gray-400 font-medium">Set URL:</span>
          <a href="/admin/posts" className="hover:text-gray-600">blog</a>
          <span>/</span>
          <input
            type="text"
            value={slug}
            onChange={(e) => { setSlugManuallyEdited(true); setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')) }}
            className="text-gray-600 bg-transparent outline-none border-b border-dashed border-gray-300 hover:border-gray-500 focus:border-stone-400 focus:text-gray-900 transition-colors min-w-0 w-96"
          />
        </div>
        {status === 'published' && (
          <a
            href={`/blog/${slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-white text-stone-600 border border-stone-200 hover:bg-stone-50 transition-colors"
          >
            View Live
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>
        )}
      </div>

      <div className="flex gap-6 items-start">
        {/* Main editor area */}
        <div className="flex-1 min-w-0 bg-white border border-gray-200 rounded-lg overflow-hidden flex flex-col h-[calc(100vh-12rem)]">
          {/* Toolbar */}
          <WysiwygToolbar right={rightButtons} onCodeView={toggleCodeView} codeView={codeView} />

          {/* Scrollable content area */}
          <div className={`flex-1 overflow-y-auto ${codeView ? '' : ''}`}>
            {/* Title input */}
            <div className="px-8 pt-5 pb-0">
              <textarea
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Post title"
                rows={2}
                className="w-full text-2xl font-bold text-gray-900 border-none outline-none placeholder:text-gray-300 resize-none leading-tight bg-transparent break-words"
              />
            </div>

            {/* Subtitle input */}
            <div className="px-8 pt-2 pb-0">
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="Subtitle"
                maxLength={120}
                className="w-full text-base text-gray-500 border-none outline-none placeholder:text-gray-300 bg-transparent italic"
              />
            </div>

            {/* Code view */}
            {codeView && (
              <textarea
                value={codeHtml}
                onChange={e => setCodeHtml(e.target.value)}
                spellCheck={false}
                className="w-full px-6 py-5 text-xs font-mono bg-gray-950 text-green-400 min-h-[500px] focus:outline-none resize-y"
              />
            )}

            {/* Contenteditable rich editor */}
            <div
              ref={(el) => {
                contentRef.current = el
                try {
                  if (el && !el.innerHTML.trim() && initialHtml) {
                    el.innerHTML = initialHtml
                  }
                } catch {}
              }}
              contentEditable
              suppressContentEditableWarning
              onPaste={handlePaste}
              onMouseOver={handleEditorMouseOver}
              onMouseLeave={scheduleLinkTooltipHide}
              onInput={() => {
                if (contentRef.current) {
                  liveHtmlRef.current = contentRef.current.innerHTML
                  sessionStorage.setItem(draftKey, contentRef.current.innerHTML)
                }
              }}
              spellCheck={false}
              style={{ display: codeView ? 'none' : undefined }}
              className="px-8 pb-6 text-sm text-gray-800 leading-relaxed min-h-[500px] focus:outline-none max-w-3xl
                [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-stone-700 [&_h2]:mt-6 [&_h2]:mb-3 [&_h2]:pb-1 [&_h2]:border-b [&_h2]:border-stone-100
                [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-gray-900 [&_h3]:mt-5 [&_h3]:mb-2
                [&_h4]:text-sm [&_h4]:font-semibold [&_h4]:text-gray-800 [&_h4]:mt-4 [&_h4]:mb-1
                [&_p]:mb-2
                [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2
                [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2
                [&_li]:mb-1
                [&_a]:text-stone-600 [&_a]:underline
                [&_img]:max-w-full [&_img]:rounded-lg [&_img]:my-3
                [&_blockquote]:bg-stone-50 [&_blockquote]:border-l-4 [&_blockquote]:border-stone-400 [&_blockquote]:px-4 [&_blockquote]:py-3 [&_blockquote]:my-3 [&_blockquote]:rounded-r-lg [&_blockquote]:italic
                [&_hr]:my-4 [&_hr]:border-gray-200"
            />
          </div>

          <input
            ref={imageInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleImageInputChange}
          />
        </div>

        {/* Link modal */}
        {showLinkModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={handleCancelLink}>
            <div className="bg-white rounded-xl shadow-xl p-6 w-96" onClick={e => e.stopPropagation()}>
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Insert Link</h3>
              <input
                type="url"
                value={linkUrl}
                onChange={e => setLinkUrl(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleConfirmLink(); if (e.key === 'Escape') handleCancelLink() }}
                placeholder="https://example.com"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-300 mb-4"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={handleCancelLink}
                  className="px-4 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmLink}
                  disabled={!linkUrl.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-40"
                >
                  Insert
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Link hover tooltip */}
        {linkTooltip && (
          <div
            className="fixed z-50 flex items-center gap-2 bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-1.5 text-xs"
            style={{ top: linkTooltip.top, left: linkTooltip.left }}
            onMouseEnter={cancelLinkTooltipHide}
            onMouseLeave={scheduleLinkTooltipHide}
          >
            <span className="text-gray-400 max-w-[220px] truncate">{linkTooltip.url.replace(/^https?:\/\//, '')}</span>
            <button
              onClick={async () => {
                await navigator.clipboard.writeText(linkTooltip.url)
                setLinkCopied(true)
                setTimeout(() => setLinkCopied(false), 2000)
              }}
              className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-800 font-medium whitespace-nowrap transition-colors"
            >
              {linkCopied ? (
                <>
                  Copied
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </>
              ) : (
                <>
                  Copy
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                </>
              )}
            </button>
            <a
              href={linkTooltip.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setLinkTooltip(null)}
              className="inline-flex items-center gap-1 text-stone-600 hover:text-stone-800 font-medium whitespace-nowrap transition-colors"
            >
              Open
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
          </div>
        )}

        {/* SEO panel */}
        <SeoPanel
          metaTitle={metaTitle}
          metaDescription={metaDescription}
          heroImageUrl={heroImageUrl}
          status={status}
          scheduledAt={scheduledAt}
          publishedAt={publishedAt}
          isHero={isHero}
          heroCount={heroCount}
          isFeatured={isFeatured}
          featuredOrder={featuredOrder}
          featuredCount={featuredCount}
          categories={categories}
          selectedCategoryIds={selectedCategoryIds}
          allTags={allTags}
          selectedTagIds={selectedTagIds}
          saving={saving}
          savedIndicator={savedIndicator}
          onMetaTitleChange={setMetaTitle}
          onMetaDescriptionChange={setMetaDescription}
          onHeroImageChange={setHeroImageUrl}
          onStatusChange={setStatus}
          onScheduledAtChange={setScheduledAt}
          onPublishedAtChange={setPublishedAt}
          onHeroChange={setIsHero}
          onFeaturedChange={(f, o) => { setIsFeatured(f); setFeaturedOrder(o) }}
          onCategoryToggle={handleCategoryToggle}
          onTagToggle={handleTagToggle}
          onTagCreate={handleTagCreate}
          onSave={handleSave}
          onPublish={handlePublish}
        />
      </div>
    </div>
  )
}
