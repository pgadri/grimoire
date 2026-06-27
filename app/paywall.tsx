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
import type { PlanId } from '../lib/purchases'

type BillingCycle = 'monthly' | 'annual'

const PLAN_META: Record<'solopreneur' | 'team', {
  title: string
  icon: 'person' | 'people'
  color: string
  badge?: string
  fallbackMonthly: string
  fallbackAnnual: string
  savingsLabel: string
  features: string[]
}> = {
  solopreneur: {
    title: 'Solopreneur',
    icon: 'person',
    color: Colors.primary,
    fallbackMonthly: '$9/mo',
    fallbackAnnual: '$79/yr',
    savingsLabel: 'Save $29/yr',
    features: [
      'Unlimited captures',
      'Full community access (post + comment)',
      'AI-powered launch risk scanner',
      'Up to 3 projects',
      'Sell knowledge packets at Expert level',
      'Priority email support',
    ],
  },
  team: {
    title: 'Team',
    icon: 'people',
    color: '#9B59B6',
    badge: 'MOST POPULAR',
    fallbackMonthly: '$29/mo',
    fallbackAnnual: '$249/yr',
    savingsLabel: 'Save $99/yr',
    features: [
      'Everything in Solopreneur',
      'Up to 5 team seats',
      'Shared knowledge maps',
      'Team workspace & admin controls',
      'Unlimited projects',
      'Priority support',
    ],
  },
}

export default function PaywallScreen() {
  const router = useRouter()
  const [cycle, setCycle] = useState<BillingCycle>('annual')
  const [packages, setPackages] = useState<PurchasesPackage[]>([])
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState<string | null>(null)
  const [restoring, setRestoring] = useState(false)
  const [currentPlan, setCurrentPlan] = useState<PlanId>('free')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const [offering, plan] = await Promise.all([getOfferings(), getActivePlan()])
    setCurrentPlan(plan)
    if (offering?.availablePackages) setPackages(offering.availablePackages)
    setLoading(false)
  }

  function getPackage(planId: 'solopreneur' | 'team'): PurchasesPackage | undefined {
    const suffix = cycle === 'annual' ? 'annual' : 'monthly'
    return packages.find(p =>
      p.product.identifier.includes(planId) && p.product.identifier.includes(suffix)
    )
  }

  async function handlePurchase(planId: 'solopreneur' | 'team') {
    const pkg = getPackage(planId)
    if (!pkg) {
      Alert.alert('Not available', 'This plan is not available yet. Check back soon.')
      return
    }
    setPurchasing(planId)
    const result = await purchasePackage(pkg)
    setPurchasing(null)
    if (result.success) {
      const label = PLAN_META[planId].title
      Alert.alert('Welcome!', `You're now on the ${label} plan.`, [
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
      const label = plan === 'solopreneur' ? 'Solopreneur' : 'Team'
      Alert.alert('Restored', `Your ${label} plan has been restored.`, [
        { text: 'Done', onPress: () => router.back() },
      ])
    } else {
      Alert.alert('No purchases found', 'No active subscription found for this Apple ID.')
    }
  }

  function priceLabel(planId: 'solopreneur' | 'team'): string {
    const pkg = getPackage(planId)
    if (!pkg) {
      const meta = PLAN_META[planId]
      return cycle === 'annual' ? meta.fallbackAnnual : meta.fallbackMonthly
    }
    return pkg.product.priceString + (cycle === 'annual' ? '/yr' : '/mo')
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={20} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Upgrade Vibecoded</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.headline}>Build and ship with{'\n'}full confidence</Text>
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
              {c === 'annual' && (
                <View style={styles.saveBadge}>
                  <Text style={styles.saveBadgeText}>SAVE 30%</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <ActivityIndicator style={{ marginTop: 40 }} color={Colors.primary} />
        ) : (
          <>
            {(['solopreneur', 'team'] as const).map(planId => {
              const meta = PLAN_META[planId]
              return (
                <PlanCard
                  key={planId}
                  planId={planId}
                  title={meta.title}
                  icon={meta.icon}
                  price={priceLabel(planId)}
                  savingsLabel={cycle === 'annual' ? meta.savingsLabel : undefined}
                  features={meta.features}
                  color={meta.color}
                  badge={meta.badge}
                  isCurrent={currentPlan === planId}
                  loading={purchasing === planId}
                  onPress={() => handlePurchase(planId)}
                />
              )
            })}

            {/* Free tier reminder */}
            <View style={styles.freeTier}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.textSecondary} />
              <Text style={styles.freeTierText}>
                Free plan: 10 captures/mo, 1 project, community read access. Always free.
              </Text>
            </View>

            {/* Coming soon: Agency */}
            <View style={styles.agencyTeaser}>
              <View style={styles.agencyLeft}>
                <Text style={styles.agencyTitle}>Agency / Pro</Text>
                <Text style={styles.agencySub}>Unlimited seats, API access, custom domain</Text>
              </View>
              <View style={styles.soonBadge}>
                <Text style={styles.soonText}>SOON</Text>
              </View>
            </View>
          </>
        )}

        <TouchableOpacity onPress={handleRestore} disabled={restoring} style={styles.restoreBtn}>
          {restoring
            ? <ActivityIndicator size="small" color={Colors.textSecondary} />
            : <Text style={styles.restoreText}>Restore purchases</Text>}
        </TouchableOpacity>

        <Text style={styles.legal}>
          Payment processed by Apple. Subscriptions auto-renew unless cancelled 24h before the end of the billing period.{' '}
          Cancel anytime in Settings → Apple ID → Subscriptions.
        </Text>
      </ScrollView>
    </SafeAreaView>
  )
}

