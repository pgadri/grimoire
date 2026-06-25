import AsyncStorage from '@react-native-async-storage/async-storage'

export const PLATFORM_CUT = 0.20 // Grimoire takes 20%

export type PacketPrice =
  | { type: 'free' }
  | { type: 'paid'; amount: number }

export type MarketplacePacket = {
  id: string
  title: string
  description: string
  authorHandle: string
  emoji: string
  price: PacketPrice
  rating: number
  reviewCount: number
  captureCount: number
  stars: number
  tags: string[]
  previewItems: string[]
}

export type Purchase = {
  packetId: string
  purchasedAt: string
  amountPaid: number
  rated: boolean
}

export type Review = {
  packetId: string
  rating: number
  comment: string
  createdAt: string
}

const KEYS = {
  PURCHASES: 'grimoire:purchases',
  REVIEWS: 'grimoire:reviews',
}

export async function getPurchases(): Promise<Purchase[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.PURCHASES)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export async function isOwned(packetId: string): Promise<boolean> {
  const purchases = await getPurchases()
  return purchases.some(p => p.packetId === packetId)
}

export async function purchasePacket(packet: MarketplacePacket): Promise<void> {
  const purchases = await getPurchases()
  if (purchases.some(p => p.packetId === packet.id)) return
  purchases.push({
    packetId: packet.id,
    purchasedAt: new Date().toISOString(),
    amountPaid: packet.price.type === 'paid' ? packet.price.amount : 0,
    rated: false,
  })
  await AsyncStorage.setItem(KEYS.PURCHASES, JSON.stringify(purchases))
}

export async function markRated(packetId: string): Promise<void> {
  const purchases = await getPurchases()
  const updated = purchases.map(p =>
    p.packetId === packetId ? { ...p, rated: true } : p
  )
  await AsyncStorage.setItem(KEYS.PURCHASES, JSON.stringify(updated))
}

export async function submitReview(review: Review): Promise<void> {
  const raw = await AsyncStorage.getItem(KEYS.REVIEWS)
  const reviews: Review[] = raw ? JSON.parse(raw) : []
  reviews.push(review)
  await AsyncStorage.setItem(KEYS.REVIEWS, JSON.stringify(reviews))
  await markRated(review.packetId)
}

export async function getReviews(packetId: string): Promise<Review[]> {
  const raw = await AsyncStorage.getItem(KEYS.REVIEWS)
  const all: Review[] = raw ? JSON.parse(raw) : []
  return all.filter(r => r.packetId === packetId)
}

export function creatorEarnings(price: number): number {
  return price * (1 - PLATFORM_CUT)
}

export function formatPrice(price: PacketPrice): string {
  return price.type === 'free' ? 'Free' : `$${price.amount.toFixed(2)}`
}

// Mock marketplace data — replace with API call later
export const MARKETPLACE_PACKETS: MarketplacePacket[] = [
  {
    id: 'mp-1',
    title: 'App Security Checklist + AI Prompts',
    description: 'A complete security review framework for indie devs. Includes 50 checklist items with AI prompts for each — paste into Claude, ChatGPT, or any AI and get your app hardened in a weekend.',
    authorHandle: '@securitypro',
    emoji: '🔐',
    price: { type: 'paid', amount: 19.99 },
    rating: 4.9,
    reviewCount: 87,
    captureCount: 50,
    stars: 1204,
    tags: ['Security', 'AI Prompts'],
    previewItems: [
      'OWASP Top 10 checklist with AI fix prompts for each vulnerability',
      'JWT auth review: 12 prompts to audit your token flow',
    ],
  },
  {
    id: 'mp-2',
    title: 'The Complete Launch Playbook',
    description: 'Everything I learned launching 3 apps. ProductHunt strategy, App Store optimization, first 100 users — organized into 23 actionable captures.',
    authorHandle: '@buildmaster',
    emoji: '🚀',
    price: { type: 'free' },
    rating: 4.7,
    reviewCount: 312,
    captureCount: 23,
    stars: 891,
    tags: ['Launch', 'Growth'],
    previewItems: [
      'ProductHunt launch day timeline — hour by hour',
      'App Store screenshots that convert: 8 rules',
    ],
  },
  {
    id: 'mp-3',
    title: 'AI Prompts for React Native',
    description: '40 battle-tested AI prompts for building React Native apps. Navigation, auth, API calls, Expo gotchas — paste into Claude, ChatGPT, or any LLM.',
    authorHandle: '@aibuilder',
    emoji: '🤖',
    price: { type: 'paid', amount: 14.99 },
    rating: 4.8,
    reviewCount: 156,
    captureCount: 40,
    stars: 654,
    tags: ['AI', 'React Native', 'Expo'],
    previewItems: [
      'Prompt: Generate a full Expo Router tab layout with safe areas',
      'Prompt: Add push notifications to any Expo app in 5 steps',
    ],
  },
  {
    id: 'mp-4',
    title: 'Pricing Your App: From $0 to $29/mo',
    description: 'Pricing frameworks, paywall design patterns, and A/B test results from real indie apps. Includes revenue model templates.',
    authorHandle: '@saasfounder',
    emoji: '💰',
    price: { type: 'paid', amount: 9.99 },
    rating: 4.6,
    reviewCount: 203,
    captureCount: 14,
    stars: 445,
    tags: ['Monetization', 'Growth'],
    previewItems: [
      'The 3-tier pricing model that doubled conversion',
      'When to use freemium vs free trial vs paid upfront',
    ],
  },
  {
    id: 'mp-5',
    title: 'Open Source App Architecture Patterns',
    description: 'Free collection of architecture decisions for Expo apps. Folder structure, state management, API layers — what works at scale.',
    authorHandle: '@mobilepro',
    emoji: '🏗️',
    price: { type: 'free' },
    rating: 4.5,
    reviewCount: 98,
    captureCount: 18,
    stars: 432,
    tags: ['Architecture', 'React Native'],
    previewItems: [
      'File-based routing vs stack navigator: when to use each',
      'Zustand vs Context API: benchmarks for RN apps',
    ],
  },
]
