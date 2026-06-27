import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform, Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router'
import { useState, useCallback } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Colors, Spacing, Radius, Shadow, Typography } from '../../constants/theme'
import {
  getProducts, getProductReviews, addProductReview, toggleProductUpvote,
  REVIEW_TYPE_LABEL, STAGE_LABEL, formatRelTime,
  type Product, type ProductReview, type ReviewType,
} from '../../lib/community'
import { awardPoints } from '../../lib/reputation'
import {
  TESTING_TIERS, getCampaignForLaunch, createTestCampaign,
  STATUS_LABEL, STATUS_COLOR,
  type TestCampaign, type TestingTier,
} from '../../lib/testing'
import { getUser } from '../../lib/auth'

const USER_KEY = 'grimoire:user'

const REVIEW_OPTIONS: { type: ReviewType; icon: string; label: string; placeholder: string }[] = [
  { type: 'feedback', icon: '💬', label: 'Feedback',    placeholder: 'What works? What could be better?' },
  { type: 'review',   icon: '⭐', label: 'Review',      placeholder: 'What did you think overall?' },
  { type: 'bug',      icon: '🐛', label: 'Bug report',  placeholder: 'What happened? Steps to reproduce?' },
  { type: 'tester',   icon: '🧪', label: 'Be a tester', placeholder: 'Tell the builder a bit about yourself and why you want to test.' },
]

