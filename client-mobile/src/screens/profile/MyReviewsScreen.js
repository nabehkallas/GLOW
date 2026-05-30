import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import api from '../../api/client';
import { colors, spacing, radius, shadow } from '../../theme';

function ReviewCard({ review, onDelete }) {
  const { t } = useTranslation();
  return (
    <View style={s.card}>
      <View style={s.header}>
        <TouchableOpacity onPress={onDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={s.deleteBtn}>🗑</Text>
        </TouchableOpacity>
        <Text style={s.salonName}>{review.salon?.name ?? '—'}</Text>
      </View>
      <Text style={s.stars}>{'⭐'.repeat(review.rating)}</Text>
      {review.comment ? <Text style={s.comment}>{review.comment}</Text> : null}
      <Text style={s.date}>{new Date(review.created_at).toLocaleDateString('ar-SY')}</Text>
    </View>
  );
}

export default function MyReviewsScreen() {
  const { t } = useTranslation();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = () => {
    api.get('/client/reviews').then((res) => setReviews(res.data.data ?? [])).finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []);

  const handleDelete = (id) => {
    Alert.alert('', t('review.deleteConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'), style: 'destructive', onPress: async () => {
          await api.delete(`/client/reviews/${id}`).catch(() => {});
          setReviews((prev) => prev.filter((r) => r.id !== id));
        },
      },
    ]);
  };

  if (loading) return <View style={s.center}><ActivityIndicator color={colors.primary} /></View>;

  return (
    <FlatList
      data={reviews}
      keyExtractor={(i) => String(i.id)}
      renderItem={({ item }) => <ReviewCard review={item} onDelete={() => handleDelete(item.id)} />}
      contentContainerStyle={s.list}
      style={{ backgroundColor: colors.background }}
      ListEmptyComponent={
        <View style={s.empty}>
          <Text style={s.emptyText}>{t('profile.noReviews')}</Text>
        </View>
      }
    />
  );
}

const s = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: spacing.md, gap: 12 },
  card: { backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md, ...shadow },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  salonName: { fontSize: 15, fontWeight: '700', color: colors.dark },
  deleteBtn: { fontSize: 18 },
  stars: { fontSize: 16, marginBottom: 6 },
  comment: { fontSize: 14, color: colors.dark, textAlign: 'right', lineHeight: 22 },
  date: { fontSize: 12, color: colors.textMuted, textAlign: 'left', marginTop: 8, writingDirection: 'ltr' },
  empty: { paddingTop: 60, alignItems: 'center' },
  emptyText: { color: colors.textMuted, fontSize: 15 },
});
