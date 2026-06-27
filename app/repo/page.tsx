'use client'

import { useState, useEffect, useCallback } from 'react'
import { GitBranch, Star, GitFork, AlertCircle, Clock, ExternalLink, Settings, BarChart3, RefreshCw, CheckCircle, Rocket } from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import type { OnboardingData } from '@/lib/types'

const BACKEND = 'https://reel-capture-production.up.railway.app'

type RepoInfo = {
  name: string
  description: string | null
  stargazersCount: number
  forksCount: number
  openIssuesCount: number
  pushedAt: string
  language: string | null
  visibility: string
  defaultBranch: string
  size: number
  detectedStack?: string[]
  storesUserData?: boolean
  handlesPayments?: boolean
}

type PostHogCreds = { apiKey: string; projectId: string; region: 'us' | 'eu' }
type PostHogStats = { opens: number | null; users: number | null; retention: number | null }

type Tool = { name: string; emoji: string; desc: string; url: string }
type ToolCategory = { id: string; label: string; emoji: string; stages: string[]; tools: Tool[] }

const TOOL_CATEGORIES: ToolCategory[] = [
  {
    id: 'build', label: 'Build with AI', emoji: '⚡', stages: ['idea', 'building'],
    tools: [
      { name: 'Bolt.new', emoji: '⚡', desc: 'Prompt-to-fullstack app', url: 'https://bolt.new' },
      { name: 'Lovable', emoji: '💜', desc: 'AI full-stack app builder', url: 'https://lovable.dev' },
      { name: 'v0', emoji: '▲', desc: 'Generate UI with text', url: 'https://v0.dev' },
      { name: 'Cursor', emoji: '🖱️', desc: 'AI code editor', url: 'https://cursor.sh' },
      { name: 'Windsurf', emoji: '🏄', desc: 'Agentic AI editor', url: 'https://codeium.com/windsurf' },
      { name: 'Claude Code', emoji: '✦', desc: 'AI coding in your terminal', url: 'https://claude.ai/code' },
    ],
  },
  {
    id: 'design', label: 'Design', emoji: '🎨', stages: ['idea', 'building'],
    tools: [
      { name: 'Figma', emoji: '🎨', desc: 'Design & prototype UI', url: 'https://figma.com' },
      { name: 'Framer', emoji: '📐', desc: 'AI-powered website builder', url: 'https://framer.com' },
      { name: 'Higgsfield AI', emoji: '🎬', desc: 'AI video creation', url: 'https://higgsfield.ai' },
    ],
  },
  {
    id: 'deploy', label: 'Deploy & Host', emoji: '🚀', stages: ['building', 'pre-launch', 'launched'],
    tools: [
      { name: 'Railway', emoji: '🚂', desc: 'Deploy backends in seconds', url: 'https://railway.app' },
      { name: 'Vercel', emoji: '▲', desc: 'Frontend & Next.js platform', url: 'https://vercel.com' },
      { name: 'Render', emoji: '🌐', desc: 'Full-stack web services', url: 'https://render.com' },
      { name: 'Fly.io', emoji: '🪰', desc: 'Deploy globally fast', url: 'https://fly.io' },
    ],
  },
  {
    id: 'backend', label: 'Backend & DB', emoji: '🗄️', stages: ['building', 'pre-launch'],
    tools: [
      { name: 'Supabase', emoji: '⚡', desc: 'Open source Firebase alt', url: 'https://supabase.com' },
      { name: 'Neon', emoji: '🐘', desc: 'Serverless Postgres', url: 'https://neon.tech' },
      { name: 'Firebase', emoji: '🔥', desc: "Google's BaaS platform", url: 'https://firebase.google.com' },
      { name: 'PlanetScale', emoji: '🪐', desc: 'Serverless MySQL', url: 'https://planetscale.com' },
    ],
  },
  {
    id: 'payments', label: 'Payments', emoji: '💳', stages: ['pre-launch', 'launched'],
    tools: [
      { name: 'Stripe', emoji: '💳', desc: 'Payments infrastructure', url: 'https://stripe.com' },
      { name: 'RevenueCat', emoji: '📱', desc: 'Mobile subscriptions', url: 'https://revenuecat.com' },
      { name: 'Lemon Squeezy', emoji: '🍋', desc: 'Merchant of record (EU)', url: 'https://lemonsqueezy.com' },
      { name: 'Paddle', emoji: '🏓', desc: 'SaaS billing & taxes', url: 'https://paddle.com' },
    ],
  },
  {
    id: 'auth', label: 'Auth', emoji: '🔐', stages: ['building', 'pre-launch'],
    tools: [
      { name: 'Clerk', emoji: '🔐', desc: 'Drop-in auth & user mgmt', url: 'https://clerk.com' },
      { name: 'Auth0', emoji: '🛡️', desc: 'Enterprise auth platform', url: 'https://auth0.com' },
      { name: 'Supabase Auth', emoji: '⚡', desc: 'Built-in auth with your DB', url: 'https://supabase.com/auth' },
    ],
  },
  {
    id: 'analytics', label: 'Analytics', emoji: '📊', stages: ['pre-launch', 'launched'],
    tools: [
      { name: 'PostHog', emoji: '🦔', desc: 'Open source product analytics', url: 'https://posthog.com' },
      { name: 'Plausible', emoji: '📈', desc: 'Simple, privacy-first analytics', url: 'https://plausible.io' },
      { name: 'Mixpanel', emoji: '📊', desc: 'Event analytics & funnels', url: 'https://mixpanel.com' },
      { name: 'Sentry', emoji: '🛡️', desc: 'Error monitoring & alerting', url: 'https://sentry.io' },
    ],
  },
  {
    id: 'email', label: 'Email', emoji: '📧', stages: ['building', 'pre-launch', 'launched'],
    tools: [
      { name: 'Resend', emoji: '📧', desc: 'Transactional email for devs', url: 'https://resend.com' },
      { name: 'Loops', emoji: '🔁', desc: 'Product email platform', url: 'https://loops.so' },
      { name: 'Beehiiv', emoji: '🐝', desc: 'Newsletter platform', url: 'https://beehiiv.com' },
    ],
  },
  {
    id: 'marketing', label: 'Marketing & Launch', emoji: '📣', stages: ['pre-launch', 'launched'],
    tools: [
      { name: 'Product Hunt', emoji: '🦁', desc: 'Launch to 500K+ tech users', url: 'https://producthunt.com' },
      { name: 'Indie Hackers', emoji: '👥', desc: 'Community for builders', url: 'https://indiehackers.com' },
      { name: 'Perplexity', emoji: '🔍', desc: 'AI-powered research & SEO', url: 'https://perplexity.ai' },
    ],
  },
]

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`
  return `${Math.floor(diff / 2592000)}mo ago`
}

function normalizeUrl(url: string): string {
  const t = url.trim()
  return t.startsWith('http://') || t.startsWith('https://') ? t : `https://${t}`
}

