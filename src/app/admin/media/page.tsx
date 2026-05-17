'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface MediaFile {
  name: string
  size: number
  created_at: string
  url: string
  alt_text: string
  caption: string
}

const ROWS = 6

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

export default function MediaPage() {
  const [files, setFiles] = useState<MediaFile[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [previewIndex, setPreviewIndex] = useState<number | null>(null)
  const [dimensions, setDimensions] = useState<{ w: number; h: number } | null>(null)
  const [copied, setCopied] = useState(false)
  const [altText, setAltText] = useState('')
  const [caption, setCaption] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<MediaFile | null>(null)
  const [cols, setCols] = useState(4)
  const [search, setSearch] = useState('')
  const [visibleRows, setVisibleRows] = useState(ROWS)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchFiles = useCallback(async () => {
    const res = await fetch('/api/media')
    if (res.ok) setFiles(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { fetchFiles() }, [fetchFiles])
  useEffect(() => { setVisibleRows(ROWS) }, [search, cols])

  const filtered = files.filter(f => f.name.toLowerCase().includes(search.toLowerCase()))
  const preview = previewIndex !== null ? filtered[previewIndex] ?? null : null

  // Populate fields + detect dimensions when preview changes
  useEffect(() => {
    if (!preview) { setDimensions(null); return }
    setAltText(preview.alt_text ?? '')
    setCaption(preview.caption ?? '')
    setSaved(false)
    setDimensions(null)
    const img = new Image()
    img.onload = () => setDimensions({ w: img.naturalWidth, h: img.naturalHeight })
    img.src = preview.url
  }, [preview?.name]) // eslint-disable-line react-hooks/exhaustive-deps

  // Keyboard nav
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (previewIndex === null) return
      if (e.key === 'Escape') setPreviewIndex(null)
      if (e.key === 'ArrowLeft') setPreviewIndex(i => i !== null && i > 0 ? i - 1 : i)
      if (e.key === 'ArrowRight') setPreviewIndex(i => i !== null && i < filtered.length - 1 ? i + 1 : i)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [previewIndex, filtered.length])

  function scheduleMetaSave(name: string, alt: string, cap: string) {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    setSaved(false)
    saveTimer.current = setTimeout(async () => {
      setSaving(true)
      await fetch('/api/media', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, alt_text: alt, caption: cap }),
      })
      setFiles(prev => prev.map(f => f.name === name ? { ...f, alt_text: alt, caption: cap } : f))
      setSaving(false)
      setSaved(true)
    }, 800)
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files
    if (!selected?.length) return
    setUploading(true)
    for (const file of Array.from(selected)) {
      const fd = new FormData()
      fd.append('file', file)
      await fetch('/api/upload-image', { method: 'POST', body: fd })
    }
    await fetchFiles()
    setUploading(false)
    e.target.value = ''
  }

  async function confirmDeleteFile() {
    if (!confirmDelete) return
    const file = confirmDelete
    setConfirmDelete(null)
    setDeleting(file.url)
    await fetch('/api/media', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: file.name }),
    })
    setFiles(prev => prev.filter(f => f.name !== file.name))
    setPreviewIndex(null)
    setDeleting(null)
  }

  function copyUrl() {
    if (!preview) return
    navigator.clipboard.writeText(preview.url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const pageSize = cols * visibleRows
  const visible = filtered.slice(0, pageSize)
  const hasMore = filtered.length > pageSize
  const gridClass = cols === 3 ? 'grid-cols-3' : cols === 5 ? 'grid-cols-5' : 'grid-cols-4'
  const ext = preview?.name.split('.').pop()?.toLowerCase() ?? 'webp'

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold text-gray-900">Media Library</h1>
        <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          {uploading ? 'Uploading...' : 'Upload Images'}
        </button>
        <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden" onChange={handleUpload} />
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input type="text" placeholder="Search images…" value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-8 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400" />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
        <div className="flex items-center gap-1 border border-gray-200 rounded-lg p-0.5">
          {[3, 4, 5].map(n => (
            <button key={n} onClick={() => setCols(n)}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${cols === n ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-800'}`}>
              {n}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-400 whitespace-nowrap">
          {search ? `${filtered.length} of ${files.length}` : files.length} image{files.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Grid area */}
      <div className="relative">

        {loading ? (
          <div className="flex items-center justify-center h-64 text-sm text-gray-400">Loading...</div>
        ) : files.length === 0 ? (
          <div onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-gray-300 hover:bg-gray-50 transition-colors">
            <svg className="w-10 h-10 text-gray-300 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
            </svg>
            <p className="text-sm text-gray-400">No images yet — click to upload</p>
            <p className="text-xs text-gray-300 mt-1">Auto-converted to WebP · 1500px wide</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-sm text-gray-400">
            No images match &ldquo;{search}&rdquo;
          </div>
        ) : (
          <>
            <div className={`grid ${gridClass} gap-3`}>
              {visible.map((file, idx) => (
                <div key={file.name}
                  onClick={() => setPreviewIndex(idx)}
                  className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                    previewIndex === idx ? 'border-gray-900 ring-2 ring-gray-900/10' : 'border-transparent hover:border-gray-300'
                  }`}>
                  <img src={file.url} alt={file.alt_text || file.name} className="w-full aspect-square object-cover bg-gray-50" />
                  <button
                    onClick={e => { e.stopPropagation(); setConfirmDelete(file) }}
                    disabled={deleting === file.url}
                    className="absolute top-1.5 left-1.5 w-7 h-7 bg-white/90 rounded-full items-center justify-center hidden group-hover:flex hover:bg-red-50 transition-colors shadow-sm">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
                      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
            {hasMore && (
              <div className="mt-5 text-center">
                <button onClick={() => setVisibleRows(r => r + ROWS)}
                  className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors">
                  Load more ({filtered.length - pageSize} remaining)
                </button>
              </div>
            )}
          </>
        )}

        {/* ── Attachment detail overlay ── */}
        {preview && (
          <div className="absolute inset-0 bg-white rounded-xl border border-gray-200 shadow-lg flex overflow-hidden z-10" style={{ minHeight: '480px' }}>

            {/* Left: image */}
            <div className="flex-1 bg-gray-50 flex items-center justify-center p-6 relative">
              <img src={preview.url} alt={altText || preview.name}
                className="max-w-full max-h-full object-contain rounded-lg shadow-sm" />

              {/* Prev / Next */}
              {previewIndex !== null && previewIndex > 0 && (
                <button onClick={() => setPreviewIndex(i => i !== null ? i - 1 : i)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow flex items-center justify-center text-gray-600 hover:text-gray-900 hover:shadow-md transition-all">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
              )}
              {previewIndex !== null && previewIndex < filtered.length - 1 && (
                <button onClick={() => setPreviewIndex(i => i !== null ? i + 1 : i)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow flex items-center justify-center text-gray-600 hover:text-gray-900 hover:shadow-md transition-all">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              )}

              {/* Position indicator */}
              {previewIndex !== null && (
                <p className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] text-gray-400">
                  {previewIndex + 1} / {filtered.length}
                </p>
              )}
            </div>

            {/* Right: details */}
            <div className="w-80 shrink-0 border-l border-gray-200 flex flex-col overflow-y-auto">

              {/* Title bar */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 shrink-0">
                <h3 className="text-sm font-semibold text-gray-900">Attachment Details</h3>
                <div className="flex items-center gap-3">
                  {saving && <span className="text-[10px] text-gray-400">Saving…</span>}
                  {!saving && saved && <span className="text-[10px] text-green-600">Saved</span>}
                  <button onClick={() => setPreviewIndex(null)}
                    className="text-gray-400 hover:text-gray-700 transition-colors" aria-label="Close">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Metadata */}
              <div className="px-5 py-4 space-y-2 border-b border-gray-100 text-xs">
                <div><span className="font-semibold text-gray-500">Uploaded:</span> <span className="text-gray-800">{formatDate(preview.created_at)}</span></div>
                <div><span className="font-semibold text-gray-500">File name:</span> <span className="text-gray-800 break-all">{preview.name}</span></div>
                <div><span className="font-semibold text-gray-500">File type:</span> <span className="text-gray-800">image/{ext}</span></div>
                <div><span className="font-semibold text-gray-500">File size:</span> <span className="text-gray-800">{formatSize(preview.size)}</span></div>
                {dimensions && (
                  <div><span className="font-semibold text-gray-500">Dimensions:</span> <span className="text-gray-800">{dimensions.w} × {dimensions.h} px</span></div>
                )}
              </div>

              {/* Editable fields */}
              <div className="px-5 py-4 space-y-4 border-b border-gray-100 flex-1">
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                    Alternative Text
                  </label>
                  <textarea rows={3} value={altText}
                    onChange={e => { setAltText(e.target.value); scheduleMetaSave(preview.name, e.target.value, caption) }}
                    placeholder="Describe the image for screen readers…"
                    className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-gray-400 resize-none" />
                  <p className="text-[10px] text-gray-400 mt-1">Read aloud by screen readers (ADA).</p>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                    Caption
                  </label>
                  <textarea rows={2} value={caption}
                    onChange={e => { setCaption(e.target.value); scheduleMetaSave(preview.name, altText, e.target.value) }}
                    placeholder="Optional caption…"
                    className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-gray-400 resize-none" />
                </div>
              </div>

              {/* URL + actions */}
              <div className="px-5 py-4 space-y-2 shrink-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1">File URL</p>
                <input readOnly value={preview.url}
                  className="w-full text-[10px] font-mono text-gray-500 border border-gray-200 rounded-lg px-2.5 py-1.5 bg-gray-50 focus:outline-none" />
                <button onClick={copyUrl}
                  className={`w-full py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                    copied ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}>
                  {copied ? '✓ Copied to clipboard' : 'Copy URL to clipboard'}
                </button>
                <button onClick={() => setConfirmDelete(preview)} disabled={deleting === preview.url}
                  className="w-full py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50">
                  {deleting === preview.url ? 'Deleting…' : 'Delete permanently'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setConfirmDelete(null)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 w-80" onClick={e => e.stopPropagation()}>
            <div className="mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mb-3">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600">
                  <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Delete image?</h3>
              <p className="text-xs text-gray-500 break-all">{confirmDelete.name}</p>
              <p className="text-xs text-gray-400 mt-2">This cannot be undone. The file will be permanently removed from storage.</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={confirmDeleteFile}
                className="flex-1 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
