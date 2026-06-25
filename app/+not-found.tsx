import { View, Text, StyleSheet } from 'react-native'
import { Link } from 'expo-router'
import { Colors, Spacing } from '../constants/theme'

export default function NotFound() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Screen not found</Text>
      <Link href="/" style={styles.link}>Go home</Link>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
  text: { fontSize: 18, fontWeight: '600', color: Colors.text, marginBottom: Spacing.md },
  link: { color: Colors.accent, fontSize: 14 },
})
