import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Colors, Spacing, Radius, Typography } from '../constants/theme'

const PRIVACY_POLICY = `Last updated: June 26, 2026

Vibecoded ("we", "us", or "our") is operated by an independent developer. This policy explains what data we collect, how we use it, and your rights.

WHAT WE COLLECT

• Account data: Your name, email address, and username (@handle) are stored on our servers hosted on Railway (railway.app) and Neon Postgres. This is required to provide your account.

• Captures: Notes, links, screenshots, and AI-generated summaries you create are stored locally on your device. You may optionally push them to your GitHub repository.

• Images: Photos you submit for analysis are sent to our server for processing and are not retained after the response is returned.

• Analytics (optional): We use PostHog (posthog.com) for anonymous product analytics — events like screen views and feature usage. No personally identifiable content is included. You can opt out by emailing us.

• Crash & error monitoring: We use Sentry (sentry.io) to capture app errors. Error reports may include device type, OS version, and app state but not your account content.

HOW WE USE YOUR DATA

• To provide, maintain, and improve the Vibecoded service
• To send transactional emails (OTP codes, account notices) via Resend (resend.com)
• To enable community features (feed, threads, creator profiles)
• We do not sell your personal data to third parties
• We do not use your data for advertising

THIRD-PARTY SERVICES

• Railway / Neon: Backend hosting and database. See railway.app/legal/privacy and neon.tech/privacy.
• Resend: Transactional email. See resend.com/privacy.
• PostHog: Anonymous product analytics. See posthog.com/privacy.
• Sentry: Error monitoring. See sentry.io/privacy.
• Groq: AI transcription and text generation. See groq.com/privacy.
• RevenueCat: In-app subscription management. See revenuecat.com/privacy.
• GitHub: Used optionally to store captures. See github.com/privacy.

DATA RETENTION

Account data is retained as long as your account exists. You may delete your account at any time from Profile → Delete Account. Deletion anonymises your account data immediately. Captures stored on your device are removed when you uninstall the app. Notes pushed to GitHub remain in your repository until you delete them.

YOUR RIGHTS

• Access: You may request a copy of your data by emailing hello@vibecoded.tech.
• Deletion: Delete your account from Profile → Delete Account. All PII is removed immediately.
• Correction: Update your profile from Profile → Edit Profile.
• Opt-out: Email us to opt out of anonymous analytics.

CHILDREN

Vibecoded is not directed at children under 13 (or 16 in the EU). We do not knowingly collect data from minors.

CONTACT

Questions or requests? Email hello@vibecoded.tech`

const TERMS_OF_SERVICE = `Last updated: June 26, 2026

By creating an account or using Vibecoded, you agree to these Terms of Service.

1. WHAT VIBECODED IS

Vibecoded is a launch-confidence platform for vibe coders and indie builders. It helps you track captures, manage your GitHub repo health, build in public, and prepare for product launches.

2. ACCEPTABLE USE

You agree not to:
• Post illegal, abusive, or harassing content
• Impersonate other people or organisations
• Attempt to reverse-engineer or abuse the service
• Use automated bots to create accounts or scrape content
• Submit content that infringes third-party intellectual property

3. ACCOUNT

You are responsible for all activity under your account. Keep your password secure. You must be at least 13 years old (16 in the EU) to create an account.

4. CONTENT YOU CREATE

You retain ownership of captures, threads, and other content you create. By posting publicly, you grant Vibecoded a non-exclusive, royalty-free licence to display that content within the app. You can delete your content at any time.

5. SUBSCRIPTIONS AND BILLING

Paid plans (Solopreneur, Team) are billed through Apple's App Store via RevenueCat. Charges appear on your Apple ID receipt. To cancel, go to Settings → Apple ID → Subscriptions on your iPhone and cancel Vibecoded. No refunds are issued for partial billing periods except where required by law.

6. SERVICE AVAILABILITY

Vibecoded is provided "as is." We aim for high availability but do not guarantee uninterrupted service. Features that depend on third-party APIs (AI, GitHub, PostHog) may be unavailable when those services are down.

7. INTELLECTUAL PROPERTY

The Vibecoded app, branding, and original content are owned by Vibecoded. Content you capture from external sources belongs to its original creators.

8. TERMINATION

We may suspend or terminate accounts that violate these terms. You may delete your account at any time from Profile → Delete Account.

9. LIMITATION OF LIABILITY

To the maximum extent permitted by applicable law, Vibecoded is not liable for indirect, incidental, or consequential damages arising from your use of the app.

10. CHANGES

We may update these terms. When we do, we'll prompt you to review and re-accept them before you can continue using the app.

11. GOVERNING LAW

These terms are governed by the laws of the state of New York, USA, without regard to conflict of law principles.

12. CONTACT

Questions? Email hello@vibecoded.tech`

export default function LegalScreen() {
  const params = useLocalSearchParams<{ type?: 'privacy' | 'terms'; doc?: 'privacy' | 'terms' }>()
  const router = useRouter()
  const { type, doc } = params

  const isPrivacy = (type ?? doc) === 'privacy'
  const title = isPrivacy ? 'Privacy Policy' : 'Terms of Service'
  const content = isPrivacy ? PRIVACY_POLICY : TERMS_OF_SERVICE

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>{title}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.body}>{content}</Text>
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
  backBtn: {
    width: 36, height: 36, borderRadius: Radius.full,
    backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center',
  },
  navTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  scroll: { padding: Spacing.lg, paddingBottom: 60 },
  body: { ...Typography.cardBody, color: Colors.text, lineHeight: 26 },
})
