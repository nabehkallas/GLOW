import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Package } from 'lucide-react-native';
import api from '../../api/client';
import { colors, spacing, radius } from '../../theme';

const STATUS_COLORS = {
  pending:   { color: '#f59e0b', bg: '#fef3c7' },
  confirmed: { color: colors.green, bg: '#d1fae5' },
  shipped:   { color: '#8b5cf6', bg: '#ede9fe' },
  delivered: { color: colors.green, bg: '#d1fae5' },
  cancelled: { color: '#ef4444', bg: '#fee2e2' },
  failed:    { color: '#64748b', bg: '#f1f5f9' },
  returned:  { color: '#f59e0b', bg: '#fef3c7' },
  return_requested: { color: '#f59e0b', bg: '#fef3c7' },
  cancellation_requested: { color: '#f59e0b', bg: '#fef3c7' },
};

function OrderCard({ order, onPress }) {
  const { t } = useTranslation();
  const meta = STATUS_COLORS[order.status] ?? STATUS_COLORS.pending;

  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.88}>
      <View style={[s.accent, { backgroundColor: meta.color }]} />
      <View style={s.body}>
        <View style={s.top}>
          <View style={[s.badge, { backgroundColor: meta.bg }]}>
            <Text style={[s.badgeText, { color: meta.color }]}>{t(`store.status.${order.status}`)}</Text>
          </View>
          <Text style={s.orderNum}>{t('store.orderNumber', { id: order.id })}</Text>
        </View>
        <View style={s.bottom}>
          <Text style={s.total}>{t('salons.price', { amount: order.total_amount })}</Text>
          <Text style={s.date}>{order.created_at?.slice(0, 10)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function StoreOrdersListScreen({ navigation }) {
  const { t } = useTranslation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await api.get('/client/orders');
      setOrders(res.data.data ?? []);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { setLoading(true); fetchOrders(); }, [fetchOrders]);
  const onRefresh = async () => { setRefreshing(true); await fetchOrders(); setRefreshing(false); };

  return (
    <View style={s.root}>
      <FlatList
        data={orders}
        keyExtractor={(i) => String(i.id)}
        renderItem={({ item }) => (
          <OrderCard order={item} onPress={() => navigation.navigate('StoreOrderDetail', { orderId: item.id })} />
        )}
        contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          !loading && (
            <View style={s.empty}>
              <Package size={44} color={colors.textMuted} strokeWidth={1.5} style={{ marginBottom: spacing.sm }} />
              <Text style={s.emptyText}>{t('store.noOrders')}</Text>
            </View>
          )
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.md, gap: 12 },
  card: {
    backgroundColor: '#fff', borderRadius: radius.md, flexDirection: 'row', overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  accent: { width: 5 },
  body: { flex: 1, padding: spacing.md },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full },
  badgeText: { fontSize: 11, fontWeight: '700' },
  orderNum: { fontSize: 13, color: colors.textMuted, fontWeight: '600', writingDirection: 'ltr' },
  bottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  total: { fontSize: 15, fontWeight: '800', color: colors.primary, writingDirection: 'ltr' },
  date: { fontSize: 12, color: colors.textMuted, writingDirection: 'ltr' },
  empty: { paddingTop: 60, alignItems: 'center' },
  emptyText: { color: colors.textMuted, fontSize: 15, textAlign: 'center' },
});
