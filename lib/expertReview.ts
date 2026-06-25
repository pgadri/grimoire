import AsyncStorage from '@react-native-async-storage/async-storage'

// ── Fixed tiers (Grimoire-set pricing) ──────────────────────────────────────
// Grimoire defines the tiers and pays vetted reviewers a flat rate per review,
// so quality and turnaround are consistent.

export type ReviewTierId = 'essential' | 'pro' | 'launch-ready'

export type ReviewTier = {
  id: ReviewTierId
  name: string
  price: number
  turnaroundDays: number
  tagline: string
  scope: string[]
  recommended?: boolean
}

export const REVIEW_TIERS: ReviewTier[] = [
  {
    id: 'essential',
    name: 'Essential',
    price: 199,
    turnaroundDays: 3,
    tagline: 'Catch the things that get vibe coders hacked',
    scope: [
      'Exposed secrets & API key scan',
      'Auth & session security review',
      'Database access (RLS / permissions) check',
      'Payment endpoint safety (if applicable)',
      'Graded report with prioritized fixes',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 499,
    turnaroundDays: 5,
    tagline: 'A full human audit of your whole codebase',
    recommended: true,
    scope: [
      'Everything in Essential',
      'Full codebase review by a security engineer',
      'Dependency & supply-chain vulnerability audit',
      'Infrastructure & deployment config review',
      'Input validation & rate-limiting assessment',
      'Detailed graded report with AI-ready fixes',
    ],
  },
  {
    id: 'launch-ready',
    name: 'Launch-Ready',
    price: 999,
    turnaroundDays: 7,
    tagline: 'Audit, test, and a re-review after you fix',
    scope: [
      'Everything in Pro',
      'Live penetration testing of deployed endpoints',
      'Terms of Service & Privacy Policy / legal review',
      'Data-handling & compliance assessment',
      'Free re-review after you apply the fixes',
      'Launch sign-off certificate',
    ],
  },
]

export function getTier(id: ReviewTierId): ReviewTier {
  const tier = REVIEW_TIERS.find(t => t.id === id)
  if (!tier) throw new Error(`Unknown review tier: ${id}`)
  return tier
}

// ── Request lifecycle ───────────────────────────────────────────────────────

export type ReviewStatus = 'submitted' | 'in_review' | 'report_ready'

export type ReviewRequest = {
  id: string
  projectName: string
  repoUrl: string
  tierId: ReviewTierId
  contactEmail: string
  notes: string
  status: ReviewStatus
  submittedAt: string
}

export const STATUS_FLOW: ReviewStatus[] = ['submitted', 'in_review', 'report_ready']

export const STATUS_LABELS: Record<ReviewStatus, string> = {
  submitted: 'Submitted',
  in_review: 'Expert reviewing',
  report_ready: 'Report ready',
}

export const STATUS_DESCRIPTIONS: Record<ReviewStatus, string> = {
  submitted: "We received your repo. A vetted reviewer is being assigned.",
  in_review: 'A security engineer is auditing your codebase right now.',
  report_ready: 'Your graded vulnerability report is ready to view.',
}

export function statusStep(status: ReviewStatus): number {
  return STATUS_FLOW.indexOf(status)
}

// ── Graded report (the deliverable) ─────────────────────────────────────────

export type FindingSeverity = 'critical' | 'high' | 'medium' | 'low'
export type ReviewCategory =
  | 'secrets'
  | 'auth'
  | 'data'
  | 'payments'
  | 'dependencies'
  | 'infrastructure'
  | 'legal'

export type Finding = {
  id: string
  title: string
  severity: FindingSeverity
  category: ReviewCategory
  location: string // file:line or area
  description: string
  impact: string
  remediation: string
  aiPrompt?: string
}

export type LetterGrade = 'A' | 'B' | 'C' | 'D' | 'F'

export type GradedReport = {
  id: string
  requestId: string
  projectName: string
  repoUrl: string
  reviewerName: string
  reviewerHandle: string
  completedAt: string
  summary: string
  findings: Finding[]
}

export const CATEGORY_LABELS: Record<ReviewCategory, string> = {
  secrets: 'Secrets',
  auth: 'Authentication',
  data: 'Data Protection',
  payments: 'Payments',
  dependencies: 'Dependencies',
  infrastructure: 'Infrastructure',
  legal: 'Legal & Compliance',
}

// Each open finding subtracts from a perfect 100, weighted by severity.
const SEVERITY_PENALTY: Record<FindingSeverity, number> = {
  critical: 30,
  high: 18,
  medium: 8,
  low: 3,
}

export const SEVERITY_RANK: Record<FindingSeverity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
}

/** Numeric score 0–100 derived from the findings and their severity. */
export function scoreFromFindings(findings: Finding[]): number {
  const penalty = findings.reduce((sum, f) => sum + SEVERITY_PENALTY[f.severity], 0)
  return Math.max(0, 100 - penalty)
}

/** Letter grade from a 0–100 score. */
export function gradeFromScore(score: number): LetterGrade {
  if (score >= 90) return 'A'
  if (score >= 80) return 'B'
  if (score >= 70) return 'C'
  if (score >= 60) return 'D'
  return 'F'
}

export function reportGrade(report: GradedReport): { score: number; grade: LetterGrade } {
  const score = scoreFromFindings(report.findings)
  return { score, grade: gradeFromScore(score) }
}

/** Counts of findings by severity, for the report summary header. */
export function countFindings(findings: Finding[]): Record<FindingSeverity, number> {
  return findings.reduce(
    (acc, f) => {
      acc[f.severity] += 1
      return acc
    },
    { critical: 0, high: 0, medium: 0, low: 0 } as Record<FindingSeverity, number>
  )
}

