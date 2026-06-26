import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, TextInput, Switch, Alert, ActivityIndicator, Linking,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useState, useCallback } from 'react'
import { useFocusEffect } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Colors, Spacing, Radius, Shadow, Typography } from '../../constants/theme'
import { PacketPrice, formatPrice, creatorEarnings, PLATFORM_CUT } from '../../lib/marketplace'
import { getForks, markSynced, ForkRecord } from '../../lib/forks'
import { pushMapToGithub } from '../../lib/api'

type MapItem = {
  id: string
  title: string
  description: string
  count: number
  stars: number
  remixes: number
  isPublic: boolean
  emoji: string
  price: PacketPrice
  earnings: number
  captureIds: string[]
}

const EMOJI_OPTIONS = ['🚀', '💰', '🔐', '🤖', '🏗️', '📱', '🎨', '📚', '⚡', '🌐']
const MAPS_STORAGE_KEY = 'grimoire:maps'

const INITIAL_MAPS: MapItem[] = [
  {
    id: '1',
    title: 'How to Launch an App',
    description: "Everything I've captured about getting from 0 to first users",
    count: 23, stars: 891, remixes: 124, isPublic: true,
    emoji: '🚀', price: { type: 'free' }, earnings: 0, captureIds: [],
  },
  {
    id: '2',
    title: 'Monetization Tactics',
    description: 'Pricing strategies, paywall design, and revenue models that work',
    count: 14, stars: 445, remixes: 67, isPublic: true,
    emoji: '💰', price: { type: 'paid', amount: 9.99 }, earnings: 127.47, captureIds: [],
  },
  {
    id: '3',
    title: 'My Private Notes',
    description: "Raw captures I'm still processing",
    count: 41, stars: 0, remixes: 0, isPublic: false,
    emoji: '🔒', price: { type: 'free' }, earnings: 0, captureIds: [],
  },
]

export default function MapsScreen() {
  const [maps, setMaps] = useState<MapItem[]>(INITIAL_MAPS)
  const [forkRecords, setForkRecords] = useState<Record<string, ForkRecord>>({})
  const [showCreate, setShowCreate] = useState(false)
  const [syncingId, setSyncingId] = useState<string | null>(null)
  const [pushingId, setPushingId] = useState<string | null>(null)

  useFocusEffect(useCallback(() => {
    const load = async () => {
      try {
        const raw = await AsyncStorage.getItem(MAPS_STORAGE_KEY)
        if (raw) {
          const saved = JSON.parse(raw)
          if (Array.isArray(saved) && saved.length > 0) setMaps(saved)
        } else {
          await AsyncStorage.setItem(MAPS_STORAGE_KEY, JSON.stringify(INITIAL_MAPS))
        }
      } catch {}

      try {
        const records = await getForks()
        const byId: Record<string, ForkRecord> = {}
        records.forEach(r => { byId[r.localId] = r })
        setForkRecords(byId)
      } catch {}
    }
    load()
  }, []))

  const persistMaps = async (updated: MapItem[]) => {
    try {
      await AsyncStorage.setItem(MAPS_STORAGE_KEY, JSON.stringify(updated))
    } catch {}
  }

  const handleSync = async (mapId: string, originalAuthor: string) => {
    setSyncingId(mapId)
    await new Promise(r => setTimeout(r, 1500))
    await markSynced(mapId)
    setForkRecords(prev => ({
      ...prev,
      [mapId]: { ...prev[mapId], lastSyncedAt: new Date().toISOString(), newCapturesAvailable: 0 },
    }))
    setSyncingId(null)
    Alert.alert('Synced', `2 new captures pulled from ${originalAuthor}'s map.`)
  }

  const handlePushToGithub = async (map: MapItem) => {
    setPushingId(map.id)
    try {
      const result = await pushMapToGithub({
        title: map.title,
        description: map.description,
        emoji: map.emoji,
        captureCount: map.count,
        forkedFrom: forkRecords[map.id]?.originalAuthor,
      })
      Alert.alert(
        'Pushed to GitHub',
        `Map published successfully.`,
        [
          { text: 'Open', onPress: () => Linking.openURL(result.url) },
          { text: 'Done' },
        ]
      )
    } catch {
      Alert.alert('Push failed', 'Connect GitHub in Settings → Connectors first.')
    } finally {
      setPushingId(null)
    }
  }

  const totalEarnings = maps.reduce((sum, m) => sum + m.earnings, 0)

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.heading}>Repos</Text>
          <Text style={styles.sub}>Your knowledge repos</Text>
        </View>
        <TouchableOpacity style={styles.newBtn} onPress={() => setShowCreate(true)}>
          <Ionicons name="add" size={18} color={Colors.card} />
          <Text style={styles.newBtnText}>New Repo</Text>
        </TouchableOpacity>
      </View>

