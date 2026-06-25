import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useState, useEffect } from 'react'
import { Colors, Spacing, Radius, Shadow, Typography } from '../constants/theme'
import {
  getOfferings, purchasePackage, restorePurchases, getActivePlan,
} from '../lib/purchases'
import type { PurchasesPackage } from 'react-native-purchases'

type BillingCycle = 'monthly' | 'annual'

const PLAN_FEATURES: Record<string, { label: string; plans: ('creator' | 'pro')[] }[]> = {
  creator: [
    { label: 'Unlimited captures', plans: ['creator', 'pro'] },
    { label: 'Unlimited public repos', plans: ['creator', 'pro'] },
    { label: 'Sell knowledge packets in Explore', plans: ['creator', 'pro'] },
    { label: 'Capture analytics', plans: ['creator', 'pro'] },
    { label: 'Priority AI processing', plans: ['creator', 'pro'] },
  ],
  pro: [
    { label: 'Everything in Creator', plans: ['pro'] },
    { label: 'Team workspace', plans: ['pro'] },
    { label: 'Custom domain', plans: ['pro'] },
    { label: 'API access', plans: ['pro'] },
    { label: 'Priority support', plans: ['pro'] },
  ],
}

const PLAN_COLORS = {
  creator: Colors.primary,
  pro: '#9B59B6',
}

