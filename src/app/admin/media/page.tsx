'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface MediaFile {
  name: string
  size: number
  created_at: string
  url: string
}

export default function MediaPage() {
  const [files, setFiles] = useState<MediaFile[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [preview, setPreview] = useState<MediaFile | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchFiles = useCallback(async () => {
    const res = await fetch('/api/media')
    if (res.ok) setFiles(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { fetchFiles() }, [fetchFiles])

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

  function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Media Library</h1>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          {uploading ? 'Uploading...' : 'Upload Images'}
        </button>
        <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden" onChange={handleUpload} />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-sm text-gray-400">Loading...</div>
      ) : files.length === 0 ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-gray-300 hover:bg-gray-50 transition-colors"
        >
          <svg className="w-10 h-10 text-gray-300 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
          </svg>
          <p className="text-sm text-gray-400">No images yet — click to upload</p>
          <p className="text-xs text-gray-300 mt-1">Auto-converted to WebP · 1500px wide</p>
        </div>
      ) : (
        <div className="flex gap-5 items-start">
          <div className="flex-1 grid grid-cols-4 gap-3">
            {files.map(file => (
              <div
                key={file.name}
                onClick={() => setPreview(preview?.name === file.name ? null : file)}
                className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                  preview?.name === file.name ? 'border-gray-900' : 'border-transparent hover:border-gray-300'
                }`}
              >
                <img src={file.url} alt={file.name} className="w-full aspect-square object-cover bg-gray-50" />
                <button
                  onClick={e => { e.stopPropagation(); handleDelete(file) }}
                  disabled={deleting === file.url}
                  className="absolute top-1.5 left-1.5 w-7 h-7 bg-white/90 rounded-full items-center justify-center hidden group-hover:flex hover:bg-red-50 transition-colors shadow-sm"
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
                    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          {preview && (
            <div className="w-64 shrink-0 bg-white border border-gray-200 rounded-lg p-4 space-y-3">
              <img src={preview.url} alt={preview.name} className="w-full rounded-lg object-cover aspect-video" />
              <div>
                <p className="text-xs font-medium text-gray-800 break-all">{preview.name}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{formatSize(preview.size)}</p>
              </div>
              <button
                onClick={() => { navigator.clipboard.writeText(preview.url) }}
                className="w-full py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Copy URL
              </button>
              <button
                onClick={() => handleDelete(preview)}
                className="w-full py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      )}
      <p className="mt-4 text-xs text-gray-400">{files.length} image{files.length !== 1 ? 's' : ''}</p>
    </div>
  )
}
