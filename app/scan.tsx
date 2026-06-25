import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Animated, ActivityIndicator, Keyboard,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useState, useRef, useEffect } from 'react'
import * as Clipboard from 'expo-clipboard'
import { Colors, Spacing, Radius, Shadow, Typography } from '../constants/theme'
import {
  scanRepo, parseRepoInput, ScanResult, ScanFinding, ScanSeverity,
  SEVERITY_COLOR, SEVERITY_LABEL, labelStack,
} from '../lib/scanner'
import { ScoreCard } from '../components/ScoreCard'

const SCAN_STEPS = [
  'Reading repo structure...',
  'Checking for exposed secrets...',
  'Scanning dependencies...',
  'Reviewing legal files...',
  'Calculating readiness score...',
]

type ScreenState = 'idle' | 'scanning' | 'done' | 'error'

export default function ScanScreen() {
  const router = useRouter()
  const [url, setUrl] = useState('')
  const [screen, setScreen] = useState<ScreenState>('idle')
  const [result, setResult] = useState<ScanResult | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [stepIndex, setStepIndex] = useState(0)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [showCard, setShowCard] = useState(false)

  const progressAnim = useRef(new Animated.Value(0)).current
  const stepTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  const startScan = async () => {
    const slug = parseRepoInput(url)
    if (!slug.includes('/')) {
      setErrorMsg('Enter a valid GitHub repo: owner/repo or github.com/owner/repo')
      setScreen('error')
      return
    }

    Keyboard.dismiss()
    setScreen('scanning')
    setStepIndex(0)
    setResult(null)
    setErrorMsg('')

    progressAnim.setValue(0)
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 6000,
      useNativeDriver: false,
    }).start()

    let step = 0
    stepTimer.current = setInterval(() => {
      step += 1
      if (step < SCAN_STEPS.length) setStepIndex(step)
      else if (stepTimer.current) clearInterval(stepTimer.current)
    }, 1200)

    try {
      const data = await scanRepo(slug)
      if (stepTimer.current) clearInterval(stepTimer.current)
      setResult(data)
      setExpanded(data.findings[0]?.id ?? null)
      setScreen('done')
    } catch (err: any) {
      if (stepTimer.current) clearInterval(stepTimer.current)
      setErrorMsg(err.message ?? 'Scan failed. Check the repo URL and try again.')
      setScreen('error')
    }
  }

  useEffect(() => {
    return () => { if (stepTimer.current) clearInterval(stepTimer.current) }
  }, [])

  const copyPrompt = async (finding: ScanFinding) => {
    await Clipboard.setStringAsync(finding.aiPrompt)
    setCopiedId(finding.id)
    setTimeout(() => setCopiedId(c => (c === finding.id ? null : c)), 2000)
  }

  const scoreColor = result
    ? result.score >= 80 ? Colors.success : result.score >= 50 ? Colors.gold : Colors.error
    : Colors.textTertiary

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={20} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Scan a Repo</Text>
        <View style={styles.iconBtn} />
      </View>

      {screen === 'idle' && (
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.heroBlock}>
            <View style={styles.heroIcon}>
              <Ionicons name="git-branch-outline" size={32} color={Colors.primary} />
            </View>
            <Text style={styles.heroTitle}>GitHub repo scanner</Text>
            <Text style={styles.heroSub}>
              Drop any public GitHub repo URL and Grimoire will surface launch risks in seconds.
            </Text>
          </View>

          <View style={styles.inputCard}>
            <Text style={styles.inputLabel}>REPO URL</Text>
            <View style={styles.inputRow}>
              <Ionicons name="logo-github" size={18} color={Colors.textSecondary} />
              <TextInput
                style={styles.input}
                value={url}
                onChangeText={setUrl}
                placeholder="github.com/username/your-app"
                placeholderTextColor={Colors.textTertiary}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="go"
                onSubmitEditing={startScan}
              />
              {url.length > 0 && (
                <TouchableOpacity onPress={() => setUrl('')}>
                  <Ionicons name="close-circle" size={16} color={Colors.textTertiary} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <TouchableOpacity
            style={[styles.scanBtn, !url.trim() && styles.scanBtnDisabled]}
            onPress={startScan}
            disabled={!url.trim()}
            activeOpacity={0.85}
          >
            <Ionicons name="scan-outline" size={18} color={Colors.card} />
            <Text style={styles.scanBtnText}>Scan Repo</Text>
          </TouchableOpacity>

          <Text style={styles.note}>
            Works with any public GitHub repo — no login required. Private repos need a GitHub token in settings.
          </Text>

          <View style={styles.checksCard}>
            <Text style={styles.checksTitle}>What we check</Text>
            {[
              ['shield-outline', 'Exposed .env files and secrets'],
              ['document-text-outline', 'Terms of Service & Privacy Policy'],
              ['server-outline', 'Error monitoring and .gitignore'],
              ['alert-circle-outline', 'Package dependencies for known issues'],
            ].map(([icon, label]) => (
              <View key={label} style={styles.checkRow}>
                <Ionicons name={icon as any} size={15} color={Colors.accent} />
                <Text style={styles.checkLabel}>{label}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      {screen === 'scanning' && (
        <View style={styles.scanningBlock}>
          <ActivityIndicator size="large" color={Colors.primary} style={{ marginBottom: Spacing.xl }} />
          <Text style={styles.scanningRepo}>{parseRepoInput(url)}</Text>
          <Text style={styles.scanningStep}>{SCAN_STEPS[stepIndex]}</Text>

          <View style={styles.progressTrack}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>

          <View style={styles.stepList}>
            {SCAN_STEPS.slice(0, -1).map((step, i) => (
              <View key={step} style={styles.stepItem}>
                <Ionicons
                  name={i < stepIndex ? 'checkmark-circle' : i === stepIndex ? 'radio-button-on' : 'ellipse-outline'}
                  size={14}
                  color={i < stepIndex ? Colors.success : i === stepIndex ? Colors.primary : Colors.textTertiary}
                />
                <Text style={[styles.stepText, i < stepIndex && styles.stepDone, i === stepIndex && styles.stepActive]}>
                  {step}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {screen === 'error' && (
        <View style={styles.errorBlock}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.error} />
          <Text style={styles.errorTitle}>Scan failed</Text>
          <Text style={styles.errorMsg}>{errorMsg}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => setScreen('idle')}>
            <Text style={styles.retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      )}

      {screen === 'done' && result && (
        <>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Score hero */}
          <View style={styles.resultHero}>
            <View style={[styles.scoreRing, { borderColor: scoreColor }]}>
              <Text style={[styles.scoreNum, { color: scoreColor }]}>{result.score}</Text>
              <Text style={styles.scoreOf}>/ 100</Text>
            </View>
            <View style={styles.heroText}>
              <Text style={styles.repoName}>{result.owner}/{result.repo}</Text>
              <Text style={styles.resultVerdict}>
                {result.score >= 80 ? "Looking good — a few things to polish"
                  : result.score >= 50 ? "Getting there — close the criticals first"
                  : "Not ready — fix these before you ship"}
              </Text>
              {result.detectedStack.length > 0 && (
                <View style={styles.stackRow}>
                  {result.detectedStack.map(tag => (
                    <View key={tag} style={styles.stackChip}>
                      <Text style={styles.stackChipText}>{labelStack(tag)}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>

          {/* Expert upsell */}
          <TouchableOpacity style={styles.expertCta} onPress={() => router.push('/review')} activeOpacity={0.9}>
            <View style={styles.expertIcon}>
              <Ionicons name="shield-checkmark" size={18} color={Colors.gold} />
            </View>
            <View style={styles.expertText}>
              <Text style={styles.expertTitle}>Want a human to verify this?</Text>
              <Text style={styles.expertSub}>Get audited by a vetted security engineer</Text>
            </View>
            <Ionicons name="arrow-forward" size={16} color={Colors.primary} />
          </TouchableOpacity>

          {result.findings.length === 0 ? (
            <View style={styles.allClear}>
              <Ionicons name="checkmark-circle" size={40} color={Colors.success} />
              <Text style={styles.allClearTitle}>No issues found</Text>
              <Text style={styles.allClearSub}>Surface-level scan passed. Get a full audit to go deeper.</Text>
            </View>
          ) : (
            <>
              <Text style={styles.findingsLabel}>{result.findings.length} ISSUE{result.findings.length !== 1 ? 'S' : ''} FOUND</Text>
              {result.findings.map(finding => (
                <FindingCard
                  key={finding.id}
                  finding={finding}
                  expanded={expanded === finding.id}
                  copied={copiedId === finding.id}
                  onToggle={() => setExpanded(e => e === finding.id ? null : finding.id)}
                  onCopy={() => copyPrompt(finding)}
                />
              ))}
            </>
          )}

          <View style={styles.doneActions}>
            <TouchableOpacity style={styles.shareScoreBtn} onPress={() => setShowCard(true)} activeOpacity={0.85}>
              <Ionicons name="share-outline" size={16} color={Colors.card} />
              <Text style={styles.shareScoreBtnText}>Share score</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.rescanBtn} onPress={() => setScreen('idle')}>
              <Ionicons name="scan-outline" size={15} color={Colors.primary} />
              <Text style={styles.rescanText}>Scan another repo</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.footnote}>
            This is a surface-level scan of publicly visible files. It does not read private files or commit history.
            Use Expert Review for a full audit.
          </Text>
        </ScrollView>

        <ScoreCard
          visible={showCard}
          onClose={() => setShowCard(false)}
          score={result.score}
          name={`${result.owner}/${result.repo}`}
          criticals={result.findings.filter(f => f.severity === 'critical').length}
          highs={result.findings.filter(f => f.severity === 'high').length}
          mediums={result.findings.filter(f => f.severity === 'medium').length}
          source="scan"
        />
        </>
      )}
    </SafeAreaView>
  )
}

function FindingCard({
  finding, expanded, copied, onToggle, onCopy,
}: {
  finding: ScanFinding
  expanded: boolean
  copied: boolean
  onToggle: () => void
  onCopy: () => void
}) {
  const color = SEVERITY_COLOR[finding.severity as ScanSeverity] ?? Colors.textSecondary
  const label = SEVERITY_LABEL[finding.severity as ScanSeverity] ?? finding.severity.toUpperCase()

  return (
    <View style={styles.findingCard}>
      <TouchableOpacity style={styles.findingHeader} onPress={onToggle} activeOpacity={0.8}>
        <View style={[styles.findingStripe, { backgroundColor: color }]} />
        <View style={styles.findingHeaderText}>
          <View style={styles.findingTags}>
            <View style={[styles.sevBadge, { backgroundColor: color + '1A' }]}>
              <Text style={[styles.sevBadgeText, { color }]}>{label}</Text>
            </View>
            <Text style={styles.catText}>{finding.category}</Text>
          </View>
          <Text style={styles.findingTitle}>{finding.title}</Text>
        </View>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.textTertiary} />
      </TouchableOpacity>

      {expanded && (
        <View style={styles.findingBody}>
          <Text style={styles.findingDesc}>{finding.description}</Text>

          <Text style={styles.promptLabel}>AI PROMPT</Text>
          <View style={styles.promptBox}>
            <Text style={styles.promptText}>{finding.aiPrompt}</Text>
          </View>

          <TouchableOpacity style={styles.copyBtn} onPress={onCopy} activeOpacity={0.85}>
            <Ionicons
              name={copied ? 'checkmark' : 'copy-outline'}
              size={15}
              color={copied ? Colors.success : Colors.card}
            />
            <Text style={[styles.copyBtnText, copied && { color: Colors.success }]}>
              {copied ? 'Copied!' : 'Copy AI fix'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
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

  // Idle
  heroBlock: { alignItems: 'center', paddingVertical: Spacing.xl, gap: Spacing.md },
  heroIcon: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.primary + '15',
    alignItems: 'center', justifyContent: 'center',
  },
  heroTitle: { fontSize: 22, fontWeight: '700', color: Colors.text },
  heroSub: { ...Typography.cardBody, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  inputCard: {
    backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.md,
    marginBottom: Spacing.md, ...Shadow.card,
  },
  inputLabel: { ...Typography.sectionLabel, color: Colors.sectionLabel, fontSize: 10, marginBottom: 8 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  input: { flex: 1, fontSize: 15, color: Colors.text, paddingVertical: 4 },
  scanBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    backgroundColor: Colors.primary, borderRadius: Radius.full, paddingVertical: 15,
    marginBottom: Spacing.md, ...Shadow.card,
  },
  scanBtnDisabled: { opacity: 0.45 },
  scanBtnText: { ...Typography.button, color: Colors.card, fontSize: 16 },
  note: { ...Typography.caption, color: Colors.textTertiary, textAlign: 'center', lineHeight: 18, marginBottom: Spacing.xl },
  checksCard: {
    backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.lg,
    gap: Spacing.sm, ...Shadow.card,
  },
  checksTitle: { fontSize: 13, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkLabel: { ...Typography.caption, color: Colors.textSecondary },

  // Scanning
  scanningBlock: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, gap: Spacing.sm },
  scanningRepo: { fontSize: 17, fontWeight: '700', color: Colors.text },
  scanningStep: { ...Typography.cardBody, color: Colors.textSecondary, marginBottom: Spacing.md },
  progressTrack: {
    width: '100%', height: 6, backgroundColor: Colors.border,
    borderRadius: Radius.full, overflow: 'hidden', marginBottom: Spacing.xl,
  },
  progressFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: Radius.full },
  stepList: { width: '100%', gap: 12 },
  stepItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepText: { ...Typography.caption, color: Colors.textTertiary },
  stepDone: { color: Colors.success, textDecorationLine: 'line-through' },
  stepActive: { color: Colors.text, fontWeight: '600' },

  // Error
  errorBlock: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, gap: Spacing.md },
  errorTitle: { fontSize: 20, fontWeight: '700', color: Colors.text },
  errorMsg: { ...Typography.cardBody, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  retryBtn: {
    backgroundColor: Colors.primary, borderRadius: Radius.full,
    paddingHorizontal: Spacing.xl, paddingVertical: 12, marginTop: Spacing.sm,
  },
  retryText: { ...Typography.button, color: Colors.card },

  // Done
  resultHero: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.lg,
    backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.lg,
    marginBottom: Spacing.md, ...Shadow.card,
  },
  scoreRing: {
    width: 80, height: 80, borderRadius: 40, borderWidth: 5,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  scoreNum: { fontSize: 28, fontWeight: '700', lineHeight: 32 },
  scoreOf: { fontSize: 11, color: Colors.textSecondary, fontWeight: '600' },
  heroText: { flex: 1 },
  repoName: { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 4, fontFamily: 'Courier' },
  resultVerdict: { ...Typography.caption, color: Colors.textSecondary, lineHeight: 17, marginBottom: Spacing.sm },
  stackRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  stackChip: {
    backgroundColor: Colors.primary + '14', borderRadius: Radius.full,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  stackChipText: { fontSize: 10, fontWeight: '700', color: Colors.primary },
  expertCta: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.md,
    borderWidth: 1.5, borderColor: Colors.gold, marginBottom: Spacing.xl, ...Shadow.card,
  },
  expertIcon: {
    width: 36, height: 36, borderRadius: Radius.md, backgroundColor: Colors.gold + '1A',
    alignItems: 'center', justifyContent: 'center',
  },
  expertText: { flex: 1 },
  expertTitle: { ...Typography.cardBody, color: Colors.text, fontWeight: '700' },
  expertSub: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  allClear: { alignItems: 'center', gap: Spacing.sm, padding: Spacing.xl, backgroundColor: Colors.card, borderRadius: Radius.lg, ...Shadow.card },
  allClearTitle: { ...Typography.cardTitle, color: Colors.text },
  allClearSub: { ...Typography.caption, color: Colors.textSecondary, textAlign: 'center' },
  findingsLabel: { ...Typography.sectionLabel, color: Colors.sectionLabel, marginBottom: Spacing.md },
  findingCard: { backgroundColor: Colors.card, borderRadius: Radius.lg, marginBottom: Spacing.md, ...Shadow.card, overflow: 'hidden' },
  findingHeader: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, gap: Spacing.sm },
  findingStripe: { width: 4, alignSelf: 'stretch', borderRadius: Radius.full, marginRight: 4 },
  findingHeaderText: { flex: 1 },
  findingTags: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 5 },
  sevBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: Radius.full },
  sevBadgeText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.6 },
  catText: { fontSize: 10, color: Colors.textSecondary, fontWeight: '600' },
  findingTitle: { ...Typography.cardBody, color: Colors.text, fontWeight: '600', lineHeight: 19 },
  findingBody: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.md, gap: Spacing.sm },
  findingDesc: { ...Typography.cardBody, color: Colors.text, lineHeight: 20 },
  promptLabel: { ...Typography.sectionLabel, color: Colors.sectionLabel, fontSize: 10, marginTop: 4 },
  promptBox: { backgroundColor: Colors.background, borderRadius: Radius.sm, padding: Spacing.md },
  promptText: { fontSize: 13, color: Colors.text, lineHeight: 19, fontFamily: 'Courier' },
  copyBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: Colors.primary, borderRadius: Radius.full, paddingVertical: 11,
  },
  copyBtnText: { ...Typography.button, color: Colors.card, fontSize: 14 },
  doneActions: { gap: Spacing.sm, marginTop: Spacing.md },
  shareScoreBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: Colors.primary, borderRadius: Radius.full, paddingVertical: 14, ...Shadow.card,
  },
  shareScoreBtnText: { ...Typography.button, color: Colors.card },
  rescanBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 12,
  },
  rescanText: { ...Typography.caption, color: Colors.primary, fontWeight: '600', fontSize: 14 },
  footnote: { ...Typography.caption, color: Colors.textTertiary, textAlign: 'center', lineHeight: 17, marginTop: Spacing.sm },
})
