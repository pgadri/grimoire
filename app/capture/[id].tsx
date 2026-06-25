import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Share, Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useState } from 'react'
import { Colors, Spacing, Radius, Shadow, Typography } from '../../constants/theme'

const MOCK_DETAIL = {
  id: '1',
  title: 'How I got my first 1000 users without spending a dollar on ads',
  creator: '@indiefounder',
  platform: 'Instagram',
  date: 'June 24, 2026',
  sourceUrl: 'https://instagram.com/reel/abc',
  stars: 142,
  starred: false,
  isPublic: true,
  pushed: true,
  knowledge: {
    concepts: [
      'Launch to your existing network first — DMs convert 10x better than posts',
      'Your first 10 users should be people who already trust you',
      "Don't announce to strangers. Infiltrate communities where your users already are",
      'Product Hunt is a launchpad, not a growth engine — use it once, not as a strategy',
    ],
    actions: [
      'List 20 people in your network to personally message today',
      'Find 3 online communities where your target user hangs out',
      'Write a personal message, not a pitch — ask for feedback, not signups',
    ],
    quotes: [
      '"Don\'t launch. Infiltrate."',
      '"Your first 100 users are a sales problem, not a marketing problem."',
    ],
  },
  rawTranscript: `So the biggest mistake I see founders make is they treat getting users like a marketing campaign. They build a landing page, they post on Twitter, they submit to Product Hunt, and then wonder why nobody signs up.

Here's what actually works: you treat your first 100 users like a sales problem, not a marketing problem. That means personal outreach. That means DMs. That means getting on calls.

I sent 200 personal messages in the first week. Not templates. Personal messages to people I actually knew or had talked to before. My conversion rate was about 15%. That's 30 users from 200 messages.

The key insight is this: don't launch. Infiltrate. Find the communities where your users already hang out. Reddit threads, Discord servers, Slack groups, Facebook groups. Become a helpful member first. Then when you share what you built, people are already warm.

Product Hunt is a nice ego boost but I've never gotten sustainable users from it. It's a one-time spike at best.`,
}

type Tab = 'knowledge' | 'raw'

export default function CaptureDetail() {
  const { id } = useLocalSearchParams()
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('knowledge')
  const [starred, setStarred] = useState(MOCK_DETAIL.starred)
  const [stars, setStars] = useState(MOCK_DETAIL.stars)
  const [pushed, setPushed] = useState(MOCK_DETAIL.pushed)

  const handleStar = () => {
    setStarred(prev => !prev)
    setStars(prev => starred ? prev - 1 : prev + 1)
  }

  const handlePush = () => {
    setPushed(true)
    Alert.alert('Pushed!', 'This capture has been pushed to your connected services.')
  }

  const handleShare = async () => {
    await Share.share({
      title: MOCK_DETAIL.title,
      message: `Check out this capture on Grimoire: ${MOCK_DETAIL.title}`,
    })
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.navActions}>
          <TouchableOpacity style={styles.iconBtn} onPress={handleStar}>
            <Ionicons
              name={starred ? 'star' : 'star-outline'}
              size={20}
              color={starred ? Colors.gold : Colors.text}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={handlePush}>
            <Ionicons
              name={pushed ? 'checkmark-circle' : 'cloud-upload-outline'}
              size={20}
              color={pushed ? Colors.success : Colors.text}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={handleShare}>
            <Ionicons name="share-outline" size={20} color={Colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.meta}>
          <Text style={styles.platform}>{MOCK_DETAIL.platform} · {MOCK_DETAIL.creator}</Text>
          <Text style={styles.date}>{MOCK_DETAIL.date}</Text>
        </View>

        <Text style={styles.title}>{MOCK_DETAIL.title}</Text>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Ionicons name="star" size={14} color={Colors.gold} />
            <Text style={styles.statText}>{stars} stars</Text>
          </View>
          {MOCK_DETAIL.isPublic && (
            <View style={styles.publicBadge}>
              <Text style={styles.publicText}>PUBLIC</Text>
            </View>
          )}
        </View>

        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, tab === 'knowledge' && styles.tabActive]}
            onPress={() => setTab('knowledge')}
          >
            <Text style={[styles.tabText, tab === 'knowledge' && styles.tabTextActive]}>
              Knowledge
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, tab === 'raw' && styles.tabActive]}
            onPress={() => setTab('raw')}
          >
            <Text style={[styles.tabText, tab === 'raw' && styles.tabTextActive]}>
              Raw
            </Text>
          </TouchableOpacity>
        </View>

        {tab === 'knowledge' ? (
          <View style={styles.knowledge}>
            <KnowledgeSection
              icon="bulb-outline"
              title="KEY CONCEPTS"
              items={MOCK_DETAIL.knowledge.concepts}
              bullet="•"
            />
            <KnowledgeSection
              icon="flash-outline"
              title="ACTION ITEMS"
              items={MOCK_DETAIL.knowledge.actions}
              bullet="→"
              accentColor={Colors.primary}
            />
            <KnowledgeSection
              icon="chatbubble-outline"
              title="BEST QUOTES"
              items={MOCK_DETAIL.knowledge.quotes}
              bullet=""
              italic
            />
          </View>
        ) : (
          <View style={styles.rawContainer}>
            <Text style={styles.rawText}>{MOCK_DETAIL.rawTranscript}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

function KnowledgeSection({
  icon, title, items, bullet, accentColor, italic,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name']
  title: string
  items: string[]
  bullet: string
  accentColor?: string
  italic?: boolean
}) {
  return (
    <View style={sectionStyles.container}>
      <View style={sectionStyles.header}>
        <Ionicons name={icon} size={16} color={Colors.accent} />
        <Text style={sectionStyles.title}>{title}</Text>
      </View>
      <View style={sectionStyles.divider} />
      {items.map((item, i) => (
        <View key={i} style={sectionStyles.item}>
          {bullet ? (
            <Text style={[sectionStyles.bullet, { color: accentColor ?? Colors.accent }]}>
              {bullet}
            </Text>
          ) : null}
          <Text style={[sectionStyles.itemText, italic && { fontStyle: 'italic' }]}>
            {item}
          </Text>
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.card,
  },
  navActions: { flexDirection: 'row', gap: Spacing.sm },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.card,
  },
  scroll: { paddingHorizontal: Spacing.lg, paddingBottom: 40 },
  meta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  platform: { ...Typography.caption, color: Colors.textSecondary },
  date: { ...Typography.caption, color: Colors.textTertiary },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    lineHeight: 30,
    marginBottom: Spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { ...Typography.caption, color: Colors.textSecondary },
  publicBadge: {
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  publicText: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 0.8,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: Radius.full,
    padding: 4,
    marginBottom: Spacing.xl,
    ...Shadow.card,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: Radius.full,
  },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { ...Typography.button, color: Colors.textSecondary },
  tabTextActive: { color: Colors.card },
  knowledge: { gap: Spacing.md },
  rawContainer: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    ...Shadow.card,
  },
  rawText: {
    ...Typography.cardBody,
    color: Colors.text,
    lineHeight: 24,
  },
})

const sectionStyles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    ...Shadow.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  title: {
    ...Typography.sectionLabel,
    color: Colors.sectionLabel,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: Spacing.md,
  },
  item: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
    alignItems: 'flex-start',
  },
  bullet: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
    width: 16,
  },
  itemText: {
    ...Typography.cardBody,
    color: Colors.text,
    lineHeight: 22,
    flex: 1,
  },
})
