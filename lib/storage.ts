import type { Capture, GrimoireUser, Milestone, Thread, OnboardingData } from './types'

function d(daysAgo: number): string {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const SEED_CAPTURES: Capture[] = [
  { id: 'seed-revenuecat-setup', title: 'How to integrate RevenueCat for iOS subscriptions in React Native', sourceUrl: 'https://www.revenuecat.com/docs/getting-started/installation/reactnative', sourceType: 'video', creator: '@revenuecat', platform: 'RevenueCat Docs', date: d(3), stars: 0, starred: false, isPublic: false, pushed: false, pinned: false, category: 'technical', preview: '• expo install react-native-purchases — use expo install, not npm, to avoid native version mismatches\n• Initialize once at app root: Purchases.configure({ apiKey: RC_IOS_KEY, appUserID: userId })\n• Check entitlements via customerInfo.entitlements.active[\'your_entitlement_id\']\n• Always call restorePurchases() on app launch to sync across devices\n• Offerings come from RevenueCat dashboard — change prices without an app update', concepts: ['RevenueCat uses Entitlements, Products, and Offerings as three separate concepts'], actions: ['Run: expo install react-native-purchases react-native-purchases-ui'], quotes: ['"Configure once, check entitlements everywhere."'] },
  { id: 'seed-expo-eas-build', title: 'EAS Build: how to ship a React Native app to the App Store', sourceUrl: 'https://docs.expo.dev/build/introduction/', sourceType: 'image', creator: '@expo', platform: 'Expo Docs', date: d(3), stars: 0, starred: false, isPublic: false, pushed: false, pinned: false, category: 'technical', preview: '• eas build --platform ios --profile production — triggers a cloud build, no Mac required\n• autoIncrement: true in eas.json auto-bumps build number on every build\n• eas submit --platform ios auto-uploads the IPA to App Store Connect after build\n• Development builds replace Expo Go — install once, test all native modules', concepts: [], actions: [], quotes: [] },
  { id: 'seed-app-store-aso', title: 'App Store ASO: how to write listing copy that gets found and converts', sourceUrl: '', sourceType: 'video', creator: '@appfollow', platform: 'Paste', date: d(3), stars: 0, starred: false, isPublic: false, pushed: false, pinned: false, category: 'marketing', preview: '• Your first 3 words of the app name carry 90% of search weight — put the category keyword there\n• The subtitle (30 chars) is indexed by Apple — treat it like a second title, not a tagline\n• Screenshots sell more than the description — show outcome screens, not your onboarding flow', concepts: [], actions: [], quotes: [] },
  { id: 'seed-product-hunt-launch', title: 'How to get 300+ upvotes on Product Hunt on launch day', sourceUrl: '', sourceType: 'video', creator: '@levelsio', platform: 'Paste', date: d(3), stars: 0, starred: false, isPublic: false, pushed: false, pinned: false, category: 'launch', preview: '• Launch at 12:01 AM PST Tuesday-Thursday — the week resets, competition is lower than Monday\n• Pre-build a launch list of 200+ supporters in your maker community before you post\n• Your first 50 upvotes in 2 hours determine if PH algorithm surfaces you in the top 5', concepts: [], actions: [], quotes: [] },
  { id: 'seed-pricing-psychology', title: 'SaaS pricing psychology: why anchoring makes everything else sell better', sourceUrl: '', sourceType: 'video', creator: '@priceintelligently', platform: 'Paste', date: d(3), stars: 0, starred: false, isPublic: false, pushed: false, pinned: false, category: 'pricing', preview: '• 3-tier pricing always outperforms 2-tier — the middle option gets 60-70% of purchases\n• Anchor with an enterprise tier even if you never sell it — it makes your mid tier feel like a deal\n• Monthly vs annual: show both always, with annual saving prominently displayed', concepts: [], actions: [], quotes: [] },
  { id: 'seed-first-10-users', title: 'How to find your first 10 users manually (without ads or Product Hunt)', sourceUrl: '', sourceType: 'video', creator: '@paulgraham', platform: 'Paste', date: d(5), stars: 0, starred: false, isPublic: false, pushed: false, pinned: false, category: 'launch', preview: '• Do things that don\'t scale — hand-pick, call, and onboard every early user yourself\n• Your first users come from 3 places: your network, niche communities, and direct outreach\n• DM 50 people who complained about your exact problem on Twitter/X in the last 30 days', concepts: [], actions: [], quotes: [] },
  { id: 'seed-stripe-webhooks', title: 'Setting up Stripe webhooks in Python/FastAPI — the complete guide', sourceUrl: '', sourceType: 'video', creator: '@stripe', platform: 'Paste', date: d(5), stars: 0, starred: false, isPublic: false, pushed: false, pinned: false, category: 'technical', preview: '• Always verify the webhook signature — skip this and anyone can fake a payment\n• Handle checkout.session.completed to provision access, not payment_intent.succeeded\n• Use idempotency keys so retried webhooks don\'t double-provision users', concepts: [], actions: [], quotes: [] },
  { id: 'seed-landing-page-copy', title: 'The AIDA formula for landing page copy that converts cold traffic', sourceUrl: '', sourceType: 'video', creator: '@copyhackers', platform: 'Paste', date: d(5), stars: 0, starred: false, isPublic: false, pushed: false, pinned: false, category: 'marketing', preview: '• Your headline must answer "what is this, who is it for, why should I care" in under 8 words\n• The hero section alone determines 80% of bounce rate — get it right before anything else\n• Social proof near the CTA converts better than social proof at the bottom', concepts: [], actions: [], quotes: [] },
  { id: 'seed-building-in-public', title: 'Building in public: the strategy that drives 10x more followers than posting results', sourceUrl: '', sourceType: 'video', creator: '@marc_louvion', platform: 'Paste', date: d(7), stars: 0, starred: false, isPublic: false, pushed: false, pinned: false, category: 'marketing', preview: '• Post the journey, not the destination — failures get 3x more engagement than success posts\n• Weekly revenue screenshots + context outperform product announcement posts every time\n• Tag your stack in every post — developers and makers follow you because of what you\'re using', concepts: [], actions: [], quotes: [] },
  { id: 'seed-expo-push-notifications', title: 'Expo push notifications: complete guide for iOS and Android', sourceUrl: '', sourceType: 'video', creator: '@expo', platform: 'Paste', date: d(7), stars: 0, starred: false, isPublic: false, pushed: false, pinned: false, category: 'technical', preview: '• expo-notifications requires an EAS build — it will not work in Expo Go\n• Request permissions before calling getExpoPushTokenAsync — iOS will silently fail without them\n• Store the push token on your server per device — users can have multiple devices', concepts: [], actions: [], quotes: [] },
  { id: 'seed-posthog-analytics', title: 'PostHog analytics in React Native: setup, identify, and track custom events', sourceUrl: '', sourceType: 'video', creator: '@posthog', platform: 'Paste', date: d(10), stars: 0, starred: false, isPublic: false, pushed: false, pinned: false, category: 'technical', preview: '• posthog-react-native needs the AsyncStorage and UUID peer dependencies to work\n• Wrap your root layout in PostHogProvider with your project API key and host\n• Call posthog.identify(userId, { email, name }) immediately after login', concepts: [], actions: [], quotes: [] },
  { id: 'seed-fastapi-railway', title: 'Deploying a FastAPI backend to Railway in under 10 minutes', sourceUrl: '', sourceType: 'video', creator: '@railway', platform: 'Paste', date: d(10), stars: 0, starred: false, isPublic: false, pushed: false, pinned: false, category: 'technical', preview: '• Railway auto-detects Python and installs requirements.txt — no Dockerfile needed\n• Set PORT env var in your FastAPI uvicorn command: uvicorn main:app --host 0.0.0.0 --port $PORT\n• Add a /health endpoint that returns 200 — Railway uses it to know your app is alive', concepts: [], actions: [], quotes: [] },
  { id: 'seed-privacy-policy', title: 'What your privacy policy must include to avoid App Store rejection and legal trouble', sourceUrl: '', sourceType: 'video', creator: '@iubenda', platform: 'Paste', date: d(10), stars: 0, starred: false, isPublic: false, pushed: false, pinned: false, category: 'founder', preview: '• Apple requires a privacy policy URL before App Store approval — no exceptions\n• Must disclose what data you collect, how you store it, and who you share it with\n• GDPR applies to any EU user regardless of where your company is incorporated', concepts: [], actions: [], quotes: [] },
  { id: 'seed-cold-email', title: 'The cold email framework that gets 40%+ open rates from founders and PMs', sourceUrl: '', sourceType: 'video', creator: '@alexhormozi', platform: 'Paste', date: d(14), stars: 0, starred: false, isPublic: false, pushed: false, pinned: false, category: 'marketing', preview: '• Subject line must be 4 words or fewer — any longer and it reads like a newsletter\n• Personalize the first sentence with a specific observation about them, not a compliment\n• Ask for something tiny: a 15-min call, one question answered — never pitch in the first email', concepts: [], actions: [], quotes: [] },
  { id: 'seed-supabase-auth', title: 'Supabase Auth in React Native: email + Google OAuth setup from scratch', sourceUrl: '', sourceType: 'video', creator: '@supabase', platform: 'Paste', date: d(14), stars: 0, starred: false, isPublic: false, pushed: false, pinned: false, category: 'technical', preview: '• supabase-js v2 works in React Native with AsyncStorage as the session store\n• signInWithOAuth triggers a browser — you must handle the deep link redirect back to your app\n• Row Level Security (RLS) must be enabled on every table or any user can read all data', concepts: [], actions: [], quotes: [] },
]

function safeGet<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function safeSet(key: string, value: unknown): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // ignore
  }
}