/** Findings sorted critical → low, then stable by id. */
export function sortFindings(findings: Finding[]): Finding[] {
  return [...findings].sort((a, b) => {
    const sev = SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]
    return sev !== 0 ? sev : a.id.localeCompare(b.id)
  })
}

// ── Persistence ─────────────────────────────────────────────────────────────

const REQUEST_KEY = 'grimoire:reviewRequest'

export async function getReviewRequest(): Promise<ReviewRequest | null> {
  try {
    const raw = await AsyncStorage.getItem(REQUEST_KEY)
    return raw ? (JSON.parse(raw) as ReviewRequest) : null
  } catch {
    return null
  }
}

export async function submitReviewRequest(
  input: Omit<ReviewRequest, 'id' | 'status' | 'submittedAt'>
): Promise<ReviewRequest> {
  const request: ReviewRequest = {
    ...input,
    id: `rev-${Date.now()}`,
    status: 'submitted',
    submittedAt: new Date().toISOString(),
  }
  await AsyncStorage.setItem(REQUEST_KEY, JSON.stringify(request))
  return request
}

export async function clearReviewRequest(): Promise<void> {
  await AsyncStorage.removeItem(REQUEST_KEY)
}

// ── Sample report ───────────────────────────────────────────────────────────
// Shown so a prospective buyer can see exactly what they get. This is the
// single most important sales asset for the service.

export const SAMPLE_REPORT: GradedReport = {
  id: 'sample-1',
  requestId: 'sample',
  projectName: 'Sample: a payments-enabled Expo app',
  repoUrl: 'github.com/example/sample-app',
  reviewerName: 'Jordan Reyes',
  reviewerHandle: '@securitypro',
  completedAt: new Date().toISOString(),
  summary:
    'The app is well-structured but ships two critical issues that must be fixed before launch: a Stripe secret key reachable from the client bundle, and a Supabase table with Row Level Security disabled. Auth and rate limiting need hardening. With the criticals fixed this moves from an F to a B.',
  findings: [
    {
      id: 'f1',
      title: 'Stripe secret key bundled into the client app',
      severity: 'critical',
      category: 'secrets',
      location: 'lib/payments.ts:12',
      description:
        'STRIPE_SECRET_KEY is imported in client-side code and ends up in the shipped bundle, where anyone can extract it.',
      impact:
        'An attacker can use your secret key to issue refunds, read customer data, and create charges. This is account-takeover level exposure.',
      remediation:
        'Move all Stripe secret-key calls to a backend route. The client should only ever see the publishable key. Rotate the leaked key immediately.',
      aiPrompt:
        'Find every use of the Stripe secret key in my client code. Move those calls into a backend endpoint that the app calls over HTTPS, so the secret key never ships in the bundle. Leave only the publishable key on the client. Show me the new backend route and the updated client call.',
    },
    {
      id: 'f2',
      title: 'Supabase "profiles" table has Row Level Security off',
      severity: 'critical',
      category: 'data',
      location: 'supabase schema · public.profiles',
      description:
        'RLS is disabled on a table containing user emails and addresses. The public anon key (shipped in the app) can read and write every row.',
      impact:
        'Your entire user table is publicly readable and writable. This is the most common cause of vibe-coded data leaks.',
      remediation:
        'Enable RLS on the table and add policies restricting rows to their owner (auth.uid() = user_id).',
      aiPrompt:
        'Enable Row Level Security on my Supabase profiles table and write policies so each user can only read and modify their own row using auth.uid() = user_id. Give me the exact SQL to run.',
    },
    {
      id: 'f3',
      title: 'Session tokens never expire',
      severity: 'high',
      category: 'auth',
      location: 'lib/auth.ts:40',
      description: 'JWTs are issued with no expiry, so a stolen token works forever.',
      impact: 'A single leaked token is a permanent account breach with no way to revoke it.',
      remediation: 'Set a short access-token expiry and add refresh tokens with server-side revocation.',
      aiPrompt:
        'Set my JWT access tokens to expire in 30 minutes and add refresh-token rotation with a server-side revocation list. Show the changes.',
    },
    {
      id: 'f4',
      title: 'No rate limiting on the /generate endpoint',
      severity: 'high',
      category: 'infrastructure',
      location: 'backend/main.py · /generate',
      description: 'An endpoint calling the OpenAI API has no rate limit.',
      impact: 'A scripted loop could run up a multi-thousand-dollar API bill overnight.',
      remediation: 'Add per-IP and per-user rate limits returning 429 when exceeded.',
      aiPrompt:
        'Add per-IP and per-user rate limiting (10 req/min) to my /generate FastAPI endpoint, returning 429 when exceeded.',
    },
    {
      id: 'f5',
      title: 'Outdated dependency with a known CVE',
      severity: 'medium',
      category: 'dependencies',
      location: 'package.json · axios@0.21.1',
      description: 'A pinned dependency has a published SSRF advisory.',
      impact: 'Known, exploitable vulnerability in a shipped dependency.',
      remediation: 'Upgrade to the patched version and run an audit on the full dependency tree.',
      aiPrompt:
        'Upgrade axios to the latest patched version, then audit my whole dependency tree for known CVEs and list anything else that needs upgrading.',
    },
    {
      id: 'f6',
      title: 'No Privacy Policy linked at signup',
      severity: 'medium',
      category: 'legal',
      location: 'app/signup.tsx',
      description: 'The app collects personal data without presenting a Privacy Policy.',
      impact: 'Potential GDPR/CCPA exposure and app-store rejection.',
      remediation: 'Generate and link a Privacy Policy and Terms at signup and in the footer.',
      aiPrompt:
        'Generate a Privacy Policy and Terms of Service for an app that collects email and payment data via Stripe, and add links to both on my signup screen.',
    },
  ],
}
