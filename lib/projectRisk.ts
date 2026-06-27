export type ProjectStage = 'idea' | 'building' | 'pre-launch' | 'live'
export type StackTag =
  | 'expo' | 'react-native' | 'react' | 'nextjs'
  | 'stripe' | 'supabase' | 'firebase'
  | 'openai' | 'fastapi' | 'node'
  | 'auth' | 'postgres'

export const STAGE_ORDER: ProjectStage[] = ['idea', 'building', 'pre-launch', 'live']

export type ProjectProfile = {
  stage: ProjectStage
  stack: StackTag[]
  handlesPayments: boolean
  storesUserData: boolean
}

export type RiskCategory = 'security' | 'legal' | 'cost' | 'data' | 'infra' | 'payments' | 'appstore'
export type RiskSeverity = 'critical' | 'high' | 'medium'

export type Risk = {
  id: string
  title: string
  category: RiskCategory
  severity: RiskSeverity
  stackAny?: StackTag[]
  requiresPayments?: boolean
  requiresUserData?: boolean
  minStage?: ProjectStage
  problem: string
  why: string
  aiPrompt: string
  source: string
}

export const RISK_DATABASE: Risk[] = [
  {
    id: 'exposed-api-keys',
    title: 'API keys exposed in your frontend',
    category: 'security',
    severity: 'critical',
    stackAny: ['expo', 'react-native', 'react', 'nextjs'],
    problem: 'AI often hardcodes API keys (OpenAI, Stripe secret, etc) directly in client code or commits .env to git. Anyone can read them.',
    why: 'Exposed keys get scraped within hours. People have woken up to thousands in charges from leaked OpenAI/AWS keys.',
    aiPrompt: 'Audit my entire codebase for any hardcoded secrets, API keys, or tokens committed in source or shipped to the client bundle. List every occurrence with file and line. Move all secrets to environment variables, add .env to .gitignore, and create a .env.example with placeholder values. For any key that must be used at runtime, move the call to a backend route so the secret never reaches the client.',
    source: '@securitypro · verified',
  },
  {
    id: 'stripe-webhook-verification',
    title: 'Stripe webhooks not signature-verified',
    category: 'security',
    severity: 'critical',
    stackAny: ['stripe'],
    requiresPayments: true,
    problem: 'Your payment-success webhook trusts whatever hits the endpoint. An attacker can POST a fake "payment succeeded" event and unlock paid features for free.',
    why: 'Without verifying the Stripe-Signature header, anyone who finds your webhook URL can fake payments.',
    aiPrompt: 'Find my Stripe webhook handler. Add signature verification using stripe.webhooks.constructEvent with the raw request body and my STRIPE_WEBHOOK_SECRET env var. Reject any request whose signature does not validate with a 400 before any business logic runs. Make sure the route receives the raw body, not parsed JSON.',
    source: '@stripepro · verified',
  },
  {
    id: 'supabase-rls-off',
    title: 'Supabase Row Level Security is off',
    category: 'security',
    severity: 'critical',
    stackAny: ['supabase'],
    requiresUserData: true,
    problem: 'By default any table without RLS enabled is readable and writable by anyone with your public anon key — which ships in your app.',
    why: 'This is the #1 way vibe-coded apps leak their entire user table. The anon key is not a secret; RLS is what protects your data.',
    aiPrompt: 'List every Supabase table in my schema and tell me which ones have Row Level Security enabled. For each table that stores user data, generate SQL to enable RLS and add policies so users can only select/update/delete their own rows (auth.uid() = user_id). Show me the exact SQL to run in the Supabase SQL editor.',
    source: '@dbsecurity · verified',
  },
  {
    id: 'ai-env-access',
    title: 'AI tools have access to your .env',
    category: 'security',
    severity: 'high',
    stackAny: ['openai', 'expo', 'react-native', 'nextjs', 'fastapi', 'node'],
    problem: 'Letting your AI agent read .env files means real secrets can end up in chat logs, prompts, or generated commits.',
    why: 'Secrets that pass through an AI session may be retained or accidentally echoed into code. Treat your AI co-founder like an untrusted contributor.',
    aiPrompt: 'Add .env and all secret files to .cursorignore (or .aiexclude) and to .gitignore. Verify no real secrets currently sit in tracked files. Create a .env.example with placeholders only. Tell me which files I should never let an AI tool read.',
    source: '@securitypro · verified',
  },
  {
    id: 'tokens-never-expire',
    title: 'Session tokens that live forever',
    category: 'security',
    severity: 'high',
    stackAny: ['auth', 'supabase', 'firebase'],
    requiresUserData: true,
    problem: 'If your JWTs or session tokens never expire, a single stolen token grants permanent access to that account.',
    why: 'Short-lived access tokens + refresh tokens limit the blast radius when a token leaks. "Forever" tokens turn one leak into a permanent breach.',
    aiPrompt: 'Review my authentication setup. Set access tokens to a short expiry (15–60 min) and implement refresh tokens for longer sessions. Ensure tokens are stored securely (httpOnly cookie on web, secure storage on mobile — not localStorage). Add a way to revoke a session server-side. Show me the changes.',
    source: '@authexpert · verified',
  },
  {
    id: 'cors-wildcard',
    title: 'CORS is open to all origins (*)',
    category: 'security',
    severity: 'high',
    stackAny: ['fastapi', 'node', 'nextjs'],
    minStage: 'building',
    problem: 'CORS set to allow_origins=["*"] means any website on the internet can make authenticated requests to your API on behalf of your users.',
    why: 'Open CORS enables cross-site request forgery. A malicious site can silently make API calls as your logged-in users.',
    aiPrompt: 'Find my CORS configuration. Replace the wildcard origin (*) with an explicit allowlist of my production domains (e.g. my-app.com, app.my-app.com). In development allow localhost variants. Return 403 for requests from unlisted origins. Show me the updated config.',
    source: '@infrahardening · verified',
  },
  {
    id: 'no-auth-admin-routes',
    title: 'Admin routes with no authentication',
    category: 'security',
    severity: 'high',
    stackAny: ['fastapi', 'node', 'nextjs'],
    minStage: 'building',
    problem: 'Routes like /admin, /api/users, or /api/metrics are accessible without any auth check. Anyone who guesses the URL has full access.',
    why: 'Unauthenticated admin endpoints are among the first things attackers probe. Your user list and private data are one URL away.',
    aiPrompt: 'Find every route or endpoint in my codebase that looks administrative (admin, users list, metrics, management, internal). Add authentication middleware to each that verifies the caller is a logged-in admin user. Return 401/403 for unauthenticated requests. Show me before/after for each route.',
    source: '@securitypro · verified',
  },
  {
    id: 'jwt-weak-secret',
    title: 'JWT signed with a weak or default secret',
    category: 'security',
    severity: 'critical',
    stackAny: ['auth', 'node', 'fastapi'],
    requiresUserData: true,
    problem: 'JWTs signed with "secret", "password", or any short string can be brute-forced in seconds. Anyone who cracks it can mint their own tokens.',
    why: 'Common default secrets are in every JWT-cracking wordlist. If your secret is weak, all user sessions are compromised.',
    aiPrompt: 'Find where I sign my JWTs. Replace the current secret with a cryptographically strong random value of at least 256 bits (32 bytes). Generate one with: openssl rand -hex 32. Store it in an environment variable (JWT_SECRET), never hardcode it. Verify the new secret is used everywhere tokens are signed and verified.',
    source: '@authexpert · verified',
  },
  {
    id: 'no-input-validation',
    title: 'No input validation on your endpoints',
    category: 'security',
    severity: 'medium',
    stackAny: ['fastapi', 'node', 'nextjs'],
    minStage: 'building',
    problem: 'Endpoints that trust raw request bodies are open to injection, oversized payloads, and malformed data crashing your server.',
    why: 'Unvalidated input is the root of injection attacks and most "it crashed in production" incidents.',
    aiPrompt: 'Add schema validation to every API endpoint that accepts a request body or query params. Use Pydantic for FastAPI, Zod for Node/Next. Reject invalid input with a 400 and a clear error. Add reasonable max lengths and type checks. Show me each endpoint before and after.',
    source: '@infrahardening · verified',
  },
  {
    id: 'no-rate-limiting',
    title: 'No rate limiting on your API',
    category: 'cost',
    severity: 'high',
    stackAny: ['fastapi', 'node', 'nextjs'],
    minStage: 'building',
    problem: 'Any endpoint that calls a paid API (OpenAI, SMS, etc) with no rate limit can be spammed in a loop.',
    why: 'This is how vibe coders get surprise $4,000 bills overnight. One script hitting your endpoint thousands of times is all it takes.',
    aiPrompt: 'Add rate limiting to my API. Identify every endpoint that triggers a paid external call or expensive operation. Add per-IP and per-user rate limits (e.g. 10 requests/minute) using a well-supported middleware for my framework. Return HTTP 429 when exceeded. Show me where each limit is applied.',
    source: '@infrahardening · verified',
  },
  {
    id: 'google-oauth-test-mode',
    title: 'Google OAuth is still in test mode',
    category: 'security',
    severity: 'critical',
    stackAny: ['auth', 'supabase', 'firebase', 'expo', 'react-native', 'nextjs'],
    requiresUserData: true,
    minStage: 'pre-launch',
    problem: 'Google OAuth is in test mode by default after you set it up. This caps you at 100 total users and shows every user a scary "This app is unverified" warning screen before they can sign in.',
    why: 'Most users will immediately abandon your app when they see the Google unverified warning. And 100 users is a hard ceiling — user 101 cannot sign in at all.',
    aiPrompt: 'I need to publish my Google OAuth app so it works for unlimited users without showing the unverified warning. Walk me through: (1) Go to Google Cloud Console → APIs & Services → OAuth consent screen, (2) Click "Publish App" to move from Testing to Production, (3) Confirm what scopes I am requesting and whether they require Google verification.',
    source: '@authexpert · verified',
  },
  {
    id: 'no-terms-privacy',
    title: 'No Terms of Service or Privacy Policy',
    category: 'legal',
    severity: 'high',
    requiresUserData: true,
    minStage: 'pre-launch',
    problem: 'You collect user data with no Terms or Privacy Policy. Most vibe coders find out this is a problem when they get a legal threat.',
    why: 'If you store any personal data you likely have legal obligations (GDPR/CCPA). No policy = exposure to fines and you cannot legally limit your liability.',
    aiPrompt: 'Generate a Terms of Service and Privacy Policy tailored to my app. Ask me: what data I collect, what third parties I use (Stripe, OpenAI, analytics), and where my users are. Produce both documents in markdown, plus a checklist of where to link them (signup flow, footer, app store listing).',
    source: '@startuplawyer · verified',
  },
  {
    id: 'gdpr-no-deletion',
    title: 'No account/data deletion mechanism',
    category: 'legal',
    severity: 'high',
    requiresUserData: true,
    minStage: 'pre-launch',
    problem: 'GDPR Article 17 gives EU users the right to have their data deleted. If you have no deletion mechanism, you are non-compliant the moment a European user signs up.',
    why: 'A single GDPR complaint can result in a fine of up to 4% of annual turnover. Apple also requires a way to delete accounts in App Store apps.',
    aiPrompt: 'Add an account deletion flow to my app. The user should be able to: (1) request deletion from within the app settings, (2) receive a confirmation email, (3) have all their personal data purged from the database within 30 days. Show me the UI, the API endpoint, and the database cleanup query.',
    source: '@startuplawyer · verified',
  },
  {
    id: 'cookie-consent',
    title: 'No cookie consent for analytics tracking',
    category: 'legal',
    severity: 'medium',
    minStage: 'pre-launch',
    problem: 'If you use any analytics, pixel tracking, or cookies and your app is accessible to EU users, you need explicit consent before any tracking fires.',
    why: 'GDPR and ePrivacy Directive require informed consent before non-essential cookies. Fines have been issued to small apps.',
    aiPrompt: 'Add a cookie consent banner to my app that fires before any analytics tracking. It should: offer Accept/Decline options, not fire analytics scripts until accepted, store the consent decision, and link to my Privacy Policy.',
    source: '@startuplawyer · verified',
  },
  {
    id: 'coppa-no-age-gate',
    title: 'No age verification if minors could use your app',
    category: 'legal',
    severity: 'high',
    requiresUserData: true,
    minStage: 'pre-launch',
    problem: 'COPPA (US) prohibits collecting data from children under 13 without verifiable parental consent.',
    why: 'FTC has issued fines of $5M+ to apps that violated COPPA.',
    aiPrompt: 'Add an age verification step to my signup flow that prevents users under 13 from creating accounts. Add an age check field before account creation. Update my Privacy Policy to include a COPPA section.',
    source: '@startuplawyer · verified',
  },
  {
    id: 'missing-refund-policy',
    title: 'No refund or cancellation policy',
    category: 'legal',
    severity: 'medium',
    requiresPayments: true,
    minStage: 'pre-launch',
    problem: 'Selling a product with no stated refund policy creates legal exposure in most countries and makes every chargeback a surprise.',
    why: 'EU law grants a 14-day cooling-off period for digital purchases. Without a stated policy, you have no protection when disputes arise.',
    aiPrompt: 'Generate a Refund and Cancellation Policy for my app. Include: digital product refund window, subscription cancellation terms, how to request a refund, and processing time.',
    source: '@startuplawyer · verified',
  },
  {
    id: 'app-store-privacy-labels',
    title: 'App Store privacy labels not filled out',
    category: 'legal',
    severity: 'high',
    stackAny: ['expo', 'react-native'],
    minStage: 'pre-launch',
    problem: 'Apple and Google require you to declare exactly what data your app collects in your store listing.',
    why: 'Apple has rejected apps for inaccurate privacy labels.',
    aiPrompt: 'Audit my app for every category of data it collects: identifiers, usage data, contact info, location, and diagnostics. For each category, tell me how to accurately declare it in App Store Connect and Google Play Console.',
    source: '@appstoreexpert · verified',
  },
  {
    id: 'no-error-monitoring',
    title: 'No error monitoring in production',
    category: 'infra',
    severity: 'high',
    minStage: 'pre-launch',
    problem: 'When your app crashes in production, you find out from user complaints — if you find out at all.',
    why: 'Without Sentry or similar, you are flying blind after launch. Silent errors erode retention and trust.',
    aiPrompt: 'Add Sentry to my project for error monitoring. Install the correct SDK for my platform. Initialize it with my DSN, capture unhandled exceptions, and set the environment to "production" on deploy.',
    source: '@infrahardening · verified',
  },
  {
    id: 'no-db-backups',
    title: 'No database backups configured',
    category: 'infra',
    severity: 'high',
    stackAny: ['postgres', 'supabase', 'firebase'],
    minStage: 'pre-launch',
    requiresUserData: true,
    problem: 'If your database gets corrupted, deleted, or hit by a bad migration, there is no way to recover user data.',
    why: 'A single bad migration or accidental delete can wipe everything.',
    aiPrompt: 'Help me set up automated backups for my database. Tell me what my provider offers, how to enable it, and how to test a restore.',
    source: '@dbsecurity · verified',
  },
  {
    id: 'no-health-endpoint',
    title: 'No health check endpoint',
    category: 'infra',
    severity: 'medium',
    stackAny: ['fastapi', 'node', 'nextjs'],
    minStage: 'pre-launch',
    problem: 'Without a /health or /ping endpoint, uptime monitors and deployment platforms cannot verify your service is running.',
    why: 'Railway, Fly.io, and AWS all use health checks to route traffic.',
    aiPrompt: 'Add a GET /health endpoint to my API that returns { "status": "ok", "timestamp": "<now>" } with HTTP 200.',
    source: '@infrahardening · verified',
  },
  {
    id: 'no-staging-env',
    title: 'No staging environment — deploying straight to production',
    category: 'infra',
    severity: 'medium',
    minStage: 'pre-launch',
    problem: 'Every change goes directly to production with no testing environment.',
    why: 'A 10-minute outage on launch day can permanently damage trust.',
    aiPrompt: 'Help me set up a staging environment that mirrors my production stack.',
    source: '@infrahardening · verified',
  },
  {
    id: 'missing-env-docs',
    title: 'No .env.example — impossible to onboard new developers',
    category: 'infra',
    severity: 'medium',
    minStage: 'building',
    problem: 'There is no .env.example or documented list of required environment variables.',
    why: 'Missing env vars cause confusing runtime errors that take hours to debug.',
    aiPrompt: 'Scan my codebase for every place an environment variable is accessed. Create a .env.example file listing every required variable with a placeholder value and a one-line comment.',
    source: '@infrahardening · verified',
  },
  {
    id: 'unthrottled-ai-costs',
    title: 'No spend cap on AI API usage',
    category: 'cost',
    severity: 'high',
    stackAny: ['openai'],
    problem: 'Your app calls OpenAI with no usage limits or spend caps. A bot, a viral moment, or a bug loop can run up thousands of dollars in minutes.',
    why: 'There are documented cases of developers waking up to $10,000+ AI API bills from a single incident.',
    aiPrompt: 'Help me add cost protection to my AI API usage: (1) Set a monthly spend cap in my OpenAI/Anthropic account dashboard. (2) Add per-user request limits in my code. (3) Add a server-side check before each AI call that verifies the user hasn\'t exceeded their quota.',
    source: '@infrahardening · verified',
  },
  {
    id: 'no-idempotency-keys',
    title: 'Payment creation without idempotency keys',
    category: 'payments',
    severity: 'high',
    stackAny: ['stripe'],
    requiresPayments: true,
    minStage: 'building',
    problem: 'If a payment API call is retried, you can create duplicate charges for the same order.',
    why: 'Double charges generate chargebacks and destroy trust.',
    aiPrompt: 'Find every place I create a Stripe PaymentIntent, charge, or subscription. Add an idempotency key to each call.',
    source: '@stripepro · verified',
  },
  {
    id: 'missing-refund-flow',
    title: 'No in-app refund mechanism',
    category: 'payments',
    severity: 'medium',
    requiresPayments: true,
    minStage: 'pre-launch',
    problem: 'Every refund requires you to manually process it through the Stripe dashboard.',
    why: 'When you have 100+ customers, manual refunds take hours.',
    aiPrompt: 'Add a refund request flow to my app. Users should be able to find a past payment and click "Request refund".',
    source: '@stripepro · verified',
  },
  {
    id: 'no-payment-failure-handling',
    title: 'Payment failures show a generic error',
    category: 'payments',
    severity: 'medium',
    requiresPayments: true,
    minStage: 'building',
    problem: 'When a payment fails, users see a generic error and have no idea what to do next.',
    why: 'Poor payment failure UX causes ~20% of users to abandon instead of retrying.',
    aiPrompt: 'Improve my payment failure handling. For each Stripe error code show a specific user-friendly message. Add a "try another card" button.',
    source: '@stripepro · verified',
  },
  {
    id: 'subscription-cancel-missing',
    title: 'No in-app subscription cancellation',
    category: 'payments',
    severity: 'high',
    requiresPayments: true,
    stackAny: ['expo', 'react-native'],
    minStage: 'pre-launch',
    problem: 'Apple requires that users can cancel subscriptions from within the app.',
    why: 'This is a common App Store rejection reason for subscription apps.',
    aiPrompt: 'Add a subscription management screen that shows the current plan, billing date, and a Cancel Subscription button.',
    source: '@appstoreexpert · verified',
  },
  {
    id: 'missing-privacy-manifest',
    title: 'Missing iOS privacy manifest (PrivacyInfo.xcprivacy)',
    category: 'appstore',
    severity: 'critical',
    stackAny: ['expo', 'react-native'],
    minStage: 'pre-launch',
    problem: 'Apple requires a PrivacyInfo.xcprivacy file for any app using APIs that access device data.',
    why: 'Apps without the privacy manifest are rejected at App Store review.',
    aiPrompt: 'Add the required iOS privacy manifest to my Expo project. Create a PrivacyInfo.xcprivacy file declaring all required API usage reasons.',
    source: '@appstoreexpert · verified',
  },
  {
    id: 'missing-permission-descriptions',
    title: 'Missing permission usage descriptions for iOS',
    category: 'appstore',
    severity: 'high',
    stackAny: ['expo', 'react-native'],
    minStage: 'pre-launch',
    problem: 'Every iOS permission requires a human-readable description of WHY you need it.',
    why: 'Apple rejects apps that request permissions without descriptions.',
    aiPrompt: 'Check my app.json for missing iOS permission descriptions. For every permission my app requests, add a clear user-facing description.',
    source: '@appstoreexpert · verified',
  },
  {
    id: 'expo-sdk-outdated',
    title: 'Running an outdated Expo SDK',
    category: 'appstore',
    severity: 'medium',
    stackAny: ['expo'],
    minStage: 'building',
    problem: 'Your app is running on an Expo SDK version more than one major version behind.',
    why: 'Old Expo SDKs stop receiving updates and can block App Store submissions.',
    aiPrompt: 'Check my current Expo SDK version in package.json. If not latest stable, show me the step-by-step upgrade path.',
    source: '@appstoreexpert · verified',
  },
  {
    id: 'no-crash-reporting',
    title: 'No crash reporting for production builds',
    category: 'appstore',
    severity: 'high',
    stackAny: ['expo', 'react-native'],
    minStage: 'pre-launch',
    problem: 'When your app crashes on a user\'s device, you have no record of it.',
    why: 'Most users who experience a crash just uninstall.',
    aiPrompt: 'Add Sentry crash reporting to my Expo/React Native app. Install @sentry/react-native, initialize it, and enable native crash reporting.',
    source: '@appstoreexpert · verified',
  },
  {
    id: 'ota-updates-unsafe',
    title: 'OTA updates deployed without a staging channel',
    category: 'appstore',
    severity: 'medium',
    stackAny: ['expo'],
    minStage: 'pre-launch',
    problem: 'Expo OTA updates go directly to all production users. A bad update can break the app for every user simultaneously.',
    why: 'Unlike App Store updates, OTA updates have no review process.',
    aiPrompt: 'Set up Expo update channels so I can test OTA updates before they reach production users.',
    source: '@appstoreexpert · verified',
  },
]

