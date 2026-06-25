import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Colors, Spacing, Radius, Typography } from '../constants/theme'

const PRIVACY_POLICY = `Last updated: June 25, 2026

Grimoire ("we", "us", or "our") is operated as an independent app. This policy explains what data we collect and how we use it.

WHAT WE COLLECT

• Content you capture: When you submit a video URL, we send it to our server to download audio and transcribe it. The URL, transcript, and AI-generated summary are stored on your device in local storage. If you push to GitHub, the note is stored in your GitHub repository.

• Screenshots and photos: Images you submit for analysis are sent to our server for AI processing. They are not stored on our servers after processing.

• Device identity: We store a locally-generated user profile (name, handle, bio) on your device only. We do not create server-side accounts.

• Usage: We do not collect analytics, crash reports, or behavioral data in this version of the app.

HOW WE USE YOUR DATA

• Video URLs are sent to our server solely to download and transcribe the audio.
• Transcripts and summaries are processed by Groq (groq.com) for AI analysis.
• No data is sold to third parties.
• No data is used for advertising.

THIRD-PARTY SERVICES

• Groq (groq.com): Processes audio transcription and text generation. See groq.com/privacy.
• GitHub (github.com): Used optionally to store your captured notes. See github.com/privacy.
• Railway (railway.app): Hosts our backend server. See railway.app/legal/privacy.

DATA RETENTION

All capture data is stored on your device via AsyncStorage. Uninstalling the app removes all local data. Notes pushed to GitHub remain in your repository until you delete them.

YOUR RIGHTS

You can delete any capture from within the app at any time. To delete all data, uninstall the app.

CONTACT

Questions? Email hello@grimoire.app`

const TERMS_OF_SERVICE = `Last updated: June 25, 2026

By using Grimoire, you agree to these terms.

1. ACCEPTABLE USE

Grimoire is a personal knowledge capture tool for vibe coders and app builders. You may use it to capture, organize, and reference publicly available content for personal learning and development purposes.

You may not use Grimoire to:
• Capture or store content that infringes copyright
• Circumvent platform restrictions (e.g., capturing private/login-gated content)
• Reverse engineer or abuse the service

2. CONTENT YOU CAPTURE

You are responsible for ensuring you have the right to capture and store content. We do not review content you capture. Captures stored on your device are yours.

Notes pushed to GitHub are stored in your GitHub account under GitHub's terms of service.

3. SERVICE AVAILABILITY

Grimoire is provided "as is." We do not guarantee uninterrupted availability of the transcription or AI features, which depend on third-party services (Groq, Railway).

4. INTELLECTUAL PROPERTY

The Grimoire app, its design, and original content are owned by Grimoire. Content you capture belongs to its original creators.

5. LIMITATION OF LIABILITY

To the maximum extent permitted by law, Grimoire is not liable for any indirect, incidental, or consequential damages arising from your use of the app.

6. CHANGES

We may update these terms. Continued use of the app after changes constitutes acceptance.

7. CONTACT

Questions? Email hello@grimoire.app`

export default function LegalScreen() {
  const { type } = useLocalSearchParams<{ type: 'privacy' | 'terms' }>()
  const router = useRouter()

  const isPrivacy = type === 'privacy'
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
