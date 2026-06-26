import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, TextInput, RefreshControl, Share, Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useState, useCallback } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Colors, Spacing, Radius, Typography, Shadow } from '../../constants/theme'
import CaptureCard, { Capture } from '../../components/CaptureCard'
import { CaptureModal } from '../../components/CaptureModal'
import { AddToMapSheet } from '../../components/AddToMapSheet'
import { useRouter, useFocusEffect } from 'expo-router'
import { getProjectProfile, ProjectProfile } from '../../lib/project'
import { matchRisks, readinessScore } from '../../lib/projectRisk'
import { SEED_CAPTURES } from '../../lib/seeds'
import { getUser } from '../../lib/auth'

const RESOLVED_KEY = 'grimoire:resolvedRisks'
const CAPTURES_KEY = 'grimoire:captures'

const MOCK_CAPTURES: Capture[] = [
  {
    id: '1',
    title: 'How I got my first 1000 users without spending a dollar on ads',
    sourceUrl: 'https://instagram.com/reel/abc',
    sourceType: 'video',
    creator: '@indiefounder',
    platform: 'Instagram',
    date: 'Jun 24',
    stars: 142,
    starred: false,
    isPublic: true,
    pushed: true,
    pinned: true,
    preview: '• Launch to your existing network first — DMs convert 10x better than posts\n• Your first 10 users should be people who already trust you\n• Don\'t announce, infiltrate',
  },
  {
    id: '2',
    title: 'Pricing strategy for your first app — why free is a trap',
    sourceUrl: 'https://youtube.com/watch?v=xyz',
    sourceType: 'video',
    creator: '@buildwithme',
    platform: 'YouTube',
    date: 'Jun 24',
    stars: 89,
    starred: true,
    isPublic: false,
    pushed: true,
    pinned: false,
    preview: '• Start at $4.99 minimum — free signals no value\n• Annual plans convert 3x better than monthly\n• Raise price after first 100 users, not before',
  },
  {
    id: '3',
    title: 'Screenshot: App store optimization checklist',
    sourceUrl: '',
    sourceType: 'image',
    creator: 'You',
    platform: 'Screenshot',
    date: 'Jun 22',
    stars: 0,
    starred: false,
    isPublic: false,
    pushed: false,
    pinned: false,
    preview: '• Use keywords in subtitle, not just title\n• First 3 screenshots must show core value\n• Localize at minimum for US + UK + AU',
  },
  {
    id: '4',
    title: 'How to set up Stripe in an Expo app in 30 minutes',
    sourceUrl: 'https://youtube.com/watch?v=stripe',
    sourceType: 'video',
    creator: '@stripepro',
    platform: 'YouTube',
    date: 'Jun 18',
    stars: 34,
    starred: false,
    isPublic: false,
    pushed: true,
    pinned: false,
    preview: '• Use stripe-react-native, not Stripe.js\n• Test mode cards: 4242 4242 4242 4242\n• Always verify payments server-side',
  },
  {
    id: '5',
    title: 'The fastest way to build a landing page that converts',
    sourceUrl: 'https://instagram.com/reel/lp',
    sourceType: 'video',
    creator: '@growthpro',
    platform: 'Instagram',
    date: 'May 30',
    stars: 211,
    starred: true,
    isPublic: true,
    pushed: true,
    pinned: false,
    preview: '• Lead with the outcome, not the feature\n• One CTA per page — remove everything else\n• Social proof above the fold, not at the bottom',
  },
]

function getGroup(date: string): string {
  const today = new Date()
  const todayStr = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  const thisWeekDates = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - (i + 1))
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  })

  if (date === todayStr) return 'TODAY'
  if (thisWeekDates.includes(date)) return 'THIS WEEK'

  const month = date.split(' ')[0]
  return month.toUpperCase()
}

