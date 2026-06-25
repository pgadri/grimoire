import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { Colors, Spacing, Radius, Shadow, Typography } from '../../constants/theme'

type MapItem = {
  id: string
  title: string
  description: string
  count: number
  stars: number
  remixes: number
  isPublic: boolean
  emoji: string
}

const MOCK_MAPS: MapItem[] = [
  {
    id: '1',
    title: 'How to Launch an App',
    description: 'Everything I\'ve captured about getting from 0 to first users',
    count: 23,
    stars: 891,
    remixes: 124,
    isPublic: true,
    emoji: '🚀',
  },
  {
    id: '2',
    title: 'Monetization Tactics',
    description: 'Pricing strategies, paywall design, and revenue models that work',
    count: 14,
    stars: 445,
    remixes: 67,
    isPublic: true,
    emoji: '💰',
  },
  {
    id: '3',
    title: 'My Private Notes',
    description: 'Raw captures I\'m still processing',
    count: 41,
    stars: 0,
    remixes: 0,
    isPublic: false,
    emoji: '🔒',
  },
]

export default function MapsScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.heading}>Maps</Text>
          <Text style={styles.sub}>Your curated knowledge collections</Text>
        </View>
        <TouchableOpacity style={styles.newBtn}>
          <Ionicons name="add" size={18} color={Colors.card} />
          <Text style={styles.newBtnText}>New Map</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>YOUR MAPS</Text>

        {MOCK_MAPS.map(map => (
          <TouchableOpacity key={map.id} style={styles.card} activeOpacity={0.85}>
            <View style={styles.cardHeader}>
              <Text style={styles.emoji}>{map.emoji}</Text>
              <View style={styles.cardMeta}>
                <Text style={styles.cardTitle}>{map.title}</Text>
                <Text style={styles.cardDesc} numberOfLines={2}>{map.description}</Text>
              </View>
              <View style={[styles.badge, map.isPublic ? styles.badgePublic : styles.badgePrivate]}>
                <Text style={[styles.badgeText, map.isPublic ? styles.badgeTextPublic : styles.badgeTextPrivate]}>
                  {map.isPublic ? 'PUBLIC' : 'PRIVATE'}
                </Text>
              </View>
            </View>

            <View style={styles.cardFooter}>
              <View style={styles.stat}>
                <Ionicons name="book-outline" size={13} color={Colors.textSecondary} />
                <Text style={styles.statText}>{map.count} captures</Text>
              </View>
              {map.isPublic && (
                <>
                  <View style={styles.stat}>
                    <Ionicons name="star-outline" size={13} color={Colors.textSecondary} />
                    <Text style={styles.statText}>{map.stars}</Text>
                  </View>
                  <View style={styles.stat}>
                    <Ionicons name="git-branch-outline" size={13} color={Colors.textSecondary} />
                    <Text style={styles.statText}>{map.remixes} remixes</Text>
                  </View>
                </>
              )}
              <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} style={styles.chevron} />
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
  },
  heading: { fontSize: 24, fontWeight: '700', color: Colors.text },
  sub: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
  },
  newBtnText: { ...Typography.button, color: Colors.card, fontSize: 13 },
  scroll: { paddingHorizontal: Spacing.lg, paddingBottom: 40 },
  sectionLabel: { ...Typography.sectionLabel, color: Colors.sectionLabel, marginBottom: Spacing.md },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadow.card,
  },
  cardHeader: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.md },
  emoji: { fontSize: 32, lineHeight: 40 },
  cardMeta: { flex: 1 },
  cardTitle: { ...Typography.cardTitle, color: Colors.text, marginBottom: 4 },
  cardDesc: { ...Typography.cardBody, color: Colors.textSecondary, lineHeight: 20 },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  badgePublic: { backgroundColor: Colors.primary + '15' },
  badgePrivate: { backgroundColor: Colors.border },
  badgeText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.8 },
  badgeTextPublic: { color: Colors.primary },
  badgeTextPrivate: { color: Colors.textSecondary },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { ...Typography.caption, color: Colors.textSecondary },
  chevron: { marginLeft: 'auto' },
})
