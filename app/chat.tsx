import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useState, useRef } from 'react'
import { Colors, Spacing, Radius, Shadow, Typography } from '../constants/theme'
import { chatWithGrimoire } from '../lib/api'
import { searchCaptures } from '../lib/backlinks'
import type { Capture } from '../components/CaptureCard'

const MOCK_CAPTURES: Capture[] = [
  {
    id: '1', title: 'How I got my first 1000 users without spending a dollar on ads',
    sourceUrl: '', sourceType: 'video', creator: '@indiefounder', platform: 'Instagram',
    date: 'Jun 24', stars: 142, starred: false, isPublic: true, pushed: true, pinned: true,
    preview: 'DMs convert 10x better than posts. Your first 10 users should be people who trust you. Don\'t announce, infiltrate communities. Product Hunt is a one-time spike.',
  },
  {
    id: '2', title: 'Pricing strategy for your first app — why free is a trap',
    sourceUrl: '', sourceType: 'video', creator: '@buildwithme', platform: 'YouTube',
    date: 'Jun 23', stars: 89, starred: true, isPublic: false, pushed: true, pinned: false,
    preview: 'Start at $4.99 minimum — free signals no value. Annual plans convert 3x better than monthly. Raise price after first 100 users.',
  },
  {
    id: '3', title: 'Screenshot: App store optimization checklist',
    sourceUrl: '', sourceType: 'image', creator: 'You', platform: 'Screenshot',
    date: 'Jun 22', stars: 0, starred: false, isPublic: false, pushed: false, pinned: false,
    preview: 'Use keywords in subtitle, not just title. First 3 screenshots must show core value. Localize at minimum for US + UK + AU.',
  },
  {
    id: '4', title: 'How to set up Stripe in an Expo app in 30 minutes',
    sourceUrl: '', sourceType: 'video', creator: '@stripepro', platform: 'YouTube',
    date: 'Jun 18', stars: 34, starred: false, isPublic: false, pushed: true, pinned: false,
    preview: 'Use stripe-react-native, not Stripe.js. Test mode cards: 4242 4242 4242 4242. Always verify payments server-side.',
  },
]

const SUGGESTED_QUESTIONS = [
  'How do I get my first users?',
  'What pricing strategy should I use?',
  'How do I optimize my App Store listing?',
  'What did I learn about Stripe?',
]

type Message = {
  id: string
  role: 'user' | 'assistant'
  text: string
  sources?: Array<{ id: string; title: string; preview: string }>
  loading?: boolean
}

