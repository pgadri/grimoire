export type GrimoireUser = {
  id: string
  name: string
  email: string
  handle?: string
  bio?: string
  githubUsername?: string
  avatarUrl?: string
  createdAt?: string
  creatorMode?: boolean
  youtubeUrl?: string
  twitterUrl?: string
  newsletterUrl?: string
  websiteUrl?: string
  followerCount?: number
  followingCount?: number
}

export type Capture = {
  id: string
  title: string
  url?: string
  preview: string
  bullets: string[]
  concepts: string[]
  actions: string[]
  quotes: string[]
  category: string
  creator: string
  date: string
  sourceType: 'url' | 'text' | 'image'
  platform?: string
  shared?: boolean
}

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
  type: ReviewType
  rating?: number
  body: string
  authorName: string
  createdAt: string
}

export type OnboardingData = {
  projectName?: string
  stage?: string
  stack?: string[]
  handlesPayments?: boolean
  storesUserData?: boolean
  githubRepo?: string
  completed?: boolean
}

export type Milestone = {
  id: string
  type: 'shipped' | 'first_dollar' | 'first_user' | 'custom'
  text: string
  authorName: string
  authorHandle?: string
  createdAt: string
}

export type Thread = {
  id: string
  question: string
  authorName: string
  authorHandle?: string
  createdAt: string
  replies: ThreadReply[]
}

export type ThreadReply = {
  id: string
  body: string
  authorName: string
  createdAt: string
}

export type ScanFinding = {
  id: string
  title: string
  severity: 'critical' | 'high' | 'medium'
  category: string
  description: string
  aiPrompt: string
}

export type ScanResult = {
  owner: string
  repo: string
  scannedAt: string
  score: number
  detectedStack: string[]
  findings: ScanFinding[]
}
