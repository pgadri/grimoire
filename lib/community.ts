import AsyncStorage from '@react-native-async-storage/async-storage'

export const COMMUNITY_KEYS = {
  REACTIONS: 'grimoire:reactions',
  THREADS: 'grimoire:threads',
  MILESTONES: 'grimoire:milestones',
  PRODUCTS: 'grimoire:products',
  PRODUCT_REVIEWS: 'grimoire:product_reviews',
}

export type ReactionType = 'fire' | 'insightful'

export type CaptureReaction = {
  fire: number
  insightful: number
  myReaction: ReactionType | null
}

export type ThreadReply = {
  id: string
  authorName: string
  body: string
  createdAt: string
  isExpert: boolean
  helpful: number
}

export type StuckThread = {
  id: string
  captureId?: string
  captureTitle?: string
  title: string
  body: string
  authorName: string
  createdAt: string
  replies: ThreadReply[]
  resolved: boolean
  tags: string[]
}

export type MilestoneType = 'shipped' | 'first_user' | 'first_dollar' | 'hundred_users' | 'other'

export type Milestone = {
  id: string
  type: MilestoneType
  projectName: string
  body: string
  authorName: string
  createdAt: string
  reactions: { fire: number; heart: number; myReaction: 'fire' | 'heart' | null }
}

export const MILESTONE_LABELS: Record<MilestoneType, string> = {
  shipped: '🚀 Shipped',
  first_user: '👤 First user',
  first_dollar: '💵 First dollar',
  hundred_users: '🎯 100 users',
  other: '🏁 Milestone',
}

// ─── Reactions ───────────────────────────────────────────────────────────────

export async function getReactions(): Promise<Record<string, CaptureReaction>> {
  const raw = await AsyncStorage.getItem(COMMUNITY_KEYS.REACTIONS)
  return raw ? JSON.parse(raw) : {}
}

export async function toggleReaction(captureId: string, type: ReactionType): Promise<CaptureReaction> {
  const all = await getReactions()
  const cur = all[captureId] ?? { fire: 0, insightful: 0, myReaction: null }

  if (cur.myReaction === type) {
    cur[type] = Math.max(0, cur[type] - 1)
    cur.myReaction = null
  } else {
    if (cur.myReaction) cur[cur.myReaction] = Math.max(0, cur[cur.myReaction] - 1)
    cur[type]++
    cur.myReaction = type
  }

  all[captureId] = cur
  await AsyncStorage.setItem(COMMUNITY_KEYS.REACTIONS, JSON.stringify(all))
  return cur
}

// ─── Threads ─────────────────────────────────────────────────────────────────

export async function getThreads(): Promise<StuckThread[]> {
  const raw = await AsyncStorage.getItem(COMMUNITY_KEYS.THREADS)
  return raw ? JSON.parse(raw) : []
}

export async function createThread(
  thread: Omit<StuckThread, 'id' | 'createdAt' | 'replies' | 'resolved'>,
): Promise<StuckThread> {
  const threads = await getThreads()
  const t: StuckThread = {
    ...thread,
    id: `thread_${Date.now()}`,
    createdAt: new Date().toISOString(),
    replies: [],
    resolved: false,
  }
  threads.unshift(t)
  await AsyncStorage.setItem(COMMUNITY_KEYS.THREADS, JSON.stringify(threads))
  return t
}

export async function addReply(
  threadId: string,
  reply: Omit<ThreadReply, 'id' | 'createdAt' | 'helpful'>,
): Promise<void> {
  const threads = await getThreads()
  const idx = threads.findIndex(t => t.id === threadId)
  if (idx === -1) return
  threads[idx].replies.push({
    ...reply,
    id: `reply_${Date.now()}`,
    createdAt: new Date().toISOString(),
    helpful: 0,
  })
  await AsyncStorage.setItem(COMMUNITY_KEYS.THREADS, JSON.stringify(threads))
}

export async function resolveThread(threadId: string): Promise<void> {
  const threads = await getThreads()
  const idx = threads.findIndex(t => t.id === threadId)
  if (idx === -1) return
  threads[idx].resolved = true
  await AsyncStorage.setItem(COMMUNITY_KEYS.THREADS, JSON.stringify(threads))
}

// ─── Milestones ───────────────────────────────────────────────────────────────

export async function getMilestones(): Promise<Milestone[]> {
  const raw = await AsyncStorage.getItem(COMMUNITY_KEYS.MILESTONES)
  return raw ? JSON.parse(raw) : []
}

export async function createMilestone(
  m: Omit<Milestone, 'id' | 'createdAt' | 'reactions'>,
): Promise<Milestone> {
  const milestones = await getMilestones()
  const ms: Milestone = {
    ...m,
    id: `ms_${Date.now()}`,
    createdAt: new Date().toISOString(),
    reactions: { fire: 0, heart: 0, myReaction: null },
  }
  milestones.unshift(ms)
  await AsyncStorage.setItem(COMMUNITY_KEYS.MILESTONES, JSON.stringify(milestones))
  return ms
}