{/* earnings banner: shown when monetization launches */}

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>YOUR REPOS · {maps.length}</Text>

        {maps.map(map => (
          <MapCard
            key={map.id}
            map={map}
            forkRecord={forkRecords[map.id]}
            isSyncing={syncingId === map.id}
            isPushing={pushingId === map.id}
            onSync={() => handleSync(map.id, forkRecords[map.id]?.originalAuthor ?? 'creator')}
            onPushToGithub={() => handlePushToGithub(map)}
          />
        ))}
      </ScrollView>

      <CreateMapModal
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        onCreate={(newMap) => {
          const updated = [...maps, { ...newMap, id: Date.now().toString(), stars: 0, remixes: 0, earnings: 0 }]
          setMaps(updated)
          persistMaps(updated)
          setShowCreate(false)
        }}
      />
    </SafeAreaView>
  )
}

type MapCardProps = {
  map: MapItem
  forkRecord?: ForkRecord
  isSyncing: boolean
  isPushing: boolean
  onSync: () => void
  onPushToGithub: () => void
}

function MapCard({ map, forkRecord, isSyncing, isPushing, onSync, onPushToGithub }: MapCardProps) {
  const isPaid = map.price.type === 'paid'
  const router = useRouter()
  const handlePress = () => router.push(`/map/${map.id}`)

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={handlePress}>
      <View style={styles.cardHeader}>
        <Text style={styles.emoji}>{map.emoji}</Text>
        <View style={styles.cardMeta}>
          <Text style={styles.cardTitle}>{map.title}</Text>
          {forkRecord && (
            <View style={styles.forkRow}>
              <Text style={styles.forkAttribution}>
                🍴 Forked from {forkRecord.originalAuthor}
              </Text>
              {forkRecord.newCapturesAvailable > 0 && (
                <View style={styles.updatesDot}>
                  <Text style={styles.updatesDotText}>{forkRecord.newCapturesAvailable}</Text>
                </View>
              )}
            </View>
          )}
          <Text style={styles.cardDesc} numberOfLines={2}>{map.description}</Text>
        </View>
        <View style={styles.badgeCol}>
          <View style={[styles.badge, map.isPublic ? styles.badgePublic : styles.badgePrivate]}>
            <Text style={[styles.badgeText, map.isPublic ? styles.badgeTextPublic : styles.badgeTextPrivate]}>
              {map.isPublic ? 'PUBLIC' : 'PRIVATE'}
            </Text>
          </View>
          {map.isPublic && (
            <View style={[styles.badge, isPaid ? styles.badgePaid : styles.badgeFree]}>
              <Text style={[styles.badgeText, isPaid ? styles.badgeTextPaid : styles.badgeTextFree]}>
                {formatPrice(map.price).toUpperCase()}
              </Text>
            </View>
          )}
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
              <Text style={styles.statText}>{map.stars.toLocaleString()}</Text>
            </View>
            <View style={styles.stat}>
              <Ionicons name="git-branch-outline" size={13} color={Colors.textSecondary} />
              <Text style={styles.statText}>{map.remixes} forks</Text>
            </View>
          </>
        )}
        {map.earnings > 0 && (
          <View style={styles.stat}>
            <Ionicons name="cash-outline" size={13} color={Colors.success} />
            <Text style={styles.earningsStatText}>${map.earnings.toFixed(2)}</Text>
          </View>
        )}

        <View style={styles.footerActions}>
          {forkRecord && (
            <TouchableOpacity
              style={styles.syncBtn}
              onPress={onSync}
              disabled={isSyncing}
            >
              {isSyncing
                ? <ActivityIndicator size="small" color={Colors.accent} style={{ width: 12, height: 12 }} />
                : <Ionicons name="sync-outline" size={13} color={Colors.accent} />
              }
              <Text style={styles.syncText}>{isSyncing ? 'Syncing…' : 'Sync'}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.pushBtn}
            onPress={onPushToGithub}
            disabled={isPushing}
          >
            {isPushing
              ? <ActivityIndicator size="small" color={Colors.textSecondary} style={{ width: 12, height: 12 }} />
              : <Ionicons name="logo-github" size={13} color={Colors.textSecondary} />
            }
            <Text style={styles.pushText}>{isPushing ? 'Pushing…' : 'Push'}</Text>
          </TouchableOpacity>
        </View>

        <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} />
      </View>
    </TouchableOpacity>
  )
}

