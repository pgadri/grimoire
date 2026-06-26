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
import {
  getReactions, toggleReaction, getThreads, getProducts, toggleProductUpvote,
  formatRelTime, STAGE_LABEL, REVIEW_TYPE_LABEL,
  type CaptureReaction, type StuckThread, type Product,
} from '../../lib/community'
import { awardPoints } from '../../lib/reputation'

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

type CommunityTab = 'captures' | 'threads' | 'launches'

export default function ExploreScreen() {
  const router = useRouter()
  const [communityTab, setCommunityTab] = useState<CommunityTab>('captures')
  const [captures, setCaptures] = useState<Capture[]>([])
  const [reactions, setReactions] = useState<Record<string, CaptureReaction>>({})
  const [threads, setThreads] = useState<StuckThread[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')

  useFocusEffect(useCallback(() => {
    AsyncStorage.getItem(CAPTURES_KEY).then(raw => {
      const all: Capture[] = raw ? JSON.parse(raw) : []
      setCaptures(all.filter(c => c.isPublic))
    })
    getReactions().then(setReactions)
    getThreads().then(setThreads)
    getProducts().then(setProducts)
  }, []))

  const handleReact = async (captureId: string, type: 'fire' | 'insightful') => {
    const updated = await toggleReaction(captureId, type)
    if (!updated.myReaction) return
    setReactions(prev => ({ ...prev, [captureId]: updated }))
    await awardPoints('reaction_received', 'Reaction on your capture')
  }

  const handleProductUpvote = async (productId: string) => {
    await toggleProductUpvote(productId)
    getProducts().then(setProducts)
  }

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

  const actionLabel = communityTab === 'threads' ? 'Ask' : communityTab === 'launches' ? 'Launch' : 'Share'
  const actionIcon: React.ComponentProps<typeof Ionicons>['name'] = communityTab === 'threads'
    ? 'help-circle-outline'
    : communityTab === 'launches'
    ? 'rocket-outline'
    : 'add'
  const handleAction = () => {
    if (communityTab === 'threads') router.push('/new-thread' as any)
    else if (communityTab === 'launches') router.push('/new-launch' as any)
    else router.push('/' as any)
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.heading}>Community</Text>
          <Text style={styles.sub}>What builders are learning right now</Text>
        </View>
        <TouchableOpacity style={styles.actionBtn} onPress={handleAction}>
          <Ionicons name={actionIcon} size={17} color={Colors.primary} />
          <Text style={styles.actionBtnText}>{actionLabel}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.communityTabs}>
        {(['captures', 'threads', 'launches'] as CommunityTab[]).map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.communityTab, communityTab === t && styles.communityTabActive]}
            onPress={() => setCommunityTab(t)}
          >
            <Text style={[styles.communityTabText, communityTab === t && styles.communityTabTextActive]}>
              {t === 'captures' ? 'Captures' : t === 'threads' ? 'Threads' : 'Launches'}
            </Text>
            {t === 'threads' && threads.filter(th => !th.resolved).length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{threads.filter(th => !th.resolved).length}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {communityTab === 'captures' && (
        <>
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
                <View style={styles.emptyHero}>
                  <Text style={styles.emptyHeroEmoji}>🏗️</Text>
                  <Text style={styles.emptyTitle}>Be the first to share</Text>
                  <Text style={styles.emptyBody}>
                    Open any capture, tap{' '}
                    <Ionicons name="globe-outline" size={13} color={Colors.textSecondary} />
                    {' '}to make it public.
                  </Text>
                </View>
                <View style={styles.communityHint}>
                  <Ionicons name="people-outline" size={16} color={Colors.primary} />
                  <Text style={styles.communityHintText}>
                    The best apps get built faster when builders share what they know.
                  </Text>
                </View>
              </View>
            ) : filtered.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyTitle}>No captures match</Text>
                <Text style={styles.emptyBody}>Try a different search or category.</Text>
              </View>
            ) : (
              <>
                {activeCategory === 'All' && !search && (
                  <>
                    <Text style={styles.sectionLabel}>🔥 TRENDING</Text>
                    {[...filtered].sort((a, b) => b.stars - a.stars).slice(0, 2).map(capture => (
                      <ExploreCard
                        key={`t-${capture.id}`}
                        capture={capture}
                        reaction={reactions[capture.id]}
                        onPress={() => router.push(`/capture/${capture.id}`)}
                        onReact={handleReact}
                        featured
                      />
                    ))}
                    <Text style={styles.sectionLabel}>ALL CAPTURES</Text>
                  </>
                )}
                {filtered.map(capture => (
                  <ExploreCard
                    key={capture.id}
                    capture={capture}
                    reaction={reactions[capture.id]}
                    onPress={() => router.push(`/capture/${capture.id}`)}
                    onReact={handleReact}
                  />
                ))}
              </>
            )}
          </ScrollView>
        </>
      )}

      {communityTab === 'threads' && (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {threads.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyHeroEmoji}>🤔</Text>
              <Text style={styles.emptyTitle}>No threads yet</Text>
              <Text style={styles.emptyBody}>
                Hit a wall? Post a thread. Other builders who faced the same thing will answer.
              </Text>
              <TouchableOpacity style={styles.emptyAction} onPress={() => router.push('/new-thread' as any)}>
                <Text style={styles.emptyActionText}>Ask the community</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {threads.filter(t => !t.resolved).length > 0 && (
                <>
                  <Text style={styles.sectionLabel}>OPEN</Text>
                  {threads.filter(t => !t.resolved).map(thread => (
                    <ThreadCard
                      key={thread.id}
                      thread={thread}
                      onPress={() => router.push(`/thread/${thread.id}` as any)}
                    />
                  ))}
                </>
              )}
              {threads.filter(t => t.resolved).length > 0 && (
                <>
                  <Text style={styles.sectionLabel}>RESOLVED</Text>
                  {threads.filter(t => t.resolved).map(thread => (
                    <ThreadCard
                      key={thread.id}
                      thread={thread}
                      onPress={() => router.push(`/thread/${thread.id}` as any)}
                    />
                  ))}
                </>
              )}
            </>
          )}
        </ScrollView>
      )}

      {communityTab === 'launches' && (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.launchHeader}>
            <Text style={styles.launchHeaderTitle}>Builder Launches</Text>
            <Text style={styles.launchHeaderSub}>
              Ship your product · get real feedback · find testers
            </Text>
          </View>
          {products.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyHeroEmoji}>🚀</Text>
              <Text style={styles.emptyTitle}>No launches yet</Text>
              <Text style={styles.emptyBody}>
                Built something? Submit it here. The community gives feedback, reports bugs, and signs up to test.
              </Text>
              <TouchableOpacity style={styles.emptyAction} onPress={() => router.push('/new-launch' as any)}>
                <Text style={styles.emptyActionText}>Submit your launch</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {products.map(p => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onPress={() => router.push(`/launch/${p.id}` as any)}
                  onUpvote={() => handleProductUpvote(p.id)}
                />
              ))}
              <View style={styles.launchFooter}>
                <TouchableOpacity style={styles.launchFooterBtn} onPress={() => router.push('/new-launch' as any)}>
                  <Ionicons name="add-circle-outline" size={16} color={Colors.primary} />
                  <Text style={styles.launchFooterBtnText}>Submit your launch</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

