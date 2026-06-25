import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { Colors, Spacing, Radius, Shadow, Typography } from '../../constants/theme'

const STATS = [
  { label: 'Captures', value: '68' },
  { label: 'Stars', value: '1.2k' },
  { label: 'Maps', value: '3' },
  { label: 'Remixes', value: '191' },
]

export default function ProfileScreen() {
  const router = useRouter()

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.heading}>Profile</Text>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/connectors')}>
          <Ionicons name="settings-outline" size={20} color={Colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>P</Text>
          </View>
          <Text style={styles.name}>Pericles Gadri</Text>
          <Text style={styles.handle}>@pgadri</Text>
          <Text style={styles.bio}>Vibe coder. Building Grimoire and FamLoan. Learning in public.</Text>

          <View style={styles.statsRow}>
            {STATS.map(s => (
              <View key={s.label} style={styles.stat}>
                <Text style={styles.statValue}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.editBtn}>
            <Text style={styles.editBtnText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionLabel}>MY PUBLIC MAPS</Text>

        {['How to Launch an App', 'Monetization Tactics'].map(title => (
          <TouchableOpacity key={title} style={styles.mapRow}>
            <Ionicons name="library-outline" size={18} color={Colors.accent} />
            <Text style={styles.mapTitle}>{title}</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} />
          </TouchableOpacity>
        ))}

        <Text style={[styles.sectionLabel, { marginTop: Spacing.xl }]}>ACCOUNT</Text>

        {[
          { icon: 'flash-outline' as const, label: 'Connectors', route: '/connectors' },
          { icon: 'lock-closed-outline' as const, label: 'Privacy & Visibility', route: null },
          { icon: 'card-outline' as const, label: 'Subscription', route: null },
          { icon: 'help-circle-outline' as const, label: 'Help & Feedback', route: null },
        ].map(item => (
          <TouchableOpacity
            key={item.label}
            style={styles.menuRow}
            onPress={() => item.route && router.push(item.route as any)}
          >
            <View style={styles.menuIcon}>
              <Ionicons name={item.icon} size={18} color={Colors.primary} />
            </View>
            <Text style={styles.menuLabel}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} />
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={styles.signOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  heading: { fontSize: 24, fontWeight: '700', color: Colors.text },
  iconBtn: {
    width: 36, height: 36, borderRadius: Radius.full,
    backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center',
    ...Shadow.card,
  },
  scroll: { paddingHorizontal: Spacing.lg, paddingBottom: 40 },
  profileCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.xl,
    ...Shadow.card,
  },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  avatarText: { color: Colors.card, fontSize: 28, fontWeight: '700' },
  name: { fontSize: 20, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  handle: { ...Typography.caption, color: Colors.accent, marginBottom: Spacing.sm },
  bio: {
    ...Typography.cardBody, color: Colors.textSecondary,
    textAlign: 'center', lineHeight: 20, marginBottom: Spacing.xl,
  },
  statsRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around',
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  stat: { alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '700', color: Colors.text },
  statLabel: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  editBtn: {
    borderWidth: 1.5, borderColor: Colors.primary,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.xl, paddingVertical: 10,
  },
  editBtnText: { ...Typography.button, color: Colors.primary },
  sectionLabel: { ...Typography.sectionLabel, color: Colors.sectionLabel, marginBottom: Spacing.md },
  mapRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.card, borderRadius: Radius.md,
    padding: Spacing.md, marginBottom: Spacing.sm, ...Shadow.card,
  },
  mapTitle: { ...Typography.cardBody, color: Colors.text, flex: 1 },
  menuRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.card, borderRadius: Radius.md,
    padding: Spacing.md, marginBottom: Spacing.sm, ...Shadow.card,
  },
  menuIcon: {
    width: 36, height: 36, borderRadius: Radius.sm,
    backgroundColor: Colors.primary + '12',
    alignItems: 'center', justifyContent: 'center',
  },
  menuLabel: { ...Typography.cardBody, color: Colors.text, flex: 1 },
  signOut: {
    marginTop: Spacing.xl, alignItems: 'center', padding: Spacing.md,
  },
  signOutText: { ...Typography.button, color: Colors.error },
})
