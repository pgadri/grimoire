'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Plus, MessageCircle, ChevronDown, ChevronUp, ChevronRight,
  ThumbsUp, Star, ExternalLink, ArrowUp, ArrowDown, Package,
} from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { Modal } from '@/components/Modal'
import { ToastContainer, useToast } from '@/components/Toast'
import { useAuth } from '@/lib/auth-context'
import { api } from '@/lib/api'
import { storageMilestones, storageThreads } from '@/lib/storage'
import type { PublicCapture, Product, Milestone, Thread, ProductReview } from '@/lib/types'

type CommunityTab = 'captures' | 'threads' | 'launches' | 'knowledge'

const MILESTONE_ICONS: Record<string, string> = {
  shipped: '🚀', first_dollar: '💰', first_user: '🎉', custom: '✨',
}

const STAGE_LABEL: Record<string, string> = {
  idea: 'IDEA', beta: 'BETA', live: 'LIVE', sunset: 'SUNSET',
}

const CATEGORY_COLOR: Record<string, string> = {
  technical: '#2A6EBB', marketing: '#BB5E2A', launch: '#2A9E6B',
  pricing: '#9E2A7A', founder: '#2A1B5E', product: '#5E7A2A',
}

const FEATURED_CAPTURES = [
  {
    id: 'vc-f1', title: 'The pre-launch content playbook that got 2,000 waitlist signups',
    creator: '@vibecoded', platform: 'Vibecoded', date: 'Jun 26', stars: 312,
    category: 'marketing', sourceType: 'video' as const,
    preview: '• Start building in public 8 weeks before launch — not 8 days\n• One short-form video per day showing your build process converts better than polished ads\n• Email waitlist weekly — 40% of signups forget they signed up within 2 weeks',
  },
  {
    id: 'vc-f2', title: 'Why your App Store screenshots are costing you 60% of downloads',
    creator: '@vibecoded', platform: 'Vibecoded', date: 'Jun 26', stars: 198,
    category: 'launch', sourceType: 'image' as const,
    preview: '• Screenshot 1 must show the outcome, not the UI — users scan in <2 seconds\n• Use real device mockups, not blank screens — trust signals matter\n• Test two screenshot sets before launch — A/B testing costs nothing on TestFlight',
  },
  {
    id: 'vc-f3', title: "Supabase RLS misconfiguration exposed 3,000 users — here's what happened",
    creator: '@vibecoded', platform: 'Vibecoded', date: 'Jun 25', stars: 441,
    category: 'technical', sourceType: 'video' as const,
    preview: '• Row Level Security is OFF by default on every Supabase table — you must enable it manually\n• The public anon key ships in your app — anyone can use it without RLS\n• Fix: enable RLS on every table and write policies before your first real user signs up',
  },
  {
    id: 'vc-f4', title: 'Pricing your first app: the $4.99 trap and how to avoid it',
    creator: '@vibecoded', platform: 'Vibecoded', date: 'Jun 24', stars: 267,
    category: 'pricing', sourceType: 'video' as const,
    preview: "• Free attracts users who never convert — start at $4.99 minimum\n• Annual plans lock in revenue and reduce churn by 60%\n• Raise prices after your first 50 paying users — early adopters will tell you what it's worth",
  },
]

