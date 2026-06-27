import AsyncStorage from '@react-native-async-storage/async-storage'

const BASE = 'https://reel-capture-production.up.railway.app'

async function authHeaders(): Promise<Record<string, string>> {
  const token = await AsyncStorage.getItem('grimoire:token')
  return token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' }
}

export type Thread = {
  id: string
  title: string
  body: string
  tags: string[]
  authorId: string
  authorName: string
  authorHandle: string | null
  createdAt: string
  updatedAt: string | null
  upvotes: number
  replyCount: number
  isResolved: boolean
  myVote: 1 | -1 | null
  replies?: ThreadReply[]
}

export type ThreadReply = {
  id: string
  threadId: string
  body: string
  authorId: string
  authorName: string
  authorHandle: string | null
  createdAt: string
  updatedAt: string | null
  upvotes: number
  myVote: boolean
  isAuthor: boolean
}

export async function getThreads(tag?: string, offset = 0): Promise<Thread[]> {
  const params = new URLSearchParams({ offset: String(offset), limit: '30' })
  if (tag) params.set('tag', tag)
  const headers = await authHeaders()
  const res = await fetch(`${BASE}/threads?${params}`, { headers })
  if (!res.ok) return []
  return res.json()
}

export async function getThread(id: string): Promise<Thread | null> {
  const headers = await authHeaders()
  const res = await fetch(`${BASE}/threads/${id}`, { headers })
  if (!res.ok) return null
  return res.json()
}

export async function createThread(data: { title: string; body: string; tags: string[] }): Promise<Thread> {
  const headers = await authHeaders()
  const res = await fetch(`${BASE}/threads`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail ?? 'Failed to post thread')
  }
  return res.json()
}

export async function updateThread(id: string, data: { title?: string; body?: string; tags?: string[] }): Promise<void> {
  const headers = await authHeaders()
  await fetch(`${BASE}/threads/${id}`, { method: 'PUT', headers, body: JSON.stringify(data) })
}

export async function deleteThread(id: string): Promise<void> {
  const headers = await authHeaders()
  await fetch(`${BASE}/threads/${id}`, { method: 'DELETE', headers })
}

export async function voteThread(id: string, vote: 1 | -1): Promise<{ myVote: 1 | -1 | null; upvotes: number }> {
  const headers = await authHeaders()
  const res = await fetch(`${BASE}/threads/${id}/vote?vote=${vote}`, { method: 'POST', headers })
  return res.json()
}

export async function resolveThread(id: string): Promise<void> {
  const headers = await authHeaders()
  await fetch(`${BASE}/threads/${id}/resolve`, { method: 'POST', headers })
}

export async function createReply(threadId: string, body: string): Promise<ThreadReply> {
  const headers = await authHeaders()
  const res = await fetch(`${BASE}/threads/${threadId}/replies`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ body }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail ?? 'Failed to post reply')
  }
  return res.json()
}

export async function updateReply(threadId: string, replyId: string, body: string): Promise<void> {
  const headers = await authHeaders()
  await fetch(`${BASE}/threads/${threadId}/replies/${replyId}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ body }),
  })
}

export async function deleteReply(threadId: string, replyId: string): Promise<void> {
  const headers = await authHeaders()
  await fetch(`${BASE}/threads/${threadId}/replies/${replyId}`, { method: 'DELETE', headers })
}

export async function voteReply(threadId: string, replyId: string): Promise<{ myVote: boolean; upvotes: number }> {
  const headers = await authHeaders()
  const res = await fetch(`${BASE}/threads/${threadId}/replies/${replyId}/vote`, { method: 'POST', headers })
  return res.json()
}

export async function registerPushToken(token: string): Promise<void> {
  const headers = await authHeaders()
  await fetch(`${BASE}/auth/push-token`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ token }),
  })
}

export function formatRelTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}
