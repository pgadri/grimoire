import type { Capture } from '../components/CaptureCard'

const STOP_WORDS = new Set([
  'the','a','an','and','or','but','in','on','at','to','for','of','with',
  'by','from','is','are','was','were','be','been','have','has','had',
  'do','does','did','will','would','could','should','may','might',
  'i','you','we','they','he','she','it','this','that','my','your',
  'our','their','how','what','when','where','why','who','which',
  "don't","i'm","it's","you're","we're","without","your","about",
  'just','more','some','can','get','use','also','not','need',
])

export function extractKeywords(text: string): Set<string> {
  return new Set(
    text.toLowerCase()
      .split(/\W+/)
      .filter(w => w.length > 3 && !STOP_WORDS.has(w))
  )
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  const intersection = [...a].filter(w => b.has(w)).length
  const union = new Set([...a, ...b]).size
  return union === 0 ? 0 : intersection / union
}

export type Backlink = {
  capture: Capture
  score: number
  sharedKeywords: string[]
}

export function findBacklinks(target: Capture, others: Capture[], threshold = 0.07): Backlink[] {
  const targetText = `${target.title} ${target.preview}`
  const targetKws = extractKeywords(targetText)

  return others
    .filter(c => c.id !== target.id)
    .map(c => {
      const cKws = extractKeywords(`${c.title} ${c.preview}`)
      const shared = [...targetKws].filter(w => cKws.has(w))
      const score = jaccardSimilarity(targetKws, cKws)
      return { capture: c, score, sharedKeywords: shared.slice(0, 4) }
    })
    .filter(b => b.score >= threshold)
    .sort((a, b) => b.score - a.score)
}

export function searchCaptures(question: string, captures: Capture[]): Capture[] {
  const qKws = extractKeywords(question)
  if (qKws.size === 0) return captures.slice(0, 5)

  const scored = captures.map(c => ({
    capture: c,
    score: [...qKws].filter(kw =>
      c.title.toLowerCase().includes(kw) ||
      c.preview.toLowerCase().includes(kw)
    ).length,
  }))

  const matched = scored.filter(s => s.score > 0).sort((a, b) => b.score - a.score)
  return (matched.length > 0 ? matched : scored).slice(0, 5).map(s => s.capture)
}
