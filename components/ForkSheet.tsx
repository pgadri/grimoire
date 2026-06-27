import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors, Spacing, Radius, Shadow, Typography } from '../constants/theme'

export type ForkTarget = {
  id: string
  title: string
  authorHandle: string
  emoji?: string
  captureCount?: number
}

type Props = {
  visible: boolean
  target: ForkTarget | null
  onFork: (destination: 'personal' | 'team') => void
  onClose: () => void
}

export function ForkSheet({ visible, target, onFork, onClose }: Props) {
  if (!target) return null

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen">
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <Text style={styles.targetEmoji}>{target.emoji ?? '🗺️'}</Text>
            <View style={styles.headerText}>
              <Text style={styles.heading}>Fork this map</Text>
              <Text style={styles.sub} numberOfLines={1}>{target.title}</Text>
              <Text style={styles.author}>by {target.authorHandle}</Text>
            </View>
          </View>

          <Text style={styles.sectionLabel}>FORK TO</Text>

          <TouchableOpacity style={styles.option} onPress={() => onFork('personal')} activeOpacity={0.8}>
            <View style={[styles.optionIcon, { backgroundColor: Colors.primary + '18' }]}>
              <Ionicons name="person-outline" size={20} color={Colors.primary} />
            </View>
            <View style={styles.optionText}>
              <Text style={styles.optionTitle}>My Maps</Text>
              <Text style={styles.optionSub}>Your personal Vibecoded workspace</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.option} onPress={() => onFork('team')} activeOpacity={0.8}>
            <View style={[styles.optionIcon, { backgroundColor: Colors.success + '18' }]}>
              <Ionicons name="people-outline" size={20} color={Colors.success} />
            </View>
            <View style={styles.optionText}>
              <Text style={styles.optionTitle}>Vibe Builders</Text>
              <Text style={styles.optionSub}>Shared team workspace · Pro plan</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} />
          </TouchableOpacity>

          <View style={styles.infoRow}>
            <Ionicons name="information-circle-outline" size={14} color={Colors.textTertiary} />
            <Text style={styles.infoText}>
              Forking creates an editable copy in your workspace. Attribution stays on your map.
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: Colors.overlay },
  sheet: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing.xl,
    paddingBottom: 48,
  },
  handle: {
    width: 36, height: 4, backgroundColor: Colors.border,
    borderRadius: Radius.full, alignSelf: 'center', marginBottom: Spacing.xl,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    marginBottom: Spacing.xl,
    padding: Spacing.md,
    backgroundColor: Colors.background, borderRadius: Radius.md,
  },
  targetEmoji: { fontSize: 32, lineHeight: 38 },
  headerText: { flex: 1 },
  heading: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary, letterSpacing: 0.3, marginBottom: 2 },
  sub: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 2 },
  author: { ...Typography.caption, color: Colors.textSecondary },
  sectionLabel: { ...Typography.sectionLabel, color: Colors.sectionLabel, marginBottom: Spacing.md },
  option: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  optionIcon: { width: 40, height: 40, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  optionText: { flex: 1 },
  optionTitle: { fontSize: 15, fontWeight: '600', color: Colors.text, marginBottom: 2 },
  optionSub: { ...Typography.caption, color: Colors.textSecondary },
  infoRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 6,
    marginTop: Spacing.lg,
    padding: Spacing.md,
    backgroundColor: Colors.background, borderRadius: Radius.sm,
  },
  infoText: { ...Typography.caption, color: Colors.textSecondary, flex: 1, lineHeight: 18 },
})
