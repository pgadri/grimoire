'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Globe, Trash2, Share2, Star, PlayCircle,
  ImageIcon, Camera, Link2, FileText, Lightbulb, Zap, Quote,
} from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { ToastContainer, useToast } from '@/components/Toast'
import { storageCaptures } from '@/lib/storage'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import type { Capture } from '@/lib/types'

const CATEGORY_COLOR: Record<string, string> = {
  technical: '#2A6EBB',
  marketing: '#BB5E2A',
  launch: '#2A9E6B',
  pricing: '#9E2A7A',
  founder: '#2A1B5E',
  product: '#5E7A2A',
}

function sourceIcon(type: Capture['sourceType']) {
  if (type === 'video') return <PlayCircle size={13} className="text-[#7C5CBF] shrink-0" />
  if (type === 'image') return <ImageIcon size={13} className="text-[#7C5CBF] shrink-0" />
  if (type === 'camera') return <Camera size={13} className="text-[#7C5CBF] shrink-0" />
  if (type === 'url') return <Link2 size={13} className="text-[#7C5CBF] shrink-0" />
  return <FileText size={13} className="text-[#7C5CBF] shrink-0" />
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
    if (!c) { router.replace('/feed'); return }
    setCapture(c)
  }, [id, router])

  async function togglePublic() {
    if (!capture || !user) { addToast('Sign in to share', 'error'); return }
    setSharing(true)
    try {
      const becomingPublic = !capture.isPublic
      if (becomingPublic) {
        await api.publicCaptures.create({
          clientId: capture.id,
          title: capture.title,
          preview: capture.preview,
          category: capture.category,
          sourceType: capture.sourceType,
          platform: capture.platform,
          creator: capture.creator,
          sourceUrl: capture.sourceUrl,
          authorName: user.name,
        }).catch(() => {})
      } else {
        await api.publicCaptures.delete(capture.id).catch(() => {})
      }
      storageCaptures.update(capture.id, { isPublic: becomingPublic, pushed: becomingPublic })
      setCapture(c => c ? { ...c, isPublic: becomingPublic, pushed: becomingPublic } : c)
      addToast(becomingPublic ? 'Shared to community!' : 'Removed from community', becomingPublic ? 'success' : 'info')
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed', 'error')
    } finally {
      setSharing(false)
    }
  }

  async function handleShare() {
    if (!capture) return
    const text = `${capture.title}\n\n${capture.preview}\n\nShared from Vibecoded`
    if (navigator.share) {
      try { await navigator.share({ title: capture.title, text }) } catch {}
    } else {
      await navigator.clipboard.writeText(text)
      addToast('Copied to clipboard', 'success')
    }
  }

  async function handleDelete() {
    if (!capture) return
    if (!confirm('Delete this capture?')) return
    setDeleting(true)
    try {
      if (capture.isPublic) {
        await api.publicCaptures.delete(capture.id).catch(() => {})
      }
      storageCaptures.remove(capture.id)
      router.push('/feed')
    } catch {
      setDeleting(false)
    }
  }

  function handleStar() {
    if (!capture) return
    const next = { ...capture, starred: !capture.starred, stars: capture.starred ? capture.stars - 1 : capture.stars + 1 }
    storageCaptures.update(capture.id, { starred: next.starred, stars: next.stars })
    setCapture(next)
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

  const catColor = CATEGORY_COLOR[capture.category?.toLowerCase() ?? ''] ?? '#7C5CBF'
  const previewLines = capture.preview
    .split('\n')
    .map(l => l.replace(/^[•\-→]\s*/, '').trim())
    .filter(Boolean)

  return (
    <AppShell>
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Header */}
      <div className="sticky top-0 bg-[#EDE9E3]/95 backdrop-blur-sm pt-5 pb-3 px-4 z-10 flex items-center justify-between">
        <button onClick={() => router.back()} className="w-9 h-9 rounded-full bg-white border border-[#E8E4DE] shadow-sm flex items-center justify-center hover:bg-[#EDE9E3] transition-colors">
          <ArrowLeft size={18} className="text-[#1A2332]" />
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="w-9 h-9 rounded-full bg-white border border-[#E8E4DE] shadow-sm flex items-center justify-center hover:bg-[#EDE9E3] transition-colors"
          >
            <Share2 size={16} className="text-[#1A2332]" />
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="w-9 h-9 rounded-full bg-white border border-[#E8E4DE] shadow-sm flex items-center justify-center hover:bg-red-50 hover:border-red-200 transition-colors"
          >
            {deleting
              ? <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
              : <Trash2 size={16} className="text-[#EF4444]" />}
          </button>
        </div>
      </div>

      <div className="px-4 pb-10 space-y-3">
        {/* Main card */}
        <div className="bg-white rounded-2xl border border-[#E8E4DE] shadow-sm overflow-hidden">
          <div className="p-5">
            {/* Source row */}
            <div className="flex items-center gap-1.5 mb-3">
              {sourceIcon(capture.sourceType)}
              <span className="text-[11px] text-[#8B8B8B]">
                {capture.platform ? `${capture.platform} · ` : ''}{capture.creator}
              </span>
              {capture.isPublic && (
                <span className="text-[9px] font-bold text-[#2A1B5E] bg-[#2A1B5E]/10 px-1.5 py-0.5 rounded-full ml-1">PUBLIC</span>
              )}
              <span className="text-[11px] text-[#BDBDBD] ml-auto">{capture.date}</span>
            </div>

            {/* Title */}
            <h1 className="text-lg font-bold text-[#1A2332] leading-snug mb-3">{capture.title}</h1>

            {/* Category chip */}
            {capture.category && (
              <div className="inline-flex items-center px-2 py-0.5 rounded-full mb-3" style={{ backgroundColor: catColor + '18' }}>
                <span className="text-[9px] font-bold tracking-wide" style={{ color: catColor }}>
                  {capture.category.toUpperCase()}
                </span>
              </div>
            )}

            {/* Preview as bullet list */}
            <div className="space-y-1.5 mb-4">
              {previewLines.map((line, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-[#7C5CBF] font-bold text-base leading-5 shrink-0">·</span>
                  <p className="text-sm text-[#8B8B8B] leading-5">{line}</p>
                </div>
              ))}
            </div>

            {/* Source link */}
            {capture.sourceUrl && (
              <a
                href={capture.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-[#7C5CBF] hover:underline mb-2"
              >
                <Globe size={12} />
                View source
              </a>
            )}
          </div>

          {/* Footer actions */}
          <div className="flex items-center gap-5 px-5 py-3 border-t border-[#E8E4DE]">
            <button onClick={handleStar} className="flex items-center gap-1.5 hover:opacity-70 transition-opacity">
              <Star size={15} className={capture.starred ? 'fill-[#F0A500] text-[#F0A500]' : 'text-[#8B8B8B]'} />
              <span className="text-[11px] text-[#8B8B8B]">{capture.stars}</span>
            </button>
            <button
              onClick={togglePublic}
              disabled={sharing}
              className="flex items-center gap-1.5 hover:opacity-70 transition-opacity"
            >
              <Globe size={15} className={capture.isPublic ? 'text-[#2A1B5E]' : 'text-[#8B8B8B]'} />
              <span className={`text-[11px] ${capture.isPublic ? 'text-[#2A1B5E] font-medium' : 'text-[#8B8B8B]'}`}>
                {sharing ? '…' : capture.isPublic ? 'Public' : 'Publish'}
              </span>
            </button>
            <button onClick={handleShare} className="flex items-center gap-1.5 hover:opacity-70 transition-opacity">
              <Share2 size={15} className="text-[#8B8B8B]" />
              <span className="text-[11px] text-[#8B8B8B]">Share</span>
            </button>
          </div>
        </div>

        {/* Concepts */}
        {(capture.concepts?.length ?? 0) > 0 && (
          <div className="bg-white rounded-2xl border border-[#E8E4DE] shadow-sm p-5">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb size={15} className="text-[#F0A500]" />
              <h2 className="text-sm font-bold text-[#1A2332]">Concepts</h2>
            </div>
            <div className="space-y-2">
              {capture.concepts!.map((c, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#F0A500] mt-1.5 shrink-0" />
                  <p className="text-sm text-[#1A2332] leading-relaxed">{c}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Items */}
        {(capture.actions?.length ?? 0) > 0 && (
          <div className="bg-white rounded-2xl border border-[#E8E4DE] shadow-sm p-5">
            <div className="flex items-center gap-2 mb-3">
              <Zap size={15} className="text-[#22C55E]" />
              <h2 className="text-sm font-bold text-[#1A2332]">Action Items</h2>
            </div>
            <div className="space-y-2">
              {capture.actions!.map((a, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="w-4 h-4 rounded border border-[#22C55E]/60 shrink-0 mt-0.5" />
                  <p className="text-sm text-[#1A2332] leading-relaxed">{a}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quotes */}
        {(capture.quotes?.length ?? 0) > 0 && (
          <div className="bg-white rounded-2xl border border-[#E8E4DE] shadow-sm p-5">
            <div className="flex items-center gap-2 mb-3">
              <Quote size={15} className="text-[#7C5CBF]" />
              <h2 className="text-sm font-bold text-[#1A2332]">Quotes</h2>
            </div>
            <div className="space-y-3">
              {capture.quotes!.map((q, i) => (
                <blockquote key={i} className="border-l-2 border-[#7C5CBF]/40 pl-3">
                  <p className="text-sm text-[#1A2332] italic leading-relaxed">&ldquo;{q}&rdquo;</p>
                </blockquote>
              ))}
            </div>
          </div>
        )}

        {/* Transcript */}
        {capture.transcript && (
          <div className="bg-white rounded-2xl border border-[#E8E4DE] shadow-sm p-5">
            <h2 className="text-sm font-bold text-[#1A2332] mb-3">Full Transcript</h2>
            <p className="text-xs text-[#8B8B8B] leading-relaxed whitespace-pre-wrap">{capture.transcript}</p>
          </div>
        )}
      </div>
    </AppShell>
  )
}
