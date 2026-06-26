import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform, Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Colors, Spacing, Radius, Shadow, Typography } from '../constants/theme'
import { createMilestone, MILESTONE_LABELS, type MilestoneType } from '../lib/community'

const USER_KEY = 'grimoire:user'

const MILESTONE_OPTIONS: { type: MilestoneType; emoji: string; label: string; sub: string }[] = [
  { type: 'shipped', emoji: '🚀', label: 'Shipped', sub: 'Pushed to production' },
  { type: 'first_user', emoji: '👤', label: 'First user', sub: 'Someone signed up' },
  { type: 'first_dollar', emoji: '💵', label: 'First dollar', sub: 'Revenue hit' },
  { type: 'hundred_users', emoji: '🎯', label: '100 users', sub: 'Growing' },
  { type: 'other', emoji: '🏁', label: 'Other milestone', sub: 'Your own milestone' },
]

export default function NewMilestoneScreen() {
  const router = useRouter()
  const [selectedType, setSelectedType] = useState<MilestoneType | null>(null)
  const [projectName, setProjectName] = useState('')
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!selectedType) {
      Alert.alert('Pick a milestone type')
      return
    }
    if (!projectName.trim()) {
      Alert.alert('Add your project name')
      return
    }
    setSubmitting(true)
    try {
      const raw = await AsyncStorage.getItem(USER_KEY)
      const user = raw ? JSON.parse(raw) : null
      await createMilestone({
        type: selectedType,
        projectName: projectName.trim(),
        body: body.trim(),
        authorName: user?.name ?? 'You',
      })
      router.back()
    } catch {
      Alert.alert('Error', 'Could not post milestone.')
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
          <Text style={styles.navTitle}>Post a Milestone</Text>
          <TouchableOpacity
            style={[styles.postBtn, (!selectedType || !projectName.trim() || submitting) && styles.postBtnDisabled]}
            onPress={handleSubmit}
            disabled={!selectedType || !projectName.trim() || submitting}
          >
            <Text style={styles.postBtnText}>{submitting ? 'Posting…' : 'Post'}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>What did you hit?</Text>
          <View style={styles.milestoneGrid}>
            {MILESTONE_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.type}
                style={[styles.milestoneCard, selectedType === opt.type && styles.milestoneCardActive]}
                onPress={() => setSelectedType(opt.type)}
              >
                <Text style={styles.milestoneEmoji}>{opt.emoji}</Text>
                <Text style={[styles.milestoneLabel, selectedType === opt.type && styles.milestoneLabelActive]}>
                  {opt.label}
                </Text>
                <Text style={styles.milestoneSub}>{opt.sub}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Project name</Text>
          <TextInput
            style={styles.input}
            placeholder="Vibecoded, my SaaS, etc."
            placeholderTextColor={Colors.textSecondary}
            value={projectName}
            onChangeText={setProjectName}
          />

          <Text style={styles.label}>Tell the story (optional)</Text>
          <TextInput
            style={styles.bodyInput}
            placeholder="How long did it take? What almost killed it? What's next?"
            placeholderTextColor={Colors.textSecondary}
            value={body}
            onChangeText={setBody}
            multiline
            textAlignVertical="top"
          />

          <View style={styles.tip}>
            <Text style={styles.tipEmoji}>🎉</Text>
            <Text style={styles.tipText}>
              Every milestone posted here is a signal for other builders that shipping is possible.
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
  label: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary, letterSpacing: 0.8, marginBottom: Spacing.sm, marginTop: Spacing.md },
  milestoneGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  milestoneCard: {
    width: '47%', backgroundColor: Colors.card, borderRadius: Radius.lg,
    padding: Spacing.md, alignItems: 'center', gap: 4,
    borderWidth: 1.5, borderColor: Colors.border, ...Shadow.card,
  },
  milestoneCardActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '08' },
  milestoneEmoji: { fontSize: 28, marginBottom: 2 },
  milestoneLabel: { fontSize: 13, fontWeight: '700', color: Colors.text },
  milestoneLabelActive: { color: Colors.primary },
  milestoneSub: { fontSize: 11, color: Colors.textSecondary, textAlign: 'center' },
  input: {
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md, paddingVertical: 14,
    fontSize: 15, color: Colors.text, ...Shadow.card,
  },
  bodyInput: {
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md, paddingVertical: 14,
    fontSize: 14, color: Colors.text, minHeight: 100, ...Shadow.card,
  },
  tip: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm,
    backgroundColor: Colors.gold + '12', borderRadius: Radius.lg,
    padding: Spacing.md, marginTop: Spacing.xl,
  },
  tipEmoji: { fontSize: 18 },
  tipText: { ...Typography.caption, color: Colors.gold, flex: 1, lineHeight: 18, fontWeight: '600' },
})
