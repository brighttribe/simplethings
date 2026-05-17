'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import JSZip from 'jszip'

interface MediaFile {
  name: string
  size: number
  created_at: string
  url: string
  alt_text: string
  caption: string
}

type ViewMode = 'grid' | 'list'

const PAGE_GRID = 40
const PAGE_LIST = 25

const GRID_CLASSES: Record<number, string> = {
  3: 'grid-cols-3', 4: 'grid-cols-4', 5: 'grid-cols-5',
  6: 'grid-cols-6', 7: 'grid-cols-7', 8: 'grid-cols-8',
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function formatDateShort(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function paginationPages(cur: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  if (cur <= 4) return [1, 2, 3, 4, 5, '...', total]
  if (cur >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total]
  return [1, '...', cur - 1, cur, cur + 1, '...', total]
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
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false)
  const [view, setView] = useState<ViewMode>('grid')
  const [cols, setCols] = useState(7)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dragCounter = useRef(0)
  const lastSelectedIndex = useRef<number | null>(null)

  const fetchFiles = useCallback(async () => {
    const res = await fetch('/api/media')
    if (res.ok) setFiles(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { fetchFiles() }, [fetchFiles])
  useEffect(() => { setPage(1); setSelected(new Set()); lastSelectedIndex.current = null }, [search, view, cols])

  const filtered = files.filter(f => f.name.toLowerCase().includes(search.toLowerCase()))
  const pageSize = view === 'grid' ? PAGE_GRID : PAGE_LIST
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)
  const preview = previewIndex !== null ? filtered[previewIndex] ?? null : null
  const allPageSelected = paginated.length > 0 && paginated.every(f => selected.has(f.name))

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

  async function uploadFiles(fileList: File[]) {
    setUploading(true)
    for (const file of fileList) {
      const fd = new FormData()
      fd.append('file', file)
      await fetch('/api/upload-image', { method: 'POST', body: fd })
    }
    await fetchFiles()
    setUploading(false)
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.length) return
    uploadFiles(Array.from(e.target.files))
    e.target.value = ''
  }

  function onDragEnter(e: React.DragEvent) {
    e.preventDefault()
    dragCounter.current++
    setDragOver(true)
  }
  function onDragOver(e: React.DragEvent) { e.preventDefault() }
  function onDragLeave() {
    dragCounter.current--
    if (dragCounter.current === 0) setDragOver(false)
  }
  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    dragCounter.current = 0
    setDragOver(false)
    const dropped = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))
    if (dropped.length) uploadFiles(dropped)
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

  async function handleBulkDelete() {
    setConfirmBulkDelete(false)
    const names = Array.from(selected)
    for (const name of names) {
      await fetch('/api/media', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
    }
    setFiles(prev => prev.filter(f => !selected.has(f.name)))
    setSelected(new Set())
    setPreviewIndex(null)
  }

  async function downloadFile(file: MediaFile) {
    const res = await fetch(file.url)
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = file.name
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleBulkDownload() {
    const toDownload = files.filter(f => selected.has(f.name))
    if (toDownload.length === 1) { await downloadFile(toDownload[0]); return }
    const zip = new JSZip()
    await Promise.all(toDownload.map(async file => {
      const res = await fetch(file.url)
      zip.file(file.name, await res.blob())
    }))
    const blob = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `media-${toDownload.length}-images.zip`
    a.click()
    URL.revokeObjectURL(url)
  }

  function toggleSelect(name: string, localIdx: number, shiftKey: boolean) {
    if (shiftKey && lastSelectedIndex.current !== null) {
      const start = Math.min(lastSelectedIndex.current, localIdx)
      const end = Math.max(lastSelectedIndex.current, localIdx)
      const range = paginated.slice(start, end + 1).map(f => f.name)
      setSelected(prev => { const next = new Set(prev); range.forEach(n => next.add(n)); return next })
    } else {
      setSelected(prev => {
        const next = new Set(prev)
        next.has(name) ? next.delete(name) : next.add(name)
        return next
      })
      lastSelectedIndex.current = localIdx
    }
  }

  function toggleSelectAll() {
    setSelected(allPageSelected ? new Set() : new Set(paginated.map(f => f.name)))
  }

  function copyUrl(url: string) {
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

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
        <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden" onChange={handleFileInput} />
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-3">
        {/* View toggle */}
        <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden shrink-0">
          <button onClick={() => setView('list')} title="List view"
            className={`px-2.5 py-1.5 transition-colors ${view === 'list' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
          </button>
          <button onClick={() => setView('grid')} title="Grid view"
            className={`px-2.5 py-1.5 border-l border-gray-200 transition-colors ${view === 'grid' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
            </svg>
          </button>
        </div>

        {/* Cols dropdown (grid only) */}
        {view === 'grid' && (
          <select value={cols} onChange={e => setCols(Number(e.target.value))}
            className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-gray-400 text-gray-600 bg-white shrink-0">
            {[3, 4, 5, 6, 7, 8].map(n => (
              <option key={n} value={n}>{n} columns</option>
            ))}
          </select>
        )}

        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input type="text" placeholder="Search images…" value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-7 pr-7 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400" />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        <p className="text-xs text-gray-400 whitespace-nowrap ml-auto">
          {filtered.length !== files.length ? `${filtered.length} of ` : ''}{files.length} image{files.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 mb-3 px-4 py-2.5 bg-gray-900 text-white rounded-xl">
          <span className="text-sm font-medium">{selected.size} selected</span>
          <div className="flex items-center gap-2 ml-auto">
            <button onClick={handleBulkDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white/10 hover:bg-white/20 rounded-lg transition-colors">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download
            </button>
            <button onClick={() => setConfirmBulkDelete(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-red-500/80 hover:bg-red-500 rounded-lg transition-colors">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" />
              </svg>
              Delete
            </button>
            <button onClick={() => setSelected(new Set())}
              className="px-3 py-1.5 text-xs text-white/60 hover:text-white transition-colors">
              Deselect all
            </button>
          </div>
        </div>
      )}

      {/* Content area */}
      <div className="relative"
        onDragEnter={onDragEnter} onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}>

        {/* Drag-over overlay */}
        {dragOver && (
          <div className="absolute inset-0 z-20 rounded-xl border-2 border-dashed border-gray-400 bg-white/90 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <svg className="w-10 h-10 text-gray-400 mx-auto mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <p className="text-sm font-medium text-gray-600">Drop images to upload</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-64 text-sm text-gray-400">Loading...</div>

        ) : files.length === 0 ? (
          <div onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-gray-300 hover:bg-gray-50 transition-colors">
            <svg className="w-10 h-10 text-gray-300 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
            </svg>
            <p className="text-sm text-gray-400">No images yet — click or drop to upload</p>
            <p className="text-xs text-gray-300 mt-1">Auto-converted to WebP · 1500px wide</p>
          </div>

        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-sm text-gray-400">
            No images match &ldquo;{search}&rdquo;
          </div>

        ) : view === 'grid' ? (
          <>
            <div className="flex items-center gap-2 mb-2">
              <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer select-none">
                <input type="checkbox" checked={allPageSelected} onChange={toggleSelectAll}
                  className="rounded border-gray-300 text-gray-900 focus:ring-0" />
                {allPageSelected ? 'Deselect page' : 'Select page'}
              </label>
            </div>
            <div className={`grid ${GRID_CLASSES[cols] ?? 'grid-cols-7'} gap-2`}>
              {paginated.map((file, localIdx) => {
                const globalIdx = (page - 1) * pageSize + localIdx
                const isSelected = selected.has(file.name)
                return (
                  <div key={file.name}
                    className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                      isSelected || previewIndex === globalIdx
                        ? 'border-gray-900 ring-2 ring-gray-900/10'
                        : 'border-transparent hover:border-gray-300'
                    }`}>
                    <img src={file.url} alt={file.alt_text || file.name}
                      className="w-full aspect-square object-cover bg-gray-50"
                      onClick={() => setPreviewIndex(globalIdx)} />
                    <div className={`absolute top-1.5 left-1.5 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                      <input type="checkbox" checked={isSelected}
                        onChange={() => {}}
                        onClick={e => { e.stopPropagation(); toggleSelect(file.name, localIdx, e.shiftKey) }}
                        className="w-4 h-4 rounded border-white bg-white/90 text-gray-900 focus:ring-0 shadow-sm cursor-pointer" />
                    </div>
                  </div>
                )
              })}
            </div>
          </>

        ) : (
          /* List view */
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="w-8 px-3 py-2.5">
                    <input type="checkbox" checked={allPageSelected} onChange={toggleSelectAll}
                      className="rounded border-gray-300 text-gray-900 focus:ring-0" />
                  </th>
                  <th className="w-14 px-2 py-2.5" />
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">File</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-20">Size</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-32">Date</th>
                  <th className="px-3 py-2.5 w-52" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginated.map((file, localIdx) => {
                  const globalIdx = (page - 1) * pageSize + localIdx
                  const isSelected = selected.has(file.name)
                  return (
                    <tr key={file.name} className={`group transition-colors ${isSelected ? 'bg-blue-50/40' : 'hover:bg-gray-50/60'}`}>
                      <td className="px-3 py-2.5">
                        <input type="checkbox" checked={isSelected}
                          onChange={() => {}}
                          onClick={e => toggleSelect(file.name, localIdx, e.shiftKey)}
                          className="rounded border-gray-300 text-gray-900 focus:ring-0 cursor-pointer" />
                      </td>
                      <td className="px-2 py-2.5">
                        <img src={file.url} alt={file.alt_text || file.name}
                          className="w-11 h-11 object-cover rounded bg-gray-100 cursor-pointer"
                          onClick={() => setPreviewIndex(globalIdx)} />
                      </td>
                      <td className="px-3 py-2.5 cursor-pointer" onClick={() => setPreviewIndex(globalIdx)}>
                        <p className="font-medium text-gray-900 truncate max-w-xs">{file.name.replace(/\.[^.]+$/, '')}</p>
                        <p className="text-xs text-gray-400 truncate max-w-xs">{file.name}</p>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-gray-500 whitespace-nowrap">{formatSize(file.size)}</td>
                      <td className="px-3 py-2.5 text-xs text-gray-500 whitespace-nowrap">{formatDateShort(file.created_at)}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity text-xs">
                          <button onClick={() => copyUrl(file.url)} className="text-blue-600 hover:text-blue-800">Copy URL</button>
                          <button onClick={() => downloadFile(file)} className="text-blue-600 hover:text-blue-800">Download</button>
                          <button onClick={() => setConfirmDelete(file)} className="text-red-600 hover:text-red-800">Delete</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && filtered.length > 0 && totalPages > 1 && (
          <div className="flex items-center justify-between mt-5">
            <p className="text-xs text-gray-400">
              {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(1)} disabled={page === 1}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-default transition-colors">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="11 17 6 12 11 7" /><polyline points="18 17 13 12 18 7" />
                </svg>
              </button>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-default transition-colors">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              {paginationPages(page, totalPages).map((p, i) =>
                p === '...' ? (
                  <span key={`e${i}`} className="w-7 h-7 flex items-center justify-center text-gray-400 text-xs">…</span>
                ) : (
                  <button key={p} onClick={() => setPage(p as number)}
                    className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-medium transition-colors ${
                      page === p ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'
                    }`}>
                    {p}
                  </button>
                )
              )}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-default transition-colors">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
              <button onClick={() => setPage(totalPages)} disabled={page === totalPages}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-default transition-colors">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="13 17 18 12 13 7" /><polyline points="6 17 11 12 6 7" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Attachment detail overlay */}
        {preview && (
          <div className="absolute top-0 left-0 right-0 bg-white rounded-xl border border-gray-200 shadow-lg flex overflow-hidden z-10" style={{ height: '580px' }}>
            <div className="flex-1 bg-gray-50 flex items-center justify-center p-6 relative">
              <img src={preview.url} alt={altText || preview.name}
                className="max-w-full max-h-full object-contain rounded-lg shadow-sm" />
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
              {previewIndex !== null && (
                <p className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] text-gray-400">
                  {previewIndex + 1} / {filtered.length}
                </p>
              )}
            </div>

            <div className="w-80 shrink-0 border-l border-gray-200 flex flex-col overflow-y-auto">
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

              <div className="px-5 py-4 space-y-2 border-b border-gray-100 text-xs">
                <div><span className="font-semibold text-gray-500">Uploaded:</span> <span className="text-gray-800">{formatDate(preview.created_at)}</span></div>
                <div><span className="font-semibold text-gray-500">File name:</span> <span className="text-gray-800 break-all">{preview.name}</span></div>
                <div><span className="font-semibold text-gray-500">File type:</span> <span className="text-gray-800">image/{ext}</span></div>
                <div><span className="font-semibold text-gray-500">File size:</span> <span className="text-gray-800">{formatSize(preview.size)}</span></div>
                {dimensions && (
                  <div><span className="font-semibold text-gray-500">Dimensions:</span> <span className="text-gray-800">{dimensions.w} × {dimensions.h} px</span></div>
                )}
              </div>

              <div className="px-5 py-4 space-y-4 border-b border-gray-100 flex-1">
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">Alternative Text</label>
                  <textarea rows={3} value={altText}
                    onChange={e => { setAltText(e.target.value); scheduleMetaSave(preview.name, e.target.value, caption) }}
                    placeholder="Describe the image for screen readers…"
                    className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-gray-400 resize-none" />
                  <p className="text-[10px] text-gray-400 mt-1">Read aloud by screen readers (ADA).</p>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">Caption</label>
                  <textarea rows={2} value={caption}
                    onChange={e => { setCaption(e.target.value); scheduleMetaSave(preview.name, altText, e.target.value) }}
                    placeholder="Optional caption…"
                    className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-gray-400 resize-none" />
                </div>
              </div>

              <div className="px-5 py-4 space-y-2 shrink-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1">File URL</p>
                <input readOnly value={preview.url}
                  className="w-full text-[10px] font-mono text-gray-500 border border-gray-200 rounded-lg px-2.5 py-1.5 bg-gray-50 focus:outline-none" />
                <button onClick={() => copyUrl(preview.url)}
                  className={`w-full py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                    copied ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}>
                  {copied ? '✓ Copied to clipboard' : 'Copy URL to clipboard'}
                </button>
                <button onClick={() => downloadFile(preview)}
                  className="w-full py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  Download file
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

      {/* Delete single confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setConfirmDelete(null)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 w-80" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mb-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600">
                <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Delete image?</h3>
            <p className="text-xs text-gray-500 break-all mb-1">{confirmDelete.name}</p>
            <p className="text-xs text-gray-400 mb-4">This cannot be undone.</p>
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

      {/* Bulk delete confirmation */}
      {confirmBulkDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setConfirmBulkDelete(false)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 w-80" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mb-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600">
                <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Delete {selected.size} images?</h3>
            <p className="text-xs text-gray-400 mb-4">This cannot be undone. All selected files will be permanently removed.</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmBulkDelete(false)}
                className="flex-1 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleBulkDelete}
                className="flex-1 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors">
                Delete {selected.size}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
