import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { Colors, Spacing, Radius, Shadow, Typography } from '../constants/theme'

export type Capture = {
  id: string
  title: string
  sourceUrl: string
  sourceType: 'video' | 'image' | 'camera'
  creator: string
  platform: string
  date: string
  stars: number
  starred: boolean
  isPublic: boolean
  preview: string
  pushed: boolean
  pinned: boolean
  concepts?: string[]
  actions?: string[]
  quotes?: string[]
  transcript?: string
  category?: string
}

type Props = {
  capture: Capture
  onStar?: (id: string) => void
  onPush?: (id: string) => void
  onShare?: (capture: Capture) => void
  onLongPress?: (capture: Capture) => void
}

const sourceIcon = (type: Capture['sourceType']) => {
  if (type === 'video') return 'play-circle-outline'
  if (type === 'image') return 'image-outline'
  return 'camera-outline'
}

const CATEGORY_COLOR: Record<string, string> = {
  technical: '#2A6EBB',
  marketing: '#BB5E2A',
  launch:    '#2A9E6B',
  pricing:   '#9E2A7A',
  founder:   '#2A1B5E',
  product:   '#5E7A2A',
}

export default function CaptureCard({ capture, onStar, onPush, onShare, onLongPress }: Props) {
  const router = useRouter()

  return (
    <TouchableOpacity
      style={[styles.card, capture.pinned && styles.cardPinned]}
      onPress={() => router.push(`/capture/${capture.id}`)}
      onLongPress={() => onLongPress?.(capture)}
      delayLongPress={400}
      activeOpacity={0.85}
    >
      <View style={styles.header}>
        <View style={styles.sourceRow}>
          <Ionicons name={sourceIcon(capture.sourceType)} size={14} color={Colors.accent} />
          <Text style={styles.platform}>{capture.platform} · {capture.creator}</Text>
          {capture.isPublic && (
            <View style={styles.publicBadge}>
              <Text style={styles.publicText}>PUBLIC</Text>
            </View>
          )}
        </View>
        <Text style={styles.date}>{capture.date}</Text>
      </View>

      <Text style={styles.title} numberOfLines={2}>{capture.title}</Text>
      {capture.category && (
        <View style={[styles.categoryChip, { backgroundColor: (CATEGORY_COLOR[capture.category] ?? Colors.accent) + '18' }]}>
          <Text style={[styles.categoryText, { color: CATEGORY_COLOR[capture.category] ?? Colors.accent }]}>
            {capture.category.toUpperCase()}
          </Text>
        </View>
      )}
      <Text style={styles.preview} numberOfLines={3}>{capture.preview}</Text>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.footerBtn}
          onPress={() => onStar?.(capture.id)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons
            name={capture.starred ? 'star' : 'star-outline'}
            size={16}
            color={capture.starred ? Colors.gold : Colors.textSecondary}
          />
          <Text style={styles.footerCount}>{capture.stars}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.footerBtn}
          onPress={() => onPush?.(capture.id)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons
            name={capture.pushed ? 'checkmark-circle' : 'cloud-upload-outline'}
            size={16}
            color={capture.pushed ? Colors.success : Colors.textSecondary}
          />
          <Text style={[styles.footerCount, capture.pushed && styles.pushedText]}>
            {capture.pushed ? 'Saved' : 'Push'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.footerBtn}
          onPress={() => onShare?.(capture)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="share-outline" size={16} color={Colors.textSecondary} />
          <Text style={styles.footerCount}>Share</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadow.card,
  },
  cardPinned: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sourceRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, flex: 1,
  },
  platform: { ...Typography.caption, color: Colors.textSecondary },
  publicBadge: {
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: Radius.full,
  },
  publicText: { fontSize: 9, fontWeight: '700', color: Colors.primary, letterSpacing: 0.8 },
  date: { ...Typography.caption, color: Colors.textTertiary },
  title: { ...Typography.cardTitle, color: Colors.text, marginBottom: Spacing.sm },
  preview: {
    ...Typography.cardBody, color: Colors.textSecondary,
    lineHeight: 20, marginBottom: Spacing.md,
  },
  footer: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.lg,
    paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border,
  },
  footerBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  footerCount: { ...Typography.caption, color: Colors.textSecondary },
  pushedText: { color: Colors.success },
  categoryChip: {
    alignSelf: 'flex-start', borderRadius: Radius.full,
    paddingHorizontal: 8, paddingVertical: 3, marginBottom: Spacing.sm,
  },
  categoryText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.8 },
})