// Auth
export const storageAuth = {
  getToken: (): string | null => {
    if (typeof window === 'undefined') return null
    try { return localStorage.getItem('grimoire:token') } catch { return null }
  },
  setToken: (token: string) => {
    if (typeof window === 'undefined') return
    try { localStorage.setItem('grimoire:token', token) } catch { /* ignore */ }
  },
  getUser: (): GrimoireUser | null => safeGet<GrimoireUser | null>('grimoire:user', null),
  setUser: (user: GrimoireUser) => safeSet('grimoire:user', user),
  clear: () => {
    if (typeof window === 'undefined') return
    try {
      localStorage.removeItem('grimoire:token')
      localStorage.removeItem('grimoire:user')
    } catch { /* ignore */ }
  },
}

// Captures
export const storageCaptures = {
  getAll: (): Capture[] => {
    const stored = safeGet<Capture[] | null>('grimoire:captures', null)
    if (stored === null) {
      safeSet('grimoire:captures', SEED_CAPTURES)
      return SEED_CAPTURES
    }
    return stored
  },
  add: (capture: Capture): void => {
    const all = storageCaptures.getAll()
    safeSet('grimoire:captures', [capture, ...all])
  },
  update: (id: string, updates: Partial<Capture>): void => {
    const all = storageCaptures.getAll()
    safeSet('grimoire:captures', all.map(c => c.id === id ? { ...c, ...updates } : c))
  },
  remove: (id: string): void => {
    const all = storageCaptures.getAll()
    safeSet('grimoire:captures', all.filter(c => c.id !== id))
  },
  getById: (id: string): Capture | null => {
    return storageCaptures.getAll().find(c => c.id === id) ?? null
  },
}

