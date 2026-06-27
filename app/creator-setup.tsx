import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { Colors, Spacing, Radius, Shadow, Typography } from '../constants/theme'
import { enableCreatorMode } from '../lib/creator'

const PLATFORM_FIELDS = [
  { key: 'youtubeUrl',    icon: 'logo-youtube',   label: 'YouTube',    placeholder: 'https://youtube.com/@you',       color: '#FF0000' },
  { key: 'twitterUrl',    icon: 'logo-twitter',   label: 'X / Twitter', placeholder: 'https://x.com/you',            color: '#1DA1F2' },
  { key: 'newsletterUrl', icon: 'mail-outline',   label: 'Newsletter', placeholder: 'https://yourblog.beehiiv.com',   color: '#F59E0B' },
  { key: 'websiteUrl',    icon: 'globe-outline',  label: 'Website',    placeholder: 'https://yoursite.com',           color: Colors.primary },
] as const

type FieldKey = typeof PLATFORM_FIELDS[number]['key']

export default function CreatorSetupScreen() {
  const router = useRouter()
  const [handle, setHandle]         = useState('')
  const [bio, setBio]               = useState('')
  const [links, setLinks]           = useState<Partial<Record<FieldKey, string>>>({})
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const [handleFocused, setHandleFocused] = useState(false)

  const cleanHandle = handle.toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 30)
  const handleValid = /^[a-z0-9_-]{3,30}$/.test(cleanHandle)
  const canSubmit = handleValid && !loading

  const handleSubmit = async () => {
    if (!canSubmit) return
    setLoading(true)
    setError('')
    try {
      await enableCreatorMode({
        handle: cleanHandle,
        bio: bio.trim() || undefined,
        ...links,
      })
      Alert.alert(
        "You're a Creator now! 🎉",
        `Your creator profile is live at vibecoded.tech/@${cleanHandle}`,
        [{ text: 'View profile', onPress: () => router.replace(`/creator/${cleanHandle}` as any) }],
      )
    } catch (e: any) {
      setError(e?.message ?? 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.navBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
            <Ionicons name="close" size={20} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Enable Creator Mode</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* Hero */}
          <View style={styles.hero}>
            <Text style={styles.heroEmoji}>🎨</Text>
            <Text style={styles.heroTitle}>Share your knowledge.</Text>
            <Text style={styles.heroSub}>
              Creator Mode lets you build a following, post content on Vibecoded,
              and sell curated knowledge packets to other builders.
            </Text>
          </View>

          {/* Perks */}
          <View style={styles.perksRow}>
            {[
              { emoji: '👥', label: 'Followers' },
              { emoji: '💰', label: 'Sell packets' },
              { emoji: '🔗', label: 'Profile link' },
            ].map(p => (
              <View key={p.label} style={styles.perk}>
                <Text style={styles.perkEmoji}>{p.emoji}</Text>
                <Text style={styles.perkLabel}>{p.label}</Text>
              </View>
            ))}
          </View>

          {/* Handle */}
          <Text style={styles.sectionLabel}>YOUR HANDLE *</Text>
          <View style={[styles.handleInputRow, handleFocused && styles.handleInputRowFocused]}>
            <Text style={styles.handleAt}>@</Text>
            <TextInput
              style={styles.handleInput}
              value={handle}
              onChangeText={v => { setHandle(v.toLowerCase().replace(/[^a-z0-9_-]/g, '')); setError('') }}
              placeholder="yourhandle"
              placeholderTextColor={Colors.textTertiary}
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={30}
              onFocus={() => setHandleFocused(true)}
              onBlur={() => setHandleFocused(false)}
            />
            {handle.length >= 3 && (
              <Ionicons
                name={handleValid ? 'checkmark-circle' : 'close-circle'}
                size={18}
                color={handleValid ? Colors.success : Colors.error}
              />
            )}
          </View>
          {handle.length > 0 && handleValid && (
            <Text style={styles.handlePreview}>
              vibecoded.tech/@{cleanHandle}
            </Text>
          )}

          {/* Bio */}
          <Text style={[styles.sectionLabel, { marginTop: Spacing.lg }]}>BIO</Text>
          <TextInput
            style={styles.bioInput}
            value={bio}
            onChangeText={setBio}
            placeholder="What do you build? What do you teach?"
            placeholderTextColor={Colors.textTertiary}
            multiline
            maxLength={160}
          />
          <Text style={styles.charCount}>{bio.length}/160</Text>

          {/* Social links */}
          <Text style={[styles.sectionLabel, { marginTop: Spacing.lg }]}>YOUR PLATFORMS</Text>
          <Text style={styles.platformsHint}>Link where people already follow you</Text>

          {PLATFORM_FIELDS.map(field => (
            <View key={field.key} style={styles.linkRow}>
              <View style={[styles.linkIcon, { backgroundColor: field.color + '18' }]}>
                <Ionicons name={field.icon as any} size={18} color={field.color} />
              </View>
              <TextInput
                style={styles.linkInput}
                value={links[field.key] ?? ''}
                onChangeText={v => setLinks(prev => ({ ...prev, [field.key]: v }))}
                placeholder={field.placeholder}
                placeholderTextColor={Colors.textTertiary}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />
            </View>
          ))}

          {error ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.ctaBtn, !canSubmit && styles.ctaBtnDisabled]}
            onPress={handleSubmit}
            disabled={!canSubmit}
            activeOpacity={0.88}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <>
                  <Text style={styles.ctaBtnText}>Enable Creator Mode</Text>
                  <Ionicons name="sparkles" size={18} color="#fff" />
                </>
            }
          </TouchableOpacity>

          <Text style={styles.footnote}>
            Your profile will be public at vibecoded.tech/@handle. You can update your info anytime from your profile.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  navBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  closeBtn: {
    width: 36, height: 36, borderRadius: Radius.full,
    backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center',
    ...Shadow.card,
  },
  navTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },

  scroll: { padding: Spacing.lg, paddingBottom: 48 },

  hero: { alignItems: 'center', paddingVertical: Spacing.lg, gap: Spacing.sm, marginBottom: Spacing.md },
  heroEmoji: { fontSize: 44 },
  heroTitle: { fontSize: 24, fontWeight: '800', color: Colors.text },
  heroSub: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 21 },

  perksRow: {
    flexDirection: 'row', justifyContent: 'space-around',
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    padding: Spacing.lg, marginBottom: Spacing.xl, ...Shadow.card,
  },
  perk: { alignItems: 'center', gap: 6 },
  perkEmoji: { fontSize: 24 },
  perkLabel: { fontSize: 12, fontWeight: '700', color: Colors.text },

  sectionLabel: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary, letterSpacing: 0.8, marginBottom: 8 },

  handleInputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.card, borderRadius: Radius.md,
    paddingHorizontal: Spacing.md, borderWidth: 2, borderColor: Colors.border,
    ...Shadow.card,
  },
  handleInputRowFocused: { borderColor: Colors.primary },
  handleAt: { fontSize: 18, fontWeight: '700', color: Colors.primary, marginRight: 4 },
  handleInput: { flex: 1, fontSize: 17, fontWeight: '600', color: Colors.text, paddingVertical: 13 },
  handlePreview: { fontSize: 12, color: Colors.primary, marginTop: 6, fontWeight: '500' },

  bioInput: {
    backgroundColor: Colors.card, borderRadius: Radius.md,
    padding: Spacing.md, fontSize: 15, color: Colors.text,
    minHeight: 80, textAlignVertical: 'top', ...Shadow.card,
  },
  charCount: { fontSize: 11, color: Colors.textTertiary, textAlign: 'right', marginTop: 4 },

  platformsHint: { fontSize: 12, color: Colors.textSecondary, marginBottom: Spacing.md },
  linkRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  linkIcon: {
    width: 40, height: 40, borderRadius: Radius.sm,
    alignItems: 'center', justifyContent: 'center',
  },
  linkInput: {
    flex: 1, backgroundColor: Colors.card, borderRadius: Radius.md,
    paddingHorizontal: Spacing.md, paddingVertical: 11,
    fontSize: 14, color: Colors.text, ...Shadow.card,
  },

  errorBanner: {
    backgroundColor: Colors.error + '15', borderRadius: Radius.md,
    padding: Spacing.md, marginBottom: Spacing.md,
  },
  errorText: { fontSize: 13, color: Colors.error, fontWeight: '500' },

  ctaBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.primary, borderRadius: Radius.full,
    paddingVertical: 17, marginTop: Spacing.xl, ...Shadow.card,
  },
  ctaBtnDisabled: { opacity: 0.35 },
  ctaBtnText: { fontSize: 17, fontWeight: '800', color: '#fff' },

  footnote: {
    fontSize: 12, color: Colors.textTertiary, textAlign: 'center',
    lineHeight: 18, marginTop: Spacing.lg, paddingHorizontal: Spacing.md,
  },
})