function ExploreCard({
  capture, reaction, onPress, onReact, featured,
}: {
  capture: Capture
  reaction?: CaptureReaction
  onPress: () => void
  onReact: (id: string, type: 'fire' | 'insightful') => void
  featured?: boolean
}) {
  const catColor = CATEGORY_COLOR[capture.category ?? ''] ?? Colors.accent
  const bullets = capture.preview
    .split('\n')
    .map(b => b.replace(/^[•\-→]\s*/, '').trim())
    .filter(Boolean)
    .slice(0, 3)

  return (
    <TouchableOpacity style={[styles.card, featured && styles.cardFeatured]} onPress={onPress} activeOpacity={0.85}>
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
        <View style={styles.reactionRow}>
          <TouchableOpacity
            style={[styles.reactionBtn, reaction?.myReaction === 'fire' && styles.reactionBtnActive]}
            onPress={() => onReact(capture.id, 'fire')}
          >
            <Text style={styles.reactionEmoji}>🔥</Text>
            {(reaction?.fire ?? 0) > 0 && (
              <Text style={[styles.reactionCount, reaction?.myReaction === 'fire' && styles.reactionCountActive]}>
                {reaction!.fire}
              </Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.reactionBtn, reaction?.myReaction === 'insightful' && styles.reactionBtnActive]}
            onPress={() => onReact(capture.id, 'insightful')}
          >
            <Text style={styles.reactionEmoji}>💡</Text>
            {(reaction?.insightful ?? 0) > 0 && (
              <Text style={[styles.reactionCount, reaction?.myReaction === 'insightful' && styles.reactionCountActive]}>
                {reaction!.insightful}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  )
}

function ThreadCard({ thread, onPress }: { thread: StuckThread; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.threadCard, thread.resolved && styles.threadCardResolved]} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.threadCardHeader}>
        {thread.captureTitle && (
          <View style={styles.threadAnchor}>
            <Ionicons name="link-outline" size={11} color={Colors.primary} />
            <Text style={styles.threadAnchorText} numberOfLines={1}>{thread.captureTitle}</Text>
          </View>
        )}
        {thread.resolved && (
          <View style={styles.resolvedChip}>
            <Ionicons name="checkmark-circle" size={11} color={Colors.success} />
            <Text style={styles.resolvedChipText}>Resolved</Text>
          </View>
        )}
      </View>
      <Text style={styles.threadTitle} numberOfLines={2}>{thread.title}</Text>
      <View style={styles.threadFooter}>
        <Text style={styles.threadMeta}>{thread.authorName} · {formatRelTime(thread.createdAt)}</Text>
        <View style={styles.replyStat}>
          <Ionicons name="chatbubble-outline" size={12} color={Colors.textSecondary} />
          <Text style={styles.replyCount}>{thread.replies.length}</Text>
        </View>
      </View>
      {thread.tags.length > 0 && (
        <View style={styles.threadTagRow}>
          {thread.tags.slice(0, 3).map(tag => (
            <View key={tag} style={styles.threadTag}>
              <Text style={styles.threadTagText}>{tag}</Text>
            </View>
          ))}
        </View>
      )}
    </TouchableOpacity>
  )
}

