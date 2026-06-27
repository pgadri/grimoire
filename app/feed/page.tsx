'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search, Plus, MessageCircle, X, Link2, FileText,
  PlayCircle, ImageIcon, Camera, Globe, Star, Share2, BookOpen,
} from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { Modal } from '@/components/Modal'
import { ToastContainer, useToast } from '@/components/Toast'
import { useAuth } from '@/lib/auth-context'
import { api } from '@/lib/api'
import { storageCaptures } from '@/lib/storage'
import type { Capture } from '@/lib/types'

const CATEGORY_COLOR: Record<string, string> = {
  technical: '#2A6EBB',
  marketing: '#BB5E2A',
  launch: '#2A9E6B',
  pricing: '#9E2A7A',
  founder: '#2A1B5E',
  product: '#5E7A2A',
}

const FEATURED_FOR_FOLLOWING: Capture[] = [
  {
    id: 'vc-f1',
    title: 'The pre-launch content playbook that got 2,000 waitlist signups',
    sourceUrl: '',
    sourceType: 'video',
    creator: '@vibecoded',
    platform: 'Vibecoded',
    date: 'Jun 26',
    stars: 312,
    starred: false,
    isPublic: true,
    pushed: true,
    pinned: false,
    category: 'marketing',
    preview: '• Start building in public 8 weeks before launch — not 8 days\n• One short-form video per day showing your build process converts better than polished ads\n• Email waitlist weekly — 40% of signups forget they signed up within 2 weeks',
  },
  {
    id: 'vc-f2',
    title: 'Why your App Store screenshots are costing you 60% of downloads',
    sourceUrl: '',
    sourceType: 'image',
    creator: '@vibecoded',
    platform: 'Vibecoded',
    date: 'Jun 26',
    stars: 198,
    starred: false,
    isPublic: true,
    pushed: true,
    pinned: false,
    category: 'launch',
    preview: '• Screenshot 1 must show the outcome, not the UI — users scan in <2 seconds\n• Use real device mockups, not blank screens — trust signals matter\n• Test two screenshot sets before launch — A/B testing costs nothing on TestFlight',
  },
  {
    id: 'vc-f3',
    title: 'Supabase RLS misconfiguration exposed 3,000 users — here\'s what happened',
    sourceUrl: '',
    sourceType: 'video',
    creator: '@vibecoded',
    platform: 'Vibecoded',
    date: 'Jun 25',
    stars: 441,
    starred: false,
    isPublic: true,
    pushed: true,
    pinned: false,
    category: 'technical',
    preview: '• Row Level Security is OFF by default on every Supabase table — you must enable it manually\n• The public anon key ships in your app — anyone can use it without RLS\n• Fix: enable RLS on every table and write policies before your first real user signs up',
  },
  {
    id: 'vc-f4',
    title: 'Pricing your first app: the $4.99 trap and how to avoid it',
    sourceUrl: '',
    sourceType: 'video',
    creator: '@vibecoded',
    platform: 'Vibecoded',
    date: 'Jun 24',
    stars: 267,
    starred: false,
    isPublic: true,
    pushed: true,
    pinned: false,
    category: 'pricing',
    preview: '• Free attracts users who never convert — start at $4.99 minimum\n• Annual plans lock in revenue and reduce churn by 60%\n• Raise prices after your first 50 paying users — early adopters will tell you what it\'s worth',
  },
]

function sourceIcon(type: Capture['sourceType']) {
  if (type === 'video') return <PlayCircle size={13} className="text-[#7C5CBF] shrink-0" />
  if (type === 'image') return <ImageIcon size={13} className="text-[#7C5CBF] shrink-0" />
  if (type === 'camera') return <Camera size={13} className="text-[#7C5CBF] shrink-0" />
  if (type === 'url') return <Link2 size={13} className="text-[#7C5CBF] shrink-0" />
  return <FileText size={13} className="text-[#7C5CBF] shrink-0" />
}

function getGroup(dateStr: string): string {
  const today = new Date()
  const todayLabel = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const thisWeekLabels = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - (i + 1))
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  })
  if (dateStr === todayLabel) return 'TODAY'
  if (thisWeekLabels.includes(dateStr)) return 'THIS WEEK'
  const month = dateStr.split(' ')[0]
  return month?.toUpperCase() ?? 'OLDER'
}

