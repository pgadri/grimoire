import AsyncStorage from '@react-native-async-storage/async-storage'
import type { PlanId } from './purchases'

const SCAN_HISTORY_KEY = 'grimoire:scanHistory'
const LAST_SCAN_KEY    = 'grimoire:lastScan'

export type ScanRecord = {
  date: string   // ISO
  score: number
  risks: number
}

export async function saveScanResult(score: number, risks: number): Promise<void> {
  const record: ScanRecord = { date: new Date().toISOString(), score, risks }
  const raw = await AsyncStorage.getItem(SCAN_HISTORY_KEY)
  const history: ScanRecord[] = raw ? JSON.parse(raw) : []
  history.unshift(record)
  await AsyncStorage.multiSet([
    [SCAN_HISTORY_KEY, JSON.stringify(history.slice(0, 20))],
    [LAST_SCAN_KEY, record.date],
  ])
}

export async function getLastScanDate(): Promise<string | null> {
  return AsyncStorage.getItem(LAST_SCAN_KEY)
}

export async function getScanHistory(): Promise<ScanRecord[]> {
  const raw = await AsyncStorage.getItem(SCAN_HISTORY_KEY)
  return raw ? JSON.parse(raw) : []
}

// Free users always scan manually. Paid users auto-rescan if last scan was >7 days ago.
export function shouldAutoRescan(lastScanDate: string | null, plan: PlanId): boolean {
  if (plan === 'free') return false
  if (!lastScanDate) return true
  const daysSince = (Date.now() - new Date(lastScanDate).getTime()) / (1000 * 60 * 60 * 24)
  return daysSince >= 7
}

export function timeSinceScan(lastScanDate: string): string {
  const diff = Math.floor((Date.now() - new Date(lastScanDate).getTime()) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  const days = Math.floor(diff / 86400)
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days}d ago`
  if (days < 14) return '1 week ago'
  return `${Math.floor(days / 7)} weeks ago`
}
