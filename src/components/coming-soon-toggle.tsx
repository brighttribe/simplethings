'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ComingSoonToggle({ initial }: { initial: boolean }) {
  const [enabled, setEnabled] = useState(initial)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function toggle() {
    setLoading(true)
    const next = !enabled
    await fetch('/api/coming-soon', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: next }),
    })
    setEnabled(next)
    setLoading(false)
    router.refresh()
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${
        enabled
          ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
          : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
      }`}
    >
      <span className={`w-7 h-4 rounded-full relative transition-colors ${enabled ? 'bg-amber-400' : 'bg-gray-300'}`}>
        <span className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-all ${enabled ? 'left-3.5' : 'left-0.5'}`} />
      </span>
      Coming Soon
    </button>
  )
}
