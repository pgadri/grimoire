import {
  View, Text, StyleSheet, Modal, ScrollView,
  TouchableOpacity, Alert, Linking,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import * as Clipboard from 'expo-clipboard'
import { Colors, Spacing, Radius, Shadow, Typography } from '../constants/theme'

type Props = {
  visible: boolean
  onClose: () => void
}

export function SettingsModal({ visible, onClose }: Props) {
  const router = useRouter()

  const go = (route: string) => {
    onClose()
    setTimeout(() => router.push(route as any), 300)
  }

  const handleCopyHandle = async () => {
    await Clipboard.setStringAsync('@pgadri')
    Alert.alert('Copied', '@pgadri copied to clipboard.')
  }

  const handleEditProfile = () => {
    Alert.alert('Edit Profile', 'Profile editing coming soon.')
  }

  const handlePrivacy = () => {
    Alert.alert('Privacy & Visibility', 'Control who sees your captures and maps.\n\nFull privacy settings coming soon.')
  }

  const handleSubscription = () => {
    Alert.alert(
      'Grimoire Plans',
      '✦ Free\nUnlimited captures, 3 public maps, Explore access\n\n✦ Creator — $9/mo\nUnlimited maps, sell in Explore, analytics, priority AI\n\n✦ Pro — $19/mo\nTeam workspace, custom domain, API access\n\nBilling coming soon.',
      [{ text: 'Got it' }]
    )
  }

  const handleHelp = () => {
    Linking.openURL('mailto:hello@grimoire.app?subject=Help%20%26%20Feedback').catch(() => {
      Alert.alert('Send feedback', 'Email us at hello@grimoire.app')
    })
  }

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      "You'll need to sign in again to access your captures.",
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: () => Alert.alert('Signed out', 'Auth flow coming soon.') },
      ]
    )
  }

  const MENU = [
    { icon: 'shield-checkmark-outline' as const, label: 'Expert Review', sub: 'Get your code audited before launch', onPress: () => go('/review') },
    { icon: 'people-outline' as const, label: 'Team Workspace', sub: 'Collaborate with your team', onPress: () => go('/team') },
    { icon: 'flash-outline' as const, label: 'Connectors', sub: 'GitHub, OpenAI, Notion', onPress: () => go('/connectors') },
    { icon: 'lock-closed-outline' as const, label: 'Privacy & Visibility', sub: 'Who can see your maps', onPress: handlePrivacy },
    { icon: 'card-outline' as const, label: 'Subscription', sub: 'Free plan · Upgrade', onPress: handleSubscription },
    { icon: 'help-circle-outline' as const, label: 'Help & Feedback', sub: 'hello@grimoire.app', onPress: handleHelp },
  ]

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen">
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />
        <View style={styles.sheet}>
          <View style={styles.dragHandle} />

          {/* Profile block */}
          <View style={styles.profileBlock}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>P</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.name}>Pericles Gadri</Text>
              <TouchableOpacity style={styles.handleRow} onPress={handleCopyHandle}>
                <Text style={styles.handleText}>@pgadri</Text>
                <Ionicons name="copy-outline" size={13} color={Colors.accent} />
              </TouchableOpacity>
            </View>
            <View style={styles.planBadge}>
              <Text style={styles.planText}>FREE</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.editBtn} onPress={handleEditProfile}>
            <Text style={styles.editBtnText}>Edit Profile</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <ScrollView showsVerticalScrollIndicator={false}>
            {MENU.map(item => (
              <TouchableOpacity key={item.label} style={styles.menuRow} onPress={item.onPress}>
                <View style={styles.menuIcon}>
                  <Ionicons name={item.icon} size={18} color={Colors.primary} />
                </View>
                <View style={styles.menuText}>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  <Text style={styles.menuSub}>{item.sub}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} />
              </TouchableOpacity>
            ))}

            <TouchableOpacity style={styles.signOut} onPress={handleSignOut}>
              <Ionicons name="log-out-outline" size={18} color={Colors.error} />
              <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: Colors.overlay },
  sheet: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing.xl,
    paddingBottom: 48,
    maxHeight: '85%',
  },
  dragHandle: {
    width: 36, height: 4, backgroundColor: Colors.border,
    borderRadius: Radius.full, alignSelf: 'center', marginBottom: Spacing.xl,
  },
  profileBlock: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.md,
  },
  avatar: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: Colors.card, fontSize: 22, fontWeight: '700' },
  profileInfo: { flex: 1 },
  name: { fontSize: 17, fontWeight: '700', color: Colors.text, marginBottom: 3 },
  handleRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  handleText: { ...Typography.caption, color: Colors.accent, fontWeight: '500' },
  planBadge: {
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: Radius.full,
  },
  planText: { fontSize: 10, fontWeight: '700', color: Colors.primary, letterSpacing: 0.8 },
  editBtn: {
    borderWidth: 1.5, borderColor: Colors.primary,
    borderRadius: Radius.full, paddingVertical: 10,
    alignItems: 'center', marginBottom: Spacing.lg,
  },
  editBtnText: { ...Typography.button, color: Colors.primary },
  divider: { height: 1, backgroundColor: Colors.border, marginBottom: Spacing.md },
  menuRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  menuIcon: {
    width: 36, height: 36, borderRadius: Radius.sm,
    backgroundColor: Colors.primary + '12',
    alignItems: 'center', justifyContent: 'center',
  },
  menuText: { flex: 1 },
  menuLabel: { ...Typography.cardBody, color: Colors.text, fontWeight: '500' },
  menuSub: { ...Typography.caption, color: Colors.textSecondary, marginTop: 1 },
  signOut: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    justifyContent: 'center', paddingTop: Spacing.xl,
  },
  signOutText: { ...Typography.button, color: Colors.error },
})
