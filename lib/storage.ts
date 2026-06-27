import type { Capture, GrimoireUser, Milestone, Thread, OnboardingData } from './types'

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
  getAll: (): Capture[] => safeGet<Capture[]>('grimoire:captures', []),
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
