import { View, Text, StyleSheet, TouchableOpacity, Linking, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Colors, Spacing, Radius, Shadow } from '../constants/theme'
import { LEGAL_VERSION, LEGAL_ACCEPTED_KEY } from '../lib/legal'

export default function TermsGateScreen() {
  const router = useRouter()

  const handleAccept = async () => {
    await AsyncStorage.setItem(LEGAL_ACCEPTED_KEY, String(LEGAL_VERSION))
    router.replace('/(tabs)')
  }

  const handleDecline = async () => {
    // Sign them out — they can't use the app without accepting
    const { signOut } = await import('../lib/auth')
    await signOut()
    router.replace('/(auth)')
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <View style={styles.logoMark}>
          <Text style={styles.logoText}>✦</Text>
        </View>
        <Text style={styles.title}>We updated our Terms</Text>
        <Text style={styles.sub}>
          We've updated our Terms of Service and Privacy Policy. Please review and accept to continue using Vibecoded.
        </Text>

        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.bulletList}>
            {[
              'Your captures are stored locally on your device',
              'Account data (name, email, handle) is stored on our servers',
              'You can delete your account and all data at any time',
              'We use PostHog for anonymous analytics (opt-out available)',
              'We do not sell your personal data to third parties',
            ].map((b, i) => (
              <View key={i} style={styles.bullet}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.bulletText}>{b}</Text>
              </View>
            ))}
          </View>
        </ScrollView>

        <View style={styles.links}>
          <TouchableOpacity onPress={() => router.push({ pathname: '/legal', params: { doc: 'terms' } } as any)}>
            <Text style={styles.link}>Terms of Service ↗</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push({ pathname: '/legal', params: { doc: 'privacy' } } as any)}>
            <Text style={styles.link}>Privacy Policy ↗</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.acceptBtn} onPress={handleAccept} activeOpacity={0.85}>
          <Text style={styles.acceptBtnText}>I agree — Continue</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.declineBtn} onPress={handleDecline}>
          <Text style={styles.declineBtnText}>Decline and sign out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1, padding: Spacing.xl, alignItems: 'center' },
  logoMark: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.xl, marginTop: Spacing.lg,
  },
  logoText: { color: '#fff', fontSize: 26, fontWeight: '700' },
  title: { fontSize: 24, fontWeight: '900', color: Colors.text, textAlign: 'center', marginBottom: Spacing.sm },
  sub: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 21, marginBottom: Spacing.lg },
  scroll: { width: '100%', flexGrow: 0, maxHeight: 200 },
  bulletList: { gap: Spacing.md, marginBottom: Spacing.md },
  bullet: { flexDirection: 'row', gap: 8 },
  bulletDot: { fontSize: 14, color: Colors.primary, fontWeight: '800', marginTop: 1 },
  bulletText: { flex: 1, fontSize: 13, color: Colors.text, lineHeight: 20 },
  links: { flexDirection: 'row', gap: Spacing.xl, marginBottom: Spacing.xl, marginTop: Spacing.sm },
  link: { fontSize: 13, color: Colors.primary, fontWeight: '600' },
  acceptBtn: {
    width: '100%', backgroundColor: Colors.primary, borderRadius: Radius.full,
    paddingVertical: 18, alignItems: 'center', ...Shadow.card, marginBottom: Spacing.md,
  },
  acceptBtnText: { fontSize: 17, fontWeight: '800', color: '#fff' },
  declineBtn: { paddingVertical: Spacing.md },
  declineBtnText: { fontSize: 14, color: Colors.textTertiary, fontWeight: '600' },
})
