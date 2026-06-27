import Purchases, {
  CustomerInfo,
  PurchasesPackage,
  LOG_LEVEL,
} from 'react-native-purchases'
import { Platform } from 'react-native'

// Fill these in after creating your RevenueCat project at app.revenuecat.com
const RC_IOS_KEY = 'test_CkKEQaKegsQOVhggcijjaRuVyyD'
const RC_ANDROID_KEY = 'test_CkKEQaKegsQOVhggcijjaRuVyyD'

export const ENTITLEMENTS = {
  SOLOPRENEUR: 'solopreneur',
  TEAM: 'team',
} as const

export type EntitlementId = typeof ENTITLEMENTS[keyof typeof ENTITLEMENTS]

export const PRODUCT_IDS = {
  SOLOPRENEUR_MONTHLY: 'vibecoded_solopreneur_monthly',
  SOLOPRENEUR_ANNUAL:  'vibecoded_solopreneur_annual',
  TEAM_MONTHLY:        'vibecoded_team_monthly',
  TEAM_ANNUAL:         'vibecoded_team_annual',
} as const

export type PlanId = 'free' | 'solopreneur' | 'team'

export function initPurchases(userId?: string) {
  Purchases.setLogLevel(LOG_LEVEL.ERROR)
  const key = Platform.OS === 'ios' ? RC_IOS_KEY : RC_ANDROID_KEY
  Purchases.configure({ apiKey: key, appUserID: userId ?? null })
}

export async function getCustomerInfo(): Promise<CustomerInfo | null> {
  try {
    return await Purchases.getCustomerInfo()
  } catch {
    return null
  }
}

export async function getActivePlan(info?: CustomerInfo | null): Promise<PlanId> {
  const ci = info ?? await getCustomerInfo()
  if (!ci) return 'free'
  if (ci.entitlements.active[ENTITLEMENTS.TEAM]) return 'team'
  if (ci.entitlements.active[ENTITLEMENTS.SOLOPRENEUR]) return 'solopreneur'
  return 'free'
}

export async function getOfferings() {
  try {
    const offerings = await Purchases.getOfferings()
    return offerings.current
  } catch {
    return null
  }
}

export async function purchasePackage(pkg: PurchasesPackage): Promise<{ success: boolean; error?: string }> {
  try {
    await Purchases.purchasePackage(pkg)
    return { success: true }
  } catch (e: any) {
    if (e.userCancelled) return { success: false }
    return { success: false, error: e.message ?? 'Purchase failed' }
  }
}

export async function restorePurchases(): Promise<PlanId> {
  try {
    const info = await Purchases.restorePurchases()
    return getActivePlan(info)
  } catch {
    return 'free'
  }
}

export async function logInUser(userId: string) {
  try {
    await Purchases.logIn(userId)
  } catch {}
}

export async function logOutUser() {
  try {
    await Purchases.logOut()
  } catch {}
}
