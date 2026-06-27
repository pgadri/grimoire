import AsyncStorage from '@react-native-async-storage/async-storage'

const CAMPAIGNS_KEY = 'grimoire:testCampaigns'

export type TestingTier = 'spark' | 'boost' | 'launch'

export type TierInfo = {
  id: TestingTier
  name: string
  emoji: string
  testers: number
  price: number
  turnaround: string
  headline: string
  features: string[]
}

export const TESTING_TIERS: TierInfo[] = [
  {
    id: 'spark',
    name: 'Spark',
    emoji: '✦',
    testers: 10,
    price: 29,
    turnaround: '48h',
    headline: 'Bug bash',
    features: [
      '10 real device testers',
      'Bug report + severity rating',
      'Ready / Not Ready verdict',
      '48h turnaround',
    ],
  },
  {
    id: 'boost',
    name: 'Boost',
    emoji: '⚡',
    testers: 50,
    price: 99,
    turnaround: '72h',
    headline: 'UX + reviews',
    features: [
      '50 real device testers',
      'Screen recording walkthroughs',
      'Written reviews posted to your launch page',
      '72h turnaround',
    ],
  },
  {
    id: 'launch',
    name: 'Launch',
    emoji: '🚀',
    testers: 200,
    price: 249,
    turnaround: '5 days',
    headline: 'Full campaign',
    features: [
      '200 real device testers',
      'Verified ratings + on-page reviews',
      'App Store review prompts',
      '5-day campaign',
    ],
  },
]

export type CampaignStatus = 'pending' | 'active' | 'complete'

export type TestCampaign = {
  id: string
  launchId: string | null
  appName: string
  tier: TestingTier
  status: CampaignStatus
  requestedAt: string
  contactEmail: string
}

export async function getTestCampaigns(): Promise<TestCampaign[]> {
  const raw = await AsyncStorage.getItem(CAMPAIGNS_KEY)
  return raw ? JSON.parse(raw) : []
}

export async function createTestCampaign(
  params: Pick<TestCampaign, 'launchId' | 'appName' | 'tier' | 'contactEmail'>,
): Promise<TestCampaign> {
  const campaigns = await getTestCampaigns()
  const campaign: TestCampaign = {
    ...params,
    id: `campaign_${Date.now()}`,
    status: 'pending',
    requestedAt: new Date().toISOString(),
  }
  campaigns.unshift(campaign)
  await AsyncStorage.setItem(CAMPAIGNS_KEY, JSON.stringify(campaigns))
  return campaign
}

export async function getCampaignForLaunch(launchId: string): Promise<TestCampaign | null> {
  const campaigns = await getTestCampaigns()
  return campaigns.find(c => c.launchId === launchId) ?? null
}

export const STATUS_LABEL: Record<CampaignStatus, string> = {
  pending: 'Pending review',
  active: 'In progress',
  complete: 'Complete',
}

export const STATUS_COLOR: Record<CampaignStatus, string> = {
  pending: '#F0A500',
  active: '#7C5CBF',
  complete: '#22C55E',
}