function PlanCard({
  planId, title, icon, price, savingsLabel, features, color, badge, isCurrent, loading, onPress,
}: {
  planId: string
  title: string
  icon: 'person' | 'people'
  price: string
  savingsLabel?: string
  features: string[]
  color: string
  badge?: string
  isCurrent: boolean
  loading: boolean
  onPress: () => void
}) {
  return (
    <View style={[styles.planCard, badge && styles.planCardHighlighted, { borderColor: color + '40' }]}>
      {badge && (
        <View style={[styles.popularBadge, { backgroundColor: color }]}>
          <Text style={styles.popularText}>{badge}</Text>
        </View>
      )}

      <View style={styles.planHeader}>
        <View>
          <Text style={styles.planTitle}>{title}</Text>
          <View style={styles.priceRow}>
            <Text style={[styles.planPrice, { color }]}>{price}</Text>
            {savingsLabel && (
              <View style={[styles.savingsChip, { backgroundColor: color + '18' }]}>
                <Text style={[styles.savingsText, { color }]}>{savingsLabel}</Text>
              </View>
            )}
          </View>
        </View>
        <View style={[styles.planIcon, { backgroundColor: color + '18' }]}>
          <Ionicons name={icon} size={22} color={color} />
        </View>
      </View>

      {features.map(f => (
        <View key={f} style={styles.featureRow}>
          <Ionicons name="checkmark" size={15} color={color} />
          <Text style={styles.featureText}>{f}</Text>
        </View>
      ))}

      <TouchableOpacity
        style={[
          styles.upgradeBtn,
          { backgroundColor: isCurrent ? Colors.card : color },
          isCurrent && { borderWidth: 1.5, borderColor: color },
        ]}
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
  saveBadge: {
    backgroundColor: Colors.gold + '30', borderRadius: Radius.full,
    paddingHorizontal: 6, paddingVertical: 2,
  },
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

  planHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: Spacing.md,
  },
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
  featureText: { ...Typography.cardBody, color: Colors.text, flex: 1 },

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

  agencyTeaser: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    padding: Spacing.md, marginTop: Spacing.sm, ...Shadow.card,
    borderWidth: 1, borderColor: Colors.border, opacity: 0.7,
  },
  agencyLeft: { flex: 1 },
  agencyTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
  agencySub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  soonBadge: {
    backgroundColor: Colors.accent + '20', borderRadius: Radius.full,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  soonText: { fontSize: 9, fontWeight: '700', color: Colors.accent, letterSpacing: 0.8 },

  restoreBtn: { alignItems: 'center', paddingVertical: Spacing.lg },
  restoreText: { ...Typography.caption, color: Colors.primary, fontWeight: '600' },
  legal: {
    ...Typography.caption, color: Colors.textTertiary,
    textAlign: 'center', lineHeight: 18, paddingHorizontal: Spacing.md,
  },
})
