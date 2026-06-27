import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  KeyboardAvoidingView, Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Colors, Spacing, Radius, Shadow, Typography } from '../constants/theme'
import type { ProjectStage } from '../lib/project'

type DeveloperType = 'vibe_coder' | 'experienced_dev'
type WorkStyle = 'solo' | 'team'

const AI_PLATFORMS = [
  { id: 'cursor',      label: 'Cursor',         emoji: '🖱️' },
  { id: 'windsurf',    label: 'Windsurf',        emoji: '🏄' },
  { id: 'claude_code', label: 'Claude Code',     emoji: '✦'  },
  { id: 'copilot',     label: 'GitHub Copilot',  emoji: '🐙' },
  { id: 'bolt',        label: 'Bolt.new',        emoji: '⚡' },
  { id: 'lovable',     label: 'Lovable',         emoji: '💜' },
  { id: 'v0',          label: 'v0 (Vercel)',     emoji: '▲'  },
  { id: 'replit',      label: 'Replit AI',       emoji: '🔄' },
  { id: 'chatgpt',     label: 'ChatGPT',         emoji: '🤖' },
  { id: 'other',       label: 'Other',           emoji: '✨' },
]

const STAGE_OPTIONS: { value: ProjectStage; label: string; emoji: string; sub: string }[] = [
  { value: 'idea',       label: 'Just started',       emoji: '💡', sub: 'Idea only, nothing built yet' },
  { value: 'building',   label: 'Working prototype',  emoji: '🔨', sub: 'Something exists, still building' },
  { value: 'pre-launch', label: 'Pre-launch',         emoji: '🚀', sub: 'Almost ready to ship' },
  { value: 'launched',   label: 'Live & shipping',    emoji: '✅', sub: 'Already in users\' hands' },
]

const ONBOARDING_KEY = 'grimoire:onboarding'
export const ONBOARDED_KEY = 'grimoire:onboarded'
const TOTAL_STEPS = 5

