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

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2 text-xs leading-relaxed">
      <span className="font-semibold text-gray-500 shrink-0 w-20">{label}:</span>
      <span className="text-gray-800 break-all">{value}</span>
    </div>
  )
}

export default function MediaPage() {
  const [files, setFiles] = useState<MediaFile[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [preview, setPreview] = useState<MediaFile | null>(null)
  const [dimensions, setDimensions] = useState<{ w: number; h: number } | null>(null)
  const [copied, setCopied] = useState(false)
  const [altText, setAltText] = useState('')
  const [caption, setCaption] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
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

  // Populate fields when preview changes
  useEffect(() => {
    if (!preview) { setDimensions(null); return }
    setAltText(preview.alt_text ?? '')
    setCaption(preview.caption ?? '')
    setSaved(false)
    setDimensions(null)
    const img = new Image()
    img.onload = () => setDimensions({ w: img.naturalWidth, h: img.naturalHeight })
    img.src = preview.url
  }, [preview])

  // Auto-save alt + caption with debounce
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

  async function handleDelete(file: MediaFile) {
    if (!confirm(`Delete "${file.name}"?`)) return
    setDeleting(file.url)
    await fetch('/api/media', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: file.name }),
    })
    setFiles(prev => prev.filter(f => f.name !== file.name))
    if (preview?.name === file.name) setPreview(null)
    setDeleting(null)
  }

  function copyUrl() {
    if (!preview) return
    navigator.clipboard.writeText(preview.url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const filtered = files.filter(f => f.name.toLowerCase().includes(search.toLowerCase()))
  const pageSize = cols * visibleRows
  const visible = filtered.slice(0, pageSize)
  const hasMore = filtered.length > pageSize
  const gridClass = cols === 3 ? 'grid-cols-3' : cols === 5 ? 'grid-cols-5' : 'grid-cols-4'
  const ext = preview?.name.split('.').pop()?.toUpperCase() ?? 'WEBP'

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
        <div className="flex gap-5 items-start">

          {/* Grid */}
          <div className="flex-1 min-w-0">
            <div className={`grid ${gridClass} gap-3`}>
              {visible.map(file => (
                <div key={file.name}
                  onClick={() => setPreview(preview?.name === file.name ? null : file)}
                  className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                    preview?.name === file.name ? 'border-gray-900 ring-2 ring-gray-900/10' : 'border-transparent hover:border-gray-300'
                  }`}>
                  <img src={file.url} alt={file.alt_text || file.name} className="w-full aspect-square object-cover bg-gray-50" />
                  <button
                    onClick={e => { e.stopPropagation(); handleDelete(file) }}
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
          </div>

          {/* Attachment details panel */}
          {preview && (
            <div className="w-72 shrink-0 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">

              <div className="bg-gray-50 border-b border-gray-100 p-4">
                <img src={preview.url} alt={altText || preview.name}
                  className="w-full rounded-lg object-contain max-h-48" />
              </div>

              <div className="px-4 pt-3 pb-2 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">Attachment Details</h3>
                {saving && <span className="text-[10px] text-gray-400">Saving…</span>}
                {!saving && saved && <span className="text-[10px] text-green-600">Saved</span>}
              </div>

              {/* Metadata */}
              <div className="px-4 py-3 space-y-1.5 border-b border-gray-100">
                <DetailRow label="File name" value={preview.name} />
                <DetailRow label="File type" value={`image/${ext.toLowerCase()}`} />
                <DetailRow label="File size" value={formatSize(preview.size)} />
                {dimensions && <DetailRow label="Dimensions" value={`${dimensions.w} × ${dimensions.h} px`} />}
                {preview.created_at && <DetailRow label="Uploaded" value={formatDate(preview.created_at)} />}
              </div>

              {/* Editable fields */}
              <div className="px-4 py-3 space-y-3 border-b border-gray-100">
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1">
                    Alternative Text
                  </label>
                  <textarea
                    rows={2}
                    value={altText}
                    onChange={e => { setAltText(e.target.value); scheduleMetaSave(preview.name, e.target.value, caption) }}
                    placeholder="Describe the image for screen readers…"
                    className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-2 focus:outline-none focus:border-gray-400 resize-none"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">Used by screen readers (ADA accessibility).</p>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1">
                    Caption
                  </label>
                  <textarea
                    rows={2}
                    value={caption}
                    onChange={e => { setCaption(e.target.value); scheduleMetaSave(preview.name, altText, e.target.value) }}
                    placeholder="Optional caption displayed below the image…"
                    className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-2 focus:outline-none focus:border-gray-400 resize-none"
                  />
                </div>
              </div>

              {/* File URL */}
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">File URL</p>
                <p className="text-xs text-gray-500 break-all leading-relaxed mb-2 font-mono bg-gray-50 rounded p-2 border border-gray-100">
                  {preview.url}
                </p>
                <button onClick={copyUrl}
                  className={`w-full py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                    copied ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}>
                  {copied ? '✓ Copied!' : 'Copy URL to clipboard'}
                </button>
              </div>

              {/* Delete */}
              <div className="px-4 py-3">
                <button onClick={() => handleDelete(preview)} disabled={deleting === preview.url}
                  className="w-full py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50">
                  {deleting === preview.url ? 'Deleting…' : 'Delete permanently'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
