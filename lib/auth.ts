import AsyncStorage from '@react-native-async-storage/async-storage'

const USER_KEY = 'grimoire:user'
const TOKEN_KEY = 'grimoire:token'
const API_BASE = 'https://reel-capture-production.up.railway.app'

export type GrimoireUser = {
  id: string
  name: string
  email: string
  handle?: string
  bio?: string
  githubUsername?: string
  avatarUrl?: string
  createdAt?: string
}

// ─── Token ───────────────────────────────────────────────────────────────────

export async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY)
}

async function saveToken(token: string): Promise<void> {
  await AsyncStorage.setItem(TOKEN_KEY, token)
}

// ─── User ─────────────────────────────────────────────────────────────────────

export async function getUser(): Promise<GrimoireUser | null> {
  try {
    const raw = await AsyncStorage.getItem(USER_KEY)
    return raw ? (JSON.parse(raw) as GrimoireUser) : null
  } catch {
    return null
  }
}

async function saveUser(user: GrimoireUser): Promise<void> {
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user))
}

// ─── Auth ────────────────────────────────────────────────────────────────────

// Returns email — does NOT return a token yet (need OTP verification first)
export async function signUp({ name, email, password }: { name: string; email: string; password: string }): Promise<{ email: string }> {
  const res = await fetch(`${API_BASE}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail ?? 'Signup failed')
  return { email: data.email }
}

export async function verifyOTP({ email, code }: { email: string; code: string }): Promise<GrimoireUser> {
  const res = await fetch(`${API_BASE}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail ?? 'Verification failed')
  await saveToken(data.token)
  await saveUser(data.user)
  return data.user
}

export async function resendOTP(email: string): Promise<void> {
  await fetch(`${API_BASE}/auth/resend-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
}

export async function signIn({ email, password }: { email: string; password: string }): Promise<GrimoireUser | { unverified: true; email: string }> {
  const res = await fetch(`${API_BASE}/auth/signin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail ?? 'Sign in failed')
  if (data.unverified) return { unverified: true, email: data.email }
  await saveToken(data.token)
  await saveUser(data.user)
  return data.user
}

export async function requestPasswordReset(email: string): Promise<void> {
  await fetch(`${API_BASE}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
}

export async function resetPassword({ email, code, newPassword }: { email: string; code: string; newPassword: string }): Promise<GrimoireUser> {
  const res = await fetch(`${API_BASE}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code, new_password: newPassword }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail ?? 'Reset failed')
  await saveToken(data.token)
  await saveUser(data.user)
  return data.user
}

export async function refreshUser(): Promise<GrimoireUser | null> {
  const token = await getToken()
  if (!token) return null
  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) {
      if (res.status === 401) await signOut()
      return null
    }
    const user = await res.json()
    await saveUser(user)
    return user
  } catch {
    return getUser()
  }
}

export async function signOut(): Promise<void> {
  await AsyncStorage.multiRemove([USER_KEY, TOKEN_KEY])
}
