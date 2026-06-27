import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking,
  RefreshControl, Animated,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useState, useCallback, useEffect, useRef } from 'react'
import { useFocusEffect } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Colors, Spacing, Radius, Shadow, Typography } from '../../constants/theme'
import { matchRisks, readinessScore } from '../../lib/projectRisk'
import type { ProjectProfile, ProjectStage } from '../../lib/project'
import { saveProjectProfile } from '../../lib/project'
import { getLaunchDate, getDaysLeft, formatCountdown, getCurrentPhase, LAUNCH_PHASES, filterMilestones } from '../../lib/launch'
import { saveScanResult, getLastScanDate, shouldAutoRescan, timeSinceScan } from '../../lib/scanHistory'
import { getActivePlan } from '../../lib/purchases'

// ─── Onboarding data ─────────────────────────────────────────────────────────

type OnboardingData = {
  developerType: 'vibe_coder' | 'experienced_dev' | null
  workStyle: 'solo' | 'team' | null
  projectName: string
  projectStage: ProjectStage
  aiPlatforms: string[]
  githubRepo?: string
}

const ONBOARDING_KEY = 'grimoire:onboarding'
const POSTHOG_KEY    = 'grimoire:posthog'

// ─── PostHog ──────────────────────────────────────────────────────────────────

type PostHogCreds = { apiKey: string; projectId: string; region: 'us' | 'eu' }
type PostHogStats = { opens: number | null; users: number | null; retention: number | null }

async function fetchPostHogStats(creds: PostHogCreds): Promise<PostHogStats> {
  const host = creds.region === 'eu' ? 'https://eu.posthog.com' : 'https://app.posthog.com'
  const headers = { Authorization: `Bearer ${creds.apiKey}`, 'Content-Type': 'application/json' }
  try {
    const res = await fetch(`${host}/api/projects/${creds.projectId}/query/`, {
      method: 'POST', headers,
      body: JSON.stringify({
        query: {
          kind: 'HogQLQuery',
          query: `SELECT
            count() as opens,
            uniq(distinct_id) as users,
            uniqIf(distinct_id, toStartOfWeek(timestamp) = toStartOfWeek(today() - INTERVAL 7 DAY)) as prev_users,
            uniqIf(distinct_id, toStartOfWeek(timestamp) = toStartOfWeek(today())) as curr_users
            FROM events
            WHERE timestamp >= now() - INTERVAL 14 DAY`,
        },
      }),
    })
    if (!res.ok) return { opens: null, users: null, retention: null }
    const json = await res.json()
    const row: number[] = json?.results?.[0] ?? []
    const opens   = row[0] ?? null
    const users   = row[1] ?? null
    const prev    = row[2] ?? 0
    const curr    = row[3] ?? 0
    const retention = prev > 0 ? Math.round((curr / prev) * 100) : null
    return { opens, users, retention }
  } catch {
    return { opens: null, users: null, retention: null }
  }
}

// ─── GitHub (proxied through backend to use GITHUB_TOKEN — 5000 req/hr) ──────

