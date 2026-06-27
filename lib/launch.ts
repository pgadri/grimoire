import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Notifications from 'expo-notifications'
import type { StackTag } from './project'

const LAUNCH_KEY = 'grimoire:launchDate'

export type LaunchMilestone = {
  id: string
  emoji: string
  title: string
  detail: string
  doneByDays: number    // complete this many days BEFORE launch
  stackAny?: StackTag[] // only show if user has at least one of these stack tags
  riskId?: string       // links to a risk in projectRisk — completing = fixing that risk
}

export type LaunchPhase = {
  id: string
  label: string
  color: string
  minDaysOut: number
  maxDaysOut: number
  milestones: LaunchMilestone[]
}

export const LAUNCH_PHASES: LaunchPhase[] = [
  {
    id: 'foundation',
    label: 'Foundation',
    color: '#7C6AF7',
    minDaysOut: 60,
    maxDaysOut: 999,
    milestones: [
      // Generic
      { id: 'landing',    emoji: '🌐', title: 'Launch landing page',         detail: 'One clear headline, waitlist form, and your value prop. Carrd or Framer work great.',               doneByDays: 90 },
      { id: 'waitlist',   emoji: '📋', title: 'Set up a waitlist',           detail: 'Beehiiv or Mailchimp. Every early subscriber is social proof.',                                       doneByDays: 75 },
      { id: 'socials',    emoji: '📱', title: 'Create social accounts',      detail: 'X/Twitter and LinkedIn at minimum. Secure your handle now.',                                          doneByDays: 80 },
      { id: 'icp',        emoji: '🎯', title: 'Define your ICP',             detail: 'Who is the one person this is built for? Write it in one sentence.',                                  doneByDays: 70 },
      { id: 'community',  emoji: '👥', title: 'Join builder communities',    detail: 'Indie Hackers, r/SideProject, Build in Public on X. Start participating now.',                       doneByDays: 65 },
      // Stack-specific
      { id: 'env-secrets',  emoji: '🔐', title: 'Move secrets to .env',             detail: 'API keys and secrets must never live in source code. Add .env to .gitignore and create a .env.example.', doneByDays: 85, stackAny: ['openai', 'stripe', 'fastapi', 'node', 'nextjs'], riskId: 'exposed-api-keys' },
      { id: 'rls-setup',    emoji: '🛡️', title: 'Enable Row Level Security',         detail: 'RLS is OFF by default on every Supabase table. Enable it now, before any user data exists.',          doneByDays: 82, stackAny: ['supabase'],                                        riskId: 'supabase-rls-off' },
      { id: 'stripe-setup', emoji: '💳', title: 'Create Stripe test account',        detail: 'Set up your Stripe project, products, and prices in test mode. Wire up the test API key to your backend.',doneByDays: 80, stackAny: ['stripe'] },
      { id: 'jwt-secret',   emoji: '🔑', title: 'Generate a strong JWT secret',      detail: 'Run: openssl rand -hex 32. Store in env var. Never hardcode it.',                                       doneByDays: 78, stackAny: ['auth', 'node', 'fastapi'],                         riskId: 'jwt-weak-secret' },
      { id: 'cors-setup',   emoji: '🌐', title: 'Lock CORS to your domains',          detail: 'Replace allow_origins=["*"] with your explicit domain list. Wildcard CORS enables CSRF attacks.',        doneByDays: 76, stackAny: ['fastapi', 'node', 'nextjs'],                     riskId: 'cors-wildcard' },
      { id: 'firebase-rules',emoji: '🔥',title: 'Write Firebase security rules',      detail: 'By default Firebase is wide open. Write rules that restrict reads/writes to authenticated owners only.',  doneByDays: 80, stackAny: ['firebase'] },
    ],
  },
  {
    id: 'audience',
    label: 'Audience',
    color: '#F59E0B',
    minDaysOut: 30,
    maxDaysOut: 60,
    milestones: [
      // Generic
      { id: 'build-in-public', emoji: '🔊', title: 'Start building in public',       detail: 'Post weekly updates. Show your progress, failures, and learnings. Be real.',                 doneByDays: 55 },
      { id: 'beta',            emoji: '🧪', title: 'Recruit 10 beta testers',         detail: 'Message people in your ICP directly. Offer free lifetime access.',                           doneByDays: 45 },
      { id: 'ph-coming-soon',  emoji: '🚀', title: 'Product Hunt Coming Soon',        detail: 'Set up your PH page now. Collect followers before launch day.',                              doneByDays: 40 },
      { id: 'analytics',       emoji: '📊', title: 'Set up analytics',                detail: 'PostHog or Plausible. Know who visits and where they drop off.',                              doneByDays: 50 },
      { id: 'demo-video',      emoji: '🎬', title: 'Record a demo video',             detail: '60-90 seconds showing the core workflow. No fluff.',                                         doneByDays: 35 },
      // Stack-specific
      { id: 'testflight',       emoji: '📱', title: 'Distribute beta via TestFlight',  detail: 'Build with EAS and send to TestFlight. Real device testing catches bugs the simulator misses.',doneByDays: 50, stackAny: ['expo', 'react-native'] },
      { id: 'payment-e2e',      emoji: '💳', title: 'Test full payment flow',          detail: 'Run through: checkout → webhook → feature unlock in test mode. Do it on a real device.',    doneByDays: 48, stackAny: ['stripe'] },
      { id: 'rate-limiting',    emoji: '🚦', title: 'Add rate limiting to AI calls',   detail: 'Per-user limits on endpoints that call OpenAI. One spamming user can run up a big bill.',  doneByDays: 45, stackAny: ['openai'],  riskId: 'no-rate-limiting' },
      { id: 'auth-tokens',      emoji: '⏱️', title: 'Set JWT / session expiry',        detail: 'Access tokens ≤60 min, refresh tokens ≤30 days. Tokens that never expire = permanent breach if leaked.', doneByDays: 52, stackAny: ['auth', 'supabase', 'firebase'], riskId: 'tokens-never-expire' },
      { id: 'aws-iam',          emoji: '☁️',  title: 'Apply least-privilege IAM roles', detail: 'Each service should only have the AWS permissions it actually needs. Audit and tighten now.', doneByDays: 48, stackAny: ['aws'] },
    ],
  },
  {
    id: 'momentum',
    label: 'Momentum',
    color: '#10B981',
    minDaysOut: 14,
    maxDaysOut: 30,
    milestones: [
      // Generic
      { id: 'beta-feedback',  emoji: '💬', title: 'Collect beta feedback',     detail: 'Survey your testers. Ask what\'s missing, not what\'s wrong.',                               doneByDays: 28 },
      { id: 'testimonials',   emoji: '⭐', title: 'Capture testimonials',       detail: 'Even one or two quotes from real users changes conversions dramatically.',                   doneByDays: 25 },
      { id: 'press',          emoji: '📰', title: 'Write press outreach emails',detail: 'Target indie-focused blogs: TechCrunch, Indie Hackers newsletter, niche substacks.',       doneByDays: 21 },
      { id: 'pricing',        emoji: '💰', title: 'Finalize pricing',            detail: 'Charge from day one. Set a launch discount (ends in 48h).',                               doneByDays: 20 },
      { id: 'support',        emoji: '🎧', title: 'Set up customer support',    detail: 'An email alias or Crisp chat. People need to reach you day one.',                         doneByDays: 16 },
      // Stack-specific
      { id: 'webhook-sig',    emoji: '🔒', title: 'Verify Stripe webhook signatures',     detail: 'Without signature verification, anyone can POST fake payment events to your endpoint.',  doneByDays: 27, stackAny: ['stripe'],                                        riskId: 'stripe-webhook-verification' },
      { id: 'google-oauth',   emoji: '🔑', title: 'Publish Google OAuth app',            detail: 'OAuth in test mode caps you at 100 users and shows a scary "unverified" warning to everyone.',doneByDays: 25, stackAny: ['auth', 'supabase', 'firebase', 'expo', 'react-native'], riskId: 'google-oauth-test-mode' },
      { id: 'input-valid',    emoji: '✅', title: 'Add input validation to all endpoints',detail: 'Schema-validate every request body. Reject malformed input with 400. Prevents injection + crashes.',doneByDays: 22, stackAny: ['fastapi', 'node', 'nextjs'],             riskId: 'no-input-validation' },
      { id: 'openai-limits',  emoji: '💸', title: 'Set OpenAI spend limits',            detail: 'Set a hard monthly limit in your OpenAI dashboard. Without it, one abuse incident = a huge bill.',doneByDays: 24, stackAny: ['openai'] },
      { id: 'crash-monitoring',emoji: '🛡️',title: 'Add crash monitoring (Sentry)',       detail: 'Wire up Sentry before launch. You need to know about crashes before your users tell you.',    doneByDays: 20, stackAny: ['expo', 'react-native', 'nextjs', 'node', 'fastapi'] },
    ],
  },
  {
    id: 'sprint',
    label: 'Final Sprint',
    color: '#EF4444',
    minDaysOut: 7,
    maxDaysOut: 14,
    milestones: [
      // Generic
      { id: 'schedule-posts', emoji: '📅', title: 'Schedule launch posts',          detail: 'Draft and queue posts for X, LinkedIn, Reddit. Launch day = no time to write.',       doneByDays: 13 },
      { id: 'ph-page',        emoji: '🎪', title: 'Finalize Product Hunt page',     detail: 'Write your tagline, description, and first comment. Have assets ready.',              doneByDays: 12 },
      { id: 'network',        emoji: '📬', title: 'Brief your personal network',    detail: 'Message 20 people personally. Ask them to upvote/share on launch day.',              doneByDays: 10 },
      { id: 'onboarding',     emoji: '🛤️', title: 'Optimize onboarding flow',       detail: 'Time yourself going through it fresh. Every extra step costs you users.',           doneByDays: 9 },
      { id: 'bugs',           emoji: '🐛', title: 'Fix critical bugs only',         detail: 'No new features. Ship with known minor bugs rather than delay.',                     doneByDays: 8 },
      // Stack-specific
      { id: 'appstore-submit', emoji: '🍎', title: 'Submit to App Store for review',  detail: 'App Store review takes 1–3 days. Submit at least a week out — rejections add another day.',   doneByDays: 12, stackAny: ['expo', 'react-native'] },
      { id: 'stripe-live',     emoji: '💳', title: 'Switch Stripe to live mode',      detail: 'Swap test keys for live keys. Double-check webhook endpoints point to production, not localhost.',doneByDays: 10, stackAny: ['stripe'] },
      { id: 'admin-auth',      emoji: '🔒', title: 'Audit all admin/internal routes', detail: 'Every /admin, /internal, /api/users route must require authentication. Try hitting them unauthenticated.', doneByDays: 11, stackAny: ['fastapi', 'node', 'nextjs'], riskId: 'no-auth-admin-routes' },
      { id: 'supabase-prod',   emoji: '🐘', title: 'Verify RLS in production schema', detail: 'Run SELECT * on your most sensitive tables from the anon role. You should get zero rows.', doneByDays: 9, stackAny: ['supabase'] },
      { id: 'openai-prod-key', emoji: '🔑', title: 'Rotate OpenAI key for production',detail: 'Create a new API key for production with a spending limit. Revoke any dev keys with production access.',doneByDays: 10, stackAny: ['openai'] },
    ],
  },
  {
    id: 'launch-week',
    label: 'Launch Week',
    color: '#F43F5E',
    minDaysOut: 0,
    maxDaysOut: 7,
    milestones: [
      // Generic
      { id: 'pre-launch-post', emoji: '⏳', title: 'Pre-launch post',         detail: '"Launching in X days" — build anticipation. Share the backstory.',              doneByDays: 6 },
      { id: 'dms',             emoji: '✉️', title: 'Personal DMs to targets',  detail: 'Not a mass blast — personal messages to 10 ideal users.',                       doneByDays: 4 },
      { id: 'press-outreach',  emoji: '📡', title: 'Send press emails',        detail: 'Journalists need a few days lead time. Send 48h before launch.',               doneByDays: 2 },
      { id: 'test-flows',      emoji: '✅', title: 'Test every critical flow',  detail: 'Sign up → core action → payment. Do it on a real device.',                    doneByDays: 1 },
      // Stack-specific
      { id: 'monitor-crashes', emoji: '🛡️', title: 'Watch crash reports live',         detail: 'Keep Sentry open on launch day. Crash spikes in the first hour tell you exactly what to fix.',doneByDays: 0, stackAny: ['expo', 'react-native', 'nextjs', 'node', 'fastapi'] },
      { id: 'monitor-payments',emoji: '💳', title: 'Monitor payment success rate',      detail: 'Watch Stripe dashboard live. <90% success rate means something broke. Common: webhook misconfigured.',doneByDays: 0, stackAny: ['stripe'] },
      { id: 'monitor-openai',  emoji: '💸', title: 'Watch OpenAI usage costs live',     detail: 'Launch traffic spikes can hit your OpenAI budget fast. Keep the usage page open.',        doneByDays: 1, stackAny: ['openai'] },
      { id: 'monitor-supabase',emoji: '🐘', title: 'Check Supabase logs for auth errors',detail: 'RLS misconfiguration and JWT issues usually surface in the first 100 signups.',          doneByDays: 0, stackAny: ['supabase'] },
    ],
  },
]