export default function PaywallScreen() {
  const router = useRouter()
  const [cycle, setCycle] = useState<BillingCycle>('annual')
  const [packages, setPackages] = useState<PurchasesPackage[]>([])
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState<string | null>(null)
  const [restoring, setRestoring] = useState(false)
  const [currentPlan, setCurrentPlan] = useState<'free' | 'creator' | 'pro'>('free')

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    const [offering, plan] = await Promise.all([getOfferings(), getActivePlan()])
    setCurrentPlan(plan)
    if (offering?.availablePackages) setPackages(offering.availablePackages)
    setLoading(false)
  }

  function getPackage(planId: 'creator' | 'pro'): PurchasesPackage | undefined {
    const suffix = cycle === 'annual' ? 'annual' : 'monthly'
    return packages.find(p => p.product.identifier.includes(planId) && p.product.identifier.includes(suffix))
  }

  async function handlePurchase(planId: 'creator' | 'pro') {
    const pkg = getPackage(planId)
    if (!pkg) {
      Alert.alert('Not available', 'This plan is not available yet. Check back soon.')
      return
    }
    setPurchasing(planId)
    const result = await purchasePackage(pkg)
    setPurchasing(null)
    if (result.success) {
      Alert.alert('Welcome!', `You're now on the ${planId === 'creator' ? 'Creator' : 'Pro'} plan.`, [
        { text: 'Get started', onPress: () => router.back() },
      ])
    } else if (result.error) {
      Alert.alert('Purchase failed', result.error)
    }
  }

  async function handleRestore() {
    setRestoring(true)
    const plan = await restorePurchases()
    setRestoring(false)
    if (plan !== 'free') {
      Alert.alert('Restored', `Your ${plan} plan has been restored.`, [
        { text: 'Done', onPress: () => router.back() },
      ])
    } else {
      Alert.alert('No purchases found', 'No active subscription found for this Apple ID.')
    }
  }

  function priceLabel(planId: 'creator' | 'pro'): string {
    const pkg = getPackage(planId)
    if (!pkg) return cycle === 'annual' ? (planId === 'creator' ? '$79/yr' : '$159/yr') : (planId === 'creator' ? '$9/mo' : '$19/mo')
    return pkg.localizedPriceString + (cycle === 'annual' ? '/yr' : '/mo')
  }

  function savingsLabel(planId: 'creator' | 'pro'): string {
    return planId === 'creator' ? 'Save $29/yr' : 'Save $69/yr'
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={20} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Upgrade Grimoire</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.headline}>Unlock your full{'\n'}knowledge potential</Text>
        <Text style={styles.sub}>Free forever for the basics. Upgrade when you're ready to grow.</Text>

        {/* Billing toggle */}
        <View style={styles.cycleRow}>
          {(['monthly', 'annual'] as BillingCycle[]).map(c => (
            <TouchableOpacity
              key={c}
              style={[styles.cycleBtn, cycle === c && styles.cycleBtnActive]}
              onPress={() => setCycle(c)}
            >
              <Text style={[styles.cycleBtnText, cycle === c && styles.cycleBtnTextActive]}>
                {c === 'monthly' ? 'Monthly' : 'Annual'}
              </Text>
              {c === 'annual' && <View style={styles.saveBadge}><Text style={styles.saveBadgeText}>SAVE 30%</Text></View>}
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <ActivityIndicator style={{ marginTop: 40 }} color={Colors.primary} />
        ) : (
          <>
            {/* Creator Plan */}
            <PlanCard
              planId="creator"
              title="Creator"
              price={priceLabel('creator')}
              savingsLabel={cycle === 'annual' ? savingsLabel('creator') : undefined}
              features={PLAN_FEATURES.creator}
              color={PLAN_COLORS.creator}
              isCurrent={currentPlan === 'creator'}
              loading={purchasing === 'creator'}
              onPress={() => handlePurchase('creator')}
            />

            {/* Pro Plan */}
            <PlanCard
              planId="pro"
              title="Pro"
              price={priceLabel('pro')}
              savingsLabel={cycle === 'annual' ? savingsLabel('pro') : undefined}
              features={PLAN_FEATURES.pro}
              color={PLAN_COLORS.pro}
              isCurrent={currentPlan === 'pro'}
              loading={purchasing === 'pro'}
              onPress={() => handlePurchase('pro')}
              highlighted
            />

            {/* Free tier reminder */}
            <View style={styles.freeTier}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.textSecondary} />
              <Text style={styles.freeTierText}>Free plan: unlimited captures, 3 public repos, Explore access. Always free.</Text>
            </View>
          </>
        )}

        <TouchableOpacity onPress={handleRestore} disabled={restoring} style={styles.restoreBtn}>
          {restoring
            ? <ActivityIndicator size="small" color={Colors.textSecondary} />
            : <Text style={styles.restoreText}>Restore purchases</Text>}
        </TouchableOpacity>

        <Text style={styles.legal}>
          Payment processed by Apple. Subscriptions auto-renew unless cancelled 24h before the end of the billing period.
          Cancel anytime in Settings → Apple ID → Subscriptions.
        </Text>
      </ScrollView>
    </SafeAreaView>
  )
}

