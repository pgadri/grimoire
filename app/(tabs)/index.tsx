import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, TextInput, RefreshControl,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { Colors, Spacing, Radius, Typography, Shadow } from '../../constants/theme'
import CaptureCard, { Capture } from '../../components/CaptureCard'

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
    preview: '• Launch to your existing network first — DMs convert 10x better than posts\n• Your first 10 users should be people who already trust you\n• Don\'t announce, infiltrate',
  },
  {
    id: '2',
    title: 'Pricing strategy for your first app — why free is a trap',
    sourceUrl: 'https://youtube.com/watch?v=xyz',
    sourceType: 'video',
    creator: '@buildwithme',
    platform: 'YouTube',
    date: 'Jun 23',
    stars: 89,
    starred: true,
    isPublic: false,
    pushed: true,
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
    preview: '• Use keywords in subtitle, not just title\n• First 3 screenshots must show core value\n• Localize at minimum for US + UK + AU',
  },
]

export default function FeedScreen() {
  const router = useRouter()
  const [captures, setCaptures] = useState(MOCK_CAPTURES)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')

  const onRefresh = () => {
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 1000)
  }

  const handleStar = (id: string) => {
    setCaptures(prev =>
      prev.map(c =>
        c.id === id
          ? { ...c, starred: !c.starred, stars: c.starred ? c.stars - 1 : c.stars + 1 }
          : c
      )
    )
  }

  const handlePush = (id: string) => {
    setCaptures(prev =>
      prev.map(c => c.id === id ? { ...c, pushed: true } : c)
    )
  }

  const filtered = captures.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good morning,</Text>
          <Text style={styles.name}>Pericles. <Text style={styles.sparkle}>✦</Text></Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/connectors')}>
            <Ionicons name="flash-outline" size={20} color={Colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="notifications-outline" size={20} color={Colors.text} />
          </TouchableOpacity>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>P</Text>
          </View>
        </View>
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={16} color={Colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search your grimoire..."
            placeholderTextColor={Colors.textSecondary}
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <TouchableOpacity style={styles.captureBtn}>
          <Ionicons name="add" size={20} color={Colors.card} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        <Text style={styles.sectionLabel}>YOUR CAPTURES</Text>

        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="book-outline" size={48} color={Colors.textTertiary} />
            <Text style={styles.emptyTitle}>No captures yet</Text>
            <Text style={styles.emptyBody}>Share a video or screenshot to add your first spell</Text>
          </View>
        ) : (
          filtered.map(capture => (
            <CaptureCard
              key={capture.id}
              capture={capture}
              onStar={handleStar}
              onPush={handlePush}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  greeting: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '400',
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
  },
  sparkle: {
    color: Colors.accent,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.card,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: Colors.card,
    fontWeight: '700',
    fontSize: 15,
  },
  searchRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
    alignItems: 'center',
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    gap: Spacing.sm,
    ...Shadow.card,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
  },
  captureBtn: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.card,
  },
  scroll: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  sectionLabel: {
    ...Typography.sectionLabel,
    color: Colors.sectionLabel,
    marginBottom: Spacing.md,
    marginTop: Spacing.xs,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 60,
    gap: Spacing.md,
  },
  emptyTitle: {
    ...Typography.cardTitle,
    color: Colors.text,
  },
  emptyBody: {
    ...Typography.cardBody,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: Spacing.xl,
  },
})
