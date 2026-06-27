import AsyncStorage from '@react-native-async-storage/async-storage'
import { getActivePlan } from './purchases'

const CAPTURES_KEY    = 'grimoire:captures'
const THREAD_COUNT_KEY = 'grimoire:threadCount'

export const PLAN_LIMITS = {
  free:          { captures: 20,       threads: 10,       repos: 1 },
  solopreneur:   { captures: Infinity, threads: Infinity, repos: 1 },
  team:          { captures: Infinity, threads: Infinity, repos: 3 },
} as const

export type LimitKind = 'captures' | 'threads'

export type LimitResult =
  | { blocked: false }
  | { blocked: true; kind: LimitKind; limit: number; plan: string }

export async function checkCaptureLimit(): Promise<LimitResult> {
  const plan  = await getActivePlan()
  const limit = PLAN_LIMITS[plan].captures
  if (limit === Infinity) return { blocked: false }
  const raw  = await AsyncStorage.getItem(CAPTURES_KEY)
  const list = raw ? (JSON.parse(raw) as unknown[]) : []
  if (list.length >= limit) return { blocked: true, kind: 'captures', limit, plan }
  return { blocked: false }
}

export async function checkThreadLimit(): Promise<LimitResult> {
  const plan  = await getActivePlan()
  const limit = PLAN_LIMITS[plan].threads
  if (limit === Infinity) return { blocked: false }
  const raw   = await AsyncStorage.getItem(THREAD_COUNT_KEY)
  const count = raw ? parseInt(raw, 10) : 0
  if (count >= limit) return { blocked: true, kind: 'threads', limit, plan }
  return { blocked: false }
}

export async function incrementThreadCount(): Promise<void> {
  const raw   = await AsyncStorage.getItem(THREAD_COUNT_KEY)
  const count = raw ? parseInt(raw, 10) : 0
  await AsyncStorage.setItem(THREAD_COUNT_KEY, String(count + 1))
}

export function limitMessage(result: LimitResult & { blocked: true }): string {
  const noun = result.kind === 'captures' ? 'capture' : 'thread'
  return `You've reached the ${result.limit}-${noun} limit on the free plan. Upgrade to Solopreneur for unlimited ${noun}s.`
}
