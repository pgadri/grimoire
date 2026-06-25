const API_BASE = 'https://reel-capture-production.up.railway.app'

export type ScanSeverity = 'critical' | 'high' | 'medium'

export type ScanFinding = {
  id: string
  title: string
  severity: ScanSeverity
  category: string
  description: string
  aiPrompt: string
}

export type ScanResult = {
  owner: string
  repo: string
  scannedAt: string
  score: number
  detectedStack: string[]
  findings: ScanFinding[]
}

export function parseRepoInput(input: string): string {
  let s = input.trim().replace(/\/$/, '')
  for (const prefix of ['https://', 'http://']) {
    if (s.startsWith(prefix)) s = s.slice(prefix.length)
  }
  if (s.startsWith('github.com/')) s = s.slice('github.com/'.length)
  return s
}

export async function scanRepo(repoUrl: string): Promise<ScanResult> {
  const response = await fetch(`${API_BASE}/scan-repo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ repo_url: repoUrl }),
  })
  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error((err as any).detail ?? `Scan failed (${response.status})`)
  }
  return response.json() as Promise<ScanResult>
}

export const SEVERITY_COLOR: Record<ScanSeverity, string> = {
  critical: '#FF3B30',
  high: '#F0A500',
  medium: '#7C5CBF',
}

export const SEVERITY_LABEL: Record<ScanSeverity, string> = {
  critical: 'CRITICAL',
  high: 'HIGH',
  medium: 'MEDIUM',
}

const STACK_LABELS: Record<string, string> = {
  expo: 'Expo',
  'react-native': 'React Native',
  nextjs: 'Next.js',
  stripe: 'Stripe',
  supabase: 'Supabase',
  firebase: 'Firebase',
  openai: 'OpenAI',
  fastapi: 'FastAPI',
}

export function labelStack(tag: string): string {
  return STACK_LABELS[tag] ?? tag
}