function parseGithubUrl(url: string): { owner: string; repo: string } | null {
  try {
    const u = new URL(normalizeUrl(url))
    const parts = u.pathname.replace(/^\//, '').replace(/\.git$/, '').split('/')
    if (parts.length >= 2) return { owner: parts[0], repo: parts[1] }
  } catch {}
  return null
}

async function fetchRepoInfo(url: string): Promise<RepoInfo | null> {
  try {
    const encoded = encodeURIComponent(url.trim())
    const res = await fetch(`${BACKEND}/repo-info?repo_url=${encoded}`)
    if (!res.ok) return null
    return res.json()
  } catch { return null }
}

async function fetchPostHogStats(creds: PostHogCreds): Promise<PostHogStats> {
  const host = creds.region === 'eu' ? 'https://eu.posthog.com' : 'https://app.posthog.com'
  const headers = { Authorization: `Bearer ${creds.apiKey}`, 'Content-Type': 'application/json' }
  try {
    const res = await fetch(`${host}/api/projects/${creds.projectId}/query/`, {
      method: 'POST', headers,
      body: JSON.stringify({
        query: {
          kind: 'HogQLQuery',
          query: `SELECT count() as opens, uniq(distinct_id) as users,
            uniqIf(distinct_id, toStartOfWeek(timestamp) = toStartOfWeek(today() - INTERVAL 7 DAY)) as prev_users,
            uniqIf(distinct_id, toStartOfWeek(timestamp) = toStartOfWeek(today())) as curr_users
            FROM events WHERE timestamp >= now() - INTERVAL 14 DAY`,
        },
      }),
    })
    if (!res.ok) return { opens: null, users: null, retention: null }
    const json = await res.json()
    const row: number[] = json?.results?.[0] ?? []
    const prev = row[2] ?? 0
    const curr = row[3] ?? 0
    return {
      opens: row[0] ?? null,
      users: row[1] ?? null,
      retention: prev > 0 ? Math.round((curr / prev) * 100) : null,
    }
  } catch { return { opens: null, users: null, retention: null } }
}

function safeGet<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch { return fallback }
}

