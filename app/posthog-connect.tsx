import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, ScrollView,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useState, useEffect } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Colors, Spacing, Radius, Shadow, Typography } from '../constants/theme'

export const POSTHOG_KEY = 'grimoire:posthog'

type Region = 'us' | 'eu'

function hostFor(region: Region) {
  return region === 'eu' ? 'https://eu.posthog.com' : 'https://app.posthog.com'
}

export default function PostHogConnectScreen() {
  const router = useRouter()
  const [apiKey, setApiKey]       = useState('')
  const [projectId, setProjectId] = useState('')
  const [region, setRegion]       = useState<Region>('us')
  const [loading, setLoading]     = useState(false)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    AsyncStorage.getItem(POSTHOG_KEY).then(raw => {
      if (raw) {
        const d = JSON.parse(raw)
        setApiKey(d.apiKey ?? '')
        setProjectId(String(d.projectId ?? ''))
        setRegion(d.region ?? 'us')
        setConnected(true)
      }
    })
  }, [])

  const canSave = apiKey.trim().length > 10 && projectId.trim().length > 0 && !loading

  const handleSave = async () => {
    if (!canSave) return
    setLoading(true)
    try {
      const host = hostFor(region)
      const res = await fetch(`${host}/api/projects/${projectId.trim()}/`, {
        headers: { Authorization: `Bearer ${apiKey.trim()}` },
      })
      if (!res.ok) {
        Alert.alert('Connection failed', 'Could not reach your PostHog project. Check your API key and project ID.')
        return
      }
      const data = { apiKey: apiKey.trim(), projectId: projectId.trim(), region }
      await AsyncStorage.setItem(POSTHOG_KEY, JSON.stringify(data))
      router.back()
    } catch {
      Alert.alert('Error', 'Could not connect. Check your internet connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleDisconnect = () => {
    Alert.alert('Disconnect PostHog?', 'Analytics data will stop showing in your Repo tab.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Disconnect', style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem(POSTHOG_KEY)
          router.back()
        },
      },
    ])
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.kav} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.navBar}>
          <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
            <Ionicons name="close" size={20} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Connect PostHog</Text>
          <TouchableOpacity
            style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={!canSave}
          >
            {loading
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={styles.saveBtnText}>Connect</Text>
            }
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">

          <View style={styles.iconRow}>
            <Text style={styles.iconEmoji}>📊</Text>
          </View>
          <Text style={styles.title}>PostHog Analytics</Text>
          <Text style={styles.sub}>
            Connect your PostHog project to see real app opens, active users, and retention data right here.
          </Text>

          {connected && (
            <View style={styles.connectedBadge}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
              <Text style={styles.connectedText}>Currently connected — update or disconnect below</Text>
            </View>
          )}

          <Text style={styles.label}>PERSONAL API KEY</Text>
          <Text style={styles.hint}>
            Found in PostHog → Settings → Personal API keys. Starts with{' '}
            <Text style={styles.mono}>phx_</Text>
          </Text>
          <TextInput
            style={styles.input}
            value={apiKey}
            onChangeText={setApiKey}
            placeholder="phx_xxxxxxxxxxxxxxxxxxxx"
            placeholderTextColor={Colors.textTertiary}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
          />

          <Text style={[styles.label, { marginTop: Spacing.lg }]}>PROJECT ID</Text>
          <Text style={styles.hint}>
            Found in your PostHog URL: app.posthog.com/project/<Text style={styles.mono}>12345</Text>
          </Text>
          <TextInput
            style={styles.input}
            value={projectId}
            onChangeText={v => setProjectId(v.replace(/\D/g, ''))}
            placeholder="12345"
            placeholderTextColor={Colors.textTertiary}
            keyboardType="number-pad"
            returnKeyType="done"
          />

          <Text style={[styles.label, { marginTop: Spacing.lg }]}>REGION</Text>
          <View style={styles.regionRow}>
            {(['us', 'eu'] as Region[]).map(r => (
              <TouchableOpacity
                key={r}
                style={[styles.regionBtn, region === r && styles.regionBtnActive]}
                onPress={() => setRegion(r)}
                activeOpacity={0.8}
              >
                <Text style={[styles.regionBtnText, region === r && styles.regionBtnTextActive]}>
                  {r === 'us' ? '🇺🇸  US Cloud' : '🇪🇺  EU Cloud'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {connected && (
            <TouchableOpacity style={styles.disconnectBtn} onPress={handleDisconnect}>
              <Text style={styles.disconnectText}>Disconnect PostHog</Text>
            </TouchableOpacity>
          )}
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
  closeBtn: {
    width: 36, height: 36, borderRadius: Radius.full,
    backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center',
    ...Shadow.card,
  },
  navTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
  saveBtn: {
    paddingHorizontal: 18, paddingVertical: 9,
    backgroundColor: Colors.primary, borderRadius: Radius.full, minWidth: 80, alignItems: 'center',
  },
  saveBtnDisabled: { backgroundColor: Colors.textTertiary },
  saveBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },

  body: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: 48 },
  iconRow: {
    width: 60, height: 60, borderRadius: Radius.xl,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.lg,
  },
  iconEmoji: { fontSize: 28 },
  title: { fontSize: 22, fontWeight: '800', color: Colors.text, marginBottom: Spacing.sm },
  sub: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20, marginBottom: Spacing.lg },

  connectedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.success + '18', borderRadius: Radius.md,
    padding: Spacing.md, marginBottom: Spacing.lg,
  },
  connectedText: { fontSize: 13, color: Colors.success, fontWeight: '600', flex: 1 },

  label: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary, letterSpacing: 0.8, marginBottom: 4 },
  hint: { fontSize: 12, color: Colors.textTertiary, lineHeight: 17, marginBottom: Spacing.sm },
  mono: { fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', color: Colors.primary },
  input: {
    backgroundColor: Colors.card, borderRadius: Radius.md,
    paddingHorizontal: Spacing.md, paddingVertical: 14,
    fontSize: 15, color: Colors.text, ...Shadow.card,
  },

  regionRow: { flexDirection: 'row', gap: Spacing.sm },
  regionBtn: {
    flex: 1, paddingVertical: 13, alignItems: 'center', borderRadius: Radius.md,
    backgroundColor: Colors.card, borderWidth: 2, borderColor: Colors.border, ...Shadow.card,
  },
  regionBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '10' },
  regionBtnText: { fontSize: 14, fontWeight: '600', color: Colors.text },
  regionBtnTextActive: { color: Colors.primary },

  disconnectBtn: { marginTop: Spacing.xl * 2, alignItems: 'center' },
  disconnectText: { fontSize: 14, color: Colors.error, fontWeight: '600' },
})