export default function ChatScreen() {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<ScrollView>(null)

  const sendMessage = async (question: string) => {
    if (!question.trim() || loading) return
    const q = question.trim()
    setInput('')

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: q }
    const thinkingMsg: Message = { id: `t-${Date.now()}`, role: 'assistant', text: '', loading: true }

    setMessages(prev => [...prev, userMsg, thinkingMsg])
    setLoading(true)
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100)

    const relevant = searchCaptures(q, MOCK_CAPTURES)
    const captureSummaries = relevant.map(c => ({ id: c.id, title: c.title, preview: c.preview }))

    try {
      const { answer, sources } = await chatWithGrimoire(q, captureSummaries)
      setMessages(prev => prev.map(m =>
        m.id === thinkingMsg.id
          ? { ...m, text: answer, sources, loading: false }
          : m
      ))
    } catch {
      setMessages(prev => prev.map(m =>
        m.id === thinkingMsg.id
          ? { ...m, text: 'Could not reach Vibecoded AI. Check your connection and try again.', loading: false }
          : m
      ))
    } finally {
      setLoading(false)
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100)
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Chat with Vibecoded</Text>
          <View style={styles.aiBadge}><Text style={styles.aiBadgeText}>AI</Text></View>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.messagesScroll}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
        >
          {messages.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Text style={styles.emptyIconText}>✦</Text>
              </View>
              <Text style={styles.emptyTitle}>Ask Vibecoded anything</Text>
              <Text style={styles.emptySub}>
                I'll answer from your captured knowledge — {MOCK_CAPTURES.length} captures in your library.
              </Text>

              <Text style={styles.suggestionsLabel}>TRY ASKING</Text>
              {SUGGESTED_QUESTIONS.map(q => (
                <TouchableOpacity key={q} style={styles.suggestionChip} onPress={() => sendMessage(q)}>
                  <Text style={styles.suggestionText}>{q}</Text>
                  <Ionicons name="arrow-forward" size={14} color={Colors.primary} />
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            messages.map(msg => (
              <View key={msg.id}>
                <View style={[styles.bubble, msg.role === 'user' ? styles.userBubble : styles.aiBubble]}>
                  {msg.loading ? (
                    <View style={styles.thinkingRow}>
                      <ActivityIndicator size="small" color={Colors.accent} />
                      <Text style={styles.thinkingText}>Searching your captures...</Text>
                    </View>
                  ) : (
                    <Text style={[styles.bubbleText, msg.role === 'user' && styles.userBubbleText]}>
                      {msg.text}
                    </Text>
                  )}
                </View>

                {msg.sources && msg.sources.length > 0 && !msg.loading && (
                  <View style={styles.sourcesRow}>
                    <Text style={styles.sourcesLabel}>FROM YOUR CAPTURES</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sourcesScroll}>
                      {msg.sources.slice(0, 3).map(s => (
                        <TouchableOpacity
                          key={s.id}
                          style={styles.sourceCard}
                          onPress={() => router.push(`/capture/${s.id}`)}
                        >
                          <Ionicons name="document-text-outline" size={13} color={Colors.accent} />
                          <Text style={styles.sourceTitle} numberOfLines={2}>{s.title}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
            ))
          )}
        </ScrollView>

        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder="Ask anything from your captures..."
            placeholderTextColor={Colors.textSecondary}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={500}
            returnKeyType="send"
            onSubmitEditing={() => sendMessage(input)}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
            onPress={() => sendMessage(input)}
            disabled={!input.trim() || loading}
          >
            <Ionicons name="arrow-up" size={18} color={Colors.card} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  navBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: Radius.full,
    backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center',
    ...Shadow.card,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 16, fontWeight: '700', color: Colors.text },
  aiBadge: { backgroundColor: Colors.primary, paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full },
  aiBadgeText: { fontSize: 10, fontWeight: '700', color: Colors.card },
  messagesScroll: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl, flexGrow: 1 },
  emptyState: { flex: 1, alignItems: 'center', paddingTop: 40, paddingBottom: 20 },
  emptyIcon: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.lg, ...Shadow.card,
  },
  emptyIconText: { fontSize: 28, color: Colors.card },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: Spacing.sm },
  emptySub: {
    ...Typography.cardBody, color: Colors.textSecondary,
    textAlign: 'center', lineHeight: 20, marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.xl,
  },
  suggestionsLabel: { ...Typography.sectionLabel, color: Colors.sectionLabel, marginBottom: Spacing.md, alignSelf: 'flex-start' },
  suggestionChip: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    width: '100%', backgroundColor: Colors.card, borderRadius: Radius.md,
    padding: Spacing.md, marginBottom: Spacing.sm, ...Shadow.card,
  },
  suggestionText: { ...Typography.cardBody, color: Colors.text, flex: 1 },
  bubble: {
    maxWidth: '85%', borderRadius: Radius.lg, padding: Spacing.md, marginBottom: 4,
  },
  userBubble: { backgroundColor: Colors.primary, alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  aiBubble: { backgroundColor: Colors.card, alignSelf: 'flex-start', borderBottomLeftRadius: 4, ...Shadow.card },
  bubbleText: { ...Typography.cardBody, color: Colors.text, lineHeight: 22 },
  userBubbleText: { color: Colors.card },
  thinkingRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  thinkingText: { ...Typography.caption, color: Colors.textSecondary },
  sourcesRow: { marginBottom: Spacing.md, marginTop: 4 },
  sourcesLabel: { ...Typography.sectionLabel, color: Colors.sectionLabel, fontSize: 9, marginBottom: 6, marginLeft: 2 },
  sourcesScroll: { gap: Spacing.sm },
  sourceCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 6,
    backgroundColor: Colors.accent + '12', borderRadius: Radius.md,
    padding: Spacing.sm, maxWidth: 180,
  },
  sourceTitle: { fontSize: 11, color: Colors.accent, fontWeight: '500', flex: 1, lineHeight: 15 },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    backgroundColor: Colors.card, borderTopWidth: 1, borderTopColor: Colors.border,
  },
  input: {
    flex: 1, backgroundColor: Colors.background, borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md, paddingVertical: 10,
    fontSize: 14, color: Colors.text, maxHeight: 100,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: Radius.full,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.35 },
})
