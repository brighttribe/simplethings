'use client'

import { useState, useRef, useCallback, useMemo } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { generateSlug } from '@/lib/blog-utils'
import { WysiwygToolbar } from '@/components/admin/wysiwyg-toolbar'

const RETAILERS = [
  'Amazon', 'Anthropologie', 'Arhaus', 'Article', 'Ashley Furniture', 'At Home',
  'Ballard Designs', 'CB2', 'Crate & Barrel', 'Ethan Allen',
  'HomeGoods', 'Hobby Lobby', 'IKEA', 'Joss & Main', 'McGee & Co.',
  'Michaels', 'Pottery Barn', 'Pottery Barn Kids', 'Restoration Hardware',
  'RH Baby & Child', 'Rooms To Go', 'Serena & Lily', 'Studio McGee',
  'Target', 'TJ Maxx', 'Wayfair', 'West Elm', 'Williams Sonoma',
  'World Market', 'Z Gallerie',
]

interface Hotspot {
  id: string
  position_x: number
  position_y: number
  sort_order: number
  title: string | null
  retailer: string | null
  url: string | null
}

interface MoodBoard {
  id: string
  title: string
  slug: string
  description: string | null
  content_below: string | null
  image_url: string | null
  ltk_url: string | null
  status: string
  published_at: string | null
  is_featured: boolean
}

interface Props {
  board: MoodBoard
  initialHotspots: Hotspot[]
  featuredCount: number
}

interface AddModalState {
  x: number
  y: number
  title: string
  retailer: string
  url: string
}