function PlanCard({
  planId, title, price, savingsLabel, features, color, isCurrent, loading, onPress, highlighted,
}: {
  planId: string
  title: string
  price: string
  savingsLabel?: string
  features: { label: string; plans: string[] }[]
  color: string
  isCurrent: boolean
  loading: boolean
  onPress: () => void
  highlighted?: boolean
}) {
  return (
    <View style={[styles.planCard, highlighted && styles.planCardHighlighted, { borderColor: color + '40' }]}>
      {highlighted && (
        <View style={[styles.popularBadge, { backgroundColor: color }]}>
          <Text style={styles.popularText}>MOST POPULAR</Text>
        </View>
      )}
      <View style={styles.planHeader}>
        <View>
          <Text style={styles.planTitle}>{title}</Text>
          <View style={styles.priceRow}>
            <Text style={[styles.planPrice, { color }]}>{price}</Text>
            {savingsLabel && <View style={[styles.savingsChip, { backgroundColor: color + '18' }]}>
              <Text style={[styles.savingsText, { color }]}>{savingsLabel}</Text>
            </View>}
          </View>
        </View>
        <View style={[styles.planIcon, { backgroundColor: color + '18' }]}>
          <Ionicons name={planId === 'creator' ? 'sparkles' : 'rocket'} size={22} color={color} />
        </View>
      </View>

      {features.map(f => (
        <View key={f.label} style={styles.featureRow}>
          <Ionicons name="checkmark" size={15} color={color} />
          <Text style={styles.featureText}>{f.label}</Text>
        </View>
      ))}

      <TouchableOpacity
        style={[styles.upgradeBtn, { backgroundColor: isCurrent ? Colors.card : color }, isCurrent && { borderWidth: 1.5, borderColor: color }]}
        onPress={onPress}
        disabled={isCurrent || loading}
        activeOpacity={0.85}
      >
        {loading
          ? <ActivityIndicator size="small" color={isCurrent ? color : Colors.card} />
          : <Text style={[styles.upgradeBtnText, { color: isCurrent ? color : Colors.card }]}>
              {isCurrent ? 'Current plan' : `Get ${title}`}
            </Text>}
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  navBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
  },
  closeBtn: {
    width: 36, height: 36, borderRadius: Radius.full,
    backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center',
    ...Shadow.card,
  },
  navTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  scroll: { padding: Spacing.lg, paddingBottom: 60 },
  headline: { fontSize: 28, fontWeight: '800', color: Colors.text, lineHeight: 36, marginBottom: Spacing.sm },
  sub: { ...Typography.cardBody, color: Colors.textSecondary, marginBottom: Spacing.xl, lineHeight: 22 },
  cycleRow: {
    flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg,
    backgroundColor: Colors.card, padding: 4, borderRadius: Radius.full, ...Shadow.card,
  },
  cycleBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, borderRadius: Radius.full, gap: 6,
  },
  cycleBtnActive: { backgroundColor: Colors.primary },
  cycleBtnText: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  cycleBtnTextActive: { color: Colors.card },
  saveBadge: { backgroundColor: Colors.gold + '30', borderRadius: Radius.full, paddingHorizontal: 6, paddingVertical: 2 },
  saveBadgeText: { fontSize: 9, fontWeight: '700', color: Colors.gold },
  planCard: {
    backgroundColor: Colors.card, borderRadius: Radius.xl,
    padding: Spacing.lg, marginBottom: Spacing.md,
    borderWidth: 1.5, ...Shadow.card, overflow: 'hidden',
  },
  planCardHighlighted: { borderWidth: 2 },
  popularBadge: {
    position: 'absolute', top: 0, right: 0,
    paddingHorizontal: 12, paddingVertical: 5,
    borderBottomLeftRadius: Radius.md,
  },
  popularText: { fontSize: 9, fontWeight: '700', color: '#fff', letterSpacing: 0.5 },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.md },
  planTitle: { fontSize: 18, fontWeight: '800', color: Colors.text, marginBottom: 4 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  planPrice: { fontSize: 22, fontWeight: '700' },
  savingsChip: { borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 3 },
  savingsText: { fontSize: 11, fontWeight: '700' },
  planIcon: {
    width: 48, height: 48, borderRadius: Radius.lg,
    alignItems: 'center', justifyContent: 'center',
  },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  featureText: { ...Typography.cardBody, color: Colors.text },
  upgradeBtn: {
    borderRadius: Radius.full, paddingVertical: 14,
    alignItems: 'center', justifyContent: 'center', marginTop: Spacing.md,
  },
  upgradeBtnText: { fontSize: 15, fontWeight: '700' },
  freeTier: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    padding: Spacing.md, marginTop: Spacing.sm, ...Shadow.card,
  },
  freeTierText: { ...Typography.caption, color: Colors.textSecondary, flex: 1, lineHeight: 18 },
  restoreBtn: { alignItems: 'center', paddingVertical: Spacing.lg },
  restoreText: { ...Typography.caption, color: Colors.primary, fontWeight: '600' },
  legal: {
    ...Typography.caption, color: Colors.textTertiary,
    textAlign: 'center', lineHeight: 18, paddingHorizontal: Spacing.md,
  },
})
