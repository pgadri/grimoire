'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Globe, Trash2, Share2, BookOpen, Lightbulb, Zap, Quote, Check } from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { ToastContainer, useToast } from '@/components/Toast'
import { storageCaptures } from '@/lib/storage'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import type { Capture } from '@/lib/types'

const CATEGORY_COLORS: Record<string, string> = {
  technical: 'bg-blue-100 text-blue-700',
  business: 'bg-emerald-100 text-emerald-700',
  design: 'bg-purple-100 text-purple-700',
  marketing: 'bg-orange-100 text-orange-700',
  general: 'bg-gray-100 text-gray-700',
}

export default function CaptureDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { user } = useAuth()
  const { toasts, addToast, removeToast } = useToast()
  const [capture, setCapture] = useState<Capture | null>(null)
  const [sharing, setSharing] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const c = storageCaptures.getById(id)
    if (!c) {
      router.replace('/feed')
      return
    }
    setCapture(c)
  }, [id, router])

  async function toggleShare() {
    if (!capture || !user) { addToast('Sign in to share', 'error'); return }
    setSharing(true)
    try {
      if (capture.shared) {
        await api.publicCaptures.delete(capture.id)
        storageCaptures.update(capture.id, { shared: false })
        setCapture(c => c ? { ...c, shared: false } : c)
        addToast('Removed from community', 'info')
      } else {
        await api.publicCaptures.create({
          clientId: capture.id,
          title: capture.title,
          preview: capture.preview,
          category: capture.category,
          sourceType: capture.sourceType,
          platform: capture.platform,
          creator: capture.creator,
          sourceUrl: capture.url,
          authorName: user.name,
        })
        storageCaptures.update(capture.id, { shared: true })
        setCapture(c => c ? { ...c, shared: true } : c)
        addToast('Shared to community!', 'success')
      }
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to update sharing', 'error')
    } finally {
      setSharing(false)
    }
  }

  async function handleDelete() {
    if (!capture) return
    if (!confirm('Delete this capture?')) return
    setDeleting(true)
    try {
      if (capture.shared) {
        await api.publicCaptures.delete(capture.id).catch(() => {})
      }
      storageCaptures.remove(capture.id)
      router.push('/feed')
    } catch {
      setDeleting(false)
    }
  }

  if (!capture) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-64">
          <div className="w-6 h-6 border-2 border-[#2A1B5E] border-t-transparent rounded-full animate-spin" />
        </div>
      </AppShell>
    )
  }

  const catColor = CATEGORY_COLORS[capture.category?.toLowerCase()] || 'bg-gray-100 text-gray-700'

  return (
    <AppShell>
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Header */}
      <div className="sticky top-0 bg-[#EDE9E3]/95 backdrop-blur-sm pt-6 pb-3 px-4 z-10 flex items-center justify-between">
        <button onClick={() => router.back()} className="p-2 -ml-1 rounded-xl hover:bg-white/70 transition-colors">
          <ArrowLeft size={20} className="text-[#1A2332]" />
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleShare}
            disabled={sharing}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all border ${
              capture.shared
                ? 'bg-[#2A1B5E] text-white border-[#2A1B5E]'
                : 'bg-white text-[#1A2332] border-[#E8E4DE] hover:border-[#7C5CBF]'
            }`}
          >
            {sharing ? (
              <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : capture.shared ? (
              <><Check size={13} /> Shared</>
            ) : (
              <><Share2 size={13} /> Share</>
            )}
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="p-2 rounded-xl bg-white border border-[#E8E4DE] text-red-500 hover:bg-red-50 transition-colors"
          >
            {deleting ? (
              <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Trash2 size={16} />
            )}
          </button>
        </div>
      </div>

      <div className="px-4 pb-8 space-y-4">
        {/* Title card */}
        <div className="bg-white rounded-2xl p-5 border border-[#E8E4DE]">
          <div className="flex items-center justify-between mb-3">
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${catColor}`}>
              {capture.category}
            </span>
            {capture.url && (
              <a href={capture.url} target="_blank" rel="noopener noreferrer"
                className="text-[#7C5CBF] hover:text-[#2A1B5E] transition-colors">
                <Globe size={16} />
              </a>
            )}
          </div>
          <h1 className="text-lg font-bold text-[#1A2332] mb-2">{capture.title}</h1>
          <p className="text-sm text-[#8B8B8B] leading-relaxed">{capture.preview}</p>
          <div className="mt-3 flex items-center justify-between text-xs text-[#BDBDBD]">
            <span>{capture.creator}</span>
            <span>{new Date(capture.date).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Key Points */}
        {capture.bullets?.length > 0 && (
          <Section icon={<BookOpen size={16} />} title="Key Points" color="text-blue-600">
            <ul className="space-y-2">
              {capture.bullets.map((b, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-[#1A2332]">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 shrink-0" />
                  {b}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Concepts */}
        {capture.concepts?.length > 0 && (
          <Section icon={<Lightbulb size={16} />} title="Concepts" color="text-yellow-600">
            <div className="flex flex-wrap gap-2">
              {capture.concepts.map((c, i) => (
                <span key={i} className="px-3 py-1 bg-yellow-50 text-yellow-800 rounded-full text-xs font-medium border border-yellow-200">
                  {c}
                </span>
              ))}
            </div>
          </Section>
        )}

        {/* Action Items */}
        {capture.actions?.length > 0 && (
          <Section icon={<Zap size={16} />} title="Action Items" color="text-emerald-600">
            <ul className="space-y-2">
              {capture.actions.map((a, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-[#1A2332]">
                  <div className="w-4 h-4 rounded border border-emerald-400 shrink-0 mt-0.5" />
                  {a}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Quotes */}
        {capture.quotes?.length > 0 && (
          <Section icon={<Quote size={16} />} title="Quotes" color="text-purple-600">
            <div className="space-y-3">
              {capture.quotes.map((q, i) => (
                <blockquote key={i} className="border-l-3 border-purple-300 pl-3">
                  <p className="text-sm text-[#1A2332] italic">&ldquo;{q}&rdquo;</p>
                </blockquote>
              ))}
            </div>
          </Section>
        )}
      </div>
    </AppShell>
  )
}

function Section({ icon, title, color, children }: {
  icon: React.ReactNode
  title: string
  color: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-[#E8E4DE]">
      <div className={`flex items-center gap-2 mb-3 ${color}`}>
        {icon}
        <h2 className="font-semibold text-sm">{title}</h2>
      </div>
      {children}
    </div>
  )
}
