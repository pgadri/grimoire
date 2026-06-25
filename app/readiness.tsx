import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter, useFocusEffect } from 'expo-router'
import { useState, useCallback } from 'react'
import * as Clipboard from 'expo-clipboard'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Colors, Spacing, Radius, Shadow, Typography } from '../constants/theme'
import { getProjectProfile, ProjectProfile } from '../lib/project'
import {
  matchRisks, readinessScore, countBySeverity, MatchedRisk,
  RiskSeverity, RiskCategory, CATEGORY_LABELS,
} from '../lib/projectRisk'
import { ScoreCard } from '../components/ScoreCard'

const RESOLVED_KEY = 'grimoire:resolvedRisks'

const SEVERITY_COLOR: Record<RiskSeverity, string> = {
  critical: Colors.error,
  high: Colors.gold,
  medium: Colors.accent,
}

const SEVERITY_LABEL: Record<RiskSeverity, string> = {
  critical: 'CRITICAL',
  high: 'HIGH',
  medium: 'MEDIUM',
}

const CATEGORY_ICON: Record<RiskCategory, keyof typeof Ionicons.glyphMap> = {
  security: 'shield-checkmark-outline',
  legal: 'document-text-outline',
  cost: 'cash-outline',
  data: 'server-outline',
  infra: 'server-outline',
  payments: 'card-outline',
  appstore: 'phone-portrait-outline',
}

