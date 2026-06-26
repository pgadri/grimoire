import AsyncStorage from '@react-native-async-storage/async-storage'

const REP_KEY = 'grimoire:reputation'

export type RepLevel = {
  level: number
  name: string
  emoji: string
  minPoints: number
  color: string
}

export const LEVELS: RepLevel[] = [
  { level: 1, name: 'Builder',  emoji: '🔨', minPoints: 0,    color: '#8B8B8B' },
  { level: 2, name: 'Shipper',  emoji: '🚀', minPoints: 50,   color: '#2A9E6B' },
  { level: 3, name: 'Maker',    emoji: '⚡', minPoints: 200,  color: '#2A6EBB' },
  { level: 4, name: 'Expert',   emoji: '🎯', minPoints: 500,  color: '#9E2A7A' },
  { level: 5, name: 'Legend',   emoji: '🏆', minPoints: 1000, color: '#F0A500' },
]

export const REP_POINTS: Record<string, number> = {
  capture_shared:       10,
  reaction_received:     5,
  thread_posted:         3,
  thread_answered:       8,
  thread_resolved:      20,
  milestone_posted:     10,
  product_launched:     15,
  product_reviewed:      5,
}

export type RepEvent = {
  type: string
  points: number
  label: string
  date: string
}

export type RepState = {
  points: number
  events: RepEvent[]
}

export function getLevelForPoints(points: number): RepLevel {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (points >= LEVELS[i].minPoints) return LEVELS[i]
  }
  return LEVELS[0]
}

export function getNextLevel(points: number): RepLevel | null {
  const cur = getLevelForPoints(points)
  return LEVELS.find(l => l.level === cur.level + 1) ?? null
}

export function progressToNext(points: number): number {
  const cur = getLevelForPoints(points)
  const next = getNextLevel(points)
  if (!next) return 1
  const range = next.minPoints - cur.minPoints
  const progress = points - cur.minPoints
  return Math.min(progress / range, 1)
}

export function canSellContent(points: number): boolean {
  return points >= 500
}

export function canLaunchProduct(points: number): boolean {
  return points >= 50
}

// ─── AsyncStorage ────────────────────────────────────────────────────────────

export async function getRepState(): Promise<RepState> {
  const raw = await AsyncStorage.getItem(REP_KEY)
  return raw ? JSON.parse(raw) : { points: 0, events: [] }
}

export async function awardPoints(type: string, label: string): Promise<RepState> {
  const pts = REP_POINTS[type] ?? 0
  if (pts === 0) return getRepState()
  const state = await getRepState()
  state.points += pts
  state.events.unshift({
    type,
    points: pts,
    label,
    date: new Date().toISOString(),
  })
  state.events = state.events.slice(0, 50)
  await AsyncStorage.setItem(REP_KEY, JSON.stringify(state))
  return state
}
