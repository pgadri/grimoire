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
import { SEED_CAPTURES } from '../../lib/seeds'
import { getUser } from '../../lib/auth'
import { syncPublicCapture, unsyncPublicCapture } from '../../lib/community'
import { checkCaptureLimit, limitMessage } from '../../lib/limits'
import * as StoreReview from 'expo-store-review'

const CAPTURES_KEY = 'grimoire:captures'
const REVIEW_ASKED_KEY = 'grimoire:reviewAsked'


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

type FeedTab = 'all' | 'following'

export default function FeedScreen() {
  const [captures, setCaptures] = useState<Capture[]>(SEED_CAPTURES)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [feedTab, setFeedTab] = useState<FeedTab>('all')
  const router = useRouter()
  const [showCapture, setShowCapture] = useState(false)
  const [addToMapCapture, setAddToMapCapture] = useState<Capture | null>(null)
  const [userName, setUserName] = useState('')

  const persistCaptures = async (updated: Capture[]) => {
    try { await AsyncStorage.setItem(CAPTURES_KEY, JSON.stringify(updated)) } catch {}
  }

  useFocusEffect(useCallback(() => {
    let active = true
    const load = async () => {
      getUser().then(u => { if (active && u) setUserName(u.name.split(' ')[0]) })
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
      if (!active) return
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
      const capture = prev.find(c => c.id === id)
      const becomingPublic = capture ? !capture.isPublic : false
      const next = prev.map(c => c.id === id ? { ...c, pushed: becomingPublic, isPublic: becomingPublic } : c)
      persistCaptures(next)
      if (capture) {
        if (becomingPublic) {
          syncPublicCapture({
            clientId: id,
            title: capture.title,
            preview: capture.preview,
            category: capture.category,
            sourceType: capture.sourceType,
            platform: capture.platform,
            creator: capture.creator,
            sourceUrl: capture.sourceUrl,
            authorName: capture.creator,
          })
        } else {
          unsyncPublicCapture(id)
        }
      }
      return next
    })
  }

  const handleShare = async (capture: Capture) => {
    await Share.share({
      title: capture.title,
      message: `${capture.title}\n\n${capture.preview}\n\nShared from Vibecoded`,
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
        text: capture.isPublic ? 'Make Private' : 'Publish to Community',
        onPress: () => handlePush(capture.id),
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

  const handleNewCapture = async (capture: Capture) => {
    const limitResult = await checkCaptureLimit()
    if (limitResult.blocked) {
      Alert.alert('Capture limit reached', limitMessage(limitResult), [
        { text: 'Upgrade', onPress: () => router.push('/paywall' as any) },
        { text: 'Cancel', style: 'cancel' },
      ])
      return
    }
    setCaptures(prev => {
      const next = [capture, ...prev]
      persistCaptures(next)
      return next
    })
    // Prompt for review on first real capture (not seed), once per install
    try {
      const asked = await AsyncStorage.getItem(REVIEW_ASKED_KEY)
      if (!asked && await StoreReview.isAvailableAsync()) {
        await AsyncStorage.setItem(REVIEW_ASKED_KEY, 'true')
        await StoreReview.requestReview()
      }
    } catch {}
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
            Your captures
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

      {/* Feed tabs */}
      <View style={styles.feedTabs}>
        {(['all', 'following'] as FeedTab[]).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.feedTab, feedTab === tab && styles.feedTabActive]}
            onPress={() => setFeedTab(tab)}
          >
            <Text style={[styles.feedTabText, feedTab === tab && styles.feedTabTextActive]}>
              {tab === 'all' ? 'All' : 'Following'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

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
        {feedTab === 'following' && !search ? (
          <>
            <View style={styles.followingHeader}>
              <Text style={styles.sectionLabel}>✦ FROM VIBECODED</Text>
              <Text style={styles.followingNote}>You follow @vibecoded by default</Text>
            </View>
            {SEED_CAPTURES.filter(c => c.isPublic).map(capture => (
              <CaptureCard
                key={capture.id}
                capture={capture}
                onStar={handleStar}
                onPush={handlePush}
                onShare={handleShare}
                onLongPress={handleLongPress}
              />
            ))}
            <TouchableOpacity
              style={styles.emptyAction}
              onPress={() => router.push('/(tabs)/discover' as any)}
            >
              <Text style={styles.emptyActionText}>Find more builders to follow →</Text>
            </TouchableOpacity>
          </>
        ) : search ? (
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
            <Text style={{ fontSize: 40, marginBottom: Spacing.sm }}>✦</Text>
            <Text style={styles.emptyTitle}>Start your knowledge base</Text>
            <Text style={styles.emptyBody}>
              Paste a video URL, upload a screenshot, or describe a concept — Vibecoded extracts the insights and turns them into prompts you can feed straight into your AI coding tool.
            </Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => setShowCapture(true)}>
              <Ionicons name="add" size={16} color={Colors.card} />
              <Text style={styles.emptyBtnText}>First capture</Text>
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
  feedTabs: {
    flexDirection: 'row', paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, gap: Spacing.sm,
  },
  feedTab: {
    paddingHorizontal: Spacing.lg, paddingVertical: 8,
    borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.card,
  },
  feedTabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  feedTabText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  feedTabTextActive: { color: '#fff' },

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
  followingHeader: { marginBottom: Spacing.sm, gap: 3 },
  followingNote: { fontSize: 11, color: Colors.textTertiary, fontWeight: '500' },
  emptyAction: {
    backgroundColor: Colors.primary, borderRadius: Radius.full,
    paddingHorizontal: Spacing.xl, paddingVertical: 11, marginTop: Spacing.lg,
    alignSelf: 'center',
  },
  emptyActionText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.primary, borderRadius: Radius.full,
    paddingHorizontal: Spacing.lg, paddingVertical: 10, marginTop: Spacing.sm,
  },
  emptyBtnText: { ...Typography.button, color: Colors.card, fontSize: 14 },
})