// Filter milestones to only those relevant for the given stack.
// Generic milestones (no stackAny) always show. Stack milestones are prioritized first.
export function filterMilestones(milestones: LaunchMilestone[], stack: StackTag[]): LaunchMilestone[] {
  if (stack.length === 0) return milestones.filter(m => !m.stackAny)
  const specific = milestones.filter(m => m.stackAny && m.stackAny.some(t => stack.includes(t)))
  const generic  = milestones.filter(m => !m.stackAny)
  return [...specific, ...generic]
}

export function getCurrentPhase(daysLeft: number): LaunchPhase {
  return LAUNCH_PHASES.find(p => daysLeft >= p.minDaysOut) ?? LAUNCH_PHASES[LAUNCH_PHASES.length - 1]
}

export function getDaysLeft(launchDate: string): number {
  const launch = new Date(launchDate)
  launch.setHours(0, 0, 0, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.ceil((launch.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

export function formatCountdown(daysLeft: number): string {
  if (daysLeft < 0) return 'Launched!'
  if (daysLeft === 0) return 'Launch day! 🚀'
  if (daysLeft === 1) return '1 day left'
  if (daysLeft < 7) return `${daysLeft} days left`
  const weeks = Math.floor(daysLeft / 7)
  const days  = daysLeft % 7
  if (days === 0) return `${weeks} week${weeks !== 1 ? 's' : ''} left`
  return `${weeks}w ${days}d left`
}

// ─── Storage ──────────────────────────────────────────────────────────────────

export async function getLaunchDate(): Promise<string | null> {
  return AsyncStorage.getItem(LAUNCH_KEY)
}

export async function saveLaunchDate(isoDate: string): Promise<void> {
  await AsyncStorage.setItem(LAUNCH_KEY, isoDate)
  await scheduleLaunchReminders(isoDate)
}

export async function clearLaunchDate(): Promise<void> {
  await AsyncStorage.removeItem(LAUNCH_KEY)
  await Notifications.cancelAllScheduledNotificationsAsync()
}

// ─── Weekly digest ────────────────────────────────────────────────────────────

const WEEKLY_DIGEST_KEY = 'grimoire:weeklyDigestScheduled'

export async function scheduleWeeklyDigest(): Promise<void> {
  try {
    const already = await AsyncStorage.getItem(WEEKLY_DIGEST_KEY)
    if (already) return

    const { status } = await Notifications.getPermissionsAsync()
    if (status !== 'granted') return

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Weekly wrap-up ✦',
        body: 'What did you figure out this week? Capture it before you forget — other builders will thank you.',
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: 1,
        hour: 18,
        minute: 0,
      },
    })

    await AsyncStorage.setItem(WEEKLY_DIGEST_KEY, 'true')
  } catch {}
}

// ─── Notifications ────────────────────────────────────────────────────────────

export async function scheduleLaunchReminders(isoDate: string): Promise<void> {
  try {
    const { status } = await Notifications.getPermissionsAsync()
    if (status !== 'granted') return

    await Notifications.cancelAllScheduledNotificationsAsync()

    const launch = new Date(isoDate)
    const now = new Date()

    const schedule = async (daysBeforeLaunch: number, title: string, body: string) => {
      const date = new Date(launch)
      date.setDate(date.getDate() - daysBeforeLaunch)
      date.setHours(9, 0, 0, 0)
      if (date <= now) return
      await Notifications.scheduleNotificationAsync({
        content: { title, body, sound: true },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date },
      })
    }

    await schedule(60, '60 days to launch 🏗️', 'Foundation phase: nail your landing page, secure your social handles, and get your waitlist up.')
    await schedule(30, '30 days to launch 📣', 'Audience phase: recruit 10 beta testers, post your first build-in-public update, and set up analytics.')
    await schedule(14, '2 weeks to launch 🔥', 'Momentum phase: collect 1–2 testimonials, finalize pricing, and draft press outreach emails.')
    await schedule(7,  '1 week to launch ⚡', 'Final sprint: submit to App Store, schedule launch posts, and brief your personal network to upvote.')
    await schedule(2,  '2 days to launch 🚀', 'Almost there! Send press emails, test every flow on a real device, and switch Stripe to live mode.')
    await schedule(0,  '🚀 Launch day!', 'Ship it. Post everywhere, watch Sentry for crashes, and respond to every comment today.')
  } catch {}
}
