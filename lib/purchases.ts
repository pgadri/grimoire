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
  CREATOR: 'creator',
  PRO: 'pro',
} as const

export type EntitlementId = typeof ENTITLEMENTS[keyof typeof ENTITLEMENTS]

export const PRODUCT_IDS = {
  CREATOR_MONTHLY: 'grimoire_creator_monthly',
  CREATOR_ANNUAL: 'grimoire_creator_annual',
  PRO_MONTHLY: 'grimoire_pro_monthly',
  PRO_ANNUAL: 'grimoire_pro_annual',
} as const

export type PlanId = 'free' | 'creator' | 'pro'

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
  if (ci.entitlements.active[ENTITLEMENTS.PRO]) return 'pro'
  if (ci.entitlements.active[ENTITLEMENTS.CREATOR]) return 'creator'
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
