import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useState, useCallback } from 'react'
import { useFocusEffect, useRouter } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Colors, Spacing, Radius, Shadow, Typography } from '../../constants/theme'
import type { Capture } from '../../components/CaptureCard'

const CAPTURES_KEY = 'grimoire:captures'

const CATEGORIES = ['All', 'Technical', 'Marketing', 'Launch', 'Pricing', 'Founder', 'Product']

const CATEGORY_ICON: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
  Technical: 'code-slash-outline',
  Marketing: 'megaphone-outline',
  Launch: 'rocket-outline',
  Pricing: 'cash-outline',
  Founder: 'person-outline',
  Product: 'bulb-outline',
}

const CATEGORY_COLOR: Record<string, string> = {
  technical: '#2A6EBB',
  marketing: '#BB5E2A',
  launch: '#2A9E6B',
  pricing: '#9E2A7A',
  founder: '#2A1B5E',
  product: '#5E7A2A',
}

export default function ExploreScreen() {
  const router = useRouter()
  const [captures, setCaptures] = useState<Capture[]>([])
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')

  useFocusEffect(useCallback(() => {
    AsyncStorage.getItem(CAPTURES_KEY).then(raw => {
      const all: Capture[] = raw ? JSON.parse(raw) : []
      setCaptures(all.filter(c => c.isPublic))
    })
  }, []))

  const filtered = captures.filter(c => {
    const matchesSearch = !search ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.creator.toLowerCase().includes(search.toLowerCase()) ||
      c.preview.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = activeCategory === 'All' ||
      c.category?.toLowerCase() === activeCategory.toLowerCase()
    return matchesSearch && matchesCategory
  })

  const hasCaptures = captures.length > 0

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.heading}>Community</Text>
          <Text style={styles.sub}>What builders are learning right now</Text>
        </View>
        <TouchableOpacity style={styles.shareBtn} onPress={() => router.push('/' as any)}>
          <Ionicons name="add" size={18} color={Colors.primary} />
          <Text style={styles.shareBtnText}>Share</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchRow}>
        <Ionicons name="search-outline" size={16} color={Colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search captures..."
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

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScroll}
        style={styles.filterRow}
      >
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat}
            style={[styles.filterChip, activeCategory === cat && styles.filterChipActive]}
            onPress={() => setActiveCategory(cat)}
          >
            {cat !== 'All' && CATEGORY_ICON[cat] && (
              <Ionicons
                name={CATEGORY_ICON[cat]}
                size={12}
                color={activeCategory === cat ? Colors.card : Colors.textSecondary}
              />
            )}
            <Text style={[styles.filterChipText, activeCategory === cat && styles.filterChipTextActive]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {!hasCaptures ? (
          <View style={styles.empty}>
            <View style={styles.emptyHero}>
              <Text style={styles.emptyHeroEmoji}>🏗️</Text>
              <Text style={styles.emptyTitle}>Be the first to share</Text>
              <Text style={styles.emptyBody}>
                Builders share what they're learning here. Open any capture, tap{' '}
                <Ionicons name="globe-outline" size={13} color={Colors.textSecondary} />
                {' '}to make it public — and it shows up for everyone building right now.
              </Text>
            </View>
            <View style={styles.communityHint}>
              <Ionicons name="people-outline" size={16} color={Colors.primary} />
              <Text style={styles.communityHintText}>
                The best apps get built faster when builders share what they know.
              </Text>
            </View>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No captures match</Text>
            <Text style={styles.emptyBody}>Try a different search or category.</Text>
          </View>
        ) : (
          <>
            {activeCategory === 'All' && !search && (
              <>
                <Text style={styles.sectionLabel}>🔥 TRENDING</Text>
                {[...filtered].sort((a, b) => b.stars - a.stars).slice(0, 2).map(capture => (
                  <ExploreCard
                    key={`t-${capture.id}`}
                    capture={capture}
                    onPress={() => router.push(`/capture/${capture.id}`)}
                    featured
                  />
                ))}
                <Text style={styles.sectionLabel}>ALL CAPTURES</Text>
              </>
            )}
            {filtered.map(capture => (
              <ExploreCard
                key={capture.id}
                capture={capture}
                onPress={() => router.push(`/capture/${capture.id}`)}
              />
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

function ExploreCard({ capture, onPress, featured }: { capture: Capture; onPress: () => void; featured?: boolean }) {
  const catColor = CATEGORY_COLOR[capture.category ?? ''] ?? Colors.accent
  const bullets = capture.preview
    .split('\n')
    .map(b => b.replace(/^[•\-→]\s*/, '').trim())
    .filter(Boolean)
    .slice(0, 3)

  return (
    <TouchableOpacity style={[styles.card, featured && styles.cardFeatured]} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.cardTop}>
        <View style={styles.cardMeta}>
          <View style={styles.metaRow}>
            <Ionicons name="play-circle-outline" size={13} color={Colors.accent} />
            <Text style={styles.metaPlatform}>{capture.platform} · {capture.creator}</Text>
            <Text style={styles.metaDate}>{capture.date}</Text>
          </View>
          {capture.category && (
            <View style={[styles.categoryChip, { backgroundColor: catColor + '18' }]}>
              <Text style={[styles.categoryText, { color: catColor }]}>
                {capture.category.toUpperCase()}
              </Text>
            </View>
          )}
        </View>
      </View>

      <Text style={styles.cardTitle} numberOfLines={2}>{capture.title}</Text>

      {bullets.map((b, i) => (
        <View key={i} style={styles.bulletRow}>
          <Text style={styles.bulletDot}>·</Text>
          <Text style={styles.bulletText} numberOfLines={2}>{b}</Text>
        </View>
      ))}

      <View style={styles.cardFooter}>
        <View style={styles.stat}>
          <Ionicons name="star" size={12} color={Colors.gold} />
          <Text style={styles.statText}>{capture.stars}</Text>
        </View>
        <Text style={styles.viewLink}>View capture →</Text>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.sm, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heading: { fontSize: 28, fontWeight: '800', color: Colors.text },
  sub: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  shareBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1.5, borderColor: Colors.primary, borderRadius: Radius.full,
    paddingHorizontal: 12, paddingVertical: 7,
  },
  shareBtnText: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    marginHorizontal: Spacing.lg, marginBottom: Spacing.sm,
    backgroundColor: Colors.card, borderRadius: Radius.full,
    paddingHorizontal: Spacing.md, paddingVertical: 10,
    ...Shadow.card,
  },
  searchInput: { flex: 1, fontSize: 14, color: Colors.text },
  filterRow: { marginVertical: Spacing.sm, height: 48 },
  filterScroll: { paddingHorizontal: Spacing.lg, gap: 8, paddingVertical: 6, alignItems: 'center' },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.card, height: 36,
  },
  filterChipActive: { backgroundColor: Colors.text, borderColor: Colors.text },
  filterChipText: { fontSize: 13, fontWeight: '600', color: Colors.text },
  filterChipTextActive: { color: Colors.card },
  scroll: { padding: Spacing.lg, paddingBottom: 40 },
  sectionLabel: { ...Typography.sectionLabel, color: Colors.sectionLabel, marginBottom: Spacing.md },
  empty: { alignItems: 'center', paddingTop: 40, gap: Spacing.md, paddingHorizontal: Spacing.xl },
  emptyHero: { alignItems: 'center', gap: Spacing.sm },
  emptyHeroEmoji: { fontSize: 48, marginBottom: Spacing.sm },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: Colors.text },
  emptyBody: { ...Typography.cardBody, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  communityHint: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: Colors.primary + '12', borderRadius: Radius.lg,
    padding: Spacing.md, marginTop: Spacing.md,
  },
  communityHintText: { ...Typography.caption, color: Colors.primary, flex: 1, lineHeight: 18, fontWeight: '600' },
  card: {
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    padding: Spacing.lg, marginBottom: Spacing.md, ...Shadow.card,
  },
  cardFeatured: {
    borderWidth: 1.5, borderColor: Colors.primary + '40',
    backgroundColor: Colors.primary + '08',
  },
  cardTop: { marginBottom: Spacing.xs },
  cardMeta: { gap: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaPlatform: { ...Typography.caption, color: Colors.textSecondary, flex: 1 },
  metaDate: { ...Typography.caption, color: Colors.textTertiary },
  categoryChip: {
    alignSelf: 'flex-start', borderRadius: Radius.full,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  categoryText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.8 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: Spacing.sm, lineHeight: 22 },
  bulletRow: { flexDirection: 'row', gap: 6, marginBottom: 4 },
  bulletDot: { color: Colors.accent, fontSize: 14, fontWeight: '700', lineHeight: 20 },
  bulletText: { ...Typography.caption, color: Colors.textSecondary, flex: 1, lineHeight: 20 },
  cardFooter: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: Spacing.sm, paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border,
  },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { ...Typography.caption, color: Colors.textSecondary },
  viewLink: { ...Typography.caption, color: Colors.primary, fontWeight: '600' },
})
