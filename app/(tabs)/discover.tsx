import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useState } from 'react'
import { Colors, Spacing, Radius, Shadow, Typography } from '../../constants/theme'

const TAGS = ['Launch', 'Monetization', 'Growth', 'Design', 'AI', 'Expo', 'React Native', 'Marketing']

const TRENDING = [
  { id: '1', title: 'The complete vibe coder launch playbook', author: '@buildmaster', stars: 1204, emoji: '🚀' },
  { id: '2', title: 'Pricing your app: from $0 to $29/month', author: '@saasfounder', stars: 891, emoji: '💰' },
  { id: '3', title: 'React Native vs Expo: which to pick in 2026', author: '@mobilepro', stars: 654, emoji: '📱' },
  { id: '4', title: 'How to get featured on the App Store', author: '@appleinsider', stars: 543, emoji: '⭐' },
  { id: '5', title: 'Building with AI: the vibe coder toolkit', author: '@aibuilder', stars: 432, emoji: '🤖' },
]

export default function DiscoverScreen() {
  const [search, setSearch] = useState('')
  const [activeTag, setActiveTag] = useState('Launch')

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.heading}>Discover</Text>
        <Text style={styles.sub}>Knowledge maps from the community</Text>
      </View>

      <View style={styles.searchRow}>
        <Ionicons name="search-outline" size={16} color={Colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search maps, topics, creators..."
          placeholderTextColor={Colors.textSecondary}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tagScroll}
        style={styles.tagRow}
      >
        {TAGS.map(tag => (
          <TouchableOpacity
            key={tag}
            style={[styles.tag, activeTag === tag && styles.tagActive]}
            onPress={() => setActiveTag(tag)}
          >
            <Text style={[styles.tagText, activeTag === tag && styles.tagTextActive]}>{tag}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>TRENDING MAPS</Text>

        {TRENDING.map((item, i) => (
          <TouchableOpacity key={item.id} style={styles.card} activeOpacity={0.85}>
            <View style={styles.rank}>
              <Text style={styles.rankNum}>{i + 1}</Text>
            </View>
            <Text style={styles.emoji}>{item.emoji}</Text>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
              <View style={styles.cardMeta}>
                <Text style={styles.author}>{item.author}</Text>
                <View style={styles.starRow}>
                  <Ionicons name="star" size={12} color={Colors.gold} />
                  <Text style={styles.stars}>{item.stars.toLocaleString()}</Text>
                </View>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  heading: { fontSize: 24, fontWeight: '700', color: Colors.text },
  sub: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.md,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    gap: Spacing.sm,
    ...Shadow.card,
  },
  searchInput: { flex: 1, fontSize: 14, color: Colors.text },
  tagRow: { maxHeight: 48 },
  tagScroll: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    paddingBottom: 4,
  },
  tag: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.card,
    ...Shadow.card,
  },
  tagActive: { backgroundColor: Colors.primary },
  tagText: { ...Typography.caption, color: Colors.textSecondary, fontWeight: '500' },
  tagTextActive: { color: Colors.card, fontWeight: '600' },
  scroll: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: 40 },
  sectionLabel: { ...Typography.sectionLabel, color: Colors.sectionLabel, marginBottom: Spacing.md },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
    ...Shadow.card,
  },
  rank: {
    width: 24,
    alignItems: 'center',
  },
  rankNum: { fontSize: 13, fontWeight: '700', color: Colors.textTertiary },
  emoji: { fontSize: 24 },
  cardContent: { flex: 1 },
  cardTitle: { ...Typography.cardBody, color: Colors.text, fontWeight: '600', marginBottom: 4 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  author: { ...Typography.caption, color: Colors.textSecondary },
  starRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  stars: { ...Typography.caption, color: Colors.textSecondary },
})
