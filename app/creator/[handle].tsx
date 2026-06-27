import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Linking, Share, Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useState, useEffect, useCallback } from 'react'
import { useFocusEffect } from 'expo-router'
import { Colors, Spacing, Radius, Shadow, Typography } from '../../constants/theme'
import { getCreatorProfile, followCreator, unfollowCreator, type CreatorProfile } from '../../lib/creator'
import { getUser } from '../../lib/auth'

const SOCIAL_LINKS = [
  { key: 'youtubeUrl',    icon: 'logo-youtube',  label: 'YouTube',     color: '#FF0000' },
  { key: 'twitterUrl',    icon: 'logo-twitter',  label: 'X / Twitter', color: '#1DA1F2' },
  { key: 'newsletterUrl', icon: 'mail',          label: 'Newsletter',  color: '#F59E0B' },
  { key: 'websiteUrl',    icon: 'globe',         label: 'Website',     color: Colors.primary },
] as const

export default function CreatorProfileScreen() {
  const { handle } = useLocalSearchParams<{ handle: string }>()
  const router = useRouter()
  const [profile, setProfile]       = useState<CreatorProfile | null>(null)
  const [loading, setLoading]       = useState(true)
  const [notFound, setNotFound]     = useState(false)
  const [followLoading, setFollowLoading] = useState(false)
  const [myId, setMyId]             = useState<string | null>(null)

  useFocusEffect(useCallback(() => {
    let active = true
    async function load() {
      const [me, prof] = await Promise.all([
        getUser(),
        getCreatorProfile(handle).catch(() => null),
      ])
      if (!active) return
      setMyId(me?.id ?? null)
      if (!prof) { setNotFound(true); setLoading(false); return }
      setProfile(prof)
      setLoading(false)
    }
    load()
    return () => { active = false }
  }, [handle]))

  const handleFollow = async () => {
    if (!profile || followLoading) return
    setFollowLoading(true)
    try {
      if (profile.isFollowing) {
        await unfollowCreator(profile.id)
        setProfile(p => p ? { ...p, isFollowing: false, followerCount: Math.max(0, p.followerCount - 1) } : p)
      } else {
        await followCreator(profile.id)
        setProfile(p => p ? { ...p, isFollowing: true, followerCount: p.followerCount + 1 } : p)
      }
    } catch {
      Alert.alert('Error', 'Could not update follow status. Try again.')
    } finally {
      setFollowLoading(false)
    }
  }

  const handleShare = async () => {
    if (!profile) return
    await Share.share({
      message: `Follow @${profile.handle} on Vibecoded — building in public and sharing what they learn.\n\nvibecoded.tech/@${profile.handle}`,
      url: `https://vibecoded.tech/@${profile.handle}`,
    })
  }

  const initial = profile?.name?.[0]?.toUpperCase() ?? '?'
  const isOwnProfile = myId && profile && myId === profile.id

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.loadingCenter}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      </SafeAreaView>
    )
  }

  if (notFound) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.loadingCenter}>
          <Text style={styles.notFoundEmoji}>👤</Text>
          <Text style={styles.notFoundTitle}>Creator not found</Text>
          <Text style={styles.notFoundSub}>@{handle} hasn't enabled Creator Mode yet.</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Nav */}
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.navBtn}>
          <Ionicons name="arrow-back" size={20} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.navHandle}>@{profile!.handle}</Text>
        <TouchableOpacity onPress={handleShare} style={styles.navBtn}>
          <Ionicons name="share-outline" size={20} color={Colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Profile header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>

          <View style={styles.creatorBadge}>
            <Ionicons name="sparkles" size={11} color={Colors.primary} />
            <Text style={styles.creatorBadgeText}>CREATOR</Text>
          </View>

          <Text style={styles.name}>{profile!.name}</Text>
          <Text style={styles.handle}>@{profile!.handle}</Text>

          {profile!.bio ? (
            <Text style={styles.bio}>{profile!.bio}</Text>
          ) : null}

          {/* Follower stats */}
          <View style={styles.statsRow}>
            <TouchableOpacity
              style={styles.stat}
              onPress={() => router.push(`/creator-followers/${profile!.handle}` as any)}
            >
              <Text style={styles.statValue}>{profile!.followerCount.toLocaleString()}</Text>
              <Text style={styles.statLabel}>followers</Text>
            </TouchableOpacity>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{profile!.followingCount.toLocaleString()}</Text>
              <Text style={styles.statLabel}>following</Text>
            </View>
          </View>

          {/* Follow / Edit button */}
          {!isOwnProfile ? (
            <TouchableOpacity
              style={[styles.followBtn, profile!.isFollowing && styles.followBtnActive]}
              onPress={handleFollow}
              disabled={followLoading}
              activeOpacity={0.85}
            >
              {followLoading
                ? <ActivityIndicator size="small" color={profile!.isFollowing ? Colors.primary : '#fff'} />
                : <Text style={[styles.followBtnText, profile!.isFollowing && styles.followBtnTextActive]}>
                    {profile!.isFollowing ? 'Following' : 'Follow'}
                  </Text>}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.editProfileBtn}
              onPress={() => router.push('/creator-setup' as any)}
            >
              <Text style={styles.editProfileBtnText}>Edit creator profile</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Social links */}
        {SOCIAL_LINKS.some(l => profile![l.key as keyof CreatorProfile]) && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>FIND ME ON</Text>
            <View style={styles.socialGrid}>
              {SOCIAL_LINKS.map(link => {
                const url = profile![link.key as keyof CreatorProfile] as string | undefined
                if (!url) return null
                return (
                  <TouchableOpacity
                    key={link.key}
                    style={[styles.socialBtn, { borderColor: link.color + '40' }]}
                    onPress={() => Linking.openURL(url)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name={link.icon as any} size={18} color={link.color} />
                    <Text style={[styles.socialBtnText, { color: link.color }]}>{link.label}</Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          </View>
        )}

        {/* Link kit */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>PROFILE LINK</Text>
          <View style={styles.linkKitCard}>
            <View style={styles.linkKitLeft}>
              <Ionicons name="link-outline" size={16} color={Colors.primary} />
              <Text style={styles.linkKitUrl}>vibecoded.tech/@{profile!.handle}</Text>
            </View>
            <TouchableOpacity
              onPress={handleShare}
              style={styles.linkKitShare}
            >
              <Text style={styles.linkKitShareText}>Share</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.linkKitHint}>
            Drop this in your YouTube description, X bio, or anywhere you post. Followers land here and can follow you on Vibecoded.
          </Text>
        </View>

        {/* Creator since */}
        {profile!.creatorSince && (
          <Text style={styles.creatorSince}>
            Creator since {new Date(profile!.creatorSince).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  loadingCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  notFoundEmoji: { fontSize: 44 },
  notFoundTitle: { fontSize: 20, fontWeight: '700', color: Colors.text },
  notFoundSub: { fontSize: 14, color: Colors.textSecondary },

  navBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  navBtn: {
    width: 36, height: 36, borderRadius: Radius.full,
    backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center',
    ...Shadow.card,
  },
  navHandle: { fontSize: 15, fontWeight: '700', color: Colors.text },
  backBtn: { padding: Spacing.lg },

  scroll: { padding: Spacing.lg, paddingBottom: 48 },

  profileHeader: { alignItems: 'center', gap: Spacing.sm, paddingBottom: Spacing.xl },
  avatar: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.sm, ...Shadow.card,
  },
  avatarText: { color: '#fff', fontSize: 34, fontWeight: '800' },

  creatorBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.primary + '15', borderRadius: Radius.full,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  creatorBadgeText: { fontSize: 10, fontWeight: '800', color: Colors.primary, letterSpacing: 1 },

  name: { fontSize: 24, fontWeight: '800', color: Colors.text },
  handle: { fontSize: 14, color: Colors.textSecondary, fontWeight: '500' },
  bio: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 21, paddingHorizontal: Spacing.lg },

  statsRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xl },
  stat: { alignItems: 'center', gap: 2 },
  statValue: { fontSize: 22, fontWeight: '800', color: Colors.text },
  statLabel: { fontSize: 12, color: Colors.textSecondary },
  statDivider: { width: 1, height: 28, backgroundColor: Colors.border },

  followBtn: {
    backgroundColor: Colors.primary, borderRadius: Radius.full,
    paddingHorizontal: Spacing.xl * 1.5, paddingVertical: 13,
    minWidth: 140, alignItems: 'center', ...Shadow.card,
  },
  followBtnActive: {
    backgroundColor: Colors.card, borderWidth: 2, borderColor: Colors.primary,
  },
  followBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  followBtnTextActive: { color: Colors.primary },
  editProfileBtn: {
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.full,
    paddingHorizontal: Spacing.xl, paddingVertical: 11,
  },
  editProfileBtnText: { fontSize: 14, fontWeight: '600', color: Colors.text },

  section: { marginBottom: Spacing.xl },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: Colors.textSecondary,
    letterSpacing: 0.8, marginBottom: Spacing.sm,
  },

  socialGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  socialBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: Colors.card, borderRadius: Radius.full,
    paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1.5, ...Shadow.card,
  },
  socialBtnText: { fontSize: 13, fontWeight: '700' },

  linkKitCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    padding: Spacing.md, ...Shadow.card,
    borderWidth: 1, borderColor: Colors.primary + '30',
  },
  linkKitLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  linkKitUrl: { fontSize: 13, fontWeight: '600', color: Colors.primary, flex: 1 },
  linkKitShare: {
    backgroundColor: Colors.primary, borderRadius: Radius.full,
    paddingHorizontal: 14, paddingVertical: 7,
  },
  linkKitShareText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  linkKitHint: { fontSize: 12, color: Colors.textSecondary, marginTop: 8, lineHeight: 17 },

  creatorSince: { fontSize: 12, color: Colors.textTertiary, textAlign: 'center', paddingTop: Spacing.md },
})
