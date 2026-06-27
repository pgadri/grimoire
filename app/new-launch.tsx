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
import { createProduct, type ProductStage, type ReviewType } from '../lib/community'
import { awardPoints } from '../lib/reputation'

const USER_KEY = 'grimoire:user'

const CATEGORIES = ['App', 'SaaS', 'Mobile', 'AI', 'Dev Tool', 'API', 'Browser Ext', 'Other']
const STAGE_OPTIONS: { stage: ProductStage; label: string; sub: string }[] = [
  { stage: 'idea',   label: '💡 Idea',   sub: 'Concept only' },
  { stage: 'beta',   label: '🧪 Beta',   sub: 'Early access' },
  { stage: 'live',   label: '✅ Live',   sub: 'Shipped & running' },
  { stage: 'sunset', label: '🌅 Sunset', sub: 'No longer active' },
]
const LOOKING_FOR_OPTIONS: { type: ReviewType; label: string; icon: string }[] = [
  { type: 'feedback', label: 'General feedback', icon: '💬' },
  { type: 'review',   label: 'Ratings & reviews',  icon: '⭐' },
  { type: 'bug',      label: 'Bug reports',        icon: '🐛' },
  { type: 'tester',   label: 'Beta testers',       icon: '🧪' },
]
const EMOJI_OPTIONS = ['🚀', '⚡', '🔥', '🎯', '🛠️', '🤖', '💡', '🌐', '🎮', '📱', '🔐', '💰']

