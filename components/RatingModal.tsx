import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native'
import { useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { Colors, Spacing, Radius, Shadow, Typography } from '../constants/theme'
import { submitReview } from '../lib/marketplace'

type Props = {
  visible: boolean
  packetId: string
  packetTitle: string
  onClose: () => void
}

export function RatingModal({ visible, packetId, packetTitle, onClose }: Props) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const handleSubmit = async () => {
    if (rating === 0) return
    setSubmitting(true)
    await submitReview({ packetId, rating, comment, createdAt: new Date().toISOString() })
    setSubmitting(false)
    setDone(true)
    setTimeout(() => {
      setDone(false)
      setRating(0)
      setComment('')
      onClose()
    }, 1200)
  }

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen">
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {done ? (
            <View style={styles.doneState}>
              <Ionicons name="checkmark-circle" size={48} color={Colors.success} />
              <Text style={styles.doneText}>Review submitted!</Text>
            </View>
          ) : (
            <>
              <View style={styles.handle} />
              <Text style={styles.heading}>Rate this packet</Text>
              <Text style={styles.packetTitle} numberOfLines={2}>{packetTitle}</Text>

              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map(n => (
                  <TouchableOpacity key={n} onPress={() => setRating(n)} style={styles.starBtn}>
                    <Ionicons
                      name={n <= rating ? 'star' : 'star-outline'}
                      size={40}
                      color={n <= rating ? Colors.gold : Colors.border}
                    />
                  </TouchableOpacity>
                ))}
              </View>

              {rating > 0 && (
                <Text style={styles.ratingLabel}>
                  {['', 'Not useful', 'Somewhat useful', 'Useful', 'Very useful', 'Must-have'][rating]}
                </Text>
              )}

              <TextInput
                style={styles.input}
                placeholder="What made it useful? (optional)"
                placeholderTextColor={Colors.textSecondary}
                value={comment}
                onChangeText={setComment}
                multiline
                maxLength={280}
              />

              <TouchableOpacity
                style={[styles.submitBtn, rating === 0 && styles.submitBtnDisabled]}
                onPress={handleSubmit}
                disabled={rating === 0 || submitting}
              >
                {submitting
                  ? <ActivityIndicator color={Colors.card} size="small" />
                  : <Text style={styles.submitText}>Submit Review</Text>
                }
              </TouchableOpacity>

              <TouchableOpacity style={styles.skipBtn} onPress={onClose}>
                <Text style={styles.skipText}>Skip for now</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.xl,
    paddingBottom: 40,
    alignItems: 'center',
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: Radius.full,
    marginBottom: Spacing.lg,
  },
  heading: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  packetTitle: {
    ...Typography.cardBody,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  starsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  starBtn: { padding: 4 },
  ratingLabel: {
    ...Typography.caption,
    color: Colors.accent,
    fontWeight: '600',
    marginBottom: Spacing.lg,
  },
  input: {
    width: '100%',
    backgroundColor: Colors.background,
    borderRadius: Radius.md,
    padding: Spacing.md,
    fontSize: 14,
    color: Colors.text,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: Spacing.md,
  },
  submitBtn: {
    width: '100%',
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  submitBtnDisabled: { opacity: 0.4 },
  submitText: { ...Typography.button, color: Colors.card },
  skipBtn: { paddingVertical: Spacing.sm },
  skipText: { ...Typography.caption, color: Colors.textSecondary },
  doneState: { alignItems: 'center', padding: Spacing.xl },
  doneText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginTop: Spacing.md,
  },
})