export default function MoodBoardEditor({ board, initialHotspots, featuredCount }: Props) {
  const router = useRouter()
  const [title, setTitle] = useState(board.title)
  const [slug, setSlug] = useState(board.slug)
  const [imageUrl, setImageUrl] = useState(board.image_url ?? '')
  const [ltkUrl, setLtkUrl] = useState(board.ltk_url ?? '')
  const [status, setStatus] = useState(board.status)
  const [publishedAt, setPublishedAt] = useState(
    board.published_at ? board.published_at.slice(0, 16) : ''
  )
  const [hotspots, setHotspots] = useState<Hotspot[]>(initialHotspots)
  const [saving, setSaving] = useState(false)
  const [savedIndicator, setSavedIndicator] = useState(false)
  const [editingHotspot, setEditingHotspot] = useState<Hotspot | null>(null)
  const [addModal, setAddModal] = useState<AddModalState | null>(null)
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)
  const [isFeatured, setIsFeatured] = useState(board.is_featured ?? false)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [boardOpen, setBoardOpen] = useState(true)
  const [codeViewAbove, setCodeViewAbove] = useState(false)
  const [codeViewBelow, setCodeViewBelow] = useState(false)
  const [codeHtmlAbove, setCodeHtmlAbove] = useState(board.description ?? '')
  const [codeHtmlBelow, setCodeHtmlBelow] = useState(board.content_below ?? '')
  const [addRetailerOpen, setAddRetailerOpen] = useState(false)
  const [editRetailerOpen, setEditRetailerOpen] = useState(false)

  const imageContainerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const bodyAboveRef = useRef<HTMLDivElement>(null)
  const bodyBelowRef = useRef<HTMLDivElement>(null)
  const liveAboveRef = useRef(board.description ?? '')
  const liveBelowRef = useRef(board.content_below ?? '')

  // ── Retailer autocomplete ──────────────────────────────────────────────────

  const allRetailers = useMemo(() => {
    const existing = initialHotspots
      .map(h => h.retailer)
      .filter((r): r is string => !!r && r.trim().length > 0)
    return [...new Set([...RETAILERS, ...existing])].sort()
  }, [initialHotspots])

  function getRetailerMatches(query: string) {
    if (!query.trim()) return []
    const q = query.toLowerCase()
    return allRetailers.filter(r => r.toLowerCase().includes(q)).slice(0, 8)
  }

  // ── Code view sync ─────────────────────────────────────────────────────────

  function toggleCodeViewAbove() {
    if (!codeViewAbove) {
      setCodeHtmlAbove(liveAboveRef.current)
    } else {
      liveAboveRef.current = codeHtmlAbove
      if (bodyAboveRef.current) bodyAboveRef.current.innerHTML = codeHtmlAbove
    }
    setCodeViewAbove(v => !v)
  }

  function toggleCodeViewBelow() {
    if (!codeViewBelow) {
      setCodeHtmlBelow(liveBelowRef.current)
    } else {
      liveBelowRef.current = codeHtmlBelow
      if (bodyBelowRef.current) bodyBelowRef.current.innerHTML = codeHtmlBelow
    }
    setCodeViewBelow(v => !v)
  }

  // ── Image upload ───────────────────────────────────────────────────────────

  async function uploadFile(file: File) {
    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/upload-image', { method: 'POST', body: form })
      const json = await res.json()
      if (json.url) setImageUrl(json.url)
    } finally {
      setUploading(false)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) uploadFile(file)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) uploadFile(file)
  }

  // ── Hotspot placement ──────────────────────────────────────────────────────

  function handleImageClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!imageContainerRef.current) return
    const rect = imageContainerRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setAddModal({ x, y, title: '', retailer: '', url: '' })
  }

  async function saveNewHotspot() {
    if (!addModal) return
    const res = await fetch(`/api/mood-boards/${board.id}/hotspots`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        position_x: addModal.x,
        position_y: addModal.y,
        title: addModal.title,
        retailer: addModal.retailer,
        url: addModal.url,
      }),
    })
    if (res.ok) {
      const newSpot = await res.json()
      setHotspots(prev => [...prev, newSpot])
    }
    setAddModal(null)
  }

  // ── Edit existing hotspot ──────────────────────────────────────────────────

  async function saveEditHotspot() {
    if (!editingHotspot) return
    const res = await fetch(`/api/mood-boards/${board.id}/hotspots/${editingHotspot.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: editingHotspot.title,
        retailer: editingHotspot.retailer,
        url: editingHotspot.url,
      }),
    })
    if (res.ok) {
      const updated = await res.json()
      setHotspots(prev => prev.map(s => s.id === updated.id ? updated : s))
    }
    setEditingHotspot(null)
  }

  async function deleteHotspot(id: string) {
    await fetch(`/api/mood-boards/${board.id}/hotspots/${id}`, { method: 'DELETE' })
    setHotspots(prev => prev.filter(s => s.id !== id))
    if (editingHotspot?.id === id) setEditingHotspot(null)
  }

  // ── Reorder hotspots ───────────────────────────────────────────────────────

  async function moveHotspot(index: number, direction: 'up' | 'down') {
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    if (swapIndex < 0 || swapIndex >= hotspots.length) return

    const a = hotspots[index]
    const b = hotspots[swapIndex]
    const newOrder = [...hotspots]
    newOrder[index] = { ...b, sort_order: a.sort_order }
    newOrder[swapIndex] = { ...a, sort_order: b.sort_order }
    newOrder.sort((x, y) => x.sort_order - y.sort_order)
    setHotspots(newOrder)

    await Promise.all([
      fetch(`/api/mood-boards/${board.id}/hotspots/${a.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sort_order: b.sort_order }),
      }),
      fetch(`/api/mood-boards/${board.id}/hotspots/${b.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sort_order: a.sort_order }),
      }),
    ])
  }

  // ── Save board ─────────────────────────────────────────────────────────────

  const save = useCallback(async (overrideStatus?: string) => {
    setSaving(true)
    const saveStatus = overrideStatus ?? status
    const body: Record<string, unknown> = {
      title, slug, image_url: imageUrl, ltk_url: ltkUrl, status: saveStatus, is_featured: isFeatured,
      description: liveAboveRef.current,
      content_below: liveBelowRef.current,
    }
    if (saveStatus === 'published' && publishedAt) body.published_at = new Date(publishedAt).toISOString()
    await fetch(`/api/mood-boards/${board.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    router.push('/admin/mood-boards')
  }, [title, slug, imageUrl, ltkUrl, status, publishedAt, isFeatured, board.id, router])

  const richTextClasses = `px-6 py-4 text-sm text-gray-800 leading-relaxed min-h-[100px] focus:outline-none
    [&_h2]:text-base [&_h2]:font-bold [&_h2]:mt-4 [&_h2]:mb-2
    [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-3 [&_h3]:mb-1
    [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2
    [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2 [&_li]:mb-1
    [&_a]:text-stone-600 [&_a]:underline [&_strong]:font-semibold`

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Edit Mood Board</h1>
        {savedIndicator && (
          <span className="text-xs text-green-600 font-medium">Saved</span>
        )}
      </div>

      {/* ── Introduction WYSIWYG ── */}
      <div className="mb-6 bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-4 pt-2.5 pb-1 border-b border-gray-100 bg-gray-50">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Introduction</p>
        </div>
        <WysiwygToolbar onCodeView={toggleCodeViewAbove} codeView={codeViewAbove} />
        {codeViewAbove && (
          <textarea
            value={codeHtmlAbove}
            onChange={e => { setCodeHtmlAbove(e.target.value); liveAboveRef.current = e.target.value }}
            spellCheck={false}
            className="w-full px-6 py-4 text-xs font-mono bg-gray-950 text-green-400 min-h-[120px] focus:outline-none resize-y"
          />
        )}
        <div
          ref={(el) => {
            bodyAboveRef.current = el
            try {
              if (el && !el.innerHTML.trim() && liveAboveRef.current) {
                el.innerHTML = liveAboveRef.current
              }
            } catch {}
          }}
          contentEditable
          suppressContentEditableWarning
          onInput={() => {
            if (bodyAboveRef.current) liveAboveRef.current = bodyAboveRef.current.innerHTML
          }}
          style={{ display: codeViewAbove ? 'none' : undefined }}
          className={richTextClasses}
        />
      </div>

      <div className="flex gap-8 items-start">
        {/* ── Left column ── */}
        <div className="flex-1 min-w-0 space-y-6">

          {/* Collapsible image + hotspot section */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setBoardOpen(v => !v)}
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <span>Board Image &amp; Hotspots</span>
              <svg
                width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                className={`transition-transform duration-200 ${boardOpen ? '' : '-rotate-90'}`}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {boardOpen && (
              <div className="border-t border-gray-100 p-4 space-y-4">
                {/* Image area */}
                {!imageUrl ? (
                  <div
                    onDrop={handleDrop}
                    onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                    onDragLeave={() => setDragOver(false)}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl flex flex-col items-center justify-center py-16 cursor-pointer transition-colors ${
                      dragOver ? 'border-[#3d5c3a] bg-[#e4ede2]' : 'border-[#e8e2d9] bg-[#faf7f2] hover:border-[#3d5c3a]'
                    }`}
                  >
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-400 mb-2">
                      <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                    </svg>
                    <p className="text-sm text-gray-500 font-medium">
                      {uploading ? 'Uploading…' : 'Drop image here or click to upload'}
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </div>
                ) : (
                  <div>
                    <div
                      ref={imageContainerRef}
                      onClick={handleImageClick}
                      className="relative select-none cursor-crosshair rounded-xl overflow-hidden"
                    >
                      <Image
                        src={imageUrl}
                        alt={title}
                        width={800}
                        height={1000}
                        className="w-full h-auto"
                      />
                      {hotspots.map((spot, i) => (
                        <button
                          key={spot.id}
                          onClick={e => { e.stopPropagation(); setEditingHotspot(spot) }}
                          style={{ left: `${spot.position_x}%`, top: `${spot.position_y}%` }}
                          className="absolute -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[#f5f0e8] border-2 border-[#1e1c19] flex items-center justify-center text-sm font-bold text-[#1e1c19] cursor-pointer hover:bg-[#e4ede2] transition-colors shadow-md"
                          title={spot.title ?? ''}
                        >
                          {i + 1}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-gray-400 mt-2 text-center">
                      Click the image to add a hotspot — click existing dots to edit
                    </p>
                    <button
                      onClick={() => setImageUrl('')}
                      className="mt-1 text-xs text-gray-400 hover:text-red-500 transition-colors"
                    >
                      Remove image
                    </button>
                  </div>
                )}

                {/* Hotspot list */}
                {hotspots.length > 0 && (
                  <div>
                    <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Hotspots</h2>
                    <div className="space-y-2">
                      {hotspots.map((spot, i) => (
                        <div
                          key={spot.id}
                          className="flex items-center gap-3 bg-[#faf7f2] border border-gray-200 rounded-lg px-3 py-2"
                        >
                          <span className="w-6 h-6 rounded-full bg-[#1e1c19] text-white text-xs font-bold flex items-center justify-center shrink-0">
                            {i + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{spot.title || '(no title)'}</p>
                            <p className="text-xs text-gray-400 truncate">
                              {spot.retailer && <span className="mr-2">{spot.retailer}</span>}
                              {spot.url && (
                                <span className="truncate">{spot.url.length > 40 ? spot.url.slice(0, 40) + '…' : spot.url}</span>
                              )}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => moveHotspot(i, 'up')}
                              disabled={i === 0}
                              className="p-1 text-gray-300 hover:text-gray-600 disabled:opacity-30 transition-colors"
                              title="Move up"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="18 15 12 9 6 15"/></svg>
                            </button>
                            <button
                              onClick={() => moveHotspot(i, 'down')}
                              disabled={i === hotspots.length - 1}
                              className="p-1 text-gray-300 hover:text-gray-600 disabled:opacity-30 transition-colors"
                              title="Move down"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                            </button>
                            <button
                              onClick={() => setEditingHotspot(spot)}
                              className="p-1 text-gray-300 hover:text-gray-600 transition-colors"
                              title="Edit"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            </button>
                            <button
                              onClick={() => deleteHotspot(spot.id)}
                              className="p-1 text-gray-300 hover:text-red-500 transition-colors"
                              title="Delete"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Notes WYSIWYG ── */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-4 pt-2.5 pb-1 border-b border-gray-100 bg-gray-50">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Additional Notes</p>
            </div>
            <WysiwygToolbar onCodeView={toggleCodeViewBelow} codeView={codeViewBelow} />
            {codeViewBelow && (
              <textarea
                value={codeHtmlBelow}
                onChange={e => { setCodeHtmlBelow(e.target.value); liveBelowRef.current = e.target.value }}
                spellCheck={false}
                className="w-full px-6 py-4 text-xs font-mono bg-gray-950 text-green-400 min-h-[120px] focus:outline-none resize-y"
              />
            )}
            <div
              ref={(el) => {
                bodyBelowRef.current = el
                try {
                  if (el && !el.innerHTML.trim() && liveBelowRef.current) {
                    el.innerHTML = liveBelowRef.current
                  }
                } catch {}
              }}
              contentEditable
              suppressContentEditableWarning
              onInput={() => {
                if (bodyBelowRef.current) liveBelowRef.current = bodyBelowRef.current.innerHTML
              }}
              style={{ display: codeViewBelow ? 'none' : undefined }}
              className={richTextClasses}
            />
          </div>
        </div>

        {/* ── Right sidebar ── */}
        <div className="w-72 shrink-0 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Title</label>
            <input
              value={title}
              onChange={e => {
                setTitle(e.target.value)
                if (!slugManuallyEdited) setSlug(generateSlug(e.target.value))
              }}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-300"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Slug</label>
            <input
              value={slug}
              onChange={e => { setSlug(e.target.value); setSlugManuallyEdited(true) }}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-300 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Status</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none bg-white"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>

          {status === 'published' && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Published At</label>
              <input
                type="datetime-local"
                value={publishedAt}
                onChange={e => setPublishedAt(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-300"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">LTK URL</label>
            <input
              value={ltkUrl}
              onChange={e => setLtkUrl(e.target.value)}
              placeholder="https://www.shopltk.com/…"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-300"
            />
          </div>

          {/* Homepage Featured */}
          <div className="bg-[#faf7f2] border border-[#e8e2d9] rounded-lg p-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Homepage Featured</p>
            <label className={`flex items-start gap-2 ${!isFeatured && featuredCount >= 4 ? 'opacity-50' : 'cursor-pointer'}`}>
              <input
                type="checkbox"
                checked={isFeatured}
                disabled={!isFeatured && featuredCount >= 4}
                onChange={e => setIsFeatured(e.target.checked)}
                className="mt-0.5"
              />
              <span className="text-sm text-gray-700 leading-snug">
                {isFeatured
                  ? 'Featured on homepage'
                  : featuredCount >= 4
                    ? '4 of 4 slots filled'
                    : `Feature on homepage (${featuredCount}/4 slots used)`}
              </span>
            </label>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => save()}
              disabled={saving}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-[#3d5c3a] rounded-lg hover:bg-[#2e4529] disabled:opacity-60 transition-colors"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button
              onClick={() => save('published')}
              disabled={saving}
              className="flex-1 px-4 py-2 text-sm font-medium text-[#3d5c3a] border border-[#3d5c3a] rounded-lg hover:bg-[#e4ede2] disabled:opacity-60 transition-colors"
            >
              Publish
            </button>
          </div>
        </div>
      </div>

      {/* ── Add hotspot modal ── */}
      {addModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Add Hotspot</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Title</label>
                <input
                  autoFocus
                  value={addModal.title}
                  onChange={e => setAddModal(m => m ? { ...m, title: e.target.value } : m)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-300"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Retailer</label>
                <div className="relative">
                  <input
                    value={addModal.retailer}
                    onChange={e => setAddModal(m => m ? { ...m, retailer: e.target.value } : m)}
                    onFocus={() => setAddRetailerOpen(true)}
                    onBlur={() => setAddRetailerOpen(false)}
                    placeholder="e.g. Pottery Barn"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-300"
                  />
                  {addRetailerOpen && getRetailerMatches(addModal.retailer).length > 0 && (
                    <div className="absolute z-20 w-full mt-0.5 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden max-h-44 overflow-y-auto">
                      {getRetailerMatches(addModal.retailer).map(r => (
                        <button
                          key={r}
                          type="button"
                          onMouseDown={() => setAddModal(m => m ? { ...m, retailer: r } : m)}
                          className="w-full text-left px-3 py-2 text-sm text-gray-800 hover:bg-[#f0ebe2] transition-colors"
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">URL <span className="text-red-500">*</span></label>
                <input
                  value={addModal.url}
                  onChange={e => setAddModal(m => m ? { ...m, url: e.target.value } : m)}
                  placeholder="https://"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-300"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setAddModal(null)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveNewHotspot}
                disabled={!addModal.url.trim()}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-[#3d5c3a] rounded-lg hover:bg-[#2e4529] disabled:opacity-50 transition-colors"
              >
                Add Hotspot
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit hotspot modal ── */}
      {editingHotspot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Edit Hotspot</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Title</label>
                <input
                  autoFocus
                  value={editingHotspot.title ?? ''}
                  onChange={e => setEditingHotspot(s => s ? { ...s, title: e.target.value } : s)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-300"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Retailer</label>
                <div className="relative">
                  <input
                    value={editingHotspot.retailer ?? ''}
                    onChange={e => setEditingHotspot(s => s ? { ...s, retailer: e.target.value } : s)}
                    onFocus={() => setEditRetailerOpen(true)}
                    onBlur={() => setEditRetailerOpen(false)}
                    placeholder="e.g. Pottery Barn"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-300"
                  />
                  {editRetailerOpen && getRetailerMatches(editingHotspot.retailer ?? '').length > 0 && (
                    <div className="absolute z-20 w-full mt-0.5 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden max-h-44 overflow-y-auto">
                      {getRetailerMatches(editingHotspot.retailer ?? '').map(r => (
                        <button
                          key={r}
                          type="button"
                          onMouseDown={() => setEditingHotspot(s => s ? { ...s, retailer: r } : s)}
                          className="w-full text-left px-3 py-2 text-sm text-gray-800 hover:bg-[#f0ebe2] transition-colors"
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">URL</label>
                <input
                  value={editingHotspot.url ?? ''}
                  onChange={e => setEditingHotspot(s => s ? { ...s, url: e.target.value } : s)}
                  placeholder="https://"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-300"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button
                onClick={() => deleteHotspot(editingHotspot.id)}
                className="px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => setEditingHotspot(null)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveEditHotspot}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-[#3d5c3a] rounded-lg hover:bg-[#2e4529] transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
