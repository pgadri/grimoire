'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Trophy, MessageCircle, ThumbsUp, Star, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { Modal } from '@/components/Modal'
import { ToastContainer, useToast } from '@/components/Toast'
import { useAuth } from '@/lib/auth-context'
import { api } from '@/lib/api'
import { storageMilestones, storageThreads } from '@/lib/storage'
import type { PublicCapture, Product, Milestone, Thread, ProductReview } from '@/lib/types'

const MILESTONE_ICONS: Record<string, string> = {
  shipped: '🚀',
  first_dollar: '💰',
  first_user: '🎉',
  custom: '✨',
}

const STAGE_COLORS: Record<string, string> = {
  idea: 'bg-gray-100 text-gray-700',
  beta: 'bg-blue-100 text-blue-700',
  live: 'bg-green-100 text-green-700',
  sunset: 'bg-red-100 text-red-700',
}

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
  const [tab, setTab] = useState<'community' | 'products'>('community')

  // Community
  const [publicCaptures, setPublicCaptures] = useState<PublicCapture[]>([])
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [threads, setThreads] = useState<Thread[]>([])
  const [capturesLoading, setCapturesLoading] = useState(false)

  // Milestone modal
  const [showMilestone, setShowMilestone] = useState(false)
  const [milestoneType, setMilestoneType] = useState<Milestone['type']>('shipped')
  const [milestoneText, setMilestoneText] = useState('')

  // Thread modal
  const [showThread, setShowThread] = useState(false)
  const [threadQ, setThreadQ] = useState('')
  const [expandedThread, setExpandedThread] = useState<string | null>(null)
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({})

  // Products
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
    } catch { /* ignore */ }
    finally { setCapturesLoading(false) }
  }, [])

  const loadProducts = useCallback(async () => {
    setProductsLoading(true)
    try {
      const data = await api.products.list()
      setProducts(data)
    } catch { /* ignore */ }
    finally { setProductsLoading(false) }
  }, [])

  useEffect(() => {
    if (tab === 'community') loadPublicCaptures()
    if (tab === 'products') loadProducts()
  }, [tab, loadPublicCaptures, loadProducts])

  function postMilestone() {
    if (!milestoneText.trim()) return
    const m: Milestone = {
      id: crypto.randomUUID(),
      type: milestoneType,
      text: milestoneText.trim(),
      authorName: user?.name || 'You',
      authorHandle: user?.handle,
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
      id: crypto.randomUUID(),
      question: threadQ.trim(),
      authorName: user?.name || 'You',
      authorHandle: user?.handle,
      createdAt: new Date().toISOString(),
      replies: [],
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
      id: crypto.randomUUID(),
      body,
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
      addToast(err instanceof Error ? err.message : 'Failed to upvote', 'error')
    }
  }

  async function openProduct(product: Product) {
    setSelectedProduct(product)
    setReviewsLoading(true)
    try {
      const reviews = await api.products.reviews(product.id)
      setProductReviews(reviews)
    } catch { setProductReviews([]) }
    finally { setReviewsLoading(false) }
  }

  async function submitReview() {
    if (!selectedProduct || !newReview.body.trim()) return
    if (!user) { addToast('Sign in to leave a review', 'error'); return }
    try {
      const review = await api.products.addReview(selectedProduct.id, {
        type: newReview.type,
        body: newReview.body,
        authorName: user.name,
      })
      setProductReviews(prev => [...prev, review])
      setNewReview({ type: 'feedback', body: '' })
      addToast('Review posted!', 'success')
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to post review', 'error')
    }
  }

  async function handleSubmitProduct() {
    if (!user) { addToast('Sign in to submit a product', 'error'); return }
    if (!submitForm.name || !submitForm.tagline || !submitForm.description) {
      addToast('Please fill in all required fields', 'error'); return
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
      addToast('Product submitted!', 'success')
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to submit', 'error')
    }
  }

  return (
    <AppShell>
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Header */}
      <div className="sticky top-0 bg-[#EDE9E3]/95 backdrop-blur-sm pt-6 pb-3 px-4 z-10">
        <h1 className="text-xl font-bold text-[#1A2332] mb-3">Discover</h1>
        <div className="flex gap-1 bg-white rounded-xl p-1 border border-[#E8E4DE]">
          {(['community', 'products'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === t ? 'bg-[#2A1B5E] text-white' : 'text-[#8B8B8B] hover:text-[#1A2332]'
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pb-4">
        {tab === 'community' && (
          <div className="space-y-5">
            {/* Public Captures */}
            <section>
              <h2 className="text-sm font-semibold text-[#8B8B8B] uppercase tracking-wide mb-3">Community Captures</h2>
              {capturesLoading ? (
                <div className="text-center py-8"><div className="w-6 h-6 border-2 border-[#2A1B5E] border-t-transparent rounded-full animate-spin mx-auto" /></div>
              ) : publicCaptures.length === 0 ? (
                <div className="text-center py-8 text-[#8B8B8B] text-sm">No community captures yet. Share one from your feed!</div>
              ) : (
                <div className="space-y-3">
                  {publicCaptures.slice(0, 5).map(c => (
                    <div key={c.id} className="bg-white rounded-2xl p-4 border border-[#E8E4DE]">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-7 h-7 bg-[#2A1B5E] rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {c.authorName?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <span className="text-xs font-semibold text-[#1A2332]">{c.authorName}</span>
                          {c.authorHandle && <span className="text-xs text-[#8B8B8B] ml-1">@{c.authorHandle}</span>}
                        </div>
                        <span className="ml-auto text-xs text-[#BDBDBD]">{formatRelative(c.createdAt)}</span>
                      </div>
                      <h3 className="text-sm font-semibold text-[#1A2332] mb-1">{c.title}</h3>
                      <p className="text-xs text-[#8B8B8B] line-clamp-2">{c.preview}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Milestones */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-[#8B8B8B] uppercase tracking-wide">Milestones</h2>
                <button
                  onClick={() => setShowMilestone(true)}
                  className="flex items-center gap-1 text-xs text-[#7C5CBF] font-medium hover:text-[#2A1B5E] transition-colors"
                >
                  <Plus size={14} /> Post
                </button>
              </div>
              <div className="space-y-2">
                {milestones.map(m => (
                  <div key={m.id} className="bg-white rounded-2xl p-4 border border-[#E8E4DE]">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{MILESTONE_ICONS[m.type] || '✨'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[#1A2332]">{m.text}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-xs font-medium text-[#8B8B8B]">{m.authorName}</span>
                          <span className="text-xs text-[#BDBDBD]">·</span>
                          <span className="text-xs text-[#BDBDBD]">{formatRelative(m.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Threads */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-[#8B8B8B] uppercase tracking-wide">Threads</h2>
                <button
                  onClick={() => setShowThread(true)}
                  className="flex items-center gap-1 text-xs text-[#7C5CBF] font-medium hover:text-[#2A1B5E] transition-colors"
                >
                  <Plus size={14} /> Ask
                </button>
              </div>
              <div className="space-y-2">
                {threads.map(t => (
                  <div key={t.id} className="bg-white rounded-2xl border border-[#E8E4DE] overflow-hidden">
                    <button
                      onClick={() => setExpandedThread(expandedThread === t.id ? null : t.id)}
                      className="w-full p-4 text-left"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-[#1A2332]">{t.question}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-[#8B8B8B]">{t.authorName}</span>
                            <span className="text-xs text-[#BDBDBD]">·</span>
                            <span className="text-xs text-[#BDBDBD]">{formatRelative(t.createdAt)}</span>
                            <span className="text-xs text-[#7C5CBF] font-medium ml-auto">
                              <MessageCircle size={12} className="inline mr-1" />{t.replies.length}
                            </span>
                          </div>
                        </div>
                        {expandedThread === t.id ? <ChevronUp size={16} className="text-[#8B8B8B] mt-0.5" /> : <ChevronDown size={16} className="text-[#8B8B8B] mt-0.5" />}
                      </div>
                    </button>

                    {expandedThread === t.id && (
                      <div className="border-t border-[#E8E4DE] bg-[#EDE9E3]/50 p-4 space-y-3">
                        {t.replies.map(r => (
                          <div key={r.id} className="bg-white rounded-xl p-3">
                            <p className="text-xs text-[#1A2332]">{r.body}</p>
                            <div className="flex items-center gap-1 mt-1.5">
                              <span className="text-[10px] font-medium text-[#8B8B8B]">{r.authorName}</span>
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
                            className="px-3 py-2 bg-[#2A1B5E] text-white text-xs font-medium rounded-xl hover:bg-[#3D2878] transition-colors"
                          >
                            Reply
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {tab === 'products' && (
          <div className="space-y-4 mt-1">
            <div className="flex items-center justify-between">
              <p className="text-xs text-[#8B8B8B]">{products.length} projects in the community</p>
              <button
                onClick={() => setShowSubmit(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-[#2A1B5E] text-white rounded-xl text-xs font-semibold hover:bg-[#3D2878] transition-colors"
              >
                <Plus size={14} /> Submit yours
              </button>
            </div>

            {productsLoading ? (
              <div className="text-center py-8"><div className="w-6 h-6 border-2 border-[#2A1B5E] border-t-transparent rounded-full animate-spin mx-auto" /></div>
            ) : products.length === 0 ? (
              <div className="text-center py-12 text-[#8B8B8B] text-sm">No products yet. Be the first to submit!</div>
            ) : (
              <div className="space-y-3">
                {products.map(p => (
                  <button
                    key={p.id}
                    onClick={() => openProduct(p)}
                    className="w-full bg-white rounded-2xl p-4 border border-[#E8E4DE] text-left hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-[#EDE9E3] rounded-xl flex items-center justify-center text-2xl shrink-0">
                        {p.logoEmoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h3 className="font-semibold text-[#1A2332] text-sm">{p.name}</h3>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${STAGE_COLORS[p.stage] || 'bg-gray-100 text-gray-700'}`}>
                            {p.stage}
                          </span>
                        </div>
                        <p className="text-xs text-[#8B8B8B] line-clamp-1">{p.tagline}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs text-[#8B8B8B]">by {p.authorName}</span>
                          <div className="flex items-center gap-1 ml-auto">
                            <ThumbsUp size={12} className={p.myUpvote ? 'text-[#2A1B5E]' : 'text-[#BDBDBD]'} />
                            <span className="text-xs text-[#8B8B8B]">{p.upvotes}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
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
                <span className="text-lg">{MILESTONE_ICONS[type]}</span>
                <div className="text-xs font-medium text-[#1A2332] mt-1">
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
              <div className="w-16 h-16 bg-[#EDE9E3] rounded-2xl flex items-center justify-center text-3xl shrink-0">
                {selectedProduct.logoEmoji}
              </div>
              <div className="flex-1">
                <p className="text-sm text-[#8B8B8B]">{selectedProduct.tagline}</p>
                <p className="text-xs text-[#BDBDBD] mt-1">by {selectedProduct.authorName}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${STAGE_COLORS[selectedProduct.stage]}`}>{selectedProduct.stage}</span>
                  {selectedProduct.url && (
                    <a href={selectedProduct.url} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-[#7C5CBF] flex items-center gap-1 hover:underline">
                      <ExternalLink size={11} /> Visit
                    </a>
                  )}
                </div>
              </div>
              <button
                onClick={() => toggleUpvote(selectedProduct)}
                className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl border transition-all ${
                  selectedProduct.myUpvote ? 'bg-[#2A1B5E] border-[#2A1B5E] text-white' : 'bg-white border-[#E8E4DE] text-[#8B8B8B]'
                }`}
              >
                <ThumbsUp size={14} />
                <span className="text-xs font-bold">{selectedProduct.upvotes}</span>
              </button>
            </div>

            <p className="text-sm text-[#1A2332] leading-relaxed">{selectedProduct.description}</p>

            {selectedProduct.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {selectedProduct.tags.map(tag => (
                  <span key={tag} className="px-2 py-0.5 bg-[#EDE9E3] rounded-full text-xs text-[#8B8B8B]">{tag}</span>
                ))}
              </div>
            )}

            {selectedProduct.lookingFor?.length > 0 && (
              <div className="bg-[#EDE9E3] rounded-xl p-3">
                <p className="text-xs font-semibold text-[#8B8B8B] mb-1.5">Looking for</p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedProduct.lookingFor.map(lf => (
                    <span key={lf} className="px-2 py-0.5 bg-[#2A1B5E]/10 text-[#2A1B5E] rounded-full text-xs font-medium">{lf}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews */}
            <div>
              <h3 className="text-sm font-semibold text-[#1A2332] mb-2">Reviews & Feedback</h3>
              {reviewsLoading ? (
                <div className="text-center py-4"><div className="w-4 h-4 border-2 border-[#2A1B5E] border-t-transparent rounded-full animate-spin mx-auto" /></div>
              ) : productReviews.length === 0 ? (
                <p className="text-xs text-[#8B8B8B] text-center py-3">No reviews yet. Be the first!</p>
              ) : (
                <div className="space-y-2">
                  {productReviews.map(r => (
                    <div key={r.id} className="bg-[#EDE9E3] rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-[#1A2332]">{r.authorName}</span>
                        <span className="text-[10px] px-1.5 py-0.5 bg-white rounded-full text-[#8B8B8B]">{r.type}</span>
                        {r.rating && (
                          <span className="text-xs text-[#F0A500]">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                        )}
                      </div>
                      <p className="text-xs text-[#8B8B8B]">{r.body}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Add review */}
              <div className="mt-3 space-y-2">
                <select
                  value={newReview.type}
                  onChange={e => setNewReview(r => ({ ...r, type: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-[#E8E4DE] bg-[#EDE9E3] text-sm text-[#1A2332] focus:outline-none focus:ring-2 focus:ring-[#2A1B5E]/20"
                >
                  {['feedback', 'review', 'bug', 'tester'].map(t => (
                    <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                  ))}
                </select>
                <textarea
                  value={newReview.body}
                  onChange={e => setNewReview(r => ({ ...r, body: e.target.value }))}
                  placeholder="Leave feedback…"
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl border border-[#E8E4DE] bg-[#EDE9E3] text-sm text-[#1A2332] placeholder-[#BDBDBD] focus:outline-none focus:ring-2 focus:ring-[#2A1B5E]/20 resize-none"
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
      <Modal open={showSubmit} onClose={() => setShowSubmit(false)} title="Submit your product" size="lg">
        <div className="space-y-3">
          <div className="grid grid-cols-4 gap-2 items-end">
            <div className="col-span-1">
              <label className="block text-xs font-medium text-[#8B8B8B] mb-1">Emoji</label>
              <input
                type="text"
                value={submitForm.logoEmoji}
                onChange={e => setSubmitForm(f => ({ ...f, logoEmoji: e.target.value }))}
                className="w-full px-3 py-3 rounded-xl border border-[#E8E4DE] bg-[#EDE9E3] text-center text-xl focus:outline-none focus:ring-2 focus:ring-[#2A1B5E]/20"
                maxLength={2}
              />
            </div>
            <div className="col-span-3">
              <label className="block text-xs font-medium text-[#8B8B8B] mb-1">Name *</label>
              <input
                value={submitForm.name}
                onChange={e => setSubmitForm(f => ({ ...f, name: e.target.value }))}
                placeholder="My Awesome App"
                className="w-full px-3 py-3 rounded-xl border border-[#E8E4DE] bg-[#EDE9E3] text-[#1A2332] placeholder-[#BDBDBD] focus:outline-none focus:ring-2 focus:ring-[#2A1B5E]/20 text-sm"
              />
            </div>
          </div>
          {[
            { key: 'tagline', label: 'Tagline *', placeholder: 'One-line description' },
            { key: 'url', label: 'URL', placeholder: 'https://yourapp.com' },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-[#8B8B8B] mb-1">{label}</label>
              <input
                value={submitForm[key as keyof typeof submitForm] as string}
                onChange={e => setSubmitForm(f => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder}
                className="w-full px-3 py-2.5 rounded-xl border border-[#E8E4DE] bg-[#EDE9E3] text-[#1A2332] placeholder-[#BDBDBD] focus:outline-none focus:ring-2 focus:ring-[#2A1B5E]/20 text-sm"
              />
            </div>
          ))}
          <div>
            <label className="block text-xs font-medium text-[#8B8B8B] mb-1">Description *</label>
            <textarea
              value={submitForm.description}
              onChange={e => setSubmitForm(f => ({ ...f, description: e.target.value }))}
              placeholder="What does your product do?"
              rows={3}
              className="w-full px-3 py-2.5 rounded-xl border border-[#E8E4DE] bg-[#EDE9E3] text-[#1A2332] placeholder-[#BDBDBD] focus:outline-none focus:ring-2 focus:ring-[#2A1B5E]/20 text-sm resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#8B8B8B] mb-1">Stage</label>
              <select
                value={submitForm.stage}
                onChange={e => setSubmitForm(f => ({ ...f, stage: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-[#E8E4DE] bg-[#EDE9E3] text-sm text-[#1A2332] focus:outline-none focus:ring-2 focus:ring-[#2A1B5E]/20"
              >
                {['idea', 'beta', 'live', 'sunset'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#8B8B8B] mb-1">Category</label>
              <select
                value={submitForm.category}
                onChange={e => setSubmitForm(f => ({ ...f, category: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-[#E8E4DE] bg-[#EDE9E3] text-sm text-[#1A2332] focus:outline-none focus:ring-2 focus:ring-[#2A1B5E]/20"
              >
                {['app', 'saas', 'tool', 'game', 'api', 'mobile', 'other'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#8B8B8B] mb-1">Tags (comma separated)</label>
            <input
              value={submitForm.tags}
              onChange={e => setSubmitForm(f => ({ ...f, tags: e.target.value }))}
              placeholder="react, ai, productivity"
              className="w-full px-3 py-2.5 rounded-xl border border-[#E8E4DE] bg-[#EDE9E3] text-sm text-[#1A2332] placeholder-[#BDBDBD] focus:outline-none focus:ring-2 focus:ring-[#2A1B5E]/20"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#8B8B8B] mb-1">Looking for</label>
            <div className="flex flex-wrap gap-2">
              {(['feedback', 'review', 'bug', 'tester'] as const).map(lf => {
                const selected = submitForm.lookingFor.includes(lf)
                return (
                  <button
                    key={lf}
                    type="button"
                    onClick={() => setSubmitForm(f => ({
                      ...f,
                      lookingFor: selected ? f.lookingFor.filter(x => x !== lf) : [...f.lookingFor, lf]
                    }))}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                      selected ? 'bg-[#2A1B5E] text-white border-[#2A1B5E]' : 'bg-white text-[#8B8B8B] border-[#E8E4DE]'
                    }`}
                  >
                    {lf}
                  </button>
                )
              })}
            </div>
          </div>
          <button
            onClick={handleSubmitProduct}
            className="w-full bg-[#2A1B5E] text-white font-semibold py-3 rounded-xl hover:bg-[#3D2878] transition-colors"
          >
            Submit product
          </button>
        </div>
      </Modal>
    </AppShell>
  )
}
