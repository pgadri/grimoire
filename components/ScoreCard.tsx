import { View, Text, StyleSheet, Modal, TouchableOpacity, Share } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors, Spacing, Radius, Shadow, Typography } from '../constants/theme'

export type ScoreCardProps = {
  visible: boolean
  onClose: () => void
  score: number
  name: string
  criticals: number
  highs: number
  mediums: number
  source: 'readiness' | 'scan'
}

export function ScoreCard({ visible, onClose, score, name, criticals, highs, mediums, source }: ScoreCardProps) {
  const scoreColor = score >= 80 ? Colors.success : score >= 50 ? Colors.gold : Colors.error
  const verdict =
    score >= 80 ? 'Launch-ready' :
    score >= 50 ? 'Getting close' :
    'Needs work before launch'

  const issueLines = [
    criticals > 0 ? `${criticals} critical` : null,
    highs > 0 ? `${highs} high` : null,
    mediums > 0 ? `${mediums} medium` : null,
  ].filter(Boolean).join(' · ')

  const handleShare = async () => {
    const issueText = issueLines ? `\n${issueLines} issues to fix` : '\nNo issues found'
    await Share.share({
      message:
        `${name} scored ${score}/100 on Launch Readiness${issueText}\n\nChecked with Vibecoded — the launch confidence tool for vibe coders.\nvibecoded.tech`,
      title: `${name} · ${score}/100 on Vibecoded`,
    })
  }

  return (
    <Modal visible={visible} animationType="fade" transparent presentationStyle="overFullScreen">
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />

        <View style={styles.sheet}>
          <View style={styles.handle} />

          {/* Card */}
          <View style={[styles.card, { borderTopColor: scoreColor }]}>
            <View style={styles.cardHeader}>
              <View style={styles.logoMark}>
                <Text style={styles.logoText}>✦</Text>
              </View>
              <Text style={styles.brandName}>vibecoded</Text>
              <Text style={styles.cardLabel}>
                {source === 'scan' ? 'Repo Scan' : 'Launch Readiness'}
              </Text>
            </View>

            <View style={styles.scoreBlock}>
              <View style={[styles.scoreRing, { borderColor: scoreColor }]}>
                <Text style={[styles.scoreNum, { color: scoreColor }]}>{score}</Text>
                <Text style={styles.scoreOf}>/ 100</Text>
              </View>
              <View style={styles.scoreRight}>
                <Text style={styles.appName} numberOfLines={2}>{name}</Text>
                <Text style={[styles.verdict, { color: scoreColor }]}>{verdict}</Text>
                {issueLines ? (
                  <Text style={styles.issueLine}>{issueLines}</Text>
                ) : (
                  <View style={styles.allClearRow}>
                    <Ionicons name="checkmark-circle" size={13} color={Colors.success} />
                    <Text style={styles.allClearText}>No issues found</Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.barRow}>
              {(['critical', 'high', 'medium'] as const).map((sev, i) => {
                const count = [criticals, highs, mediums][i]
                const color = [Colors.error, Colors.gold, Colors.accent][i]
                return (
                  <View key={sev} style={styles.barItem}>
                    <View style={[styles.barDot, { backgroundColor: color }]} />
                    <Text style={styles.barCount}>{count}</Text>
                    <Text style={styles.barLabel}>{sev}</Text>
                  </View>
                )
              })}
            </View>

            <Text style={styles.footerUrl}>vibecoded.tech</Text>
          </View>

          {/* Actions */}
          <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.85}>
            <Ionicons name="share-outline" size={18} color={Colors.card} />
            <Text style={styles.shareBtnText}>Share score</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.xl,
    paddingBottom: 40,
    gap: Spacing.md,
  },
  handle: {
    width: 36, height: 4, backgroundColor: Colors.border,
    borderRadius: Radius.full, alignSelf: 'center', marginBottom: Spacing.sm,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderTopWidth: 4,
    padding: Spacing.lg,
    gap: Spacing.lg,
    ...Shadow.card,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoMark: {
    width: 22, height: 22, borderRadius: 6,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  logoText: { color: Colors.card, fontSize: 11, fontWeight: '700' },
  brandName: { fontSize: 13, fontWeight: '700', color: Colors.text },
  cardLabel: {
    marginLeft: 'auto', fontSize: 10, fontWeight: '700',
    color: Colors.textSecondary, letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  scoreBlock: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg },
  scoreRing: {
    width: 84, height: 84, borderRadius: 42, borderWidth: 5,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  scoreNum: { fontSize: 30, fontWeight: '800', lineHeight: 34 },
  scoreOf: { fontSize: 10, color: Colors.textSecondary, fontWeight: '600' },
  scoreRight: { flex: 1, gap: 4 },
  appName: { fontSize: 16, fontWeight: '700', color: Colors.text, lineHeight: 20 },
  verdict: { fontSize: 13, fontWeight: '600' },
  issueLine: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  allClearRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  allClearText: { ...Typography.caption, color: Colors.success, fontWeight: '600' },
  barRow: {
    flexDirection: 'row', gap: Spacing.lg,
    borderTopWidth: 1, borderTopColor: Colors.border,
    paddingTop: Spacing.md,
  },
  barItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  barDot: { width: 8, height: 8, borderRadius: 4 },
  barCount: { fontSize: 14, fontWeight: '700', color: Colors.text },
  barLabel: { ...Typography.caption, color: Colors.textSecondary },
  footerUrl: {
    ...Typography.caption, color: Colors.textTertiary,
    textAlign: 'right', fontSize: 10,
  },
  shareBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, backgroundColor: Colors.primary,
    borderRadius: Radius.full, paddingVertical: 15, ...Shadow.card,
  },
  shareBtnText: { ...Typography.button, color: Colors.card, fontSize: 16 },
  closeBtn: { alignItems: 'center', paddingVertical: Spacing.sm },
  closeBtnText: { ...Typography.caption, color: Colors.textSecondary, fontWeight: '600' },
})