export default function ReadinessScreen() {
  const router = useRouter()
  const [profile, setProfile] = useState<ProjectProfile | null>(null)
  const [resolvedIds, setResolvedIds] = useState<string[]>([])
  const [expanded, setExpanded] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCard, setShowCard] = useState(false)

  useFocusEffect(useCallback(() => {
    let active = true
    const load = async () => {
      const p = await getProjectProfile()
      let resolved: string[] = []
      try {
        const raw = await AsyncStorage.getItem(RESOLVED_KEY)
        resolved = raw ? JSON.parse(raw) : []
      } catch {}
      if (active) {
        setProfile(p)
        setResolvedIds(resolved)
        setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, []))

  const toggleResolved = async (id: string) => {
    const next = resolvedIds.includes(id)
      ? resolvedIds.filter(x => x !== id)
      : [...resolvedIds, id]
    setResolvedIds(next)
    try {
      await AsyncStorage.setItem(RESOLVED_KEY, JSON.stringify(next))
    } catch {}
  }

  const copyPrompt = async (risk: MatchedRisk) => {
    await Clipboard.setStringAsync(risk.aiPrompt)
    setCopiedId(risk.id)
    setTimeout(() => setCopiedId(c => (c === risk.id ? null : c)), 2000)
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.center}><ActivityIndicator color={Colors.primary} /></View>
      </SafeAreaView>
    )
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <NavBar onBack={() => router.back()} title="Launch Readiness" />
        <View style={styles.center}>
          <Ionicons name="shield-outline" size={48} color={Colors.textTertiary} />
          <Text style={styles.emptyTitle}>Tell Grimoire about your project</Text>
          <Text style={styles.emptyBody}>
            Grimoire needs to know what you're building to warn you about what's coming.
          </Text>
          <TouchableOpacity style={styles.emptyCta} onPress={() => router.push('/onboarding')}>
            <Text style={styles.emptyCtaText}>Set up my project</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  const risks = matchRisks(profile, resolvedIds)
  const score = readinessScore(profile, resolvedIds)
  const counts = countBySeverity(risks)
  const openCount = risks.filter(r => !r.resolved).length

  const scoreColor = score >= 80 ? Colors.success : score >= 50 ? Colors.gold : Colors.error
  const scoreVerdict =
    score >= 80 ? "You're in good shape to launch"
    : score >= 50 ? 'Getting there — close the criticals'
    : 'Not ready — these will hurt you'

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <NavBar onBack={() => router.back()} title="Launch Readiness" onEdit={() => router.push('/onboarding')} onShare={() => setShowCard(true)} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Score hero */}
        <View style={styles.hero}>
          <View style={[styles.scoreRing, { borderColor: scoreColor }]}>
            <Text style={[styles.scoreNum, { color: scoreColor }]}>{score}</Text>
            <Text style={styles.scoreOf}>/ 100</Text>
          </View>
          <View style={styles.heroText}>
            <Text style={styles.heroProject}>{profile.name}</Text>
            <Text style={styles.heroVerdict}>{scoreVerdict}</Text>
            <View style={styles.severityRow}>
              {(['critical', 'high', 'medium'] as RiskSeverity[]).map(sev =>
                counts[sev] > 0 ? (
                  <View key={sev} style={styles.severityPill}>
                    <View style={[styles.severityDot, { backgroundColor: SEVERITY_COLOR[sev] }]} />
                    <Text style={styles.severityCount}>{counts[sev]} {SEVERITY_LABEL[sev].toLowerCase()}</Text>
                  </View>
                ) : null
              )}
            </View>
          </View>
        </View>

        {/* Upsell: human verification — the moment they want certainty */}
        <TouchableOpacity style={styles.expertCta} onPress={() => router.push('/review')} activeOpacity={0.9}>
          <View style={styles.expertIcon}>
            <Ionicons name="shield-checkmark" size={20} color={Colors.gold} />
          </View>
          <View style={styles.expertText}>
            <Text style={styles.expertTitle}>Want a human to verify this?</Text>
            <Text style={styles.expertSub}>Get your codebase audited by a vetted security engineer</Text>
          </View>
          <Ionicons name="arrow-forward" size={18} color={Colors.primary} />
        </TouchableOpacity>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>
            {openCount > 0 ? `${openCount} DANGER ZONE${openCount !== 1 ? 'S' : ''}` : 'DANGER ZONES'}
          </Text>
          <Text style={styles.sectionSub}>Tap to expand · paste the prompt into your AI</Text>
        </View>

        {risks.length === 0 ? (
          <View style={styles.allClear}>
            <Ionicons name="checkmark-circle" size={40} color={Colors.success} />
            <Text style={styles.allClearTitle}>No known risks for your stack</Text>
            <Text style={styles.allClearBody}>
              Add more of your stack in setup to surface deeper checks.
            </Text>
          </View>
        ) : (
          risks.map(risk => (
            <RiskCard
              key={risk.id}
              risk={risk}
              expanded={expanded === risk.id}
              copied={copiedId === risk.id}
              onToggleExpand={() => setExpanded(e => (e === risk.id ? null : risk.id))}
              onResolve={() => toggleResolved(risk.id)}
              onCopy={() => copyPrompt(risk)}
            />
          ))
        )}

        <Text style={styles.footnote}>
          Grimoire surfaces risks based on what you told it you're building. This is guidance from
          verified creators, not a guarantee — always review changes before you ship.
        </Text>
      </ScrollView>

      <ScoreCard
        visible={showCard}
        onClose={() => setShowCard(false)}
        score={score}
        name={profile.name}
        criticals={counts.critical}
        highs={counts.high}
        mediums={counts.medium}
        source="readiness"
      />
    </SafeAreaView>
  )
}