export default function RepoPage() {
  const [onboarding, setOnboarding] = useState<OnboardingData | null>(null)
  const [hasOnboarding, setHasOnboarding] = useState<boolean | null>(null)
  const [repoInfo, setRepoInfo] = useState<RepoInfo | null>(null)
  const [repoLoading, setRepoLoading] = useState(false)
  const [repoError, setRepoError] = useState(false)
  const [phStats, setPhStats] = useState<PostHogStats | null>(null)
  const [phLoading, setPhLoading] = useState(false)
  const [phConnected, setPhConnected] = useState(false)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  const load = useCallback(async () => {
    const raw = localStorage.getItem('grimoire:onboarding')
    const phRaw = localStorage.getItem('grimoire:posthog')

    setHasOnboarding(!!raw)
    if (!raw) return

    const data: OnboardingData = JSON.parse(raw)
    setOnboarding(data)

    if (phRaw) {
      const creds: PostHogCreds = JSON.parse(phRaw)
      setPhConnected(true)
      setPhLoading(true)
      fetchPostHogStats(creds).then(stats => { setPhStats(stats); setPhLoading(false) })
    }

    if (data.githubRepo) {
      setRepoLoading(true)
      setRepoError(false)
      const info = await fetchRepoInfo(data.githubRepo)
      setRepoInfo(info)
      setRepoLoading(false)
      if (!info) setRepoError(true)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const stage = onboarding?.stage ?? 'building'
  const sortedCategories = [...TOOL_CATEGORIES].sort((a, b) => {
    const aR = a.stages.includes(stage) ? 0 : 1
    const bR = b.stages.includes(stage) ? 0 : 1
    return aR - bR
  })
  const displayedCategory = activeCategory ?? sortedCategories[0]?.id
  const activeCat = sortedCategories.find(c => c.id === displayedCategory) ?? sortedCategories[0]

  if (hasOnboarding === false) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6 gap-4">
          <span className="text-6xl mb-2">🚀</span>
          <h2 className="text-2xl font-extrabold text-[#1A2332]">Set up your project</h2>
          <p className="text-sm text-[#8B8B8B] max-w-sm leading-relaxed">
            Tell us about what you're building so we can personalize your tools, diagnostics, and launch checklist.
          </p>
          <a
            href="/onboarding"
            className="bg-[#2A1B5E] text-white font-bold px-8 py-3 rounded-full text-sm hover:bg-[#3D2878] transition-colors mt-2"
          >
            Get started
          </a>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="pt-5 pb-10 space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between px-4">
          <div>
            <h1 className="text-[28px] font-extrabold text-[#1A2332]">Repo</h1>
            {onboarding?.projectName && (
              <p className="text-sm text-[#8B8B8B] mt-0.5">{onboarding.projectName}</p>
            )}
          </div>
          <a
            href="/onboarding"
            className="w-9 h-9 rounded-full bg-white border border-[#E8E4DE] shadow-sm flex items-center justify-center hover:bg-[#EDE9E3] transition-colors"
          >
            <Settings size={18} className="text-[#8B8B8B]" />
          </a>
        </div>

        {/* Launch Confidence Card */}
        <div className="px-4">
          <a href="/readiness" className="block">
            <div className="flex items-center gap-4 rounded-2xl p-5 shadow-sm bg-[#2A1B5E]">
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-bold tracking-widest text-white/60 mb-1">LAUNCH CONFIDENCE</p>
                <p className="text-lg font-extrabold text-white leading-snug">
                  {repoLoading ? 'Scanning your repo…'
                    : !onboarding?.githubRepo ? 'Add your GitHub repo'
                    : !repoInfo ? 'Connect repo to scan'
                    : 'Scan in app to score'}
                </p>
                <p className="text-xs text-white/70 mt-1">
                  {repoLoading ? 'Detecting your stack from package.json…'
                    : !onboarding?.githubRepo ? "We'll scan your code and surface real risks"
                    : repoError ? "Couldn't read this repo — it may be private"
                    : repoInfo?.detectedStack?.length ? `Detected: ${repoInfo.detectedStack.slice(0, 3).join(', ')} · tap to view`
                    : 'Tap to view readiness report'}
                </p>
              </div>
              <div className="w-14 h-14 rounded-full border-2 border-white/30 flex items-center justify-center bg-white/10 shrink-0">
                <Rocket size={22} className="text-white" />
              </div>
            </div>
          </a>
        </div>

        {/* GitHub Section */}
        <div className="px-4">
          <p className="text-[11px] font-bold tracking-wider text-[#8B8B8B] mb-3">GITHUB</p>

          {!onboarding?.githubRepo ? (
            <div className="bg-white rounded-2xl border-2 border-dashed border-[#E8E4DE] p-6 flex flex-col items-center text-center gap-3">
              <GitBranch size={28} className="text-[#BDBDBD]" />
              <h3 className="font-bold text-[#1A2332]">Connect your GitHub repo</h3>
              <p className="text-xs text-[#8B8B8B] leading-relaxed max-w-xs">
                Unlock repo diagnostics, health scores, and activity insights.
              </p>
              <a
                href="/onboarding"
                className="bg-[#2A1B5E] text-white font-bold px-6 py-2.5 rounded-full text-sm hover:bg-[#3D2878] transition-colors"
              >
                Add repo
              </a>
            </div>
          ) : repoLoading ? (
            <div className="bg-white rounded-2xl border border-[#E8E4DE] p-5 shadow-sm">
              <div className="animate-pulse space-y-3">
                <div className="flex gap-2">
                  <div className="h-4 bg-[#E8E4DE] rounded w-40" />
                  <div className="h-5 bg-[#E8E4DE] rounded-full w-14 ml-auto" />
                </div>
                <div className="h-3 bg-[#E8E4DE] rounded w-4/5" />
                <div className="h-3 bg-[#E8E4DE] rounded w-3/5" />
                <div className="flex gap-2 mt-2">
                  <div className="h-3 bg-[#E8E4DE] rounded w-16" />
                  <div className="h-3 bg-[#E8E4DE] rounded w-16" />
                  <div className="h-3 bg-[#E8E4DE] rounded w-16" />
                </div>
              </div>
            </div>
          ) : repoInfo ? (
            <a
              href={normalizeUrl(onboarding.githubRepo!)}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-white rounded-2xl border border-[#E8E4DE] p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <GitBranch size={15} className="text-[#2A1B5E]" />
                  <span className="font-bold text-[#1A2332] text-sm">
                    {parseGithubUrl(onboarding.githubRepo!)
                      ? `${parseGithubUrl(onboarding.githubRepo!)!.owner}/${parseGithubUrl(onboarding.githubRepo!)!.repo}`
                      : repoInfo.name}
                  </span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    repoInfo.visibility === 'public'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-[#E8E4DE] text-[#8B8B8B]'
                  }`}>{repoInfo.visibility}</span>
                </div>
                <ExternalLink size={14} className="text-[#BDBDBD] shrink-0" />
              </div>

              {repoInfo.description && (
                <p className="text-xs text-[#8B8B8B] mb-3 leading-relaxed">{repoInfo.description}</p>
              )}

              <div className="flex items-center gap-4 mb-3">
                <div className="flex items-center gap-1">
                  <Star size={13} className="text-[#8B8B8B]" />
                  <span className="text-xs font-semibold text-[#1A2332]">{repoInfo.stargazersCount.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-1">
                  <GitFork size={13} className="text-[#8B8B8B]" />
                  <span className="text-xs font-semibold text-[#1A2332]">{repoInfo.forksCount.toLocaleString()}</span>
                  <span className="text-xs text-[#8B8B8B]">forks</span>
                </div>
                <div className="flex items-center gap-1">
                  <AlertCircle size={13} className="text-[#8B8B8B]" />
                  <span className="text-xs font-semibold text-[#1A2332]">{repoInfo.openIssuesCount.toLocaleString()}</span>
                  <span className="text-xs text-[#8B8B8B]">issues</span>
                </div>
                {repoInfo.language && (
                  <span className="ml-auto text-[10px] font-bold text-[#2A1B5E] bg-[#2A1B5E]/10 px-2 py-0.5 rounded-full">
                    {repoInfo.language}
                  </span>
                )}
              </div>

              {repoInfo.detectedStack && repoInfo.detectedStack.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {repoInfo.detectedStack.slice(0, 6).map(tag => (
                    <span key={tag} className="text-[10px] font-bold text-[#2A1B5E] bg-[#2A1B5E]/10 px-2 py-0.5 rounded-full">{tag}</span>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-1.5">
                <Clock size={11} className="text-[#BDBDBD]" />
                <span className="text-[11px] text-[#BDBDBD]">
                  Last push {timeAgo(repoInfo.pushedAt)} · {repoInfo.defaultBranch}
                </span>
              </div>
            </a>
          ) : (
            <div className="bg-white rounded-2xl border border-[#E8E4DE] p-5 shadow-sm">
              <p className="text-sm text-[#8B8B8B] mb-2">
                {repoError ? "Couldn't fetch this repo — it may be private or the URL is incorrect." : 'Repo info unavailable.'}
              </p>
              <a
                href={normalizeUrl(onboarding.githubRepo!)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[#2A1B5E] font-semibold hover:underline flex items-center gap-1"
              >
                <ExternalLink size={13} /> Open on GitHub
              </a>
            </div>
          )}
        </div>

        {/* Analytics Section */}
        <div className="px-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-bold tracking-wider text-[#8B8B8B]">ANALYTICS</p>
          </div>
          <div className="bg-white rounded-2xl border border-[#E8E4DE] p-5 shadow-sm">
            <div className="grid grid-cols-3 gap-4 mb-4">
              {[
                { label: 'App opens', value: phLoading ? '…' : phStats?.opens != null ? String(phStats.opens) : '—', icon: '📱' },
                { label: 'Active users', value: phLoading ? '…' : phStats?.users != null ? String(phStats.users) : '—', icon: '👥' },
                { label: 'Retention', value: phLoading ? '…' : phStats?.retention != null ? `${phStats.retention}%` : '—', icon: '🔁' },
              ].map(stat => (
                <div key={stat.label} className="flex flex-col items-center gap-1">
                  <span className="text-lg">{stat.icon}</span>
                  <span className="text-xl font-extrabold text-[#1A2332]">{stat.value}</span>
                  <span className="text-[11px] text-[#8B8B8B]">{stat.label}</span>
                </div>
              ))}
            </div>
            {phConnected ? (
              <div className="flex items-center gap-2 bg-green-50 rounded-xl px-3 py-2">
                <CheckCircle size={14} className="text-green-600" />
                <span className="text-xs text-green-600 font-medium">Last 14 days · from PostHog</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-[#2A1B5E]/5 rounded-xl px-3 py-2">
                <BarChart3 size={14} className="text-[#2A1B5E]" />
                <span className="text-xs text-[#2A1B5E] flex-1">Connect PostHog to see live analytics</span>
                <RefreshCw size={12} className="text-[#2A1B5E]" />
              </div>
            )}
          </div>
        </div>

        {/* Tools Hub */}
        <div className="px-4">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[11px] font-bold tracking-wider text-[#8B8B8B]">TOOLS HUB</p>
            {stage && (
              <span className="text-[11px] font-bold text-[#2A1B5E] bg-[#2A1B5E]/10 px-2 py-0.5 rounded-full">
                {stage === 'idea' ? '💡 Idea'
                  : stage === 'building' ? '🔨 Building'
                  : stage === 'pre-launch' ? '🚀 Pre-launch'
                  : '✅ Live'}
              </span>
            )}
          </div>
          <p className="text-xs text-[#8B8B8B] mb-3">Curated for your stage — relevant tools shown first.</p>

          {/* Category pills */}
          <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide">
            {sortedCategories.map(cat => {
              const isActive = cat.id === displayedCategory
              const isRelevant = cat.stages.includes(stage)
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-full border-2 whitespace-nowrap shrink-0 font-semibold text-xs transition-all ${
                    isActive
                      ? 'bg-[#2A1B5E] border-[#2A1B5E] text-white'
                      : 'bg-white border-[#E8E4DE] text-[#1A2332] hover:border-[#7C5CBF]/40'
                  }`}
                >
                  <span>{cat.emoji}</span>
                  <span>{cat.label}</span>
                  {isRelevant && !isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2A1B5E]" />
                  )}
                </button>
              )
            })}
          </div>

          {/* Active category tools */}
          {activeCat && (
            <div className="bg-white rounded-2xl border border-[#E8E4DE] shadow-sm overflow-hidden">
              {activeCat.tools.map((tool, i) => (
                <a
                  key={tool.name}
                  href={tool.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-4 px-5 py-4 hover:bg-[#EDE9E3]/50 transition-colors ${
                    i < activeCat.tools.length - 1 ? 'border-b border-[#E8E4DE]' : ''
                  }`}
                >
                  <span className="text-2xl w-8 text-center">{tool.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[#1A2332] text-sm">{tool.name}</p>
                    <p className="text-xs text-[#8B8B8B] mt-0.5">{tool.desc}</p>
                  </div>
                  <ExternalLink size={14} className="text-[#BDBDBD] shrink-0" />
                </a>
              ))}
            </div>
          )}
        </div>

      </div>
    </AppShell>
  )
}
