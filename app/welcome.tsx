import {
  View, Text, StyleSheet, TouchableOpacity, Animated,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useState, useEffect, useRef } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Colors, Spacing, Radius, Shadow } from '../constants/theme'
import type { ProjectStage } from '../lib/project'

type OnboardingData = {
  developerType: 'vibe_coder' | 'experienced_dev' | null
  workStyle: 'solo' | 'team' | null
  projectName: string
  projectStage: ProjectStage
  aiPlatforms: string[]
  githubRepo?: string
}

const PLATFORM_NAMES: Record<string, string> = {
  cursor:      'Cursor',
  windsurf:    'Windsurf',
  claude_code: 'Claude',
  copilot:     'Copilot',
  bolt:        'Bolt',
  lovable:     'Lovable',
  v0:          'v0',
  replit:      'Replit',
  chatgpt:     'ChatGPT',
}

function getAiCredit(platforms: string[]): string {
  const named = platforms.filter(p => p !== 'other' && PLATFORM_NAMES[p])
  if (named.length === 1) return PLATFORM_NAMES[named[0]]
  return 'AI'
}

function useFadeSlide(delay: number) {
  const anim = useRef(new Animated.Value(0)).current
  const start = () =>
    Animated.timing(anim, {
      toValue: 1,
      duration: 650,
      delay,
      useNativeDriver: true,
    }).start()
  const style = {
    opacity: anim,
    transform: [{
      translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [28, 0] }),
    }],
  }
  return { anim, start, style }
}

export default function WelcomeScreen() {
  const router = useRouter()
  const [data, setData] = useState<OnboardingData | null>(null)

  const logo    = useFadeSlide(0)
  const line1   = useFadeSlide(160)
  const line2   = useFadeSlide(300)
  const tagline = useFadeSlide(460)
  const cta     = useFadeSlide(620)

  useEffect(() => {
    AsyncStorage.getItem('grimoire:onboarding').then(raw => {
      if (raw) setData(JSON.parse(raw))
    })
    logo.start(); line1.start(); line2.start(); tagline.start(); cta.start()
  }, [])

  const aiCredit    = getAiCredit(data?.aiPlatforms ?? [])
  const projectName = data?.projectName?.trim()
  const headline1   = `You and ${aiCredit} built`
  const headline2   = projectName ? `${projectName}.` : 'something great.'

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.container}>

        <Animated.View style={[styles.logoRow, logo.style]}>
          <View style={styles.logoMark}>
            <Text style={styles.logoText}>✦</Text>
          </View>
          <Text style={styles.brandName}>Vibecoded</Text>
        </Animated.View>

        <View style={styles.heroBlock}>
          <Animated.Text style={[styles.headline, line1.style]}>
            {headline1}
          </Animated.Text>
          <Animated.Text style={[styles.headlineAccent, line2.style]}>
            {headline2}
          </Animated.Text>
          <Animated.Text style={[styles.tagline, tagline.style]}>
            We'll help you ship with{'\n'}confidence.
          </Animated.Text>
        </View>

        <Animated.View style={[styles.footer, cta.style]}>
          <TouchableOpacity
            style={styles.ctaBtn}
            onPress={() => router.replace('/(tabs)')}
            activeOpacity={0.88}
          >
            <Text style={styles.ctaBtnText}>Enter Vibecoded</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>
        </Animated.View>

      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1, paddingHorizontal: Spacing.xl, justifyContent: 'space-between' },

  logoRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingTop: Spacing.lg,
  },
  logoMark: {
    width: 38, height: 38, borderRadius: 11,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  logoText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  brandName: { fontSize: 20, fontWeight: '800', color: Colors.text, letterSpacing: -0.5 },

  heroBlock: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: Spacing.xl * 2,
  },
  headline: {
    fontSize: 42, fontWeight: '800', color: Colors.textSecondary,
    lineHeight: 50, letterSpacing: -1,
  },
  headlineAccent: {
    fontSize: 42, fontWeight: '900', color: Colors.text,
    lineHeight: 50, letterSpacing: -1.5, marginBottom: Spacing.xl,
  },
  tagline: {
    fontSize: 18, fontWeight: '400', color: Colors.textSecondary,
    lineHeight: 28,
  },

  footer: { paddingBottom: Spacing.xl },
  ctaBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: Colors.primary, borderRadius: Radius.full,
    paddingVertical: 20, ...Shadow.card,
  },
  ctaBtnText: { fontSize: 18, fontWeight: '800', color: '#fff' },
})
