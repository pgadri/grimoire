import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Share } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router'
import { useState, useMemo, useCallback } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import Svg, { Line, Circle, G } from 'react-native-svg'
import { Colors, Spacing, Radius, Shadow, Typography } from '../../constants/theme'
import { findBacklinks } from '../../lib/backlinks'
import type { Capture } from '../../components/CaptureCard'

const MAPS_KEY = 'grimoire:maps'
const CAPTURES_KEY = 'grimoire:captures'

const { width: SCREEN_W } = Dimensions.get('window')
const CANVAS_W = SCREEN_W - 32
const CANVAS_H = 380
const CX = CANVAS_W / 2
const CY = CANVAS_H / 2
const RING_R = Math.min(CX, CY) - 64
const NODE_R = 28

const MOCK_MAP_CAPTURES: Capture[] = [
  {
    id: 'c1', title: 'How I got my first 1000 users without spending a dollar on ads',
    sourceUrl: '', sourceType: 'video', creator: '@indiefounder', platform: 'Instagram',
    date: 'Jun 24', stars: 142, starred: true, isPublic: true, pushed: true, pinned: true,
    preview: 'DMs convert 10x better than posts. Infiltrate communities. Personal outreach beats marketing.',
  },
  {
    id: 'c2', title: 'Pricing strategy — why free is a trap',
    sourceUrl: '', sourceType: 'video', creator: '@buildwithme', platform: 'YouTube',
    date: 'Jun 23', stars: 89, starred: false, isPublic: false, pushed: true, pinned: false,
    preview: 'Start at $4.99 minimum. Annual plans convert 3x better. Raise price after 100 users.',
  },
  {
    id: 'c3', title: 'App Store optimization checklist',
    sourceUrl: '', sourceType: 'image', creator: 'You', platform: 'Screenshot',
    date: 'Jun 22', stars: 0, starred: false, isPublic: false, pushed: false, pinned: false,
    preview: 'Keywords in subtitle. First 3 screenshots show core value. Localize for US + UK + AU.',
  },
  {
    id: 'c4', title: 'ProductHunt launch day strategy',
    sourceUrl: '', sourceType: 'video', creator: '@launcher', platform: 'YouTube',
    date: 'Jun 20', stars: 67, starred: false, isPublic: true, pushed: true, pinned: false,
    preview: 'Launch Tuesday 12:01am. Pre-warm your network. Comments in first hour matter most.',
  },
  {
    id: 'c5', title: 'How to get featured in the App Store',
    sourceUrl: '', sourceType: 'video', creator: '@appleinsider', platform: 'Instagram',
    date: 'Jun 18', stars: 54, starred: false, isPublic: false, pushed: true, pinned: false,
    preview: 'Use Apple frameworks. Submit 2 weeks before launch. Have a compelling story for editors.',
  },
]

function platformEmoji(platform: string): string {
  if (platform === 'Instagram') return '📸'
  if (platform === 'YouTube') return '▶️'
  if (platform === 'TikTok') return '🎵'
  if (platform === 'Screenshot') return '🖼️'
  return '📹'
}

type NodeData = { id: string; x: number; y: number; capture: Capture }

