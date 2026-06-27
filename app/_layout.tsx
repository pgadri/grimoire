import { Stack, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useEffect, useRef, useState } from 'react'
import { Platform, View, ActivityIndicator } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Notifications from 'expo-notifications'
import Constants from 'expo-constants'
import { Colors } from '../constants/theme'
import { getUser, type GrimoireUser } from '../lib/auth'
import { LEGAL_VERSION, LEGAL_ACCEPTED_KEY } from '../lib/legal'
import { initPurchases } from '../lib/purchases'
import { registerPushToken } from '../lib/threads'
import { syncReputation } from '../lib/packets'
import { getRepState } from '../lib/reputation'
import { scheduleWeeklyDigest } from '../lib/launch'
import { ONBOARDED_KEY } from './onboarding'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

async function registerForPushNotifications(): Promise<string | null> {
  try {
    const { status: existing } = await Notifications.getPermissionsAsync()
    const { status } = existing === 'granted' ? { status: existing } : await Notifications.requestPermissionsAsync()
    if (status !== 'granted') return null
    const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined
    const { data } = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined)
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default', importance: Notifications.AndroidImportance.MAX,
      })
    }
    return data
  } catch {
    return null
  }
}

type BootData = {
  user: GrimoireUser | null
  onboarded: string | null
  legalAccepted: string | null
}

export default function RootLayout() {
  const router = useRouter()
  const segments = useSegments()
  const segmentsRef = useRef(segments)
  segmentsRef.current = segments
  // null = still loading, object = done
  const [boot, setBoot] = useState<BootData | null>(null)

  // Step 1: load data once, never touch the router here
  useEffect(() => {
    AsyncStorage.removeItem('grimoire:project').catch(() => {})
    Promise.all([
      getUser(),
      AsyncStorage.getItem(ONBOARDED_KEY),
      AsyncStorage.getItem(LEGAL_ACCEPTED_KEY),
    ]).then(([user, onboarded, legalAccepted]) => {
      try { initPurchases(user?.id ?? undefined) } catch {}
      if (user) {
        registerForPushNotifications().then(token => {
          if (token) registerPushToken(token).catch(() => {})
        })
        getRepState().then(rep => syncReputation(rep.points).catch(() => {}))
        scheduleWeeklyDigest().catch(() => {})
      }
      setBoot({ user, onboarded, legalAccepted })
    }).catch(() => {
      setBoot({ user: null, onboarded: null, legalAccepted: null })
    })
  }, [])

  // Step 2: initial route decision — runs ONCE when boot data arrives.
  // Uses segmentsRef (not segments in deps) so in-app navigation never
  // re-triggers this and causes a loop.
  useEffect(() => {
    if (boot === null) return

    AsyncStorage.getItem(LEGAL_ACCEPTED_KEY).then(legalAccepted => {
      const { user, onboarded } = boot
      const needsTerms = user && Number(legalAccepted ?? 0) < LEGAL_VERSION
      const seg = segmentsRef.current[0] as string | undefined

      try {
        if (!user) {
          if (seg !== '(auth)') router.replace('/(auth)')
        } else if (needsTerms) {
          router.replace('/terms-gate')
        } else if (!onboarded) {
          if (seg !== 'onboarding') router.replace('/onboarding')
        } else {
          if (seg !== '(tabs)' && seg !== 'welcome') router.replace('/(tabs)')
        }
      } catch {}
    }).catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boot])

  return (
    <>
      <StatusBar style="dark" backgroundColor={Colors.background} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="welcome" />
        <Stack.Screen name="terms-gate" />
        <Stack.Screen
          name="capture/[id]"
          options={{ presentation: 'card', animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="connectors"
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="new-thread"
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="new-milestone"
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="thread/[id]"
          options={{ presentation: 'card', animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="new-launch"
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="launch/[id]"
          options={{ presentation: 'card', animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="creator-setup"
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="creator/[handle]"
          options={{ presentation: 'card', animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="creator-apply"
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="github-repo"
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="posthog-connect"
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="launch-date"
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="packet-editor"
          options={{ presentation: 'card', animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="packet/[id]"
          options={{ presentation: 'card', animation: 'slide_from_right' }}
        />
      </Stack>

      {/* Loading overlay — sits on top of the Stack so the Stack is always mounted */}
      {boot === null && (
        <View style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: '#ffffff',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      )}
    </>
  )
}
