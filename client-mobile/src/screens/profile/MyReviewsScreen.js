import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Trash2 } from 'lucide-react-native';
import api from '../../api/client';
import StarRating from '../../components/StarRating';
import { colors, spacing, radius, shadow } from '../../theme';

function ReviewCard({ review, onDelete }) {
  const { t } = useTranslation();
  return (
    <View style={s.card}>
      <View style={s.header}>
        <TouchableOpacity onPress={onDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Trash2 size={16} color={colors.textMuted} strokeWidth={1.75} />
        </TouchableOpacity>
        <Text style={s.salonName}>{review.salon?.name ?? '—'}</Text>
      </View>
      <View style={s.stars}><StarRating rating={review.rating} /></View>
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
  stars: { alignItems: 'flex-end', marginBottom: 6 },
  comment: { fontSize: 14, color: colors.dark, textAlign: 'right', lineHeight: 22 },
  date: { fontSize: 12, color: colors.textMuted, textAlign: 'left', marginTop: 8, writingDirection: 'ltr' },
  empty: { paddingTop: 60, alignItems: 'center' },
  emptyText: { color: colors.textMuted, fontSize: 15 },
});
