import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, TextInput,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { Colors, Spacing, Radius, Shadow, Typography } from '../constants/theme'

type Role = 'admin' | 'editor' | 'viewer'

type Member = {
  id: string
  name: string
  handle: string
  role: Role
  initials: string
  color: string
}

type SharedMap = {
  id: string
  title: string
  emoji: string
  captureCount: number
  lastEdited: string
  editorHandle: string
  isForked: boolean
  forkedFrom?: string
}

const MOCK_MEMBERS: Member[] = [
  { id: '1', name: 'Pericles Gadri', handle: '@pgadri', role: 'admin', initials: 'P', color: Colors.primary },
  { id: '2', name: 'Alex Chen', handle: '@alexchen', role: 'editor', initials: 'A', color: '#10A37F' },
  { id: '3', name: 'Maria Lopez', handle: '@mlopez', role: 'editor', initials: 'M', color: '#F55036' },
  { id: '4', name: 'Sam Wu', handle: '@samwu', role: 'viewer', initials: 'S', color: '#7C5CBF' },
]

const MOCK_SHARED_MAPS: SharedMap[] = [
  {
    id: 'tm1', title: 'Full App Launch Stack', emoji: '🚀',
    captureCount: 47, lastEdited: '2h ago', editorHandle: '@pgadri',
    isForked: false,
  },
  {
    id: 'tm2', title: 'Security Checklist + Prompts', emoji: '🔐',
    captureCount: 31, lastEdited: '1d ago', editorHandle: '@alexchen',
    isForked: true, forkedFrom: '@securitypro',
  },
  {
    id: 'tm3', title: 'Stripe Integration Guide', emoji: '💳',
    captureCount: 18, lastEdited: '3d ago', editorHandle: '@mlopez',
    isForked: false,
  },
]

const ROLE_COLOR: Record<Role, string> = {
  admin: Colors.primary,
  editor: Colors.success,
  viewer: Colors.textSecondary,
}

