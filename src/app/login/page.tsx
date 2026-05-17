'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<'login' | 'forgot'>('login')
  const [resetSent, setResetSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Invalid email or password.')
      setLoading(false)
      return
    }
    router.push('/admin')
    router.refresh()
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/admin/reset-password`,
    })
    setLoading(false)
    if (error) {
      setError('Could not send reset email. Please try again.')
      return
    }
    setResetSent(true)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#faf9f7]">
      <div className="w-full max-w-md bg-white border border-stone-200 rounded-2xl px-10 py-10 shadow-sm text-center">
        <div className="flex justify-center mb-6">
          <Image
            src="/logo.png"
            alt="Simple Things Made Beautiful"
            width={320}
            height={160}
            className="object-contain"
            priority
          />
        </div>
        <p className="text-xs tracking-[0.2em] uppercase text-stone-400 mb-8">Site Management</p>

        {mode === 'login' ? (
          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1.5 tracking-wide">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-stone-200 rounded-lg text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-300 bg-stone-50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1.5 tracking-wide">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 pr-10 border border-stone-200 rounded-lg text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-300 bg-stone-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-stone-400 hover:text-stone-600"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            {error && <p className="text-xs text-red-500 text-center">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 mt-2 bg-[#1a2744] text-white text-sm font-medium rounded-lg hover:bg-[#243560] transition-colors disabled:opacity-50 tracking-wide"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
            <p className="text-center">
              <button
                type="button"
                onClick={() => { setMode('forgot'); setError('') }}
                className="text-xs text-stone-400 hover:text-stone-600 transition-colors"
              >
                Forgot password?
              </button>
            </p>
          </form>
        ) : resetSent ? (
          <div className="text-center space-y-4">
            <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p className="text-sm text-stone-700 font-medium">Check your email</p>
            <p className="text-xs text-stone-400">We sent a password reset link to <strong>{email}</strong></p>
            <button
              type="button"
              onClick={() => { setMode('login'); setResetSent(false) }}
              className="text-xs text-stone-400 hover:text-stone-600 transition-colors"
            >
              Back to sign in
            </button>
          </div>
        ) : (
          <form onSubmit={handleForgotPassword} className="space-y-4 text-left">
            <p className="text-xs text-stone-500 text-center mb-4">Enter your email and we&apos;ll send you a reset link.</p>
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1.5 tracking-wide">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
                className="w-full px-4 py-2.5 border border-stone-200 rounded-lg text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-300 bg-stone-50"
              />
            </div>
            {error && <p className="text-xs text-red-500 text-center">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 mt-2 bg-[#1a2744] text-white text-sm font-medium rounded-lg hover:bg-[#243560] transition-colors disabled:opacity-50 tracking-wide"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
            <p className="text-center">
              <button
                type="button"
                onClick={() => { setMode('login'); setError('') }}
                className="text-xs text-stone-400 hover:text-stone-600 transition-colors"
              >
                Back to sign in
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
