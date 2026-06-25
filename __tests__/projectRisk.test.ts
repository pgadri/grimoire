import { ProjectProfile } from '../lib/project'
import {
  RISK_DATABASE,
  matchRisks,
  readinessScore,
  countBySeverity,
} from '../lib/projectRisk'

// A representative "scared vibe coder about to launch" profile.
const launchingProfile: ProjectProfile = {
  name: 'Test App',
  stage: 'pre-launch',
  stack: ['expo', 'react-native', 'stripe', 'supabase', 'fastapi', 'openai', 'auth'],
  handlesPayments: true,
  storesUserData: true,
  updatedAt: new Date().toISOString(),
}

describe('RISK_DATABASE integrity', () => {
  it('has unique ids', () => {
    const ids = RISK_DATABASE.map(r => r.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('every risk ships a non-empty AI prompt and source', () => {
    for (const risk of RISK_DATABASE) {
      expect(risk.aiPrompt.length).toBeGreaterThan(20)
      expect(risk.source).toMatch(/verified/)
    }
  })
})

describe('matchRisks gating', () => {
  it('surfaces the Stripe webhook risk for a payments app on Stripe', () => {
    const ids = matchRisks(launchingProfile).map(r => r.id)
    expect(ids).toContain('stripe-webhook-verification')
  })

  it('hides payment risks when the app does not handle payments', () => {
    const noPayments = { ...launchingProfile, handlesPayments: false }
    const ids = matchRisks(noPayments).map(r => r.id)
    expect(ids).not.toContain('stripe-webhook-verification')
  })

  it('hides data/legal risks when the app stores no user data', () => {
    const noData = { ...launchingProfile, storesUserData: false }
    const ids = matchRisks(noData).map(r => r.id)
    expect(ids).not.toContain('supabase-rls-off')
    expect(ids).not.toContain('no-terms-privacy')
  })

  it('respects minStage — terms/privacy only fires at pre-launch or later', () => {
    const building = { ...launchingProfile, stage: 'building' as const }
    expect(matchRisks(building).map(r => r.id)).not.toContain('no-terms-privacy')

    const launched = { ...launchingProfile, stage: 'launched' as const }
    expect(matchRisks(launched).map(r => r.id)).toContain('no-terms-privacy')
  })

  it('only matches stack-specific risks when the stack is present', () => {
    const noSupabase = { ...launchingProfile, stack: ['expo', 'stripe'] as ProjectProfile['stack'] }
    expect(matchRisks(noSupabase).map(r => r.id)).not.toContain('supabase-rls-off')
  })

  it('returns no risks for an empty idea-stage project', () => {
    const idea: ProjectProfile = {
      name: 'Idea', stage: 'idea', stack: [], handlesPayments: false, storesUserData: false,
      updatedAt: new Date().toISOString(),
    }
    expect(matchRisks(idea)).toEqual([])
  })
})

describe('matchRisks ordering', () => {
  it('sorts unresolved before resolved', () => {
    const all = matchRisks(launchingProfile).map(r => r.id)
    const resolvedId = all[0]
    const sorted = matchRisks(launchingProfile, [resolvedId])
    expect(sorted[sorted.length - 1].id).toBe(resolvedId)
    expect(sorted[sorted.length - 1].resolved).toBe(true)
  })

  it('orders unresolved risks critical first', () => {
    const risks = matchRisks(launchingProfile)
    const severities = risks.filter(r => !r.resolved).map(r => r.severity)
    const rank = { critical: 0, high: 1, medium: 2 }
    for (let i = 1; i < severities.length; i++) {
      expect(rank[severities[i]]).toBeGreaterThanOrEqual(rank[severities[i - 1]])
    }
  })

  it('marks resolved risks based on the provided ids', () => {
    const first = matchRisks(launchingProfile)[0].id
    const result = matchRisks(launchingProfile, [first])
    expect(result.find(r => r.id === first)!.resolved).toBe(true)
  })
})

describe('readinessScore', () => {
  it('is 100 when no risks apply', () => {
    const idea: ProjectProfile = {
      name: 'Idea', stage: 'idea', stack: [], handlesPayments: false, storesUserData: false,
      updatedAt: new Date().toISOString(),
    }
    expect(readinessScore(idea)).toBe(100)
  })

  it('is 0 when risks apply and none are resolved', () => {
    expect(readinessScore(launchingProfile, [])).toBe(0)
  })

  it('is 100 when every applicable risk is resolved', () => {
    const allIds = matchRisks(launchingProfile).map(r => r.id)
    expect(readinessScore(launchingProfile, allIds)).toBe(100)
  })

  it('weights criticals more heavily than mediums', () => {
    const risks = matchRisks(launchingProfile)
    const critical = risks.find(r => r.severity === 'critical')!
    const medium = risks.find(r => r.severity === 'medium')!
    const scoreFromCritical = readinessScore(launchingProfile, [critical.id])
    const scoreFromMedium = readinessScore(launchingProfile, [medium.id])
    expect(scoreFromCritical).toBeGreaterThan(scoreFromMedium)
  })

  it('increases monotonically as more risks are resolved', () => {
    const ids = matchRisks(launchingProfile).map(r => r.id)
    let prev = readinessScore(launchingProfile, [])
    const accumulated: string[] = []
    for (const id of ids) {
      accumulated.push(id)
      const next = readinessScore(launchingProfile, [...accumulated])
      expect(next).toBeGreaterThanOrEqual(prev)
      prev = next
    }
    expect(prev).toBe(100)
  })
})

describe('countBySeverity', () => {
  it('counts only unresolved risks by severity', () => {
    const risks = matchRisks(launchingProfile)
    const counts = countBySeverity(risks)
    const manualCritical = risks.filter(r => !r.resolved && r.severity === 'critical').length
    expect(counts.critical).toBe(manualCritical)
  })

  it('excludes resolved risks from the counts', () => {
    const risks = matchRisks(launchingProfile)
    const firstCritical = risks.find(r => r.severity === 'critical')!
    const withResolved = matchRisks(launchingProfile, [firstCritical.id])
    const counts = countBySeverity(withResolved)
    expect(counts.critical).toBe(
      risks.filter(r => r.severity === 'critical').length - 1
    )
  })
})
