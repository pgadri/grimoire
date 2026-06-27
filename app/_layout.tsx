import { Stack, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useEffect, useState } from 'react'
import { Platform } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Notifications from 'expo-notifications'
import Constants from 'expo-constants'
import { Colors } from '../constants/theme'
import { getUser } from '../lib/auth'
import { LEGAL_VERSION, LEGAL_ACCEPTED_KEY } from '../lib/legal'
import { initPurchases } from '../lib/purchases'
import { registerPushToken } from '../lib/threads'
import { syncReputation } from '../lib/packets'
import { getRepState } from '../lib/reputation'
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

export default function RootLayout() {
  const router = useRouter()
  const segments = useSegments()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Clear stale project profile data — risks now derive from GitHub repo scan
    AsyncStorage.removeItem('grimoire:project').catch(() => {})

    Promise.all([getUser(), AsyncStorage.getItem(ONBOARDED_KEY), AsyncStorage.getItem(LEGAL_ACCEPTED_KEY)]).then(([user, onboarded, legalAccepted]) => {
      const needsTerms = user && Number(legalAccepted ?? 0) < LEGAL_VERSION
      initPurchases(user?.id ?? undefined)
      if (user) {
        registerForPushNotifications().then(token => {
          if (token) registerPushToken(token).catch(() => {})
        })
        getRepState().then(rep => syncReputation(rep.points).catch(() => {}))
      }
      const inAuth       = segments[0] === '(auth)'
      const inOnboarding = segments[0] === 'onboarding'
      const inWelcome    = segments[0] === 'welcome'
      const inTabs       = segments[0] === '(tabs)'

      if (!user) {
        if (!inAuth) router.replace('/(auth)')
      } else if (needsTerms && segments[0] !== 'terms-gate') {
        router.replace('/terms-gate')
      } else if (!onboarded) {
        // Logged in but haven't completed onboarding
        if (!inOnboarding) router.replace('/onboarding')
      } else {
        // Logged in + onboarded — ensure they're in tabs (not stuck on welcome/onboarding/auth)
        if (!inTabs && !inWelcome) router.replace('/(tabs)')
        // welcome is OK if they just finished onboarding this session; _layout won't auto-exit it
      }
      setReady(true)
    })
  }, [])

  if (!ready) return null

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
          options={{
            presentation: 'card',
            animation: 'slide_from_right',
          }}
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
    </>
  )
}
