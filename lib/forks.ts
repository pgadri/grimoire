import AsyncStorage from '@react-native-async-storage/async-storage'

export type ForkDestination = 'personal' | 'team'

export type ForkRecord = {
  localId: string
  originalId: string
  originalTitle: string
  originalAuthor: string
  originalEmoji: string
  destination: ForkDestination
  forkedAt: string
  lastSyncedAt: string
  newCapturesAvailable: number
}

const KEY = 'grimoire:forks'

export async function getForks(): Promise<ForkRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export async function saveFork(record: ForkRecord): Promise<void> {
  const existing = await getForks()
  const deduped = existing.filter(
    f => !(f.originalId === record.originalId && f.destination === record.destination)
  )
  await AsyncStorage.setItem(KEY, JSON.stringify([...deduped, record]))
}

export async function getForkByLocalId(localId: string): Promise<ForkRecord | null> {
  const forks = await getForks()
  return forks.find(f => f.localId === localId) ?? null
}

export async function markSynced(localId: string): Promise<void> {
  const forks = await getForks()
  const updated = forks.map(f =>
    f.localId === localId
      ? { ...f, lastSyncedAt: new Date().toISOString(), newCapturesAvailable: 0 }
      : f
  )
  await AsyncStorage.setItem(KEY, JSON.stringify(updated))
}

export function makeLocalId(): string {
  return `fork-${Date.now()}`
}

export function formatSyncTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}
