import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import api from '../../api/client';
import { colors, spacing, radius, shadow } from '../../theme';

function ReviewCard({ review }) {
  return (
    <View style={s.card}>
      <View style={s.header}>
        <Text style={s.date}>{new Date(review.created_at).toLocaleDateString('ar-SY')}</Text>
        <Text style={s.name}>{review.user?.name ?? 'مجهول'}</Text>
      </View>
      <Text style={s.stars}>{'⭐'.repeat(review.rating)}</Text>
      {review.comment ? <Text style={s.comment}>{review.comment}</Text> : null}
    </View>
  );
}

export default function SalonReviewsScreen({ route }) {
  const { t } = useTranslation();
  const { salonId } = route.params;
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetch = async (p = 1) => {
    try {
      const res = await api.get(`/client/salons/${salonId}/reviews`, { params: { page: p } });
      const data = res.data.data ?? [];
      const meta = res.data.meta;
      setReviews((prev) => p === 1 ? data : [...prev, ...data]);
      setHasMore(meta ? meta.current_page < meta.last_page : false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(1); }, []);

  const loadMore = () => {
    if (!hasMore) return;
    const next = page + 1;
    setPage(next);
    fetch(next);
  };

  return (
    <View style={s.root}>
      <FlatList
        data={reviews}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => <ReviewCard review={item} />}
        contentContainerStyle={s.list}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={
          loading
            ? <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
            : <View style={s.empty}><Text style={s.emptyText}>{t('salons.noReviews')}</Text></View>
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.md, gap: 12 },
  card: {
    backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md, ...shadow,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  name: { fontSize: 14, fontWeight: '600', color: colors.dark },
  date: { fontSize: 12, color: colors.textMuted, writingDirection: 'ltr' },
  stars: { fontSize: 16, marginBottom: 6 },
  comment: { fontSize: 14, color: colors.dark, textAlign: 'right', lineHeight: 22 },
  empty: { paddingTop: 60, alignItems: 'center' },
  emptyText: { color: colors.textMuted, fontSize: 15 },
});
