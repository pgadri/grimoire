import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  REVIEW_TIERS, getTier,
  scoreFromFindings, gradeFromScore, reportGrade, countFindings, sortFindings,
  statusStep, STATUS_FLOW,
  submitReviewRequest, getReviewRequest, clearReviewRequest,
  SAMPLE_REPORT, Finding,
} from '../lib/expertReview'

beforeEach(async () => {
  await AsyncStorage.clear()
})

const makeFinding = (id: string, severity: Finding['severity']): Finding => ({
  id,
  title: `Finding ${id}`,
  severity,
  category: 'security' as any,
  location: 'file.ts:1',
  description: 'desc',
  impact: 'impact',
  remediation: 'fix',
})

describe('tiers', () => {
  it('exposes three fixed, ascending-priced tiers', () => {
    expect(REVIEW_TIERS).toHaveLength(3)
    const prices = REVIEW_TIERS.map(t => t.price)
    expect(prices).toEqual([...prices].sort((a, b) => a - b))
  })

  it('has exactly one recommended tier', () => {
    expect(REVIEW_TIERS.filter(t => t.recommended)).toHaveLength(1)
  })

  it('getTier returns the matching tier and throws on unknown id', () => {
    expect(getTier('pro').name).toBe('Pro')
    // @ts-expect-error testing the runtime guard
    expect(() => getTier('nope')).toThrow()
  })
})

describe('scoreFromFindings', () => {
  it('is 100 for a clean codebase', () => {
    expect(scoreFromFindings([])).toBe(100)
  })

  it('subtracts more for critical than for low severity', () => {
    const critical = scoreFromFindings([makeFinding('a', 'critical')])
    const low = scoreFromFindings([makeFinding('a', 'low')])
    expect(low).toBeGreaterThan(critical)
  })

  it('never drops below 0 even with many criticals', () => {
    const many = Array.from({ length: 10 }, (_, i) => makeFinding(`c${i}`, 'critical'))
    expect(scoreFromFindings(many)).toBe(0)
  })
})

describe('gradeFromScore', () => {
  it.each([
    [100, 'A'], [90, 'A'], [89, 'B'], [80, 'B'],
    [79, 'C'], [70, 'C'], [69, 'D'], [60, 'D'], [59, 'F'], [0, 'F'],
  ])('maps %i to %s', (score, grade) => {
    expect(gradeFromScore(score)).toBe(grade)
  })
})

describe('reportGrade on the sample report', () => {
  it('produces a consistent score and grade', () => {
    const { score, grade } = reportGrade(SAMPLE_REPORT)
    expect(score).toBe(scoreFromFindings(SAMPLE_REPORT.findings))
    expect(grade).toBe(gradeFromScore(score))
  })

  it('the sample (2 critical + 2 high + 2 medium) scores an F', () => {
    // 2*30 + 2*18 + 2*8 = 112 penalty -> clamped to 0 -> F
    expect(reportGrade(SAMPLE_REPORT).grade).toBe('F')
  })
})

describe('countFindings', () => {
  it('tallies each severity', () => {
    const counts = countFindings([
      makeFinding('a', 'critical'),
      makeFinding('b', 'critical'),
      makeFinding('c', 'high'),
      makeFinding('d', 'low'),
    ])
    expect(counts).toEqual({ critical: 2, high: 1, medium: 0, low: 1 })
  })
})

describe('sortFindings', () => {
  it('orders critical first, low last', () => {
    const sorted = sortFindings([
      makeFinding('a', 'low'),
      makeFinding('b', 'critical'),
      makeFinding('c', 'medium'),
      makeFinding('d', 'high'),
    ])
    expect(sorted.map(f => f.severity)).toEqual(['critical', 'high', 'medium', 'low'])
  })

  it('does not mutate the input array', () => {
    const input = [makeFinding('a', 'low'), makeFinding('b', 'critical')]
    const before = input.map(f => f.id)
    sortFindings(input)
    expect(input.map(f => f.id)).toEqual(before)
  })
})

describe('status flow', () => {
  it('orders submitted -> in_review -> report_ready', () => {
    expect(STATUS_FLOW).toEqual(['submitted', 'in_review', 'report_ready'])
    expect(statusStep('submitted')).toBe(0)
    expect(statusStep('report_ready')).toBe(2)
  })
})

describe('request persistence', () => {
  it('returns null when nothing submitted', async () => {
    expect(await getReviewRequest()).toBeNull()
  })

  it('submits a request defaulting to submitted status', async () => {
    const req = await submitReviewRequest({
      projectName: 'My App',
      repoUrl: 'github.com/me/app',
      tierId: 'pro',
      contactEmail: 'me@email.com',
      notes: '',
    })
    expect(req.status).toBe('submitted')
    expect(req.id).toMatch(/^rev-/)
    expect(req.submittedAt).toBeTruthy()

    const loaded = await getReviewRequest()
    expect(loaded!.repoUrl).toBe('github.com/me/app')
    expect(loaded!.tierId).toBe('pro')
  })

  it('clears a request', async () => {
    await submitReviewRequest({
      projectName: 'X', repoUrl: 'r', tierId: 'essential', contactEmail: 'e', notes: '',
    })
    await clearReviewRequest()
    expect(await getReviewRequest()).toBeNull()
  })
})
