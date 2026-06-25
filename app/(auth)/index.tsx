import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { Colors, Spacing, Radius, Shadow, Typography } from '../../constants/theme'
import { saveUser } from '../../lib/auth'

export default function SignInScreen() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [handle, setHandle] = useState('')
  const [bio, setBio] = useState('')
  const [loading, setLoading] = useState(false)

  const canContinue = name.trim().length > 0

  const handleContinue = async () => {
    if (!canContinue || loading) return
    setLoading(true)
    const cleanHandle = handle.trim().replace(/^@/, '') ||
      name.trim().toLowerCase().replace(/\s+/g, '')
    await saveUser({
      name: name.trim(),
      handle: `@${cleanHandle}`,
      bio: bio.trim(),
      createdAt: new Date().toISOString(),
    })
    router.replace('/(tabs)')
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Brand */}
          <View style={styles.brandBlock}>
            <View style={styles.logoMark}>
              <Text style={styles.logoText}>✦</Text>
            </View>
            <Text style={styles.brandName}>grimoire</Text>
          </View>

          {/* Hero */}
          <View style={styles.heroBlock}>
            <Text style={styles.heroTitle}>Launch with confidence.</Text>
            <Text style={styles.heroSub}>
              Grimoire surfaces launch risks, scans your repo, and captures every insight you need — before you ship.
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>YOUR NAME</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Pericles Gadri"
                placeholderTextColor={Colors.textTertiary}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>HANDLE</Text>
              <View style={styles.handleRow}>
                <Text style={styles.atSign}>@</Text>
                <TextInput
                  style={[styles.input, styles.handleInput]}
                  value={handle}
                  onChangeText={v => setHandle(v.replace(/^@/, ''))}
                  placeholder={name ? name.toLowerCase().replace(/\s+/g, '') : 'yourhandle'}
                  placeholderTextColor={Colors.textTertiary}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>BIO <Text style={styles.optional}>(optional)</Text></Text>
              <TextInput
                style={[styles.input, styles.bioInput]}
                value={bio}
                onChangeText={setBio}
                placeholder="Vibe coder. Building in public."
                placeholderTextColor={Colors.textTertiary}
                multiline
                returnKeyType="done"
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.ctaBtn, !canContinue && styles.ctaBtnDisabled]}
            onPress={handleContinue}
            disabled={!canContinue || loading}
            activeOpacity={0.85}
          >
            <Text style={styles.ctaBtnText}>{loading ? 'Setting up...' : 'Enter Grimoire'}</Text>
          </TouchableOpacity>

          <Text style={styles.footnote}>
            Your data stays on your device. No account required.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.xl, paddingBottom: 48, flexGrow: 1 },
  brandBlock: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: Spacing.xl * 2 },
  logoMark: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  logoText: { color: Colors.card, fontSize: 18, fontWeight: '700' },
  brandName: { fontSize: 22, fontWeight: '800', color: Colors.text, letterSpacing: -0.5 },
  heroBlock: { marginBottom: Spacing.xl * 1.5, gap: Spacing.sm },
  heroTitle: { fontSize: 30, fontWeight: '800', color: Colors.text, lineHeight: 36 },
  heroSub: { fontSize: 16, color: Colors.textSecondary, lineHeight: 24 },
  form: { gap: Spacing.lg, marginBottom: Spacing.xl },
  fieldGroup: { gap: 8 },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary, letterSpacing: 0.5 },
  optional: { fontWeight: '400', color: Colors.textTertiary },
  input: {
    backgroundColor: Colors.card, borderRadius: Radius.md,
    paddingHorizontal: Spacing.md, paddingVertical: 14,
    fontSize: 16, color: Colors.text, ...Shadow.card,
  },
  handleRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: Radius.md, ...Shadow.card },
  atSign: { paddingLeft: Spacing.md, fontSize: 16, color: Colors.accent, fontWeight: '700' },
  handleInput: { flex: 1, backgroundColor: 'transparent', shadowOpacity: 0, elevation: 0, borderRadius: 0, paddingLeft: 4 },
  bioInput: { minHeight: 80, textAlignVertical: 'top' },
  ctaBtn: {
    backgroundColor: Colors.primary, borderRadius: Radius.full,
    paddingVertical: 17, alignItems: 'center', marginBottom: Spacing.lg,
    ...Shadow.card,
  },
  ctaBtnDisabled: { opacity: 0.35 },
  ctaBtnText: { ...Typography.button, color: Colors.card, fontSize: 17 },
  footnote: { ...Typography.caption, color: Colors.textTertiary, textAlign: 'center', lineHeight: 18 },
})
