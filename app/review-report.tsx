import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import * as Clipboard from 'expo-clipboard'
import { Colors, Spacing, Radius, Shadow, Typography } from '../constants/theme'
import {
  SAMPLE_REPORT, GradedReport, Finding, FindingSeverity, LetterGrade,
  reportGrade, countFindings, sortFindings, CATEGORY_LABELS,
} from '../lib/expertReview'

const SEVERITY_COLOR: Record<FindingSeverity, string> = {
  critical: Colors.error,
  high: Colors.gold,
  medium: Colors.accent,
  low: Colors.textSecondary,
}

const SEVERITY_LABEL: Record<FindingSeverity, string> = {
  critical: 'CRITICAL',
  high: 'HIGH',
  medium: 'MEDIUM',
  low: 'LOW',
}

const GRADE_COLOR: Record<LetterGrade, string> = {
  A: Colors.success,
  B: '#7BB341',
  C: Colors.gold,
  D: '#E8833A',
  F: Colors.error,
}

export default function ReviewReportScreen() {
  // For now this renders the sample report. When a real report is delivered it
  // will be loaded by request id; the viewer is identical.
  const report: GradedReport = SAMPLE_REPORT
  const router = useRouter()
  const { score, grade } = reportGrade(report)
  const counts = countFindings(report.findings)
  const findings = sortFindings(report.findings)
  const [expanded, setExpanded] = useState<string | null>(findings[0]?.id ?? null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const copyPrompt = async (finding: Finding) => {
    if (!finding.aiPrompt) return
    await Clipboard.setStringAsync(finding.aiPrompt)
    setCopiedId(finding.id)
    setTimeout(() => setCopiedId(c => (c === finding.id ? null : c)), 2000)
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={20} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Security Report</Text>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {report.id === 'sample-1' && (
          <View style={styles.sampleTag}>
            <Ionicons name="eye-outline" size={13} color={Colors.accent} />
            <Text style={styles.sampleTagText}>SAMPLE REPORT — this is what you'll receive</Text>
          </View>
        )}

        {/* Grade hero */}
        <View style={styles.hero}>
          <View style={[styles.gradeBadge, { backgroundColor: GRADE_COLOR[grade] }]}>
            <Text style={styles.gradeLetter}>{grade}</Text>
            <Text style={styles.gradeScore}>{score}/100</Text>
          </View>
          <View style={styles.heroText}>
            <Text style={styles.heroProject}>{report.projectName}</Text>
            <Text style={styles.heroRepo}>{report.repoUrl}</Text>
            <Text style={styles.heroReviewer}>
              Reviewed by {report.reviewerName} · {report.reviewerHandle}
            </Text>
          </View>
        </View>

        {/* Severity summary */}
        <View style={styles.summaryRow}>
          {(['critical', 'high', 'medium', 'low'] as FindingSeverity[]).map(sev => (
            <View key={sev} style={styles.summaryCell}>
              <Text style={[styles.summaryNum, { color: SEVERITY_COLOR[sev] }]}>{counts[sev]}</Text>
              <Text style={styles.summaryLabel}>{SEVERITY_LABEL[sev].toLowerCase()}</Text>
            </View>
          ))}
        </View>

        {/* Reviewer summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryCardLabel}>REVIEWER'S SUMMARY</Text>
          <Text style={styles.summaryCardText}>{report.summary}</Text>
        </View>

        {/* Findings */}
        <Text style={styles.sectionLabel}>FINDINGS · {findings.length}</Text>
        {findings.map(finding => (
          <FindingCard
            key={finding.id}
            finding={finding}
            expanded={expanded === finding.id}
            copied={copiedId === finding.id}
            onToggle={() => setExpanded(e => (e === finding.id ? null : finding.id))}
            onCopy={() => copyPrompt(finding)}
          />
        ))}

        {report.id === 'sample-1' && (
          <TouchableOpacity style={styles.cta} onPress={() => router.push('/review')} activeOpacity={0.9}>
            <Text style={styles.ctaText}>Get this review for my project</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.footnote}>
          This report reflects the reviewer's findings at the time of audit. Apply fixes and
          re-review before launch.
        </Text>
      </ScrollView>
    </SafeAreaView>
  )
}

function FindingCard({
  finding, expanded, copied, onToggle, onCopy,
}: {
  finding: Finding
  expanded: boolean
  copied: boolean
  onToggle: () => void
  onCopy: () => void
}) {
  const color = SEVERITY_COLOR[finding.severity]
  return (
    <View style={styles.findingCard}>
      <TouchableOpacity style={styles.findingHeader} onPress={onToggle} activeOpacity={0.8}>
        <View style={[styles.findingStripe, { backgroundColor: color }]} />
        <View style={styles.findingHeaderText}>
          <View style={styles.findingTags}>
            <View style={[styles.sevBadge, { backgroundColor: color + '1A' }]}>
              <Text style={[styles.sevBadgeText, { color }]}>{SEVERITY_LABEL[finding.severity]}</Text>
            </View>
            <Text style={styles.catText}>{CATEGORY_LABELS[finding.category]}</Text>
          </View>
          <Text style={styles.findingTitle}>{finding.title}</Text>
          <Text style={styles.findingLocation}>{finding.location}</Text>
        </View>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.textTertiary} />
      </TouchableOpacity>

      {expanded && (
        <View style={styles.findingBody}>
          <Text style={styles.bodyLabel}>WHAT WE FOUND</Text>
          <Text style={styles.bodyText}>{finding.description}</Text>

          <Text style={styles.bodyLabel}>WHY IT MATTERS</Text>
          <View style={styles.impactBox}>
            <Ionicons name="alert-circle-outline" size={14} color={Colors.error} />
            <Text style={styles.impactText}>{finding.impact}</Text>
          </View>

          <Text style={styles.bodyLabel}>HOW TO FIX IT</Text>
          <Text style={styles.bodyText}>{finding.remediation}</Text>

          {finding.aiPrompt && (
            <>
              <View style={styles.promptBox}>
                <Text style={styles.promptText}>{finding.aiPrompt}</Text>
              </View>
              <TouchableOpacity style={styles.copyBtn} onPress={onCopy} activeOpacity={0.85}>
                <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={15} color={copied ? Colors.success : Colors.card} />
                <Text style={[styles.copyBtnText, copied && { color: Colors.success }]}>
                  {copied ? 'Copied!' : 'Copy AI fix'}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  navBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
  },
  iconBtn: {
    width: 36, height: 36, borderRadius: Radius.full,
    backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center', ...Shadow.card,
  },
  navTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  scroll: { padding: Spacing.lg, paddingBottom: 48 },
  sampleTag: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    backgroundColor: Colors.accent + '14', paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: Radius.full, marginBottom: Spacing.md,
  },
  sampleTagText: { fontSize: 10, fontWeight: '700', color: Colors.accent, letterSpacing: 0.4 },
  hero: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.lg,
    backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.lg,
    marginBottom: Spacing.md, ...Shadow.card,
  },
  gradeBadge: { width: 80, height: 80, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center' },
  gradeLetter: { fontSize: 38, fontWeight: '700', color: Colors.card, lineHeight: 42 },
  gradeScore: { fontSize: 11, fontWeight: '700', color: Colors.card, opacity: 0.9 },
  heroText: { flex: 1 },
  heroProject: { ...Typography.cardTitle, color: Colors.text, marginBottom: 3 },
  heroRepo: { ...Typography.caption, color: Colors.accent, marginBottom: 6 },
  heroReviewer: { ...Typography.caption, color: Colors.textSecondary, lineHeight: 16 },
  summaryRow: {
    flexDirection: 'row', backgroundColor: Colors.card, borderRadius: Radius.lg,
    padding: Spacing.md, marginBottom: Spacing.md, ...Shadow.card,
  },
  summaryCell: { flex: 1, alignItems: 'center' },
  summaryNum: { fontSize: 24, fontWeight: '700' },
  summaryLabel: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  summaryCard: { backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.xl, ...Shadow.card },
  summaryCardLabel: { ...Typography.sectionLabel, color: Colors.sectionLabel, fontSize: 10, marginBottom: Spacing.sm },
  summaryCardText: { ...Typography.cardBody, color: Colors.text, lineHeight: 21 },
  sectionLabel: { ...Typography.sectionLabel, color: Colors.sectionLabel, marginBottom: Spacing.md },
  findingCard: { backgroundColor: Colors.card, borderRadius: Radius.lg, marginBottom: Spacing.md, ...Shadow.card, overflow: 'hidden' },
  findingHeader: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, gap: Spacing.sm },
  findingStripe: { width: 4, alignSelf: 'stretch', borderRadius: Radius.full, marginRight: 4 },
  findingHeaderText: { flex: 1 },
  findingTags: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 5 },
  sevBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: Radius.full },
  sevBadgeText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.6 },
  catText: { fontSize: 10, color: Colors.textSecondary, fontWeight: '600' },
  findingTitle: { ...Typography.cardBody, color: Colors.text, fontWeight: '600', lineHeight: 19 },
  findingLocation: { fontSize: 11, color: Colors.textSecondary, fontFamily: 'Courier', marginTop: 3 },
  findingBody: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.md, gap: 6 },
  bodyLabel: { ...Typography.sectionLabel, color: Colors.sectionLabel, fontSize: 10, marginTop: Spacing.sm },
  bodyText: { ...Typography.cardBody, color: Colors.text, lineHeight: 20 },
  impactBox: { flexDirection: 'row', gap: 6, backgroundColor: Colors.error + '0C', borderRadius: Radius.sm, padding: Spacing.sm },
  impactText: { ...Typography.caption, color: Colors.text, flex: 1, lineHeight: 18 },
  promptBox: { backgroundColor: Colors.background, borderRadius: Radius.sm, padding: Spacing.md, marginTop: Spacing.sm },
  promptText: { fontSize: 13, color: Colors.text, lineHeight: 19, fontFamily: 'Courier' },
  copyBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: Colors.primary, borderRadius: Radius.full, paddingVertical: 11, marginTop: Spacing.sm,
  },
  copyBtnText: { ...Typography.button, color: Colors.card, fontSize: 14 },
  cta: { backgroundColor: Colors.primary, borderRadius: Radius.full, paddingVertical: 16, alignItems: 'center', marginTop: Spacing.md },
  ctaText: { ...Typography.button, color: Colors.card, fontSize: 16 },
  footnote: { ...Typography.caption, color: Colors.textTertiary, textAlign: 'center', marginTop: Spacing.md, lineHeight: 17 },
})
