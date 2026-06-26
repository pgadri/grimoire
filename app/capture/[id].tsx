import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Share, Alert, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router'
import { useState, useCallback } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Clipboard from 'expo-clipboard'
import { Colors, Spacing, Radius, Shadow, Typography } from '../../constants/theme'
import type { Capture } from '../../components/CaptureCard'
import { AddToMapSheet } from '../../components/AddToMapSheet'
import { getReactions, toggleReaction, type CaptureReaction } from '../../lib/community'

const CAPTURES_KEY = 'grimoire:captures'

function parseBullets(preview: string): string[] {
  return preview
    .split('\n')
    .map(b => b.replace(/^[•\-→]\s*/, '').trim())
    .filter(Boolean)
}

function buildPrompts(capture: Capture, concepts: string[], actions: string[]) {
  const isTech = capture.category === 'technical'
  const conceptList = concepts.map(c => `• ${c}`).join('\n')
  const actionList = actions.map(a => `• ${a}`).join('\n')

  const applyText = isTech
    ? `I just watched a video about: "${capture.title}"

These are the specific findings:
${conceptList}

Audit my codebase for each of these issues. For each one:
1. Show me what to search for or how to detect it in my code
2. Give me the exact fix or package to use
3. Show a before/after code example

Start with the most critical issue first.`
    : `I want to apply this to my project: "${capture.title}"

Key insights:
${conceptList}

${actions.length ? `Suggested next steps:\n${actionList}\n\n` : ''}Start with the highest-impact step. Ask me one clarifying question about my project first if you need context.`

  const unstuckText = isTech
    ? `I need to fix this in my codebase: ${actions[0] ?? concepts[0]}

Context from "${capture.title}":
${conceptList}

Walk me through it step by step:
1. What files/patterns should I look at first?
2. What exactly do I change?
3. How do I test the fix works?

I use AI coding tools like Cursor.`
    : `I want to do this but I'm stuck on where to start:
"${actions[0] ?? concepts[0]}"

From: "${capture.title}" by ${capture.creator}

Context:
${conceptList}

Give me one concrete first action I can do in the next 30 minutes. Not a plan — just the first step.`

  const teamText = `Write a concise Slack message (3 bullets max, no fluff) that tells my team what we should do based on this.

Topic: "${capture.title}" (via ${capture.platform}, ${capture.creator})
${conceptList}
${actions.length ? `\nActions identified:\n${actionList}` : ''}`

  return [
    {
      id: 'apply',
      icon: 'flash-outline' as const,
      label: isTech ? 'Audit my codebase' : 'Apply to my project',
      description: isTech ? 'Find and fix these exact issues in your code' : 'Paste into Claude, Cursor, or ChatGPT',
      color: Colors.primary,
      text: applyText,
    },
    ...(isTech ? [{
      id: 'audit',
      icon: 'shield-checkmark-outline' as const,
      label: 'Vulnerability check',
      description: 'Does my specific codebase have these issues?',
      color: '#C0392B',
      text: `Here are specific vulnerabilities from "${capture.title}":

${conceptList}

For each one, check my actual codebase:
- Does this vulnerability exist in my code? Where?
- If yes: show me the exact line and the fix
- If no: tell me why we're already safe

Be specific — reference my files, not generic advice.`,
    }] : []),
    {
      id: 'unstuck',
      icon: 'help-circle-outline' as const,
      label: 'Get unstuck',
      description: isTech ? 'Step-by-step implementation help' : "First concrete step when you don't know where to start",
      color: Colors.accent,
      text: unstuckText,
    },
    {
      id: 'summarize',
      icon: 'chatbubble-outline' as const,
      label: 'Share with team',
      description: 'Turn this into a Slack message your team can act on',
      color: Colors.gold,
      text: teamText,
    },
  ]
}

type Tab = 'prompts' | 'knowledge' | 'raw'

