import AsyncStorage from '@react-native-async-storage/async-storage'

// What stage is the builder at? Stage gates which risks are relevant.
export type ProjectStage = 'idea' | 'building' | 'pre-launch' | 'launched'

// The technologies Grimoire knows how to reason about. Adding a tag here is
// what unlocks new risk matches in projectRisk.ts.
export type StackTag =
  | 'expo'
  | 'react-native'
  | 'react'
  | 'nextjs'
  | 'fastapi'
  | 'node'
  | 'supabase'
  | 'firebase'
  | 'postgres'
  | 'stripe'
  | 'openai'
  | 'auth'
  | 'aws'

export type ProjectProfile = {
  name: string
  stage: ProjectStage
  stack: StackTag[]
  // Captures whether the user has payments/users/etc — used to gate legal risks.
  handlesPayments: boolean
  storesUserData: boolean
  updatedAt: string
}

export const STAGE_LABELS: Record<ProjectStage, string> = {
  idea: 'Just an idea',
  building: 'Building it',
  'pre-launch': 'About to launch',
  launched: 'Already launched',
}

export const STAGE_ORDER: ProjectStage[] = ['idea', 'building', 'pre-launch', 'launched']

// Human labels for the stack chips shown in onboarding.
export const STACK_LABELS: Record<StackTag, string> = {
  expo: 'Expo',
  'react-native': 'React Native',
  react: 'React',
  nextjs: 'Next.js',
  fastapi: 'FastAPI',
  node: 'Node.js',
  supabase: 'Supabase',
  firebase: 'Firebase',
  postgres: 'Postgres',
  stripe: 'Stripe',
  openai: 'OpenAI',
  auth: 'Auth / Login',
  aws: 'AWS',
}

// Maps dependency-name fragments to stack tags. This is the core of the
// "GitHub scan": feed it the keys of package.json / requirements.txt and it
// infers the stack. Order doesn't matter; matching is substring-based.
const DEPENDENCY_SIGNALS: Array<{ match: string; tag: StackTag }> = [
  { match: 'expo', tag: 'expo' },
  { match: 'react-native', tag: 'react-native' },
  { match: 'next', tag: 'nextjs' },
  { match: 'react', tag: 'react' },
  { match: 'fastapi', tag: 'fastapi' },
  { match: 'uvicorn', tag: 'fastapi' },
  { match: 'express', tag: 'node' },
  { match: 'supabase', tag: 'supabase' },
  { match: 'firebase', tag: 'firebase' },
  { match: 'firebase-admin', tag: 'firebase' },
  { match: 'pg', tag: 'postgres' },
  { match: 'psycopg', tag: 'postgres' },
  { match: 'postgres', tag: 'postgres' },
  { match: 'stripe', tag: 'stripe' },
  { match: 'openai', tag: 'openai' },
  { match: 'next-auth', tag: 'auth' },
  { match: 'passport', tag: 'auth' },
  { match: 'jsonwebtoken', tag: 'auth' },
  { match: 'aws-sdk', tag: 'aws' },
  { match: 'boto3', tag: 'aws' },
]

/**
 * Infers stack tags from a list of dependency names (package.json keys,
 * requirements.txt lines, etc). Pure + deterministic so it can be unit tested
 * and reused by the backend GitHub scanner. Returns a de-duped, stable list.
 */
export function detectStackFromDependencies(dependencies: string[]): StackTag[] {
  const found = new Set<StackTag>()
  for (const dep of dependencies) {
    const normalized = dep.toLowerCase().trim()
    if (!normalized) continue
    for (const signal of DEPENDENCY_SIGNALS) {
      if (normalized.includes(signal.match)) found.add(signal.tag)
    }
  }
  // Return in the canonical STACK_LABELS order for stable, testable output.
  return (Object.keys(STACK_LABELS) as StackTag[]).filter(tag => found.has(tag))
}

const STORAGE_KEY = 'grimoire:project'

export async function getProjectProfile(): Promise<ProjectProfile | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as ProjectProfile) : null
  } catch {
    return null
  }
}

export async function saveProjectProfile(
  profile: Omit<ProjectProfile, 'updatedAt'>
): Promise<ProjectProfile> {
  const full: ProjectProfile = { ...profile, updatedAt: new Date().toISOString() }
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(full))
  return full
}

export async function hasOnboarded(): Promise<boolean> {
  return (await getProjectProfile()) !== null
}
