import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import api from '../../api/client';
import { colors, spacing, radius, shadow } from '../../theme';

export default function WriteReviewScreen({ route, navigation }) {
  const { t } = useTranslation();
  const { appointmentId, salonId } = route.params;
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) { Alert.alert('', 'يرجى اختيار تقييم'); return; }
    setLoading(true);
    try {
      await api.post('/client/reviews', { appointment_id: appointmentId, salon_id: salonId, rating, comment: comment.trim() || null });
      Alert.alert(t('review.success'), '', [
        { text: t('common.confirm'), onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('', err.response?.data?.message ?? t('common.error'));
    } finally { setLoading(false); }
  };

  return (
    <ScrollView style={s.root} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      <Text style={s.label}>{t('review.rating')}</Text>
      <View style={s.stars}>
        {[1, 2, 3, 4, 5].map((n) => (
          <TouchableOpacity key={n} onPress={() => setRating(n)} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
            <Text style={[s.star, n <= rating && s.starActive]}>{n <= rating ? '⭐' : '☆'}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={s.label}>{t('review.comment')}</Text>
      <TextInput
        style={s.textarea}
        placeholder={t('review.commentPlaceholder')}
        placeholderTextColor={colors.textMuted}
        value={comment}
        onChangeText={setComment}
        multiline
        numberOfLines={5}
        textAlign="right"
        textAlignVertical="top"
      />

      <TouchableOpacity
        style={[s.btn, (loading || rating === 0) && s.btnDisabled]}
        onPress={handleSubmit}
        disabled={loading || rating === 0}
        activeOpacity={0.8}
      >
        <Text style={s.btnText}>{loading ? t('common.loading') : t('review.submit')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md },
  label: { fontSize: 15, fontWeight: '700', color: colors.dark, textAlign: 'right', marginBottom: spacing.sm, marginTop: spacing.md },
  stars: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: spacing.md },
  star: { fontSize: 36, color: '#e0e0e0' },
  starActive: { color: '#ffa726' },
  textarea: {
    backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md,
    minHeight: 120, fontSize: 15, color: colors.dark, ...shadow, marginBottom: spacing.lg,
  },
  btn: {
    backgroundColor: colors.primary, borderRadius: radius.sm, height: 52,
    justifyContent: 'center', alignItems: 'center',
  },
  btnDisabled: { opacity: 0.4 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
