import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  ActivityIndicator, RefreshControl,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useState, useCallback } from 'react'
import { useFocusEffect, useRouter } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Colors, Spacing, Radius, Shadow, Typography } from '../../constants/theme'
import type { Capture } from '../../components/CaptureCard'
import {
  getReactions, toggleReaction, getProducts, toggleProductUpvote,
  getPublicCaptures,
  STAGE_LABEL, REVIEW_TYPE_LABEL,
  type CaptureReaction, type Product, type PublicCapture,
} from '../../lib/community'
import { getThreads, voteThread, formatRelTime, type Thread } from '../../lib/threads'
import { getPackets, PACKET_CATEGORIES, categoryEmoji, type Packet } from '../../lib/packets'
import { awardPoints } from '../../lib/reputation'

const CAPTURES_KEY = 'grimoire:captures'

const CATEGORIES = ['All', 'Technical', 'Marketing', 'Launch', 'Pricing', 'Founder', 'Product']

const FEATURED_CAPTURES = [
  {
    id: 'vc-f1',
    title: 'The pre-launch content playbook that got 2,000 waitlist signups',
    sourceUrl: '',
    sourceType: 'video' as const,
    creator: '@vibecoded',
    platform: 'Vibecoded',
    date: 'Jun 26',
    stars: 312,
    starred: false,
    isPublic: true,
    pushed: true,
    pinned: false,
    category: 'Marketing',
    preview: '• Start building in public 8 weeks before launch — not 8 days\n• One short-form video per day showing your build process converts better than polished ads\n• Email waitlist weekly — 40% of signups forget they signed up within 2 weeks',
  },
  {
    id: 'vc-f2',
    title: 'Why your App Store screenshots are costing you 60% of downloads',
    sourceUrl: '',
    sourceType: 'image' as const,
    creator: '@vibecoded',
    platform: 'Vibecoded',
    date: 'Jun 26',
    stars: 198,
    starred: false,
    isPublic: true,
    pushed: true,
    pinned: false,
    category: 'Launch',
    preview: '• Screenshot 1 must show the outcome, not the UI — users scan in <2 seconds\n• Use real device mockups, not blank screens — trust signals matter\n• Test two screenshot sets before launch — A/B testing costs nothing on TestFlight',
  },
  {
    id: 'vc-f3',
    title: 'Supabase RLS misconfiguration exposed 3,000 users — here\'s what happened',
    sourceUrl: '',
    sourceType: 'video' as const,
    creator: '@vibecoded',
    platform: 'Vibecoded',
    date: 'Jun 25',
    stars: 441,
    starred: false,
    isPublic: true,
    pushed: true,
    pinned: false,
    category: 'Technical',
    preview: '• Row Level Security is OFF by default on every Supabase table — you must enable it manually\n• The public anon key ships in your app — anyone can use it without RLS\n• Fix: enable RLS on every table and write policies before your first real user signs up',
  },
  {
    id: 'vc-f4',
    title: 'Pricing your first app: the $4.99 trap and how to avoid it',
    sourceUrl: '',
    sourceType: 'video' as const,
    creator: '@vibecoded',
    platform: 'Vibecoded',
    date: 'Jun 24',
    stars: 267,
    starred: false,
    isPublic: true,
    pushed: true,
    pinned: false,
    category: 'Pricing',
    preview: '• Free attracts users who never convert — start at $4.99 minimum\n• Annual plans lock in revenue and reduce churn by 60%\n• Raise prices after your first 50 paying users — early adopters will tell you what it\'s worth',
  },
]

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

type CommunityTab = 'captures' | 'threads' | 'launches' | 'knowledge'