const REPO_INFO_BASE = 'https://reel-capture-production.up.railway.app'

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
  detectedStack?: import('../../lib/project').StackTag[]
  storesUserData?: boolean
  handlesPayments?: boolean
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
    const res = await fetch(`${REPO_INFO_BASE}/repo-info?repo_url=${encoded}`)
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`
  return `${Math.floor(diff / 2592000)}mo ago`
}

// ─── Tools catalog ───────────────────────────────────────────────────────────

type Tool = { name: string; emoji: string; desc: string; url: string }

const TOOL_CATEGORIES: {
  id: string
  label: string
  emoji: string
  stages: ProjectStage[]
  tools: Tool[]
}[] = [
  {
    id: 'build',
    label: 'Build with AI',
    emoji: '⚡',
    stages: ['idea', 'building'],
    tools: [
      { name: 'Bolt.new',     emoji: '⚡', desc: 'Prompt-to-fullstack app',        url: 'https://bolt.new' },
      { name: 'Lovable',      emoji: '💜', desc: 'AI full-stack app builder',      url: 'https://lovable.dev' },
      { name: 'v0',           emoji: '▲',  desc: 'Generate UI with text',          url: 'https://v0.dev' },
      { name: 'Cursor',       emoji: '🖱️', desc: 'AI code editor',                 url: 'https://cursor.sh' },
      { name: 'Windsurf',     emoji: '🏄', desc: 'Agentic AI editor',              url: 'https://codeium.com/windsurf' },
      { name: 'Claude Code',  emoji: '✦',  desc: 'AI coding in your terminal',     url: 'https://claude.ai/code' },
    ],
  },
  {
    id: 'design',
    label: 'Design',
    emoji: '🎨',
    stages: ['idea', 'building'],
    tools: [
      { name: 'Figma',         emoji: '🎨', desc: 'Design & prototype UI',         url: 'https://figma.com' },
      { name: 'Framer',        emoji: '📐', desc: 'AI-powered website builder',     url: 'https://framer.com' },
      { name: 'Higgsfield AI', emoji: '🎬', desc: 'AI video creation',             url: 'https://higgsfield.ai' },
    ],
  },
  {
    id: 'deploy',
    label: 'Deploy & Host',
    emoji: '🚀',
    stages: ['building', 'pre-launch', 'launched'],
    tools: [
      { name: 'Railway',  emoji: '🚂', desc: 'Deploy backends in seconds',   url: 'https://railway.app' },
      { name: 'Vercel',   emoji: '▲',  desc: 'Frontend & Next.js platform',  url: 'https://vercel.com' },
      { name: 'Render',   emoji: '🌐', desc: 'Full-stack web services',       url: 'https://render.com' },
      { name: 'Fly.io',   emoji: '🪰', desc: 'Deploy globally fast',          url: 'https://fly.io' },
    ],
  },
  {
    id: 'backend',
    label: 'Backend & DB',
    emoji: '🗄️',
    stages: ['building', 'pre-launch'],
    tools: [
      { name: 'Supabase',    emoji: '⚡', desc: 'Open source Firebase alt',    url: 'https://supabase.com' },
      { name: 'Neon',        emoji: '🐘', desc: 'Serverless Postgres',          url: 'https://neon.tech' },
      { name: 'Firebase',    emoji: '🔥', desc: "Google's BaaS platform",       url: 'https://firebase.google.com' },
      { name: 'PlanetScale', emoji: '🪐', desc: 'Serverless MySQL',             url: 'https://planetscale.com' },
    ],
  },
  {
    id: 'payments',
    label: 'Payments',
    emoji: '💳',
    stages: ['pre-launch', 'launched'],
    tools: [
      { name: 'Stripe',        emoji: '💳', desc: 'Payments infrastructure',      url: 'https://stripe.com' },
      { name: 'RevenueCat',    emoji: '📱', desc: 'Mobile subscriptions',         url: 'https://revenuecat.com' },
      { name: 'Braintree',     emoji: '🌳', desc: 'PayPal\'s full-stack payments', url: 'https://braintreepayments.com' },
      { name: 'Lemon Squeezy', emoji: '🍋', desc: 'Merchant of record (EU)',      url: 'https://lemonsqueezy.com' },
      { name: 'Paddle',        emoji: '🏓', desc: 'SaaS billing & taxes',         url: 'https://paddle.com' },
    ],
  },
  {
    id: 'auth',
    label: 'Auth',
    emoji: '🔐',
    stages: ['building', 'pre-launch'],
    tools: [
      { name: 'Clerk',    emoji: '🔐', desc: 'Drop-in auth & user mgmt',  url: 'https://clerk.com' },
      { name: 'Auth0',    emoji: '🛡️', desc: 'Enterprise auth platform',   url: 'https://auth0.com' },
      { name: 'Supabase', emoji: '⚡', desc: 'Built-in auth with your DB', url: 'https://supabase.com/auth' },
    ],
  },
  {
    id: 'analytics',
    label: 'Analytics',
    emoji: '📊',
    stages: ['pre-launch', 'launched'],
    tools: [
      { name: 'PostHog',   emoji: '🦔', desc: 'Open source product analytics', url: 'https://posthog.com' },
      { name: 'Plausible', emoji: '📈', desc: 'Simple, privacy-first analytics', url: 'https://plausible.io' },
      { name: 'Mixpanel',  emoji: '📊', desc: 'Event analytics & funnels',       url: 'https://mixpanel.com' },
      { name: 'Sentry',    emoji: '🛡️', desc: 'Error monitoring & alerting',    url: 'https://sentry.io' },
    ],
  },
  {
    id: 'email',
    label: 'Email',
    emoji: '📧',
    stages: ['building', 'pre-launch', 'launched'],
    tools: [
      { name: 'Resend',   emoji: '📧', desc: 'Transactional email for devs',  url: 'https://resend.com' },
      { name: 'Loops',    emoji: '🔁', desc: 'Product email platform',         url: 'https://loops.so' },
      { name: 'Beehiiv',  emoji: '🐝', desc: 'Newsletter platform',            url: 'https://beehiiv.com' },
    ],
  },
  {
    id: 'marketing',
    label: 'Marketing & Launch',
    emoji: '📣',
    stages: ['pre-launch', 'launched'],
    tools: [
      { name: 'Product Hunt',   emoji: '🦁', desc: 'Launch to 500K+ tech users', url: 'https://producthunt.com' },
      { name: 'Indie Hackers',  emoji: '👥', desc: 'Community for builders',      url: 'https://indiehackers.com' },
      { name: 'Perplexity',     emoji: '🔍', desc: 'AI-powered research & SEO',   url: 'https://perplexity.ai' },
    ],
  },
]

// ─── Screen ──────────────────────────────────────────────────────────────────

const RESOLVED_KEY = 'grimoire:resolvedRisks'

export default function RepoScreen() {
  const router = useRouter()
  const [onboarding, setOnboarding] = useState<OnboardingData | null>(null)
  const [repoInfo, setRepoInfo] = useState<RepoInfo | null>(null)
  const [repoLoading, setRepoLoading] = useState(false)
  const [repoError, setRepoError] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [profile, setProfile] = useState<ProjectProfile | null>(null)
  const [openRisks, setOpenRisks] = useState(0)
  const [score, setScore] = useState(100)
  const [hasOnboarding, setHasOnboarding] = useState<boolean | null>(null)
  const [phCreds, setPhCreds]             = useState<PostHogCreds | null>(null)
  const [phStats, setPhStats]             = useState<PostHogStats | null>(null)
  const [phLoading, setPhLoading]         = useState(false)
  const [launchDate, setLaunchDate]       = useState<string | null>(null)
  const [lastScanDate, setLastScanDate]   = useState<string | null>(null)
  const [topRisks, setTopRisks]           = useState<import('../../lib/projectRisk').MatchedRisk[]>([])

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true)
    const [raw, resolvedRaw, phRaw, launchRaw, lastScan, plan] = await Promise.all([
      AsyncStorage.getItem(ONBOARDING_KEY),
      AsyncStorage.getItem(RESOLVED_KEY),
      AsyncStorage.getItem(POSTHOG_KEY),
      getLaunchDate(),
      getLastScanDate(),
      getActivePlan(),
    ])
    setLaunchDate(launchRaw)
    setLastScanDate(lastScan)

    // Auto-rescan when stale (paid plans only, not on manual refresh to avoid loop)
    if (!refresh && shouldAutoRescan(lastScan, plan)) {
      // Will re-enter load with refresh=true, which fetches fresh repo info
      // Only trigger if there's a repo to scan
      const od = raw ? JSON.parse(raw) : null
      if (od?.githubRepo) {
        setTimeout(() => load(true), 500)
        return
      }
    }

    if (phRaw) {
      const creds: PostHogCreds = JSON.parse(phRaw)
      setPhCreds(creds)
      setPhLoading(true)
      fetchPostHogStats(creds).then(stats => { setPhStats(stats); setPhLoading(false) })
    } else {
      setPhCreds(null)
      setPhStats(null)
    }

    setHasOnboarding(!!raw)
    if (!raw) {
      if (refresh) setRefreshing(false)
      return
    }
    const data: OnboardingData = JSON.parse(raw)
    setOnboarding(data)

    if (data.githubRepo) {
      setRepoLoading(true)
      setRepoError(false)
      const info = await fetchRepoInfo(data.githubRepo)
      setRepoInfo(info)
      setRepoLoading(false)
      if (!info) {
        setRepoError(true)
        setProfile(null)
      } else if (info.detectedStack && info.detectedStack.length > 0) {
        const derived: ProjectProfile = {
          name: data.projectName || info.name,
          stage: data.projectStage,
          stack: info.detectedStack,
          storesUserData: info.storesUserData ?? false,
          handlesPayments: info.handlesPayments ?? false,
          updatedAt: new Date().toISOString(),
        }
        setProfile(derived)
        saveProjectProfile({ name: derived.name, stage: derived.stage, stack: derived.stack, storesUserData: derived.storesUserData, handlesPayments: derived.handlesPayments }).catch(() => {})
        const resolved: string[] = resolvedRaw ? JSON.parse(resolvedRaw) : []
        const risks = matchRisks(derived, resolved)
        const openCount = risks.filter(r => !r.resolved).length
        const sc = readinessScore(derived, resolved)
        // Alert if new risks appeared since last scan (paid plan auto-rescan only)
        if (refresh && lastScanDate) {
          const prev = await AsyncStorage.getItem('grimoire:lastScanRisks').catch(() => null)
          const prevCount = prev ? parseInt(prev, 10) : 0
          if (openCount > prevCount) {
            const { Alert: RNAlert } = await import('react-native')
            RNAlert.alert(
              '⚠️ New risks detected',
              `${openCount - prevCount} new issue${openCount - prevCount !== 1 ? 's' : ''} found in your repo. Tap to review.`,
              [{ text: 'Review now', onPress: () => router.push('/readiness' as any) }, { text: 'Later' }],
            )
          }
        }
        await AsyncStorage.setItem('grimoire:lastScanRisks', String(openCount)).catch(() => {})
        setOpenRisks(openCount)
        setScore(sc)
        setTopRisks(risks.filter(r => !r.resolved).slice(0, 2))
        saveScanResult(sc, openCount).then(() => setLastScanDate(new Date().toISOString())).catch(() => {})
      } else {
        setProfile(null)
      }
    } else {
      // No repo connected — clear any stale risk data
      setProfile(null)
      setOpenRisks(0)
      setScore(100)
    }
    if (refresh) setRefreshing(false)
  }, [])

  useFocusEffect(useCallback(() => { load() }, [load]))

  const stage = onboarding?.projectStage ?? 'building'

  // Prioritize categories relevant to current stage
  const sortedCategories = [...TOOL_CATEGORIES].sort((a, b) => {
    const aRelevant = a.stages.includes(stage) ? 0 : 1
    const bRelevant = b.stages.includes(stage) ? 0 : 1
    return aRelevant - bRelevant
  })

  const displayedCategory = activeCategory ?? sortedCategories[0]?.id
  const activeCat = sortedCategories.find(c => c.id === displayedCategory) ?? sortedCategories[0]

  // Show empty state for brand-new users who haven't onboarded
  if (hasOnboarding === false) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateEmoji}>🚀</Text>
          <Text style={styles.emptyStateTitle}>Set up your project</Text>
          <Text style={styles.emptyStateSub}>
            Tell us about what you're building so we can personalize your tools, diagnostics, and launch checklist.
          </Text>
          <TouchableOpacity
            style={styles.emptyStateBtn}
            onPress={() => router.push('/onboarding')}
            activeOpacity={0.88}
          >
            <Text style={styles.emptyStateBtnText}>Get started</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={Colors.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.screenTitle}>Repo</Text>
            {onboarding?.projectName ? (
              <Text style={styles.screenSub}>{onboarding.projectName}</Text>
            ) : null}
          </View>
          <TouchableOpacity
            style={styles.settingsBtn}
            onPress={() => router.push('/onboarding')}
          >
            <Ionicons name="settings-outline" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Launch Runway */}
        {(() => {
          if (!launchDate) {
            return (
              <TouchableOpacity
                style={styles.launchRunwayEmpty}
                onPress={() => router.push('/launch-date' as any)}
                activeOpacity={0.85}
              >
                <View style={styles.launchRunwayEmptyLeft}>
                  <Text style={styles.launchRunwayEmptyTitle}>Set your launch date</Text>
                  <Text style={styles.launchRunwayEmptySub}>Get a countdown + milestone reminders</Text>
                </View>
                <Ionicons name="rocket-outline" size={22} color={Colors.primary} />
              </TouchableOpacity>
            )
          }
          const daysLeft = getDaysLeft(launchDate)
          const phase    = getCurrentPhase(daysLeft)
          const done     = daysLeft <= 0
          const filtered = filterMilestones(phase.milestones, profile?.stack ?? [])
          const todos    = filtered.slice(0, 3)
          return (
            <View style={[styles.launchRunway, { borderLeftColor: phase.color }]}>
              <TouchableOpacity
                style={styles.launchRunwayHeader}
                onPress={() => router.push('/launch-date' as any)}
                activeOpacity={0.8}
              >
                <View>
                  <Text style={styles.launchRunwayLabel}>LAUNCH RUNWAY</Text>
                  <Text style={[styles.launchRunwayCountdown, { color: done ? Colors.success : phase.color }]}>
                    {done ? '🚀 Launched!' : formatCountdown(daysLeft)}
                  </Text>
                  {!done && (
                    <Text style={styles.launchRunwayPhase}>
                      Phase: <Text style={{ color: phase.color, fontWeight: '700' }}>{phase.label}</Text>
                    </Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
              </TouchableOpacity>
              {!done && (
                <View style={styles.launchRunwayMilestones}>
                  {todos.map(m => (
                    <View key={m.id} style={styles.launchRunwayMilestone}>
                      <Text style={styles.launchRunwayMilestoneEmoji}>{m.emoji}</Text>
                      <View style={styles.launchRunwayMilestoneText}>
                        <Text style={styles.launchRunwayMilestoneTitle}>{m.title}</Text>
                        <Text style={styles.launchRunwayMilestoneDetail} numberOfLines={1}>{m.detail}</Text>
                      </View>
                    </View>
                  ))}
                  {filtered.length > 3 && (
                    <TouchableOpacity onPress={() => router.push('/launch-date' as any)}>
                      <Text style={[styles.launchRunwayMore, { color: phase.color }]}>
                        +{filtered.length - 3} more milestones →
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          )
        })()}

        {/* Launch confidence card */}
        <TouchableOpacity
          style={[styles.launchCard, openRisks > 0 ? styles.launchCardRisk : styles.launchCardGood]}
          onPress={() => router.push('/readiness' as any)}
          activeOpacity={0.9}
        >
          <View style={styles.launchCardLeft}>
            <Text style={styles.launchCardLabel}>LAUNCH CONFIDENCE</Text>
            <Text style={styles.launchCardTitle}>
              {repoLoading
                ? 'Scanning your repo…'
                : !onboarding?.githubRepo
                ? 'Add your GitHub repo'
                : !profile
                ? 'Connect repo to scan'
                : openRisks > 0
                ? `${openRisks} risk${openRisks !== 1 ? 's' : ''} found`
                : 'Looks good ✓'}
            </Text>
            <Text style={styles.launchCardSub}>
              {repoLoading
                ? 'Detecting your stack from package.json…'
                : !onboarding?.githubRepo
                ? 'We\'ll scan your code and surface real risks'
                : !profile
                ? 'Private repo? We can\'t read private code'
                : `Scanned ${profile.stack.slice(0, 3).join(', ')} · tap to fix`}
            </Text>
          </View>
          <View style={[styles.launchScoreCircle, {
            borderColor: !profile ? '#ffffff60'
              : score >= 80 ? Colors.success
              : score >= 50 ? Colors.gold
              : Colors.error,
          }]}>
            <Text style={[styles.launchScoreNum, {
              color: !profile ? '#fff'
                : score >= 80 ? Colors.success
                : score >= 50 ? Colors.gold
                : Colors.error,
            }]}>{profile ? score : '?'}</Text>
          </View>
        </TouchableOpacity>

        {/* Top risks preview — only when scan found issues */}
        {topRisks.length > 0 && (
          <View style={styles.topRisksCard}>
            <View style={styles.topRisksHeader}>
              <Text style={styles.topRisksLabel}>FIX THESE FIRST</Text>
              {lastScanDate && (
                <Text style={styles.lastScanText}>Scanned {timeSinceScan(lastScanDate)}</Text>
              )}
            </View>
            {topRisks.map(risk => (
              <TouchableOpacity
                key={risk.id}
                style={styles.topRiskRow}
                onPress={() => router.push('/readiness' as any)}
                activeOpacity={0.8}
              >
                <View style={[styles.topRiskSeverityDot, {
                  backgroundColor: risk.severity === 'critical' ? Colors.error : risk.severity === 'high' ? Colors.gold : Colors.accent,
                }]} />
                <Text style={styles.topRiskTitle} numberOfLines={1}>{risk.title}</Text>
                <Text style={styles.topRiskFix}>Fix →</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={() => router.push('/readiness' as any)}>
              <Text style={styles.topRisksAll}>See all risks & AI fix prompts →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Last scan line when no risks */}
        {topRisks.length === 0 && lastScanDate && profile && (
          <View style={styles.lastScanRow}>
            <Ionicons name="checkmark-circle-outline" size={13} color={Colors.success} />
            <Text style={styles.lastScanRowText}>Last scanned {timeSinceScan(lastScanDate)} · no open risks</Text>
          </View>
        )}

        {/* GitHub section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>GITHUB</Text>

          {!onboarding?.githubRepo ? (
            <View style={styles.connectCard}>
              <Ionicons name="git-branch-outline" size={28} color={Colors.textTertiary} />
              <Text style={styles.connectTitle}>Connect your GitHub repo</Text>
              <Text style={styles.connectSub}>
                Unlock repo diagnostics, health scores, and activity insights.
              </Text>
              <TouchableOpacity
                style={styles.connectBtn}
                onPress={() => router.push('/github-repo' as any)}
              >
                <Text style={styles.connectBtnText}>Add repo</Text>
              </TouchableOpacity>
            </View>
          ) : repoLoading ? (
            <RepoSkeleton />
          ) : repoInfo ? (
            <RepoCard info={repoInfo} url={onboarding.githubRepo!} />
          ) : (
            <View style={styles.repoErrorCard}>
              <Ionicons name="warning-outline" size={20} color={Colors.textTertiary} />
              <Text style={styles.repoErrorText}>
                {repoError
                  ? "Couldn't fetch this repo — it may be private or the URL is incorrect."
                  : "Repo info unavailable."}
              </Text>
              <TouchableOpacity onPress={() => Linking.openURL(normalizeUrl(onboarding.githubRepo!))}>
                <Text style={styles.repoOpenLink}>Open on GitHub ↗</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Analytics */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionLabel}>ANALYTICS</Text>
            {phCreds && (
              <TouchableOpacity onPress={() => router.push('/posthog-connect' as any)}>
                <Text style={styles.sectionAction}>PostHog ✦</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.analyticsCard}>
            <View style={styles.analyticsRow}>
              <AnalyticsStat
                label="App opens"
                value={phLoading ? '…' : phStats?.opens != null ? String(phStats.opens) : '—'}
                icon="phone-portrait-outline"
              />
              <AnalyticsStat
                label="Active users"
                value={phLoading ? '…' : phStats?.users != null ? String(phStats.users) : '—'}
                icon="people-outline"
              />
              <AnalyticsStat
                label="Retention"
                value={phLoading ? '…' : phStats?.retention != null ? `${phStats.retention}%` : '—'}
                icon="repeat-outline"
              />
            </View>
            {phCreds ? (
              <View style={styles.analyticsBanner}>
                <Ionicons name="checkmark-circle-outline" size={14} color={Colors.success} />
                <Text style={[styles.analyticsBannerText, { color: Colors.success }]}>
                  Last 14 days · from PostHog
                </Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.analyticsBanner}
                onPress={() => router.push('/posthog-connect' as any)}
                activeOpacity={0.8}
              >
                <Ionicons name="bar-chart-outline" size={14} color={Colors.primary} />
                <Text style={styles.analyticsBannerText}>
                  Tap to connect PostHog and see live analytics
                </Text>
                <Ionicons name="chevron-forward" size={13} color={Colors.primary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Tools hub */}
        <View style={styles.section}>
          <View style={styles.toolsHeader}>
            <Text style={styles.sectionLabel}>TOOLS HUB</Text>
            {stage && (
              <View style={styles.stagePill}>
                <Text style={styles.stagePillText}>
                  {stage === 'idea' ? '💡 Idea'
                    : stage === 'building' ? '🔨 Building'
                    : stage === 'pre-launch' ? '🚀 Pre-launch'
                    : '✅ Live'}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.toolsDesc}>
            Curated for your stage — relevant tools shown first.
          </Text>

          {/* Category pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.catPills}
          >
            {sortedCategories.map(cat => {
              const isActive = cat.id === displayedCategory
              const isRelevant = cat.stages.includes(stage)
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.catPill, isActive && styles.catPillActive]}
                  onPress={() => setActiveCategory(cat.id)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.catPillEmoji}>{cat.emoji}</Text>
                  <Text style={[styles.catPillText, isActive && styles.catPillTextActive]}>
                    {cat.label}
                  </Text>
                  {isRelevant && !isActive && <View style={styles.catDot} />}
                </TouchableOpacity>
              )
            })}
          </ScrollView>

          {/* Active category tools */}
          {activeCat && (
            <View style={styles.toolList}>
              {activeCat.tools.map(tool => (
                <TouchableOpacity
                  key={tool.name}
                  style={styles.toolRow}
                  onPress={() => Linking.openURL(tool.url)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.toolEmoji}>{tool.emoji}</Text>
                  <View style={styles.toolText}>
                    <Text style={styles.toolName}>{tool.name}</Text>
                    <Text style={styles.toolDesc}>{tool.desc}</Text>
                  </View>
                  <Ionicons name="open-outline" size={14} color={Colors.textTertiary} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

// ─── RepoCard ────────────────────────────────────────────────────────────────

function RepoCard({ info, url }: { info: RepoInfo; url: string }) {
  const parsed = parseGithubUrl(url)
  const displayName = parsed ? `${parsed.owner}/${parsed.repo}` : info.name

  return (
    <TouchableOpacity
      style={styles.repoCard}
      onPress={() => Linking.openURL(normalizeUrl(url))}
      activeOpacity={0.92}
    >
      <View style={styles.repoCardTop}>
        <View style={styles.repoNameRow}>
          <Ionicons name="git-branch" size={15} color={Colors.primary} />
          <Text style={styles.repoName}>{displayName}</Text>
          <View style={[styles.visibilityBadge, info.visibility === 'private' && styles.visibilityBadgePrivate]}>
            <Text style={styles.visibilityText}>{info.visibility}</Text>
          </View>
        </View>
        <Ionicons name="open-outline" size={14} color={Colors.textTertiary} />
      </View>

      {info.description ? (
        <Text style={styles.repoDesc}>{info.description}</Text>
      ) : null}

      <View style={styles.repoStats}>
        <RepoStat icon="star-outline" value={info.stargazersCount} />
        <RepoStat icon="git-network-outline" value={info.forksCount} label="forks" />
        <RepoStat icon="alert-circle-outline" value={info.openIssuesCount} label="issues" />
        {info.language ? (
          <View style={styles.langChip}>
            <Text style={styles.langText}>{info.language}</Text>
          </View>
        ) : null}
      </View>

      {info.detectedStack && info.detectedStack.length > 0 ? (
        <View style={styles.stackRow}>
          <Ionicons name="layers-outline" size={12} color={Colors.primary} />
          {info.detectedStack.slice(0, 5).map(tag => (
            <View key={tag} style={styles.stackChip}>
              <Text style={styles.stackChipText}>{tag}</Text>
            </View>
          ))}
        </View>
      ) : info.visibility === 'public' ? (
        <Text style={styles.stackHint}>No package.json found</Text>
      ) : (
        <Text style={styles.stackHint}>Private repo — stack not scanned</Text>
      )}

      <View style={styles.repoFooter}>
        <Ionicons name="time-outline" size={12} color={Colors.textTertiary} />
        <Text style={styles.repoFooterText}>
          Last push {timeAgo(info.pushedAt)} · {info.defaultBranch}
        </Text>
      </View>
    </TouchableOpacity>
  )
}

function RepoStat({
  icon, value, label,
}: {
  icon: string; value: number; label?: string
}) {
  return (
    <View style={styles.repoStatItem}>
      <Ionicons name={icon as any} size={13} color={Colors.textSecondary} />
      <Text style={styles.repoStatValue}>{value.toLocaleString()}</Text>
      {label ? <Text style={styles.repoStatLabel}>{label}</Text> : null}
    </View>
  )
}

function AnalyticsStat({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <View style={styles.analyticsStat}>
      <Ionicons name={icon as any} size={18} color={Colors.textTertiary} />
      <Text style={styles.analyticsValue}>{value}</Text>
      <Text style={styles.analyticsLabel}>{label}</Text>
    </View>
  )
}

function RepoSkeleton() {
  const anim = useRef(new Animated.Value(0)).current
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    ).start()
  }, [])
  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.9] })
  return (
    <Animated.View style={[styles.skeletonCard, { opacity }]}>
      <View style={styles.skeletonRow}>
        <View style={[styles.skeletonBar, { width: 140, height: 14 }]} />
        <View style={[styles.skeletonBar, { width: 48, height: 20, borderRadius: 10 }]} />
      </View>
      <View style={[styles.skeletonBar, { width: '85%', height: 11, marginTop: 10 }]} />
      <View style={[styles.skeletonBar, { width: '60%', height: 11, marginTop: 6 }]} />
      <View style={[styles.skeletonRow, { marginTop: 14 }]}>
        <View style={[styles.skeletonBar, { width: 52, height: 11 }]} />
        <View style={[styles.skeletonBar, { width: 52, height: 11 }]} />
        <View style={[styles.skeletonBar, { width: 52, height: 11 }]} />
        <View style={[styles.skeletonBar, { width: 52, height: 20, borderRadius: 10 }]} />
      </View>
    </Animated.View>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.lg, paddingBottom: 48 },

  // New user empty state
  emptyState: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: Spacing.xl, gap: Spacing.md,
  },
  emptyStateEmoji: { fontSize: 56, marginBottom: Spacing.sm },
  emptyStateTitle: { fontSize: 22, fontWeight: '800', color: Colors.text, textAlign: 'center' },
  emptyStateSub: {
    fontSize: 15, color: Colors.textSecondary, textAlign: 'center',
    lineHeight: 22, paddingHorizontal: Spacing.md,
  },
  emptyStateBtn: {
    backgroundColor: Colors.primary, borderRadius: Radius.full,
    paddingHorizontal: Spacing.xxl, paddingVertical: 14, marginTop: Spacing.sm,
  },
  emptyStateBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },

  // Launch confidence card
  launchCard: {
    flexDirection: 'row', alignItems: 'center',
    marginBottom: Spacing.lg,
    backgroundColor: Colors.primary, borderRadius: Radius.xl,
    padding: Spacing.lg, ...Shadow.card,
  },
  launchCardRisk: { backgroundColor: Colors.primary },
  launchCardGood: { backgroundColor: '#1A4D2E' },
  launchCardLeft: { flex: 1 },
  launchCardLabel: { fontSize: 9, fontWeight: '700', color: 'rgba(255,255,255,0.6)', letterSpacing: 1.2, marginBottom: 4 },
  launchCardTitle: { fontSize: 17, fontWeight: '800', color: '#fff', marginBottom: 3 },
  launchCardSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: '500' },
  launchScoreCircle: {
    width: 56, height: 56, borderRadius: 28, borderWidth: 3, borderColor: '#ffffff60',
    alignItems: 'center', justifyContent: 'center', marginLeft: Spacing.md,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  launchScoreNum: { fontSize: 20, fontWeight: '800', color: '#fff' },

  // Skeleton
  skeletonCard: {
    backgroundColor: Colors.card, borderRadius: Radius.xl,
    padding: Spacing.lg, ...Shadow.card,
  },
  skeletonRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  skeletonBar: {
    height: 12, borderRadius: 6, backgroundColor: Colors.border, flex: undefined,
  },

  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: Spacing.lg,
  },
  screenTitle: { fontSize: 28, fontWeight: '800', color: Colors.text },
  screenSub: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  settingsBtn: {
    width: 38, height: 38, borderRadius: Radius.full,
    backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center',
    ...Shadow.card,
  },

  section: { marginBottom: Spacing.xl },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: Colors.textSecondary,
    letterSpacing: 0.8, marginBottom: Spacing.sm,
  },
  sectionAction: { fontSize: 11, fontWeight: '700', color: Colors.primary, letterSpacing: 0.5 },

  // GitHub not connected
  connectCard: {
    backgroundColor: Colors.card, borderRadius: Radius.xl,
    padding: Spacing.xl, alignItems: 'center', gap: Spacing.sm,
    borderWidth: 1.5, borderColor: Colors.border, borderStyle: 'dashed',
  },
  connectTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  connectSub: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', lineHeight: 18 },
  connectBtn: {
    backgroundColor: Colors.primary, borderRadius: Radius.full,
    paddingHorizontal: Spacing.xl, paddingVertical: 10, marginTop: Spacing.sm,
  },
  connectBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },

  repoErrorCard: {
    backgroundColor: Colors.card, borderRadius: Radius.xl,
    padding: Spacing.lg, gap: Spacing.sm, ...Shadow.card,
  },
  repoErrorText: { fontSize: 13, color: Colors.textSecondary },
  repoOpenLink: { fontSize: 13, color: Colors.primary, fontWeight: '600' },

  // Repo card
  repoCard: {
    backgroundColor: Colors.card, borderRadius: Radius.xl,
    padding: Spacing.lg, ...Shadow.card,
    borderWidth: 1, borderColor: Colors.border,
  },
  repoCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  repoNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  repoName: { fontSize: 15, fontWeight: '700', color: Colors.text },
  visibilityBadge: {
    backgroundColor: Colors.success + '20', borderRadius: Radius.full,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  visibilityBadgePrivate: { backgroundColor: Colors.textTertiary + '20' },
  visibilityText: { fontSize: 10, fontWeight: '600', color: Colors.textSecondary },
  repoDesc: { fontSize: 13, color: Colors.textSecondary, marginBottom: Spacing.sm, lineHeight: 18 },
  repoStats: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.sm },
  repoStatItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  repoStatValue: { fontSize: 13, fontWeight: '600', color: Colors.text },
  repoStatLabel: { fontSize: 11, color: Colors.textSecondary },
  langChip: {
    backgroundColor: Colors.primary + '18', borderRadius: Radius.full,
    paddingHorizontal: 8, paddingVertical: 2, marginLeft: 'auto',
  },
  langText: { fontSize: 11, fontWeight: '600', color: Colors.primary },
  stackRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginTop: Spacing.sm },
  stackChip: {
    paddingHorizontal: 8, paddingVertical: 3,
    backgroundColor: Colors.primary + '12', borderRadius: Radius.full,
  },
  stackChipText: { fontSize: 10, fontWeight: '700', color: Colors.primary },
  stackHint: { fontSize: 11, color: Colors.textTertiary, marginTop: Spacing.sm, fontStyle: 'italic' },
  repoFooter: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: Spacing.sm },
  repoFooterText: { fontSize: 11, color: Colors.textTertiary },

  // Analytics
  analyticsCard: {
    backgroundColor: Colors.card, borderRadius: Radius.xl,
    padding: Spacing.lg, ...Shadow.card,
  },
  analyticsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: Spacing.md },
  analyticsStat: { alignItems: 'center', gap: 4 },
  analyticsValue: { fontSize: 20, fontWeight: '800', color: Colors.text },
  analyticsLabel: { fontSize: 11, color: Colors.textSecondary },
  analyticsBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.primary + '0D', borderRadius: Radius.md, padding: Spacing.sm,
  },
  analyticsBannerText: { fontSize: 12, color: Colors.primary, flex: 1 },

  // Tools hub
  toolsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  toolsDesc: { fontSize: 12, color: Colors.textSecondary, marginBottom: Spacing.md },
  stagePill: {
    backgroundColor: Colors.primary + '15', borderRadius: Radius.full,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  stagePillText: { fontSize: 11, fontWeight: '700', color: Colors.primary },

  catPills: { gap: Spacing.sm, paddingBottom: Spacing.md },
  catPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor: Colors.card, borderRadius: Radius.full,
    borderWidth: 1.5, borderColor: Colors.border, ...Shadow.card,
  },
  catPillActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  catPillEmoji: { fontSize: 14 },
  catPillText: { fontSize: 13, fontWeight: '600', color: Colors.text },
  catPillTextActive: { color: '#fff' },
  catDot: {
    width: 5, height: 5, borderRadius: 3,
    backgroundColor: Colors.primary, marginLeft: 2,
  },

  toolList: {
    backgroundColor: Colors.card, borderRadius: Radius.xl,
    overflow: 'hidden', ...Shadow.card,
  },
  toolRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  toolEmoji: { fontSize: 22, width: 30, textAlign: 'center' },
  toolText: { flex: 1 },
  toolName: { fontSize: 15, fontWeight: '700', color: Colors.text },
  toolDesc: { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },

  // Launch Runway
  launchRunwayEmpty: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.primary + '10', borderRadius: Radius.lg,
    padding: Spacing.lg, marginBottom: Spacing.lg,
    borderWidth: 1.5, borderColor: Colors.primary + '30', borderStyle: 'dashed',
  },
  launchRunwayEmptyLeft: { gap: 3 },
  launchRunwayEmptyTitle: { fontSize: 15, fontWeight: '700', color: Colors.primary },
  launchRunwayEmptySub: { fontSize: 12, color: Colors.textSecondary },
  launchRunway: {
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    marginBottom: Spacing.lg, borderLeftWidth: 4, ...Shadow.card, overflow: 'hidden',
  },
  launchRunwayHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: Spacing.lg,
  },
  launchRunwayLabel: { fontSize: 10, fontWeight: '700', color: Colors.textTertiary, letterSpacing: 1, marginBottom: 4 },
  launchRunwayCountdown: { fontSize: 26, fontWeight: '900', letterSpacing: -0.5 },
  launchRunwayPhase: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  launchRunwayMilestones: {
    borderTopWidth: 1, borderTopColor: Colors.border,
    paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.lg, gap: Spacing.md,
  },
  launchRunwayMilestone: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  launchRunwayMilestoneEmoji: { fontSize: 18, width: 24, textAlign: 'center', marginTop: 1 },
  launchRunwayMilestoneText: { flex: 1 },
  launchRunwayMilestoneTitle: { fontSize: 13, fontWeight: '700', color: Colors.text },
  launchRunwayMilestoneDetail: { fontSize: 11, color: Colors.textSecondary, lineHeight: 16, marginTop: 1 },
  launchRunwayMore: { fontSize: 12, fontWeight: '700', marginTop: 4 },

  // Top risks inline preview
  topRisksCard: {
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    padding: Spacing.md, marginBottom: Spacing.lg, ...Shadow.card,
    borderLeftWidth: 3, borderLeftColor: Colors.error,
  },
  topRisksHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm,
  },
  topRisksLabel: { fontSize: 10, fontWeight: '700', color: Colors.error, letterSpacing: 0.8 },
  lastScanText: { fontSize: 10, color: Colors.textTertiary },
  topRiskRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 8, borderTopWidth: 1, borderTopColor: Colors.border,
  },
  topRiskSeverityDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  topRiskTitle: { flex: 1, fontSize: 13, fontWeight: '600', color: Colors.text },
  topRiskFix: { fontSize: 12, fontWeight: '700', color: Colors.primary },
  topRisksAll: { fontSize: 12, fontWeight: '700', color: Colors.primary, marginTop: Spacing.sm, textAlign: 'center' },

  // Last scan clean state
  lastScanRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginBottom: Spacing.md, paddingHorizontal: 4,
  },
  lastScanRowText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' },
})
