import {
  Modal, View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert,
} from 'react-native'
import { useEffect, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Ionicons } from '@expo/vector-icons'
import { Colors, Spacing, Radius, Shadow, Typography } from '../constants/theme'

const MAPS_KEY = 'grimoire:maps'

type MapSummary = {
  id: string
  title: string
  emoji: string
  count: number
  captureIds: string[]
}

type Props = {
  visible: boolean
  captureId: string
  captureTitle: string
  onClose: () => void
}

export function AddToMapSheet({ visible, captureId, captureTitle, onClose }: Props) {
  const [maps, setMaps] = useState<MapSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [addingId, setAddingId] = useState<string | null>(null)

  useEffect(() => {
    if (!visible) return
    setLoading(true)
    AsyncStorage.getItem(MAPS_KEY)
      .then(raw => setMaps(raw ? JSON.parse(raw) : []))
      .finally(() => setLoading(false))
  }, [visible])

  const handleAdd = async (map: MapSummary) => {
    if (map.captureIds?.includes(captureId)) return
    setAddingId(map.id)
    try {
      const raw = await AsyncStorage.getItem(MAPS_KEY)
      const all: any[] = raw ? JSON.parse(raw) : []
      const updated = all.map(m =>
        m.id === map.id
          ? { ...m, captureIds: [...(m.captureIds ?? []), captureId], count: (m.count ?? 0) + 1 }
          : m
      )
      await AsyncStorage.setItem(MAPS_KEY, JSON.stringify(updated))
      setMaps(prev => prev.map(m =>
        m.id === map.id
          ? { ...m, captureIds: [...(m.captureIds ?? []), captureId], count: m.count + 1 }
          : m
      ))
      Alert.alert('Added', `"${captureTitle}" added to ${map.emoji} ${map.title}`)
      onClose()
    } finally {
      setAddingId(null)
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen">
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.navRow}>
            <Text style={styles.heading}>Add to Repo</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={18} color={Colors.text} />
            </TouchableOpacity>
          </View>
          <Text style={styles.subtitle} numberOfLines={1}>"{captureTitle}"</Text>

          {loading ? (
            <ActivityIndicator color={Colors.primary} style={styles.loader} />
          ) : maps.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="albums-outline" size={36} color={Colors.textTertiary} />
              <Text style={styles.emptyTitle}>No repos yet</Text>
              <Text style={styles.emptyBody}>Create one in the Repo tab first.</Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} style={styles.list}>
              {maps.map(map => {
                const alreadyIn = map.captureIds?.includes(captureId)
                const isAdding = addingId === map.id
                return (
                  <TouchableOpacity
                    key={map.id}
                    style={[styles.row, alreadyIn && styles.rowDone]}
                    onPress={() => handleAdd(map)}
                    disabled={isAdding || alreadyIn}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.rowEmoji}>{map.emoji}</Text>
                    <View style={styles.rowInfo}>
                      <Text style={styles.rowTitle}>{map.title}</Text>
                      <Text style={styles.rowCount}>{map.count ?? 0} captures</Text>
                    </View>
                    {isAdding
                      ? <ActivityIndicator size="small" color={Colors.primary} />
                      : alreadyIn
                        ? <Ionicons name="checkmark-circle" size={22} color={Colors.success} />
                        : <Ionicons name="add-circle-outline" size={22} color={Colors.primary} />
                    }
                  </TouchableOpacity>
                )
              })}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: Spacing.xl, paddingBottom: 48, maxHeight: '75%',
  },
  handle: {
    width: 36, height: 4, backgroundColor: Colors.border,
    borderRadius: Radius.full, alignSelf: 'center', marginBottom: Spacing.lg,
  },
  navRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 4,
  },
  heading: { fontSize: 18, fontWeight: '700', color: Colors.text },
  closeBtn: {
    width: 32, height: 32, borderRadius: Radius.full,
    backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center',
  },
  subtitle: { ...Typography.caption, color: Colors.textSecondary, marginBottom: Spacing.lg },
  loader: { paddingVertical: 32 },
  empty: { alignItems: 'center', paddingVertical: 32, gap: Spacing.sm },
  emptyTitle: { ...Typography.cardTitle, color: Colors.text },
  emptyBody: { ...Typography.caption, color: Colors.textSecondary },
  list: { marginTop: Spacing.sm },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  rowDone: { opacity: 0.5 },
  rowEmoji: { fontSize: 28, lineHeight: 34 },
  rowInfo: { flex: 1 },
  rowTitle: { ...Typography.cardTitle, color: Colors.text },
  rowCount: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
})