export default function TeamScreen() {
  const router = useRouter()
  const [showInvite, setShowInvite] = useState(false)
  const [inviteHandle, setInviteHandle] = useState('')
  const [inviteRole, setInviteRole] = useState<Role>('editor')
  const [members, setMembers] = useState(MOCK_MEMBERS)
  const [maps, setMaps] = useState(MOCK_SHARED_MAPS)

  const handleInvite = () => {
    if (!inviteHandle.trim()) return
    const handle = inviteHandle.startsWith('@') ? inviteHandle : `@${inviteHandle}`
    const newMember: Member = {
      id: Date.now().toString(),
      name: handle,
      handle,
      role: inviteRole,
      initials: handle[1]?.toUpperCase() ?? '?',
      color: Colors.gold,
    }
    setMembers(prev => [...prev, newMember])
    setInviteHandle('')
    setShowInvite(false)
    Alert.alert('Invite sent', `${handle} will receive an invitation to join the team.`)
  }

  const handleRoleChange = (memberId: string, member: Member) => {
    if (member.role === 'admin') return
    Alert.alert(`Change ${member.name}'s role`, undefined, [
      { text: 'Make Editor', onPress: () => setMembers(prev => prev.map(m => m.id === memberId ? { ...m, role: 'editor' } : m)) },
      { text: 'Make Viewer', onPress: () => setMembers(prev => prev.map(m => m.id === memberId ? { ...m, role: 'viewer' } : m)) },
      { text: 'Remove from team', style: 'destructive', onPress: () => setMembers(prev => prev.filter(m => m.id !== memberId)) },
      { text: 'Cancel', style: 'cancel' },
    ])
  }

  const handleMapPress = (map: SharedMap) => {
    router.push(`/map/${map.id}`)
  }

  const handleNewMap = () => {
    Alert.alert('New Team Map', 'Create a shared map for your team to collaborate on.\n\nMap creation coming in team canvas update.')
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.teamIdent}>
          <View style={styles.teamLogo}>
            <Text style={styles.teamLogoText}>⚡</Text>
          </View>
          <View>
            <Text style={styles.teamName}>Vibe Builders</Text>
            <Text style={styles.teamPlan}>Team · Pro Plan</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.iconBtn} onPress={() => setShowInvite(true)}>
          <Ionicons name="person-add-outline" size={18} color={Colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Members */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>MEMBERS · {members.length}</Text>
          <TouchableOpacity onPress={() => setShowInvite(true)}>
            <Text style={styles.seeAll}>Invite</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.membersCard}>
          {members.map((member, i) => (
            <TouchableOpacity
              key={member.id}
              style={[styles.memberRow, i < members.length - 1 && styles.memberBorder]}
              onPress={() => handleRoleChange(member.id, member)}
              disabled={member.role === 'admin'}
            >
              <View style={[styles.memberAvatar, { backgroundColor: member.color }]}>
                <Text style={styles.memberInitials}>{member.initials}</Text>
              </View>
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{member.name}</Text>
                <Text style={styles.memberHandle}>{member.handle}</Text>
              </View>
              <View style={[styles.roleBadge, { backgroundColor: ROLE_COLOR[member.role] + '18' }]}>
                <Text style={[styles.roleText, { color: ROLE_COLOR[member.role] }]}>
                  {member.role.toUpperCase()}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Shared Maps */}
        <View style={[styles.sectionHeader, { marginTop: Spacing.xl }]}>
          <Text style={styles.sectionLabel}>SHARED MAPS · {maps.length}</Text>
          <TouchableOpacity onPress={handleNewMap}>
            <Text style={styles.seeAll}>New Map</Text>
          </TouchableOpacity>
        </View>

        {maps.map(map => (
          <TouchableOpacity
            key={map.id}
            style={styles.mapCard}
            onPress={() => handleMapPress(map)}
            activeOpacity={0.85}
          >
            <Text style={styles.mapEmoji}>{map.emoji}</Text>
            <View style={styles.mapInfo}>
              <Text style={styles.mapTitle}>{map.title}</Text>
              {map.isForked && (
                <Text style={styles.forkedFrom}>🍴 Forked from {map.forkedFrom}</Text>
              )}
              <View style={styles.mapMeta}>
                <Text style={styles.mapMetaText}>{map.captureCount} captures</Text>
                <Text style={styles.mapMetaDot}>·</Text>
                <Text style={styles.mapMetaText}>Edited {map.lastEdited} by {map.editorHandle}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} />
          </TouchableOpacity>
        ))}

        {/* Permissions info */}
        <View style={styles.permissionsCard}>
          <Text style={styles.permissionsTitle}>Role permissions</Text>
          {[
            { role: 'Admin', perms: 'Full access, manage members, billing' },
            { role: 'Editor', perms: 'Add/edit captures and maps' },
            { role: 'Viewer', perms: 'Read-only access to shared maps' },
          ].map(item => (
            <View key={item.role} style={styles.permRow}>
              <Text style={styles.permRole}>{item.role}</Text>
              <Text style={styles.permDesc}>{item.perms}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Invite modal */}
      <Modal visible={showInvite} animationType="slide" transparent presentationStyle="overFullScreen">
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.backdrop} onPress={() => setShowInvite(false)} activeOpacity={1} />
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Invite to team</Text>

            <TextInput
              style={styles.inviteInput}
              placeholder="@handle or email..."
              placeholderTextColor={Colors.textSecondary}
              value={inviteHandle}
              onChangeText={setInviteHandle}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={styles.rolePickerLabel}>Role</Text>
            <View style={styles.rolePicker}>
              {(['editor', 'viewer'] as Role[]).map(r => (
                <TouchableOpacity
                  key={r}
                  style={[styles.rolePickerBtn, inviteRole === r && styles.rolePickerBtnActive]}
                  onPress={() => setInviteRole(r)}
                >
                  <Text style={[styles.rolePickerText, inviteRole === r && styles.rolePickerTextActive]}>
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.inviteBtn, !inviteHandle.trim() && styles.inviteBtnDisabled]}
              onPress={handleInvite}
              disabled={!inviteHandle.trim()}
            >
              <Text style={styles.inviteBtnText}>Send Invite</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  teamIdent: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  teamLogo: {
    width: 40, height: 40, borderRadius: Radius.md,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  teamLogoText: { fontSize: 20 },
  teamName: { fontSize: 15, fontWeight: '700', color: Colors.text },
  teamPlan: { ...Typography.caption, color: Colors.textSecondary },
  iconBtn: {
    width: 36, height: 36, borderRadius: Radius.full,
    backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center',
    ...Shadow.card,
  },
  scroll: { paddingHorizontal: Spacing.lg, paddingBottom: 40 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },
  sectionLabel: { ...Typography.sectionLabel, color: Colors.sectionLabel },
  seeAll: { ...Typography.caption, color: Colors.accent, fontWeight: '600' },
  membersCard: { backgroundColor: Colors.card, borderRadius: Radius.lg, ...Shadow.card, marginBottom: Spacing.sm },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md },
  memberBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  memberAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  memberInitials: { color: Colors.card, fontSize: 15, fontWeight: '700' },
  memberInfo: { flex: 1 },
  memberName: { ...Typography.cardBody, color: Colors.text, fontWeight: '600', marginBottom: 2 },
  memberHandle: { ...Typography.caption, color: Colors.textSecondary },
  roleBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full },
  roleText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.6 },
  mapCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    padding: Spacing.md, marginBottom: Spacing.sm, ...Shadow.card,
  },
  mapEmoji: { fontSize: 28 },
  mapInfo: { flex: 1 },
  mapTitle: { ...Typography.cardBody, color: Colors.text, fontWeight: '600', marginBottom: 4 },
  forkedFrom: { ...Typography.caption, color: Colors.accent, marginBottom: 3 },
  mapMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  mapMetaText: { ...Typography.caption, color: Colors.textSecondary },
  mapMetaDot: { ...Typography.caption, color: Colors.textTertiary },
  permissionsCard: {
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    padding: Spacing.lg, marginTop: Spacing.xl, ...Shadow.card,
  },
  permissionsTitle: { ...Typography.sectionLabel, color: Colors.sectionLabel, marginBottom: Spacing.md },
  permRow: { flexDirection: 'row', gap: Spacing.md, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: Colors.border },
  permRole: { ...Typography.caption, color: Colors.text, fontWeight: '700', width: 56 },
  permDesc: { ...Typography.caption, color: Colors.textSecondary, flex: 1 },
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: Colors.overlay },
  sheet: {
    backgroundColor: Colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: Spacing.xl, paddingBottom: 48,
  },
  sheetHandle: {
    width: 36, height: 4, backgroundColor: Colors.border,
    borderRadius: Radius.full, alignSelf: 'center', marginBottom: Spacing.lg,
  },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: Spacing.lg },
  inviteInput: {
    backgroundColor: Colors.background, borderRadius: Radius.md,
    padding: Spacing.md, fontSize: 15, color: Colors.text, marginBottom: Spacing.md,
  },
  rolePickerLabel: { ...Typography.caption, color: Colors.textSecondary, marginBottom: Spacing.sm },
  rolePicker: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  rolePickerBtn: {
    flex: 1, paddingVertical: 10, borderRadius: Radius.full,
    borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center',
  },
  rolePickerBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  rolePickerText: { ...Typography.button, color: Colors.textSecondary },
  rolePickerTextActive: { color: Colors.card },
  inviteBtn: {
    backgroundColor: Colors.primary, borderRadius: Radius.full,
    paddingVertical: 14, alignItems: 'center',
  },
  inviteBtnDisabled: { opacity: 0.35 },
  inviteBtnText: { ...Typography.button, color: Colors.card },
})
