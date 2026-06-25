import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Modal,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter, useFocusEffect } from 'expo-router'
import { useState, useCallback } from 'react'
import { Colors, Spacing, Radius, Shadow, Typography } from '../constants/theme'
import {
  REVIEW_TIERS, ReviewTier, ReviewTierId, getTier,
  ReviewRequest, getReviewRequest, submitReviewRequest, clearReviewRequest,
  STATUS_FLOW, STATUS_LABELS, STATUS_DESCRIPTIONS, statusStep,
} from '../lib/expertReview'

export default function ReviewScreen() {
  const router = useRouter()
  const [request, setRequest] = useState<ReviewRequest | null>(null)
  const [selectedTier, setSelectedTier] = useState<ReviewTierId>('pro')
  const [showForm, setShowForm] = useState(false)

  useFocusEffect(useCallback(() => {
    getReviewRequest().then(setRequest)
  }, []))

  // If a review is already in flight, show its status instead of the pitch.
  if (request) {
    return (
      <StatusView
        request={request}
        onBack={() => router.back()}
        onViewReport={() => router.push('/review-report')}
        onCancel={async () => {
          await clearReviewRequest()
          setRequest(null)
        }}
      />
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <NavBar title="Expert Review" onBack={() => router.back()} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroBadge}>
            <Ionicons name="shield-checkmark" size={14} color={Colors.gold} />
            <Text style={styles.heroBadgeText}>HUMAN EXPERT AUDIT</Text>
          </View>
          <Text style={styles.heroTitle}>Don't launch blind.</Text>
          <Text style={styles.heroSub}>
            A vetted security engineer reviews your entire codebase, tests for vulnerabilities, and
            sends you a graded report — so you launch knowing exactly where you stand.
          </Text>
        </View>

        {/* Sample report teaser */}
        <TouchableOpacity style={styles.sampleCard} onPress={() => router.push('/review-report')} activeOpacity={0.9}>
          <View style={styles.sampleGrade}>
            <Text style={styles.sampleGradeLetter}>B</Text>
          </View>
          <View style={styles.sampleText}>
            <Text style={styles.sampleTitle}>See a sample report</Text>
            <Text style={styles.sampleSub}>Real findings, grades, and AI-ready fixes</Text>
          </View>
          <Ionicons name="arrow-forward" size={18} color={Colors.primary} />
        </TouchableOpacity>

        {/* How it works */}
        <Text style={styles.sectionLabel}>HOW IT WORKS</Text>
        <View style={styles.stepsCard}>
          {[
            { n: '1', t: 'Submit your repo', d: 'Share a GitHub link and tell us your stack.' },
            { n: '2', t: 'An expert audits it', d: 'A security engineer reviews and tests your code.' },
            { n: '3', t: 'Get your graded report', d: 'Prioritized findings with fixes you can paste into your AI.' },
          ].map((s, i) => (
            <View key={s.n} style={[styles.step, i < 2 && styles.stepBorder]}>
              <View style={styles.stepNum}><Text style={styles.stepNumText}>{s.n}</Text></View>
              <View style={styles.stepText}>
                <Text style={styles.stepTitle}>{s.t}</Text>
                <Text style={styles.stepDesc}>{s.d}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Tiers */}
        <Text style={styles.sectionLabel}>CHOOSE YOUR REVIEW</Text>
        {REVIEW_TIERS.map(tier => (
          <TierCard
            key={tier.id}
            tier={tier}
            selected={selectedTier === tier.id}
            onSelect={() => setSelectedTier(tier.id)}
          />
        ))}

        <TouchableOpacity style={styles.cta} onPress={() => setShowForm(true)} activeOpacity={0.9}>
          <Text style={styles.ctaText}>
            Continue with {getTier(selectedTier).name} · ${getTier(selectedTier).price}
          </Text>
        </TouchableOpacity>

        <Text style={styles.guarantee}>
          Vetted reviewers · {getTier(selectedTier).turnaroundDays}-day turnaround · Fixed price, no surprises
        </Text>
      </ScrollView>

      <SubmitForm
        visible={showForm}
        tier={getTier(selectedTier)}
        onClose={() => setShowForm(false)}
        onSubmit={async (data) => {
          const req = await submitReviewRequest({ ...data, tierId: selectedTier })
          setShowForm(false)
          setRequest(req)
        }}
      />
    </SafeAreaView>
  )
}

function TierCard({ tier, selected, onSelect }: { tier: ReviewTier; selected: boolean; onSelect: () => void }) {
  return (
    <TouchableOpacity
      style={[styles.tierCard, selected && styles.tierCardSelected]}
      onPress={onSelect}
      activeOpacity={0.9}
    >
      {tier.recommended && (
        <View style={styles.recommendBadge}>
          <Text style={styles.recommendText}>MOST POPULAR</Text>
        </View>
      )}
      <View style={styles.tierHeader}>
        <View style={styles.tierHeaderLeft}>
          <View style={[styles.radio, selected && styles.radioActive]}>
            {selected && <View style={styles.radioDot} />}
          </View>
          <View>
            <Text style={styles.tierName}>{tier.name}</Text>
            <Text style={styles.tierTagline}>{tier.tagline}</Text>
          </View>
        </View>
        <View style={styles.tierPriceCol}>
          <Text style={styles.tierPrice}>${tier.price}</Text>
          <Text style={styles.tierDays}>{tier.turnaroundDays} days</Text>
        </View>
      </View>
      {selected && (
        <View style={styles.tierScope}>
          {tier.scope.map((s, i) => (
            <View key={i} style={styles.scopeRow}>
              <Ionicons name="checkmark-circle" size={15} color={Colors.success} />
              <Text style={styles.scopeText}>{s}</Text>
            </View>
          ))}
        </View>
      )}
    </TouchableOpacity>
  )
}

function SubmitForm({
  visible, tier, onClose, onSubmit,
}: {
  visible: boolean
  tier: ReviewTier
  onClose: () => void
  onSubmit: (data: { projectName: string; repoUrl: string; contactEmail: string; notes: string }) => void
}) {
  const [projectName, setProjectName] = useState('')
  const [repoUrl, setRepoUrl] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [notes, setNotes] = useState('')

  const submit = () => {
    if (!repoUrl.trim() || !contactEmail.trim()) {
      Alert.alert('Almost there', 'Add your repo link and an email so we can send your report.')
      return
    }
    onSubmit({
      projectName: projectName.trim() || 'My project',
      repoUrl: repoUrl.trim(),
      contactEmail: contactEmail.trim(),
      notes: notes.trim(),
    })
    setProjectName(''); setRepoUrl(''); setContactEmail(''); setNotes('')
  }

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen">
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Submit for {tier.name} review</Text>
          <Text style={styles.sheetSub}>${tier.price} · {tier.turnaroundDays}-day turnaround</Text>

          <Text style={styles.formLabel}>PROJECT NAME</Text>
          <TextInput style={styles.formInput} placeholder="My recipe app" placeholderTextColor={Colors.textSecondary} value={projectName} onChangeText={setProjectName} />

          <Text style={styles.formLabel}>GITHUB REPO URL</Text>
          <TextInput style={styles.formInput} placeholder="github.com/you/your-repo" placeholderTextColor={Colors.textSecondary} value={repoUrl} onChangeText={setRepoUrl} autoCapitalize="none" autoCorrect={false} />

          <Text style={styles.formLabel}>EMAIL FOR YOUR REPORT</Text>
          <TextInput style={styles.formInput} placeholder="you@email.com" placeholderTextColor={Colors.textSecondary} value={contactEmail} onChangeText={setContactEmail} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" />

          <Text style={styles.formLabel}>ANYTHING WE SHOULD KNOW? (OPTIONAL)</Text>
          <TextInput style={[styles.formInput, styles.formInputMulti]} placeholder="e.g. I'm most worried about my payment flow" placeholderTextColor={Colors.textSecondary} value={notes} onChangeText={setNotes} multiline />

          <TouchableOpacity style={styles.submitBtn} onPress={submit} activeOpacity={0.9}>
            <Text style={styles.submitBtnText}>Request review · ${tier.price}</Text>
          </TouchableOpacity>
          <Text style={styles.formNote}>You won't be charged until a reviewer is assigned.</Text>
        </View>
      </View>
    </Modal>
  )
}

function StatusView({
  request, onBack, onViewReport, onCancel,
}: {
  request: ReviewRequest
  onBack: () => void
  onViewReport: () => void
  onCancel: () => void
}) {
  const tier = getTier(request.tierId)
  const current = statusStep(request.status)

  const confirmCancel = () => {
    Alert.alert('Cancel this review?', 'Your request will be withdrawn.', [
      { text: 'Keep it', style: 'cancel' },
      { text: 'Cancel review', style: 'destructive', onPress: onCancel },
    ])
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <NavBar title="Your Review" onBack={onBack} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.statusHeader}>
          <Text style={styles.statusProject}>{request.projectName}</Text>
          <Text style={styles.statusTier}>{tier.name} review · ${tier.price}</Text>
        </View>

        <View style={styles.timeline}>
          {STATUS_FLOW.map((s, i) => {
            const done = i < current
            const active = i === current
            return (
              <View key={s} style={styles.timelineRow}>
                <View style={styles.timelineLeft}>
                  <View style={[styles.timelineDot, (done || active) && styles.timelineDotActive, active && styles.timelineDotCurrent]}>
                    {done && <Ionicons name="checkmark" size={13} color={Colors.card} />}
                  </View>
                  {i < STATUS_FLOW.length - 1 && <View style={[styles.timelineLine, done && styles.timelineLineActive]} />}
                </View>
                <View style={styles.timelineText}>
                  <Text style={[styles.timelineLabel, (done || active) && styles.timelineLabelActive]}>
                    {STATUS_LABELS[s]}
                  </Text>
                  {active && <Text style={styles.timelineDesc}>{STATUS_DESCRIPTIONS[s]}</Text>}
                </View>
              </View>
            )
          })}
        </View>

        {request.status === 'report_ready' ? (
          <TouchableOpacity style={styles.cta} onPress={onViewReport} activeOpacity={0.9}>
            <Text style={styles.ctaText}>View your graded report</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.previewBtn} onPress={onViewReport} activeOpacity={0.9}>
            <Ionicons name="document-text-outline" size={16} color={Colors.primary} />
            <Text style={styles.previewBtnText}>See a sample report while you wait</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.cancelLink} onPress={confirmCancel}>
          <Text style={styles.cancelLinkText}>Cancel review</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

function NavBar({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <View style={styles.navBar}>
      <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
        <Ionicons name="arrow-back" size={20} color={Colors.text} />
      </TouchableOpacity>
      <Text style={styles.navTitle}>{title}</Text>
      <View style={styles.iconBtn} />
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
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
  hero: { marginBottom: Spacing.lg },
  heroBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start',
    backgroundColor: Colors.gold + '1A', paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: Radius.full, marginBottom: Spacing.md,
  },
  heroBadgeText: { fontSize: 10, fontWeight: '700', color: '#B8860B', letterSpacing: 0.6 },
  heroTitle: { fontSize: 28, fontWeight: '700', color: Colors.text, marginBottom: Spacing.sm },
  heroSub: { ...Typography.cardBody, color: Colors.textSecondary, lineHeight: 21 },
  sampleCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.md,
    borderWidth: 1.5, borderColor: Colors.primary, marginBottom: Spacing.xl, ...Shadow.card,
  },
  sampleGrade: {
    width: 44, height: 44, borderRadius: Radius.md, backgroundColor: Colors.gold,
    alignItems: 'center', justifyContent: 'center',
  },
  sampleGradeLetter: { fontSize: 22, fontWeight: '700', color: Colors.card },
  sampleText: { flex: 1 },
  sampleTitle: { ...Typography.cardBody, color: Colors.text, fontWeight: '700' },
  sampleSub: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  sectionLabel: { ...Typography.sectionLabel, color: Colors.sectionLabel, marginBottom: Spacing.md, marginTop: Spacing.sm },
  stepsCard: { backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.xl, ...Shadow.card },
  step: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md },
  stepBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  stepNum: {
    width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  stepNumText: { color: Colors.card, fontWeight: '700', fontSize: 14 },
  stepText: { flex: 1 },
  stepTitle: { ...Typography.cardBody, color: Colors.text, fontWeight: '600' },
  stepDesc: { ...Typography.caption, color: Colors.textSecondary, marginTop: 1 },
  tierCard: {
    backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.md,
    marginBottom: Spacing.md, borderWidth: 1.5, borderColor: Colors.card, ...Shadow.card,
  },
  tierCardSelected: { borderColor: Colors.primary },
  recommendBadge: {
    alignSelf: 'flex-start', backgroundColor: Colors.gold + '22',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full, marginBottom: Spacing.sm,
  },
  recommendText: { fontSize: 9, fontWeight: '700', color: '#B8860B', letterSpacing: 0.6 },
  tierHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tierHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flex: 1 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: Colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary },
  tierName: { ...Typography.cardTitle, color: Colors.text },
  tierTagline: { ...Typography.caption, color: Colors.textSecondary, marginTop: 1, maxWidth: 180 },
  tierPriceCol: { alignItems: 'flex-end' },
  tierPrice: { fontSize: 22, fontWeight: '700', color: Colors.text },
  tierDays: { ...Typography.caption, color: Colors.textSecondary },
  tierScope: { marginTop: Spacing.md, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border, gap: Spacing.sm },
  scopeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  scopeText: { ...Typography.caption, color: Colors.text, flex: 1, lineHeight: 18 },
  cta: { backgroundColor: Colors.primary, borderRadius: Radius.full, paddingVertical: 16, alignItems: 'center', marginTop: Spacing.sm },
  ctaText: { ...Typography.button, color: Colors.card, fontSize: 16 },
  guarantee: { ...Typography.caption, color: Colors.textTertiary, textAlign: 'center', marginTop: Spacing.md },
  // form
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: Colors.overlay },
  sheet: { backgroundColor: Colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: Spacing.xl, paddingBottom: 40 },
  sheetHandle: { width: 36, height: 4, backgroundColor: Colors.border, borderRadius: Radius.full, alignSelf: 'center', marginBottom: Spacing.lg },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  sheetSub: { ...Typography.caption, color: Colors.textSecondary, marginBottom: Spacing.md },
  formLabel: { ...Typography.sectionLabel, color: Colors.sectionLabel, fontSize: 10, marginTop: Spacing.md, marginBottom: 6 },
  formInput: { backgroundColor: Colors.background, borderRadius: Radius.md, padding: Spacing.md, fontSize: 15, color: Colors.text },
  formInputMulti: { minHeight: 64, textAlignVertical: 'top' },
  submitBtn: { backgroundColor: Colors.primary, borderRadius: Radius.full, paddingVertical: 15, alignItems: 'center', marginTop: Spacing.lg },
  submitBtnText: { ...Typography.button, color: Colors.card },
  formNote: { ...Typography.caption, color: Colors.textTertiary, textAlign: 'center', marginTop: Spacing.sm },
  // status
  statusHeader: { marginBottom: Spacing.xl },
  statusProject: { fontSize: 22, fontWeight: '700', color: Colors.text },
  statusTier: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  timeline: { backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.xl, ...Shadow.card },
  timelineRow: { flexDirection: 'row', gap: Spacing.md },
  timelineLeft: { alignItems: 'center', width: 26 },
  timelineDot: {
    width: 26, height: 26, borderRadius: 13, backgroundColor: Colors.background,
    borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center',
  },
  timelineDotActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  timelineDotCurrent: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  timelineLine: { width: 2, flex: 1, backgroundColor: Colors.border, minHeight: 28 },
  timelineLineActive: { backgroundColor: Colors.primary },
  timelineText: { flex: 1, paddingBottom: Spacing.lg },
  timelineLabel: { ...Typography.cardBody, color: Colors.textSecondary, fontWeight: '600' },
  timelineLabelActive: { color: Colors.text },
  timelineDesc: { ...Typography.caption, color: Colors.textSecondary, marginTop: 3, lineHeight: 17 },
  previewBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    borderWidth: 1.5, borderColor: Colors.primary, borderRadius: Radius.full, paddingVertical: 14,
  },
  previewBtnText: { ...Typography.button, color: Colors.primary },
  cancelLink: { alignItems: 'center', paddingVertical: Spacing.lg },
  cancelLinkText: { ...Typography.caption, color: Colors.error, fontWeight: '600' },
})