function NavBar({ onBack, title, onEdit, onShare }: { onBack: () => void; title: string; onEdit?: () => void; onShare?: () => void }) {
  return (
    <View style={styles.navBar}>
      <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
        <Ionicons name="arrow-back" size={20} color={Colors.text} />
      </TouchableOpacity>
      <Text style={styles.navTitle}>{title}</Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {onShare && (
          <TouchableOpacity onPress={onShare} style={styles.iconBtn}>
            <Ionicons name="share-outline" size={18} color={Colors.text} />
          </TouchableOpacity>
        )}
        {onEdit && (
          <TouchableOpacity onPress={onEdit} style={styles.iconBtn}>
            <Ionicons name="create-outline" size={18} color={Colors.text} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

function RiskCard({
  risk, expanded, copied, onToggleExpand, onResolve, onCopy,
}: {
  risk: MatchedRisk
  expanded: boolean
  copied: boolean
  onToggleExpand: () => void
  onResolve: () => void
  onCopy: () => void
}) {
  const color = SEVERITY_COLOR[risk.severity]
  return (
    <View style={[styles.riskCard, risk.resolved && styles.riskCardResolved]}>
      <TouchableOpacity style={styles.riskHeader} onPress={onToggleExpand} activeOpacity={0.8}>
        <View style={[styles.riskStripe, { backgroundColor: risk.resolved ? Colors.success : color }]} />
        <View style={styles.riskHeaderText}>
          <View style={styles.riskTags}>
            <View style={[styles.sevBadge, { backgroundColor: color + '1A' }]}>
              <Text style={[styles.sevBadgeText, { color }]}>{SEVERITY_LABEL[risk.severity]}</Text>
            </View>
            <View style={styles.catTag}>
              <Ionicons name={CATEGORY_ICON[risk.category]} size={11} color={Colors.textSecondary} />
              <Text style={styles.catTagText}>{CATEGORY_LABELS[risk.category]}</Text>
            </View>
          </View>
          <Text style={[styles.riskTitle, risk.resolved && styles.riskTitleResolved]}>
            {risk.title}
          </Text>
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={Colors.textTertiary}
        />
      </TouchableOpacity>

      {expanded && (
        <View style={styles.riskBody}>
          <Text style={styles.riskProblem}>{risk.problem}</Text>
          <View style={styles.whyRow}>
            <Ionicons name="alert-circle-outline" size={14} color={Colors.error} />
            <Text style={styles.whyText}>{risk.why}</Text>
          </View>

          <Text style={styles.promptLabel}>AI PROMPT</Text>
          <View style={styles.promptBox}>
            <Text style={styles.promptText}>{risk.aiPrompt}</Text>
          </View>
          <TouchableOpacity style={styles.copyBtn} onPress={onCopy} activeOpacity={0.85}>
            <Ionicons
              name={copied ? 'checkmark' : 'copy-outline'}
              size={15}
              color={copied ? Colors.success : Colors.card}
            />
            <Text style={[styles.copyBtnText, copied && { color: Colors.success }]}>
              {copied ? 'Copied!' : 'Copy AI prompt'}
            </Text>
          </TouchableOpacity>

          <View style={styles.riskFooter}>
            <Text style={styles.sourceText}>{risk.source}</Text>
            <TouchableOpacity style={styles.resolveBtn} onPress={onResolve}>
              <Ionicons
                name={risk.resolved ? 'checkmark-circle' : 'ellipse-outline'}
                size={16}
                color={risk.resolved ? Colors.success : Colors.textSecondary}
              />
              <Text style={[styles.resolveText, risk.resolved && { color: Colors.success }]}>
                {risk.resolved ? 'Resolved' : 'Mark resolved'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md, padding: Spacing.xl },
  navBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
  },
  iconBtn: {
    width: 36, height: 36, borderRadius: Radius.full,
    backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center', ...Shadow.card,
  },
  navTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  scroll: { padding: Spacing.lg, paddingBottom: 48 },
  hero: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.lg,
    backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.lg,
    marginBottom: Spacing.xl, ...Shadow.card,
  },
  scoreRing: {
    width: 88, height: 88, borderRadius: 44, borderWidth: 5,
    alignItems: 'center', justifyContent: 'center',
  },
  scoreNum: { fontSize: 30, fontWeight: '700', lineHeight: 34 },
  scoreOf: { fontSize: 11, color: Colors.textSecondary, fontWeight: '600' },
  heroText: { flex: 1 },
  heroProject: { ...Typography.cardTitle, color: Colors.text, marginBottom: 2 },
  heroVerdict: { ...Typography.caption, color: Colors.textSecondary, marginBottom: Spacing.sm },
  severityRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  severityPill: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  severityDot: { width: 8, height: 8, borderRadius: 4 },
  severityCount: { ...Typography.caption, color: Colors.text, fontWeight: '600' },
  expertCta: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.md,
    borderWidth: 1.5, borderColor: Colors.gold, marginBottom: Spacing.xl, ...Shadow.card,
  },
  expertIcon: {
    width: 40, height: 40, borderRadius: Radius.md, backgroundColor: Colors.gold + '1A',
    alignItems: 'center', justifyContent: 'center',
  },
  expertText: { flex: 1 },
  expertTitle: { ...Typography.cardBody, color: Colors.text, fontWeight: '700' },
  expertSub: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  sectionHeader: { marginBottom: Spacing.md },
  sectionLabel: { ...Typography.sectionLabel, color: Colors.sectionLabel },
  sectionSub: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  allClear: { alignItems: 'center', gap: Spacing.sm, padding: Spacing.xl, backgroundColor: Colors.card, borderRadius: Radius.lg, ...Shadow.card },
  allClearTitle: { ...Typography.cardTitle, color: Colors.text },
  allClearBody: { ...Typography.caption, color: Colors.textSecondary, textAlign: 'center' },
  riskCard: { backgroundColor: Colors.card, borderRadius: Radius.lg, marginBottom: Spacing.md, ...Shadow.card, overflow: 'hidden' },
  riskCardResolved: { opacity: 0.7 },
  riskHeader: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, gap: Spacing.sm },
  riskStripe: { width: 4, alignSelf: 'stretch', borderRadius: Radius.full, marginRight: 4 },
  riskHeaderText: { flex: 1 },
  riskTags: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  sevBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: Radius.full },
  sevBadgeText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.6 },
  catTag: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  catTagText: { fontSize: 10, color: Colors.textSecondary, fontWeight: '600' },
  riskTitle: { ...Typography.cardBody, color: Colors.text, fontWeight: '600', lineHeight: 19 },
  riskTitleResolved: { textDecorationLine: 'line-through', color: Colors.textSecondary },
  riskBody: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.md, gap: Spacing.sm },
  riskProblem: { ...Typography.cardBody, color: Colors.text, lineHeight: 20 },
  whyRow: { flexDirection: 'row', gap: 6, backgroundColor: Colors.error + '0C', borderRadius: Radius.sm, padding: Spacing.sm },
  whyText: { ...Typography.caption, color: Colors.text, flex: 1, lineHeight: 18 },
  promptLabel: { ...Typography.sectionLabel, color: Colors.sectionLabel, fontSize: 10, marginTop: 4 },
  promptBox: { backgroundColor: Colors.background, borderRadius: Radius.sm, padding: Spacing.md },
  promptText: { fontSize: 13, color: Colors.text, lineHeight: 19, fontFamily: 'Courier' },
  copyBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: Colors.primary, borderRadius: Radius.full, paddingVertical: 11,
  },
  copyBtnText: { ...Typography.button, color: Colors.card, fontSize: 14 },
  riskFooter: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 4, paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border,
  },
  sourceText: { ...Typography.caption, color: Colors.accent, fontWeight: '600' },
  resolveBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  resolveText: { ...Typography.caption, color: Colors.textSecondary, fontWeight: '600' },
  footnote: { ...Typography.caption, color: Colors.textTertiary, lineHeight: 17, marginTop: Spacing.md, textAlign: 'center' },
  emptyTitle: { ...Typography.cardTitle, color: Colors.text, textAlign: 'center' },
  emptyBody: { ...Typography.cardBody, color: Colors.textSecondary, textAlign: 'center', lineHeight: 21 },
  emptyCta: { backgroundColor: Colors.primary, borderRadius: Radius.full, paddingHorizontal: Spacing.xl, paddingVertical: 12, marginTop: Spacing.sm },
  emptyCtaText: { ...Typography.button, color: Colors.card },
})