function formatRelative(d: string) {
  const diff = Date.now() - new Date(d).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return '1d ago'
  if (days < 7) return `${days}d ago`
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function DiscoverPage() {
  const { user } = useAuth()
  const { toasts, addToast, removeToast } = useToast()
  const [communityTab, setCommunityTab] = useState<CommunityTab>('captures')

  // Captures tab
  const [publicCaptures, setPublicCaptures] = useState<PublicCapture[]>([])
  const [capturesLoading, setCapturesLoading] = useState(false)
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [showMilestone, setShowMilestone] = useState(false)
  const [milestoneType, setMilestoneType] = useState<Milestone['type']>('shipped')
  const [milestoneText, setMilestoneText] = useState('')
  const [reactions, setReactions] = useState<Record<string, 'fire' | 'insightful' | null>>({})

  // Threads tab
  const [threads, setThreads] = useState<Thread[]>([])
  const [showThread, setShowThread] = useState(false)
  const [threadQ, setThreadQ] = useState('')
  const [expandedThread, setExpandedThread] = useState<string | null>(null)
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({})

  // Launches tab
  const [products, setProducts] = useState<Product[]>([])
  const [productsLoading, setProductsLoading] = useState(false)
  const [showSubmit, setShowSubmit] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [productReviews, setProductReviews] = useState<ProductReview[]>([])
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [newReview, setNewReview] = useState({ type: 'feedback', body: '' })
  const [submitForm, setSubmitForm] = useState({
    name: '', tagline: '', description: '', url: '', category: 'app',
    stage: 'beta', logoEmoji: '🚀', tags: '', lookingFor: [] as string[],
  })

  useEffect(() => {
    setMilestones(storageMilestones.getAll())
    setThreads(storageThreads.getAll())
  }, [])

  const loadPublicCaptures = useCallback(async () => {
    setCapturesLoading(true)
    try {
      const data = await api.publicCaptures.list(30)
      setPublicCaptures(data)
    } catch { /* ignore */ } finally { setCapturesLoading(false) }
  }, [])

  const loadProducts = useCallback(async () => {
    setProductsLoading(true)
    try {
      const data = await api.products.list()
      setProducts(data)
    } catch { /* ignore */ } finally { setProductsLoading(false) }
  }, [])

  useEffect(() => {
    if (communityTab === 'captures') loadPublicCaptures()
    if (communityTab === 'launches') loadProducts()
  }, [communityTab, loadPublicCaptures, loadProducts])

  function postMilestone() {
    if (!milestoneText.trim()) return
    const m: Milestone = {
      id: crypto.randomUUID(), type: milestoneType, text: milestoneText.trim(),
      authorName: user?.name || 'You', authorHandle: user?.handle,
      createdAt: new Date().toISOString(),
    }
    storageMilestones.add(m)
    setMilestones(storageMilestones.getAll())
    setMilestoneText('')
    setShowMilestone(false)
    addToast('Milestone posted!', 'success')
  }

  function postThread() {
    if (!threadQ.trim()) return
    const t: Thread = {
      id: crypto.randomUUID(), question: threadQ.trim(),
      authorName: user?.name || 'You', authorHandle: user?.handle,
      createdAt: new Date().toISOString(), replies: [],
    }
    storageThreads.add(t)
    setThreads(storageThreads.getAll())
    setThreadQ('')
    setShowThread(false)
    addToast('Question posted!', 'success')
  }

  function postReply(threadId: string) {
    const body = replyTexts[threadId]?.trim()
    if (!body) return
    storageThreads.addReply(threadId, {
      id: crypto.randomUUID(), body,
      authorName: user?.name || 'Anonymous',
      createdAt: new Date().toISOString(),
    })
    setThreads(storageThreads.getAll())
    setReplyTexts(prev => ({ ...prev, [threadId]: '' }))
  }

  async function toggleUpvote(product: Product) {
    if (!user) { addToast('Sign in to upvote', 'error'); return }
    try {
      const res = await api.products.upvote(product.id)
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, myUpvote: res.myUpvote, upvotes: res.upvotes } : p))
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed', 'error')
    }
  }

  async function openProduct(product: Product) {
    setSelectedProduct(product)
    setReviewsLoading(true)
    try {
      setProductReviews(await api.products.reviews(product.id))
    } catch { setProductReviews([]) } finally { setReviewsLoading(false) }
  }

  async function submitReview() {
    if (!selectedProduct || !newReview.body.trim() || !user) return
    try {
      const review = await api.products.addReview(selectedProduct.id, {
        type: newReview.type, body: newReview.body, authorName: user.name,
      })
      setProductReviews(prev => [...prev, review])
      setNewReview({ type: 'feedback', body: '' })
      addToast('Review posted!', 'success')
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed', 'error')
    }
  }

  async function handleSubmitProduct() {
    if (!user) { addToast('Sign in to submit', 'error'); return }
    if (!submitForm.name || !submitForm.tagline || !submitForm.description) {
      addToast('Fill in all required fields', 'error'); return
    }
    try {
      const product = await api.products.create({
        ...submitForm,
        tags: submitForm.tags.split(',').map(s => s.trim()).filter(Boolean),
        lookingFor: submitForm.lookingFor,
      })
      setProducts(prev => [product, ...prev])
      setShowSubmit(false)
      setSubmitForm({ name: '', tagline: '', description: '', url: '', category: 'app', stage: 'beta', logoEmoji: '🚀', tags: '', lookingFor: [] })
      addToast('Submitted!', 'success')
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed', 'error')
    }
  }

  const actionLabel = communityTab === 'threads' ? 'Ask'
    : communityTab === 'launches' ? 'Launch'
    : communityTab === 'knowledge' ? 'Create'
    : 'Milestone'

  function handleAction() {
    if (communityTab === 'threads') setShowThread(true)
    else if (communityTab === 'launches') setShowSubmit(true)
    else setShowMilestone(true)
  }

  return (
    <AppShell>
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Header */}
      <div className="sticky top-0 bg-[#EDE9E3]/95 backdrop-blur-sm pt-5 pb-3 px-4 z-10">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-[22px] font-extrabold text-[#1A2332]">Community</h1>
            <p className="text-xs text-[#8B8B8B] mt-0.5">What builders are learning right now</p>
          </div>
          <button
            onClick={handleAction}
            className="flex items-center gap-1.5 border border-[#2A1B5E] rounded-full px-3 py-2 text-sm font-bold text-[#2A1B5E] hover:bg-[#2A1B5E]/5 transition-colors"
          >
            {communityTab === 'threads' ? <MessageCircle size={15} /> : <Plus size={15} />}
            {actionLabel}
          </button>
        </div>

        {/* 4-tab pill selector */}
        <div className="flex bg-white rounded-full p-1 shadow-sm border border-[#E8E4DE]">
          {([
            { id: 'captures', label: 'Captures' },
            { id: 'threads', label: 'Threads' },
            { id: 'launches', label: 'Launches' },
            { id: 'knowledge', label: 'Packets' },
          ] as { id: CommunityTab; label: string }[]).map(t => (
            <button
              key={t.id}
              onClick={() => setCommunityTab(t.id)}
              className={`flex-1 py-2 rounded-full text-xs font-semibold transition-all ${
                communityTab === t.id
                  ? 'bg-[#2A1B5E] text-white'
                  : 'text-[#8B8B8B] hover:text-[#1A2332]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pb-8">
        {/* ─── Captures Tab ─── */}
        {communityTab === 'captures' && (
          <div>
            {/* Featured FROM VIBECODED */}
            <p className="text-[11px] font-bold tracking-wider text-[#8B8B8B] mt-2 mb-3">📌 FROM VIBECODED</p>
            {FEATURED_CAPTURES.map(c => {
              const catColor = CATEGORY_COLOR[c.category?.toLowerCase() ?? ''] ?? '#7C5CBF'
              const bullets = c.preview.split('\n').map(b => b.replace(/^[•\-→]\s*/, '').trim()).filter(Boolean).slice(0, 3)
              return (
                <div key={c.id} className="bg-white rounded-2xl border border-[#2A1B5E]/25 p-4 mb-3 shadow-sm">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[11px] text-[#8B8B8B]">{c.platform} · {c.creator}</span>
                    <span className="text-[11px] text-[#BDBDBD] ml-auto">{c.date}</span>
                  </div>
                  {c.category && (
                    <div className="inline-flex items-center px-2 py-0.5 rounded-full mb-2" style={{ backgroundColor: catColor + '18' }}>
                      <span className="text-[9px] font-bold tracking-wide" style={{ color: catColor }}>{c.category.toUpperCase()}</span>
                    </div>
                  )}
                  <h3 className="font-bold text-[#1A2332] text-sm leading-snug mb-2">{c.title}</h3>
                  {bullets.map((b, i) => (
                    <div key={i} className="flex items-start gap-2 mb-1">
                      <span className="text-[#7C5CBF] font-bold text-sm leading-5">·</span>
                      <p className="text-xs text-[#8B8B8B] leading-5 flex-1">{b}</p>
                    </div>
                  ))}
                  <div className="flex items-center gap-4 pt-2.5 mt-2 border-t border-[#E8E4DE]">
                    <div className="flex items-center gap-1.5">
                      <Star size={12} className="fill-[#F0A500] text-[#F0A500]" />
                      <span className="text-[11px] text-[#8B8B8B]">{c.stars}</span>
                    </div>
                    <button
                      onClick={() => setReactions(prev => ({
                        ...prev, [c.id]: prev[c.id] === 'fire' ? null : 'fire',
                      }))}
                      className={`flex items-center gap-1 px-2 py-1 rounded-full border text-[11px] transition-all ${
                        reactions[c.id] === 'fire'
                          ? 'border-[#2A1B5E] bg-[#2A1B5E]/8 text-[#2A1B5E]'
                          : 'border-[#E8E4DE] bg-[#EDE9E3] text-[#8B8B8B]'
                      }`}
                    >
                      🔥
                    </button>
                    <button
                      onClick={() => setReactions(prev => ({
                        ...prev, [c.id]: prev[c.id] === 'insightful' ? null : 'insightful',
                      }))}
                      className={`flex items-center gap-1 px-2 py-1 rounded-full border text-[11px] transition-all ${
                        reactions[c.id] === 'insightful'
                          ? 'border-[#2A1B5E] bg-[#2A1B5E]/8 text-[#2A1B5E]'
                          : 'border-[#E8E4DE] bg-[#EDE9E3] text-[#8B8B8B]'
                      }`}
                    >
                      💡
                    </button>
                  </div>
                </div>
              )
            })}

            {/* Community captures from backend */}
            {capturesLoading ? (
              <div className="text-center py-6"><div className="w-5 h-5 border-2 border-[#2A1B5E] border-t-transparent rounded-full animate-spin mx-auto" /></div>
            ) : publicCaptures.length > 0 && (
              <>
                <p className="text-[11px] font-bold tracking-wider text-[#8B8B8B] mt-4 mb-3">🔥 FROM THE COMMUNITY</p>
                {publicCaptures.map(c => (
                  <div key={c.id} className="bg-white rounded-2xl border border-[#E8E4DE] p-4 mb-3 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 bg-[#2A1B5E] rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                        {c.authorName?.[0]?.toUpperCase() || '?'}
                      </div>
                      <span className="text-xs font-semibold text-[#1A2332]">{c.authorName}</span>
                      <span className="text-[11px] text-[#BDBDBD] ml-auto">
                        {new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <h3 className="font-semibold text-[#1A2332] text-sm mb-1">{c.title}</h3>
                    <p className="text-xs text-[#8B8B8B] line-clamp-2">{c.preview}</p>
                  </div>
                ))}
              </>
            )}

            {/* Milestones */}
            <div className="mt-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] font-bold tracking-wider text-[#8B8B8B]">🎯 MILESTONES</p>
                <button
                  onClick={() => setShowMilestone(true)}
                  className="flex items-center gap-1 text-xs font-semibold text-[#7C5CBF] hover:text-[#2A1B5E] transition-colors"
                >
                  <Plus size={13} /> Post
                </button>
              </div>
              <div className="space-y-2">
                {milestones.map(m => (
                  <div key={m.id} className="bg-white rounded-2xl border border-[#E8E4DE] p-4">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{MILESTONE_ICONS[m.type] || '✨'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[#1A2332]">{m.text}</p>
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <span className="text-xs font-semibold text-[#8B8B8B]">{m.authorName}</span>
                          <span className="text-xs text-[#BDBDBD]">·</span>
                          <span className="text-xs text-[#BDBDBD]">{formatRelative(m.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─── Threads Tab ─── */}
        {communityTab === 'threads' && (
          <div>
            {threads.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-5xl mb-4">🤔</p>
                <p className="font-bold text-[#1A2332] text-base mb-2">No threads yet</p>
                <p className="text-sm text-[#8B8B8B] mb-6">Hit a wall? Post a thread. Other builders who faced the same thing will answer.</p>
                <button
                  onClick={() => setShowThread(true)}
                  className="inline-flex items-center gap-2 bg-[#2A1B5E] text-white font-semibold px-5 py-2.5 rounded-full text-sm hover:bg-[#3D2878] transition-colors"
                >
                  Ask the community
                </button>
              </div>
            ) : (
              <div className="space-y-2 mt-2">
                {threads.map(t => (
                  <div key={t.id} className="bg-white rounded-2xl border border-[#E8E4DE] overflow-hidden shadow-sm">
                    <button
                      onClick={() => setExpandedThread(expandedThread === t.id ? null : t.id)}
                      className="w-full p-4 text-left"
                    >
                      <div className="flex items-center gap-1.5 mb-2">
                        <div className="w-6 h-6 bg-[#2A1B5E] rounded-full flex items-center justify-center text-white text-[10px] font-bold">
                          {t.authorName.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-xs font-semibold text-[#1A2332]">
                          {t.authorHandle ? `@${t.authorHandle}` : t.authorName}
                        </span>
                        <span className="text-[11px] text-[#BDBDBD]">·</span>
                        <span className="text-[11px] text-[#BDBDBD]">{formatRelative(t.createdAt)}</span>
                      </div>
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-bold text-[#1A2332] leading-snug flex-1 line-clamp-2">{t.question}</p>
                        {expandedThread === t.id ? <ChevronUp size={16} className="text-[#8B8B8B] shrink-0 mt-0.5" /> : <ChevronDown size={16} className="text-[#8B8B8B] shrink-0 mt-0.5" />}
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center gap-1">
                          <MessageCircle size={12} className="text-[#8B8B8B]" />
                          <span className="text-[11px] text-[#8B8B8B]">{t.replies.length}</span>
                        </div>
                      </div>
                    </button>

                    {expandedThread === t.id && (
                      <div className="border-t border-[#E8E4DE] bg-[#EDE9E3]/50 p-4 space-y-3">
                        {t.replies.map(r => (
                          <div key={r.id} className="bg-white rounded-xl p-3">
                            <p className="text-xs text-[#1A2332]">{r.body}</p>
                            <div className="flex items-center gap-1 mt-1.5">
                              <span className="text-[10px] font-semibold text-[#8B8B8B]">{r.authorName}</span>
                              <span className="text-[10px] text-[#BDBDBD]">· {formatRelative(r.createdAt)}</span>
                            </div>
                          </div>
                        ))}
                        <div className="flex gap-2">
                          <input
                            value={replyTexts[t.id] || ''}
                            onChange={e => setReplyTexts(prev => ({ ...prev, [t.id]: e.target.value }))}
                            placeholder="Reply…"
                            className="flex-1 px-3 py-2 rounded-xl bg-white border border-[#E8E4DE] text-xs text-[#1A2332] placeholder-[#BDBDBD] focus:outline-none focus:ring-2 focus:ring-[#2A1B5E]/20"
                            onKeyDown={e => e.key === 'Enter' && postReply(t.id)}
                          />
                          <button
                            onClick={() => postReply(t.id)}
                            className="px-3 py-2 bg-[#2A1B5E] text-white text-xs font-semibold rounded-xl hover:bg-[#3D2878] transition-colors"
                          >
                            Reply
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── Launches Tab ─── */}
        {communityTab === 'launches' && (
          <div>
            <div className="mt-2 mb-4">
              <h2 className="text-lg font-extrabold text-[#1A2332]">Builder Launches</h2>
              <p className="text-xs text-[#8B8B8B] mt-0.5">Ship your product · get real feedback · find testers</p>
            </div>

            {productsLoading ? (
              <div className="text-center py-8"><div className="w-5 h-5 border-2 border-[#2A1B5E] border-t-transparent rounded-full animate-spin mx-auto" /></div>
            ) : products.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-5xl mb-4">🚀</p>
                <p className="font-bold text-[#1A2332] text-base mb-2">No launches yet</p>
                <p className="text-sm text-[#8B8B8B] mb-6">Built something? Submit it here. The community gives feedback, reports bugs, and signs up to test.</p>
                <button
                  onClick={() => setShowSubmit(true)}
                  className="inline-flex items-center gap-2 bg-[#2A1B5E] text-white font-semibold px-5 py-2.5 rounded-full text-sm hover:bg-[#3D2878] transition-colors"
                >
                  Submit your launch
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {products.map(p => (
                    <button
                      key={p.id}
                      onClick={() => openProduct(p)}
                      className="w-full bg-white rounded-2xl border border-[#E8E4DE] p-4 shadow-sm text-left hover:shadow-md transition-shadow flex items-start gap-3"
                    >
                      <div className="w-14 h-14 bg-[#EDE9E3] rounded-xl flex items-center justify-center text-3xl shrink-0">
                        {p.logoEmoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-bold text-[#1A2332] text-sm">{p.name}</span>
                          <span className="text-[9px] font-bold text-[#2A1B5E] bg-[#2A1B5E]/10 px-1.5 py-0.5 rounded-full">
                            {STAGE_LABEL[p.stage] ?? p.stage.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-xs text-[#8B8B8B] line-clamp-1">{p.tagline}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[11px] text-[#BDBDBD]">{p.authorName}</span>
                          <span className="text-[11px] text-[#BDBDBD]">·</span>
                          <span className="text-[11px] text-[#7C5CBF] font-semibold">{p.category}</span>
                        </div>
                      </div>
                      <div
                        className={`flex flex-col items-center gap-1 px-2.5 py-2 rounded-xl border min-w-[42px] shrink-0 ${
                          p.myUpvote ? 'bg-[#2A1B5E] border-[#2A1B5E]' : 'border-[#2A1B5E]'
                        }`}
                        onClick={e => { e.stopPropagation(); toggleUpvote(p) }}
                      >
                        <ChevronRight size={16} className={`${p.myUpvote ? 'text-white' : 'text-[#2A1B5E]'} -rotate-90`} />
                        <span className={`text-sm font-bold ${p.myUpvote ? 'text-white' : 'text-[#2A1B5E]'}`}>{p.upvotes}</span>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="text-center mt-4">
                  <button
                    onClick={() => setShowSubmit(true)}
                    className="inline-flex items-center gap-2 border border-[#2A1B5E] text-[#2A1B5E] font-semibold px-5 py-2.5 rounded-full text-sm hover:bg-[#2A1B5E]/5 transition-colors"
                  >
                    <Plus size={16} /> Submit your launch
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ─── Knowledge (Packets) Tab ─── */}
        {communityTab === 'knowledge' && (
          <div className="text-center py-16 px-4">
            <div className="w-16 h-16 bg-[#EDE9E3] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Package size={32} className="text-[#7C5CBF]" />
            </div>
            <h2 className="font-extrabold text-[#1A2332] text-lg mb-2">Knowledge Packets</h2>
            <p className="text-sm text-[#8B8B8B] leading-relaxed mb-6">
              Expert knowledge, structured for builders. Creators publish multi-chapter packets you can read and apply directly to your product.
            </p>
            <div className="inline-flex items-center gap-2 bg-[#EDE9E3] text-[#8B8B8B] font-semibold px-5 py-2.5 rounded-full text-sm">
              Coming Soon
            </div>
          </div>
        )}
      </div>

      {/* Milestone Modal */}
      <Modal open={showMilestone} onClose={() => setShowMilestone(false)} title="Post a milestone">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {(['shipped', 'first_dollar', 'first_user', 'custom'] as const).map(type => (
              <button
                key={type}
                onClick={() => setMilestoneType(type)}
                className={`p-3 rounded-xl border-2 text-left transition-all ${
                  milestoneType === type ? 'border-[#2A1B5E] bg-[#2A1B5E]/5' : 'border-[#E8E4DE] bg-[#EDE9E3] hover:border-[#7C5CBF]/40'
                }`}
              >
                <span className="text-xl">{MILESTONE_ICONS[type]}</span>
                <div className="text-xs font-semibold text-[#1A2332] mt-1">
                  {type === 'shipped' ? 'Shipped!' : type === 'first_dollar' ? 'First $' : type === 'first_user' ? 'First user' : 'Custom'}
                </div>
              </button>
            ))}
          </div>
          <textarea
            value={milestoneText}
            onChange={e => setMilestoneText(e.target.value)}
            placeholder="What did you achieve?"
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-[#E8E4DE] bg-[#EDE9E3] text-[#1A2332] placeholder-[#BDBDBD] focus:outline-none focus:ring-2 focus:ring-[#2A1B5E]/20 focus:border-[#2A1B5E] resize-none"
          />
          <button
            onClick={postMilestone}
            disabled={!milestoneText.trim()}
            className="w-full bg-[#2A1B5E] text-white font-semibold py-3 rounded-xl hover:bg-[#3D2878] transition-colors disabled:opacity-60"
          >
            Post milestone
          </button>
        </div>
      </Modal>

      {/* Thread Modal */}
      <Modal open={showThread} onClose={() => setShowThread(false)} title="Ask the community">
        <div className="space-y-4">
          <textarea
            value={threadQ}
            onChange={e => setThreadQ(e.target.value)}
            placeholder="What's on your mind? Ask the community…"
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-[#E8E4DE] bg-[#EDE9E3] text-[#1A2332] placeholder-[#BDBDBD] focus:outline-none focus:ring-2 focus:ring-[#2A1B5E]/20 focus:border-[#2A1B5E] resize-none"
          />
          <button
            onClick={postThread}
            disabled={!threadQ.trim()}
            className="w-full bg-[#2A1B5E] text-white font-semibold py-3 rounded-xl hover:bg-[#3D2878] transition-colors disabled:opacity-60"
          >
            Post question
          </button>
        </div>
      </Modal>

      {/* Product Detail Modal */}
      <Modal open={!!selectedProduct} onClose={() => setSelectedProduct(null)} title={selectedProduct?.name} size="lg">
        {selectedProduct && (
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-[#EDE9E3] rounded-2xl flex items-center justify-center text-3xl shrink-0">{selectedProduct.logoEmoji}</div>
              <div className="flex-1">
                <p className="text-sm text-[#8B8B8B]">{selectedProduct.tagline}</p>
                <p className="text-xs text-[#BDBDBD] mt-0.5">by {selectedProduct.authorName}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[9px] font-bold text-[#2A1B5E] bg-[#2A1B5E]/10 px-1.5 py-0.5 rounded-full">{STAGE_LABEL[selectedProduct.stage]}</span>
                  {selectedProduct.url && (
                    <a href={selectedProduct.url} target="_blank" rel="noopener noreferrer" className="text-xs text-[#7C5CBF] flex items-center gap-1 hover:underline">
                      <ExternalLink size={11} /> Visit
                    </a>
                  )}
                </div>
              </div>
              <button
                onClick={() => toggleUpvote(selectedProduct)}
                className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl border transition-all ${selectedProduct.myUpvote ? 'bg-[#2A1B5E] border-[#2A1B5E] text-white' : 'border-[#2A1B5E] text-[#2A1B5E]'}`}
              >
                <ThumbsUp size={14} />
                <span className="text-xs font-bold">{selectedProduct.upvotes}</span>
              </button>
            </div>
            <p className="text-sm text-[#1A2332] leading-relaxed">{selectedProduct.description}</p>
            {selectedProduct.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {selectedProduct.tags.map(tag => <span key={tag} className="px-2 py-0.5 bg-[#EDE9E3] rounded-full text-xs text-[#8B8B8B]">{tag}</span>)}
              </div>
            )}
            <div>
              <h3 className="text-sm font-bold text-[#1A2332] mb-2">Reviews & Feedback</h3>
              {reviewsLoading ? (
                <div className="text-center py-4"><div className="w-4 h-4 border-2 border-[#2A1B5E] border-t-transparent rounded-full animate-spin mx-auto" /></div>
              ) : productReviews.length === 0 ? (
                <p className="text-xs text-[#8B8B8B] text-center py-3">No reviews yet. Be the first!</p>
              ) : (
                <div className="space-y-2 mb-3">
                  {productReviews.map(r => (
                    <div key={r.id} className="bg-[#EDE9E3] rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-[#1A2332]">{r.authorName}</span>
                        <span className="text-[10px] px-1.5 py-0.5 bg-white rounded-full text-[#8B8B8B]">{r.type}</span>
                      </div>
                      <p className="text-xs text-[#8B8B8B]">{r.body}</p>
                    </div>
                  ))}
                </div>
              )}
              <div className="space-y-2 mt-3">
                <select
                  value={newReview.type}
                  onChange={e => setNewReview(r => ({ ...r, type: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-[#E8E4DE] bg-[#EDE9E3] text-sm text-[#1A2332] focus:outline-none"
                >
                  {['feedback', 'review', 'bug', 'tester'].map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
                <textarea
                  value={newReview.body}
                  onChange={e => setNewReview(r => ({ ...r, body: e.target.value }))}
                  placeholder="Leave feedback…"
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl border border-[#E8E4DE] bg-[#EDE9E3] text-sm text-[#1A2332] placeholder-[#BDBDBD] focus:outline-none resize-none"
                />
                <button
                  onClick={submitReview}
                  disabled={!newReview.body.trim()}
                  className="w-full bg-[#7C5CBF] text-white font-semibold py-2 rounded-xl text-sm hover:bg-[#6B4DAF] transition-colors disabled:opacity-60"
                >
                  Post review
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Submit Product Modal */}
      <Modal open={showSubmit} onClose={() => setShowSubmit(false)} title="Submit your launch" size="lg">
        <div className="space-y-3">
          <div className="grid grid-cols-4 gap-2 items-end">
            <div className="col-span-1">
              <label className="block text-xs font-medium text-[#8B8B8B] mb-1">Emoji</label>
              <input type="text" value={submitForm.logoEmoji} onChange={e => setSubmitForm(f => ({ ...f, logoEmoji: e.target.value }))}
                className="w-full px-3 py-3 rounded-xl border border-[#E8E4DE] bg-[#EDE9E3] text-center text-xl focus:outline-none" maxLength={2} />
            </div>
            <div className="col-span-3">
              <label className="block text-xs font-medium text-[#8B8B8B] mb-1">Name *</label>
              <input value={submitForm.name} onChange={e => setSubmitForm(f => ({ ...f, name: e.target.value }))} placeholder="My Awesome App"
                className="w-full px-3 py-3 rounded-xl border border-[#E8E4DE] bg-[#EDE9E3] text-[#1A2332] placeholder-[#BDBDBD] focus:outline-none text-sm" />
            </div>
          </div>
          {[
            { key: 'tagline', label: 'Tagline *', placeholder: 'One-line description' },
            { key: 'url', label: 'URL', placeholder: 'https://yourapp.com' },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-[#8B8B8B] mb-1">{label}</label>
              <input value={submitForm[key as keyof typeof submitForm] as string} onChange={e => setSubmitForm(f => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder} className="w-full px-3 py-2.5 rounded-xl border border-[#E8E4DE] bg-[#EDE9E3] text-[#1A2332] placeholder-[#BDBDBD] focus:outline-none text-sm" />
            </div>
          ))}
          <div>
            <label className="block text-xs font-medium text-[#8B8B8B] mb-1">Description *</label>
            <textarea value={submitForm.description} onChange={e => setSubmitForm(f => ({ ...f, description: e.target.value }))} placeholder="What does it do?" rows={3}
              className="w-full px-3 py-2.5 rounded-xl border border-[#E8E4DE] bg-[#EDE9E3] text-[#1A2332] placeholder-[#BDBDBD] focus:outline-none text-sm resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#8B8B8B] mb-1">Stage</label>
              <select value={submitForm.stage} onChange={e => setSubmitForm(f => ({ ...f, stage: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-[#E8E4DE] bg-[#EDE9E3] text-sm text-[#1A2332] focus:outline-none">
                {['idea', 'beta', 'live', 'sunset'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#8B8B8B] mb-1">Category</label>
              <select value={submitForm.category} onChange={e => setSubmitForm(f => ({ ...f, category: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-[#E8E4DE] bg-[#EDE9E3] text-sm text-[#1A2332] focus:outline-none">
                {['app', 'saas', 'tool', 'game', 'api', 'mobile', 'other'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#8B8B8B] mb-1">Looking for</label>
            <div className="flex flex-wrap gap-2">
              {(['feedback', 'review', 'bug', 'tester'] as const).map(lf => {
                const selected = submitForm.lookingFor.includes(lf)
                return (
                  <button key={lf} type="button"
                    onClick={() => setSubmitForm(f => ({ ...f, lookingFor: selected ? f.lookingFor.filter(x => x !== lf) : [...f.lookingFor, lf] }))}
                    className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${selected ? 'bg-[#2A1B5E] text-white border-[#2A1B5E]' : 'bg-white text-[#8B8B8B] border-[#E8E4DE]'}`}>
                    {lf}
                  </button>
                )
              })}
            </div>
          </div>
          <button onClick={handleSubmitProduct} className="w-full bg-[#2A1B5E] text-white font-semibold py-3 rounded-xl hover:bg-[#3D2878] transition-colors">
            Submit launch
          </button>
        </div>
      </Modal>
    </AppShell>
  )
}