export default function MapGraphScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [view, setView] = useState<'graph' | 'list'>('graph')
  const [mapTitle, setMapTitle] = useState('Knowledge Repo')
  const [mapEmoji, setMapEmoji] = useState('📚')
  const [captures, setCaptures] = useState<Capture[]>([])

  useFocusEffect(useCallback(() => {
    async function load() {
      try {
        const [mapsRaw, capturesRaw] = await Promise.all([
          AsyncStorage.getItem(MAPS_KEY),
          AsyncStorage.getItem(CAPTURES_KEY),
        ])
        const maps: any[] = mapsRaw ? JSON.parse(mapsRaw) : []
        const map = maps.find(m => m.id === id)
        if (map) {
          setMapTitle(map.title)
          setMapEmoji(map.emoji ?? '📚')
          if (map.captureIds?.length) {
            const allCaptures: Capture[] = capturesRaw ? JSON.parse(capturesRaw) : []
            const mapCaptures = map.captureIds
              .map((cid: string) => allCaptures.find(c => c.id === cid))
              .filter(Boolean) as Capture[]
            if (mapCaptures.length > 0) setCaptures(mapCaptures)
          }
        }
      } catch {}
    }
    load()
  }, [id]))

  const handleSharePacket = async () => {
    const lines = captures.map((c, i) =>
      `${i + 1}. ${c.title}\n${c.preview}`
    ).join('\n\n')
    await Share.share({
      title: `${mapEmoji} ${mapTitle}`,
      message: `${mapEmoji} ${mapTitle}\n\n${lines}\n\n— Shared from Vibecoded`,
    })
  }

  const nodes = useMemo<NodeData[]>(() =>
    captures.map((c, i) => {
      const angle = (2 * Math.PI * i / captures.length) - Math.PI / 2
      return {
        id: c.id,
        x: CX + RING_R * Math.cos(angle),
        y: CY + RING_R * Math.sin(angle),
        capture: c,
      }
    }), [captures])

  const edges = useMemo(() => {
    const result: { from: NodeData; to: NodeData; strength: number }[] = []
    for (let i = 0; i < captures.length; i++) {
      const links = findBacklinks(captures[i], captures, 0.04)
      for (const link of links) {
        const fromNode = nodes.find(n => n.id === captures[i].id)
        const toNode = nodes.find(n => n.id === link.capture.id)
        if (fromNode && toNode && !result.find(e =>
          (e.from.id === toNode.id && e.to.id === fromNode.id)
        )) {
          result.push({ from: fromNode, to: toNode, strength: link.score })
        }
      }
    }
    return result
  }, [nodes, captures])

  const selectedCapture = captures.find(c => c.id === selectedId)
  const selectedBacklinks = selectedCapture ? findBacklinks(selectedCapture, captures, 0.04) : []

  const handleNodePress = (nodeId: string) => {
    setSelectedId(prev => prev === nodeId ? null : nodeId)
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>{mapEmoji} {mapTitle}</Text>
        <View style={styles.navRight}>
        <TouchableOpacity style={styles.shareBtn} onPress={handleSharePacket}>
          <Ionicons name="share-outline" size={18} color={Colors.primary} />
        </TouchableOpacity>
        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[styles.toggleBtn, view === 'graph' && styles.toggleBtnActive]}
            onPress={() => setView('graph')}
          >
            <Ionicons name="git-network-outline" size={16} color={view === 'graph' ? Colors.card : Colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, view === 'list' && styles.toggleBtnActive]}
            onPress={() => setView('list')}
          >
            <Ionicons name="list-outline" size={16} color={view === 'list' ? Colors.card : Colors.textSecondary} />
          </TouchableOpacity>
        </View>
        </View>
      </View>

      {captures.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="git-network-outline" size={48} color={Colors.textTertiary} />
          <Text style={styles.emptyTitle}>No captures yet</Text>
          <Text style={styles.emptyBody}>
            Long-press any capture on the home screen and tap "Add to Repo" to add it here.
          </Text>
        </View>
      ) : view === 'graph' ? (
        <ScrollView contentContainerStyle={styles.graphScroll} showsVerticalScrollIndicator={false}>
          {/* Graph canvas */}
          <View style={[styles.canvas, { width: CANVAS_W, height: CANVAS_H }]}>
            <Svg width={CANVAS_W} height={CANVAS_H} style={StyleSheet.absoluteFill}>
              {/* Edges */}
              {edges.map((edge, i) => (
                <Line
                  key={i}
                  x1={edge.from.x} y1={edge.from.y}
                  x2={edge.to.x} y2={edge.to.y}
                  stroke={selectedId && (edge.from.id === selectedId || edge.to.id === selectedId)
                    ? Colors.accent : Colors.border}
                  strokeWidth={selectedId && (edge.from.id === selectedId || edge.to.id === selectedId) ? 2 : 1}
                  opacity={selectedId && edge.from.id !== selectedId && edge.to.id !== selectedId ? 0.2 : 0.8}
                />
              ))}

              {/* Node circles */}
              {nodes.map(node => {
                const isSelected = node.id === selectedId
                const isConnected = selectedId ? edges.some(e =>
                  (e.from.id === selectedId && e.to.id === node.id) ||
                  (e.to.id === selectedId && e.from.id === node.id)
                ) : false
                const isDimmed = selectedId && !isSelected && !isConnected

                return (
                  <G key={node.id}>
                    <Circle
                      cx={node.x} cy={node.y} r={NODE_R}
                      fill={isSelected ? Colors.primary : Colors.card}
                      stroke={node.capture.starred ? Colors.gold : isConnected ? Colors.accent : Colors.border}
                      strokeWidth={isSelected || isConnected ? 2.5 : 1.5}
                      opacity={isDimmed ? 0.25 : 1}
                    />
                  </G>
                )
              })}
            </Svg>

            {/* Touch targets + emoji labels */}
            {nodes.map(node => {
              const isDimmed = selectedId && node.id !== selectedId && !edges.some(e =>
                (e.from.id === selectedId && e.to.id === node.id) ||
                (e.to.id === selectedId && e.from.id === node.id)
              )
              return (
                <View key={node.id}>
                  <TouchableOpacity
                    style={[styles.nodeTouch, {
                      left: node.x - NODE_R,
                      top: node.y - NODE_R,
                      opacity: isDimmed ? 0.25 : 1,
                    }]}
                    onPress={() => handleNodePress(node.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.nodeEmoji}>{platformEmoji(node.capture.platform)}</Text>
                  </TouchableOpacity>

                  <View style={[styles.nodeLabel, {
                    left: node.x - 44,
                    top: node.y + NODE_R + 4,
                    opacity: isDimmed ? 0.25 : 1,
                  }]}>
                    <Text style={styles.nodeLabelText} numberOfLines={2}>
                      {node.capture.title.substring(0, 28)}{node.capture.title.length > 28 ? '…' : ''}
                    </Text>
                  </View>
                </View>
              )
            })}
          </View>

          {/* Selected capture detail */}
          {selectedCapture ? (
            <View style={styles.detailCard}>
              <View style={styles.detailHeader}>
                <Text style={styles.detailPlatform}>{selectedCapture.platform} · {selectedCapture.creator}</Text>
                {selectedCapture.starred && <Ionicons name="star" size={14} color={Colors.gold} />}
              </View>
              <Text style={styles.detailTitle}>{selectedCapture.title}</Text>
              <Text style={styles.detailPreview} numberOfLines={3}>{selectedCapture.preview}</Text>

              {selectedBacklinks.length > 0 && (
                <View style={styles.backlinksSection}>
                  <Text style={styles.backlinksLabel}>🔗 CONNECTS TO</Text>
                  {selectedBacklinks.map(link => (
                    <TouchableOpacity
                      key={link.capture.id}
                      style={styles.backlinkRow}
                      onPress={() => setSelectedId(link.capture.id)}
                    >
                      <Text style={styles.backlinkEmoji}>{platformEmoji(link.capture.platform)}</Text>
                      <Text style={styles.backlinkTitle} numberOfLines={1}>{link.capture.title}</Text>
                      <View style={styles.backlinkKeywords}>
                        {link.sharedKeywords.slice(0, 2).map(kw => (
                          <View key={kw} style={styles.kwChip}>
                            <Text style={styles.kwText}>{kw}</Text>
                          </View>
                        ))}
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <TouchableOpacity
                style={styles.openBtn}
                onPress={() => router.push(`/capture/${selectedCapture.id}`)}
              >
                <Text style={styles.openBtnText}>Open Capture</Text>
                <Ionicons name="arrow-forward" size={14} color={Colors.card} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.hintBox}>
              <Ionicons name="hand-left-outline" size={20} color={Colors.textTertiary} />
              <Text style={styles.hintText}>Tap a node to explore connections</Text>
            </View>
          )}
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.listScroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionLabel}>{captures.length} CAPTURES</Text>
          {captures.map(c => {
            const links = findBacklinks(c, captures, 0.04)
            return (
              <TouchableOpacity
                key={c.id}
                style={styles.listCard}
                onPress={() => router.push(`/capture/${c.id}`)}
                activeOpacity={0.85}
              >
                <Text style={styles.listEmoji}>{platformEmoji(c.platform)}</Text>
                <View style={styles.listInfo}>
                  <Text style={styles.listTitle} numberOfLines={2}>{c.title}</Text>
                  <View style={styles.listMeta}>
                    <Text style={styles.listPlatform}>{c.platform}</Text>
                    {links.length > 0 && (
                      <View style={styles.linkBadge}>
                        <Ionicons name="git-network-outline" size={11} color={Colors.accent} />
                        <Text style={styles.linkBadgeText}>{links.length} links</Text>
                      </View>
                    )}
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} />
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  navBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: Radius.full,
    backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center',
    ...Shadow.card,
  },
  title: { fontSize: 15, fontWeight: '700', color: Colors.text, flex: 1, textAlign: 'center', marginHorizontal: Spacing.sm },
  navRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  shareBtn: {
    width: 36, height: 36, borderRadius: Radius.full,
    backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center',
    ...Shadow.card,
  },
  viewToggle: {
    flexDirection: 'row', backgroundColor: Colors.card,
    borderRadius: Radius.full, padding: 3, ...Shadow.card,
  },
  toggleBtn: {
    width: 32, height: 32, borderRadius: Radius.full,
    alignItems: 'center', justifyContent: 'center',
  },
  toggleBtnActive: { backgroundColor: Colors.primary },
  graphScroll: { paddingHorizontal: 16, paddingBottom: 40, alignItems: 'center' },
  canvas: { marginVertical: Spacing.md },
  nodeTouch: {
    position: 'absolute', width: NODE_R * 2, height: NODE_R * 2,
    alignItems: 'center', justifyContent: 'center',
  },
  nodeEmoji: { fontSize: 18 },
  nodeLabel: { position: 'absolute', width: 88, alignItems: 'center' },
  nodeLabelText: { fontSize: 9, color: Colors.textSecondary, textAlign: 'center', lineHeight: 12 },
  detailCard: {
    width: '100%', backgroundColor: Colors.card,
    borderRadius: Radius.lg, padding: Spacing.lg, ...Shadow.card,
  },
  detailHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  detailPlatform: { ...Typography.caption, color: Colors.textSecondary },
  detailTitle: { fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: Spacing.sm, lineHeight: 22 },
  detailPreview: { ...Typography.cardBody, color: Colors.textSecondary, lineHeight: 20, marginBottom: Spacing.md },
  backlinksSection: { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: Spacing.md, marginBottom: Spacing.md },
  backlinksLabel: { ...Typography.sectionLabel, color: Colors.sectionLabel, marginBottom: Spacing.sm, fontSize: 10 },
  backlinkRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: 8 },
  backlinkEmoji: { fontSize: 14 },
  backlinkTitle: { ...Typography.caption, color: Colors.text, flex: 1, fontWeight: '500' },
  backlinkKeywords: { flexDirection: 'row', gap: 4 },
  kwChip: { backgroundColor: Colors.accent + '18', paddingHorizontal: 6, paddingVertical: 2, borderRadius: Radius.full },
  kwText: { fontSize: 9, color: Colors.accent, fontWeight: '600' },
  openBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, backgroundColor: Colors.primary, borderRadius: Radius.full, paddingVertical: 12,
  },
  openBtnText: { ...Typography.button, color: Colors.card, fontSize: 14 },
  hintBox: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, padding: Spacing.lg,
  },
  hintText: { ...Typography.caption, color: Colors.textTertiary },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, gap: Spacing.md },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  emptyBody: { ...Typography.cardBody, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  listScroll: { paddingHorizontal: Spacing.lg, paddingBottom: 40, paddingTop: Spacing.sm },
  sectionLabel: { ...Typography.sectionLabel, color: Colors.sectionLabel, marginBottom: Spacing.md },
  listCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    padding: Spacing.md, marginBottom: Spacing.sm, ...Shadow.card,
  },
  listEmoji: { fontSize: 22 },
  listInfo: { flex: 1 },
  listTitle: { ...Typography.cardBody, color: Colors.text, fontWeight: '600', marginBottom: 4 },
  listMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  listPlatform: { ...Typography.caption, color: Colors.textSecondary },
  linkBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: Colors.accent + '15', paddingHorizontal: 6, paddingVertical: 2, borderRadius: Radius.full },
  linkBadgeText: { fontSize: 10, color: Colors.accent, fontWeight: '600' },
})
