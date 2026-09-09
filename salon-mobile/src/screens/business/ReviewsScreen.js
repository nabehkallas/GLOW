import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import api from '../../api/client';
import Card from '../../components/Card';
import { colors, radius, spacing } from '../../theme';

function stars(n) {
  return '★'.repeat(n) + '☆'.repeat(5 - n);
}

export default function ReviewsScreen() {
  const { t } = useTranslation();
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/salon/reviews').then(({ data }) => setData(data));
  }, []);

  if (!data) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const reviews = data.reviews?.data ?? [];

  return (
    <ScrollView style={s.wrap} contentContainerStyle={{ padding: spacing.md }}>
      <Card style={s.summaryCard}>
        <View style={s.summaryCol}>
          <Text style={s.avgValue}>{data.average_rating ?? '—'}</Text>
          <Text style={s.avgStars}>{data.average_rating ? stars(Math.round(data.average_rating)) : '—'}</Text>
          <Text style={s.summaryLabel}>{t('reviews.averageRating')}</Text>
        </View>
        <View style={s.divider} />
        <View style={s.summaryCol}>
          <Text style={s.countValue}>{data.reviews_count ?? 0}</Text>
          <Text style={s.summaryLabel}>{t('reviews.totalReviews')}</Text>
        </View>
      </Card>

      {reviews.length === 0 ? (
        <Text style={s.empty}>{t('reviews.empty')}</Text>
      ) : (
        reviews.map((r) => (
          <Card key={r.id} style={{ marginTop: spacing.sm }}>
            <View style={s.reviewHeader}>
              <Text style={s.clientName}>{r.client?.name ?? t('common.client')}</Text>
              <Text style={s.reviewStars}>{stars(r.rating)}</Text>
            </View>
            {r.comment ? <Text style={s.comment}>{r.comment}</Text> : null}
            <Text style={s.date}>{new Date(r.created_at).toLocaleDateString()}</Text>
          </Card>
        ))
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  summaryCard: { flexDirection: 'row', alignItems: 'center' },
  summaryCol: { flex: 1, alignItems: 'center' },
  divider: { width: 1, height: 50, backgroundColor: colors.border },
  avgValue: { fontSize: 32, fontWeight: '800', color: colors.primary },
  avgStars: { fontSize: 16, color: colors.primary, marginTop: 2 },
  countValue: { fontSize: 28, fontWeight: '800', color: colors.dark },
  summaryLabel: { fontSize: 11, color: colors.textMuted, marginTop: 4 },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xs },
  clientName: { fontSize: 14, fontWeight: '700', color: colors.dark },
  reviewStars: { fontSize: 14, color: colors.primary },
  comment: { fontSize: 13, color: colors.dark, marginBottom: spacing.xs },
  date: { fontSize: 11, color: colors.textMuted },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: spacing.xl, fontSize: 14 },
});
