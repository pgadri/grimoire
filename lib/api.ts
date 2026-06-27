const BASE_URL = 'https://reel-capture-production.up.railway.app'

function getToken(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return localStorage.getItem('grimoire:token')
  } catch {
    return null
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  auth = false
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  }
  if (auth) {
    const token = getToken()
    if (token) headers['Authorization'] = `Bearer ${token}`
  }
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
}

// Auth
export const api = {
  auth: {
    signup: (body: { name: string; email: string; password: string }) =>
      request<{ email: string }>('/auth/signup', { method: 'POST', body: JSON.stringify(body) }),

    verifyOtp: (body: { email: string; code: string }) =>
      request<{ token: string; user: import('./types').GrimoireUser }>('/auth/verify-otp', {
        method: 'POST', body: JSON.stringify(body),
      }),

    resendOtp: (body: { email: string }) =>
      request<void>('/auth/resend-otp', { method: 'POST', body: JSON.stringify(body) }),

    signin: (body: { email: string; password: string }) =>
      request<{ token: string; user: import('./types').GrimoireUser } | { unverified: true; email: string }>(
        '/auth/signin', { method: 'POST', body: JSON.stringify(body) }
      ),

    forgotPassword: (body: { email: string }) =>
      request<void>('/auth/forgot-password', { method: 'POST', body: JSON.stringify(body) }),

    resetPassword: (body: { email: string; code: string; new_password: string }) =>
      request<{ token: string; user: import('./types').GrimoireUser }>(
        '/auth/reset-password', { method: 'POST', body: JSON.stringify(body) }
      ),

    me: () => request<import('./types').GrimoireUser>('/auth/me', {}, true),

    github: (body: { code: string; redirect_uri: string }) =>
      request<{ token: string; user: import('./types').GrimoireUser }>(
        '/auth/github', { method: 'POST', body: JSON.stringify(body) }
      ),
  },

  capture: {
    fromUrl: (url: string) =>
      request<import('./types').Capture>('/capture', {
        method: 'POST', body: JSON.stringify({ url }),
      }, true),

    fromText: (body: { text: string; title?: string; source_url?: string; platform?: string }) =>
      request<import('./types').Capture>('/capture/paste', {
        method: 'POST', body: JSON.stringify(body),
      }, true),

    chat: (body: { question: string; captures: { id: string; title: string; preview: string }[] }) =>
      request<{ answer: string; sources: string[] }>('/chat', {
        method: 'POST', body: JSON.stringify(body),
      }, true),
  },

  publicCaptures: {
    list: (limit = 50) =>
      request<import('./types').PublicCapture[]>(`/public-captures?limit=${limit}`),

    create: (body: {
      clientId: string; title: string; preview: string; category?: string;
      sourceType: string; platform?: string; creator?: string; sourceUrl?: string; authorName: string
    }) =>
      request<import('./types').PublicCapture>('/public-captures', {
        method: 'POST', body: JSON.stringify(body),
      }, true),

    delete: (clientId: string) =>
      request<void>(`/public-captures/${clientId}`, { method: 'DELETE' }, true),
  },

  products: {
    list: (limit = 50) =>
      request<import('./types').Product[]>(`/products?limit=${limit}`),

    create: (body: {
      name: string; tagline: string; description: string; url?: string;
      category: string; stage: string; logoEmoji: string; tags: string[];
      lookingFor: string[]
    }) =>
      request<import('./types').Product>('/products', {
        method: 'POST', body: JSON.stringify(body),
      }, true),

    upvote: (id: string) =>
      request<{ myUpvote: boolean; upvotes: number }>(`/products/${id}/upvote`, {
        method: 'POST',
      }, true),

    reviews: (id: string) =>
      request<import('./types').ProductReview[]>(`/products/${id}/reviews`),

    addReview: (id: string, body: { type: string; rating?: number; body: string; authorName: string }) =>
      request<import('./types').ProductReview>(`/products/${id}/reviews`, {
        method: 'POST', body: JSON.stringify(body),
      }, true),
  },

  repo: {
    info: (url: string) =>
      request<{ stack: string[] }>(`/repo-info?url=${encodeURIComponent(url)}`),

    scan: (repo_url: string) =>
      request<import('./types').ScanResult>('/scan-repo', {
        method: 'POST', body: JSON.stringify({ repo_url }),
      }),
  },
}