export default function NewLaunchScreen() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [tagline, setTagline] = useState('')
  const [description, setDescription] = useState('')
  const [url, setUrl] = useState('')
  const [category, setCategory] = useState('')
  const [stage, setStage] = useState<ProductStage>('beta')
  const [logoEmoji, setLogoEmoji] = useState('🚀')
  const [tags, setTagsRaw] = useState('')
  const [lookingFor, setLookingFor] = useState<ReviewType[]>(['feedback'])
  const [submitting, setSubmitting] = useState(false)

  const toggleLookingFor = (t: ReviewType) =>
    setLookingFor(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])

  const canSubmit = name.trim().length > 0 && tagline.trim().length > 0 && category.length > 0

  const handleSubmit = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    try {
      const raw = await AsyncStorage.getItem(USER_KEY)
      const user = raw ? JSON.parse(raw) : null
      const tagList = tags.split(',').map(t => t.trim()).filter(Boolean)
      const product = await createProduct({
        name: name.trim(),
        tagline: tagline.trim(),
        description: description.trim(),
        url: url.trim() || undefined,
        category,
        stage,
        logoEmoji,
        tags: tagList,
        lookingFor,
      })
      await awardPoints('product_launched', `Launched ${name.trim()}`)
      router.replace(`/launch/${product.id}` as any)
    } catch {
      Alert.alert('Error', 'Could not submit launch.')
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
          <Text style={styles.navTitle}>Submit a Launch</Text>
          <TouchableOpacity
            style={[styles.postBtn, (!canSubmit || submitting) && styles.postBtnDisabled]}
            onPress={handleSubmit}
            disabled={!canSubmit || submitting}
          >
            <Text style={styles.postBtnText}>{submitting ? 'Posting…' : 'Launch'}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.rewardBanner}>
            <Text style={styles.rewardEmoji}>🎯</Text>
            <Text style={styles.rewardText}>Launching earns you +15 reputation points</Text>
          </View>

          <Text style={styles.label}>LOGO EMOJI</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.emojiRow}>
            {EMOJI_OPTIONS.map(e => (
              <TouchableOpacity
                key={e}
                style={[styles.emojiBtn, logoEmoji === e && styles.emojiBtnActive]}
                onPress={() => setLogoEmoji(e)}
              >
                <Text style={styles.emojiText}>{e}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.label}>PRODUCT NAME</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName}
            placeholder="Vibecoded" placeholderTextColor={Colors.textTertiary} />

          <Text style={styles.label}>TAGLINE <Text style={styles.sub}>(one sentence)</Text></Text>
          <TextInput style={styles.input} value={tagline} onChangeText={setTagline}
            placeholder="Launch with confidence as a vibe coder"
            placeholderTextColor={Colors.textTertiary} maxLength={100} />

          <Text style={styles.label}>DESCRIPTION <Text style={styles.sub}>(optional)</Text></Text>
          <TextInput style={styles.bodyInput} value={description} onChangeText={setDescription}
            placeholder="What does it do? Who is it for? What problem does it solve?"
            placeholderTextColor={Colors.textTertiary} multiline textAlignVertical="top" />

          <Text style={styles.label}>LINK <Text style={styles.sub}>(optional — TestFlight, web, etc.)</Text></Text>
          <TextInput style={styles.input} value={url} onChangeText={setUrl}
            placeholder="https://" placeholderTextColor={Colors.textTertiary}
            autoCapitalize="none" autoCorrect={false} keyboardType="url" />

          <Text style={styles.label}>CATEGORY</Text>
          <View style={styles.chipRow}>
            {CATEGORIES.map(c => (
              <TouchableOpacity key={c}
                style={[styles.chip, category === c && styles.chipActive]}
                onPress={() => setCategory(c)}>
                <Text style={[styles.chipText, category === c && styles.chipTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>STAGE</Text>
          <View style={styles.stageRow}>
            {STAGE_OPTIONS.map(opt => (
              <TouchableOpacity key={opt.stage}
                style={[styles.stageCard, stage === opt.stage && styles.stageCardActive]}
                onPress={() => setStage(opt.stage)}>
                <Text style={styles.stageEmoji}>{opt.label.split(' ')[0]}</Text>
                <Text style={[styles.stageLabel, stage === opt.stage && styles.stageLabelActive]}>
                  {opt.label.split(' ').slice(1).join(' ')}
                </Text>
                <Text style={styles.stageSub}>{opt.sub}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>LOOKING FOR</Text>
          <View style={styles.chipRow}>
            {LOOKING_FOR_OPTIONS.map(opt => (
              <TouchableOpacity key={opt.type}
                style={[styles.chip, lookingFor.includes(opt.type) && styles.chipActive]}
                onPress={() => toggleLookingFor(opt.type)}>
                <Text style={[styles.chipText, lookingFor.includes(opt.type) && styles.chipTextActive]}>
                  {opt.icon} {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>TAGS <Text style={styles.sub}>(comma-separated)</Text></Text>
          <TextInput style={styles.input} value={tags} onChangeText={setTagsRaw}
            placeholder="react-native, expo, ai" placeholderTextColor={Colors.textTertiary}
            autoCapitalize="none" />

          <View style={styles.note}>
            <Ionicons name="information-circle-outline" size={15} color={Colors.textSecondary} />
            <Text style={styles.noteText}>
              Launches are visible to the community. You can't download anything — the community leaves feedback, reviews, and bug reports here.
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
    backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center', ...Shadow.card,
  },
  navTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  postBtn: { paddingHorizontal: 18, paddingVertical: 9, backgroundColor: Colors.primary, borderRadius: Radius.full },
  postBtnDisabled: { backgroundColor: Colors.textTertiary },
  postBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  scroll: { padding: Spacing.lg, paddingBottom: 48 },
  rewardBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.gold + '15', borderRadius: Radius.lg,
    padding: Spacing.md, marginBottom: Spacing.lg,
  },
  rewardEmoji: { fontSize: 18 },
  rewardText: { fontSize: 13, fontWeight: '600', color: Colors.gold, flex: 1 },
  label: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary, letterSpacing: 0.8, marginTop: Spacing.lg, marginBottom: Spacing.sm },
  sub: { fontWeight: '400', color: Colors.textTertiary },
  input: {
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md, paddingVertical: 14,
    fontSize: 15, color: Colors.text, ...Shadow.card,
  },
  bodyInput: {
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md, paddingVertical: 14,
    fontSize: 14, color: Colors.text, minHeight: 90, ...Shadow.card,
  },
  emojiRow: { marginBottom: Spacing.xs },
  emojiBtn: {
    width: 44, height: 44, borderRadius: Radius.md, marginRight: 8,
    backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: Colors.border,
  },
  emojiBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '12' },
  emojiText: { fontSize: 22 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.card,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  chipTextActive: { color: '#fff' },
  stageRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  stageCard: {
    flex: 1, minWidth: '44%', backgroundColor: Colors.card, borderRadius: Radius.lg,
    padding: Spacing.md, alignItems: 'center', gap: 2,
    borderWidth: 1.5, borderColor: Colors.border, ...Shadow.card,
  },
  stageCardActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '08' },
  stageEmoji: { fontSize: 22, marginBottom: 2 },
  stageLabel: { fontSize: 13, fontWeight: '700', color: Colors.text },
  stageLabelActive: { color: Colors.primary },
  stageSub: { fontSize: 11, color: Colors.textSecondary },
  note: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    padding: Spacing.md, marginTop: Spacing.xl, ...Shadow.card,
  },
  noteText: { ...Typography.caption, color: Colors.textSecondary, flex: 1, lineHeight: 18 },
})