function groupCaptures(captures: Capture[]): { label: string; items: Capture[] }[] {
  const pinned = captures.filter(c => c.pinned)
  const unpinned = captures.filter(c => !c.pinned)

  const groupMap: Record<string, Capture[]> = {}
  const groupOrder: string[] = []

  for (const c of unpinned) {
    const g = getGroup(c.date)
    if (!groupMap[g]) {
      groupMap[g] = []
      groupOrder.push(g)
    }
    groupMap[g].push(c)
  }

  const result: { label: string; items: Capture[] }[] = []
  if (pinned.length > 0) result.push({ label: 'PINNED', items: pinned })
  for (const label of groupOrder) result.push({ label, items: groupMap[label] })
  return result
}

export default function FeedScreen() {
  const [captures, setCaptures] = useState(MOCK_CAPTURES)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const router = useRouter()
  const [showCapture, setShowCapture] = useState(false)
  const [profile, setProfile] = useState<ProjectProfile | null>(null)
  const [openRisks, setOpenRisks] = useState(0)
  const [score, setScore] = useState(100)
  const [addToMapCapture, setAddToMapCapture] = useState<Capture | null>(null)
  const [userName, setUserName] = useState('')

  const persistCaptures = async (updated: Capture[]) => {
    try { await AsyncStorage.setItem(CAPTURES_KEY, JSON.stringify(updated)) } catch {}
  }

  useFocusEffect(useCallback(() => {
    let active = true
    const load = async () => {
      getUser().then(u => { if (active && u) setUserName(u.name.split(' ')[0]) })
      // Load persisted captures
      try {
        const raw = await AsyncStorage.getItem(CAPTURES_KEY)
        if (raw) {
          const saved = JSON.parse(raw)
          if (active && Array.isArray(saved) && saved.length > 0) setCaptures(saved)
        } else {
          await AsyncStorage.setItem(CAPTURES_KEY, JSON.stringify(SEED_CAPTURES))
          if (active) setCaptures(SEED_CAPTURES)
        }
      } catch {}

      const p = await getProjectProfile()
      let resolved: string[] = []
      try {
        const raw = await AsyncStorage.getItem(RESOLVED_KEY)
        resolved = raw ? JSON.parse(raw) : []
      } catch {}
      if (!active) return
      setProfile(p)
      if (p) {
        const risks = matchRisks(p, resolved)
        setOpenRisks(risks.filter(r => !r.resolved).length)
        setScore(readinessScore(p, resolved))
      }
    }
    load()
    return () => { active = false }
  }, []))

  const onRefresh = () => {
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 1000)
  }

  const handleStar = (id: string) => {
    setCaptures(prev => {
      const next = prev.map(c => c.id === id
        ? { ...c, starred: !c.starred, stars: c.starred ? c.stars - 1 : c.stars + 1 }
        : c
      )
      persistCaptures(next)
      return next
    })
  }

  const handlePush = (id: string) => {
    setCaptures(prev => {
      const next = prev.map(c => c.id === id ? { ...c, pushed: true } : c)
      persistCaptures(next)
      return next
    })
  }

  const handleShare = async (capture: Capture) => {
    await Share.share({
      title: capture.title,
      message: `${capture.title}\n\n${capture.preview}\n\nShared from Grimoire`,
    })
  }

  const handleLongPress = (capture: Capture) => {
    Alert.alert(capture.title, undefined, [
      {
        text: capture.pinned ? 'Unpin' : 'Pin to top',
        onPress: () => setCaptures(prev => {
          const next = prev.map(c => c.id === capture.id ? { ...c, pinned: !c.pinned } : c)
          persistCaptures(next)
          return next
        }),
      },
      {
        text: 'Add to Repo',
        onPress: () => setAddToMapCapture(capture),
      },
      {
        text: capture.isPublic ? 'Make Private' : 'Make Public',
        onPress: () => setCaptures(prev => {
          const next = prev.map(c => c.id === capture.id ? { ...c, isPublic: !c.isPublic } : c)
          persistCaptures(next)
          return next
        }),
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => setCaptures(prev => {
          const next = prev.filter(c => c.id !== capture.id)
          persistCaptures(next)
          return next
        }),
      },
      { text: 'Cancel', style: 'cancel' },
    ])
  }

  const handleNewCapture = (capture: Capture) => {
    setCaptures(prev => {
      const next = [capture, ...prev]
      persistCaptures(next)
      return next
    })
  }

  const filtered = captures.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase())
  )

  const groups = search ? null : groupCaptures(captures)

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>{userName || 'Builder'} ✦</Text>
          <Text style={styles.headerSub}>
            {profile ? `${profile.name}` : 'No project connected'}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/chat')}>
            <Ionicons name="chatbubble-ellipses-outline" size={20} color={Colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.captureBtn} onPress={() => setShowCapture(true)}>
            <Ionicons name="add" size={20} color={Colors.card} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Launch confidence card — always visible */}
      {!profile ? (
        <TouchableOpacity
          style={styles.launchCard}
          onPress={() => router.push('/onboarding')}
          activeOpacity={0.9}
        >
          <View style={styles.launchCardLeft}>
            <Text style={styles.launchCardLabel}>LAUNCH CONFIDENCE</Text>
            <Text style={styles.launchCardTitle}>Connect your project</Text>
            <Text style={styles.launchCardSub}>Get real-time launch risk analysis for your stack</Text>
          </View>
          <View style={styles.launchScoreCircle}>
            <Text style={styles.launchScoreNum}>?</Text>
          </View>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[styles.launchCard, openRisks > 0 ? styles.launchCardRisk : styles.launchCardGood]}
          onPress={() => router.push('/readiness')}
          activeOpacity={0.9}
        >
          <View style={styles.launchCardLeft}>
            <Text style={styles.launchCardLabel}>LAUNCH CONFIDENCE</Text>
            <Text style={styles.launchCardTitle}>
              {openRisks > 0 ? `${openRisks} risk${openRisks !== 1 ? 's' : ''} blocking launch` : 'Ready to ship'}
            </Text>
            <Text style={styles.launchCardSub}>
              {profile.name} · tap to see {openRisks > 0 ? 'fixes' : 'full report'}
            </Text>
          </View>
          <View style={[styles.launchScoreCircle, { borderColor: score >= 80 ? Colors.success : score >= 50 ? Colors.gold : Colors.error }]}>
            <Text style={[styles.launchScoreNum, { color: score >= 80 ? Colors.success : score >= 50 ? Colors.gold : Colors.error }]}>{score}</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Search */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={16} color={Colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search your knowledge..."
            placeholderTextColor={Colors.textSecondary}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/scan')}>
          <Ionicons name="scan-outline" size={20} color={Colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {search ? (
          <>
            <Text style={styles.sectionLabel}>
              {filtered.length} RESULT{filtered.length !== 1 ? 'S' : ''}
            </Text>
            {filtered.length === 0 ? (
              <View style={styles.empty}>
                <Ionicons name="search-outline" size={40} color={Colors.textTertiary} />
                <Text style={styles.emptyTitle}>No captures found</Text>
                <Text style={styles.emptyBody}>Try a different search term</Text>
              </View>
            ) : (
              filtered.map(capture => (
                <CaptureCard
                  key={capture.id}
                  capture={capture}
                  onStar={handleStar}
                  onPush={handlePush}
                  onShare={handleShare}
                  onLongPress={handleLongPress}
                />
              ))
            )}
          </>
        ) : groups && groups.length > 0 ? (
          groups.map(group => (
            <View key={group.label}>
              <View style={styles.groupHeader}>
                <Text style={styles.sectionLabel}>
                  {group.label === 'PINNED' ? '📌 PINNED' : group.label}
                </Text>
                {group.label !== 'PINNED' && (
                  <Text style={styles.seeAll}>See all</Text>
                )}
              </View>
              {group.items.map(capture => (
                <CaptureCard
                  key={capture.id}
                  capture={capture}
                  onStar={handleStar}
                  onPush={handlePush}
                  onShare={handleShare}
                  onLongPress={handleLongPress}
                />
              ))}
            </View>
          ))
        ) : (
          <View style={styles.empty}>
            <Ionicons name="book-outline" size={48} color={Colors.textTertiary} />
            <Text style={styles.emptyTitle}>No captures yet</Text>
            <Text style={styles.emptyBody}>Tap + to capture your first video or screenshot</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => setShowCapture(true)}>
              <Ionicons name="add" size={16} color={Colors.card} />
              <Text style={styles.emptyBtnText}>New Capture</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <CaptureModal
        visible={showCapture}
        onClose={() => setShowCapture(false)}
        onCapture={handleNewCapture}
      />
      <AddToMapSheet
        visible={!!addToMapCapture}
        captureId={addToMapCapture?.id ?? ''}
        captureTitle={addToMapCapture?.title ?? ''}
        onClose={() => setAddToMapCapture(null)}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.xs,
  },
  headerLeft: { flex: 1 },
  greeting: { fontSize: 22, fontWeight: '800', color: Colors.text },
  headerSub: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500', marginTop: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  iconBtn: {
    width: 36, height: 36, borderRadius: Radius.full,
    backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center',
    ...Shadow.card,
  },
  captureBtn: {
    width: 36, height: 36, borderRadius: Radius.full,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
    ...Shadow.card,
  },
  launchCard: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: Spacing.lg, marginTop: Spacing.sm, marginBottom: Spacing.xs,
    backgroundColor: Colors.primary, borderRadius: Radius.xl,
    padding: Spacing.lg, ...Shadow.card,
  },
  launchCardRisk: { backgroundColor: Colors.primary },
  launchCardGood: { backgroundColor: '#1A4D2E' },
  launchCardLeft: { flex: 1 },
  launchCardLabel: { fontSize: 9, fontWeight: '700', color: 'rgba(255,255,255,0.6)', letterSpacing: 1.2, marginBottom: 4 },
  launchCardTitle: { fontSize: 17, fontWeight: '800', color: '#fff', marginBottom: 3 },
  launchCardSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: '500' },
  launchScoreCircle: {
    width: 56, height: 56, borderRadius: 28, borderWidth: 3, borderColor: '#fff',
    alignItems: 'center', justifyContent: 'center', marginLeft: Spacing.md,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  launchScoreNum: { fontSize: 20, fontWeight: '800', color: '#fff' },
  searchRow: {
    flexDirection: 'row', paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm, gap: Spacing.sm, alignItems: 'center',
  },
  searchBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.card, borderRadius: Radius.full,
    paddingHorizontal: Spacing.md, paddingVertical: 10,
    gap: Spacing.sm, ...Shadow.card,
  },
  searchInput: { flex: 1, fontSize: 14, color: Colors.text },
  scroll: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl, paddingTop: Spacing.sm },
  groupHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: Spacing.sm, marginTop: Spacing.md,
  },
  sectionLabel: { ...Typography.sectionLabel, color: Colors.sectionLabel },
  seeAll: { ...Typography.caption, color: Colors.accent, fontWeight: '600' },
  empty: { alignItems: 'center', paddingTop: 60, gap: Spacing.md },
  emptyTitle: { ...Typography.cardTitle, color: Colors.text },
  emptyBody: {
    ...Typography.cardBody, color: Colors.textSecondary,
    textAlign: 'center', lineHeight: 22, paddingHorizontal: Spacing.xl,
  },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.primary, borderRadius: Radius.full,
    paddingHorizontal: Spacing.lg, paddingVertical: 10, marginTop: Spacing.sm,
  },
  emptyBtnText: { ...Typography.button, color: Colors.card, fontSize: 14 },
})