export type MatchedRisk = Risk & { resolved: boolean }

const SEVERITY_RANK: Record<RiskSeverity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
}

function stageMet(profileStage: ProjectStage, minStage?: ProjectStage): boolean {
  if (!minStage) return true
  return STAGE_ORDER.indexOf(profileStage) >= STAGE_ORDER.indexOf(minStage)
}

function riskApplies(risk: Risk, profile: ProjectProfile): boolean {
  if (risk.requiresPayments && !profile.handlesPayments) return false
  if (risk.requiresUserData && !profile.storesUserData) return false
  if (!stageMet(profile.stage, risk.minStage)) return false
  if (risk.stackAny && risk.stackAny.length > 0) {
    const hit = risk.stackAny.some(tag => profile.stack.includes(tag))
    if (!hit) return false
  }
  return true
}

export function matchRisks(
  profile: ProjectProfile,
  resolvedIds: string[] = []
): MatchedRisk[] {
  const resolved = new Set(resolvedIds)
  return RISK_DATABASE.filter(risk => riskApplies(risk, profile))
    .map(risk => ({ ...risk, resolved: resolved.has(risk.id) }))
    .sort((a, b) => {
      if (a.resolved !== b.resolved) return a.resolved ? 1 : -1
      const sev = SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]
      if (sev !== 0) return sev
      return a.id.localeCompare(b.id)
    })
}

const SEVERITY_WEIGHT: Record<RiskSeverity, number> = {
  critical: 5,
  high: 3,
  medium: 1,
}

export function readinessScore(profile: ProjectProfile, resolvedIds: string[] = []): number {
  const applicable = matchRisks(profile, resolvedIds)
  if (applicable.length === 0) return 100
  const totalWeight = applicable.reduce((sum, r) => sum + SEVERITY_WEIGHT[r.severity], 0)
  const resolvedWeight = applicable
    .filter(r => r.resolved)
    .reduce((sum, r) => sum + SEVERITY_WEIGHT[r.severity], 0)
  return Math.round((resolvedWeight / totalWeight) * 100)
}

export function countBySeverity(risks: MatchedRisk[]): Record<RiskSeverity, number> {
  return risks.reduce(
    (acc, r) => {
      if (!r.resolved) acc[r.severity] += 1
      return acc
    },
    { critical: 0, high: 0, medium: 0 } as Record<RiskSeverity, number>
  )
}

export const CATEGORY_LABELS: Record<RiskCategory, string> = {
  security: 'Security',
  legal: 'Legal',
  cost: 'Cost',
  data: 'Data',
  infra: 'Infrastructure',
  payments: 'Payments',
  appstore: 'App Store',
}
