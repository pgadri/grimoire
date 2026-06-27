import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking, Share, Switch } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter, useFocusEffect } from 'expo-router'
import { useState, useCallback } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Clipboard from 'expo-clipboard'
import { Colors, Spacing, Radius, Shadow, Typography } from '../../constants/theme'
import { getUser, signOut, GrimoireUser } from '../../lib/auth'
import { getActivePlan } from '../../lib/purchases'
import { getRepState, getLevelForPoints, getNextLevel, progressToNext, canSellContent, CURRENCY, type RepState } from '../../lib/reputation'
import type { PlanId } from '../../lib/purchases'
import type { Capture } from '../../components/CaptureCard'

const CAPTURES_KEY = 'grimoire:captures'
const MAPS_KEY = 'grimoire:maps'
const NOTIF_KEY = 'grimoire:notif_thread_replies'

type Stats = { captures: number; starred: number; repos: number; streak: number }

function calcStreak(captures: Capture[]): number {
  if (!captures.length) return 0
  const today = new Date()
  let streak = 0
  for (let i = 0; i < 30; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    if (captures.some(c => c.date === label)) streak++
    else if (i > 0) break
  }
  return streak
}

type SettingItem = {
  icon: React.ComponentProps<typeof Ionicons>['name']
  iconBg: string
  label: string
  sub: string
  route?: string
  onPress?: () => void
}

const WORKSPACE_ITEMS: SettingItem[] = [
  {
    icon: 'scan-outline',
    iconBg: '#34C759',
    label: 'Repo Scanner',
    sub: 'Scan any public GitHub repo for risks',
    route: '/scan',
  },
  {
    icon: 'shield-checkmark-outline',
    iconBg: '#5856D6',
    label: 'Expert Review',
    sub: 'Get your code audited before launch',
    route: '/review',
  },
  {
    icon: 'people-outline',
    iconBg: '#007AFF',
    label: 'Team Workspace',
    sub: 'Collaborate with your team',
    route: '/team',
  },
  {
    icon: 'flash-outline',
    iconBg: '#FF9500',
    label: 'Connectors',
    sub: 'GitHub, OpenAI, Notion',
    route: '/connectors',
  },
]

const ACCOUNT_ITEMS: SettingItem[] = [
  {
    icon: 'lock-closed-outline',
    iconBg: '#8E8E93',
    label: 'Privacy & Visibility',
    sub: 'Who can see your repos',
  },
  {
    icon: 'card-outline',
    iconBg: '#FF9F0A',
    label: 'Subscription',
    sub: 'Free plan · Upgrade',
  },
  {
    icon: 'document-text-outline',
    iconBg: '#5856D6',
    label: 'Privacy Policy',
    sub: 'How we handle your data',
  },
  {
    icon: 'reader-outline',
    iconBg: '#007AFF',
    label: 'Terms of Service',
    sub: 'Rules of use',
  },
  {
    icon: 'help-circle-outline',
    iconBg: '#34C759',
    label: 'Help & Feedback',
    sub: 'hello@vibecoded.tech',
  },
  {
    icon: 'trash-outline',
    iconBg: '#FF3B30',
    label: 'Delete Account',
    sub: 'Permanently remove your data',
  },
]