export default function CaptureDetail() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('prompts')
  const [capture, setCapture] = useState<Capture | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAddToMap, setShowAddToMap] = useState(false)
  const [reaction, setReaction] = useState<CaptureReaction>({ fire: 0, insightful: 0, myReaction: null })

  useFocusEffect(useCallback(() => {
    async function load() {
      try {
        const raw = await AsyncStorage.getItem(CAPTURES_KEY)
        const captures: Capture[] = raw ? JSON.parse(raw) : []
        const found = captures.find(c => c.id === id)
        if (found) setCapture(found)
        const all = await getReactions()
        if (id && all[id]) setReaction(all[id])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id]))

  const handleReact = async (type: 'fire' | 'insightful') => {
    if (!id) return
    const updated = await toggleReaction(id, type)
    setReaction(updated)
  }

  const updateCapture = (changes: Partial<Capture>) => {
    if (!capture) return
    const updated = { ...capture, ...changes }
    setCapture(updated)
    AsyncStorage.getItem(CAPTURES_KEY).then(raw => {
      const captures: Capture[] = raw ? JSON.parse(raw) : []
      AsyncStorage.setItem(CAPTURES_KEY, JSON.stringify(captures.map(c => c.id === id ? updated : c)))
    })
  }

  const handleStar = () => {
    if (!capture) return
    updateCapture({ starred: !capture.starred, stars: capture.starred ? capture.stars - 1 : capture.stars + 1 })
  }

  const handleTogglePublic = () => {
    if (!capture) return
    const next = !capture.isPublic
    updateCapture({ isPublic: next })
    Alert.alert(next ? 'Made Public' : 'Made Private', next ? 'This capture is now visible in your public profile.' : 'This capture is now private.')
  }

  const handleShare = async () => {
    if (!capture) return
    await Share.share({
      title: capture.title,
      message: `${capture.title}\n\n${capture.preview}\n\nShared from Grimoire`,
    })
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    )
  }

  if (!capture) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.navBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color={Colors.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Capture not found.</Text>
        </View>
      </SafeAreaView>
    )
  }

  const concepts = capture.concepts?.length ? capture.concepts : parseBullets(capture.preview)
  const actions = capture.actions ?? []
  const quotes = capture.quotes ?? []
  const isTechnical = capture.category === 'technical'
  const prompts = buildPrompts(capture, concepts, actions)

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.navActions}>
          <TouchableOpacity style={styles.iconBtn} onPress={handleStar}>
            <Ionicons
              name={capture.starred ? 'star' : 'star-outline'}
              size={20}
              color={capture.starred ? Colors.gold : Colors.text}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={handleTogglePublic}>
            <Ionicons
              name={capture.isPublic ? 'globe-outline' : 'lock-closed-outline'}
              size={18}
              color={capture.isPublic ? Colors.success : Colors.textSecondary}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => setShowAddToMap(true)}>
            <Ionicons name="albums-outline" size={20} color={Colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={handleShare}>
            <Ionicons name="share-outline" size={20} color={Colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.meta}>
          <Text style={styles.platform}>{capture.platform} · {capture.creator}</Text>
          <Text style={styles.date}>{capture.date}</Text>
        </View>

        <Text style={styles.title}>{capture.title}</Text>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Ionicons name="star" size={14} color={Colors.gold} />
            <Text style={styles.statText}>{capture.stars} stars</Text>
          </View>
          {capture.isPublic && (
            <View style={styles.publicBadge}>
              <Text style={styles.publicText}>PUBLIC</Text>
            </View>
          )}
          <View style={styles.reactionsInline}>
            <TouchableOpacity
              style={[styles.reactionBtn, reaction.myReaction === 'fire' && styles.reactionBtnActive]}
              onPress={() => handleReact('fire')}
            >
              <Text style={styles.reactionEmoji}>🔥</Text>
              {reaction.fire > 0 && (
                <Text style={[styles.reactionCount, reaction.myReaction === 'fire' && styles.reactionCountActive]}>
                  {reaction.fire}
                </Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.reactionBtn, reaction.myReaction === 'insightful' && styles.reactionBtnActive]}
              onPress={() => handleReact('insightful')}
            >
              <Text style={styles.reactionEmoji}>💡</Text>
              {reaction.insightful > 0 && (
                <Text style={[styles.reactionCount, reaction.myReaction === 'insightful' && styles.reactionCountActive]}>
                  {reaction.insightful}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.tabs}>
          {(['prompts', 'knowledge', 'raw'] as Tab[]).map(t => (
            <TouchableOpacity
              key={t}
              style={[styles.tab, tab === t && styles.tabActive]}
              onPress={() => setTab(t)}
            >
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                {t === 'prompts' ? (isTechnical ? '✦ Prompts' : '✦ Action Plan') : t === 'knowledge' ? 'Knowledge' : 'Raw'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {tab === 'knowledge' && (
          <View style={styles.knowledge}>
            {concepts.length > 0 && (
              <KnowledgeSection
                icon="bulb-outline"
                title="KEY CONCEPTS"
                items={concepts}
                bullet="•"
              />
            )}
            {actions.length > 0 && (
              <KnowledgeSection
                icon="flash-outline"
                title="ACTION ITEMS"
                items={actions}
                bullet="→"
                accentColor={Colors.primary}
              />
            )}
            {quotes.length > 0 && (
              <KnowledgeSection
                icon="chatbubble-outline"
                title="BEST QUOTES"
                items={quotes}
                bullet=""
                italic
              />
            )}
            {capture.sourceUrl ? (
              <View style={styles.sourceRow}>
                <Ionicons name="link-outline" size={13} color={Colors.textTertiary} />
                <Text style={styles.sourceText} numberOfLines={1}>{capture.sourceUrl}</Text>
              </View>
            ) : null}
          </View>
        )}

        {tab === 'prompts' && isTechnical && (
          <View style={styles.promptsContainer}>
            <Text style={styles.promptsIntro}>
              Ready-made prompts built from this capture. Tap copy, paste into Cursor, Claude, or ChatGPT.
            </Text>
            {prompts.map(prompt => (
              <PromptCard key={prompt.id} prompt={prompt} />
            ))}
          </View>
        )}

        {tab === 'prompts' && !isTechnical && (
          <View style={styles.promptsContainer}>
            <Text style={styles.promptsIntro}>
              Concrete next steps based on this capture. Copy a prompt to get AI help executing them.
            </Text>
            {actions.length > 0 && (
              <View style={styles.actionPlanCard}>
                <View style={styles.actionPlanHeader}>
                  <Ionicons name="checkmark-circle-outline" size={16} color={Colors.primary} />
                  <Text style={styles.actionPlanTitle}>YOUR ACTION PLAN</Text>
                </View>
                <View style={styles.actionPlanDivider} />
                {actions.map((action, i) => (
                  <View key={i} style={styles.actionItem}>
                    <View style={styles.actionNumber}>
                      <Text style={styles.actionNumberText}>{i + 1}</Text>
                    </View>
                    <Text style={styles.actionItemText}>{action}</Text>
                  </View>
                ))}
              </View>
            )}
            <PromptCard prompt={prompts.find(p => p.id === 'apply')!} />
            <PromptCard prompt={prompts.find(p => p.id === 'summarize')!} />
          </View>
        )}

        {tab === 'raw' && (
          <RawTab capture={capture} />
        )}

        <TouchableOpacity
          style={styles.stuckBtn}
          onPress={() => router.push({
            pathname: '/new-thread',
            params: { captureId: capture.id, captureTitle: capture.title },
          } as any)}
        >
          <Ionicons name="help-circle-outline" size={17} color={Colors.accent} />
          <View style={styles.stuckBtnText}>
            <Text style={styles.stuckBtnTitle}>Stuck on something from this?</Text>
            <Text style={styles.stuckBtnSub}>Post a thread — builders answer</Text>
          </View>
          <Ionicons name="chevron-forward" size={15} color={Colors.textTertiary} />
        </TouchableOpacity>
      </ScrollView>

      <AddToMapSheet
        visible={showAddToMap}
        captureId={capture.id}
        captureTitle={capture.title}
        onClose={() => setShowAddToMap(false)}
      />
    </SafeAreaView>
  )
}

function RawTab({ capture }: { capture: Capture }) {
  const [copied, setCopied] = useState(false)
  const text = capture.transcript || capture.preview || ''
  const empty = !text

  const handleCopy = async () => {
    if (empty) return
    await Clipboard.setStringAsync(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShare = async () => {
    if (empty) return
    await Share.share({
      title: capture.title,
      message: `${capture.title}\n\n${text}`,
    })
  }

  return (
    <View style={rawTabStyles.container}>
      <View style={rawTabStyles.actions}>
        <TouchableOpacity
          style={[rawTabStyles.btn, copied && rawTabStyles.btnDone]}
          onPress={handleCopy}
          disabled={empty}
        >
          <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={15} color={copied ? Colors.success : Colors.primary} />
          <Text style={[rawTabStyles.btnText, copied && rawTabStyles.btnTextDone]}>
            {copied ? 'Copied!' : 'Copy transcript'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={rawTabStyles.btn}
          onPress={handleShare}
          disabled={empty}
        >
          <Ionicons name="share-outline" size={15} color={Colors.primary} />
          <Text style={rawTabStyles.btnText}>Share as text</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.rawContainer}>
        {empty
          ? <Text style={styles.rawEmpty}>No transcript available. Re-capture this video to get the full text.</Text>
          : <Text style={styles.rawText}>{text}</Text>
        }
      </View>
    </View>
  )
}

function PromptCard({ prompt }: { prompt: ReturnType<typeof buildPrompts>[number] }) {
  const [copied, setCopied] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const disabled = prompt.id === 'github' && prompt.text.startsWith('[Push')

  const handleCopy = async () => {
    if (disabled) {
      Alert.alert('Push first', 'Push this capture to GitHub to unlock this prompt.')
      return
    }
    await Clipboard.setStringAsync(prompt.text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <View style={[promptStyles.card, disabled && promptStyles.cardDisabled]}>
      <View style={promptStyles.cardHeader}>
        <View style={[promptStyles.iconBox, { backgroundColor: prompt.color + '18' }]}>
          <Ionicons name={prompt.icon} size={18} color={disabled ? Colors.textTertiary : prompt.color} />
        </View>
        <View style={promptStyles.labelCol}>
          <Text style={[promptStyles.label, disabled && promptStyles.labelDisabled]}>{prompt.label}</Text>
          <Text style={promptStyles.description}>{prompt.description}</Text>
        </View>
        <TouchableOpacity
          style={[promptStyles.copyBtn, copied && promptStyles.copyBtnDone, disabled && promptStyles.copyBtnDisabled]}
          onPress={handleCopy}
        >
          <Ionicons
            name={copied ? 'checkmark' : 'copy-outline'}
            size={14}
            color={copied ? Colors.success : disabled ? Colors.textTertiary : Colors.primary}
          />
          <Text style={[promptStyles.copyText, copied && promptStyles.copyTextDone, disabled && promptStyles.copyTextDisabled]}>
            {copied ? 'Copied!' : 'Copy'}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={promptStyles.promptPreview}
        onPress={() => setExpanded(prev => !prev)}
        activeOpacity={0.8}
      >
        <Text style={[promptStyles.promptText, disabled && promptStyles.promptTextDisabled]} numberOfLines={expanded ? undefined : 3}>
          {prompt.text}
        </Text>
        <View style={promptStyles.expandRow}>
          <Text style={promptStyles.expandText}>{expanded ? 'Show less' : 'Show full prompt'}</Text>
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={12} color={Colors.textTertiary} />
        </View>
      </TouchableOpacity>
    </View>
  )
}

function KnowledgeSection({
  icon, title, items, bullet, accentColor, italic,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name']
  title: string
  items: string[]
  bullet: string
  accentColor?: string
  italic?: boolean
}) {
  return (
    <View style={sectionStyles.container}>
      <View style={sectionStyles.header}>
        <Ionicons name={icon} size={16} color={Colors.accent} />
        <Text style={sectionStyles.title}>{title}</Text>
      </View>
      <View style={sectionStyles.divider} />
      {items.map((item, i) => (
        <View key={i} style={sectionStyles.item}>
          {bullet ? (
            <Text style={[sectionStyles.bullet, { color: accentColor ?? Colors.accent }]}>
              {bullet}
            </Text>
          ) : null}
          <Text style={[sectionStyles.itemText, italic && { fontStyle: 'italic' }]}>
            {item}
          </Text>
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { ...Typography.cardBody, color: Colors.textSecondary },
  navBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: Radius.full,
    backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center',
    ...Shadow.card,
  },
  navActions: { flexDirection: 'row', gap: Spacing.sm },
  iconBtn: {
    width: 36, height: 36, borderRadius: Radius.full,
    backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center',
    ...Shadow.card,
  },
  scroll: { paddingHorizontal: Spacing.lg, paddingBottom: 40 },
  meta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
  platform: { ...Typography.caption, color: Colors.textSecondary },
  date: { ...Typography.caption, color: Colors.textTertiary },
  title: {
    fontSize: 22, fontWeight: '700', color: Colors.text,
    lineHeight: 30, marginBottom: Spacing.md,
  },
  statsRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.xl, flexWrap: 'wrap',
  },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { ...Typography.caption, color: Colors.textSecondary },
  publicBadge: {
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full,
  },
  publicText: { fontSize: 9, fontWeight: '700', color: Colors.primary, letterSpacing: 0.8 },
  reactionsInline: { flexDirection: 'row', gap: 6, marginLeft: 'auto' as any },
  reactionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 8, paddingVertical: 5,
    borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  reactionBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '12' },
  reactionEmoji: { fontSize: 13 },
  reactionCount: { fontSize: 11, fontWeight: '600', color: Colors.textSecondary },
  reactionCountActive: { color: Colors.primary },
  stuckBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    padding: Spacing.md, marginTop: Spacing.xl, ...Shadow.card,
    borderWidth: 1, borderColor: Colors.accent + '25',
  },
  stuckBtnText: { flex: 1 },
  stuckBtnTitle: { fontSize: 14, fontWeight: '600', color: Colors.text },
  stuckBtnSub: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  tabs: {
    flexDirection: 'row', backgroundColor: Colors.card,
    borderRadius: Radius.full, padding: 4, marginBottom: Spacing.xl, ...Shadow.card,
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: Radius.full },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { ...Typography.button, color: Colors.textSecondary, fontSize: 13 },
  tabTextActive: { color: Colors.card },
  knowledge: { gap: Spacing.md },
  sourceRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: Spacing.sm,
  },
  sourceText: { ...Typography.caption, color: Colors.textTertiary, flex: 1 },
  promptsContainer: { gap: Spacing.md },
  promptsIntro: {
    ...Typography.cardBody, color: Colors.textSecondary,
    lineHeight: 20, marginBottom: Spacing.xs,
  },
  actionPlanCard: {
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    padding: Spacing.lg, ...Shadow.card,
  },
  actionPlanHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  actionPlanTitle: { ...Typography.sectionLabel, color: Colors.primary },
  actionPlanDivider: { height: 1, backgroundColor: Colors.border, marginBottom: Spacing.md },
  actionItem: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.md, alignItems: 'flex-start' },
  actionNumber: {
    width: 22, height: 22, borderRadius: Radius.full,
    backgroundColor: Colors.primary + '18', alignItems: 'center', justifyContent: 'center',
    marginTop: 1,
  },
  actionNumberText: { fontSize: 11, fontWeight: '700', color: Colors.primary },
  actionItemText: { ...Typography.cardBody, color: Colors.text, lineHeight: 22, flex: 1 },
  rawContainer: {
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    padding: Spacing.lg, ...Shadow.card,
  },
  rawText: { ...Typography.cardBody, color: Colors.text, lineHeight: 24 },
  rawEmpty: { ...Typography.cardBody, color: Colors.textSecondary, fontStyle: 'italic', lineHeight: 22 },
})

const promptStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    padding: Spacing.lg, ...Shadow.card,
  },
  cardDisabled: { opacity: 0.55 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.md },
  iconBox: {
    width: 40, height: 40, borderRadius: Radius.md,
    alignItems: 'center', justifyContent: 'center',
  },
  labelCol: { flex: 1 },
  label: { ...Typography.cardBody, color: Colors.text, fontWeight: '600', marginBottom: 2 },
  labelDisabled: { color: Colors.textSecondary },
  description: { ...Typography.caption, color: Colors.textSecondary, lineHeight: 16 },
  copyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: Spacing.md, paddingVertical: 8,
    borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.primary,
  },
  copyBtnDone: { borderColor: Colors.success, backgroundColor: Colors.success + '10' },
  copyBtnDisabled: { borderColor: Colors.border },
  copyText: { fontSize: 12, fontWeight: '600', color: Colors.primary },
  copyTextDone: { color: Colors.success },
  copyTextDisabled: { color: Colors.textTertiary },
  promptPreview: {
    backgroundColor: Colors.background, borderRadius: Radius.sm,
    padding: Spacing.md,
  },
  promptText: { ...Typography.caption, color: Colors.textSecondary, lineHeight: 18 },
  promptTextDisabled: { color: Colors.textTertiary, fontStyle: 'italic' },
  expandRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: Spacing.sm },
  expandText: { ...Typography.caption, color: Colors.textTertiary, fontSize: 11 },
})

const rawTabStyles = StyleSheet.create({
  container: { gap: Spacing.md },
  actions: { flexDirection: 'row', gap: Spacing.sm },
  btn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 11, borderRadius: Radius.full,
    borderWidth: 1.5, borderColor: Colors.primary, backgroundColor: Colors.card,
  },
  btnDone: { borderColor: Colors.success, backgroundColor: Colors.success + '10' },
  btnText: { fontSize: 13, fontWeight: '600', color: Colors.primary },
  btnTextDone: { color: Colors.success },
})

const sectionStyles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    padding: Spacing.lg, ...Shadow.card,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  title: { ...Typography.sectionLabel, color: Colors.sectionLabel },
  divider: { height: 1, backgroundColor: Colors.border, marginBottom: Spacing.md },
  item: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm, alignItems: 'flex-start' },
  bullet: { fontSize: 14, fontWeight: '600', marginTop: 2, width: 16 },
  itemText: { ...Typography.cardBody, color: Colors.text, lineHeight: 22, flex: 1 },
})
