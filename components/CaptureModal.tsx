import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  TextInput, ActivityIndicator, Image, Alert, Keyboard,
  KeyboardAvoidingView, Platform,
} from 'react-native'
import { useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { Colors, Spacing, Radius, Shadow, Typography } from '../constants/theme'
import { captureUrl, analyzeImage, detectPlatform } from '../lib/api'
import type { Capture } from './CaptureCard'

type Mode = 'url' | 'screenshot' | 'camera'

type Props = {
  visible: boolean
  onClose: () => void
  onCapture: (capture: Capture) => void
}

export function CaptureModal({ visible, onClose, onCapture }: Props) {
  const [mode, setMode] = useState<Mode>('url')
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [image, setImage] = useState<string | null>(null)
  const [imageBase64, setImageBase64] = useState<string | null>(null)

  const platform = detectPlatform(url)
  const platformDetected = url.trim().length > 6 && platform !== 'Video'
  const canCapture = url.trim().length > 0 && !loading

  const reset = () => {
    setUrl('')
    setError('')
    setImage(null)
    setImageBase64(null)
    setMode('url')
    setLoading(false)
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleUrlCapture = async () => {
    if (!canCapture) return
    Keyboard.dismiss()
    setLoading(true)
    setError('')
    try {
      const result = await captureUrl(url.trim())
      const newCapture: Capture = {
        id: Date.now().toString(),
        title: result.title,
        sourceUrl: url.trim(),
        sourceType: 'video',
        creator: result.creator || 'Unknown',
        platform,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        stars: 0,
        starred: false,
        isPublic: false,
        pushed: true,
        pinned: false,
        preview: result.preview || 'Transcript captured.',
        concepts: result.concepts ?? [],
        actions: result.actions ?? [],
        quotes: result.quotes ?? [],
        transcript: result.transcript ?? '',
        category: result.category ?? '',
      }
      onCapture(newCapture)
      reset()
      onClose()
    } catch (e: any) {
      setError(e.message ?? 'Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow Grimoire to access your photos.')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images' as any,
      allowsEditing: false,
      quality: 0.6,
      base64: true,
    })
    if (!result.canceled) {
      setImage(result.assets[0].uri)
      setImageBase64(result.assets[0].base64 ?? null)
    }
  }

  const handleCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow Grimoire to use your camera.')
      return
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 0.6,
      base64: true,
    })
    if (!result.canceled) {
      setImage(result.assets[0].uri)
      setImageBase64(result.assets[0].base64 ?? null)
    }
  }

  const handleAnalyzeImage = async () => {
    if (!imageBase64) {
      setError('Image not ready. Try picking it again.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const result = await analyzeImage(imageBase64)
      const newCapture: Capture = {
        id: Date.now().toString(),
        title: result.title,
        sourceUrl: '',
        sourceType: 'image',
        creator: 'You',
        platform: 'Screenshot',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        stars: 0,
        starred: false,
        isPublic: false,
        pushed: false,
        pinned: false,
        preview: result.preview || 'Screenshot captured.',
      }
      onCapture(newCapture)
      reset()
      onClose()
    } catch (e: any) {
      setError(e.message ?? 'Analysis failed. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen">
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={handleClose} activeOpacity={1} />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.navRow}>
            <Text style={styles.heading}>New Capture</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
              <Ionicons name="close" size={18} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.modeTabs}>
            {(['url', 'screenshot', 'camera'] as Mode[]).map(m => (
              <TouchableOpacity
                key={m}
                style={[styles.modeTab, mode === m && styles.modeTabActive]}
                onPress={() => { setMode(m); setImage(null); setError('') }}
              >
                <Ionicons
                  name={m === 'url' ? 'link-outline' : m === 'screenshot' ? 'image-outline' : 'camera-outline'}
                  size={15}
                  color={mode === m ? Colors.card : Colors.textSecondary}
                />
                <Text style={[styles.modeText, mode === m && styles.modeTextActive]}>
                  {m === 'url' ? 'URL' : m === 'screenshot' ? 'Screenshot' : 'Camera'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {mode === 'url' && (
            <View style={styles.content}>
              {platformDetected && (
                <View style={styles.platformBadge}>
                  <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
                  <Text style={styles.platformText}>{platform} URL detected</Text>
                </View>
              )}

              <View style={styles.inputRow}>
                <TextInput
                  style={styles.urlInput}
                  placeholder="Paste Instagram, YouTube, TikTok URL..."
                  placeholderTextColor={Colors.textSecondary}
                  value={url}
                  onChangeText={v => { setUrl(v); setError('') }}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="go"
                  onSubmitEditing={handleUrlCapture}
                />
                {url.length > 0 && (
                  <TouchableOpacity onPress={() => setUrl('')} style={styles.clearBtn}>
                    <Ionicons name="close-circle" size={18} color={Colors.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>

              {error ? (
                <View style={styles.errorRow}>
                  <Ionicons name="alert-circle-outline" size={14} color={Colors.error} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={[styles.actionBtn, !canCapture && styles.actionBtnDisabled]}
                onPress={handleUrlCapture}
                disabled={!canCapture}
              >
                {loading ? (
                  <View style={styles.loadingRow}>
                    <ActivityIndicator size="small" color={Colors.card} />
                    <Text style={styles.actionBtnText}>Transcribing...</Text>
                  </View>
                ) : (
                  <Text style={styles.actionBtnText}>Capture</Text>
                )}
              </TouchableOpacity>

              <Text style={styles.hint}>Works with Instagram, YouTube, TikTok, Facebook</Text>
            </View>
          )}

          {(mode === 'screenshot' || mode === 'camera') && (
            <View style={styles.content}>
              {image ? (
                <>
                  <Image source={{ uri: image }} style={styles.imagePreview} resizeMode="cover" />
                  {error ? (
                    <View style={styles.errorRow}>
                      <Ionicons name="alert-circle-outline" size={14} color={Colors.error} />
                      <Text style={styles.errorText}>{error}</Text>
                    </View>
                  ) : null}
                  <TouchableOpacity
                    style={[styles.actionBtn, loading && { opacity: 0.7 }]}
                    onPress={handleAnalyzeImage}
                    disabled={loading}
                  >
                    {loading ? (
                      <View style={styles.loadingRow}>
                        <ActivityIndicator size="small" color={Colors.card} />
                        <Text style={styles.actionBtnText}>Analyzing...</Text>
                      </View>
                    ) : (
                      <Text style={styles.actionBtnText}>Extract Insights with AI</Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.secondaryBtn}
                    onPress={mode === 'screenshot' ? handlePickImage : handleCamera}
                  >
                    <Text style={styles.secondaryBtnText}>
                      {mode === 'screenshot' ? 'Pick a different image' : 'Retake photo'}
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  style={styles.pickZone}
                  onPress={mode === 'screenshot' ? handlePickImage : handleCamera}
                >
                  <Ionicons
                    name={mode === 'screenshot' ? 'image-outline' : 'camera-outline'}
                    size={44}
                    color={Colors.textTertiary}
                  />
                  <Text style={styles.pickTitle}>
                    {mode === 'screenshot' ? 'Pick Screenshot' : 'Take a Photo'}
                  </Text>
                  <Text style={styles.pickSub}>
                    {mode === 'screenshot'
                      ? 'Select from your camera roll'
                      : 'Point at a screen, whiteboard, or slide'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: Colors.overlay },
  sheet: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.xl,
    paddingBottom: 48,
  },
  handle: {
    width: 36, height: 4, backgroundColor: Colors.border,
    borderRadius: Radius.full, alignSelf: 'center', marginBottom: Spacing.lg,
  },
  navRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: Spacing.lg,
  },
  heading: { fontSize: 18, fontWeight: '700', color: Colors.text },
  closeBtn: {
    width: 32, height: 32, borderRadius: Radius.full,
    backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center',
  },
  modeTabs: {
    flexDirection: 'row', backgroundColor: Colors.background,
    borderRadius: Radius.full, padding: 3, marginBottom: Spacing.xl,
  },
  modeTab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 5, paddingVertical: 8, borderRadius: Radius.full,
  },
  modeTabActive: { backgroundColor: Colors.primary },
  modeText: { ...Typography.caption, color: Colors.textSecondary, fontWeight: '600' },
  modeTextActive: { color: Colors.card },
  content: { gap: Spacing.md },
  platformBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.success + '12', borderRadius: Radius.md,
    paddingHorizontal: Spacing.md, paddingVertical: 8,
  },
  platformText: { ...Typography.caption, color: Colors.success, fontWeight: '600' },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.background, borderRadius: Radius.md,
    paddingHorizontal: Spacing.md, paddingVertical: 2,
  },
  urlInput: {
    flex: 1, fontSize: 14, color: Colors.text,
    paddingVertical: 12,
  },
  clearBtn: { padding: 4 },
  errorRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.error + '10', borderRadius: Radius.md,
    paddingHorizontal: Spacing.md, paddingVertical: 8,
  },
  errorText: { ...Typography.caption, color: Colors.error, flex: 1 },
  actionBtn: {
    backgroundColor: Colors.primary, borderRadius: Radius.full,
    paddingVertical: 14, alignItems: 'center',
  },
  actionBtnDisabled: { opacity: 0.35 },
  actionBtnText: { ...Typography.button, color: Colors.card },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  hint: { ...Typography.caption, color: Colors.textTertiary, textAlign: 'center' },
  pickZone: {
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.background, borderRadius: Radius.lg,
    paddingVertical: 48, gap: Spacing.sm,
    borderWidth: 1.5, borderColor: Colors.border, borderStyle: 'dashed',
  },
  pickTitle: { ...Typography.cardTitle, color: Colors.text },
  pickSub: { ...Typography.caption, color: Colors.textSecondary },
  imagePreview: {
    width: '100%', height: 200, borderRadius: Radius.md,
    backgroundColor: Colors.background,
  },
  secondaryBtn: { alignItems: 'center', paddingVertical: Spacing.sm },
  secondaryBtnText: { ...Typography.caption, color: Colors.textSecondary },
})