export default function ProfileScreen() {
  const router = useRouter()
  const [user, setUser] = useState<GrimoireUser | null>(null)
  const [stats, setStats] = useState<Stats>({ captures: 0, starred: 0, repos: 0, streak: 0 })
  const [plan, setPlan] = useState<PlanId>('free')
  const [publicMaps, setPublicMaps] = useState<{ id: string; title: string }[]>([])
  const [rep, setRep] = useState<RepState>({ points: 0, events: [] })
  const [notifReplies, setNotifReplies] = useState(true)

  useFocusEffect(useCallback(() => {
    async function load() {
      const [u, capturesRaw, mapsRaw, activePlan, repState, notifRaw] = await Promise.all([
        getUser(),
        AsyncStorage.getItem(CAPTURES_KEY),
        AsyncStorage.getItem(MAPS_KEY),
        getActivePlan(),
        getRepState(),
        AsyncStorage.getItem(NOTIF_KEY),
      ])
      setUser(u)
      setPlan(activePlan)
      setRep(repState)
      setNotifReplies(notifRaw !== 'false')
      const captures: Capture[] = capturesRaw ? JSON.parse(capturesRaw) : []
      const maps: any[] = mapsRaw ? JSON.parse(mapsRaw) : []
      setStats({
        captures: captures.length,
        starred: captures.filter(c => c.starred).length,
        repos: maps.length,
        streak: calcStreak(captures),
      })
      setPublicMaps(maps.filter(m => m.isPublic).slice(0, 2).map(m => ({ id: m.id, title: m.title })))
    }
    load()
  }, []))

  const displayName = user?.name ?? 'Vibe Coder'
  const displayHandle = user?.handle ?? '@you'
  const displayInitial = displayName[0]?.toUpperCase() ?? 'V'
  const displayBio = user?.bio || 'Building something great.'

  const handleCopyHandle = async () => {
    await Clipboard.setStringAsync(displayHandle)
    Alert.alert('Copied', `${displayHandle} copied to clipboard.`)
  }

  const handleEditProfile = () => {
    Alert.alert('Edit Profile', 'Profile editing coming soon.')
  }

  const handlePrivacy = () => {
    Alert.alert('Privacy & Visibility', 'Control who sees your captures and repos.\n\nFull privacy settings coming soon.')
  }

  const handleSubscription = () => {
    if (plan !== 'free') {
      Alert.alert(
        'Manage Subscription',
        'To cancel, go to Settings → Apple ID → Subscriptions on your iPhone and cancel Vibecoded.',
        [
          { text: 'Open Settings', onPress: () => Linking.openURL('https://apps.apple.com/account/subscriptions') },
          { text: 'Done', style: 'cancel' },
        ]
      )
    } else {
      router.push('/paywall' as any)
    }
  }

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account?',
      'This permanently removes your profile, handle, and account data. Your public posts stay anonymised. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive', onPress: async () => {
            try {
              const token = await import('../../lib/auth').then(m => m.getToken())
              if (!token) throw new Error('Not signed in')
              const res = await fetch('https://reel-capture-production.up.railway.app/auth/account', {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
              })
              if (!res.ok) throw new Error('Server error')
              await signOut()
              router.replace('/(auth)')
            } catch {
              Alert.alert('Error', 'Could not delete account. Please try again or email hello@vibecoded.tech.')
            }
          },
        },
      ]
    )
  }

  const handleHelp = () => {
    Linking.openURL('mailto:hello@vibecoded.tech?subject=Help%20%26%20Feedback').catch(() => {
      Alert.alert('Send feedback', 'Email us at hello@vibecoded.tech')
    })
  }

  const handleNotifReplies = async (val: boolean) => {
    setNotifReplies(val)
    await AsyncStorage.setItem(NOTIF_KEY, val ? 'true' : 'false')
    if (val) {
      Alert.alert('Notifications on', 'You\'ll be notified when someone replies to your threads.')
    }
  }

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      "You'll need to set up your profile again.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out', style: 'destructive', onPress: async () => {
            await signOut()
            router.replace('/(auth)')
          },
        },
      ]
    )
  }

  const handleItemPress = (item: SettingItem) => {
    if (item.route) { router.push(item.route as any); return }
    if (item.label === 'Privacy & Visibility') handlePrivacy()
    else if (item.label === 'Subscription') handleSubscription()
    else if (item.label === 'Privacy Policy') router.push({ pathname: '/legal', params: { type: 'privacy' } } as any)
    else if (item.label === 'Terms of Service') router.push({ pathname: '/legal', params: { type: 'terms' } } as any)
    else if (item.label === 'Help & Feedback') handleHelp()
    else if (item.label === 'Delete Account') handleDeleteAccount()
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <View style={styles.logoMark}>
          <Text style={styles.logoText}>✦</Text>
        </View>
        <Text style={styles.topTitle}>Profile</Text>
        <View style={styles.topSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Identity block */}
        <View style={styles.identityBlock}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{displayInitial}</Text>
          </View>
          <Text style={styles.name}>{displayName}</Text>
          <TouchableOpacity style={styles.handleRow} onPress={handleCopyHandle}>
            <Text style={styles.handle}>{displayHandle}</Text>
            <Ionicons name="copy-outline" size={13} color={Colors.accent} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.planBadge, plan !== 'free' && styles.planBadgePaid]}
            onPress={() => plan === 'free' && router.push('/paywall' as any)}
          >
            <Text style={[styles.planText, plan !== 'free' && styles.planTextPaid]}>
              {plan === 'free'
                ? 'FREE · UPGRADE ↗'
                : plan === 'solopreneur' ? '✦ SOLOPRENEUR'
                : '✦ TEAM'}
            </Text>
          </TouchableOpacity>

          {/* Creator mode badge */}
          {user?.creatorMode && (
            <TouchableOpacity
              style={styles.creatorBadge}
              onPress={() => user.handle && router.push(`/creator/${user.handle}` as any)}
            >
              <Ionicons name="sparkles" size={11} color="#fff" />
              <Text style={styles.creatorBadgeText}>CREATOR</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.bio}>{displayBio}</Text>
        </View>

        <TouchableOpacity style={styles.editBtn} onPress={handleEditProfile}>
          <Text style={styles.editBtnText}>Edit Profile</Text>
        </TouchableOpacity>

        {/* Stats */}
        <View style={styles.statsCard}>
          {[
            { label: 'Captures', value: stats.captures.toString() },
            { label: 'Starred', value: stats.starred.toString() },
            { label: 'Repos', value: stats.repos.toString() },
            { label: 'Streak', value: `${stats.streak}d` },
          ].map((s, i, arr) => (
            <View key={s.label} style={[styles.stat, i < arr.length - 1 && styles.statBorder]}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Reputation */}
        {(() => {
          const level = getLevelForPoints(rep.points)
          const next = getNextLevel(rep.points)
          const progress = progressToNext(rep.points)
          return (
            <View style={styles.repCard}>
              <View style={styles.repHeader}>
                <View style={styles.repLevelRow}>
                  <Text style={styles.repEmoji}>{level.emoji}</Text>
                  <View>
                    <Text style={[styles.repLevelName, { color: level.color }]}>{level.name}</Text>
                    <Text style={styles.repPoints}>{rep.points} {CURRENCY.plural} {CURRENCY.symbol}</Text>
                  </View>
                </View>
                {canSellContent(rep.points) && (
                  <View style={styles.sellerBadge}>
                    <Text style={styles.sellerBadgeText}>SELLER ELIGIBLE</Text>
                  </View>
                )}
              </View>
              {next && (
                <>
                  <View style={styles.repProgressBar}>
                    <View style={[styles.repProgressFill, { width: `${progress * 100}%` as any, backgroundColor: level.color }]} />
                  </View>
                  <Text style={styles.repProgressLabel}>
                    {next.minPoints - rep.points} {CURRENCY.plural} to {next.emoji} {next.name}
                  </Text>
                </>
              )}
              {rep.events.length > 0 && (
                <View style={styles.repEvents}>
                  {rep.events.slice(0, 3).map((e, i) => (
                    <View key={i} style={styles.repEvent}>
                      <Text style={styles.repEventLabel}>{e.label}</Text>
                      <Text style={styles.repEventPts}>+{e.points} {CURRENCY.symbol}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )
        })()}

        {/* Creator Mode card */}
        {user?.creatorMode ? (
          <TouchableOpacity
            style={styles.creatorCard}
            onPress={() => user.handle && router.push(`/creator/${user.handle}` as any)}
            activeOpacity={0.88}
          >
            <View style={styles.creatorCardLeft}>
              <Text style={styles.creatorCardEmoji}>🎨</Text>
              <View>
                <Text style={styles.creatorCardTitle}>Creator Profile</Text>
                <Text style={styles.creatorCardSub}>
                  @{user.handle} · {(user.followerCount ?? 0).toLocaleString()} followers
                </Text>
              </View>
            </View>
            <View style={styles.creatorActions}>
              <TouchableOpacity
                onPress={() => router.push('/packet-editor' as any)}
                style={styles.creatorAction}
              >
                <Ionicons name="add-circle-outline" size={15} color={Colors.primary} />
                <Text style={styles.creatorActionText}>New Packet</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={async () => {
                  await Share.share({
                    message: `Follow me on Vibecoded → vibecoded.tech/@${user.handle}`,
                    url: `https://vibecoded.tech/@${user.handle}`,
                  })
                }}
                style={styles.creatorAction}
              >
                <Ionicons name="share-outline" size={15} color={Colors.primary} />
                <Text style={styles.creatorActionText}>Share</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ) : canSellContent(rep.points) ? (
          <TouchableOpacity
            style={styles.goCreatorCard}
            onPress={() => router.push('/creator-apply' as any)}
            activeOpacity={0.88}
          >
            <View style={styles.goCreatorLeft}>
              <Text style={styles.goCreatorEmoji}>🎨</Text>
              <View>
                <Text style={styles.goCreatorTitle}>Become a Creator</Text>
                <Text style={styles.goCreatorSub}>Apply to publish knowledge packets</Text>
              </View>
            </View>
            <View style={styles.goCreatorArrow}>
              <Ionicons name="arrow-forward" size={16} color="#fff" />
            </View>
          </TouchableOpacity>
        ) : (
          <View style={styles.creatorLockedCard}>
            <Ionicons name="lock-closed-outline" size={16} color={Colors.textTertiary} />
            <Text style={styles.creatorLockedText}>
              Reach Expert level (500 {CURRENCY.plural}) to unlock Creator Mode
            </Text>
          </View>
        )}

        {/* Streak */}
        <View style={styles.streakCard}>
          <View style={styles.streakLeft}>
            <Text style={styles.streakTitle}>Capture streak</Text>
            <Text style={styles.streakSub}>
              {stats.streak > 0
                ? `${stats.streak} day${stats.streak !== 1 ? 's' : ''} in a row. Keep it up.`
                : 'Capture something today to start your streak.'}
            </Text>
            <View style={styles.streakDots}>
              {Array.from({ length: 7 }, (_, i) => (
                <View key={i} style={[styles.streakDot, i < stats.streak && styles.streakDotActive]} />
              ))}
            </View>
          </View>
          <View style={styles.streakRight}>
            <Text style={styles.streakFlame}>{stats.streak > 0 ? '🔥' : '💤'}</Text>
            <Text style={styles.streakNumber}>{stats.streak}</Text>
          </View>
        </View>

        {/* Public repos */}
        <Text style={styles.sectionLabel}>MY PUBLIC REPOS</Text>

        {publicMaps.length === 0 ? (
          <View style={styles.emptyRepos}>
            <Text style={styles.emptyReposText}>No public repos yet. Open Repos and make one public.</Text>
          </View>
        ) : (
          publicMaps.map(map => (
            <TouchableOpacity
              key={map.id}
              style={styles.repoRow}
              onPress={() => router.push(`/map/${map.id}` as any)}
            >
              <Ionicons name="git-branch-outline" size={18} color={Colors.accent} />
              <Text style={styles.repoTitle}>{map.title}</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} />
            </TouchableOpacity>
          ))
        )}

        <TouchableOpacity
          style={styles.viewAll}
          onPress={() => router.push('/(tabs)/maps' as any)}
        >
          <Text style={styles.viewAllText}>View all repos</Text>
          <Ionicons name="arrow-forward" size={14} color={Colors.primary} />
        </TouchableOpacity>

        {/* Settings sections */}
        <View style={styles.settingsDivider} />

        <Text style={styles.groupLabel}>NOTIFICATIONS</Text>
        <View style={styles.settingsGroup}>
          <View style={styles.settingRow}>
            <View style={[styles.settingIcon, { backgroundColor: '#FF3B30' }]}>
              <Ionicons name="notifications-outline" size={17} color="#fff" />
            </View>
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Thread replies</Text>
              <Text style={styles.settingSub}>Push notification when someone replies to your thread</Text>
            </View>
            <Switch
              value={notifReplies}
              onValueChange={handleNotifReplies}
              trackColor={{ false: Colors.border, true: Colors.primary }}
              thumbColor="#fff"
            />
          </View>
        </View>

        <Text style={styles.groupLabel}>WORKSPACE</Text>
        <View style={styles.settingsGroup}>
          {WORKSPACE_ITEMS.map((item, i) => (
            <TouchableOpacity
              key={item.label}
              style={[styles.settingRow, i < WORKSPACE_ITEMS.length - 1 && styles.settingRowBorder]}
              onPress={() => handleItemPress(item)}
              activeOpacity={0.7}
            >
              <View style={[styles.settingIcon, { backgroundColor: item.iconBg }]}>
                <Ionicons name={item.icon} size={17} color="#fff" />
              </View>
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>{item.label}</Text>
                <Text style={styles.settingSub}>{item.sub}</Text>
              </View>
              <Ionicons name="chevron-forward" size={15} color={Colors.textTertiary} />
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.groupLabel}>ACCOUNT</Text>
        <View style={styles.settingsGroup}>
          {ACCOUNT_ITEMS.map((item, i) => (
            <TouchableOpacity
              key={item.label}
              style={[styles.settingRow, i < ACCOUNT_ITEMS.length - 1 && styles.settingRowBorder]}
              onPress={() => handleItemPress(item)}
              activeOpacity={0.7}
            >
              <View style={[styles.settingIcon, { backgroundColor: item.iconBg }]}>
                <Ionicons name={item.icon} size={17} color="#fff" />
              </View>
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>{item.label}</Text>
                <Text style={styles.settingSub}>
                  {item.label === 'Subscription'
                    ? plan === 'free' ? 'Free plan · Upgrade'
                    : plan === 'solopreneur' ? 'Solopreneur · Manage'
                    : 'Team · Manage'
                    : item.sub}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={15} color={Colors.textTertiary} />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.signOutCard} onPress={handleSignOut} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={18} color={Colors.error} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.sm,
  },
  logoMark: {
    width: 36, height: 36, borderRadius: Radius.full,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  logoText: { color: Colors.card, fontSize: 16, fontWeight: '700' },
  topTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  topSpacer: { width: 36 },
  scroll: { paddingHorizontal: Spacing.lg, paddingBottom: 48 },
  identityBlock: { alignItems: 'center', paddingTop: Spacing.lg, paddingBottom: Spacing.md },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.md, ...Shadow.card,
  },
  avatarText: { color: Colors.card, fontSize: 30, fontWeight: '700' },
  name: { fontSize: 22, fontWeight: '700', color: Colors.text, marginBottom: 6 },
  handleRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: Spacing.md },
  handle: { ...Typography.caption, color: Colors.accent, fontWeight: '600', fontSize: 14 },
  planBadge: {
    backgroundColor: Colors.primary + '15', borderRadius: Radius.full,
    paddingHorizontal: 14, paddingVertical: 5, marginBottom: Spacing.md,
  },
  planBadgePaid: { backgroundColor: Colors.gold + '25' },
  planText: { fontSize: 10, fontWeight: '700', color: Colors.primary, letterSpacing: 1 },
  planTextPaid: { color: Colors.gold },
  emptyRepos: {
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    padding: Spacing.md, marginBottom: Spacing.sm, ...Shadow.card,
  },
  emptyReposText: { ...Typography.caption, color: Colors.textSecondary },
  bio: { ...Typography.cardBody, color: Colors.textSecondary, textAlign: 'center' },
  editBtn: {
    borderWidth: 1.5, borderColor: Colors.primary,
    borderRadius: Radius.full, paddingVertical: 10,
    alignItems: 'center', marginBottom: Spacing.lg,
  },
  editBtnText: { ...Typography.button, color: Colors.primary },
  statsCard: {
    flexDirection: 'row', backgroundColor: Colors.card,
    borderRadius: Radius.lg, padding: Spacing.lg,
    marginBottom: Spacing.md, ...Shadow.card,
  },
  stat: { flex: 1, alignItems: 'center' },
  statBorder: { borderRightWidth: 1, borderRightColor: Colors.border },
  statValue: { fontSize: 20, fontWeight: '700', color: Colors.text, marginBottom: 2 },
  statLabel: { ...Typography.caption, color: Colors.textSecondary },
  streakCard: {
    backgroundColor: Colors.primary, borderRadius: Radius.lg,
    padding: Spacing.lg, marginBottom: Spacing.xl,
    flexDirection: 'row', alignItems: 'center', ...Shadow.card,
  },
  streakLeft: { flex: 1 },
  streakTitle: { fontSize: 15, fontWeight: '700', color: Colors.card, marginBottom: 4 },
  streakSub: { ...Typography.caption, color: Colors.card + 'CC', lineHeight: 18, marginBottom: Spacing.md },
  streakDots: { flexDirection: 'row', gap: 6 },
  streakDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.card + '40' },
  streakDotActive: { backgroundColor: Colors.gold },
  streakRight: { alignItems: 'center', paddingLeft: Spacing.lg },
  streakFlame: { fontSize: 28 },
  streakNumber: { fontSize: 22, fontWeight: '800', color: Colors.card },
  sectionLabel: { ...Typography.sectionLabel, color: Colors.sectionLabel, marginBottom: Spacing.md },
  repoRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.card, borderRadius: Radius.md,
    padding: Spacing.md, marginBottom: Spacing.sm, ...Shadow.card,
  },
  repoTitle: { ...Typography.cardBody, color: Colors.text, flex: 1 },
  viewAll: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingTop: Spacing.sm, marginBottom: Spacing.xl,
  },
  viewAllText: { ...Typography.caption, color: Colors.primary, fontWeight: '600' },
  settingsDivider: { height: 1, backgroundColor: Colors.border, marginBottom: Spacing.lg },
  groupLabel: {
    fontSize: 12, fontWeight: '700', color: Colors.textSecondary,
    letterSpacing: 0.5, marginBottom: 8, marginLeft: 4,
  },
  settingsGroup: {
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    marginBottom: Spacing.lg, overflow: 'hidden', ...Shadow.card,
  },
  settingRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 13, paddingHorizontal: Spacing.md, gap: 12,
  },
  settingRowBorder: {
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  settingIcon: {
    width: 34, height: 34, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
  },
  settingText: { flex: 1 },
  settingLabel: { fontSize: 15, fontWeight: '500', color: Colors.text },
  settingSub: { ...Typography.caption, color: Colors.textSecondary, marginTop: 1 },
  signOutCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, backgroundColor: Colors.card, borderRadius: Radius.lg,
    paddingVertical: 16, marginBottom: Spacing.xl, ...Shadow.card,
  },
  signOutText: { fontSize: 15, fontWeight: '600', color: Colors.error },

  creatorBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.primary, borderRadius: Radius.full,
    paddingHorizontal: 10, paddingVertical: 5, marginBottom: Spacing.sm,
  },
  creatorBadgeText: { fontSize: 10, fontWeight: '800', color: '#fff', letterSpacing: 1 },

  creatorCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.primary + '10', borderRadius: Radius.lg,
    padding: Spacing.md, marginBottom: Spacing.md,
    borderWidth: 1.5, borderColor: Colors.primary + '30',
  },
  creatorCardLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flex: 1 },
  creatorCardEmoji: { fontSize: 26 },
  creatorCardTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
  creatorCardSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  creatorShareBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Colors.card, borderRadius: Radius.full,
    paddingHorizontal: 12, paddingVertical: 7,
    borderWidth: 1, borderColor: Colors.primary + '40',
  },
  creatorShareText: { fontSize: 12, fontWeight: '700', color: Colors.primary },
  creatorActions: { flexDirection: 'row', gap: 8 },
  creatorAction: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.card, borderRadius: Radius.full,
    paddingHorizontal: 10, paddingVertical: 6,
    borderWidth: 1, borderColor: Colors.primary + '40',
  },
  creatorActionText: { fontSize: 11, fontWeight: '700', color: Colors.primary },

  goCreatorCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.primary, borderRadius: Radius.lg,
    padding: Spacing.md, marginBottom: Spacing.md, ...Shadow.card,
  },
  goCreatorLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flex: 1 },
  goCreatorEmoji: { fontSize: 26 },
  goCreatorTitle: { fontSize: 15, fontWeight: '700', color: '#fff' },
  goCreatorSub: { fontSize: 12, color: '#ffffffCC', marginTop: 2 },
  goCreatorArrow: {
    width: 32, height: 32, borderRadius: Radius.full,
    backgroundColor: '#ffffff25', alignItems: 'center', justifyContent: 'center',
  },

  creatorLockedCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    padding: Spacing.md, marginBottom: Spacing.md,
    borderWidth: 1, borderColor: Colors.border,
  },
  creatorLockedText: { fontSize: 13, color: Colors.textTertiary, flex: 1 },
  // Reputation card
  repCard: {
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    padding: Spacing.lg, marginBottom: Spacing.md, ...Shadow.card,
  },
  repHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },
  repLevelRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  repEmoji: { fontSize: 32 },
  repLevelName: { fontSize: 17, fontWeight: '800' },
  repPoints: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  sellerBadge: {
    backgroundColor: Colors.gold + '20', borderRadius: Radius.full,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  sellerBadgeText: { fontSize: 9, fontWeight: '700', color: Colors.gold, letterSpacing: 0.8 },
  repProgressBar: {
    height: 6, backgroundColor: Colors.border, borderRadius: Radius.full,
    overflow: 'hidden', marginBottom: 6,
  },
  repProgressFill: { height: '100%', borderRadius: Radius.full },
  repProgressLabel: { ...Typography.caption, color: Colors.textSecondary, marginBottom: Spacing.md },
  repEvents: { gap: 6, borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: Spacing.sm },
  repEvent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  repEventLabel: { ...Typography.caption, color: Colors.textSecondary, flex: 1 },
  repEventPts: { fontSize: 12, fontWeight: '700', color: Colors.success },
})
