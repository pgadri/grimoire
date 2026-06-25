import AsyncStorage from '@react-native-async-storage/async-storage'

const USER_KEY = 'grimoire:user'

export type GrimoireUser = {
  name: string
  handle: string
  bio: string
  createdAt: string
}

export async function getUser(): Promise<GrimoireUser | null> {
  try {
    const raw = await AsyncStorage.getItem(USER_KEY)
    return raw ? (JSON.parse(raw) as GrimoireUser) : null
  } catch {
    return null
  }
}

export async function saveUser(user: GrimoireUser): Promise<void> {
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user))
}

export async function signOut(): Promise<void> {
  await AsyncStorage.removeItem(USER_KEY)
}
