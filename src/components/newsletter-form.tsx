'use client'

import { useState } from 'react'

interface NewsletterFormProps {
  layout?: 'horizontal' | 'vertical'
}

export default function NewsletterForm({ layout = 'horizontal' }: NewsletterFormProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setStatus('loading')
    const res = await fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name }),
    })
    setStatus(res.ok ? 'success' : 'error')
  }

  if (status === 'success') {
    return (
      <p className="text-sm font-medium text-[#3d5c3a]">
        You&apos;re in! Check your inbox to confirm your subscription.
      </p>
    )
  }

  if (layout === 'vertical') {
    return (
      <form onSubmit={handleSubmit} className="space-y-2">
        <input
          type="email"
          placeholder="Your email address"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          className="w-full px-3 py-1.5 text-xs rounded-lg border border-[#c8d9c5] focus:outline-none bg-white"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="w-full py-1.5 text-xs font-semibold text-white bg-[#3d5c3a] rounded-lg hover:bg-[#2e4529] transition-colors disabled:opacity-60"
        >
          {status === 'loading' ? 'Subscribing…' : 'Subscribe'}
        </button>
        {status === 'error' && <p className="text-xs text-red-500">Something went wrong. Try again.</p>}
      </form>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
      <input
        type="text"
        placeholder="Your name"
        value={name}
        onChange={e => setName(e.target.value)}
        className="px-4 py-2 text-sm border border-[#e8e2d9] rounded-lg focus:outline-none bg-[#faf7f2] w-40"
      />
      <input
        type="email"
        placeholder="Your email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
        className="px-4 py-2 text-sm border border-[#e8e2d9] rounded-lg focus:outline-none bg-[#faf7f2] w-48"
      />
      <button
        type="submit"
        disabled={status === 'loading'}
        className="px-5 py-2 text-sm font-semibold text-white bg-[#1e1c19] rounded-lg hover:bg-[#3d5c3a] transition-colors whitespace-nowrap disabled:opacity-60"
      >
        {status === 'loading' ? 'Subscribing…' : 'Subscribe'}
      </button>
      {status === 'error' && <p className="text-xs text-red-500 self-center">Something went wrong.</p>}
    </form>
  )
}
