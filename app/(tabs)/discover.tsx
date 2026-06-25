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
        <Text style={styles.heading}>Explore</Text>
        <Text style={styles.sub}>Your public knowledge library</Text>
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
            <Ionicons name="globe-outline" size={48} color={Colors.textTertiary} />
            <Text style={styles.emptyTitle}>Nothing public yet</Text>
            <Text style={styles.emptyBody}>
              Open any capture and tap the{' '}
              <Ionicons name="globe-outline" size={13} color={Colors.textSecondary} />
              {' '}icon to make it public. It'll appear here.
            </Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No captures match</Text>
            <Text style={styles.emptyBody}>Try a different search or category.</Text>
          </View>
        ) : (
          <>
            <Text style={styles.sectionLabel}>{filtered.length} PUBLIC CAPTURE{filtered.length !== 1 ? 'S' : ''}</Text>
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

function ExploreCard({ capture, onPress }: { capture: Capture; onPress: () => void }) {
  const catColor = CATEGORY_COLOR[capture.category ?? ''] ?? Colors.accent
  const bullets = capture.preview
    .split('\n')
    .map(b => b.replace(/^[•\-→]\s*/, '').trim())
    .filter(Boolean)
    .slice(0, 3)

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
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
  header: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.sm },
  heading: { fontSize: 28, fontWeight: '800', color: Colors.text },
  sub: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
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
  empty: { alignItems: 'center', paddingTop: 60, gap: Spacing.md, paddingHorizontal: Spacing.xl },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: Colors.text },
  emptyBody: { ...Typography.cardBody, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  card: {
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    padding: Spacing.lg, marginBottom: Spacing.md, ...Shadow.card,
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
