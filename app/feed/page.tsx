'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Plus, MessageCircle, BookOpen, X, Link2, FileText } from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { Modal } from '@/components/Modal'
import { ToastContainer, useToast } from '@/components/Toast'
import { useAuth } from '@/lib/auth-context'
import { api } from '@/lib/api'
import { storageCaptures } from '@/lib/storage'
import type { Capture } from '@/lib/types'

const CATEGORY_COLORS: Record<string, string> = {
  technical: 'bg-blue-100 text-blue-700',
  business: 'bg-emerald-100 text-emerald-700',
  design: 'bg-purple-100 text-purple-700',
  marketing: 'bg-orange-100 text-orange-700',
  legal: 'bg-red-100 text-red-700',
  productivity: 'bg-yellow-100 text-yellow-700',
  general: 'bg-gray-100 text-gray-700',
}

function categoryColor(cat: string) {
  return CATEGORY_COLORS[cat?.toLowerCase()] || 'bg-gray-100 text-gray-700'
}

function formatDate(d: string) {
  const date = new Date(d)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function FeedPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { toasts, addToast, removeToast } = useToast()

  const [captures, setCaptures] = useState<Capture[]>([])
  const [query, setQuery] = useState('')
  const [showNewCapture, setShowNewCapture] = useState(false)
  const [captureTab, setCaptureTab] = useState<'url' | 'text'>('url')
  const [url, setUrl] = useState('')
  const [text, setText] = useState('')
  const [pasteTitle, setPasteTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [captureError, setCaptureError] = useState('')
  const [showChat, setShowChat] = useState(false)
  const [chatQ, setChatQ] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [chatAnswer, setChatAnswer] = useState('')
  const [chatSources, setChatSources] = useState<string[]>([])

  useEffect(() => {
    setCaptures(storageCaptures.getAll())
  }, [])

  const refreshCaptures = useCallback(() => {
    setCaptures(storageCaptures.getAll())
  }, [])

  const filtered = captures.filter(c =>
    !query ||
    c.title.toLowerCase().includes(query.toLowerCase()) ||
    c.preview.toLowerCase().includes(query.toLowerCase()) ||
    c.creator.toLowerCase().includes(query.toLowerCase())
  )

  async function addFromUrl() {
    if (!url.trim()) return
    if (!user) { addToast('Sign in to add captures', 'error'); return }
    setLoading(true)
    setCaptureError('')
    try {
      const capture = await api.capture.fromUrl(url.trim())
      const local: Capture = {
        ...capture,
        id: capture.id || crypto.randomUUID(),
        date: new Date().toISOString(),
        sourceType: 'url',
        shared: false,
      }
      storageCaptures.add(local)
      refreshCaptures()
      setUrl('')
      setShowNewCapture(false)
      addToast('Capture added!', 'success')
      if (captures.length === 0) {
        setTimeout(() => addToast('Enjoying Vibecoded? Leave us a review ⭐', 'info'), 2000)
      }
    } catch (err) {
      setCaptureError(err instanceof Error ? err.message : 'Failed to capture URL')
    } finally {
      setLoading(false)
    }
  }

  async function addFromText() {
    if (!text.trim()) return
    if (!user) { addToast('Sign in to add captures', 'error'); return }
    setLoading(true)
    setCaptureError('')
    try {
      const capture = await api.capture.fromText({ text: text.trim(), title: pasteTitle || undefined })
      const local: Capture = {
        ...capture,
        id: capture.id || crypto.randomUUID(),
        date: new Date().toISOString(),
        sourceType: 'text',
        shared: false,
      }
      storageCaptures.add(local)
      refreshCaptures()
      setText('')
      setPasteTitle('')
      setShowNewCapture(false)
      addToast('Capture added!', 'success')
    } catch (err) {
      setCaptureError(err instanceof Error ? err.message : 'Failed to capture text')
    } finally {
      setLoading(false)
    }
  }

  async function handleChat(e: React.FormEvent) {
    e.preventDefault()
    if (!chatQ.trim()) return
    setChatLoading(true)
    setChatAnswer('')
    setChatSources([])
    try {
      const refs = captures.slice(0, 10).map(c => ({ id: c.id, title: c.title, preview: c.preview }))
      const res = await api.capture.chat({ question: chatQ, captures: refs })
      setChatAnswer(res.answer)
      setChatSources(res.sources || [])
    } catch (err) {
      setChatAnswer(err instanceof Error ? err.message : 'Failed to get answer')
    } finally {
      setChatLoading(false)
    }
  }

  return (
    <AppShell>
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Header */}
      <div className="sticky top-0 bg-[#EDE9E3]/95 backdrop-blur-sm pt-6 pb-3 px-4 z-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-[#1A2332]">My Captures</h1>
            <p className="text-xs text-[#8B8B8B]">{captures.length} captures saved</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowChat(true)}
              className="p-2.5 rounded-xl bg-white border border-[#E8E4DE] text-[#7C5CBF] hover:bg-[#7C5CBF] hover:text-white transition-colors"
            >
              <MessageCircle size={18} />
            </button>
            <button
              onClick={() => setShowNewCapture(true)}
              className="flex items-center gap-1.5 px-3 py-2.5 bg-[#2A1B5E] text-white rounded-xl font-semibold text-sm hover:bg-[#3D2878] transition-colors"
            >
              <Plus size={16} />
              Capture
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8B8B8B]" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search captures…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white border border-[#E8E4DE] text-sm text-[#1A2332] placeholder-[#BDBDBD] focus:outline-none focus:ring-2 focus:ring-[#2A1B5E]/20 focus:border-[#2A1B5E]"
          />
        </div>
      </div>

      {/* Captures list */}
      <div className="px-4 pb-4 space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-16">
            <BookOpen size={40} className="mx-auto text-[#BDBDBD] mb-4" />
            <div className="text-[#8B8B8B] font-medium">
              {captures.length === 0 ? 'No captures yet' : 'No results found'}
            </div>
            <div className="text-sm text-[#BDBDBD] mt-1">
              {captures.length === 0 ? 'Tap "Capture" to save your first insight' : 'Try a different search'}
            </div>
          </div>
        )}

        {filtered.map(capture => (
          <button
            key={capture.id}
            onClick={() => router.push(`/capture/${capture.id}`)}
            className="w-full bg-white rounded-2xl p-4 border border-[#E8E4DE] shadow-sm text-left hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="font-semibold text-[#1A2332] text-sm leading-snug flex-1">{capture.title}</h3>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${categoryColor(capture.category)}`}>
                {capture.category}
              </span>
            </div>
            <p className="text-xs text-[#8B8B8B] line-clamp-2 mb-3">{capture.preview}</p>
            <div className="flex items-center justify-between text-xs text-[#BDBDBD]">
              <span>{capture.creator}</span>
              <span>{formatDate(capture.date)}</span>
            </div>
          </button>
        ))}
      </div>

      {/* New Capture Modal */}
      <Modal open={showNewCapture} onClose={() => { setShowNewCapture(false); setCaptureError('') }} title="New Capture">
        {/* Tabs */}
        <div className="flex gap-1 bg-[#EDE9E3] rounded-xl p-1 mb-4">
          {(['url', 'text'] as const).map(t => (
            <button
              key={t}
              onClick={() => { setCaptureTab(t); setCaptureError('') }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
                captureTab === t ? 'bg-white text-[#2A1B5E] shadow-sm' : 'text-[#8B8B8B]'
              }`}
            >
              {t === 'url' ? <Link2 size={14} /> : <FileText size={14} />}
              {t === 'url' ? 'URL' : 'Paste text'}
            </button>
          ))}
        </div>

        {captureError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm mb-3">
            {captureError}
          </div>
        )}

        {captureTab === 'url' ? (
          <div className="space-y-3">
            <input
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://example.com/article"
              className="w-full px-4 py-3 rounded-xl border border-[#E8E4DE] bg-[#EDE9E3] text-[#1A2332] placeholder-[#BDBDBD] focus:outline-none focus:ring-2 focus:ring-[#2A1B5E]/20 focus:border-[#2A1B5E]"
              onKeyDown={e => e.key === 'Enter' && addFromUrl()}
            />
            <button
              onClick={addFromUrl}
              disabled={loading || !url.trim()}
              className="w-full bg-[#2A1B5E] text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-[#3D2878] transition-colors disabled:opacity-60"
            >
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Analyzing…</>
              ) : 'Capture URL'}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <input
              type="text"
              value={pasteTitle}
              onChange={e => setPasteTitle(e.target.value)}
              placeholder="Title (optional)"
              className="w-full px-4 py-3 rounded-xl border border-[#E8E4DE] bg-[#EDE9E3] text-[#1A2332] placeholder-[#BDBDBD] focus:outline-none focus:ring-2 focus:ring-[#2A1B5E]/20 focus:border-[#2A1B5E]"
            />
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Paste your text here…"
              rows={5}
              className="w-full px-4 py-3 rounded-xl border border-[#E8E4DE] bg-[#EDE9E3] text-[#1A2332] placeholder-[#BDBDBD] focus:outline-none focus:ring-2 focus:ring-[#2A1B5E]/20 focus:border-[#2A1B5E] resize-none"
            />
            <button
              onClick={addFromText}
              disabled={loading || !text.trim()}
              className="w-full bg-[#2A1B5E] text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-[#3D2878] transition-colors disabled:opacity-60"
            >
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Analyzing…</>
              ) : 'Capture Text'}
            </button>
          </div>
        )}
      </Modal>

      {/* AI Chat Modal */}
      <Modal open={showChat} onClose={() => { setShowChat(false); setChatAnswer(''); setChatQ('') }} title="Ask your captures">
        <p className="text-sm text-[#8B8B8B] mb-4">
          Ask a question about your {captures.length} saved captures
        </p>
        <form onSubmit={handleChat} className="space-y-3">
          <div className="relative">
            <input
              value={chatQ}
              onChange={e => setChatQ(e.target.value)}
              placeholder="What do my captures say about authentication?"
              className="w-full px-4 py-3 rounded-xl border border-[#E8E4DE] bg-[#EDE9E3] text-[#1A2332] placeholder-[#BDBDBD] focus:outline-none focus:ring-2 focus:ring-[#2A1B5E]/20 focus:border-[#2A1B5E]"
            />
            {chatQ && (
              <button type="button" onClick={() => setChatQ('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X size={14} className="text-[#8B8B8B]" />
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={chatLoading || !chatQ.trim() || captures.length === 0}
            className="w-full bg-[#7C5CBF] text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-[#6B4DAF] transition-colors disabled:opacity-60"
          >
            {chatLoading ? (
              <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Thinking…</>
            ) : 'Ask'}
          </button>
        </form>

        {chatAnswer && (
          <div className="mt-4 bg-[#EDE9E3] rounded-xl p-4">
            <p className="text-sm text-[#1A2332] leading-relaxed">{chatAnswer}</p>
            {chatSources.length > 0 && (
              <div className="mt-3 pt-3 border-t border-[#E8E4DE]">
                <p className="text-xs font-medium text-[#8B8B8B] mb-1.5">Sources</p>
                <ul className="space-y-1">
                  {chatSources.map((s, i) => (
                    <li key={i} className="text-xs text-[#7C5CBF]">· {s}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </Modal>
    </AppShell>
  )
}
