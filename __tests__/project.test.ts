import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  detectStackFromDependencies,
  getProjectProfile,
  saveProjectProfile,
  hasOnboarded,
  STACK_LABELS,
  StackTag,
} from '../lib/project'

beforeEach(async () => {
  await AsyncStorage.clear()
})

describe('detectStackFromDependencies', () => {
  it('infers a typical Expo + Stripe + Supabase stack from package.json keys', () => {
    const deps = [
      'expo',
      'react-native',
      'react',
      '@react-native-async-storage/async-storage',
      '@stripe/stripe-react-native',
      '@supabase/supabase-js',
    ]
    const tags = detectStackFromDependencies(deps)
    expect(tags).toEqual(expect.arrayContaining(['expo', 'react-native', 'react', 'stripe', 'supabase']))
  })

  it('infers a FastAPI + Postgres + OpenAI backend from requirements.txt lines', () => {
    const deps = ['fastapi', 'uvicorn', 'psycopg2-binary', 'openai', 'boto3']
    const tags = detectStackFromDependencies(deps)
    expect(tags).toEqual(expect.arrayContaining(['fastapi', 'postgres', 'openai', 'aws']))
  })

  it('is case-insensitive and trims whitespace', () => {
    const tags = detectStackFromDependencies(['  STRIPE  ', 'Next'])
    expect(tags).toContain('stripe')
    expect(tags).toContain('nextjs')
  })

  it('de-duplicates when multiple deps map to the same tag', () => {
    const tags = detectStackFromDependencies(['next-auth', 'passport', 'jsonwebtoken'])
    expect(tags.filter(t => t === 'auth')).toHaveLength(1)
  })

  it('returns tags in canonical STACK_LABELS order for stable output', () => {
    const canonical = Object.keys(STACK_LABELS) as StackTag[]
    const tags = detectStackFromDependencies(['stripe', 'expo', 'fastapi'])
    const sorted = [...tags].sort((a, b) => canonical.indexOf(a) - canonical.indexOf(b))
    expect(tags).toEqual(sorted)
  })

  it('returns an empty array for unknown or empty dependencies', () => {
    expect(detectStackFromDependencies([])).toEqual([])
    expect(detectStackFromDependencies(['some-random-lib', '', '   '])).toEqual([])
  })
})

describe('project profile persistence', () => {
  it('returns null when nothing is saved', async () => {
    expect(await getProjectProfile()).toBeNull()
    expect(await hasOnboarded()).toBe(false)
  })

  it('saves and reloads a profile, stamping updatedAt', async () => {
    const saved = await saveProjectProfile({
      name: 'Recipe App',
      stage: 'pre-launch',
      stack: ['expo', 'supabase'],
      handlesPayments: false,
      storesUserData: true,
    })
    expect(saved.updatedAt).toBeTruthy()

    const loaded = await getProjectProfile()
    expect(loaded).not.toBeNull()
    expect(loaded!.name).toBe('Recipe App')
    expect(loaded!.stack).toEqual(['expo', 'supabase'])
    expect(await hasOnboarded()).toBe(true)
  })

  it('overwrites the previous profile on re-save', async () => {
    await saveProjectProfile({
      name: 'First', stage: 'idea', stack: [], handlesPayments: false, storesUserData: false,
    })
    await saveProjectProfile({
      name: 'Second', stage: 'launched', stack: ['stripe'], handlesPayments: true, storesUserData: true,
    })
    const loaded = await getProjectProfile()
    expect(loaded!.name).toBe('Second')
    expect(loaded!.handlesPayments).toBe(true)
  })

  it('returns null gracefully if stored JSON is corrupt', async () => {
    await AsyncStorage.setItem('grimoire:project', '{not valid json')
    expect(await getProjectProfile()).toBeNull()
  })
})