// Milestones
const SEED_MILESTONES: Milestone[] = [
  {
    id: 'seed-1',
    type: 'shipped',
    text: 'Just shipped v1.0 of my AI writing assistant! 3 months of building and it\'s finally live 🚀',
    authorName: 'Alex Chen',
    authorHandle: 'alexbuilds',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'seed-2',
    type: 'first_dollar',
    text: 'First paying customer! Someone actually paid $29 for my notion template generator. Mind blown.',
    authorName: 'Sam Rivera',
    authorHandle: 'samcodes',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'seed-3',
    type: 'first_user',
    text: 'Hit 100 users on my habit tracker app. Built it in a weekend with Claude, never expected this!',
    authorName: 'Jordan Lee',
    authorHandle: 'jordandev',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
]

const SEED_THREADS: Thread[] = [
  {
    id: 'thread-1',
    question: 'What\'s your go-to stack for vibe coding a SaaS MVP fast?',
    authorName: 'Maya Patel',
    authorHandle: 'mayabuilds',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    replies: [
      {
        id: 'reply-1',
        body: 'Next.js + Supabase + Stripe. Can ship in a weekend with Cursor.',
        authorName: 'Jake Torres',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'reply-2',
        body: 'FastAPI backend + React frontend. Python makes the AI integration so much easier.',
        authorName: 'Lin Zhang',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
  },
  {
    id: 'thread-2',
    question: 'Anyone else getting imposter syndrome when people ask "did you write all this code yourself"?',
    authorName: 'Chris Morgan',
    authorHandle: 'chrisvibes',
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    replies: [
      {
        id: 'reply-3',
        body: 'I direct the AI like a conductor. The symphony is still mine.',
        authorName: 'Priya Nair',
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
  },
]

export const storageMilestones = {
  getAll: (): Milestone[] => {
    const stored = safeGet<Milestone[] | null>('grimoire:milestones', null)
    if (stored === null) {
      safeSet('grimoire:milestones', SEED_MILESTONES)
      return SEED_MILESTONES
    }
    return stored
  },
  add: (m: Milestone): void => {
    const all = storageMilestones.getAll()
    safeSet('grimoire:milestones', [m, ...all])
  },
}

export const storageThreads = {
  getAll: (): Thread[] => {
    const stored = safeGet<Thread[] | null>('grimoire:threads', null)
    if (stored === null) {
      safeSet('grimoire:threads', SEED_THREADS)
      return SEED_THREADS
    }
    return stored
  },
  add: (t: Thread): void => {
    const all = storageThreads.getAll()
    safeSet('grimoire:threads', [t, ...all])
  },
  addReply: (threadId: string, reply: import('./types').ThreadReply): void => {
    const all = storageThreads.getAll()
    safeSet('grimoire:threads', all.map(t =>
      t.id === threadId ? { ...t, replies: [...t.replies, reply] } : t
    ))
  },
}

export const storageOnboarding = {
  get: (): OnboardingData => safeGet<OnboardingData>('grimoire:onboarding', {}),
  set: (data: OnboardingData): void => safeSet('grimoire:onboarding', data),
  isCompleted: (): boolean => {
    const d = storageOnboarding.get()
    return d.completed === true
  },
}

export const storageReactions = {
  getResolved: (): string[] => safeGet<string[]>('grimoire:reactions', []),
  toggle: (riskId: string): boolean => {
    const current = storageReactions.getResolved()
    const isResolved = current.includes(riskId)
    if (isResolved) {
      safeSet('grimoire:reactions', current.filter(id => id !== riskId))
      return false
    } else {
      safeSet('grimoire:reactions', [...current, riskId])
      return true
    }
  },
}
