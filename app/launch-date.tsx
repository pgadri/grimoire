import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useState, useEffect } from 'react'
import * as Notifications from 'expo-notifications'
import { Colors, Spacing, Radius, Shadow } from '../constants/theme'
import { saveLaunchDate, getLaunchDate, clearLaunchDate, getDaysLeft, LAUNCH_PHASES } from '../lib/launch'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

const QUICK_OPTIONS = [
  { label: '4 weeks', days: 28 },
  { label: '6 weeks', days: 42 },
  { label: '8 weeks', days: 56 },
  { label: '3 months', days: 90 },
  { label: '6 months', days: 180 },
]

export default function LaunchDateScreen() {
  const router = useRouter()

  const today = new Date()
  const [year,  setYear]  = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [day,   setDay]   = useState(today.getDate() + 30)
  const [existing, setExisting] = useState<string | null>(null)

  useEffect(() => {
    getLaunchDate().then(d => {
      if (d) {
        setExisting(d)
        const dt = new Date(d)
        setYear(dt.getFullYear())
        setMonth(dt.getMonth())
        setDay(dt.getDate())
      }
    })
    // Fix day overflow
    const max = daysInMonth(year, month)
    if (day > max) setDay(max)
  }, [])

  // Normalise day when month/year changes
  const safeDay = Math.min(day, daysInMonth(year, month))

  const selectedDate = new Date(year, month, safeDay)
  const isValid = selectedDate > today
  const daysLeft = Math.ceil((selectedDate.getTime() - today.setHours(0,0,0,0)) / 86400000)

  const applyQuick = (days: number) => {
    const d = new Date()
    d.setDate(d.getDate() + days)
    setYear(d.getFullYear())
    setMonth(d.getMonth())
    setDay(d.getDate())
  }

  const handleSave = async () => {
    if (!isValid) return
    const { status } = await Notifications.requestPermissionsAsync()
    const iso = new Date(year, month, safeDay).toISOString().split('T')[0]
    await saveLaunchDate(iso)
    if (status !== 'granted') {
      Alert.alert('Notifications off', 'Enable notifications in Settings to receive launch reminders.')
    }
    router.back()
  }

  const handleClear = () => {
    Alert.alert('Remove launch date?', 'The countdown and reminders will be removed.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive',
        onPress: async () => { await clearLaunchDate(); router.back() },
      },
    ])
  }

  // Year range: current year to +3
  const years  = Array.from({ length: 4 }, (_, i) => today.getFullYear() + i)
  const days   = Array.from({ length: daysInMonth(year, month) }, (_, i) => i + 1)

  const phase = LAUNCH_PHASES.find(p => daysLeft >= p.minDaysOut) ?? LAUNCH_PHASES[LAUNCH_PHASES.length - 1]

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <Ionicons name="close" size={20} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Set Launch Date</Text>
        <TouchableOpacity
          style={[styles.saveBtn, !isValid && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={!isValid}
        >
          <Text style={styles.saveBtnText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>

        <View style={styles.iconRow}>
          <Text style={styles.iconEmoji}>🚀</Text>
        </View>
        <Text style={styles.title}>When are you launching?</Text>
        <Text style={styles.sub}>
          We'll count down the days and send you milestone reminders so you're ready.
        </Text>

        {/* Quick picks */}
        <Text style={styles.label}>QUICK PICK</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickRow}>
          {QUICK_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.label}
              style={styles.quickChip}
              onPress={() => applyQuick(opt.days)}
              activeOpacity={0.75}
            >
              <Text style={styles.quickChipText}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Date picker */}
        <Text style={[styles.label, { marginTop: Spacing.lg }]}>PICK A DATE</Text>
        <View style={styles.pickerRow}>
          {/* Month */}
          <View style={styles.pickerCol}>
            <Text style={styles.pickerLabel}>Month</Text>
            <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
              {MONTHS.map((m, i) => (
                <TouchableOpacity
                  key={m}
                  style={[styles.pickerItem, month === i && styles.pickerItemActive]}
                  onPress={() => setMonth(i)}
                >
                  <Text style={[styles.pickerItemText, month === i && styles.pickerItemTextActive]}>{m}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Day */}
          <View style={styles.pickerCol}>
            <Text style={styles.pickerLabel}>Day</Text>
            <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
              {days.map(d => (
                <TouchableOpacity
                  key={d}
                  style={[styles.pickerItem, safeDay === d && styles.pickerItemActive]}
                  onPress={() => setDay(d)}
                >
                  <Text style={[styles.pickerItemText, safeDay === d && styles.pickerItemTextActive]}>
                    {String(d).padStart(2, '0')}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Year */}
          <View style={styles.pickerCol}>
            <Text style={styles.pickerLabel}>Year</Text>
            <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
              {years.map(y => (
                <TouchableOpacity
                  key={y}
                  style={[styles.pickerItem, year === y && styles.pickerItemActive]}
                  onPress={() => setYear(y)}
                >
                  <Text style={[styles.pickerItemText, year === y && styles.pickerItemTextActive]}>{y}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* Preview */}
        {isValid ? (
          <View style={[styles.previewCard, { borderLeftColor: phase.color }]}>
            <Text style={[styles.previewDays, { color: phase.color }]}>
              {daysLeft} day{daysLeft !== 1 ? 's' : ''} to go
            </Text>
            <Text style={styles.previewPhase}>
              You're in the <Text style={{ fontWeight: '800', color: phase.color }}>{phase.label}</Text> phase
            </Text>
            <Text style={styles.previewSub}>
              {phase.milestones.length} milestones to work through before launch
            </Text>
          </View>
        ) : (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>Pick a future date</Text>
          </View>
        )}

        {existing && (
          <TouchableOpacity style={styles.clearBtn} onPress={handleClear}>
            <Text style={styles.clearBtnText}>Remove launch date</Text>
          </TouchableOpacity>
        )}

      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  navBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
  },
  closeBtn: {
    width: 36, height: 36, borderRadius: Radius.full,
    backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center', ...Shadow.card,
  },
  navTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
  saveBtn: { paddingHorizontal: 18, paddingVertical: 9, backgroundColor: Colors.primary, borderRadius: Radius.full },
  saveBtnDisabled: { backgroundColor: Colors.textTertiary },
  saveBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },

  body: { paddingHorizontal: Spacing.lg, paddingBottom: 60 },
  iconRow: {
    width: 60, height: 60, borderRadius: Radius.xl,
    backgroundColor: Colors.primary + '15', alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  iconEmoji: { fontSize: 28 },
  title: { fontSize: 22, fontWeight: '800', color: Colors.text, marginBottom: Spacing.sm },
  sub: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20, marginBottom: Spacing.xl },

  label: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary, letterSpacing: 0.8, marginBottom: Spacing.sm },
  quickRow: { gap: Spacing.sm, paddingBottom: 4 },
  quickChip: {
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: Colors.card, borderRadius: Radius.full,
    borderWidth: 2, borderColor: Colors.border, ...Shadow.card,
  },
  quickChipText: { fontSize: 13, fontWeight: '600', color: Colors.text },

  pickerRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  pickerCol: { flex: 1 },
  pickerLabel: { fontSize: 10, fontWeight: '700', color: Colors.textTertiary, letterSpacing: 0.5, textAlign: 'center', marginBottom: 6 },
  pickerScroll: { height: 200, backgroundColor: Colors.card, borderRadius: Radius.md, ...Shadow.card },
  pickerItem: { paddingVertical: 11, paddingHorizontal: 8, alignItems: 'center' },
  pickerItemActive: { backgroundColor: Colors.primary + '15' },
  pickerItemText: { fontSize: 14, fontWeight: '500', color: Colors.textSecondary },
  pickerItemTextActive: { color: Colors.primary, fontWeight: '800' },

  previewCard: {
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    padding: Spacing.lg, borderLeftWidth: 4, ...Shadow.card, marginBottom: Spacing.lg,
  },
  previewDays: { fontSize: 28, fontWeight: '900', marginBottom: 4 },
  previewPhase: { fontSize: 15, color: Colors.text, marginBottom: 4 },
  previewSub: { fontSize: 13, color: Colors.textSecondary },

  errorCard: { backgroundColor: Colors.error + '15', borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.lg },
  errorText: { fontSize: 13, color: Colors.error, fontWeight: '600', textAlign: 'center' },

  clearBtn: { alignItems: 'center', paddingVertical: Spacing.lg },
  clearBtnText: { fontSize: 14, color: Colors.error, fontWeight: '600' },
})