export default function ExploreScreen() {
  const router = useRouter()
  const [communityTab, setCommunityTab] = useState<CommunityTab>('captures')
  const [captures, setCaptures] = useState<Capture[]>([])
  const [publicCaptures, setPublicCaptures] = useState<PublicCapture[]>([])
  const [reactions, setReactions] = useState<Record<string, CaptureReaction>>({})
  const [threads, setThreads] = useState<Thread[]>([])
  const [threadsLoading, setThreadsLoading] = useState(false)
  const [threadsRefreshing, setThreadsRefreshing] = useState(false)
  const [threadsError, setThreadsError] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [productsError, setProductsError] = useState(false)
  const [packets, setPackets] = useState<Packet[]>([])
  const [packetsLoading, setPacketsLoading] = useState(false)
  const [activePacketCat, setActivePacketCat] = useState<string | undefined>(undefined)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')

  const loadThreads = useCallback(async (refresh = false) => {
    if (refresh) setThreadsRefreshing(true)
    else setThreadsLoading(true)
    setThreadsError(false)
    try {
      const data = await getThreads()
      setThreads(data)
    } catch {
      setThreadsError(true)
    } finally {
      if (refresh) setThreadsRefreshing(false)
      else setThreadsLoading(false)
    }
  }, [])

  const loadPackets = useCallback(async (cat?: string) => {
    setPacketsLoading(true)
    const data = await getPackets(cat)
    setPackets(data)
    setPacketsLoading(false)
  }, [])

  useFocusEffect(useCallback(() => {
    AsyncStorage.getItem(CAPTURES_KEY).then(raw => {
      const all: Capture[] = raw ? JSON.parse(raw) : []
      setCaptures(all.filter(c => c.isPublic))
    })
    getPublicCaptures().then(setPublicCaptures)
    getReactions().then(setReactions)
    loadThreads()
    getProducts().then(setProducts).catch(() => setProductsError(true))
    loadPackets()
  }, [loadThreads]))

  const handleReact = async (captureId: string, type: 'fire' | 'insightful') => {
    const updated = await toggleReaction(captureId, type)
    if (!updated.myReaction) return
    setReactions(prev => ({ ...prev, [captureId]: updated }))
    await awardPoints('reaction_received', 'Reaction on your capture')
  }

  const handleProductUpvote = async (productId: string) => {
    const result = await toggleProductUpvote(productId)
    setProducts(prev => prev.map(p =>
      p.id === productId ? { ...p, myUpvote: result.myUpvote, upvotes: result.upvotes } : p
    ))
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

  const actionLabel = communityTab === 'threads' ? 'Ask'
    : communityTab === 'launches' ? 'Launch'
    : communityTab === 'knowledge' ? 'Create'
    : 'Share'
  const actionIcon: React.ComponentProps<typeof Ionicons>['name'] = communityTab === 'threads'
    ? 'help-circle-outline'
    : communityTab === 'launches'
    ? 'rocket-outline'
    : communityTab === 'knowledge'
    ? 'add-circle-outline'
    : 'add'
  const handleAction = () => {
    if (communityTab === 'threads') router.push('/new-thread' as any)
    else if (communityTab === 'launches') router.push('/new-launch' as any)
    else if (communityTab === 'knowledge') router.push('/packet-editor' as any)
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
        {([
          { id: 'captures', label: 'Captures' },
          { id: 'threads', label: 'Threads' },
          { id: 'launches', label: 'Launches' },
          { id: 'knowledge', label: 'Packets' },
        ] as { id: CommunityTab; label: string }[]).map(t => (
          <TouchableOpacity
            key={t.id}
            style={[styles.communityTab, communityTab === t.id && styles.communityTabActive]}
            onPress={() => setCommunityTab(t.id)}
          >
            <Text style={[styles.communityTabText, communityTab === t.id && styles.communityTabTextActive]}>
              {t.label}
            </Text>
            {t.id === 'threads' && threads.filter(th => !th.isResolved).length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{threads.filter(th => !th.isResolved).length}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {communityTab === 'captures' && (
        <ScrollView
          style={styles.flex1}
          contentContainerStyle={styles.capturesOuter}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
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

          {/* Featured content always visible */}
          {activeCategory === 'All' && !search && (
            <>
              <Text style={styles.sectionLabel}>📌 FROM VIBECODED</Text>
              {FEATURED_CAPTURES.map(capture => (
                <ExploreCard
                  key={capture.id}
                  capture={capture}
                  reaction={reactions[capture.id]}
                  onPress={() => {}}
                  onReact={() => {}}
                  featured
                />
              ))}
            </>
          )}

          {/* Community captures from backend */}
          {activeCategory === 'All' && !search && publicCaptures.length > 0 && (
            <>
              <Text style={[styles.sectionLabel, { marginTop: 16 }]}>🔥 FROM THE COMMUNITY</Text>
              {publicCaptures.map(c => (
                <ExploreCard
                  key={c.id}
                  capture={{
                    id: c.id,
                    title: c.title,
                    sourceUrl: c.sourceUrl ?? '',
                    sourceType: (c.sourceType as any) ?? 'video',
                    creator: c.creator ?? c.authorName,
                    platform: c.platform ?? 'Vibecoded',
                    date: new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                    stars: 0,
                    starred: false,
                    isPublic: true,
                    pushed: true,
                    pinned: false,
                    preview: c.preview,
                    category: c.category ?? undefined,
                  }}
                  reaction={reactions[c.id]}
                  onPress={() => {}}
                  onReact={() => {}}
                />
              ))}
            </>
          )}

          {/* Local public captures from this device */}
          {filtered.length === 0 && !search && publicCaptures.length === 0 ? (
            <View style={styles.communityHint}>
              <Ionicons name="people-outline" size={16} color={Colors.primary} />
              <Text style={styles.communityHintText}>
                Open any of your captures and tap the globe icon to share it with the community.
              </Text>
            </View>
          ) : filtered.length === 0 && search ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No captures match</Text>
              <Text style={styles.emptyBody}>Try a different search or category.</Text>
            </View>
          ) : filtered.length > 0 ? (
            <>
              {activeCategory === 'All' && !search && (
                <Text style={styles.sectionLabel}>📱 YOUR PUBLIC CAPTURES</Text>
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
          ) : null}
        </ScrollView>
      )}

      {communityTab === 'threads' && (
        threadsLoading ? (
          <View style={styles.threadsLoading}>
            <ActivityIndicator color={Colors.primary} />
            <Text style={styles.threadsLoadingText}>Loading threads…</Text>
          </View>
        ) : threadsError ? (
          <View style={styles.empty}>
            <Text style={styles.emptyHeroEmoji}>⚠️</Text>
            <Text style={styles.emptyTitle}>Couldn't load threads</Text>
            <Text style={styles.emptyBody}>Check your connection and try again.</Text>
            <TouchableOpacity style={styles.emptyAction} onPress={() => loadThreads()}>
              <Text style={styles.emptyActionText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={threadsRefreshing}
                onRefresh={() => loadThreads(true)}
                tintColor={Colors.primary}
              />
            }
          >
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
              threads.map(thread => (
                <RedditThreadCard
                  key={thread.id}
                  thread={thread}
                  onPress={() => router.push(`/thread/${thread.id}` as any)}
                  onVote={async (v) => {
                    const res = await voteThread(thread.id, v)
                    setThreads(prev => prev.map(t => t.id === thread.id
                      ? { ...t, upvotes: res.upvotes, myVote: res.myVote }
                      : t
                    ))
                  }}
                />
              ))
            )}
          </ScrollView>
        )
      )}

      {communityTab === 'knowledge' && (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.launchHeader}>
            <Text style={styles.launchHeaderTitle}>Knowledge Packets</Text>
            <Text style={styles.launchHeaderSub}>Expert knowledge, structured for builders</Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
            style={styles.filterRow}
          >
            {[{ id: undefined, label: 'All', emoji: '📦' }, ...PACKET_CATEGORIES].map(c => (
              <TouchableOpacity
                key={c.id ?? 'all'}
                style={[styles.filterChip, activePacketCat === c.id && styles.filterChipActive]}
                onPress={() => {
                  setActivePacketCat(c.id)
                  loadPackets(c.id)
                }}
              >
                <Text style={styles.filterChipText}>{c.emoji} {c.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {packetsLoading ? (
            <View style={styles.threadsLoading}>
              <ActivityIndicator color={Colors.primary} />
            </View>
          ) : packets.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyHeroEmoji}>📦</Text>
              <Text style={styles.emptyTitle}>No packets yet</Text>
              <Text style={styles.emptyBody}>
                Creators publish structured knowledge packets here. Be the first — tap Create above.
              </Text>
              <TouchableOpacity style={styles.emptyAction} onPress={() => router.push('/creator-apply' as any)}>
                <Text style={styles.emptyActionText}>Apply to be a creator</Text>
              </TouchableOpacity>
            </View>
          ) : (
            packets.map(p => <PacketCard key={p.id} packet={p} onPress={() => router.push(`/packet/${p.id}` as any)} />)
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
          {productsError ? (
            <View style={styles.empty}>
              <Text style={styles.emptyHeroEmoji}>⚠️</Text>
              <Text style={styles.emptyTitle}>Couldn't load launches</Text>
              <Text style={styles.emptyBody}>Check your connection and try again.</Text>
              <TouchableOpacity
                style={styles.emptyAction}
                onPress={() => {
                  setProductsError(false)
                  getProducts().then(setProducts).catch(() => setProductsError(true))
                }}
              >
                <Text style={styles.emptyActionText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : products.length === 0 ? (
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

function RedditThreadCard({
  thread, onPress, onVote,
}: {
  thread: Thread
  onPress: () => void
  onVote: (v: 1 | -1) => void
}) {
  return (
    <TouchableOpacity style={styles.redditCard} onPress={onPress} activeOpacity={0.88}>
      {/* Author row */}
      <View style={styles.redditMeta}>
        <View style={styles.redditAvatar}>
          <Text style={styles.redditAvatarText}>{thread.authorName.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.redditAuthor}>
          {thread.authorHandle ? `@${thread.authorHandle}` : thread.authorName}
        </Text>
        <Text style={styles.redditDot}>·</Text>
        <Text style={styles.redditTime}>{formatRelTime(thread.createdAt)}</Text>
        {thread.isResolved && (
          <>
            <Text style={styles.redditDot}>·</Text>
            <View style={styles.resolvedPill}>
              <Ionicons name="checkmark-circle" size={10} color={Colors.success} />
              <Text style={styles.resolvedPillText}>Resolved</Text>
            </View>
          </>
        )}
      </View>

      {/* Title */}
      <Text style={styles.redditTitle} numberOfLines={2}>{thread.title}</Text>

      {/* Tags */}
      {thread.tags.length > 0 && (
        <View style={styles.redditTagRow}>
          {thread.tags.slice(0, 3).map(tag => (
            <View key={tag} style={styles.redditTag}>
              <Text style={styles.redditTagText}>{tag}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Footer actions */}
      <View style={styles.redditFooter}>
        <View style={styles.redditVoteRow}>
          <TouchableOpacity
            style={[styles.redditVoteBtn, thread.myVote === 1 && styles.redditVoteBtnUp]}
            onPress={e => { e.stopPropagation?.(); onVote(1) }}
          >
            <Ionicons
              name="arrow-up"
              size={14}
              color={thread.myVote === 1 ? '#fff' : Colors.textSecondary}
            />
          </TouchableOpacity>
          <Text style={[styles.redditVoteCount, thread.myVote != null && styles.redditVoteCountActive]}>
            {thread.upvotes}
          </Text>
          <TouchableOpacity
            style={[styles.redditVoteBtn, thread.myVote === -1 && styles.redditVoteBtnDown]}
            onPress={e => { e.stopPropagation?.(); onVote(-1) }}
          >
            <Ionicons
              name="arrow-down"
              size={14}
              color={thread.myVote === -1 ? '#fff' : Colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.redditCommentRow}>
          <Ionicons name="chatbubble-outline" size={13} color={Colors.textSecondary} />
          <Text style={styles.redditCommentCount}>{thread.replyCount}</Text>
        </View>
      </View>
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

function PacketCard({ packet, onPress }: { packet: Packet; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.packetCard} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.packetEmoji}>
        <Text style={styles.packetEmojiText}>{packet.coverEmoji}</Text>
      </View>
      <View style={styles.packetInfo}>
        <Text style={styles.packetTitle} numberOfLines={2}>{packet.title}</Text>
        {packet.description ? (
          <Text style={styles.packetDesc} numberOfLines={1}>{packet.description}</Text>
        ) : null}
        <View style={styles.packetMeta}>
          <Text style={styles.packetAuthor}>{packet.authorName}</Text>
          <Text style={styles.packetDot}>·</Text>
          <Text style={styles.packetStat}>{packet.chapterCount} chapters</Text>
          <Text style={styles.packetDot}>·</Text>
          <Text style={styles.packetStat}>{packet.totalReads} reads</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} />
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
    marginBottom: Spacing.sm,
    backgroundColor: Colors.card, borderRadius: Radius.full,
    paddingHorizontal: Spacing.md, paddingVertical: 10,
    ...Shadow.card,
  },
  searchInput: { flex: 1, fontSize: 14, color: Colors.text },
  filterRow: { marginBottom: Spacing.sm, marginHorizontal: -Spacing.lg },
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
  flex1: { flex: 1 },
  scroll: { padding: Spacing.lg, paddingBottom: 40 },
  capturesOuter: { padding: Spacing.lg, paddingBottom: 40 },
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
    backgroundColor: Colors.card,
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
  // Threads loading
  threadsLoading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  threadsLoadingText: { fontSize: 14, color: Colors.textSecondary },

  // Reddit-style thread cards
  redditCard: {
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    padding: Spacing.md, marginBottom: 2, ...Shadow.card,
  },
  redditMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  redditAvatar: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  redditAvatarText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  redditAuthor: { fontSize: 12, fontWeight: '600', color: Colors.text },
  redditDot: { fontSize: 12, color: Colors.textTertiary },
  redditTime: { fontSize: 12, color: Colors.textSecondary },
  resolvedPill: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  resolvedPillText: { fontSize: 11, fontWeight: '600', color: Colors.success },
  redditTitle: { fontSize: 15, fontWeight: '700', color: Colors.text, lineHeight: 21, marginBottom: 8 },
  redditTagRow: { flexDirection: 'row', gap: 5, marginBottom: 10, flexWrap: 'wrap' },
  redditTag: {
    paddingHorizontal: 8, paddingVertical: 3,
    backgroundColor: Colors.accent + '15', borderRadius: Radius.full,
  },
  redditTagText: { fontSize: 10, fontWeight: '600', color: Colors.accent },
  redditFooter: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg },
  redditVoteRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  redditVoteBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center',
  },
  redditVoteBtnUp: { backgroundColor: Colors.primary },
  redditVoteBtnDown: { backgroundColor: Colors.error },
  redditVoteCount: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary, minWidth: 20, textAlign: 'center' },
  redditVoteCountActive: { color: Colors.primary },
  redditCommentRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  redditCommentCount: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
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
  packetCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.card, borderRadius: Radius.xl,
    padding: Spacing.md, marginBottom: Spacing.sm, ...Shadow.card,
  },
  packetEmoji: {
    width: 52, height: 52, borderRadius: Radius.lg,
    backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center',
  },
  packetEmojiText: { fontSize: 28 },
  packetInfo: { flex: 1 },
  packetTitle: { fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: 2 },
  packetDesc: { ...Typography.caption, color: Colors.textSecondary, marginBottom: 4 },
  packetMeta: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  packetAuthor: { fontSize: 11, fontWeight: '600', color: Colors.primary },
  packetDot: { fontSize: 11, color: Colors.textTertiary },
  packetStat: { fontSize: 11, color: Colors.textSecondary },
})