export default function OnboardingScreen() {
  const router = useRouter()
  const [step, setStep]               = useState(0)
  const [devType, setDevType]         = useState<DeveloperType | null>(null)
  const [workStyle, setWorkStyle]     = useState<WorkStyle | null>(null)
  const [projectName, setProjectName] = useState('')
  const [projectStage, setProjectStage] = useState<ProjectStage>('building')
  const [aiPlatforms, setAiPlatforms] = useState<Set<string>>(new Set())
  const [githubRepo, setGithubRepo]   = useState('')

  const togglePlatform = (id: string) =>
    setAiPlatforms(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const canProceed = (): boolean => {
    if (step === 0) return devType !== null
    if (step === 1) return workStyle !== null
    if (step === 2) return projectName.trim().length > 0
    return true  // steps 3, 4 always proceed
  }

  const handleNext = async () => {
    if (step < TOTAL_STEPS - 1) {
      setStep(s => s + 1)
    } else {
      await finish()
    }
  }

  const finish = async () => {
    const data = {
      developerType: devType,
      workStyle,
      projectName: projectName.trim(),
      projectStage,
      aiPlatforms: Array.from(aiPlatforms),
      githubRepo: githubRepo.trim() || undefined,
      completedAt: new Date().toISOString(),
    }
    await AsyncStorage.multiSet([
      [ONBOARDING_KEY, JSON.stringify(data)],
      [ONBOARDED_KEY, 'true'],
    ])
    router.replace('/welcome')
  }

  const skip = async () => {
    await AsyncStorage.setItem(ONBOARDED_KEY, 'true')
    router.replace('/(tabs)')
  }

  const progressPct = `${((step + 1) / TOTAL_STEPS) * 100}%` as `${number}%`

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: progressPct }]} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {step === 0 && (
            <StepContainer
              kicker={`STEP 1 OF ${TOTAL_STEPS}`}
              title="How do you code?"
              sub="This helps Vibecoded tailor the experience just for you."
            >
              <IdentityCard
                selected={devType === 'vibe_coder'}
                emoji="🎯"
                title="Vibe Coder"
                desc="I build with AI — learning and shipping as I go."
                onPress={() => setDevType('vibe_coder')}
              />
              <IdentityCard
                selected={devType === 'experienced_dev'}
                emoji="⚙️"
                title="Developer using AI"
                desc="Experienced dev using AI to ship faster."
                onPress={() => setDevType('experienced_dev')}
              />
            </StepContainer>
          )}

          {step === 1 && (
            <StepContainer
              kicker={`STEP 2 OF ${TOTAL_STEPS}`}
              title="Solo or team?"
              sub="We customize features to match how you work."
            >
              <IdentityCard
                selected={workStyle === 'solo'}
                emoji="🧑‍💻"
                title="Solo Builder"
                desc="Just me, doing everything myself."
                onPress={() => setWorkStyle('solo')}
              />
              <IdentityCard
                selected={workStyle === 'team'}
                emoji="👥"
                title="Team"
                desc="Working with co-founders or teammates."
                onPress={() => setWorkStyle('team')}
              />
            </StepContainer>
          )}

          {step === 2 && (
            <StepContainer
              kicker={`STEP 3 OF ${TOTAL_STEPS}`}
              title="Your current project"
              sub="What are you building right now?"
            >
              <Text style={styles.fieldLabel}>PROJECT NAME</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. My recipe app"
                placeholderTextColor={Colors.textTertiary}
                value={projectName}
                onChangeText={setProjectName}
                maxLength={50}
                autoFocus
              />

              <Text style={[styles.fieldLabel, { marginTop: Spacing.lg }]}>WHERE ARE YOU AT?</Text>
              <View style={styles.stageGrid}>
                {STAGE_OPTIONS.map(s => (
                  <TouchableOpacity
                    key={s.value}
                    style={[styles.stageCard, projectStage === s.value && styles.stageCardActive]}
                    onPress={() => setProjectStage(s.value)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.stageEmoji}>{s.emoji}</Text>
                    <Text style={[styles.stageLabel, projectStage === s.value && styles.stageLabelActive]}>
                      {s.label}
                    </Text>
                    <Text style={styles.stageSub}>{s.sub}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </StepContainer>
          )}

          {step === 3 && (
            <StepContainer
              kicker={`STEP 4 OF ${TOTAL_STEPS}`}
              title="Your tools"
              sub="Which AI coding tools do you use? Select all that apply."
            >

              <View style={styles.platformGrid}>
                {AI_PLATFORMS.map(p => (
                  <TouchableOpacity
                    key={p.id}
                    style={[styles.platformChip, aiPlatforms.has(p.id) && styles.platformChipActive]}
                    onPress={() => togglePlatform(p.id)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.platformEmoji}>{p.emoji}</Text>
                    <Text style={[styles.platformLabel, aiPlatforms.has(p.id) && styles.platformLabelActive]}>
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.fieldLabel, { marginTop: Spacing.xl }]}>GITHUB REPO</Text>
              <Text style={styles.fieldHint}>Optional — we can scan your stack automatically</Text>
              <TextInput
                style={styles.input}
                placeholder="https://github.com/you/your-project"
                placeholderTextColor={Colors.textTertiary}
                value={githubRepo}
                onChangeText={setGithubRepo}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />
            </StepContainer>
          )}

          {step === 4 && (
            <StepContainer
              kicker={`STEP 5 OF ${TOTAL_STEPS}`}
              title="Your capture feed"
              sub="When you figure out something tricky — a RevenueCat gotcha, a Railway deploy trick — save it. You'll never re-Google it, and other builders learn from it too."
            >
              <View style={styles.captureHowRow}>
                {[
                  { emoji: '🔗', label: 'Paste a URL', sub: 'Docs, a tweet, a video — anything' },
                  { emoji: '✍️', label: 'Add key learnings', sub: 'Concepts that clicked for you' },
                  { emoji: '📤', label: 'Share it', sub: 'Help the next builder skip the struggle' },
                ].map(item => (
                  <View key={item.label} style={styles.captureHowItem}>
                    <Text style={styles.captureHowEmoji}>{item.emoji}</Text>
                    <Text style={styles.captureHowLabel}>{item.label}</Text>
                    <Text style={styles.captureHowSub}>{item.sub}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.captureMock}>
                <View style={styles.captureMockTop}>
                  <Text style={styles.captureMockSource}>RevenueCat Docs</Text>
                  <View style={styles.captureMockBadge}>
                    <Text style={styles.captureMockBadgeText}>technical</Text>
                  </View>
                </View>
                <Text style={styles.captureMockTitle}>How to integrate RevenueCat for iOS subscriptions</Text>
                {[
                  'expo install, not npm — avoids SIGABRT crashes',
                  'Purchases.configure() must run before any navigation',
                  'Check entitlements.active["pro"] to gate features',
                ].map((b, i) => (
                  <View key={i} style={styles.captureMockBullet}>
                    <Text style={styles.captureMockDot}>•</Text>
                    <Text style={styles.captureMockBulletText}>{b}</Text>
                  </View>
                ))}
              </View>
            </StepContainer>
          )}

        </ScrollView>

        <View style={styles.footer}>
          {step > 0 ? (
            <TouchableOpacity style={styles.backBtn} onPress={() => setStep(s => s - 1)}>
              <Ionicons name="arrow-back" size={20} color={Colors.text} />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 46 }} />
          )}

          <TouchableOpacity
            style={[styles.nextBtn, !canProceed() && styles.nextBtnDisabled]}
            onPress={handleNext}
            disabled={!canProceed()}
            activeOpacity={0.85}
          >
            <Text style={styles.nextBtnText}>
              {step === TOTAL_STEPS - 1 ? "Let's go!" : 'Continue'}
            </Text>
            <Ionicons
              name={step === TOTAL_STEPS - 1 ? 'checkmark' : 'arrow-forward'}
              size={18}
              color="#fff"
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.skipBtn} onPress={skip}>
          <Text style={styles.skipText}>Skip setup</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

function StepContainer({
  kicker, title, sub, children,
}: {
  kicker: string; title: string; sub: string; children: React.ReactNode
}) {
  return (
    <View>
      <Text style={styles.kicker}>{kicker}</Text>
      <Text style={styles.stepTitle}>{title}</Text>
      <Text style={styles.stepSub}>{sub}</Text>
      <View style={styles.stepContent}>{children}</View>
    </View>
  )
}

function IdentityCard({
  selected, emoji, title, desc, onPress,
}: {
  selected: boolean; emoji: string; title: string; desc: string; onPress: () => void
}) {
  return (
    <TouchableOpacity
      style={[styles.identityCard, selected && styles.identityCardActive]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={styles.identityEmoji}>{emoji}</Text>
      <View style={styles.identityText}>
        <Text style={[styles.identityTitle, selected && styles.identityTitleActive]}>{title}</Text>
        <Text style={styles.identityDesc}>{desc}</Text>
      </View>
      <View style={[styles.radio, selected && styles.radioActive]}>
        {selected && <View style={styles.radioDot} />}
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  progressTrack: { height: 3, backgroundColor: Colors.border },
  progressFill: { height: 3, backgroundColor: Colors.primary, borderRadius: 2 },

  scroll: { padding: Spacing.xl, paddingBottom: 24 },

  kicker: {
    fontSize: 11, fontWeight: '700', color: Colors.primary,
    letterSpacing: 1, marginBottom: Spacing.sm,
  },
  stepTitle: {
    fontSize: 30, fontWeight: '800', color: Colors.text,
    lineHeight: 36, marginBottom: Spacing.sm,
  },
  stepSub: {
    fontSize: 15, color: Colors.textSecondary,
    lineHeight: 22, marginBottom: Spacing.xl,
  },
  stepContent: { gap: Spacing.md },

  identityCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    padding: Spacing.lg, borderWidth: 2, borderColor: Colors.border,
    ...Shadow.card,
  },
  identityCardActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '08' },
  identityEmoji: { fontSize: 28 },
  identityText: { flex: 1 },
  identityTitle: { fontSize: 17, fontWeight: '700', color: Colors.text, marginBottom: 3 },
  identityTitleActive: { color: Colors.primary },
  identityDesc: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },
  radio: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 2, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  radioActive: { borderColor: Colors.primary },
  radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.primary },

  fieldLabel: {
    fontSize: 11, fontWeight: '700', color: Colors.textSecondary,
    letterSpacing: 0.5, marginBottom: 6,
  },
  fieldHint: { fontSize: 12, color: Colors.textTertiary, marginBottom: 8, marginTop: -4 },
  input: {
    backgroundColor: Colors.card, borderRadius: Radius.md,
    paddingHorizontal: Spacing.md, paddingVertical: 14,
    fontSize: 16, color: Colors.text, ...Shadow.card,
  },

  stageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  stageCard: {
    width: '47%', alignItems: 'center', paddingVertical: Spacing.md, paddingHorizontal: Spacing.sm,
    backgroundColor: Colors.card, borderRadius: Radius.md,
    borderWidth: 2, borderColor: Colors.border, gap: 4, ...Shadow.card,
  },
  stageCardActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '08' },
  stageEmoji: { fontSize: 22 },
  stageLabel: { fontSize: 13, fontWeight: '700', color: Colors.text, textAlign: 'center' },
  stageLabelActive: { color: Colors.primary },
  stageSub: { fontSize: 10, color: Colors.textTertiary, textAlign: 'center', lineHeight: 14 },

  platformGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  platformChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: Colors.card, borderRadius: Radius.full,
    borderWidth: 2, borderColor: Colors.border, ...Shadow.card,
  },
  platformChipActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '12' },
  platformEmoji: { fontSize: 16 },
  platformLabel: { fontSize: 13, fontWeight: '600', color: Colors.text },
  platformLabelActive: { color: Colors.primary },

  footer: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  backBtn: {
    width: 46, height: 46, borderRadius: Radius.full,
    backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: Colors.border,
  },
  nextBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.primary, borderRadius: Radius.full, paddingVertical: 15,
    ...Shadow.card,
  },
  nextBtnDisabled: { opacity: 0.35 },
  nextBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },

  skipBtn: { alignItems: 'center', paddingVertical: Spacing.md },
  skipText: { fontSize: 13, color: Colors.textTertiary, fontWeight: '600' },

  captureHowRow: {
    flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg,
  },
  captureHowItem: {
    flex: 1, alignItems: 'center', gap: 6,
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    padding: Spacing.md, borderWidth: 1.5, borderColor: Colors.border, ...Shadow.card,
  },
  captureHowEmoji: { fontSize: 24 },
  captureHowLabel: { fontSize: 12, fontWeight: '700', color: Colors.text, textAlign: 'center' },
  captureHowSub: { fontSize: 10, color: Colors.textSecondary, textAlign: 'center', lineHeight: 14 },

  captureMock: {
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    padding: Spacing.md, ...Shadow.card,
    borderWidth: 1.5, borderColor: Colors.primary + '30',
    gap: 8,
  },
  captureMockTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  captureMockSource: { fontSize: 11, fontWeight: '600', color: Colors.textSecondary },
  captureMockBadge: {
    backgroundColor: Colors.primary + '15', borderRadius: Radius.full,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  captureMockBadgeText: { fontSize: 10, fontWeight: '700', color: Colors.primary },
  captureMockTitle: { fontSize: 14, fontWeight: '700', color: Colors.text, lineHeight: 20 },
  captureMockBullet: { flexDirection: 'row', gap: 6, alignItems: 'flex-start' },
  captureMockDot: { fontSize: 12, color: Colors.primary, fontWeight: '800', marginTop: 1 },
  captureMockBulletText: { flex: 1, fontSize: 12, color: Colors.textSecondary, lineHeight: 18 },

})
