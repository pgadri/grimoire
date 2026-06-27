'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, ChevronUp, Copy, Check, GitBranch, ShieldAlert, ExternalLink, RefreshCw } from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { ToastContainer, useToast } from '@/components/Toast'
import { storageOnboarding, storageReactions } from '@/lib/storage'
import { matchRisks, readinessScore, countBySeverity, CATEGORY_LABELS } from '@/lib/projectRisk'
import { api } from '@/lib/api'
import type { ProjectProfile, MatchedRisk, StackTag } from '@/lib/projectRisk'
import type { ScanResult } from '@/lib/types'

const SEVERITY_STYLES = {
  critical: { badge: 'bg-red-100 text-red-700 border-red-200', dot: 'bg-red-500', label: 'CRITICAL' },
  high: { badge: 'bg-amber-100 text-amber-700 border-amber-200', dot: 'bg-amber-500', label: 'HIGH' },
  medium: { badge: 'bg-purple-100 text-[#7C5CBF] border-purple-200', dot: 'bg-[#7C5CBF]', label: 'MEDIUM' },
}

function buildProfileFromOnboarding(): ProjectProfile {
  const data = storageOnboarding.get()
  const aiPlatforms = data.stack || []

  const stage = (() => {
    const s = data.stage || 'idea'
    if (s === 'idea') return 'idea'
    if (s === 'building') return 'building'
    if (s === 'pre-launch') return 'pre-launch'
    if (s === 'live') return 'live'
    return 'idea'
  })() as ProjectProfile['stage']

  const stackSet = new Set<StackTag>(['node', 'auth'])

  const vibeTools = ['cursor', 'windsurf', 'claude code', 'github copilot', 'bolt.new', 'lovable', 'v0', 'replit ai']
  const hasVibeTool = aiPlatforms.some(t => vibeTools.some(v => t.toLowerCase().includes(v.toLowerCase())))
  if (hasVibeTool) {
    stackSet.add('react')
    stackSet.add('nextjs')
  }

  return {
    stage,
    stack: Array.from(stackSet),
    handlesPayments: data.handlesPayments ?? false,
    storesUserData: data.storesUserData ?? true,
  }
}

function RiskCard({ risk, onToggle }: { risk: MatchedRisk; onToggle: () => void }) {
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)
  const sev = SEVERITY_STYLES[risk.severity]

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(risk.aiPrompt)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback
    }
  }

  function openWith(tool: 'claude' | 'chatgpt' | 'cursor') {
    const encoded = encodeURIComponent(risk.aiPrompt)
    const urls = {
      claude: `https://claude.ai/new?q=${encoded}`,
      chatgpt: `https://chat.openai.com/?q=${encoded}`,
      cursor: `cursor://chat?message=${encoded}`,
    }
    window.open(urls[tool], '_blank')
  }

  const issueTitle = encodeURIComponent(`[Security] ${risk.title}`)
  const issueBody = encodeURIComponent(`## Problem\n${risk.problem}\n\n## Why it matters\n${risk.why}`)

  return (
    <div className={`bg-white rounded-2xl border overflow-hidden transition-all ${
      risk.resolved ? 'opacity-60 border-[#E8E4DE]' : 'border-[#E8E4DE] shadow-sm'
    }`}>
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full p-4 text-left"
      >
        <div className="flex items-start gap-3">
          <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${sev.dot}`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2 flex-wrap">
              <span className={`text-[10px] px-1.5 py-0.5 rounded border font-bold tracking-wide ${sev.badge}`}>
                {sev.label}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#EDE9E3] text-[#8B8B8B] font-medium">
                {CATEGORY_LABELS[risk.category]}
              </span>
            </div>
            <h3 className={`font-semibold text-sm mt-1.5 ${risk.resolved ? 'line-through text-[#8B8B8B]' : 'text-[#1A2332]'}`}>
              {risk.title}
            </h3>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={e => { e.stopPropagation(); onToggle() }}
              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                risk.resolved
                  ? 'bg-[#22C55E] border-[#22C55E]'
                  : 'border-[#E8E4DE] hover:border-[#22C55E]'
              }`}
            >
              {risk.resolved && <Check size={10} className="text-white" />}
            </button>
            {expanded ? (
              <ChevronUp size={16} className="text-[#8B8B8B]" />
            ) : (
              <ChevronDown size={16} className="text-[#8B8B8B]" />
            )}
          </div>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-[#E8E4DE] px-4 pb-4 pt-3 space-y-3">
          <div>
            <p className="text-xs font-semibold text-[#8B8B8B] uppercase tracking-wide mb-1">Problem</p>
            <p className="text-sm text-[#1A2332] leading-relaxed">{risk.problem}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-[#8B8B8B] uppercase tracking-wide mb-1">Why it matters</p>
            <p className="text-sm text-[#1A2332] leading-relaxed">{risk.why}</p>
          </div>
          {/* AI Prompt */}
          <div className="bg-[#1A2332] rounded-xl p-3 text-xs text-green-300 font-mono leading-relaxed max-h-24 overflow-y-auto">
            {risk.aiPrompt}
          </div>
          <button
            onClick={copyPrompt}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all border ${
              copied
                ? 'bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/30'
                : 'bg-[#EDE9E3] text-[#2A1B5E] border-[#E8E4DE] hover:bg-[#2A1B5E] hover:text-white hover:border-[#2A1B5E]'
            }`}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copied!' : 'Copy AI Prompt'}
          </button>
          {/* Open with */}
          <div>
            <p className="text-xs text-[#8B8B8B] mb-2">Open with:</p>
            <div className="flex gap-2">
              {(['claude', 'chatgpt', 'cursor'] as const).map(tool => (
                <button
                  key={tool}
                  onClick={() => openWith(tool)}
                  className="flex-1 py-2 rounded-xl border border-[#E8E4DE] bg-white text-xs font-medium text-[#1A2332] hover:border-[#7C5CBF] transition-colors"
                >
                  {tool === 'claude' ? '✦ Claude' : tool === 'chatgpt' ? 'ChatGPT' : 'Cursor'}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between pt-1">
            <p className="text-[10px] text-[#BDBDBD]">{risk.source}</p>
            <a
              href={`https://github.com/new/issues?title=${issueTitle}&body=${issueBody}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-[#7C5CBF] flex items-center gap-0.5 hover:underline"
            >
              <ExternalLink size={10} /> Create issue
            </a>
          </div>
        </div>
      )}
    </div>
  )
}

