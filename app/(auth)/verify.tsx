import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useState, useEffect, useRef } from 'react'
import { Colors, Spacing, Radius, Shadow, Typography } from '../../constants/theme'
import { verifyOTP, resendOTP, resetPassword } from '../../lib/auth'

export default function VerifyScreen() {
  const router = useRouter()
  const { email, flow } = useLocalSearchParams<{ email: string; flow: 'verify' | 'reset' }>()
  const isReset = flow === 'reset'

  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [countdown, setCountdown] = useState(60)
  const [canResend, setCanResend] = useState(false)
  const inputRef = useRef<TextInput>(null)

  useEffect(() => {
    inputRef.current?.focus()
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { setCanResend(true); clearInterval(timer); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const handleResend = async () => {
    if (!canResend) return
    setCanResend(false)
    setCountdown(60)
    setError('')
    setSuccess('')
    await resendOTP(email)
    setSuccess('New code sent!')
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { setCanResend(true); clearInterval(timer); return 0 }
        return prev - 1
      })
    }, 1000)
  }

  const handleSubmit = async () => {
    if (code.length !== 6 || loading) return
    if (isReset && newPassword.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    if (isReset && newPassword !== confirmPassword) {
      setError("Passwords don't match")
      return
    }
    setLoading(true)
    setError('')
    try {
      if (isReset) {
        await resetPassword({ email, code, newPassword })
      } else {
        await verifyOTP({ email, code })
      }
      router.replace('/(tabs)')
    } catch (e: any) {
      setError(e?.message ?? 'Invalid code. Try again.')
      setCode('')
    } finally {
      setLoading(false)
    }
  }

  const canSubmit = code.length === 6 &&
    (!isReset || (newPassword.length >= 8 && newPassword === confirmPassword))

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.kav} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.container}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          <View style={styles.heroBlock}>
            <View style={styles.logoMark}>
              <Text style={styles.logoText}>✦</Text>
            </View>
            <Text style={styles.title}>
              {isReset ? 'Reset password' : 'Check your email'}
            </Text>
            <Text style={styles.sub}>
              We sent a 6-digit code to{'\n'}
              <Text style={styles.emailHighlight}>{email}</Text>
            </Text>
          </View>

          {/* Code input */}
          <View style={styles.codeContainer}>
            <TextInput
              ref={inputRef}
              style={styles.codeInputHidden}
              value={code}
              onChangeText={v => { setCode(v.replace(/\D/g, '').slice(0, 6)); setError('') }}
              keyboardType="number-pad"
              maxLength={6}
              onSubmitEditing={handleSubmit}
            />
            <View style={styles.codeBoxRow} pointerEvents="none">
              {Array.from({ length: 6 }, (_, i) => (
                <View key={i} style={[
                  styles.codeBox,
                  code.length === i && styles.codeBoxActive,
                  code.length > i && styles.codeBoxFilled,
                ]}>
                  <Text style={styles.codeDigit}>{code[i] ?? ''}</Text>
                </View>
              ))}
            </View>
          </View>

          {isReset && (
            <View style={styles.passwordSection}>
              <Text style={styles.fieldLabel}>NEW PASSWORD</Text>
              <TextInput
                style={styles.input}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="At least 8 characters"
                placeholderTextColor={Colors.textTertiary}
                secureTextEntry
              />
              <Text style={[styles.fieldLabel, { marginTop: Spacing.md }]}>CONFIRM PASSWORD</Text>
              <TextInput
                style={[styles.input, confirmPassword.length > 0 && newPassword !== confirmPassword && styles.inputError]}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Repeat password"
                placeholderTextColor={Colors.textTertiary}
                secureTextEntry
              />
            </View>
          )}

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {success ? <Text style={styles.successText}>{success}</Text> : null}

          <TouchableOpacity
            style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={!canSubmit || loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.submitBtnText}>
                  {isReset ? 'Reset password' : 'Verify email'}
                </Text>
            }
          </TouchableOpacity>

          <TouchableOpacity style={styles.resendRow} onPress={handleResend} disabled={!canResend}>
            <Text style={[styles.resendText, !canResend && styles.resendTextDisabled]}>
              {canResend ? 'Resend code' : `Resend in ${countdown}s`}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  kav: { flex: 1 },
  container: { flex: 1, padding: Spacing.xl },
  backBtn: { marginBottom: Spacing.xl },
  backText: { fontSize: 15, color: Colors.primary, fontWeight: '600' },
  heroBlock: { alignItems: 'center', marginBottom: Spacing.xl * 1.5, gap: Spacing.md },
  logoMark: {
    width: 52, height: 52, borderRadius: 14,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  logoText: { color: Colors.card, fontSize: 24, fontWeight: '700' },
  title: { fontSize: 26, fontWeight: '800', color: Colors.text },
  sub: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  emailHighlight: { color: Colors.primary, fontWeight: '700' },
  codeContainer: { alignItems: 'center', marginBottom: Spacing.xl },
  codeInputHidden: {
    position: 'absolute', opacity: 0, width: '100%', height: 60,
  },
  codeBoxRow: { flexDirection: 'row', gap: 10 },
  codeBox: {
    width: 48, height: 58, borderRadius: Radius.md,
    backgroundColor: Colors.card, borderWidth: 2, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center', ...Shadow.card,
  },
  codeBoxActive: { borderColor: Colors.primary },
  codeBoxFilled: { borderColor: Colors.primary, backgroundColor: Colors.primary + '08' },
  codeDigit: { fontSize: 24, fontWeight: '700', color: Colors.text },
  passwordSection: { marginBottom: Spacing.lg, gap: 8 },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary, letterSpacing: 0.5 },
  input: {
    backgroundColor: Colors.card, borderRadius: Radius.md,
    paddingHorizontal: Spacing.md, paddingVertical: 14,
    fontSize: 16, color: Colors.text, ...Shadow.card,
  },
  inputError: { borderWidth: 1.5, borderColor: Colors.error },
  errorText: { fontSize: 13, color: Colors.error, fontWeight: '500', textAlign: 'center', marginBottom: Spacing.md },
  successText: { fontSize: 13, color: Colors.success, fontWeight: '500', textAlign: 'center', marginBottom: Spacing.md },
  submitBtn: {
    backgroundColor: Colors.primary, borderRadius: Radius.full,
    paddingVertical: 17, alignItems: 'center', marginBottom: Spacing.lg, ...Shadow.card,
  },
  submitBtnDisabled: { opacity: 0.35 },
  submitBtnText: { ...Typography.button, color: '#fff', fontSize: 17 },
  resendRow: { alignItems: 'center' },
  resendText: { fontSize: 14, color: Colors.primary, fontWeight: '600' },
  resendTextDisabled: { color: Colors.textTertiary },
})
