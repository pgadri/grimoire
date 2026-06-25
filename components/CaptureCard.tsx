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
}

type Props = {
  capture: Capture
  onStar?: (id: string) => void
  onPush?: (id: string) => void
}

const sourceIcon = (type: Capture['sourceType']) => {
  if (type === 'video') return 'play-circle-outline'
  if (type === 'image') return 'image-outline'
  return 'camera-outline'
}

export default function CaptureCard({ capture, onStar, onPush }: Props) {
  const router = useRouter()

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/capture/${capture.id}`)}
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

      <Text style={styles.preview} numberOfLines={3}>{capture.preview}</Text>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.footerBtn} onPress={() => onStar?.(capture.id)}>
          <Ionicons
            name={capture.starred ? 'star' : 'star-outline'}
            size={16}
            color={capture.starred ? Colors.gold : Colors.textSecondary}
          />
          <Text style={styles.footerCount}>{capture.stars}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.footerBtn} onPress={() => onPush?.(capture.id)}>
          <Ionicons
            name={capture.pushed ? 'checkmark-circle' : 'cloud-upload-outline'}
            size={16}
            color={capture.pushed ? Colors.success : Colors.textSecondary}
          />
          <Text style={styles.footerCount}>{capture.pushed ? 'Saved' : 'Push'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.footerBtn}>
          <Ionicons name="share-outline" size={16} color={Colors.textSecondary} />
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    flex: 1,
  },
  platform: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  publicBadge: {
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  publicText: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 0.8,
  },
  date: {
    ...Typography.caption,
    color: Colors.textTertiary,
  },
  title: {
    ...Typography.cardTitle,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  preview: {
    ...Typography.cardBody,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  footerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  footerCount: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
})
