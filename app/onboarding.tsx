import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { Colors, Spacing, Radius, Shadow, Typography } from '../constants/theme'
import {
  ProjectStage, StackTag, STAGE_ORDER, STAGE_LABELS, STACK_LABELS, saveProjectProfile,
} from '../lib/project'

const STACK_OPTIONS = Object.keys(STACK_LABELS) as StackTag[]

export default function OnboardingScreen() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [stage, setStage] = useState<ProjectStage>('building')
  const [stack, setStack] = useState<Set<StackTag>>(new Set())
  const [handlesPayments, setHandlesPayments] = useState(false)
  const [storesUserData, setStoresUserData] = useState(true)

  const toggleStack = (tag: StackTag) => {
    setStack(prev => {
      const next = new Set(prev)
      next.has(tag) ? next.delete(tag) : next.add(tag)
      return next
    })
  }

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Name your project', 'What are you building?')
      return
    }
    await saveProjectProfile({
      name: name.trim(),
      stage,
      stack: Array.from(stack),
      handlesPayments,
      storesUserData,
    })
    router.replace('/readiness')
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.kicker}>SET UP YOUR GRIMOIRE</Text>
        <Text style={styles.heading}>What are you building?</Text>
        <Text style={styles.sub}>
          Tell Grimoire about your project and it will warn you about what's coming — before it
          hurts.
        </Text>

        {/* Project name */}
        <Text style={styles.label}>PROJECT NAME</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. My recipe app"
          placeholderTextColor={Colors.textSecondary}
          value={name}
          onChangeText={setName}
          maxLength={50}
        />

        {/* Stage */}
        <Text style={styles.label}>WHERE ARE YOU AT?</Text>
        <View style={styles.stageCol}>
          {STAGE_ORDER.map(s => (
            <TouchableOpacity
              key={s}
              style={[styles.stageRow, stage === s && styles.stageRowActive]}
              onPress={() => setStage(s)}
              activeOpacity={0.8}
            >
              <View style={[styles.radio, stage === s && styles.radioActive]}>
                {stage === s && <View style={styles.radioDot} />}
              </View>
              <Text style={[styles.stageLabel, stage === s && styles.stageLabelActive]}>
                {STAGE_LABELS[s]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Stack */}
        <Text style={styles.label}>YOUR STACK</Text>
        <Text style={styles.hint}>Tap everything you're using. Grimoire matches risks to these.</Text>
        <View style={styles.chipWrap}>
          {STACK_OPTIONS.map(tag => {
            const active = stack.has(tag)
            return (
              <TouchableOpacity
                key={tag}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => toggleStack(tag)}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {STACK_LABELS[tag]}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>

        {/* Yes/no gates */}
        <Text style={styles.label}>A COUPLE MORE THINGS</Text>
        <ToggleRow
          icon="card-outline"
          label="Does it handle payments?"
          sub="Unlocks payment & billing risk checks"
          value={handlesPayments}
          onToggle={() => setHandlesPayments(v => !v)}
        />
        <ToggleRow
          icon="people-outline"
          label="Does it store user data?"
          sub="Unlocks data, privacy & legal checks"
          value={storesUserData}
          onToggle={() => setStoresUserData(v => !v)}
        />

        <TouchableOpacity style={styles.cta} onPress={handleSave} activeOpacity={0.9}>
          <Text style={styles.ctaText}>See my launch risks</Text>
          <Ionicons name="arrow-forward" size={18} color={Colors.card} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.skip} onPress={() => router.replace('/(tabs)')}>
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

function ToggleRow({
  icon, label, sub, value, onToggle,
}: {
  icon: keyof typeof Ionicons.glyphMap
  label: string
  sub: string
  value: boolean
  onToggle: () => void
}) {
  return (
    <TouchableOpacity style={styles.toggleRow} onPress={onToggle} activeOpacity={0.8}>
      <View style={styles.toggleIcon}>
        <Ionicons name={icon} size={18} color={Colors.primary} />
      </View>
      <View style={styles.toggleText}>
        <Text style={styles.toggleLabel}>{label}</Text>
        <Text style={styles.toggleSub}>{sub}</Text>
      </View>
      <View style={[styles.checkbox, value && styles.checkboxActive]}>
        {value && <Ionicons name="checkmark" size={15} color={Colors.card} />}
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.lg, paddingBottom: 48 },
  kicker: { ...Typography.sectionLabel, color: Colors.accent, marginBottom: Spacing.sm },
  heading: { fontSize: 28, fontWeight: '700', color: Colors.text, marginBottom: Spacing.sm },
  sub: { ...Typography.cardBody, color: Colors.textSecondary, lineHeight: 21, marginBottom: Spacing.xl },
  label: { ...Typography.sectionLabel, color: Colors.sectionLabel, marginTop: Spacing.lg, marginBottom: Spacing.sm },
  hint: { ...Typography.caption, color: Colors.textSecondary, marginBottom: Spacing.md, marginTop: -2 },
  input: {
    backgroundColor: Colors.card, borderRadius: Radius.md, padding: Spacing.md,
    fontSize: 16, fontWeight: '600', color: Colors.text, ...Shadow.card,
  },
  stageCol: { gap: Spacing.sm },
  stageRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.card, borderRadius: Radius.md, padding: Spacing.md,
    borderWidth: 1.5, borderColor: Colors.card,
  },
  stageRowActive: { borderColor: Colors.primary },
  radio: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  radioActive: { borderColor: Colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary },
  stageLabel: { ...Typography.cardBody, color: Colors.text, fontWeight: '500' },
  stageLabelActive: { color: Colors.primary, fontWeight: '700' },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: {
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: Radius.full,
    backgroundColor: Colors.card, borderWidth: 1.5, borderColor: Colors.border,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 13, fontWeight: '600', color: Colors.text },
  chipTextActive: { color: Colors.card },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.card, borderRadius: Radius.md, padding: Spacing.md,
    marginBottom: Spacing.sm, ...Shadow.card,
  },
  toggleIcon: {
    width: 38, height: 38, borderRadius: Radius.sm, backgroundColor: Colors.primary + '12',
    alignItems: 'center', justifyContent: 'center',
  },
  toggleText: { flex: 1 },
  toggleLabel: { ...Typography.cardBody, color: Colors.text, fontWeight: '600' },
  toggleSub: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  checkbox: {
    width: 24, height: 24, borderRadius: Radius.sm, borderWidth: 2, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  cta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    backgroundColor: Colors.primary, borderRadius: Radius.full, paddingVertical: 16,
    marginTop: Spacing.xl,
  },
  ctaText: { ...Typography.button, color: Colors.card, fontSize: 16 },
  skip: { alignItems: 'center', paddingVertical: Spacing.md, marginTop: Spacing.xs },
  skipText: { ...Typography.caption, color: Colors.textSecondary, fontWeight: '600' },
})