function ScoreCircle({ score }: { score: number }) {
  const color = score >= 70 ? '#22C55E' : score >= 40 ? '#F0A500' : '#EF4444'
  const circumference = 2 * Math.PI * 40
  const dash = (score / 100) * circumference

  return (
    <div className="relative w-28 h-28">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="40" fill="none" stroke="#E8E4DE" strokeWidth="8" />
        <circle
          cx="50" cy="50" r="40" fill="none"
          stroke={color} strokeWidth="8"
          strokeDasharray={`${dash} ${circumference}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-[#1A2332]">{score}</span>
        <span className="text-[10px] text-[#8B8B8B] font-medium">/ 100</span>
      </div>
    </div>
  )
}

export default function ReadinessPage() {
  const router = useRouter()
  const { toasts, addToast, removeToast } = useToast()
  const [risks, setRisks] = useState<MatchedRisk[]>([])
  const [score, setScore] = useState(0)
  const [hasOnboarding, setHasOnboarding] = useState(false)
  const [repoUrl, setRepoUrl] = useState('')
  const [scanning, setScanning] = useState(false)
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)

  useEffect(() => {
    const onboarding = storageOnboarding.get()
    if (!onboarding.completed) {
      setHasOnboarding(false)
      return
    }
    setHasOnboarding(true)
    const profile = buildProfileFromOnboarding()
    const resolvedIds = storageReactions.getResolved()
    const matched = matchRisks(profile, resolvedIds)
    setRisks(matched)
    setScore(readinessScore(profile, resolvedIds))
  }, [])

  function handleToggle(riskId: string) {
    storageReactions.toggle(riskId)
    const profile = buildProfileFromOnboarding()
    const resolvedIds = storageReactions.getResolved()
    const matched = matchRisks(profile, resolvedIds)
    setRisks(matched)
    setScore(readinessScore(profile, resolvedIds))
  }

  async function handleScan() {
    if (!repoUrl.trim()) return
    setScanning(true)
    setScanResult(null)
    try {
      const result = await api.repo.scan(repoUrl.trim())
      setScanResult(result)
      addToast('Scan complete!', 'success')
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Scan failed', 'error')
    } finally {
      setScanning(false)
    }
  }

  if (!hasOnboarding) {
    return (
      <AppShell>
        <div className="px-4 pt-12 pb-8 flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="w-16 h-16 bg-[#2A1B5E]/10 rounded-2xl flex items-center justify-center mb-4">
            <ShieldAlert size={32} className="text-[#2A1B5E]" />
          </div>
          <h1 className="text-xl font-bold text-[#1A2332] mb-2">Set up your project first</h1>
          <p className="text-sm text-[#8B8B8B] mb-6 max-w-xs">
            Complete onboarding so we can surface launch risks specific to your stack and stage.
          </p>
          <button
            onClick={() => router.push('/onboarding')}
            className="px-6 py-3 bg-[#2A1B5E] text-white font-semibold rounded-2xl hover:bg-[#3D2878] transition-colors"
          >
            Complete Onboarding
          </button>
        </div>
      </AppShell>
    )
  }

  const counts = countBySeverity(risks)
  const unresolvedRisks = risks.filter(r => !r.resolved)
  const resolvedRisks = risks.filter(r => r.resolved)

  return (
    <AppShell>
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Header */}
      <div className="sticky top-0 bg-[#EDE9E3]/95 backdrop-blur-sm pt-6 pb-3 px-4 z-10">
        <h1 className="text-xl font-bold text-[#1A2332]">Launch Readiness</h1>
        <p className="text-xs text-[#8B8B8B]">Risks matched to your project</p>
      </div>

      <div className="px-4 pb-8 space-y-4">
        {/* Score card */}
        <div className="bg-white rounded-2xl p-5 border border-[#E8E4DE] shadow-sm">
          <div className="flex items-center gap-5">
            <ScoreCircle score={score} />
            <div className="flex-1">
              <p className="text-sm font-semibold text-[#1A2332] mb-3">Readiness Score</p>
              <div className="space-y-2">
                {counts.critical > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <span className="text-xs text-[#1A2332]">
                      <span className="font-bold">{counts.critical}</span> critical
                    </span>
                  </div>
                )}
                {counts.high > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="text-xs text-[#1A2332]">
                      <span className="font-bold">{counts.high}</span> high
                    </span>
                  </div>
                )}
                {counts.medium > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#7C5CBF]" />
                    <span className="text-xs text-[#1A2332]">
                      <span className="font-bold">{counts.medium}</span> medium
                    </span>
                  </div>
                )}
                {counts.critical === 0 && counts.high === 0 && counts.medium === 0 && (
                  <p className="text-xs text-[#22C55E] font-semibold">All issues resolved!</p>
                )}
              </div>
            </div>
          </div>
          {resolvedRisks.length > 0 && (
            <p className="text-xs text-[#8B8B8B] mt-3 text-center">
              {resolvedRisks.length} of {risks.length} issues resolved
            </p>
          )}
        </div>

        {/* Risk list */}
        {unresolvedRisks.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-[#8B8B8B] uppercase tracking-wider px-1">
              Open Issues ({unresolvedRisks.length})
            </p>
            {unresolvedRisks.map(risk => (
              <RiskCard key={risk.id} risk={risk} onToggle={() => handleToggle(risk.id)} />
            ))}
          </div>
        )}

        {/* Resolved */}
        {resolvedRisks.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-[#8B8B8B] uppercase tracking-wider px-1">
              Resolved ({resolvedRisks.length})
            </p>
            {resolvedRisks.map(risk => (
              <RiskCard key={risk.id} risk={risk} onToggle={() => handleToggle(risk.id)} />
            ))}
          </div>
        )}

        {/* Repo Scanner */}
        <div className="bg-white rounded-2xl p-5 border border-[#E8E4DE]">
          <div className="flex items-center gap-2 mb-3">
            <GitBranch size={18} className="text-[#1A2332]" />
            <h2 className="font-semibold text-[#1A2332] text-sm">Scan a GitHub Repo</h2>
          </div>
          <p className="text-xs text-[#8B8B8B] mb-3">
            Paste your public repo URL for a deeper code-level scan.
          </p>
          <div className="flex gap-2">
            <input
              type="url"
              value={repoUrl}
              onChange={e => setRepoUrl(e.target.value)}
              placeholder="https://github.com/you/your-repo"
              className="flex-1 px-3 py-2.5 rounded-xl border border-[#E8E4DE] bg-[#EDE9E3] text-sm text-[#1A2332] placeholder-[#BDBDBD] focus:outline-none focus:ring-2 focus:ring-[#2A1B5E]/20"
              onKeyDown={e => e.key === 'Enter' && handleScan()}
            />
            <button
              onClick={handleScan}
              disabled={scanning || !repoUrl.trim()}
              className="px-4 py-2.5 bg-[#2A1B5E] text-white rounded-xl text-sm font-medium hover:bg-[#3D2878] transition-colors disabled:opacity-60 shrink-0"
            >
              {scanning ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : 'Scan'}
            </button>
          </div>

          {scanResult && (
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-[#1A2332]">{scanResult.owner}/{scanResult.repo}</span>
                <span className={`text-sm font-bold ${scanResult.score >= 70 ? 'text-[#22C55E]' : scanResult.score >= 40 ? 'text-[#F0A500]' : 'text-[#EF4444]'}`}>
                  Score: {scanResult.score}
                </span>
              </div>
              {scanResult.detectedStack.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {scanResult.detectedStack.map(s => (
                    <span key={s} className="text-xs px-2 py-0.5 bg-[#EDE9E3] text-[#7C5CBF] rounded-full">{s}</span>
                  ))}
                </div>
              )}
              {scanResult.findings.slice(0, 3).map(f => {
                const sev = SEVERITY_STYLES[f.severity]
                return (
                  <div key={f.id} className="bg-[#EDE9E3] rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded border font-bold ${sev.badge}`}>
                        {sev.label}
                      </span>
                      <span className="text-xs font-semibold text-[#1A2332]">{f.title}</span>
                    </div>
                    <p className="text-xs text-[#8B8B8B]">{f.description}</p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
