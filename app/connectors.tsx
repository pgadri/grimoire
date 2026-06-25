import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { Colors, Spacing, Radius, Shadow, Typography } from '../constants/theme'

type Connector = {
  id: string
  name: string
  description: string
  icon: React.ComponentProps<typeof Ionicons>['name']
  color: string
  connected: boolean
  autoPush: boolean
  category: 'ai' | 'storage' | 'notes'
}

const INITIAL_CONNECTORS: Connector[] = [
  {
    id: 'openai', name: 'OpenAI', description: 'Whisper transcription + GPT-4 organization',
    icon: 'flash', color: '#10A37F', connected: false, autoPush: false, category: 'ai',
  },
  {
    id: 'anthropic', name: 'Claude (Anthropic)', description: 'Use Claude for knowledge organization',
    icon: 'sparkles', color: '#CC785C', connected: false, autoPush: false, category: 'ai',
  },
  {
    id: 'groq', name: 'Groq', description: 'Fast transcription & AI summaries (active)',
    icon: 'flash-outline', color: '#F55036', connected: true, autoPush: false, category: 'ai',
  },
  {
    id: 'github', name: 'GitHub', description: 'Push captures to your repository as markdown',
    icon: 'logo-github', color: '#24292F', connected: true, autoPush: true, category: 'storage',
  },
  {
    id: 'notion', name: 'Notion', description: 'Save captures as Notion pages',
    icon: 'document-text-outline', color: '#000000', connected: false, autoPush: false, category: 'notes',
  },
  {
    id: 'applenotes', name: 'Apple Notes', description: 'Automatically save to Apple Notes',
    icon: 'document-outline', color: '#FFD60A', connected: false, autoPush: false, category: 'notes',
  },
  {
    id: 'evernote', name: 'Evernote', description: 'Save to your Evernote notebook',
    icon: 'leaf-outline', color: '#2DBE60', connected: false, autoPush: false, category: 'notes',
  },
]

const CATEGORY_LABELS = { ai: 'AI MODELS', storage: 'STORAGE', notes: 'NOTE APPS' }

export default function ConnectorsScreen() {
  const router = useRouter()
  const [connectors, setConnectors] = useState(INITIAL_CONNECTORS)

  const toggle = (id: string, field: 'connected' | 'autoPush') => {
    setConnectors(prev =>
      prev.map(c => c.id === id ? { ...c, [field]: !c[field] } : c)
    )
  }

  const handleConnect = (connector: Connector) => {
    if (connector.connected) {
      Alert.alert(
        `Disconnect ${connector.name}?`,
        'You can reconnect anytime.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Disconnect', style: 'destructive', onPress: () => toggle(connector.id, 'connected') },
        ]
      )
    } else {
      toggle(connector.id, 'connected')
    }
  }

  const categories = ['ai', 'storage', 'notes'] as const

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={20} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.heading}>Connectors</Text>
        <View style={{ width: 36 }} />
      </View>

      <Text style={styles.sub}>Connect AI models and services to power your Grimoire</Text>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {categories.map(cat => {
          const items = connectors.filter(c => c.category === cat)
          return (
            <View key={cat}>
              <Text style={styles.sectionLabel}>{CATEGORY_LABELS[cat]}</Text>
              {items.map(connector => (
                <View key={connector.id} style={styles.card}>
                  <View style={styles.cardTop}>
                    <View style={[styles.iconBox, { backgroundColor: connector.color + '18' }]}>
                      <Ionicons name={connector.icon} size={20} color={connector.color} />
                    </View>
                    <View style={styles.cardInfo}>
                      <Text style={styles.connectorName}>{connector.name}</Text>
                      <Text style={styles.connectorDesc}>{connector.description}</Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.connectBtn, connector.connected && styles.connectedBtn]}
                      onPress={() => handleConnect(connector)}
                    >
                      <Text style={[styles.connectText, connector.connected && styles.connectedText]}>
                        {connector.connected ? 'Connected' : 'Connect'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {connector.connected && (
                    <View style={styles.autoPushRow}>
                      <View>
                        <Text style={styles.autoPushLabel}>Auto-push on capture</Text>
                        <Text style={styles.autoPushSub}>Push every new capture automatically</Text>
                      </View>
                      <Switch
                        value={connector.autoPush}
                        onValueChange={() => toggle(connector.id, 'autoPush')}
                        trackColor={{ false: Colors.border, true: Colors.primary + '80' }}
                        thumbColor={connector.autoPush ? Colors.primary : Colors.textTertiary}
                      />
                    </View>
                  )}
                </View>
              ))}
            </View>
          )
        })}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  closeBtn: {
    width: 36, height: 36, borderRadius: Radius.full,
    backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center',
    ...Shadow.card,
  },
  heading: { fontSize: 18, fontWeight: '700', color: Colors.text },
  sub: {
    ...Typography.cardBody, color: Colors.textSecondary,
    paddingHorizontal: Spacing.lg, marginBottom: Spacing.lg, lineHeight: 20,
  },
  scroll: { paddingHorizontal: Spacing.lg, paddingBottom: 40 },
  sectionLabel: { ...Typography.sectionLabel, color: Colors.sectionLabel, marginBottom: Spacing.sm },
  card: {
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    padding: Spacing.md, marginBottom: Spacing.md, ...Shadow.card,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  iconBox: {
    width: 44, height: 44, borderRadius: Radius.md,
    alignItems: 'center', justifyContent: 'center',
  },
  cardInfo: { flex: 1 },
  connectorName: { ...Typography.cardBody, color: Colors.text, fontWeight: '600' },
  connectorDesc: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2, lineHeight: 16 },
  connectBtn: {
    paddingHorizontal: Spacing.md, paddingVertical: 8,
    borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.primary,
  },
  connectedBtn: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  connectText: { fontSize: 12, fontWeight: '600', color: Colors.primary },
  connectedText: { color: Colors.card },
  autoPushRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: Spacing.md, paddingTop: Spacing.md,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  autoPushLabel: { ...Typography.cardBody, color: Colors.text, fontWeight: '500' },
  autoPushSub: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
})