function ProductCard({
  product, onPress, onUpvote,
}: {
  product: Product
  onPress: () => void
  onUpvote: () => void
}) {
  return (
    <TouchableOpacity style={styles.productCard} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.productCardLeft}>
        <View style={styles.productLogo}>
          <Text style={styles.productLogoEmoji}>{product.logoEmoji}</Text>
        </View>
        <View style={styles.productInfo}>
          <View style={styles.productNameRow}>
            <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>
            <View style={styles.stagePill}>
              <Text style={styles.stagePillText}>{STAGE_LABEL[product.stage]}</Text>
            </View>
          </View>
          <Text style={styles.productTagline} numberOfLines={2}>{product.tagline}</Text>
          <View style={styles.productMeta}>
            <Text style={styles.productAuthor}>{product.authorName}</Text>
            <Text style={styles.productDot}>·</Text>
            <Text style={styles.productCategory}>{product.category}</Text>
          </View>
          {product.lookingFor.length > 0 && (
            <View style={styles.lookingRow}>
              {product.lookingFor.slice(0, 2).map(t => (
                <View key={t} style={styles.lookingChip}>
                  <Text style={styles.lookingChipText}>{REVIEW_TYPE_LABEL[t]}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
      <TouchableOpacity
        style={[styles.upvoteCol, product.myUpvote && styles.upvoteColActive]}
        onPress={e => { e.stopPropagation?.(); onUpvote() }}
      >
        <Ionicons
          name="chevron-up"
          size={16}
          color={product.myUpvote ? '#fff' : Colors.primary}
        />
        <Text style={[styles.upvoteNum, product.myUpvote && styles.upvoteNumActive]}>
          {product.upvotes}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.sm,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  heading: { fontSize: 28, fontWeight: '800', color: Colors.text },
  sub: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1.5, borderColor: Colors.primary, borderRadius: Radius.full,
    paddingHorizontal: 12, paddingVertical: 7,
  },
  actionBtnText: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  communityTabs: {
    flexDirection: 'row', marginHorizontal: Spacing.lg, marginBottom: Spacing.sm,
    backgroundColor: Colors.card, borderRadius: Radius.full,
    padding: 3, ...Shadow.card,
  },
  communityTab: {
    flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: Radius.full,
    flexDirection: 'row', justifyContent: 'center', gap: 4,
  },
  communityTabActive: { backgroundColor: Colors.primary },
  communityTabText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  communityTabTextActive: { color: Colors.card },
  badge: {
    backgroundColor: Colors.error, borderRadius: Radius.full,
    minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { fontSize: 9, fontWeight: '700', color: '#fff' },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    marginHorizontal: Spacing.lg, marginBottom: Spacing.sm,
    backgroundColor: Colors.card, borderRadius: Radius.full,
    paddingHorizontal: Spacing.md, paddingVertical: 10,
    ...Shadow.card,
  },
  searchInput: { flex: 1, fontSize: 14, color: Colors.text },
  filterRow: { marginVertical: Spacing.xs, height: 48 },
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
  empty: { alignItems: 'center', paddingTop: 40, gap: Spacing.md, paddingHorizontal: Spacing.xl },
  emptyHero: { alignItems: 'center', gap: Spacing.sm },
  emptyHeroEmoji: { fontSize: 48, marginBottom: Spacing.sm },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: Colors.text },
  emptyBody: { ...Typography.cardBody, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  emptyAction: {
    marginTop: Spacing.sm, paddingHorizontal: 20, paddingVertical: 12,
    backgroundColor: Colors.primary, borderRadius: Radius.full,
  },
  emptyActionText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  communityHint: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: Colors.primary + '12', borderRadius: Radius.lg,
    padding: Spacing.md, marginTop: Spacing.md,
  },
  communityHintText: { ...Typography.caption, color: Colors.primary, flex: 1, lineHeight: 18, fontWeight: '600' },
  // Capture cards
  card: {
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    padding: Spacing.lg, marginBottom: Spacing.md, ...Shadow.card,
  },
  cardFeatured: {
    borderWidth: 1.5, borderColor: Colors.primary + '40',
    backgroundColor: Colors.primary + '08',
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
  reactionRow: { flexDirection: 'row', gap: 6 },
  reactionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 8, paddingVertical: 5,
    borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  reactionBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '12' },
  reactionEmoji: { fontSize: 13 },
  reactionCount: { fontSize: 11, fontWeight: '600', color: Colors.textSecondary },
  reactionCountActive: { color: Colors.primary },
  // Thread cards
  threadCard: {
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    padding: Spacing.lg, marginBottom: Spacing.md, ...Shadow.card,
  },
  threadCardResolved: { opacity: 0.7 },
  threadCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: Spacing.sm },
  threadAnchor: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.primary + '12', borderRadius: Radius.full,
    paddingHorizontal: 8, paddingVertical: 3, flex: 1,
  },
  threadAnchorText: { ...Typography.caption, color: Colors.primary, fontWeight: '600', flex: 1 },
  resolvedChip: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: Colors.success + '15', borderRadius: Radius.full,
    paddingHorizontal: 7, paddingVertical: 3,
  },
  resolvedChipText: { fontSize: 10, fontWeight: '700', color: Colors.success },
  threadTitle: { fontSize: 15, fontWeight: '700', color: Colors.text, lineHeight: 22, marginBottom: Spacing.sm },
  threadFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  threadMeta: { ...Typography.caption, color: Colors.textSecondary },
  replyStat: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  replyCount: { ...Typography.caption, color: Colors.textSecondary },
  threadTagRow: { flexDirection: 'row', gap: 6, marginTop: Spacing.sm },
  threadTag: {
    paddingHorizontal: 8, paddingVertical: 3,
    backgroundColor: Colors.accent + '12', borderRadius: Radius.full,
  },
  threadTagText: { fontSize: 10, fontWeight: '600', color: Colors.accent },
  // Product cards (Launches tab)
  launchHeader: { marginBottom: Spacing.lg },
  launchHeaderTitle: { fontSize: 17, fontWeight: '800', color: Colors.text },
  launchHeaderSub: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  productCard: {
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    padding: Spacing.md, marginBottom: Spacing.md, ...Shadow.card,
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm,
  },
  productCardLeft: { flex: 1, flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start' },
  productLogo: {
    width: 52, height: 52, borderRadius: Radius.md,
    backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center',
  },
  productLogoEmoji: { fontSize: 30 },
  productInfo: { flex: 1, gap: 3 },
  productNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  productName: { fontSize: 15, fontWeight: '700', color: Colors.text, flex: 1 },
  stagePill: {
    backgroundColor: Colors.primary + '15', borderRadius: Radius.full,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  stagePillText: { fontSize: 9, fontWeight: '700', color: Colors.primary },
  productTagline: { ...Typography.caption, color: Colors.textSecondary, lineHeight: 18 },
  productMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  productAuthor: { ...Typography.caption, color: Colors.textTertiary },
  productDot: { ...Typography.caption, color: Colors.textTertiary },
  productCategory: { ...Typography.caption, color: Colors.accent, fontWeight: '600' },
  lookingRow: { flexDirection: 'row', gap: 4, flexWrap: 'wrap', marginTop: 4 },
  lookingChip: {
    backgroundColor: Colors.success + '12', borderRadius: Radius.full,
    paddingHorizontal: 7, paddingVertical: 2,
  },
  lookingChipText: { fontSize: 9, fontWeight: '700', color: Colors.success },
  upvoteCol: {
    alignItems: 'center', gap: 2,
    paddingHorizontal: 10, paddingVertical: 8,
    borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.primary,
    minWidth: 42,
  },
  upvoteColActive: { backgroundColor: Colors.primary },
  upvoteNum: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  upvoteNumActive: { color: '#fff' },
  launchFooter: { alignItems: 'center', paddingVertical: Spacing.md },
  launchFooterBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 20, paddingVertical: 12,
    borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.primary,
  },
  launchFooterBtnText: { fontSize: 14, fontWeight: '700', color: Colors.primary },
})
