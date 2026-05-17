'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface DeleteRowButtonProps {
  id: string
  label: string
  apiPath: string
  onDeleted?: () => void
}

export function DeleteRowButton({ id, label, apiPath, onDeleted }: DeleteRowButtonProps) {
  const router = useRouter()
  const [confirm, setConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    await fetch(`${apiPath}/${id}`, { method: 'DELETE' })
    if (onDeleted) onDeleted()
    router.refresh()
  }

  if (confirm) {
    return (
      <span className="inline-flex items-center gap-2">
        <button
          onClick={() => setConfirm(false)}
          disabled={deleting}
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-xs font-medium text-red-600 hover:text-red-800 transition-colors"
        >
          {deleting ? 'Deleting…' : 'Confirm'}
        </button>
      </span>
    )
  }

  return (
    <button
      onClick={() => setConfirm(true)}
      title={`Delete ${label}`}
      className="text-gray-300 hover:text-red-500 transition-colors"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6"/>
        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
        <path d="M10 11v6M14 11v6"/>
        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
      </svg>
    </button>
  )
}
