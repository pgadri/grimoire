import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform, Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { Colors, Spacing, Radius, Shadow, Typography } from '../constants/theme'
import { applyToBeCreator } from '../lib/packets'

export default function CreatorApplyScreen() {
  const router = useRouter()
  const [motivation, setMotivation] = useState('')
  const [sample, setSample] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const canSubmit = motivation.trim().length >= 50 && sample.trim().length >= 100 && !submitting

  const handleSubmit = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    try {
      const result = await applyToBeCreator({
        motivation: motivation.trim(),
        sampleContent: sample.trim(),
      })
      if (result.autoApproved) {
        Alert.alert(
          '🎨 You\'re a Creator!',
          'Your Expert reputation unlocked Creator Mode instantly. Start building your first knowledge packet.',
          [{ text: 'Let\'s go', onPress: () => router.replace('/creator-setup' as any) }],
        )
      } else {
        Alert.alert(
          'Application submitted',
          'We review applications within 2-3 business days. You\'ll be notified by email when it\'s approved.',
          [{ text: 'Got it', onPress: () => router.back() }],
        )
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Something went wrong. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.kav} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.navBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Apply to be a Creator</Text>
          <TouchableOpacity
            style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={!canSubmit}
          >
            <Text style={styles.submitBtnText}>{submitting ? 'Sending…' : 'Apply'}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.heroBadge}>
            <Text style={styles.heroEmoji}>🎨</Text>
            <View>
              <Text style={styles.heroTitle}>Creator Mode</Text>
              <Text style={styles.heroSub}>Build knowledge packets. Build an audience.</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            {[
              { icon: 'library-outline', text: 'Publish knowledge packets on any topic you know deeply' },
              { icon: 'people-outline', text: 'Build a following of builders who learn from you' },
              { icon: 'cash-outline', text: 'Earn 70% of platform revenue proportional to your reads' },
            ].map((item, i) => (
              <View key={i} style={styles.infoItem}>
                <Ionicons name={item.icon as any} size={20} color={Colors.primary} />
                <Text style={styles.infoText}>{item.text}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.label}>Why do you want to be a creator? *</Text>
          <Text style={styles.labelHint}>What expertise will you share? What builders will you help? (50+ characters)</Text>
          <TextInput
            style={styles.textArea}
            placeholder="e.g. I've launched 3 apps to the App Store and want to share what I've learned about growth, pricing, and distribution with other builders..."
            placeholderTextColor={Colors.textSecondary}
            value={motivation}
            onChangeText={setMotivation}
            multiline
            textAlignVertical="top"
          />
          <Text style={[styles.charCount, motivation.length < 50 && styles.charCountWarn]}>
            {motivation.length}/50 minimum
          </Text>

          <Text style={styles.label}>Sample content *</Text>
          <Text style={styles.labelHint}>Paste a sample of what a knowledge packet from you would look like — a key lesson, framework, or how-to. (100+ characters)</Text>
          <TextInput
            style={[styles.textArea, styles.textAreaLarge]}
            placeholder="e.g. The 3 things I do before every App Store launch: 1) Screenshot optimization — your first frame in search results needs to show the outcome, not the feature. I use..."
            placeholderTextColor={Colors.textSecondary}
            value={sample}
            onChangeText={setSample}
            multiline
            textAlignVertical="top"
          />
          <Text style={[styles.charCount, sample.length < 100 && styles.charCountWarn]}>
            {sample.length}/100 minimum
          </Text>

          <View style={styles.autoApproveCard}>
            <Ionicons name="flash-outline" size={15} color={Colors.accent} />
            <Text style={styles.autoApproveText}>
              Reach Expert level (500 Gears ⚙️) and your application is auto-approved instantly.
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
  navTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
  submitBtn: {
    paddingHorizontal: 18, paddingVertical: 9,
    backgroundColor: Colors.primary, borderRadius: Radius.full,
  },
  submitBtnDisabled: { backgroundColor: Colors.textTertiary },
  submitBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  scroll: { padding: Spacing.lg, paddingBottom: 48 },
  heroBadge: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.card, borderRadius: Radius.xl,
    padding: Spacing.lg, marginBottom: Spacing.lg, ...Shadow.card,
  },
  heroEmoji: { fontSize: 36 },
  heroTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  heroSub: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  infoRow: { gap: Spacing.sm, marginBottom: Spacing.xl },
  infoItem: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, paddingVertical: 6 },
  infoText: { fontSize: 14, color: Colors.text, flex: 1, lineHeight: 20 },
  label: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary, letterSpacing: 0.8, marginBottom: 4, marginTop: Spacing.lg },
  labelHint: { ...Typography.caption, color: Colors.textTertiary, marginBottom: Spacing.sm, lineHeight: 16 },
  textArea: {
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    padding: Spacing.md, fontSize: 14, color: Colors.text,
    minHeight: 100, ...Shadow.card,
  },
  textAreaLarge: { minHeight: 150 },
  charCount: { ...Typography.caption, color: Colors.success, textAlign: 'right', marginTop: 4 },
  charCountWarn: { color: Colors.textTertiary },
  autoApproveCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: Colors.accent + '12', borderRadius: Radius.lg,
    padding: Spacing.md, marginTop: Spacing.xl,
  },
  autoApproveText: { ...Typography.caption, color: Colors.accent, flex: 1, lineHeight: 18, fontWeight: '500' },
})
