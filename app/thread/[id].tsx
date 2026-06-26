import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform, Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router'
import { useState, useCallback } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Colors, Spacing, Radius, Shadow, Typography } from '../../constants/theme'
import {
  getThreads, addReply, resolveThread,
  formatRelTime, type StuckThread,
} from '../../lib/community'

const USER_KEY = 'grimoire:user'

export default function ThreadDetail() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const [thread, setThread] = useState<StuckThread | null>(null)
  const [reply, setReply] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useFocusEffect(useCallback(() => {
    getThreads().then(all => {
      const found = all.find(t => t.id === id)
      if (found) setThread(found)
    })
  }, [id]))

  const handleReply = async () => {
    if (!reply.trim() || !thread) return
    setSubmitting(true)
    try {
      const raw = await AsyncStorage.getItem(USER_KEY)
      const user = raw ? JSON.parse(raw) : null
      await addReply(thread.id, {
        authorName: user?.name ?? 'You',
        body: reply.trim(),
        isExpert: false,
      })
      const updated = await getThreads()
      const found = updated.find(t => t.id === id)
      if (found) setThread(found)
      setReply('')
    } finally {
      setSubmitting(false)
    }
  }

  const handleResolve = async () => {
    if (!thread) return
    Alert.alert(
      'Mark as resolved?',
      'This closes the thread. Other builders can still see it.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark resolved',
          onPress: async () => {
            await resolveThread(thread.id)
            setThread(prev => prev ? { ...prev, resolved: true } : null)
          },
        },
      ],
    )
  }

  if (!thread) return null

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <View style={styles.navBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color={Colors.text} />
          </TouchableOpacity>
          {!thread.resolved && (
            <TouchableOpacity style={styles.resolveBtn} onPress={handleResolve}>
              <Ionicons name="checkmark-circle-outline" size={15} color={Colors.success} />
              <Text style={styles.resolveBtnText}>Resolved</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {thread.resolved && (
            <View style={styles.resolvedBanner}>
              <Ionicons name="checkmark-circle" size={15} color={Colors.success} />
              <Text style={styles.resolvedBannerText}>Resolved</Text>
            </View>
          )}

          {thread.captureTitle && (
            <View style={styles.anchorBadge}>
              <Ionicons name="link-outline" size={12} color={Colors.primary} />
              <Text style={styles.anchorText} numberOfLines={1}>{thread.captureTitle}</Text>
            </View>
          )}

          <Text style={styles.threadTitle}>{thread.title}</Text>

          <View style={styles.threadMeta}>
            <Text style={styles.metaText}>{thread.authorName}</Text>
            <Text style={styles.metaDot}>·</Text>
            <Text style={styles.metaText}>{formatRelTime(thread.createdAt)}</Text>
            <Text style={styles.metaDot}>·</Text>
            <Text style={styles.metaText}>{thread.replies.length} {thread.replies.length === 1 ? 'reply' : 'replies'}</Text>
          </View>

          {thread.tags.length > 0 && (
            <View style={styles.tagRow}>
              {thread.tags.map(tag => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.bodyCard}>
            <Text style={styles.bodyText}>{thread.body}</Text>
          </View>

          {thread.replies.length > 0 && (
            <>
              <Text style={styles.repliesLabel}>{thread.replies.length} {thread.replies.length === 1 ? 'REPLY' : 'REPLIES'}</Text>
              {thread.replies.map(r => (
                <View key={r.id} style={[styles.replyCard, r.isExpert && styles.replyCardExpert]}>
                  <View style={styles.replyHeader}>
                    <View style={styles.replyAuthorRow}>
                      <Text style={styles.replyAuthor}>{r.authorName}</Text>
                      {r.isExpert && (
                        <View style={styles.expertBadge}>
                          <Text style={styles.expertBadgeText}>EXPERT</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.replyTime}>{formatRelTime(r.createdAt)}</Text>
                  </View>
                  <Text style={styles.replyBody}>{r.body}</Text>
                </View>
              ))}
            </>
          )}

          {thread.replies.length === 0 && !thread.resolved && (
            <View style={styles.emptyReplies}>
              <Text style={styles.emptyRepliesTitle}>No replies yet</Text>
              <Text style={styles.emptyRepliesBody}>Be the first to help.</Text>
            </View>
          )}
        </ScrollView>

        {!thread.resolved && (
          <View style={styles.composeRow}>
            <TextInput
              style={styles.composeInput}
              placeholder="Add a reply…"
              placeholderTextColor={Colors.textSecondary}
              value={reply}
              onChangeText={setReply}
              multiline
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!reply.trim() || submitting) && styles.sendBtnDisabled]}
              onPress={handleReply}
              disabled={!reply.trim() || submitting}
            >
              <Ionicons name="send" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  kav: { flex: 1 },
  navBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: Radius.full,
    backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center',
    ...Shadow.card,
  },
  resolveBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.success,
  },
  resolveBtnText: { fontSize: 12, fontWeight: '700', color: Colors.success },
  scroll: { padding: Spacing.lg, paddingBottom: 20 },
  resolvedBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.success + '15', borderRadius: Radius.md,
    padding: Spacing.sm, paddingHorizontal: Spacing.md, marginBottom: Spacing.md,
    alignSelf: 'flex-start',
  },
  resolvedBannerText: { fontSize: 12, fontWeight: '700', color: Colors.success },
  anchorBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.primary + '12', borderRadius: Radius.md,
    padding: Spacing.xs, paddingHorizontal: Spacing.md, marginBottom: Spacing.md,
    alignSelf: 'flex-start',
  },
  anchorText: { ...Typography.caption, color: Colors.primary, fontWeight: '600' },
  threadTitle: { fontSize: 20, fontWeight: '700', color: Colors.text, lineHeight: 28, marginBottom: Spacing.sm },
  threadMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: Spacing.md },
  metaText: { ...Typography.caption, color: Colors.textSecondary },
  metaDot: { ...Typography.caption, color: Colors.textTertiary },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: Spacing.md },
  tag: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: Radius.full, backgroundColor: Colors.accent + '15',
  },
  tagText: { fontSize: 11, fontWeight: '600', color: Colors.accent },
  bodyCard: {
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    padding: Spacing.lg, ...Shadow.card, marginBottom: Spacing.xl,
  },
  bodyText: { ...Typography.cardBody, color: Colors.text, lineHeight: 22 },
  repliesLabel: { ...Typography.sectionLabel, color: Colors.sectionLabel, marginBottom: Spacing.md },
  replyCard: {
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    padding: Spacing.lg, ...Shadow.card, marginBottom: Spacing.md,
  },
  replyCardExpert: {
    borderWidth: 1.5, borderColor: Colors.gold + '50',
    backgroundColor: Colors.gold + '06',
  },
  replyHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm },
  replyAuthorRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  replyAuthor: { fontSize: 13, fontWeight: '700', color: Colors.text },
  expertBadge: {
    backgroundColor: Colors.gold + '20', paddingHorizontal: 7, paddingVertical: 2, borderRadius: Radius.full,
  },
  expertBadgeText: { fontSize: 9, fontWeight: '700', color: Colors.gold, letterSpacing: 0.6 },
  replyTime: { ...Typography.caption, color: Colors.textTertiary },
  replyBody: { ...Typography.cardBody, color: Colors.text, lineHeight: 22 },
  emptyReplies: { alignItems: 'center', paddingVertical: Spacing.xl },
  emptyRepliesTitle: { fontSize: 15, fontWeight: '600', color: Colors.textSecondary },
  emptyRepliesBody: { ...Typography.caption, color: Colors.textTertiary, marginTop: 4 },
  composeRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderTopWidth: 1, borderTopColor: Colors.border,
    backgroundColor: Colors.card,
  },
  composeInput: {
    flex: 1, backgroundColor: Colors.background, borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md, paddingVertical: 10,
    fontSize: 14, color: Colors.text, maxHeight: 80,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: Radius.full,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: Colors.textTertiary },
})
