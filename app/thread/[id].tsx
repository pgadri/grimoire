import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform, Alert,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router'
import { useState, useCallback } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Colors, Spacing, Radius, Shadow, Typography } from '../../constants/theme'
import {
  getThread, createReply, updateReply, deleteReply,
  voteThread, voteReply, resolveThread, deleteThread, updateThread,
  formatRelTime, type Thread, type ThreadReply,
} from '../../lib/threads'

const USER_KEY = 'grimoire:user'

export default function ThreadDetail() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const [thread, setThread] = useState<Thread | null>(null)
  const [loading, setLoading] = useState(true)
  const [myUserId, setMyUserId] = useState<string | null>(null)
  const [reply, setReply] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null)
  const [editBody, setEditBody] = useState('')

  useFocusEffect(useCallback(() => {
    let active = true
    AsyncStorage.getItem(USER_KEY).then(raw => {
      if (raw && active) setMyUserId(JSON.parse(raw).id)
    })
    setLoading(true)
    getThread(id).then(t => {
      if (active) { setThread(t); setLoading(false) }
    })
    return () => { active = false }
  }, [id]))

  const isThreadAuthor = thread ? thread.authorId === myUserId : false

  const handleVoteThread = async (vote: 1 | -1) => {
    if (!thread) return
    const res = await voteThread(thread.id, vote)
    setThread(prev => prev ? { ...prev, upvotes: res.upvotes, myVote: res.myVote } : null)
  }

  const handleVoteReply = async (replyId: string) => {
    if (!thread) return
    const res = await voteReply(thread.id, replyId)
    setThread(prev => prev ? {
      ...prev,
      replies: prev.replies?.map(r => r.id === replyId
        ? { ...r, upvotes: res.upvotes, myVote: res.myVote }
        : r
      ),
    } : null)
  }

  const handleReply = async () => {
    if (!reply.trim() || !thread) return
    setSubmitting(true)
    try {
      const newReply = await createReply(thread.id, reply.trim())
      setThread(prev => prev ? {
        ...prev,
        replyCount: prev.replyCount + 1,
        replies: [...(prev.replies ?? []), newReply],
      } : null)
      setReply('')
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Could not post reply.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditReply = async () => {
    if (!editBody.trim() || !editingReplyId || !thread) return
    await updateReply(thread.id, editingReplyId, editBody.trim())
    setThread(prev => prev ? {
      ...prev,
      replies: prev.replies?.map(r => r.id === editingReplyId
        ? { ...r, body: editBody.trim(), updatedAt: new Date().toISOString() }
        : r
      ),
    } : null)
    setEditingReplyId(null)
    setEditBody('')
  }

  const handleDeleteReply = (replyId: string) => {
    Alert.alert('Delete reply?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          await deleteReply(thread!.id, replyId)
          setThread(prev => prev ? {
            ...prev,
            replyCount: Math.max(0, prev.replyCount - 1),
            replies: prev.replies?.filter(r => r.id !== replyId),
          } : null)
        },
      },
    ])
  }

  const handleDeleteThread = () => {
    Alert.alert('Delete thread?', 'All replies will be removed. This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          await deleteThread(thread!.id)
          router.back()
        },
      },
    ])
  }

  const handleResolve = () => {
    Alert.alert('Mark as resolved?', 'Replies are still visible. New replies will be disabled.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Mark resolved',
        onPress: async () => {
          await resolveThread(thread!.id)
          setThread(prev => prev ? { ...prev, isResolved: true } : null)
        },
      },
    ])
  }

  const handleEditThread = () => {
    if (!thread) return
    Alert.prompt(
      'Edit title',
      undefined,
      (newTitle) => {
        if (newTitle?.trim()) {
          updateThread(thread.id, { title: newTitle.trim() })
          setThread(prev => prev ? { ...prev, title: newTitle.trim() } : null)
        }
      },
      'plain-text',
      thread.title,
    )
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.loadingState}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      </SafeAreaView>
    )
  }

  if (!thread) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <TouchableOpacity style={styles.backRow} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.loadingState}>
          <Text style={styles.notFound}>Thread not found</Text>
        </View>
      </SafeAreaView>
    )
  }

  const replies = thread.replies ?? []

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Nav bar */}
        <View style={styles.navBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color={Colors.text} />
          </TouchableOpacity>
          <View style={styles.navActions}>
            {isThreadAuthor && !thread.isResolved && (
              <TouchableOpacity style={styles.resolveBtn} onPress={handleResolve}>
                <Ionicons name="checkmark-circle-outline" size={15} color={Colors.success} />
                <Text style={styles.resolveBtnText}>Resolve</Text>
              </TouchableOpacity>
            )}
            {isThreadAuthor && (
              <TouchableOpacity
                style={styles.moreBtn}
                onPress={() => Alert.alert(thread.title, undefined, [
                  { text: 'Edit title', onPress: handleEditThread },
                  { text: 'Delete thread', style: 'destructive', onPress: handleDeleteThread },
                  { text: 'Cancel', style: 'cancel' },
                ])}
              >
                <Ionicons name="ellipsis-horizontal" size={18} color={Colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Thread post — Reddit style */}
          <View style={styles.postCard}>
            {/* Author + time */}
            <View style={styles.postMeta}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{thread.authorName.charAt(0).toUpperCase()}</Text>
              </View>
              <View>
                <Text style={styles.authorName}>
                  {thread.authorHandle ? `@${thread.authorHandle}` : thread.authorName}
                </Text>
                <Text style={styles.postTime}>{formatRelTime(thread.createdAt)}{thread.updatedAt ? ' · edited' : ''}</Text>
              </View>
              {thread.isResolved && (
                <View style={styles.resolvedBadge}>
                  <Ionicons name="checkmark-circle" size={12} color={Colors.success} />
                  <Text style={styles.resolvedBadgeText}>Resolved</Text>
                </View>
              )}
            </View>

            {/* Tags */}
            {thread.tags.length > 0 && (
              <View style={styles.tagRow}>
                {thread.tags.map(tag => (
                  <View key={tag} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Title */}
            <Text style={styles.postTitle}>{thread.title}</Text>

            {/* Body */}
            <Text style={styles.postBody}>{thread.body}</Text>

            {/* Vote + stats row */}
            <View style={styles.postActions}>
              <View style={styles.voteRow}>
                <TouchableOpacity
                  style={[styles.voteBtn, thread.myVote === 1 && styles.voteBtnUp]}
                  onPress={() => handleVoteThread(1)}
                >
                  <Ionicons name="arrow-up" size={15} color={thread.myVote === 1 ? '#fff' : Colors.textSecondary} />
                </TouchableOpacity>
                <Text style={[styles.voteCount, thread.myVote === 1 && { color: Colors.primary }]}>
                  {thread.upvotes}
                </Text>
                <TouchableOpacity
                  style={[styles.voteBtn, thread.myVote === -1 && styles.voteBtnDown]}
                  onPress={() => handleVoteThread(-1)}
                >
                  <Ionicons name="arrow-down" size={15} color={thread.myVote === -1 ? '#fff' : Colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.commentStat}>
                <Ionicons name="chatbubble-outline" size={14} color={Colors.textSecondary} />
                <Text style={styles.commentStatText}>{replies.length} {replies.length === 1 ? 'reply' : 'replies'}</Text>
              </View>
            </View>
          </View>

          {/* Replies */}
          {replies.length > 0 && (
            <>
              <Text style={styles.repliesLabel}>{replies.length} {replies.length === 1 ? 'REPLY' : 'REPLIES'}</Text>
              {replies.map(r => (
                <ReplyCard
                  key={r.id}
                  reply={r}
                  isEditing={editingReplyId === r.id}
                  editBody={editBody}
                  onEditChange={setEditBody}
                  onEditSubmit={handleEditReply}
                  onEditCancel={() => { setEditingReplyId(null); setEditBody('') }}
                  onVote={() => handleVoteReply(r.id)}
                  onEdit={() => { setEditingReplyId(r.id); setEditBody(r.body) }}
                  onDelete={() => handleDeleteReply(r.id)}
                />
              ))}
            </>
          )}

          {replies.length === 0 && !thread.isResolved && (
            <View style={styles.emptyReplies}>
              <Ionicons name="chatbubble-outline" size={32} color={Colors.textTertiary} />
              <Text style={styles.emptyRepliesTitle}>No replies yet</Text>
              <Text style={styles.emptyRepliesSub}>Be the first to help this builder.</Text>
            </View>
          )}
        </ScrollView>

        {/* Compose */}
        {!thread.isResolved && (
          <View style={styles.compose}>
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

function ReplyCard({
  reply, isEditing, editBody, onEditChange, onEditSubmit, onEditCancel,
  onVote, onEdit, onDelete,
}: {
  reply: ThreadReply
  isEditing: boolean
  editBody: string
  onEditChange: (s: string) => void
  onEditSubmit: () => void
  onEditCancel: () => void
  onVote: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <View style={styles.replyCard}>
      <View style={styles.replyHeader}>
        <View style={styles.replyAvatar}>
          <Text style={styles.replyAvatarText}>{reply.authorName.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.replyMeta}>
          <Text style={styles.replyAuthor}>
            {reply.authorHandle ? `@${reply.authorHandle}` : reply.authorName}
          </Text>
          <Text style={styles.replyTime}>
            {formatRelTime(reply.createdAt)}{reply.updatedAt ? ' · edited' : ''}
          </Text>
        </View>
        {reply.isAuthor && (
          <TouchableOpacity
            onPress={() => Alert.alert('Reply', undefined, [
              { text: 'Edit', onPress: onEdit },
              { text: 'Delete', style: 'destructive', onPress: onDelete },
              { text: 'Cancel', style: 'cancel' },
            ])}
          >
            <Ionicons name="ellipsis-horizontal" size={16} color={Colors.textTertiary} />
          </TouchableOpacity>
        )}
      </View>

      {isEditing ? (
        <View style={styles.editBox}>
          <TextInput
            style={styles.editInput}
            value={editBody}
            onChangeText={onEditChange}
            multiline
            autoFocus
          />
          <View style={styles.editActions}>
            <TouchableOpacity style={styles.editCancelBtn} onPress={onEditCancel}>
              <Text style={styles.editCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.editSaveBtn, !editBody.trim() && styles.editSaveBtnDisabled]}
              onPress={onEditSubmit}
              disabled={!editBody.trim()}
            >
              <Text style={styles.editSaveText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <Text style={styles.replyBody}>{reply.body}</Text>
      )}

      {/* Reply upvote */}
      <View style={styles.replyFooter}>
        <TouchableOpacity style={styles.replyVoteRow} onPress={onVote}>
          <Ionicons
            name={reply.myVote ? 'arrow-up' : 'arrow-up-outline'}
            size={13}
            color={reply.myVote ? Colors.primary : Colors.textSecondary}
          />
          <Text style={[styles.replyVoteCount, reply.myVote && { color: Colors.primary }]}>
            {reply.upvotes}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  kav: { flex: 1 },
  loadingState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFound: { fontSize: 16, color: Colors.textSecondary },
  backRow: { padding: Spacing.lg },

  navBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: Radius.full,
    backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center',
    ...Shadow.card,
  },
  navActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  resolveBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.success,
  },
  resolveBtnText: { fontSize: 12, fontWeight: '700', color: Colors.success },
  moreBtn: {
    width: 34, height: 34, borderRadius: Radius.full,
    backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center',
  },

  scroll: { padding: Spacing.lg, paddingBottom: 20 },

  // Post card
  postCard: {
    backgroundColor: Colors.card, borderRadius: Radius.xl,
    padding: Spacing.lg, ...Shadow.card, marginBottom: Spacing.lg,
  },
  postMeta: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: Spacing.md },
  avatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 15, fontWeight: '800', color: '#fff' },
  authorName: { fontSize: 13, fontWeight: '700', color: Colors.text },
  postTime: { fontSize: 11, color: Colors.textSecondary, marginTop: 1 },
  resolvedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.success + '15', borderRadius: Radius.full,
    paddingHorizontal: 8, paddingVertical: 3, marginLeft: 'auto',
  },
  resolvedBadgeText: { fontSize: 10, fontWeight: '700', color: Colors.success },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: Spacing.sm },
  tag: {
    paddingHorizontal: 9, paddingVertical: 3,
    backgroundColor: Colors.accent + '15', borderRadius: Radius.full,
  },
  tagText: { fontSize: 10, fontWeight: '600', color: Colors.accent },
  postTitle: { fontSize: 19, fontWeight: '800', color: Colors.text, lineHeight: 26, marginBottom: Spacing.md },
  postBody: { fontSize: 14, color: Colors.text, lineHeight: 22, marginBottom: Spacing.lg },
  postActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border },
  voteRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  voteBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center',
  },
  voteBtnUp: { backgroundColor: Colors.primary },
  voteBtnDown: { backgroundColor: Colors.error },
  voteCount: { fontSize: 15, fontWeight: '700', color: Colors.textSecondary, minWidth: 22, textAlign: 'center' },
  commentStat: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  commentStatText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },

  // Replies
  repliesLabel: {
    ...Typography.sectionLabel, color: Colors.sectionLabel,
    marginBottom: Spacing.sm,
  },
  replyCard: {
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    padding: Spacing.md, ...Shadow.card, marginBottom: Spacing.sm,
  },
  replyHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: Spacing.sm },
  replyAvatar: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center',
  },
  replyAvatarText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  replyMeta: { flex: 1 },
  replyAuthor: { fontSize: 12, fontWeight: '700', color: Colors.text },
  replyTime: { fontSize: 11, color: Colors.textSecondary },
  replyBody: { fontSize: 14, color: Colors.text, lineHeight: 21, marginBottom: Spacing.sm },
  replyFooter: { flexDirection: 'row', alignItems: 'center' },
  replyVoteRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  replyVoteCount: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },

  // Edit inline
  editBox: { marginVertical: Spacing.sm },
  editInput: {
    backgroundColor: Colors.background, borderRadius: Radius.md,
    paddingHorizontal: Spacing.md, paddingVertical: 10,
    fontSize: 14, color: Colors.text, minHeight: 70,
  },
  editActions: { flexDirection: 'row', gap: 8, marginTop: 8, justifyContent: 'flex-end' },
  editCancelBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: Radius.full, backgroundColor: Colors.background },
  editCancelText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  editSaveBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: Radius.full, backgroundColor: Colors.primary },
  editSaveBtnDisabled: { backgroundColor: Colors.textTertiary },
  editSaveText: { fontSize: 13, fontWeight: '700', color: '#fff' },

  // Empty replies
  emptyReplies: { alignItems: 'center', paddingVertical: Spacing.xxl, gap: Spacing.sm },
  emptyRepliesTitle: { fontSize: 15, fontWeight: '700', color: Colors.textSecondary },
  emptyRepliesSub: { fontSize: 13, color: Colors.textTertiary, textAlign: 'center' },

  // Compose
  compose: {
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
