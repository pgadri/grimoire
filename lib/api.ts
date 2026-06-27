export const API_BASE = 'https://reel-capture-production.up.railway.app'

export async function captureUrl(url: string): Promise<{ title: string; note_url: string; preview: string; bullets: string[]; concepts: string[]; actions: string[]; quotes: string[]; transcript: string; category: string; creator: string }> {
  const res = await fetch(`${API_BASE}/capture`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as any).detail ?? `Server error ${res.status}`)
  }
  return res.json()
}

export async function chatWithGrimoire(
  question: string,
  captures: Array<{ id: string; title: string; preview: string }>
): Promise<{ answer: string; sources: typeof captures }> {
  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, captures }),
  })
  if (!res.ok) throw new Error(`Chat failed: ${res.status}`)
  return res.json()
}

type MapPushData = {
  title: string
  description: string
  emoji: string
  captureCount: number
  forkedFrom?: string
}

export async function pushMapToGithub(map: MapPushData): Promise<{ url: string }> {
  const res = await fetch(`${API_BASE}/push-map`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: map.title,
      description: map.description,
      author: '@pgadri',
      forked_from: map.forkedFrom ?? null,
      capture_count: map.captureCount,
    }),
  })
  if (!res.ok) throw new Error(`GitHub push failed: ${res.status}`)
  return res.json()
}

export async function captureText(data: { text: string; title?: string; sourceUrl?: string; platform?: string }): Promise<{ title: string; note_url: string; preview: string; bullets: string[]; concepts: string[]; actions: string[]; quotes: string[]; transcript: string; category: string; creator: string }> {
  const res = await fetch(`${API_BASE}/capture/paste`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: data.text, title: data.title ?? 'Pasted content', source_url: data.sourceUrl, platform: data.platform }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as any).detail ?? `Server error ${res.status}`)
  }
  return res.json()
}

export async function analyzeImage(base64: string): Promise<{ title: string; preview: string; bullets: string[] }> {
  const res = await fetch(`${API_BASE}/analyze-image`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image_base64: base64 }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as any).detail ?? `Analysis failed (${res.status})`)
  }
  return res.json()
}

export function detectPlatform(url: string): string {
  if (url.includes('instagram.com')) return 'Instagram'
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'YouTube'
  if (url.includes('tiktok.com')) return 'TikTok'
  if (url.includes('facebook.com') || url.includes('fb.watch')) return 'Facebook'
  return 'Video'
}
