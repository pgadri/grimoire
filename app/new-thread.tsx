import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform, Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useState } from 'react'
import { Colors, Spacing, Radius, Shadow, Typography } from '../constants/theme'
import { createThread } from '../lib/threads'
import { checkThreadLimit, incrementThreadCount, limitMessage } from '../lib/limits'

const TAGS = ['auth', 'payments', 'deployment', 'ux', 'marketing', 'growth', 'pricing', 'technical', 'other']

export default function NewThreadScreen() {
  const router = useRouter()
  const { captureId, captureTitle } = useLocalSearchParams<{ captureId?: string; captureTitle?: string }>()

  const [title, setTitle] = useState(captureTitle ? `Stuck on: ${captureTitle}` : '')
  const [body, setBody] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag],
    )
  }

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Add a title', "Describe what you're stuck on.")
      return
    }
    if (!body.trim()) {
      Alert.alert('Add context', "The more detail you share, the better answers you'll get.")
      return
    }
    const limitResult = await checkThreadLimit()
    if (limitResult.blocked) {
      Alert.alert(
        'Thread limit reached',
        limitMessage(limitResult),
        [
          { text: 'Upgrade', onPress: () => router.push('/paywall' as any) },
          { text: 'Cancel', style: 'cancel' },
        ]
      )
      return
    }
    setSubmitting(true)
    try {
      const fullBody = captureTitle
        ? `From: ${captureTitle}\n\n${body.trim()}`
        : body.trim()
      await createThread({ title: title.trim(), body: fullBody, tags: selectedTags })
      await incrementThreadCount()
      router.back()
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Could not post thread.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.navBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Ask Community</Text>
          <TouchableOpacity
            style={[styles.postBtn, (!title.trim() || !body.trim() || submitting) && styles.postBtnDisabled]}
            onPress={handleSubmit}
            disabled={!title.trim() || !body.trim() || submitting}
          >
            <Text style={styles.postBtnText}>{submitting ? 'Posting…' : 'Post'}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {captureTitle && (
            <View style={styles.anchorBadge}>
              <Ionicons name="link-outline" size={13} color={Colors.primary} />
              <Text style={styles.anchorText} numberOfLines={1}>From: {captureTitle}</Text>
            </View>
          )}

          <Text style={styles.label}>What are you stuck on?</Text>
          <TextInput
            style={styles.titleInput}
            placeholder="e.g. Can't figure out how to set up OAuth redirect URIs"
            placeholderTextColor={Colors.textSecondary}
            value={title}
            onChangeText={setTitle}
            maxLength={120}
          />

          <Text style={styles.label}>Give context</Text>
          <TextInput
            style={styles.bodyInput}
            placeholder="What have you tried? What exactly breaks? What's your setup?"
            placeholderTextColor={Colors.textSecondary}
            value={body}
            onChangeText={setBody}
            multiline
            textAlignVertical="top"
          />

          <Text style={styles.label}>Tags</Text>
          <View style={styles.tagRow}>
            {TAGS.map(tag => (
              <TouchableOpacity
                key={tag}
                style={[styles.tag, selectedTags.includes(tag) && styles.tagActive]}
                onPress={() => toggleTag(tag)}
              >
                <Text style={[styles.tagText, selectedTags.includes(tag) && styles.tagTextActive]}>
                  {tag}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.tip}>
            <Ionicons name="people-outline" size={15} color={Colors.accent} />
            <Text style={styles.tipText}>
              Builders who faced the same thing will reply. Be specific — vague questions get generic answers.
            </Text>
          </View>
        </ScrollView>
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
  navTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  postBtn: {
    paddingHorizontal: 18, paddingVertical: 9,
    backgroundColor: Colors.primary, borderRadius: Radius.full,
  },
  postBtnDisabled: { backgroundColor: Colors.textTertiary },
  postBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  scroll: { padding: Spacing.lg, paddingBottom: 40 },
  anchorBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.primary + '12', borderRadius: Radius.md,
    padding: Spacing.sm, paddingHorizontal: Spacing.md, marginBottom: Spacing.lg,
  },
  anchorText: { ...Typography.caption, color: Colors.primary, flex: 1, fontWeight: '600' },
  label: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary, letterSpacing: 0.8, marginBottom: Spacing.sm, marginTop: Spacing.md },
  titleInput: {
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md, paddingVertical: 14,
    fontSize: 15, color: Colors.text, ...Shadow.card,
  },
  bodyInput: {
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md, paddingVertical: 14,
    fontSize: 14, color: Colors.text, minHeight: 120, ...Shadow.card,
  },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: Spacing.xs },
  tag: {
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.card,
  },
  tagActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tagText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  tagTextActive: { color: '#fff' },
  tip: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: Colors.accent + '12', borderRadius: Radius.lg,
    padding: Spacing.md, marginTop: Spacing.xl,
  },
  tipText: { ...Typography.caption, color: Colors.accent, flex: 1, lineHeight: 18, fontWeight: '500' },
})
