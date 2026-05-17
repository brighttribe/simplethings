'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface MediaFile {
  name: string
  size: number
  created_at: string
  url: string
}

interface MediaPickerProps {
  onSelect: (url: string) => void
  onClose: () => void
}

export function MediaPicker({ onSelect, onClose }: MediaPickerProps) {
  const [files, setFiles] = useState<MediaFile[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchFiles = useCallback(async () => {
    const res = await fetch('/api/media')
    if (res.ok) setFiles(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { fetchFiles() }, [fetchFiles])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files?.length) return
    setUploading(true)
    for (const file of Array.from(files)) {
      const fd = new FormData()
      fd.append('file', file)
      await fetch('/api/upload-image', { method: 'POST', body: fd })
    }
    await fetchFiles()
    setUploading(false)
    e.target.value = ''
  }

  async function handleDelete(name: string, url: string) {
    if (!confirm('Delete this image?')) return
    setDeleting(url)
    await fetch('/api/media', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    setFiles(prev => prev.filter(f => f.name !== name))
    if (selected === url) setSelected(null)
    setDeleting(null)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-[900px] max-w-[95vw] max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Media Library</h2>
          <div className="flex items-center gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
            <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden" onChange={handleUpload} />
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-48 text-sm text-gray-400">Loading...</div>
          ) : files.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <svg className="w-10 h-10 text-gray-200 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
              </svg>
              <p className="text-sm text-gray-400">No images yet</p>
              <p className="text-xs text-gray-300 mt-1">Upload images to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-3">
              {files.map(file => (
                <div
                  key={file.name}
                  onClick={() => setSelected(selected === file.url ? null : file.url)}
                  className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                    selected === file.url ? 'border-gray-900 shadow-lg' : 'border-transparent hover:border-gray-300'
                  }`}
                >
                  <img
                    src={file.url}
                    alt={file.name}
                    className="w-full aspect-square object-cover bg-gray-50"
                  />
                  {selected === file.url && (
                    <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-gray-900 rounded-full flex items-center justify-center">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                  )}
                  <button
                    onClick={e => { e.stopPropagation(); handleDelete(file.name, file.url) }}
                    disabled={deleting === file.url}
                    className="absolute top-1.5 left-1.5 w-6 h-6 bg-white/90 rounded-full items-center justify-center hidden group-hover:flex hover:bg-red-50 transition-colors"
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
                      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" />
                    </svg>
                  </button>
                  <div className="absolute bottom-0 inset-x-0 px-2 py-1 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-[9px] text-white truncate">{file.name}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100">
          <p className="text-xs text-gray-400">{files.length} image{files.length !== 1 ? 's' : ''}</p>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button
              onClick={() => { if (selected) { onSelect(selected); onClose() } }}
              disabled={!selected}
              className="px-4 py-2 text-xs font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-40"
            >
              Use Image
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