export default function LaunchDetail() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [reviews, setReviews] = useState<ProductReview[]>([])
  const [reviewType, setReviewType] = useState<ReviewType>('feedback')
  const [rating, setRating] = useState(0)
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState<'about' | 'reviews'>('about')
  const [campaign, setCampaign] = useState<TestCampaign | null | undefined>(undefined)
  const [requestingTier, setRequestingTier] = useState<TestingTier | null>(null)

  useFocusEffect(useCallback(() => {
    getProducts().then(all => {
      const found = all.find(p => p.id === id)
      if (found) setProduct(found)
    })
    getProductReviews(id).then(setReviews)
    getCampaignForLaunch(id).then(setCampaign)
  }, [id]))

  const handleUpvote = async () => {
    if (!product) return
    await toggleProductUpvote(product.id)
    const all = await getProducts()
    const found = all.find(p => p.id === id)
    if (found) setProduct(found)
  }

  const handleSubmitReview = async () => {
    if (!body.trim() || !product) return
    setSubmitting(true)
    try {
      const raw = await AsyncStorage.getItem(USER_KEY)
      const user = raw ? JSON.parse(raw) : null
      await addProductReview({
        productId: product.id,
        type: reviewType,
        rating: reviewType === 'review' ? rating || undefined : undefined,
        body: body.trim(),
        authorName: user?.name ?? 'You',
      })
      await awardPoints('product_reviewed', `Reviewed ${product.name}`)
      setBody('')
      setRating(0)
      getProductReviews(id).then(setReviews)
    } finally {
      setSubmitting(false)
    }
  }

  const handleStartCampaign = async (tier: TestingTier) => {
    if (!product) return
    const tierInfo = TESTING_TIERS.find(t => t.id === tier)!
    const user = await getUser()
    const email = user?.email ?? ''
    Alert.alert(
      `Start ${tierInfo.name} campaign?`,
      `${tierInfo.testers} real testers · $${tierInfo.price} · ${tierInfo.turnaround}\n\nWe'll contact you at ${email || 'your email'} to confirm before charging anything.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: `Request — $${tierInfo.price}`,
          onPress: async () => {
            setRequestingTier(tier)
            try {
              const c = await createTestCampaign({
                launchId: product.id,
                appName: product.name,
                tier,
                contactEmail: email,
              })
              setCampaign(c)
            } finally {
              setRequestingTier(null)
            }
          },
        },
      ]
    )
  }

  if (!product) return null

  const currentOption = REVIEW_OPTIONS.find(o => o.type === reviewType)!

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.kav} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.navBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color={Colors.text} />
          </TouchableOpacity>
          {product.url ? (
            <View style={styles.urlBadge}>
              <Ionicons name="link-outline" size={13} color={Colors.primary} />
              <Text style={styles.urlText} numberOfLines={1}>{product.url.replace(/^https?:\/\//, '')}</Text>
            </View>
          ) : <View />}
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Hero */}
          <View style={styles.hero}>
            <View style={styles.logoBox}>
              <Text style={styles.logoEmoji}>{product.logoEmoji}</Text>
            </View>
            <View style={styles.heroInfo}>
              <Text style={styles.productName}>{product.name}</Text>
              <Text style={styles.tagline}>{product.tagline}</Text>
              <View style={styles.heroMeta}>
                <View style={styles.stageBadge}>
                  <Text style={styles.stageBadgeText}>{STAGE_LABEL[product.stage]}</Text>
                </View>
                <Text style={styles.authorText}>by {product.authorName}</Text>
              </View>
            </View>
          </View>

          {/* Upvote + stats */}
          <View style={styles.statsRow}>
            <TouchableOpacity
              style={[styles.upvoteBtn, product.myUpvote && styles.upvoteBtnActive]}
              onPress={handleUpvote}
            >
              <Ionicons
                name={product.myUpvote ? 'chevron-up' : 'chevron-up-outline'}
                size={18}
                color={product.myUpvote ? '#fff' : Colors.primary}
              />
              <Text style={[styles.upvoteCount, product.myUpvote && styles.upvoteCountActive]}>
                {product.upvotes}
              </Text>
            </TouchableOpacity>

            <View style={styles.stat}>
              <Ionicons name="chatbubble-outline" size={14} color={Colors.textSecondary} />
              <Text style={styles.statText}>{reviews.length} {reviews.length === 1 ? 'response' : 'responses'}</Text>
            </View>

            <View style={styles.categoryChip}>
              <Text style={styles.categoryText}>{product.category}</Text>
            </View>
          </View>

          {/* Looking for */}
          {product.lookingFor.length > 0 && (
            <View style={styles.lookingForRow}>
              <Text style={styles.lookingForLabel}>Looking for:</Text>
              {product.lookingFor.map(t => (
                <View key={t} style={styles.lookingForChip}>
                  <Text style={styles.lookingForText}>{REVIEW_TYPE_LABEL[t]}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Tabs */}
          <View style={styles.tabs}>
            {(['about', 'reviews'] as const).map(t => (
              <TouchableOpacity
                key={t}
                style={[styles.tab, activeTab === t && styles.tabActive]}
                onPress={() => setActiveTab(t)}
              >
                <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>
                  {t === 'about' ? 'About' : `Responses (${reviews.length})`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {activeTab === 'about' && (
            <View style={styles.aboutSection}>
              {product.description ? (
                <View style={styles.descCard}>
                  <Text style={styles.descText}>{product.description}</Text>
                </View>
              ) : (
                <Text style={styles.noDesc}>No description provided.</Text>
              )}
              {product.tags.length > 0 && (
                <View style={styles.tagRow}>
                  {product.tags.map(tag => (
                    <View key={tag} style={styles.tag}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              )}
              <Text style={styles.launchDate}>Launched {formatRelTime(product.createdAt)}</Text>

              {/* Testing campaign card */}
              <View style={styles.testingCard}>
                <View style={styles.testingHeader}>
                  <Ionicons name="phone-portrait-outline" size={16} color={Colors.gold} />
                  <Text style={styles.testingTitle}>Boost with real testers</Text>
                  {campaign && (
                    <View style={[styles.campaignStatusPill, { backgroundColor: STATUS_COLOR[campaign.status] + '20' }]}>
                      <Text style={[styles.campaignStatusText, { color: STATUS_COLOR[campaign.status] }]}>
                        {STATUS_LABEL[campaign.status]}
                      </Text>
                    </View>
                  )}
                </View>

                {campaign ? (
                  <View style={styles.campaignActive}>
                    <Text style={styles.campaignActiveText}>
                      {TESTING_TIERS.find(t => t.id === campaign.tier)!.emoji} {TESTING_TIERS.find(t => t.id === campaign.tier)!.name} campaign · {TESTING_TIERS.find(t => t.id === campaign.tier)!.testers} testers
                    </Text>
                    <Text style={styles.campaignActiveSub}>We'll reach out to {campaign.contactEmail} to confirm details.</Text>
                  </View>
                ) : (
                  <>
                    <Text style={styles.testingDesc}>Get real users on real devices. Bug reports, UX feedback, and verified reviews — posted right here.</Text>
                    <View style={styles.tierRow}>
                      {TESTING_TIERS.map(tier => (
                        <TouchableOpacity
                          key={tier.id}
                          style={styles.tierBtn}
                          onPress={() => handleStartCampaign(tier.id)}
                          disabled={requestingTier !== null}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.tierBtnEmoji}>{tier.emoji}</Text>
                          <Text style={styles.tierBtnName}>{tier.name}</Text>
                          <Text style={styles.tierBtnTesters}>{tier.testers} testers</Text>
                          <Text style={styles.tierBtnPrice}>${tier.price}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </>
                )}
              </View>
            </View>
          )}

          {activeTab === 'reviews' && (
            <View style={styles.reviewsSection}>
              {reviews.length === 0 && (
                <View style={styles.emptyReviews}>
                  <Text style={styles.emptyTitle}>No responses yet</Text>
                  <Text style={styles.emptySub}>Be the first to give {product.authorName} feedback.</Text>
                </View>
              )}
              {reviews.map(r => (
                <ReviewCard key={r.id} review={r} />
              ))}
            </View>
          )}

          {/* Compose */}
          <View style={styles.composeSection}>
            <Text style={styles.composeTitle}>Leave a response</Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll}>
              {REVIEW_OPTIONS.filter(o => product.lookingFor.includes(o.type) || product.lookingFor.length === 0).map(opt => (
                <TouchableOpacity
                  key={opt.type}
                  style={[styles.typeBtn, reviewType === opt.type && styles.typeBtnActive]}
                  onPress={() => setReviewType(opt.type)}
                >
                  <Text style={styles.typeEmoji}>{opt.icon}</Text>
                  <Text style={[styles.typeBtnText, reviewType === opt.type && styles.typeBtnTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {reviewType === 'review' && (
              <View style={styles.starRow}>
                {[1, 2, 3, 4, 5].map(n => (
                  <TouchableOpacity key={n} onPress={() => setRating(n)}>
                    <Ionicons
                      name={n <= rating ? 'star' : 'star-outline'}
                      size={28}
                      color={n <= rating ? Colors.gold : Colors.textTertiary}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <TextInput
              style={styles.composeInput}
              placeholder={currentOption.placeholder}
              placeholderTextColor={Colors.textSecondary}
              value={body}
              onChangeText={setBody}
              multiline
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={[styles.submitBtn, (!body.trim() || submitting) && styles.submitBtnDisabled]}
              onPress={handleSubmitReview}
              disabled={!body.trim() || submitting}
            >
              <Text style={styles.submitBtnText}>{submitting ? 'Submitting…' : 'Submit response'}</Text>
            </TouchableOpacity>

            <View style={styles.repNote}>
              <Ionicons name="trending-up-outline" size={13} color={Colors.accent} />
              <Text style={styles.repNoteText}>Submitting earns you +5 reputation points</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

function ReviewCard({ review }: { review: ProductReview }) {
  return (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <View style={styles.reviewTypeChip}>
          <Text style={styles.reviewTypeText}>{REVIEW_TYPE_LABEL[review.type]}</Text>
        </View>
        <Text style={styles.reviewTime}>{formatRelTime(review.createdAt)}</Text>
      </View>
      <Text style={styles.reviewAuthor}>{review.authorName}</Text>
      {review.rating && (
        <View style={styles.ratingRow}>
          {[1, 2, 3, 4, 5].map(n => (
            <Ionicons key={n} name={n <= review.rating! ? 'star' : 'star-outline'} size={14} color={Colors.gold} />
          ))}
        </View>
      )}
      <Text style={styles.reviewBody}>{review.body}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  kav: { flex: 1 },
  navBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: Radius.full,
    backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center', ...Shadow.card,
  },
  urlBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.primary + '12', borderRadius: Radius.full,
    paddingHorizontal: 10, paddingVertical: 5, maxWidth: 200,
  },
  urlText: { ...Typography.caption, color: Colors.primary, fontWeight: '600' },
  scroll: { padding: Spacing.lg, paddingBottom: 40 },
  hero: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.lg },
  logoBox: {
    width: 72, height: 72, borderRadius: Radius.lg,
    backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center', ...Shadow.card,
  },
  logoEmoji: { fontSize: 40 },
  heroInfo: { flex: 1, gap: 4 },
  productName: { fontSize: 22, fontWeight: '800', color: Colors.text },
  tagline: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },
  heroMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  stageBadge: {
    backgroundColor: Colors.primary + '15', borderRadius: Radius.full,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  stageBadgeText: { fontSize: 11, fontWeight: '700', color: Colors.primary },
  authorText: { ...Typography.caption, color: Colors.textSecondary },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.md },
  upvoteBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.primary,
  },
  upvoteBtnActive: { backgroundColor: Colors.primary },
  upvoteCount: { fontSize: 14, fontWeight: '700', color: Colors.primary },
  upvoteCountActive: { color: '#fff' },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { ...Typography.caption, color: Colors.textSecondary },
  categoryChip: {
    backgroundColor: Colors.accent + '15', borderRadius: Radius.full,
    paddingHorizontal: 10, paddingVertical: 4, marginLeft: 'auto' as any,
  },
  categoryText: { fontSize: 11, fontWeight: '700', color: Colors.accent },
  lookingForRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginBottom: Spacing.lg },
  lookingForLabel: { ...Typography.caption, color: Colors.textSecondary, fontWeight: '600' },
  lookingForChip: {
    backgroundColor: Colors.success + '15', borderRadius: Radius.full,
    paddingHorizontal: 9, paddingVertical: 4,
  },
  lookingForText: { fontSize: 11, fontWeight: '600', color: Colors.success },
  tabs: {
    flexDirection: 'row', backgroundColor: Colors.card,
    borderRadius: Radius.full, padding: 3, marginBottom: Spacing.lg, ...Shadow.card,
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: Radius.full },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  tabTextActive: { color: '#fff' },
  aboutSection: { gap: Spacing.md, marginBottom: Spacing.xl },
  descCard: { backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.lg, ...Shadow.card },
  descText: { ...Typography.cardBody, color: Colors.text, lineHeight: 22 },
  noDesc: { ...Typography.cardBody, color: Colors.textTertiary, fontStyle: 'italic' },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { backgroundColor: Colors.accent + '15', borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 4 },
  tagText: { fontSize: 11, fontWeight: '600', color: Colors.accent },
  launchDate: { ...Typography.caption, color: Colors.textTertiary },
  testingCard: {
    backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.md,
    gap: Spacing.sm, ...Shadow.card,
  },
  testingHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  testingTitle: { flex: 1, fontSize: 14, fontWeight: '700', color: Colors.text },
  testingDesc: { fontSize: 13, color: Colors.textSecondary, lineHeight: 19 },
  campaignStatusPill: { borderRadius: Radius.full, paddingHorizontal: 9, paddingVertical: 3 },
  campaignStatusText: { fontSize: 10, fontWeight: '700' },
  campaignActive: { gap: 4 },
  campaignActiveText: { fontSize: 13, fontWeight: '600', color: Colors.text },
  campaignActiveSub: { fontSize: 12, color: Colors.textSecondary },
  tierRow: { flexDirection: 'row', gap: Spacing.sm },
  tierBtn: {
    flex: 1, backgroundColor: Colors.background, borderRadius: Radius.md,
    borderWidth: 1.5, borderColor: Colors.border, padding: Spacing.sm,
    alignItems: 'center', gap: 2,
  },
  tierBtnEmoji: { fontSize: 16 },
  tierBtnName: { fontSize: 12, fontWeight: '700', color: Colors.text },
  tierBtnTesters: { fontSize: 10, color: Colors.textSecondary },
  tierBtnPrice: { fontSize: 13, fontWeight: '800', color: Colors.primary, marginTop: 2 },
  reviewsSection: { gap: Spacing.md, marginBottom: Spacing.xl },
  emptyReviews: { alignItems: 'center', paddingVertical: Spacing.xl },
  emptyTitle: { fontSize: 15, fontWeight: '600', color: Colors.textSecondary },
  emptySub: { ...Typography.caption, color: Colors.textTertiary, marginTop: 4 },
  reviewCard: { backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.lg, ...Shadow.card },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.xs },
  reviewTypeChip: { backgroundColor: Colors.primary + '15', borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 3 },
  reviewTypeText: { fontSize: 10, fontWeight: '700', color: Colors.primary },
  reviewTime: { ...Typography.caption, color: Colors.textTertiary },
  reviewAuthor: { fontSize: 13, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  ratingRow: { flexDirection: 'row', gap: 2, marginBottom: Spacing.sm },
  reviewBody: { ...Typography.cardBody, color: Colors.text, lineHeight: 22 },
  composeSection: { gap: Spacing.md, backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.lg, ...Shadow.card },
  composeTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
  typeScroll: { marginBottom: Spacing.xs },
  typeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.background, marginRight: 8,
  },
  typeBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  typeEmoji: { fontSize: 14 },
  typeBtnText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  typeBtnTextActive: { color: '#fff' },
  starRow: { flexDirection: 'row', gap: 6 },
  composeInput: {
    backgroundColor: Colors.background, borderRadius: Radius.md,
    paddingHorizontal: Spacing.md, paddingVertical: 12,
    fontSize: 14, color: Colors.text, minHeight: 90,
  },
  submitBtn: {
    backgroundColor: Colors.primary, borderRadius: Radius.full,
    paddingVertical: 14, alignItems: 'center',
  },
  submitBtnDisabled: { backgroundColor: Colors.textTertiary },
  submitBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  repNote: { flexDirection: 'row', alignItems: 'center', gap: 5, justifyContent: 'center' },
  repNoteText: { ...Typography.caption, color: Colors.accent, fontWeight: '500' },
})
