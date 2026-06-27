import AsyncStorage from '@react-native-async-storage/async-storage'

const BASE = 'https://reel-capture-production.up.railway.app'

async function authHeaders(): Promise<Record<string, string>> {
  const token = await AsyncStorage.getItem('grimoire:token')
  return token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' }
}

export type PacketStatus = 'draft' | 'pending_review' | 'published' | 'rejected'

export type PacketChapter = {
  id: string
  packetId: string
  title: string
  content: string
  chapterOrder: number
  isPreview: boolean
}

export type Packet = {
  id: string
  authorId: string
  authorName: string
  authorHandle: string | null
  title: string
  description: string
  category: string
  coverEmoji: string
  status: PacketStatus
  totalReads: number
  chapterCount: number
  createdAt: string
  updatedAt: string | null
  chapters?: PacketChapter[]
  previewChapterCount?: number
}

export type ApplicationStatus = 'none' | 'pending' | 'approved' | 'rejected'

export async function syncReputation(points: number): Promise<void> {
  const headers = await authHeaders()
  await fetch(`${BASE}/auth/reputation`, {
    method: 'PUT', headers, body: JSON.stringify({ points }),
  })
}

export async function applyToBeCreator(data: {
  motivation: string
  sampleContent: string
}): Promise<{ status: ApplicationStatus; autoApproved: boolean }> {
  const headers = await authHeaders()
  const res = await fetch(`${BASE}/creator/apply`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ motivation: data.motivation, sample_content: data.sampleContent }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as any).detail ?? 'Application failed')
  }
  return res.json()
}

export async function getMyApplication(): Promise<{ status: ApplicationStatus; rejectionReason?: string; createdAt?: string } | null> {
  const headers = await authHeaders()
  const res = await fetch(`${BASE}/creator/application`, { headers })
  if (!res.ok) return null
  return res.json()
}

export async function getPackets(category?: string, offset = 0): Promise<Packet[]> {
  const headers = await authHeaders()
  const params = new URLSearchParams({ offset: String(offset), limit: '30' })
  if (category) params.set('category', category)
  const res = await fetch(`${BASE}/packets?${params}`, { headers })
  if (!res.ok) return []
  return res.json()
}

export async function getMyPackets(): Promise<Packet[]> {
  const headers = await authHeaders()
  const res = await fetch(`${BASE}/my/packets`, { headers })
  if (!res.ok) return []
  return res.json()
}

export async function getPacket(id: string): Promise<Packet | null> {
  const headers = await authHeaders()
  const res = await fetch(`${BASE}/packets/${id}`, { headers })
  if (!res.ok) return null
  return res.json()
}

export async function createPacket(data: {
  title: string
  description: string
  category: string
  coverEmoji: string
}): Promise<Packet> {
  const headers = await authHeaders()
  const res = await fetch(`${BASE}/packets`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ title: data.title, description: data.description, category: data.category, cover_emoji: data.coverEmoji }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as any).detail ?? 'Failed to create packet')
  }
  return res.json()
}

export async function updatePacket(id: string, data: Partial<{ title: string; description: string; category: string; coverEmoji: string }>): Promise<void> {
  const headers = await authHeaders()
  await fetch(`${BASE}/packets/${id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ title: data.title, description: data.description, category: data.category, cover_emoji: data.coverEmoji }),
  })
}

export async function deletePacket(id: string): Promise<void> {
  const headers = await authHeaders()
  await fetch(`${BASE}/packets/${id}`, { method: 'DELETE', headers })
}

export async function submitPacket(id: string): Promise<void> {
  const headers = await authHeaders()
  const res = await fetch(`${BASE}/packets/${id}/submit`, { method: 'POST', headers })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as any).detail ?? 'Failed to submit packet')
  }
}

export async function recordRead(id: string): Promise<void> {
  const headers = await authHeaders()
  await fetch(`${BASE}/packets/${id}/read`, { method: 'POST', headers })
}

export async function addChapter(packetId: string, data: {
  title: string
  content: string
  chapterOrder: number
  isPreview: boolean
}): Promise<PacketChapter> {
  const headers = await authHeaders()
  const res = await fetch(`${BASE}/packets/${packetId}/chapters`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ title: data.title, content: data.content, chapter_order: data.chapterOrder, is_preview: data.isPreview }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as any).detail ?? 'Failed to add chapter')
  }
  return res.json()
}

export async function updateChapter(packetId: string, chapterId: string, data: Partial<{
  title: string
  content: string
  chapterOrder: number
  isPreview: boolean
}>): Promise<void> {
  const headers = await authHeaders()
  await fetch(`${BASE}/packets/${packetId}/chapters/${chapterId}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ title: data.title, content: data.content, chapter_order: data.chapterOrder, is_preview: data.isPreview }),
  })
}

export async function deleteChapter(packetId: string, chapterId: string): Promise<void> {
  const headers = await authHeaders()
  await fetch(`${BASE}/packets/${packetId}/chapters/${chapterId}`, { method: 'DELETE', headers })
}

export const PACKET_CATEGORIES = [
  { id: 'founder', label: 'Founder', emoji: '🧠' },
  { id: 'technical', label: 'Technical', emoji: '⚙️' },
  { id: 'marketing', label: 'Marketing', emoji: '📣' },
  { id: 'launch', label: 'Launch', emoji: '🚀' },
  { id: 'pricing', label: 'Pricing', emoji: '💰' },
  { id: 'product', label: 'Product', emoji: '🎯' },
]

export function categoryEmoji(cat: string): string {
  return PACKET_CATEGORIES.find(c => c.id === cat)?.emoji ?? '📦'
}

export function statusLabel(status: PacketStatus): string {
  switch (status) {
    case 'draft': return 'Draft'
    case 'pending_review': return 'In Review'
    case 'published': return 'Published'
    case 'rejected': return 'Rejected'
  }
}

export function statusColor(status: PacketStatus): string {
  switch (status) {
    case 'draft': return '#8E8E93'
    case 'pending_review': return '#FF9500'
    case 'published': return '#34C759'
    case 'rejected': return '#FF3B30'
  }
}
