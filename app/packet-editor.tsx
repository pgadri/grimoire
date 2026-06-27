import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform, Alert,
  Modal,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useState, useEffect } from 'react'
import { Colors, Spacing, Radius, Shadow, Typography } from '../constants/theme'
import {
  createPacket, updatePacket, getPacket, addChapter, updateChapter, deleteChapter,
  submitPacket, deletePacket, PACKET_CATEGORIES, type Packet, type PacketChapter,
} from '../lib/packets'

const EMOJIS = ['📦', '🧠', '🚀', '⚙️', '📣', '💰', '🎯', '🔥', '💡', '🛠️', '🎨', '📊', '🔐', '📱', '⚡']

export default function PacketEditorScreen() {
  const router = useRouter()
  const { packetId } = useLocalSearchParams<{ packetId?: string }>()
  const isEditing = !!packetId

  const [packet, setPacket] = useState<Packet | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('founder')
  const [emoji, setEmoji] = useState('📦')
  const [chapters, setChapters] = useState<PacketChapter[]>([])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(isEditing)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [editingChapter, setEditingChapter] = useState<PacketChapter | null>(null)
  const [chapterTitle, setChapterTitle] = useState('')
  const [chapterContent, setChapterContent] = useState('')
  const [chapterIsPreview, setChapterIsPreview] = useState(false)
  const [showChapterModal, setShowChapterModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (packetId) {
      getPacket(packetId).then(p => {
        if (p) {
          setPacket(p)
          setTitle(p.title)
          setDescription(p.description)
          setCategory(p.category)
          setEmoji(p.coverEmoji)
          setChapters(p.chapters ?? [])
        }
        setLoading(false)
      })
    }
  }, [packetId])

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Add a title', 'Your packet needs a title.')
      return
    }
    setSaving(true)
    try {
      if (isEditing && packetId) {
        await updatePacket(packetId, { title: title.trim(), description: description.trim(), category, coverEmoji: emoji })
        Alert.alert('Saved', 'Your packet has been updated.')
      } else {
        const p = await createPacket({ title: title.trim(), description: description.trim(), category, coverEmoji: emoji })
        router.replace({ pathname: '/packet-editor', params: { packetId: p.id } } as any)
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Could not save packet.')
    } finally {
      setSaving(false)
    }
  }

  const openNewChapter = () => {
    setEditingChapter(null)
    setChapterTitle('')
    setChapterContent('')
    setChapterIsPreview(chapters.length === 0)
    setShowChapterModal(true)
  }

  const openEditChapter = (ch: PacketChapter) => {
    setEditingChapter(ch)
    setChapterTitle(ch.title)
    setChapterContent(ch.content)
    setChapterIsPreview(ch.isPreview)
    setShowChapterModal(true)
  }

  const handleSaveChapter = async () => {
    if (!chapterTitle.trim() || !chapterContent.trim()) {
      Alert.alert('Fill in both fields', 'A chapter needs a title and content.')
      return
    }
    const currentPacketId = packetId ?? packet?.id
    if (!currentPacketId) {
      Alert.alert('Save the packet first', 'Create the packet before adding chapters.')
      return
    }
    setSaving(true)
    try {
      if (editingChapter) {
        await updateChapter(currentPacketId, editingChapter.id, {
          title: chapterTitle.trim(),
          content: chapterContent.trim(),
          isPreview: chapterIsPreview,
        })
        setChapters(prev => prev.map(c => c.id === editingChapter.id ? { ...c, title: chapterTitle.trim(), content: chapterContent.trim(), isPreview: chapterIsPreview } : c))
      } else {
        const ch = await addChapter(currentPacketId, {
          title: chapterTitle.trim(),
          content: chapterContent.trim(),
          chapterOrder: chapters.length,
          isPreview: chapterIsPreview,
        })
        setChapters(prev => [...prev, ch])
      }
      setShowChapterModal(false)
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Could not save chapter.')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteChapter = (ch: PacketChapter) => {
    Alert.alert('Delete chapter?', `"${ch.title}" will be permanently deleted.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          const currentPacketId = packetId ?? packet?.id
          if (!currentPacketId) return
          await deleteChapter(currentPacketId, ch.id)
          setChapters(prev => prev.filter(c => c.id !== ch.id))
        },
      },
    ])
  }

  const handleSubmitForReview = () => {
    const currentPacketId = packetId ?? packet?.id
    if (!currentPacketId) return
    if (chapters.length === 0) {
      Alert.alert('Add chapters first', 'Your packet needs at least one chapter before review.')
      return
    }
    Alert.alert(
      'Submit for review?',
      'Our team reviews packets within 2-3 days. You won\'t be able to edit it while it\'s in review.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit', onPress: async () => {
            setSubmitting(true)
            try {
              await submitPacket(currentPacketId)
              Alert.alert('Submitted!', 'Your packet is now in review. You\'ll be notified when it\'s approved.', [
                { text: 'Done', onPress: () => router.back() },
              ])
            } catch (e: any) {
              Alert.alert('Error', e?.message ?? 'Could not submit packet.')
            } finally {
              setSubmitting(false)
            }
          },
        },
      ]
    )
  }

  const handleDelete = () => {
    const currentPacketId = packetId ?? packet?.id
    if (!currentPacketId) return
    Alert.alert('Delete packet?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          await deletePacket(currentPacketId)
          router.back()
        },
      },
    ])
  }

  const isDraft = !packet || packet.status === 'draft' || packet.status === 'rejected'

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.center}>
          <Text style={styles.loadingText}>Loading…</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.kav} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.navBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.navTitle}>{isEditing ? 'Edit Packet' : 'New Packet'}</Text>
          <View style={styles.navActions}>
            {isDraft && (
              <TouchableOpacity
                style={[styles.saveBtn, saving && { opacity: 0.6 }]}
                onPress={handleSave}
                disabled={saving}
              >
                <Text style={styles.saveBtnText}>{saving ? '…' : 'Save'}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {packet?.status === 'rejected' && (
            <View style={styles.rejectedBanner}>
              <Ionicons name="close-circle-outline" size={16} color={Colors.error} />
              <Text style={styles.rejectedText}>
                {packet.status === 'rejected' ? 'Rejected — revise and resubmit.' : ''}
              </Text>
            </View>
          )}

          {packet?.status === 'pending_review' && (
            <View style={styles.reviewBanner}>
              <Ionicons name="hourglass-outline" size={16} color={Colors.accent} />
              <Text style={styles.reviewText}>Under review — editing disabled until a decision is made.</Text>
            </View>
          )}

          {/* Cover & emoji */}
          <View style={styles.coverRow}>
            <TouchableOpacity
              style={styles.emojiBtn}
              onPress={() => isDraft && setShowEmojiPicker(true)}
              disabled={!isDraft}
            >
              <Text style={styles.emojiDisplay}>{emoji}</Text>
              {isDraft && <Text style={styles.emojiHint}>tap to change</Text>}
            </TouchableOpacity>

            <View style={styles.coverMeta}>
              <TextInput
                style={[styles.titleInput, !isDraft && styles.inputDisabled]}
                placeholder="Packet title…"
                placeholderTextColor={Colors.textSecondary}
                value={title}
                onChangeText={setTitle}
                editable={isDraft}
                maxLength={80}
              />
            </View>
          </View>

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.descInput, !isDraft && styles.inputDisabled]}
            placeholder="One sentence: who is this for and what will they learn?"
            placeholderTextColor={Colors.textSecondary}
            value={description}
            onChangeText={setDescription}
            multiline
            editable={isDraft}
            maxLength={200}
          />

          <Text style={styles.label}>Category</Text>
          <View style={styles.catRow}>
            {PACKET_CATEGORIES.map(c => (
              <TouchableOpacity
                key={c.id}
                style={[styles.catChip, category === c.id && styles.catChipActive, !isDraft && styles.catChipDisabled]}
                onPress={() => isDraft && setCategory(c.id)}
              >
                <Text style={styles.catChipText}>{c.emoji} {c.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.chapterHeader}>
            <Text style={styles.label}>Chapters ({chapters.length})</Text>
            {isDraft && (
              <TouchableOpacity style={styles.addChapterBtn} onPress={openNewChapter}>
                <Ionicons name="add" size={16} color={Colors.primary} />
                <Text style={styles.addChapterText}>Add</Text>
              </TouchableOpacity>
            )}
          </View>

          {chapters.length === 0 ? (
            <TouchableOpacity style={styles.emptyChapters} onPress={isDraft ? openNewChapter : undefined}>
              <Ionicons name="document-text-outline" size={32} color={Colors.textTertiary} />
              <Text style={styles.emptyChaptersTitle}>No chapters yet</Text>
              <Text style={styles.emptyChaptersSub}>
                {isDraft ? 'Tap "Add" to write your first chapter' : 'No chapters added'}
              </Text>
            </TouchableOpacity>
          ) : (
            chapters.map((ch, i) => (
              <TouchableOpacity
                key={ch.id}
                style={styles.chapterRow}
                onPress={() => isDraft && openEditChapter(ch)}
                activeOpacity={isDraft ? 0.7 : 1}
              >
                <View style={styles.chapterNum}>
                  <Text style={styles.chapterNumText}>{i + 1}</Text>
                </View>
                <View style={styles.chapterInfo}>
                  <View style={styles.chapterTitleRow}>
                    <Text style={styles.chapterTitle} numberOfLines={1}>{ch.title}</Text>
                    {ch.isPreview && (
                      <View style={styles.previewBadge}>
                        <Text style={styles.previewBadgeText}>FREE</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.chapterPreview} numberOfLines={1}>{ch.content}</Text>
                </View>
                {isDraft && (
                  <TouchableOpacity onPress={() => handleDeleteChapter(ch)} style={styles.chapterDelete}>
                    <Ionicons name="trash-outline" size={16} color={Colors.error} />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            ))
          )}

          {/* Actions */}
          {isDraft && (
            <TouchableOpacity
              style={[styles.submitBtn, (submitting || chapters.length === 0) && styles.submitBtnDisabled]}
              onPress={handleSubmitForReview}
              disabled={submitting || chapters.length === 0}
            >
              <Ionicons name="paper-plane-outline" size={17} color="#fff" />
              <Text style={styles.submitBtnText}>{submitting ? 'Submitting…' : 'Submit for Review'}</Text>
            </TouchableOpacity>
          )}

          {isEditing && isDraft && (
            <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
              <Text style={styles.deleteBtnText}>Delete packet</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Emoji picker */}
      <Modal visible={showEmojiPicker} transparent animationType="fade">
        <TouchableOpacity style={styles.emojiOverlay} onPress={() => setShowEmojiPicker(false)} activeOpacity={1}>
          <View style={styles.emojiSheet}>
            <Text style={styles.emojiSheetTitle}>Choose an emoji</Text>
            <View style={styles.emojiGrid}>
              {EMOJIS.map(e => (
                <TouchableOpacity
                  key={e}
                  style={[styles.emojiCell, emoji === e && styles.emojiCellActive]}
                  onPress={() => { setEmoji(e); setShowEmojiPicker(false) }}
                >
                  <Text style={styles.emojiCellText}>{e}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Chapter editor modal */}
      <Modal visible={showChapterModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.chapterModalSafe} edges={['top', 'bottom']}>
          <KeyboardAvoidingView style={styles.kav} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.chapterModalNav}>
              <TouchableOpacity onPress={() => setShowChapterModal(false)}>
                <Text style={styles.chapterModalCancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.chapterModalTitle}>{editingChapter ? 'Edit Chapter' : 'New Chapter'}</Text>
              <TouchableOpacity
                style={[styles.chapterSaveBtn, saving && { opacity: 0.6 }]}
                onPress={handleSaveChapter}
                disabled={saving}
              >
                <Text style={styles.chapterSaveBtnText}>{saving ? '…' : 'Save'}</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.chapterModalScroll} keyboardShouldPersistTaps="handled">
              <View style={styles.previewToggleRow}>
                <Text style={styles.previewToggleLabel}>Free preview chapter</Text>
                <TouchableOpacity
                  style={[styles.previewToggle, chapterIsPreview && styles.previewToggleActive]}
                  onPress={() => setChapterIsPreview(v => !v)}
                >
                  <Text style={[styles.previewToggleText, chapterIsPreview && styles.previewToggleTextActive]}>
                    {chapterIsPreview ? 'YES' : 'NO'}
                  </Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.previewToggleHint}>
                Free chapters are visible to everyone. At least one chapter should be free to let readers preview before subscribing.
              </Text>

              <TextInput
                style={styles.chapterTitleInput}
                placeholder="Chapter title"
                placeholderTextColor={Colors.textSecondary}
                value={chapterTitle}
                onChangeText={setChapterTitle}
                maxLength={80}
              />

              <TextInput
                style={styles.chapterContentInput}
                placeholder="Write your chapter content here. Be specific — real examples, exact steps, and concrete numbers convert readers into subscribers..."
                placeholderTextColor={Colors.textSecondary}
                value={chapterContent}
                onChangeText={setChapterContent}
                multiline
                textAlignVertical="top"
              />
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  kav: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: Colors.textSecondary },
  navBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: Radius.full,
    backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center',
    ...Shadow.card,
  },
  navTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
  navActions: { flexDirection: 'row', gap: Spacing.sm },
  saveBtn: {
    paddingHorizontal: 18, paddingVertical: 9,
    backgroundColor: Colors.primary, borderRadius: Radius.full,
  },
  saveBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  scroll: { padding: Spacing.lg, paddingBottom: 48 },
  rejectedBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.error + '12', borderRadius: Radius.md,
    padding: Spacing.md, marginBottom: Spacing.lg,
  },
  rejectedText: { ...Typography.caption, color: Colors.error, flex: 1 },
  reviewBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.accent + '12', borderRadius: Radius.md,
    padding: Spacing.md, marginBottom: Spacing.lg,
  },
  reviewText: { ...Typography.caption, color: Colors.accent, flex: 1 },
  coverRow: { flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start', marginBottom: Spacing.lg },
  emojiBtn: { alignItems: 'center', gap: 4 },
  emojiDisplay: { fontSize: 44 },
  emojiHint: { ...Typography.caption, color: Colors.textTertiary, fontSize: 10 },
  coverMeta: { flex: 1 },
  titleInput: {
    fontSize: 18, fontWeight: '700', color: Colors.text,
    backgroundColor: Colors.card, borderRadius: Radius.md,
    padding: Spacing.md, ...Shadow.card,
  },
  inputDisabled: { opacity: 0.6 },
  label: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary, letterSpacing: 0.8, marginBottom: Spacing.sm, marginTop: Spacing.lg },
  descInput: {
    backgroundColor: Colors.card, borderRadius: Radius.md,
    padding: Spacing.md, fontSize: 14, color: Colors.text,
    minHeight: 72, ...Shadow.card,
  },
  catRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catChip: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: Radius.full,
    borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.card,
  },
  catChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  catChipDisabled: { opacity: 0.5 },
  catChipText: { fontSize: 12, fontWeight: '600', color: Colors.text },
  chapterHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: Spacing.lg },
  addChapterBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addChapterText: { fontSize: 14, fontWeight: '600', color: Colors.primary },
  emptyChapters: {
    alignItems: 'center', paddingVertical: 40, gap: Spacing.sm,
    backgroundColor: Colors.card, borderRadius: Radius.xl, marginTop: Spacing.sm,
    borderWidth: 1.5, borderColor: Colors.border, borderStyle: 'dashed',
  },
  emptyChaptersTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
  emptyChaptersSub: { ...Typography.caption, color: Colors.textSecondary },
  chapterRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    padding: Spacing.md, marginTop: Spacing.sm, ...Shadow.card,
  },
  chapterNum: {
    width: 28, height: 28, borderRadius: Radius.full,
    backgroundColor: Colors.primary + '15', alignItems: 'center', justifyContent: 'center',
  },
  chapterNumText: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  chapterInfo: { flex: 1 },
  chapterTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  chapterTitle: { fontSize: 14, fontWeight: '700', color: Colors.text, flex: 1 },
  previewBadge: {
    backgroundColor: Colors.success + '20', borderRadius: Radius.full,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  previewBadgeText: { fontSize: 9, fontWeight: '800', color: Colors.success, letterSpacing: 0.5 },
  chapterPreview: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  chapterDelete: { padding: 4 },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.primary, borderRadius: Radius.full,
    paddingVertical: 15, marginTop: Spacing.xl,
  },
  submitBtnDisabled: { opacity: 0.35 },
  submitBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  deleteBtn: { alignItems: 'center', paddingVertical: Spacing.lg },
  deleteBtnText: { ...Typography.caption, color: Colors.error },
  emojiOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.overlay },
  emojiSheet: {
    backgroundColor: Colors.card, borderRadius: Radius.xl,
    padding: Spacing.xl, width: 280,
  },
  emojiSheetTitle: { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: Spacing.md, textAlign: 'center' },
  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  emojiCell: {
    width: 44, height: 44, borderRadius: Radius.md,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  emojiCellActive: { backgroundColor: Colors.primary + '20' },
  emojiCellText: { fontSize: 22 },
  chapterModalSafe: { flex: 1, backgroundColor: Colors.background },
  chapterModalNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  chapterModalCancel: { fontSize: 15, color: Colors.textSecondary },
  chapterModalTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
  chapterSaveBtn: {
    paddingHorizontal: 18, paddingVertical: 8,
    backgroundColor: Colors.primary, borderRadius: Radius.full,
  },
  chapterSaveBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  chapterModalScroll: { padding: Spacing.lg },
  previewToggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  previewToggleLabel: { fontSize: 14, fontWeight: '600', color: Colors.text },
  previewToggle: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: Radius.full,
    backgroundColor: Colors.background, borderWidth: 1.5, borderColor: Colors.border,
  },
  previewToggleActive: { backgroundColor: Colors.success, borderColor: Colors.success },
  previewToggleText: { fontSize: 11, fontWeight: '800', color: Colors.textSecondary, letterSpacing: 0.5 },
  previewToggleTextActive: { color: '#fff' },
  previewToggleHint: { ...Typography.caption, color: Colors.textTertiary, marginBottom: Spacing.lg, lineHeight: 16 },
  chapterTitleInput: {
    fontSize: 17, fontWeight: '700', color: Colors.text,
    backgroundColor: Colors.card, borderRadius: Radius.md,
    padding: Spacing.md, marginBottom: Spacing.md, ...Shadow.card,
  },
  chapterContentInput: {
    fontSize: 14, color: Colors.text, lineHeight: 22,
    backgroundColor: Colors.card, borderRadius: Radius.md,
    padding: Spacing.md, minHeight: 320, ...Shadow.card,
  },
})
