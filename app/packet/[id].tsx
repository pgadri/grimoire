import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useState, useEffect } from 'react'
import { Colors, Spacing, Radius, Shadow, Typography } from '../../constants/theme'
import { getPacket, recordRead, PACKET_CATEGORIES, type Packet, type PacketChapter } from '../../lib/packets'

export default function PacketReaderScreen() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const [packet, setPacket] = useState<Packet | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeChapter, setActiveChapter] = useState<PacketChapter | null>(null)

  useEffect(() => {
    if (!id) return
    getPacket(id).then(p => {
      setPacket(p)
      if (p?.chapters?.length) {
        setActiveChapter(p.chapters[0])
        recordRead(id).catch(() => {})
      }
      setLoading(false)
    })
  }, [id])

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.center}>
          <Text style={styles.loadingText}>Loading…</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (!packet) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.center}>
          <Text style={styles.notFoundText}>Packet not found</Text>
        </View>
      </SafeAreaView>
    )
  }

  const catLabel = PACKET_CATEGORIES.find(c => c.id === packet.category)?.label ?? packet.category
  const chapters = packet.chapters ?? []
  const lockedChapters = chapters.filter(c => !c.isPreview)

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.navTitle} numberOfLines={1}>{packet.title}</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.body}>
        {/* Chapter list sidebar / top */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chapterTabs}
          contentContainerStyle={styles.chapterTabsContent}
        >
          {chapters.map((ch, i) => (
            <TouchableOpacity
              key={ch.id}
              style={[styles.chapterTab, activeChapter?.id === ch.id && styles.chapterTabActive]}
              onPress={() => setActiveChapter(ch)}
            >
              {!ch.isPreview && (
                <Ionicons name="lock-closed" size={10} color={activeChapter?.id === ch.id ? '#fff' : Colors.textTertiary} />
              )}
              <Text style={[styles.chapterTabText, activeChapter?.id === ch.id && styles.chapterTabTextActive]}>
                {i + 1}. {ch.title}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Content area */}
        <ScrollView style={styles.contentScroll} contentContainerStyle={styles.contentPad} showsVerticalScrollIndicator={false}>
          {activeChapter ? (
            activeChapter.isPreview ? (
              <>
                <Text style={styles.chapterHeading}>{activeChapter.title}</Text>
                <View style={styles.freeTag}>
                  <Text style={styles.freeTagText}>FREE CHAPTER</Text>
                </View>
                <Text style={styles.chapterBody}>{activeChapter.content}</Text>
              </>
            ) : (
              <>
                <Text style={styles.chapterHeading}>{activeChapter.title}</Text>
                <View style={styles.lockedOverlay}>
                  <Ionicons name="lock-closed" size={36} color={Colors.textTertiary} />
                  <Text style={styles.lockedTitle}>Subscribers only</Text>
                  <Text style={styles.lockedSub}>
                    This chapter is available on the Solopreneur or Team plan.
                  </Text>
                  <TouchableOpacity
                    style={styles.unlockBtn}
                    onPress={() => router.push('/paywall' as any)}
                  >
                    <Text style={styles.unlockBtnText}>Unlock with Solopreneur ↗</Text>
                  </TouchableOpacity>
                </View>
              </>
            )
          ) : (
            <View style={styles.center}>
              <Text style={styles.notFoundText}>No chapters yet</Text>
            </View>
          )}

          {/* Packet metadata */}
          <View style={styles.metaBlock}>
            <Text style={styles.metaTitle}>About this packet</Text>
            <View style={styles.metaRow}>
              <Text style={styles.metaEmoji}>{packet.coverEmoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.metaPacketTitle}>{packet.title}</Text>
                <Text style={styles.metaDescription}>{packet.description}</Text>
              </View>
            </View>
            <View style={styles.metaStats}>
              <View style={styles.metaStat}>
                <Ionicons name="book-outline" size={14} color={Colors.textSecondary} />
                <Text style={styles.metaStatText}>{chapters.length} chapters</Text>
              </View>
              <View style={styles.metaStat}>
                <Ionicons name="eye-outline" size={14} color={Colors.textSecondary} />
                <Text style={styles.metaStatText}>{packet.totalReads} reads</Text>
              </View>
              <View style={styles.metaStat}>
                <Ionicons name="pricetag-outline" size={14} color={Colors.textSecondary} />
                <Text style={styles.metaStatText}>{catLabel}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.creatorRow}
              onPress={() => packet.authorHandle && router.push(`/creator/${packet.authorHandle}` as any)}
            >
              <View style={styles.creatorAvatar}>
                <Text style={styles.creatorAvatarText}>{(packet.authorName ?? 'C')[0].toUpperCase()}</Text>
              </View>
              <View>
                <Text style={styles.creatorName}>{packet.authorName}</Text>
                {packet.authorHandle && (
                  <Text style={styles.creatorHandle}>@{packet.authorHandle}</Text>
                )}
              </View>
              <Ionicons name="chevron-forward" size={14} color={Colors.textTertiary} />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: Colors.textSecondary },
  notFoundText: { color: Colors.textSecondary },
  navBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: Radius.full,
    backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center',
    ...Shadow.card,
  },
  navTitle: { fontSize: 15, fontWeight: '700', color: Colors.text, flex: 1, textAlign: 'center', marginHorizontal: Spacing.sm },
  body: { flex: 1 },
  chapterTabs: { maxHeight: 44, borderBottomWidth: 1, borderBottomColor: Colors.border },
  chapterTabsContent: { paddingHorizontal: Spacing.lg, gap: 8, alignItems: 'center' },
  chapterTab: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: Radius.full, backgroundColor: Colors.card,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  chapterTabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chapterTabText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  chapterTabTextActive: { color: '#fff' },
  contentScroll: { flex: 1 },
  contentPad: { padding: Spacing.lg, paddingBottom: 60 },
  chapterHeading: { fontSize: 22, fontWeight: '800', color: Colors.text, marginBottom: Spacing.md },
  freeTag: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.success + '20', borderRadius: Radius.full,
    paddingHorizontal: 10, paddingVertical: 4, marginBottom: Spacing.md,
  },
  freeTagText: { fontSize: 10, fontWeight: '800', color: Colors.success, letterSpacing: 0.8 },
  chapterBody: { fontSize: 15, color: Colors.text, lineHeight: 24 },
  lockedOverlay: {
    alignItems: 'center', paddingVertical: 48, gap: Spacing.sm,
    backgroundColor: Colors.card, borderRadius: Radius.xl,
    borderWidth: 1.5, borderColor: Colors.border, borderStyle: 'dashed',
    marginTop: Spacing.md,
  },
  lockedTitle: { fontSize: 17, fontWeight: '700', color: Colors.text },
  lockedSub: { ...Typography.caption, color: Colors.textSecondary, textAlign: 'center', maxWidth: 240, lineHeight: 18 },
  unlockBtn: {
    marginTop: Spacing.sm, backgroundColor: Colors.primary,
    borderRadius: Radius.full, paddingHorizontal: 24, paddingVertical: 12,
  },
  unlockBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  metaBlock: {
    marginTop: Spacing.xl * 2, backgroundColor: Colors.card,
    borderRadius: Radius.xl, padding: Spacing.lg, ...Shadow.card,
  },
  metaTitle: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary, letterSpacing: 0.8, marginBottom: Spacing.md },
  metaRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.md },
  metaEmoji: { fontSize: 36 },
  metaPacketTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  metaDescription: { ...Typography.caption, color: Colors.textSecondary, marginTop: 4, lineHeight: 18 },
  metaStats: { flexDirection: 'row', gap: Spacing.lg, marginBottom: Spacing.md },
  metaStat: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaStatText: { ...Typography.caption, color: Colors.textSecondary },
  creatorRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border,
  },
  creatorAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  creatorAvatarText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  creatorName: { fontSize: 14, fontWeight: '700', color: Colors.text },
  creatorHandle: { ...Typography.caption, color: Colors.accent },
})
