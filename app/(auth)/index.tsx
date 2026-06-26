import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { Colors, Spacing, Radius, Shadow, Typography } from '../../constants/theme'
import { signUp, signIn, requestPasswordReset } from '../../lib/auth'

type Mode = 'signin' | 'signup'

export default function AuthScreen() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('signin')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const canSubmit = mode === 'signup'
    ? name.trim().length > 0 && email.includes('@') && password.length >= 8 && password === confirmPassword
    : email.includes('@') && password.length >= 1

  const handleSubmit = async () => {
    if (!canSubmit || loading) return
    setLoading(true)
    setError('')
    try {
      const cleanEmail = email.trim().toLowerCase()
      if (mode === 'signup') {
        if (password !== confirmPassword) { setError("Passwords don't match"); return }
        await signUp({ name: name.trim(), email: cleanEmail, password })
        router.replace({ pathname: '/(auth)/verify', params: { email: cleanEmail, flow: 'verify' } } as any)
      } else {
        const result = await signIn({ email: cleanEmail, password })
        if ('unverified' in result) {
          router.replace({ pathname: '/(auth)/verify', params: { email: cleanEmail, flow: 'verify' } } as any)
        } else {
          router.replace('/(tabs)')
        }
      }
    } catch (e: any) {
      setError(e?.message ?? 'Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    const cleanEmail = email.trim().toLowerCase()
    if (!cleanEmail.includes('@')) {
      setError('Enter your email first, then tap Forgot password.')
      return
    }
    setLoading(true)
    try {
      await requestPasswordReset(cleanEmail)
      router.push({ pathname: '/(auth)/verify', params: { email: cleanEmail, flow: 'reset' } } as any)
    } finally {
      setLoading(false)
    }
  }

  const switchMode = () => {
    setError('')
    setPassword('')
    setConfirmPassword('')
    setMode(m => m === 'signin' ? 'signup' : 'signin')
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
          <View style={styles.brandBlock}>
            <View style={styles.logoMark}>
              <Text style={styles.logoText}>✦</Text>
            </View>
            <Text style={styles.brandName}>Vibecoded</Text>
          </View>

          <View style={styles.heroBlock}>
            <Text style={styles.heroTitle}>
              {mode === 'signin' ? 'Welcome back.' : 'Launch with confidence.'}
            </Text>
            <Text style={styles.heroSub}>
              {mode === 'signin'
                ? 'Sign in to your builder account.'
                : 'Capture what you learn. Ship without fear.'}
            </Text>
          </View>

          <View style={styles.form}>
            {mode === 'signup' && (
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
            )}

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>EMAIL</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={Colors.textTertiary}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                returnKeyType="next"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>PASSWORD {mode === 'signup' && <Text style={styles.hint}>(min 8 characters)</Text>}</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder={mode === 'signup' ? 'Create a password' : 'Your password'}
                placeholderTextColor={Colors.textTertiary}
                secureTextEntry
                returnKeyType={mode === 'signup' ? 'next' : 'done'}
                onSubmitEditing={mode === 'signin' ? handleSubmit : undefined}
              />
            </View>

            {mode === 'signup' && (
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>CONFIRM PASSWORD</Text>
                <TextInput
                  style={[styles.input, confirmPassword.length > 0 && password !== confirmPassword && styles.inputError]}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Repeat password"
                  placeholderTextColor={Colors.textTertiary}
                  secureTextEntry
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit}
                />
              </View>
            )}
          </View>

          {error ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.ctaBtn, !canSubmit && styles.ctaBtnDisabled]}
            onPress={handleSubmit}
            disabled={!canSubmit || loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color={Colors.card} />
              : <Text style={styles.ctaBtnText}>
                  {mode === 'signin' ? 'Sign in' : 'Create account'}
                </Text>
            }
          </TouchableOpacity>

          {mode === 'signin' && (
            <TouchableOpacity style={styles.forgotRow} onPress={handleForgotPassword}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.switchRow} onPress={switchMode}>
            <Text style={styles.switchText}>
              {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
              <Text style={styles.switchLink}>
                {mode === 'signin' ? 'Sign up' : 'Sign in'}
              </Text>
            </Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity style={styles.githubBtn} disabled>
            <Text style={styles.githubBtnText}>Continue with GitHub</Text>
            <View style={styles.soonBadge}><Text style={styles.soonText}>SOON</Text></View>
          </TouchableOpacity>
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
  form: { gap: Spacing.lg, marginBottom: Spacing.lg },
  fieldGroup: { gap: 8 },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary, letterSpacing: 0.5 },
  hint: { fontWeight: '400', color: Colors.textTertiary },
  input: {
    backgroundColor: Colors.card, borderRadius: Radius.md,
    paddingHorizontal: Spacing.md, paddingVertical: 14,
    fontSize: 16, color: Colors.text, ...Shadow.card,
  },
  inputError: { borderWidth: 1.5, borderColor: Colors.error },
  errorBanner: {
    backgroundColor: Colors.error + '15', borderRadius: Radius.md,
    padding: Spacing.md, marginBottom: Spacing.md,
  },
  errorText: { fontSize: 13, color: Colors.error, fontWeight: '500' },
  ctaBtn: {
    backgroundColor: Colors.primary, borderRadius: Radius.full,
    paddingVertical: 17, alignItems: 'center', marginBottom: Spacing.lg,
    ...Shadow.card,
  },
  ctaBtnDisabled: { opacity: 0.35 },
  ctaBtnText: { ...Typography.button, color: Colors.card, fontSize: 17 },
  forgotRow: { alignItems: 'flex-end', marginBottom: Spacing.md, marginTop: -Spacing.sm },
  forgotText: { fontSize: 13, color: Colors.primary, fontWeight: '600' },
  switchRow: { alignItems: 'center', marginBottom: Spacing.xl },
  switchText: { fontSize: 14, color: Colors.textSecondary },
  switchLink: { color: Colors.primary, fontWeight: '700' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.lg },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { fontSize: 11, fontWeight: '600', color: Colors.textTertiary, letterSpacing: 1 },
  githubBtn: {
    backgroundColor: Colors.card, borderRadius: Radius.full,
    paddingVertical: 15, alignItems: 'center', borderWidth: 1.5, borderColor: Colors.border,
    flexDirection: 'row', justifyContent: 'center', gap: 8, opacity: 0.5,
  },
  githubBtnText: { fontSize: 15, fontWeight: '600', color: Colors.text },
  soonBadge: {
    backgroundColor: Colors.accent + '20', borderRadius: Radius.full,
    paddingHorizontal: 7, paddingVertical: 2,
  },
  soonText: { fontSize: 9, fontWeight: '700', color: Colors.accent, letterSpacing: 0.8 },
})
