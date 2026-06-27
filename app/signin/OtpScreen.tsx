'use client'

import { useState, useRef, useEffect } from 'react'
import { api } from '@/lib/api'
import type { GrimoireUser } from '@/lib/types'

type Props = {
  email: string
  onSuccess: (token: string, user: GrimoireUser) => void
}

export function OtpScreen({ email, onSuccess }: Props) {
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resent, setResent] = useState(false)
  const inputs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    inputs.current[0]?.focus()
  }, [])

  function handleChange(i: number, val: string) {
    if (!/^\d?$/.test(val)) return
    const next = [...code]
    next[i] = val
    setCode(next)
    if (val && i < 5) {
      inputs.current[i + 1]?.focus()
    }
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !code[i] && i > 0) {
      inputs.current[i - 1]?.focus()
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const fullCode = code.join('')
    if (fullCode.length < 6) return
    setLoading(true)
    setError('')
    try {
      const { token, user } = await api.auth.verifyOtp({ email, code: fullCode })
      onSuccess(token, user)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid code')
      setCode(['', '', '', '', '', ''])
      inputs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    try {
      await api.auth.resendOtp({ email })
      setResent(true)
      setTimeout(() => setResent(false), 5000)
    } catch {
      // ignore
    }
  }

  return (
    <div className="min-h-screen bg-[#EDE9E3] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#2A1B5E] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">✦</span>
          </div>
          <h1 className="text-2xl font-bold text-[#1A2332]">Check your email</h1>
          <p className="text-[#8B8B8B] mt-1">
            We sent a 6-digit code to <span className="font-medium text-[#1A2332]">{email}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-sm">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm mb-4">
              {error}
            </div>
          )}
          {resent && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-green-700 text-sm mb-4">
              Code resent! Check your inbox.
            </div>
          )}

          <div className="flex gap-2 justify-center mb-6">
            {code.map((digit, i) => (
              <input
                key={i}
                ref={el => { inputs.current[i] = el }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                className="w-11 h-14 text-center text-xl font-bold rounded-xl border border-[#E8E4DE] bg-[#EDE9E3] text-[#1A2332] focus:outline-none focus:ring-2 focus:ring-[#2A1B5E]/20 focus:border-[#2A1B5E]"
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={loading || code.join('').length < 6}
            className="w-full bg-[#2A1B5E] text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-[#3D2878] transition-colors disabled:opacity-60"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : 'Verify Code'}
          </button>

          <button
            type="button"
            onClick={handleResend}
            className="w-full mt-3 text-sm text-[#8B8B8B] hover:text-[#1A2332] py-2 transition-colors"
          >
            Didn&apos;t get it? Resend code
          </button>
        </form>
      </div>
    </div>
  )
}
