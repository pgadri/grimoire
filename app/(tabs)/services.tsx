import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useState, useCallback } from 'react'
import { useFocusEffect, useRouter } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Colors, Spacing, Radius, Shadow, Typography } from '../../constants/theme'
import { getActivePlan } from '../../lib/purchases'
import type { PlanId } from '../../lib/purchases'
import { getScanHistory, type ScanRecord } from '../../lib/scanHistory'
import {
  TESTING_TIERS, getTestCampaigns, createTestCampaign,
  STATUS_LABEL, STATUS_COLOR,
  type TestingTier, type TestCampaign, type TierInfo,
} from '../../lib/testing'
import { getUser } from '../../lib/auth'

export default function ServicesScreen() {
  const router = useRouter()
  const [plan, setPlan] = useState<PlanId>('free')
  const [scanHistory, setScanHistory] = useState<ScanRecord[]>([])
  const [repoName, setRepoName] = useState<string | null>(null)

  // Testing state
  const [campaigns, setCampaigns] = useState<TestCampaign[]>([])
  const [selectedTier, setSelectedTier] = useState<TestingTier | null>(null)
  const [appName, setAppName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useFocusEffect(useCallback(() => {
    let active = true
    const load = async () => {
      const [planId, history, rawOnboarding, allCampaigns, user] = await Promise.all([
        getActivePlan(),
        getScanHistory(),
        AsyncStorage.getItem('grimoire:onboarding'),
        getTestCampaigns(),
        getUser(),
      ])
      if (!active) return
      setPlan(planId)
      setScanHistory(history)
      setCampaigns(allCampaigns)
      if (user?.email && !contactEmail) setContactEmail(user.email)
      if (rawOnboarding) {
        const od = JSON.parse(rawOnboarding)
        if (od.githubRepo) {
          const parts = od.githubRepo.replace(/^https?:\/\/github\.com\//, '').split('/')
          setRepoName(parts.slice(0, 2).join('/') || null)
        }
        if (od.appName && !appName) setAppName(od.appName)
      }
    }
    load()
    return () => { active = false }
  }, []))

  const handleRequestCampaign = async () => {
    if (!selectedTier) return
    if (!appName.trim()) { Alert.alert('Add your app name'); return }
    if (!contactEmail.includes('@')) { Alert.alert('Add a valid email'); return }
    setSubmitting(true)
    try {
      const campaign = await createTestCampaign({
        launchId: null,
        appName: appName.trim(),
        tier: selectedTier,
        contactEmail: contactEmail.trim().toLowerCase(),
      })
      setCampaigns(prev => [campaign, ...prev])
      setSelectedTier(null)
      const tier = TESTING_TIERS.find(t => t.id === selectedTier)!
      Alert.alert(
        'Campaign requested!',
        `We'll reach out to ${contactEmail} within ${tier.turnaround} to get started. You'll hear from us soon.`
      )
    } finally {
      setSubmitting(false)
    }
  }

  const isPaid = plan === 'solopreneur' || plan === 'team'

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.heading}>Expert Help</Text>
          <Text style={styles.sub}>Tools that help you ship with confidence</Text>
        </View>

        {/* Plan badge */}
        <View style={styles.planBadge}>
          <View style={[styles.planDot, { backgroundColor: isPaid ? Colors.success : Colors.gold }]} />
          <Text style={styles.planText}>
            {plan === 'free' ? 'Free plan · 20 captures / 10 threads' : plan === 'solopreneur' ? 'Solopreneur plan · Unlimited' : 'Team plan · All features'}
          </Text>
          {!isPaid && (
            <TouchableOpacity onPress={() => router.push('/paywall' as any)}>
              <Text style={styles.upgradeLink}>Upgrade ↗</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ─── Repo Monitoring ───────────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>REPO MONITORING</Text>
            {isPaid && (
              <View style={styles.paidBadge}>
                <Text style={styles.paidBadgeText}>ACTIVE</Text>
              </View>
            )}
          </View>

          <View style={styles.card}>
            <View style={styles.cardIconRow}>
              <View style={styles.cardIcon}>
                <Ionicons name="git-branch" size={20} color={Colors.primary} />
              </View>
              <View style={styles.cardIconText}>
                <Text style={styles.cardTitle}>Automated Repo Scans</Text>
                <Text style={styles.cardDesc}>
                  {isPaid
                    ? 'Weekly security scans of your repo. New risks trigger a push notification.'
                    : 'Upgrade to Solopreneur to get weekly automated scans and push alerts.'}
                </Text>
              </View>
            </View>

            {repoName ? (
              <View style={styles.repoRow}>
                <Ionicons name="git-branch-outline" size={13} color={Colors.primary} />
                <Text style={styles.repoName}>{repoName}</Text>
                {isPaid && (
                  <View style={styles.activePill}>
                    <Text style={styles.activePillText}>Weekly</Text>
                  </View>
                )}
              </View>
            ) : (
              <TouchableOpacity style={styles.connectBtn} onPress={() => router.push('/github-repo' as any)}>
                <Text style={styles.connectBtnText}>Connect a repo →</Text>
              </TouchableOpacity>
            )}

            {scanHistory.length > 0 ? (
              <View style={styles.historyList}>
                <Text style={styles.historyLabel}>SCAN HISTORY</Text>
                {scanHistory.slice(0, 5).map((s, i) => (
                  <View key={i} style={styles.historyRow}>
                    <Ionicons
                      name={s.risks === 0 ? 'checkmark-circle' : 'alert-circle'}
                      size={14}
                      color={s.risks === 0 ? Colors.success : Colors.gold}
                    />
                    <Text style={styles.historyDate}>
                      {new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </Text>
                    <Text style={styles.historyScore}>Score {s.score}</Text>
                    <Text style={[styles.historyRisks, { color: s.risks > 0 ? Colors.gold : Colors.success }]}>
                      {s.risks > 0 ? `${s.risks} risks` : 'Clean ✓'}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.historyEmpty}>
                <Text style={styles.historyEmptyText}>
                  {isPaid ? 'First automated scan runs within 24h of connecting your repo.' : 'Scan history appears here after you upgrade.'}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.scanNowBtn, !isPaid && styles.scanNowBtnLocked]}
              onPress={() => isPaid ? router.push('/readiness' as any) : router.push('/paywall' as any)}
            >
              <Ionicons name={isPaid ? 'scan-outline' : 'lock-closed-outline'} size={15} color={isPaid ? Colors.primary : Colors.textSecondary} />
              <Text style={[styles.scanNowText, !isPaid && styles.scanNowTextLocked]}>
                {isPaid ? 'View full readiness report' : 'Unlock with Solopreneur'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ─── App Testing ───────────────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>APP TESTING</Text>
            <View style={styles.betaBadge}>
              <Text style={styles.betaBadgeText}>BETA</Text>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.cardIconRow}>
              <View style={[styles.cardIcon, { backgroundColor: Colors.gold + '20' }]}>
                <Ionicons name="phone-portrait-outline" size={20} color={Colors.gold} />
              </View>
              <View style={styles.cardIconText}>
                <Text style={styles.cardTitle}>Real Device Testers</Text>
                <Text style={styles.cardDesc}>
                  Real users. Real devices. Structured feedback, bug reports, and a "ready to ship" verdict — all posted to your launch page.
                </Text>
              </View>
            </View>

            {/* Tier cards */}
            {TESTING_TIERS.map(tier => (
              <TierCard
                key={tier.id}
                tier={tier}
                selected={selectedTier === tier.id}
                onPress={() => setSelectedTier(selectedTier === tier.id ? null : tier.id)}
              />
            ))}

            {/* Request form */}
            {selectedTier && (
              <View style={styles.requestForm}>
                <Text style={styles.requestFormTitle}>Request {TESTING_TIERS.find(t => t.id === selectedTier)!.name} campaign</Text>
                <TextInput
                  style={styles.input}
                  placeholder="App name"
                  placeholderTextColor={Colors.textTertiary}
                  value={appName}
                  onChangeText={setAppName}
                />
                <TextInput
                  style={styles.input}
                  placeholder="your@email.com"
                  placeholderTextColor={Colors.textTertiary}
                  value={contactEmail}
                  onChangeText={setContactEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={[styles.joinBtn, (submitting || !appName.trim() || !contactEmail.includes('@')) && styles.joinBtnDisabled]}
                  onPress={handleRequestCampaign}
                  disabled={submitting || !appName.trim() || !contactEmail.includes('@')}
                >
                  <Text style={styles.joinBtnText}>
                    {submitting ? 'Requesting…' : `Request for $${TESTING_TIERS.find(t => t.id === selectedTier)!.price}`}
                  </Text>
                </TouchableOpacity>
                <Text style={styles.waitlistNote}>We'll reach out to confirm before charging anything.</Text>
              </View>
            )}
          </View>

          {/* Active campaigns */}
          {campaigns.length > 0 && (
            <View style={[styles.card, { marginTop: Spacing.sm }]}>
              <Text style={styles.inputLabel}>MY CAMPAIGNS</Text>
              {campaigns.map(c => (
                <View key={c.id} style={styles.campaignRow}>
                  <View style={styles.campaignInfo}>
                    <Text style={styles.campaignApp}>{c.appName}</Text>
                    <Text style={styles.campaignMeta}>
                      {TESTING_TIERS.find(t => t.id === c.tier)!.emoji} {TESTING_TIERS.find(t => t.id === c.tier)!.name} · {TESTING_TIERS.find(t => t.id === c.tier)!.testers} testers
                    </Text>
                  </View>
                  <View style={[styles.statusPill, { backgroundColor: STATUS_COLOR[c.status] + '20' }]}>
                    <Text style={[styles.statusText, { color: STATUS_COLOR[c.status] }]}>
                      {STATUS_LABEL[c.status]}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* ─── Security Audit ─────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>SECURITY</Text>

          <TouchableOpacity style={styles.auditCard} onPress={() => router.push('/review' as any)} activeOpacity={0.88}>
            <View style={[styles.cardIcon, { backgroundColor: Colors.gold + '20' }]}>
              <Ionicons name="shield-checkmark" size={20} color={Colors.gold} />
            </View>
            <View style={styles.auditText}>
              <Text style={styles.cardTitle}>Human Security Audit</Text>
              <Text style={styles.cardDesc}>Get your codebase reviewed by a vetted security engineer before launch.</Text>
            </View>
            <Ionicons name="arrow-forward" size={18} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* ─── Launch Checklist ───────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>LAUNCH PREP</Text>

          <TouchableOpacity style={styles.auditCard} onPress={() => router.push('/readiness' as any)} activeOpacity={0.88}>
            <View style={styles.cardIcon}>
              <Ionicons name="rocket-outline" size={20} color={Colors.primary} />
            </View>
            <View style={styles.auditText}>
              <Text style={styles.cardTitle}>Launch Readiness Report</Text>
              <Text style={styles.cardDesc}>Full risk breakdown with AI-powered fix prompts for each issue.</Text>
            </View>
            <Ionicons name="arrow-forward" size={18} color={Colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.auditCard, { marginTop: Spacing.sm }]} onPress={() => router.push('/launch-date' as any)} activeOpacity={0.88}>
            <View style={styles.cardIcon}>
              <Ionicons name="calendar-outline" size={20} color={Colors.primary} />
            </View>
            <View style={styles.auditText}>
              <Text style={styles.cardTitle}>Launch Runway</Text>
              <Text style={styles.cardDesc}>Set your launch date, track phases, get milestone reminders.</Text>
            </View>
            <Ionicons name="arrow-forward" size={18} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* ─── Coming Soon ────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>COMING SOON</Text>

          {[
            { icon: 'map-outline',      color: '#7C6AF7', title: 'Learning Maps',        desc: 'Organize captures into shareable learning paths for your stack.' },
            { icon: 'cube-outline',     color: '#10B981', title: 'Knowledge Packets',     desc: 'Bundle your best captures and sell them to other vibe coders.' },
            { icon: 'storefront-outline', color: '#F59E0B', title: 'Marketplace',         desc: 'Browse and buy curated knowledge packs from other builders.' },
            { icon: 'people-outline',   color: '#EF4444', title: 'Team Workspace',        desc: 'Collaborate on captures and track progress with co-founders.' },
            { icon: 'person-circle-outline', color: Colors.primary, title: 'Creator Profile', desc: 'Build a public profile and grow your audience as a builder.' },
          ].map(item => (
            <View key={item.title} style={[styles.auditCard, styles.comingSoonCard]}>
              <View style={[styles.cardIcon, { backgroundColor: item.color + '18' }]}>
                <Ionicons name={item.icon as any} size={20} color={item.color} />
              </View>
              <View style={styles.auditText}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardDesc}>{item.desc}</Text>
              </View>
              <View style={styles.soonBadge}>
                <Text style={styles.soonBadgeText}>SOON</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

function TierCard({ tier, selected, onPress }: { tier: TierInfo; selected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[tierStyles.card, selected && tierStyles.cardSelected]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={tierStyles.header}>
        <Text style={tierStyles.emoji}>{tier.emoji}</Text>
        <View style={tierStyles.headerText}>
          <Text style={[tierStyles.name, selected && tierStyles.nameSelected]}>{tier.name}</Text>
          <Text style={tierStyles.headline}>{tier.headline} · {tier.testers} testers · {tier.turnaround}</Text>
        </View>
        <Text style={[tierStyles.price, selected && tierStyles.priceSelected]}>${tier.price}</Text>
      </View>
      {selected && (
        <View style={tierStyles.features}>
          {tier.features.map((f, i) => (
            <Text key={i} style={tierStyles.feature}>✓  {f}</Text>
          ))}
        </View>
      )}
    </TouchableOpacity>
  )
}

const tierStyles = StyleSheet.create({
  card: {
    borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.background, padding: Spacing.md, gap: Spacing.sm,
  },
  cardSelected: { borderColor: Colors.primary, backgroundColor: Colors.primary + '06' },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  emoji: { fontSize: 18, width: 28, textAlign: 'center' },
  headerText: { flex: 1 },
  name: { fontSize: 14, fontWeight: '700', color: Colors.text },
  nameSelected: { color: Colors.primary },
  headline: { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },
  price: { fontSize: 16, fontWeight: '800', color: Colors.textSecondary },
  priceSelected: { color: Colors.primary },
  features: { gap: 5, paddingLeft: 38 },
  feature: { fontSize: 12, color: Colors.text, lineHeight: 18 },
})

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.lg, paddingBottom: 60 },
  header: { marginBottom: Spacing.md },
  heading: { fontSize: 28, fontWeight: '800', color: Colors.text },
  sub: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },

  planBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.card, borderRadius: Radius.full,
    paddingHorizontal: Spacing.md, paddingVertical: 10,
    marginBottom: Spacing.xl, ...Shadow.card,
  },
  planDot: { width: 8, height: 8, borderRadius: 4 },
  planText: { flex: 1, fontSize: 13, fontWeight: '600', color: Colors.text },
  upgradeLink: { fontSize: 13, fontWeight: '700', color: Colors.primary },

  section: { marginBottom: Spacing.xl },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm },
  sectionLabel: { ...Typography.sectionLabel, color: Colors.sectionLabel },
  paidBadge: {
    backgroundColor: Colors.success + '20', borderRadius: Radius.full,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  paidBadgeText: { fontSize: 9, fontWeight: '700', color: Colors.success },
  betaBadge: {
    backgroundColor: Colors.accent + '20', borderRadius: Radius.full,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  betaBadgeText: { fontSize: 9, fontWeight: '700', color: Colors.accent },

  card: {
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    padding: Spacing.lg, ...Shadow.card, gap: Spacing.md,
  },
  cardIconRow: { flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start' },
  cardIcon: {
    width: 40, height: 40, borderRadius: Radius.md,
    backgroundColor: Colors.primary + '15', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  cardIconText: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: 3 },
  cardDesc: { fontSize: 13, color: Colors.textSecondary, lineHeight: 19 },

  repoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: Spacing.xs },
  repoName: { flex: 1, fontSize: 13, fontWeight: '600', color: Colors.text },
  activePill: {
    backgroundColor: Colors.success + '20', borderRadius: Radius.full,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  activePillText: { fontSize: 10, fontWeight: '700', color: Colors.success },
  connectBtn: { alignSelf: 'flex-start' },
  connectBtnText: { fontSize: 13, fontWeight: '700', color: Colors.primary },

  historyList: { gap: 8 },
  historyLabel: { ...Typography.sectionLabel, color: Colors.sectionLabel, fontSize: 10, marginBottom: 4 },
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  historyDate: { fontSize: 12, color: Colors.textSecondary, width: 60 },
  historyScore: { fontSize: 12, fontWeight: '600', color: Colors.text, flex: 1 },
  historyRisks: { fontSize: 12, fontWeight: '600' },
  historyEmpty: {
    backgroundColor: Colors.background, borderRadius: Radius.sm, padding: Spacing.md,
  },
  historyEmptyText: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center' },

  scanNowBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderWidth: 1.5, borderColor: Colors.primary, borderRadius: Radius.full, paddingVertical: 11,
  },
  scanNowBtnLocked: { borderColor: Colors.border },
  scanNowText: { fontSize: 14, fontWeight: '700', color: Colors.primary },
  scanNowTextLocked: { color: Colors.textSecondary },

  requestForm: { gap: Spacing.sm },
  requestFormTitle: { fontSize: 13, fontWeight: '700', color: Colors.text },

  inputLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8, color: Colors.textSecondary },
  input: {
    backgroundColor: Colors.background, borderRadius: Radius.md,
    paddingHorizontal: Spacing.md, paddingVertical: 12,
    fontSize: 14, color: Colors.text, borderWidth: 1, borderColor: Colors.border,
  },
  joinBtn: {
    backgroundColor: Colors.primary, borderRadius: Radius.full,
    paddingVertical: 14, alignItems: 'center',
  },
  joinBtnDisabled: { backgroundColor: Colors.textTertiary },
  joinBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  waitlistNote: { fontSize: 11, color: Colors.textTertiary, textAlign: 'center' },

  campaignRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  campaignInfo: { flex: 1 },
  campaignApp: { fontSize: 13, fontWeight: '700', color: Colors.text },
  campaignMeta: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  statusPill: { borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: 11, fontWeight: '700' },

  auditCard: {
    backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.md,
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md, ...Shadow.card,
  },
  auditText: { flex: 1 },
  comingSoonCard: { marginTop: Spacing.sm, opacity: 0.75 },
  soonBadge: {
    backgroundColor: Colors.textTertiary + '25', borderRadius: Radius.full,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  soonBadgeText: { fontSize: 9, fontWeight: '700', color: Colors.textSecondary, letterSpacing: 0.5 },
})