export async function toggleMilestoneReaction(
  milestoneId: string,
  type: 'fire' | 'heart',
): Promise<void> {
  const milestones = await getMilestones()
  const idx = milestones.findIndex(m => m.id === milestoneId)
  if (idx === -1) return
  const r = milestones[idx].reactions
  if (r.myReaction === type) {
    r[type] = Math.max(0, r[type] - 1)
    r.myReaction = null
  } else {
    if (r.myReaction) r[r.myReaction] = Math.max(0, r[r.myReaction] - 1)
    r[type]++
    r.myReaction = type
  }
  await AsyncStorage.setItem(COMMUNITY_KEYS.MILESTONES, JSON.stringify(milestones))
}

// ─── Products ────────────────────────────────────────────────────────────────

const BASE = 'https://reel-capture-production.up.railway.app'

async function authHeaders(): Promise<Record<string, string>> {
  const token = await AsyncStorage.getItem('grimoire:token')
  return token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' }
}

export type ProductStage = 'idea' | 'beta' | 'live' | 'sunset'
export type ReviewType = 'feedback' | 'review' | 'bug' | 'tester'

export type Product = {
  id: string
  authorId?: string
  name: string
  tagline: string
  description: string
  url?: string
  category: string
  stage: ProductStage
  logoEmoji: string
  tags: string[]
  lookingFor: ReviewType[]
  upvotes: number
  myUpvote: boolean
  authorName: string
  createdAt: string
}

export type ProductReview = {
  id: string
  productId: string
  type: ReviewType
  rating?: number
  body: string
  authorName: string
  createdAt: string
}

export const REVIEW_TYPE_LABEL: Record<ReviewType, string> = {
  feedback: '💬 Feedback',
  review:   '⭐ Review',
  bug:      '🐛 Bug report',
  tester:   '🧪 Want to test',
}

export const STAGE_LABEL: Record<ProductStage, string> = {
  idea:   '💡 Idea',
  beta:   '🧪 Beta',
  live:   '✅ Live',
  sunset: '🌅 Sunset',
}

export async function getProducts(): Promise<Product[]> {
  try {
    const headers = await authHeaders()
    const res = await fetch(`${BASE}/products?limit=50`, { headers })
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}

export async function createProduct(
  p: Omit<Product, 'id' | 'createdAt' | 'upvotes' | 'myUpvote' | 'authorId' | 'authorName'>,
): Promise<Product> {
  const headers = await authHeaders()
  const res = await fetch(`${BASE}/products`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: p.name,
      tagline: p.tagline,
      description: p.description,
      url: p.url,
      category: p.category,
      stage: p.stage,
      logoEmoji: p.logoEmoji,
      tags: p.tags,
      lookingFor: p.lookingFor,
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as any).detail ?? 'Failed to create product')
  }
  return res.json()
}

export async function toggleProductUpvote(productId: string): Promise<{ myUpvote: boolean; upvotes: number }> {
  const headers = await authHeaders()
  const res = await fetch(`${BASE}/products/${productId}/upvote`, { method: 'POST', headers })
  if (!res.ok) return { myUpvote: false, upvotes: 0 }
  return res.json()
}

export async function getProductReviews(productId: string): Promise<ProductReview[]> {
  try {
    const res = await fetch(`${BASE}/products/${productId}/reviews`)
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}

export async function addProductReview(
  review: Omit<ProductReview, 'id' | 'createdAt'>,
): Promise<void> {
  const headers = await authHeaders()
  await fetch(`${BASE}/products/${review.productId}/reviews`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      type: review.type,
      rating: review.rating,
      body: review.body,
      authorName: review.authorName,
    }),
  })
}

// ─── Public Captures ─────────────────────────────────────────────────────────

export type PublicCapture = {
  id: string
  clientId: string
  authorId: string
  authorName: string
  authorHandle: string | null
  title: string
  preview: string
  category?: string
  sourceType: string
  platform?: string
  creator?: string
  sourceUrl?: string
  createdAt: string
}

export async function getPublicCaptures(): Promise<PublicCapture[]> {
  try {
    const res = await fetch(`${BASE}/public-captures?limit=50`)
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}

export async function syncPublicCapture(capture: {
  clientId: string
  title: string
  preview: string
  category?: string
  sourceType: string
  platform?: string
  creator?: string
  sourceUrl?: string
  authorName: string
}): Promise<void> {
  try {
    const headers = await authHeaders()
    await fetch(`${BASE}/public-captures`, {
      method: 'POST',
      headers,
      body: JSON.stringify(capture),
    })
  } catch {}
}

export async function unsyncPublicCapture(clientId: string): Promise<void> {
  try {
    const headers = await authHeaders()
    await fetch(`${BASE}/public-captures/${clientId}`, { method: 'DELETE', headers })
  } catch {}
}

// ─── Utils ───────────────────────────────────────────────────────────────────

export function formatRelTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}