function groupCaptures(captures: Capture[]): { label: string; items: Capture[] }[] {
  const pinned = captures.filter(c => c.pinned)
  const unpinned = captures.filter(c => !c.pinned)
  const groupMap: Record<string, Capture[]> = {}
  const groupOrder: string[] = []
  for (const c of unpinned) {
    const g = getGroup(c.date)
    if (!groupMap[g]) { groupMap[g] = []; groupOrder.push(g) }
    groupMap[g].push(c)
  }
  const result: { label: string; items: Capture[] }[] = []
  if (pinned.length > 0) result.push({ label: 'PINNED', items: pinned })
  for (const label of groupOrder) result.push({ label, items: groupMap[label] })
  return result
}

function CaptureCardRow({
  capture,
  onStar,
  onPush,
  onShare,
  onClick,
}: {
  capture: Capture
  onStar: (id: string) => void
  onPush: (id: string) => void
  onShare: (c: Capture) => void
  onClick: (id: string) => void
}) {
  const catColor = CATEGORY_COLOR[capture.category?.toLowerCase() ?? ''] ?? '#7C5CBF'

  return (
    <div
      className={`bg-white rounded-2xl border border-[#E8E4DE] shadow-sm mb-3 overflow-hidden ${
        capture.pinned ? 'border-l-4 border-l-[#2A1B5E]' : ''
      }`}
    >
      <button
        onClick={() => onClick(capture.id)}
        className="w-full text-left p-4"
      >
        {/* Source row */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            {sourceIcon(capture.sourceType)}
            <span className="text-[11px] text-[#8B8B8B] truncate">
              {capture.platform ? `${capture.platform} · ` : ''}{capture.creator}
            </span>
            {capture.isPublic && (
              <span className="text-[9px] font-bold text-[#2A1B5E] bg-[#2A1B5E]/10 px-1.5 py-0.5 rounded-full shrink-0">
                PUBLIC
              </span>
            )}
          </div>
          <span className="text-[11px] text-[#BDBDBD] shrink-0 ml-2">{capture.date}</span>
        </div>

        {/* Title */}
        <h3 className="font-bold text-[#1A2332] text-sm leading-snug mb-2 line-clamp-2">{capture.title}</h3>

        {/* Category chip */}
        {capture.category && (
          <div
            className="inline-flex items-center px-2 py-0.5 rounded-full mb-2"
            style={{ backgroundColor: catColor + '18' }}
          >
            <span className="text-[9px] font-bold tracking-wide" style={{ color: catColor }}>
              {capture.category.toUpperCase()}
            </span>
          </div>
        )}

        {/* Preview */}
        <p className="text-xs text-[#8B8B8B] leading-5 line-clamp-3">{capture.preview}</p>
      </button>

      {/* Footer */}
      <div className="flex items-center gap-5 px-4 py-2.5 border-t border-[#E8E4DE]">
        <button
          onClick={() => onStar(capture.id)}
          className="flex items-center gap-1.5 hover:opacity-70 transition-opacity"
        >
          <Star
            size={15}
            className={capture.starred ? 'fill-[#F0A500] text-[#F0A500]' : 'text-[#8B8B8B]'}
          />
          <span className="text-[11px] text-[#8B8B8B]">{capture.stars}</span>
        </button>

        <button
          onClick={() => onPush(capture.id)}
          className="flex items-center gap-1.5 hover:opacity-70 transition-opacity"
        >
          <Globe
            size={15}
            className={capture.isPublic ? 'text-[#2A1B5E]' : 'text-[#8B8B8B]'}
          />
          <span className={`text-[11px] ${capture.isPublic ? 'text-[#2A1B5E] font-medium' : 'text-[#8B8B8B]'}`}>
            {capture.isPublic ? 'Public' : 'Publish'}
          </span>
        </button>

        <button
          onClick={() => onShare(capture)}
          className="flex items-center gap-1.5 hover:opacity-70 transition-opacity"
        >
          <Share2 size={15} className="text-[#8B8B8B]" />
          <span className="text-[11px] text-[#8B8B8B]">Share</span>
        </button>
      </div>
    </div>
  )
}

export default function FeedPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { toasts, addToast, removeToast } = useToast()

  const [captures, setCaptures] = useState<Capture[]>([])
  const [feedTab, setFeedTab] = useState<'all' | 'following'>('all')
  const [search, setSearch] = useState('')
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


  const handleStar = (id: string) => {
    setCaptures(prev => {
      const next = prev.map(c => c.id === id
        ? { ...c, starred: !c.starred, stars: c.starred ? c.stars - 1 : c.stars + 1 }
        : c
      )
      try { localStorage.setItem('grimoire:captures', JSON.stringify(next)) } catch {}
      return next
    })
  }

  const handlePush = (id: string) => {
    setCaptures(prev => {
      const next = prev.map(c => c.id === id
        ? { ...c, isPublic: !c.isPublic, pushed: !c.isPublic }
        : c
      )
      try { localStorage.setItem('grimoire:captures', JSON.stringify(next)) } catch {}
      return next
    })
  }

  const handleShare = async (capture: Capture) => {
    const text = `${capture.title}\n\n${capture.preview}\n\nShared from Vibecoded`
    if (navigator.share) {
      try { await navigator.share({ title: capture.title, text }) } catch {}
    } else {
      await navigator.clipboard.writeText(text)
      addToast('Copied to clipboard', 'success')
    }
  }

  const filtered = captures.filter(c =>
    !search || c.title.toLowerCase().includes(search.toLowerCase())
  )

  const groups = search ? null : groupCaptures(captures)

  async function addFromUrl() {
    if (!url.trim()) return
    if (!user) { addToast('Sign in to add captures', 'error'); return }
    setLoading(true)
    setCaptureError('')
    try {
      const capture = await api.capture.fromUrl(url.trim())
      const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      const local: Capture = {
        id: capture.id || crypto.randomUUID(),
        title: capture.title || url,
        sourceUrl: url.trim(),
        sourceType: 'url',
        creator: capture.creator || user.name,
        platform: capture.platform || 'URL',
        date: dateStr,
        stars: 0,
        starred: false,
        isPublic: false,
        pushed: false,
        pinned: false,
        preview: capture.preview || '',
        bullets: capture.bullets,
        concepts: capture.concepts,
        actions: capture.actions,
        quotes: capture.quotes,
        category: capture.category,
      }
      setCaptures(prev => {
        const next = [local, ...prev]
        try { localStorage.setItem('grimoire:captures', JSON.stringify(next)) } catch {}
        return next
      })
      setUrl('')
      setShowNewCapture(false)
      addToast('Capture added!', 'success')
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
      const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      const local: Capture = {
        id: capture.id || crypto.randomUUID(),
        title: capture.title || pasteTitle || 'Untitled',
        sourceUrl: '',
        sourceType: 'text',
        creator: user.name,
        platform: 'Paste',
        date: dateStr,
        stars: 0,
        starred: false,
        isPublic: false,
        pushed: false,
        pinned: false,
        preview: capture.preview || '',
        bullets: capture.bullets,
        concepts: capture.concepts,
        actions: capture.actions,
        quotes: capture.quotes,
        category: capture.category,
      }
      setCaptures(prev => {
        const next = [local, ...prev]
        try { localStorage.setItem('grimoire:captures', JSON.stringify(next)) } catch {}
        return next
      })
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

  const userName = user?.name?.split(' ')[0] || 'Builder'

  return (
    <AppShell>
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Sticky header */}
      <div className="sticky top-0 bg-[#EDE9E3]/95 backdrop-blur-sm pt-5 pb-3 px-4 z-10">
        {/* Title row */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-[22px] font-extrabold text-[#1A2332] leading-tight">
              {userName} ✦
            </h1>
            <p className="text-xs text-[#8B8B8B] font-medium mt-0.5">Your captures</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowChat(true)}
              className="w-9 h-9 rounded-full bg-white border border-[#E8E4DE] shadow-sm flex items-center justify-center text-[#1A2332] hover:bg-[#EDE9E3] transition-colors"
            >
              <MessageCircle size={18} />
            </button>
            <button
              onClick={() => setShowNewCapture(true)}
              className="w-9 h-9 rounded-full bg-[#2A1B5E] flex items-center justify-center text-white shadow-sm hover:bg-[#3D2878] transition-colors"
            >
              <Plus size={20} />
            </button>
          </div>
        </div>

        {/* All / Following tabs */}
        <div className="flex gap-2 mb-3">
          {(['all', 'following'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setFeedTab(tab)}
              className={`px-4 py-2 rounded-full border text-sm font-semibold transition-all ${
                feedTab === tab
                  ? 'bg-[#2A1B5E] border-[#2A1B5E] text-white'
                  : 'bg-white border-[#E8E4DE] text-[#8B8B8B]'
              }`}
            >
              {tab === 'all' ? 'All' : 'Following'}
            </button>
          ))}
        </div>

        {/* Search row */}
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 bg-white border border-[#E8E4DE] rounded-full px-4 py-2.5 shadow-sm">
            <Search size={15} className="text-[#8B8B8B] shrink-0" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search your knowledge..."
              className="flex-1 text-sm text-[#1A2332] placeholder-[#8B8B8B] bg-transparent focus:outline-none min-w-0"
            />
            {search && (
              <button onClick={() => setSearch('')}>
                <X size={14} className="text-[#8B8B8B]" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Feed body */}
      <div className="px-4 pt-2 pb-8">
        {feedTab === 'following' && !search ? (
          <div>
            <div className="mb-3">
              <p className="text-[11px] font-bold tracking-wider text-[#8B8B8B]">✦ FROM VIBECODED</p>
              <p className="text-[11px] text-[#BDBDBD] mt-0.5">You follow @vibecoded by default</p>
            </div>
            {FEATURED_FOR_FOLLOWING.map(capture => (
              <CaptureCardRow
                key={capture.id}
                capture={capture}
                onStar={handleStar}
                onPush={handlePush}
                onShare={handleShare}
                onClick={id => router.push(`/capture/${id}`)}
              />
            ))}
            <button
              onClick={() => router.push('/discover')}
              className="w-full text-center text-sm font-bold text-white bg-[#2A1B5E] rounded-full py-3 mt-2 hover:bg-[#3D2878] transition-colors"
            >
              Find more builders to follow →
            </button>
          </div>
        ) : search ? (
          <div>
            <p className="text-[11px] font-bold tracking-wider text-[#8B8B8B] mb-3">
              {filtered.length} RESULT{filtered.length !== 1 ? 'S' : ''}
            </p>
            {filtered.length === 0 ? (
              <div className="text-center py-12">
                <Search size={36} className="mx-auto text-[#BDBDBD] mb-3" />
                <p className="font-semibold text-[#1A2332]">No captures found</p>
                <p className="text-sm text-[#8B8B8B] mt-1">Try a different search term</p>
              </div>
            ) : (
              filtered.map(capture => (
                <CaptureCardRow
                  key={capture.id}
                  capture={capture}
                  onStar={handleStar}
                  onPush={handlePush}
                  onShare={handleShare}
                  onClick={id => router.push(`/capture/${id}`)}
                />
              ))
            )}
          </div>
        ) : groups && groups.length > 0 ? (
          groups.map(group => (
            <div key={group.label}>
              <div className="flex items-center justify-between mt-4 mb-2">
                <p className="text-[11px] font-bold tracking-wider text-[#8B8B8B]">
                  {group.label === 'PINNED' ? '📌 PINNED' : group.label}
                </p>
                {group.label !== 'PINNED' && (
                  <button className="text-[11px] text-[#7C5CBF] font-semibold">See all</button>
                )}
              </div>
              {group.items.map(capture => (
                <CaptureCardRow
                  key={capture.id}
                  capture={capture}
                  onStar={handleStar}
                  onPush={handlePush}
                  onShare={handleShare}
                  onClick={id => router.push(`/capture/${id}`)}
                />
              ))}
            </div>
          ))
        ) : (
          <div className="text-center pt-16 px-6">
            <p className="text-[40px] mb-4">✦</p>
            <p className="font-bold text-[#1A2332] text-base mb-2">Start your knowledge base</p>
            <p className="text-sm text-[#8B8B8B] leading-relaxed mb-6">
              Paste a video URL, upload a screenshot, or describe a concept — Vibecoded extracts the insights and turns them into prompts you can feed straight into your AI coding tool.
            </p>
            <button
              onClick={() => setShowNewCapture(true)}
              className="inline-flex items-center gap-2 bg-[#2A1B5E] text-white font-semibold px-5 py-2.5 rounded-full text-sm hover:bg-[#3D2878] transition-colors"
            >
              <Plus size={16} /> First capture
            </button>
          </div>
        )}
      </div>

      {/* New Capture Modal */}
      <Modal open={showNewCapture} onClose={() => { setShowNewCapture(false); setCaptureError('') }} title="New Capture">
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
              {loading
                ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Analyzing…</>
                : 'Capture URL'}
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
              {loading
                ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Analyzing…</>
                : 'Capture Text'}
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
            {chatLoading
              ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Thinking…</>
              : 'Ask'}
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
