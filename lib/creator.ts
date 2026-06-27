import AsyncStorage from '@react-native-async-storage/async-storage'
import { getToken, getUser, type GrimoireUser } from './auth'

const API_BASE = 'https://reel-capture-production.up.railway.app'

export type CreatorProfile = {
  id: string
  name: string
  handle: string
  bio?: string
  avatarUrl?: string
  youtubeUrl?: string
  twitterUrl?: string
  newsletterUrl?: string
  websiteUrl?: string
  followerCount: number
  followingCount: number
  creatorSince?: string
  isFollowing: boolean
}

export type FollowUser = {
  id: string
  name: string
  handle?: string
  avatarUrl?: string
  creatorMode: boolean
}

async function authHeaders(): Promise<Record<string, string>> {
  const token = await getToken()
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

export async function updateProfile(data: {
  name?: string
  bio?: string
  handle?: string
  youtubeUrl?: string
  twitterUrl?: string
  newsletterUrl?: string
  websiteUrl?: string
}): Promise<GrimoireUser> {
  const headers = await authHeaders()
  const body: Record<string, string> = {}
  if (data.name)         body.name = data.name
  if (data.bio !== undefined) body.bio = data.bio
  if (data.handle)       body.handle = data.handle
  if (data.youtubeUrl !== undefined)    body.youtube_url = data.youtubeUrl
  if (data.twitterUrl !== undefined)    body.twitter_url = data.twitterUrl
  if (data.newsletterUrl !== undefined) body.newsletter_url = data.newsletterUrl
  if (data.websiteUrl !== undefined)    body.website_url = data.websiteUrl

  const res = await fetch(`${API_BASE}/auth/profile`, {
    method: 'PUT', headers, body: JSON.stringify(body),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.detail ?? 'Update failed')
  await AsyncStorage.setItem('grimoire:user', JSON.stringify(json))
  return json
}

export async function enableCreatorMode(data: {
  handle: string
  bio?: string
  youtubeUrl?: string
  twitterUrl?: string
  newsletterUrl?: string
  websiteUrl?: string
}): Promise<GrimoireUser> {
  const headers = await authHeaders()
  const res = await fetch(`${API_BASE}/creator/enable`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      handle: data.handle,
      bio: data.bio,
      youtube_url: data.youtubeUrl,
      twitter_url: data.twitterUrl,
      newsletter_url: data.newsletterUrl,
      website_url: data.websiteUrl,
    }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.detail ?? 'Could not enable creator mode')
  await AsyncStorage.setItem('grimoire:user', JSON.stringify(json))
  return json
}

export async function getCreatorProfile(handle: string): Promise<CreatorProfile> {
  const token = await getToken()
  const headers: Record<string, string> = {}
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(`${API_BASE}/creator/${handle}`, { headers })
  const json = await res.json()
  if (!res.ok) throw new Error(json.detail ?? 'Creator not found')
  return json
}

export async function followCreator(userId: string): Promise<void> {
  const headers = await authHeaders()
  await fetch(`${API_BASE}/users/${userId}/follow`, { method: 'POST', headers })
}

export async function unfollowCreator(userId: string): Promise<void> {
  const headers = await authHeaders()
  await fetch(`${API_BASE}/users/${userId}/follow`, { method: 'DELETE', headers })
}

export async function getCreatorFollowers(handle: string): Promise<FollowUser[]> {
  const headers = await authHeaders()
  const res = await fetch(`${API_BASE}/creator/${handle}/followers`, { headers })
  return res.ok ? res.json() : []
}

export async function getCreatorFollowing(handle: string): Promise<FollowUser[]> {
  const headers = await authHeaders()
  const res = await fetch(`${API_BASE}/creator/${handle}/following`, { headers })
  return res.ok ? res.json() : []
}