type CreateMapModalProps = {
  visible: boolean
  onClose: () => void
  onCreate: (map: Omit<MapItem, 'id' | 'stars' | 'remixes' | 'earnings'>) => void
}

function CreateMapModal({ visible, onClose, onCreate }: CreateMapModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [emoji, setEmoji] = useState('🚀')
  const [isPublic, setIsPublic] = useState(false)
  const [isPaid, setIsPaid] = useState(false)
  const [priceStr, setPriceStr] = useState('')

  const handleCreate = () => {
    if (!title.trim()) {
      Alert.alert('Add a title', 'Your repo needs a name.')
      return
    }
    const price = isPaid && isPublic && parseFloat(priceStr) > 0
      ? { type: 'paid' as const, amount: parseFloat(priceStr) }
      : { type: 'free' as const }

    onCreate({
      title: title.trim(),
      description: description.trim(),
      emoji,
      isPublic,
      price,
      count: 0,
    })
    setTitle('')
    setDescription('')
    setEmoji('🚀')
    setIsPublic(false)
    setIsPaid(false)
    setPriceStr('')
  }

  const parsedPrice = parseFloat(priceStr) || 0
  const showEarningsPreview = isPublic && isPaid && parsedPrice > 0

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen">
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetNav}>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.sheetHeading}>New Repo</Text>
            <TouchableOpacity onPress={handleCreate}>
              <Text style={styles.createText}>Create</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.emojiRow}>
            {EMOJI_OPTIONS.map(e => (
              <TouchableOpacity
                key={e}
                style={[styles.emojiOption, emoji === e && styles.emojiOptionActive]}
                onPress={() => setEmoji(e)}
              >
                <Text style={styles.emojiOptionText}>{e}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TextInput
            style={styles.titleInput}
            placeholder="Map title..."
            placeholderTextColor={Colors.textSecondary}
            value={title}
            onChangeText={setTitle}
            maxLength={60}
          />

          <TextInput
            style={styles.descInput}
            placeholder="What's this map about? (optional)"
            placeholderTextColor={Colors.textSecondary}
            value={description}
            onChangeText={setDescription}
            multiline
            maxLength={200}
          />

          <View style={styles.toggleRow}>
            <View>
              <Text style={styles.toggleLabel}>Make public</Text>
              <Text style={styles.toggleSub}>Anyone on the market can see this</Text>
            </View>
            <Switch
              value={isPublic}
              onValueChange={v => { setIsPublic(v); if (!v) setIsPaid(false) }}
              trackColor={{ false: Colors.border, true: Colors.primary + '80' }}
              thumbColor={isPublic ? Colors.primary : Colors.textTertiary}
            />
          </View>

          {isPublic && (
            <TouchableOpacity style={styles.toggleRow} onPress={() => router.push('/paywall' as any)}>
              <View style={{ flex: 1 }}>
                <Text style={styles.toggleLabel}>Sell this map</Text>
                <Text style={styles.toggleSub}>Upgrade to Creator to monetize your knowledge</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.md,
  },
  heading: { fontSize: 24, fontWeight: '700', color: Colors.text },
  sub: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  newBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
  },
  newBtnText: { ...Typography.button, color: Colors.card, fontSize: 13 },
  earningsBanner: {
    marginHorizontal: Spacing.lg, marginBottom: Spacing.md,
    backgroundColor: Colors.success + '12', borderRadius: Radius.md,
    padding: Spacing.md, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flexWrap: 'wrap',
  },
  earningsText: { ...Typography.cardBody, color: Colors.text, fontWeight: '500' },
  earningsAmount: { color: Colors.success, fontWeight: '700' },
  earningsSub: { ...Typography.caption, color: Colors.textSecondary, width: '100%', marginLeft: 22 },
  scroll: { paddingHorizontal: Spacing.lg, paddingBottom: 40 },
  sectionLabel: { ...Typography.sectionLabel, color: Colors.sectionLabel, marginBottom: Spacing.md },
  card: { backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.md, ...Shadow.card },
  cardHeader: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.md },
  emoji: { fontSize: 32, lineHeight: 40 },
  cardMeta: { flex: 1 },
  cardTitle: { ...Typography.cardTitle, color: Colors.text, marginBottom: 2 },
  forkRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  forkAttribution: { ...Typography.caption, color: Colors.accent, fontWeight: '500' },
  updatesDot: {
    backgroundColor: Colors.accent, borderRadius: Radius.full,
    width: 16, height: 16, alignItems: 'center', justifyContent: 'center',
  },
  updatesDotText: { fontSize: 9, fontWeight: '700', color: Colors.card },
  cardDesc: { ...Typography.cardBody, color: Colors.textSecondary, lineHeight: 20 },
  badgeCol: { gap: 4, alignItems: 'flex-end' },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full },
  badgePublic: { backgroundColor: Colors.primary + '15' },
  badgePrivate: { backgroundColor: Colors.border },
  badgeFree: { backgroundColor: Colors.success + '15' },
  badgePaid: { backgroundColor: Colors.gold + '22' },
  badgeText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.8 },
  badgeTextPublic: { color: Colors.primary },
  badgeTextPrivate: { color: Colors.textSecondary },
  badgeTextFree: { color: Colors.success },
  badgeTextPaid: { color: '#B8860B' },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flexWrap: 'wrap' },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { ...Typography.caption, color: Colors.textSecondary },
  earningsStatText: { ...Typography.caption, color: Colors.success, fontWeight: '600' },
  footerActions: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 6 },
  syncBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 5, borderRadius: Radius.full,
    backgroundColor: Colors.accent + '15',
  },
  syncText: { fontSize: 11, fontWeight: '600', color: Colors.accent },
  pushBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 5, borderRadius: Radius.full,
    backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border,
  },
  pushText: { fontSize: 11, fontWeight: '600', color: Colors.textSecondary },
  // Modal
  overlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.card, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl,
    padding: Spacing.xl, paddingBottom: 48,
  },
  sheetHandle: {
    width: 36, height: 4, backgroundColor: Colors.border,
    borderRadius: Radius.full, alignSelf: 'center', marginBottom: Spacing.lg,
  },
  sheetNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.lg },
  cancelText: { ...Typography.button, color: Colors.textSecondary },
  sheetHeading: { fontSize: 16, fontWeight: '700', color: Colors.text },
  createText: { ...Typography.button, color: Colors.primary },
  emojiRow: { gap: Spacing.sm, marginBottom: Spacing.md },
  emojiOption: { width: 44, height: 44, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
  emojiOptionActive: { backgroundColor: Colors.primary + '20', borderWidth: 2, borderColor: Colors.primary },
  emojiOptionText: { fontSize: 22 },
  titleInput: {
    backgroundColor: Colors.background, borderRadius: Radius.md, padding: Spacing.md,
    fontSize: 16, fontWeight: '600', color: Colors.text, marginBottom: Spacing.sm,
  },
  descInput: {
    backgroundColor: Colors.background, borderRadius: Radius.md, padding: Spacing.md,
    fontSize: 14, color: Colors.text, minHeight: 72, textAlignVertical: 'top', marginBottom: Spacing.md,
  },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border,
  },
  toggleLabel: { ...Typography.cardBody, color: Colors.text, fontWeight: '500' },
  toggleSub: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  priceRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.background,
    borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: 10,
    marginTop: Spacing.sm, gap: 4,
  },
  currencySymbol: { fontSize: 20, fontWeight: '700', color: Colors.text },
  priceInput: { fontSize: 24, fontWeight: '700', color: Colors.text, flex: 1 },
  earningsPreview: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: Spacing.md,
    padding: Spacing.md, backgroundColor: Colors.success + '10', borderRadius: Radius.md,
  },
  earningsPreviewText: { ...Typography.caption, color: Colors.textSecondary, flex: 1 },
  toggleRowDisabled: { opacity: 0.6 },
  toggleLabelDisabled: { color: Colors.textSecondary },
  comingSoonRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  comingSoonBadge: {
    backgroundColor: Colors.gold + '22', borderRadius: Radius.full,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  comingSoonText: { fontSize: 9, fontWeight: '700', color: '#B8860B', letterSpacing: 0.8 },
})
