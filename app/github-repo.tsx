import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useState, useEffect } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Colors, Spacing, Radius, Shadow, Typography } from '../constants/theme'

const ONBOARDING_KEY = 'grimoire:onboarding'

function normalizeUrl(url: string): string {
  const t = url.trim()
  return t.startsWith('http://') || t.startsWith('https://') ? t : `https://${t}`
}

function isValidGithubUrl(url: string): boolean {
  try {
    const u = new URL(normalizeUrl(url))
    const parts = u.pathname.replace(/^\//, '').replace(/\.git$/, '').split('/')
    return u.hostname === 'github.com' && parts.length >= 2 && parts[0].length > 0 && parts[1].length > 0
  } catch {
    return false
  }
}

export default function GithubRepoScreen() {
  const router = useRouter()
  const [url, setUrl] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY).then(raw => {
      if (raw) {
        const data = JSON.parse(raw)
        if (data.githubRepo) setUrl(data.githubRepo)
      }
    })
  }, [])

  const canSave = isValidGithubUrl(url) && !saving

  const handleSave = async () => {
    if (!canSave) return
    setSaving(true)
    try {
      const raw = await AsyncStorage.getItem(ONBOARDING_KEY)
      const data = raw ? JSON.parse(raw) : {}
      await AsyncStorage.setItem(ONBOARDING_KEY, JSON.stringify({ ...data, githubRepo: normalizeUrl(url) }))
      router.back()
    } catch {
      Alert.alert('Error', 'Could not save. Try again.')
      setSaving(false)
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.kav} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.navBar}>
          <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
            <Ionicons name="close" size={20} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.navTitle}>GitHub Repo</Text>
          <TouchableOpacity
            style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={!canSave}
          >
            <Text style={styles.saveBtnText}>{saving ? 'Saving…' : 'Save'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.body}>
          <View style={styles.iconRow}>
            <Ionicons name="git-branch" size={32} color={Colors.primary} />
          </View>
          <Text style={styles.title}>Connect your repo</Text>
          <Text style={styles.sub}>
            Paste your GitHub repository URL below to unlock repo diagnostics, health scores, and activity insights.
          </Text>

          <Text style={styles.label}>REPOSITORY URL</Text>
          <View style={styles.inputRow}>
            <Ionicons name="logo-github" size={18} color={Colors.textSecondary} />
            <TextInput
              style={styles.input}
              value={url}
              onChangeText={setUrl}
              placeholder="https://github.com/username/repo"
              placeholderTextColor={Colors.textTertiary}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              returnKeyType="done"
              onSubmitEditing={handleSave}
            />
            {url.length > 0 && (
              <TouchableOpacity onPress={() => setUrl('')}>
                <Ionicons name="close-circle" size={16} color={Colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          {url.length > 0 && !isValidGithubUrl(url) && (
            <Text style={styles.hint}>Must be a valid github.com URL</Text>
          )}
        </View>
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
    backgroundColor: Colors.primary, borderRadius: Radius.full,
  },
  saveBtnDisabled: { backgroundColor: Colors.textTertiary },
  saveBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  body: { flex: 1, paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl },
  iconRow: {
    width: 60, height: 60, borderRadius: Radius.xl,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.lg,
  },
  title: { fontSize: 22, fontWeight: '800', color: Colors.text, marginBottom: Spacing.sm },
  sub: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20, marginBottom: Spacing.xl },
  label: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary, letterSpacing: 0.8, marginBottom: Spacing.sm },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md, paddingVertical: 14,
    ...Shadow.card,
  },
  input: { flex: 1, fontSize: 14, color: Colors.text },
  hint: { ...Typography.caption, color: Colors.error, marginTop: Spacing.sm },
})
