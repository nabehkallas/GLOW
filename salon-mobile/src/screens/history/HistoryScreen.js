import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Image, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Package, X } from 'lucide-react-native';
import api from '../../api/client';
import Card from '../../components/Card';
import DateField from '../../components/DateField';
import StatusBadge from '../../components/StatusBadge';
import { colors, radius, spacing } from '../../theme';

function pad(n) {
  return String(n).padStart(2, '0');
}
function toDateParam(d) {
  return d ? `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` : undefined;
}

export default function HistoryScreen() {
  const { t } = useTranslation();
  const [tab, setTab] = useState('appointments');
  const [dateFrom, setDateFrom] = useState(null);
  const [dateTo, setDateTo] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = { date_from: toDateParam(dateFrom), date_to: toDateParam(dateTo) };
    if (tab === 'appointments') {
      api
        .get('/salon/appointments', { params })
        .then(({ data }) => setAppointments(data.data ?? data))
        .finally(() => setLoading(false));
    } else {
      api
        .get('/salon/orders', { params })
        .then(({ data }) => setOrders(data.data ?? data))
        .finally(() => setLoading(false));
    }
  }, [tab, dateFrom, dateTo]);

  return (
    <View style={s.wrap}>
      <View style={s.tabBar}>
        {['appointments', 'orders'].map((key) => (
          <TouchableOpacity key={key} onPress={() => setTab(key)} style={[s.tabChip, tab === key && s.tabChipActive]} activeOpacity={0.8}>
            <Text style={[s.tabChipText, tab === key && s.tabChipTextActive]}>
              {key === 'appointments' ? t('appointments.title') : t('nav.orders')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={s.dateRow}>
        <View style={{ flex: 1 }}>
          <DateField label={t('appointments.dateFrom')} value={dateFrom} onChange={setDateFrom} />
        </View>
        <View style={{ flex: 1 }}>
          <DateField label={t('appointments.dateTo')} value={dateTo} onChange={setDateTo} />
        </View>
        {(dateFrom || dateTo) && (
          <TouchableOpacity
            onPress={() => {
              setDateFrom(null);
              setDateTo(null);
            }}
            style={s.clearBtn}
            hitSlop={8}
          >
            <X size={16} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.xl }} />
      ) : tab === 'appointments' ? (
        <FlatList
          data={appointments}
          keyExtractor={(a) => String(a.id)}
          contentContainerStyle={{ padding: spacing.md, paddingTop: 0, gap: spacing.sm }}
          ListEmptyComponent={<Text style={s.empty}>{t('history.noAppointments')}</Text>}
          renderItem={({ item: a }) => (
            <Card>
              <View style={s.row}>
                <View style={{ flex: 1 }}>
                  <Text style={s.rowTitle}>{a.source === 'manual' ? a.client_name : a.client?.name ?? '—'}</Text>
                  <Text style={s.rowSubtitle}>{a.service?.name ?? (a.source === 'manual' ? t('appointments.other') : '—')}</Text>
                  <Text style={s.rowDate}>{new Date(a.scheduled_at).toLocaleString()}</Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 6 }}>
                  <StatusBadge status={a.status} />
                  <Text style={s.rowPrice}>${a.price_at_booking}</Text>
                </View>
              </View>
            </Card>
          )}
        />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(o) => String(o.id)}
          contentContainerStyle={{ padding: spacing.md, paddingTop: 0, gap: spacing.md }}
          ListEmptyComponent={<Text style={s.empty}>{t('history.noOrders')}</Text>}
          renderItem={({ item: o }) => (
            <Card>
              <View style={s.orderHeader}>
                <Text style={s.orderNumber}>{t('orders.orderNumber', { id: o.id })}</Text>
                <StatusBadge status={o.status} />
              </View>
              <View style={s.itemsList}>
                {(o.items ?? []).map((item) => (
                  <View key={item.id} style={s.itemRow}>
                    {item.product?.image_url ? (
                      <Image source={{ uri: item.product.image_url }} style={s.itemThumb} />
                    ) : (
                      <View style={[s.itemThumb, s.itemThumbFallback]}>
                        <Package size={14} color={colors.border} />
                      </View>
                    )}
                    <Text style={s.itemName} numberOfLines={1}>
                      {item.product?.name ?? `#${item.product_id}`} × {item.quantity}
                    </Text>
                    <Text style={s.itemPrice}>${item.unit_price}</Text>
                  </View>
                ))}
              </View>
              <View style={s.orderTotalRow}>
                <Text style={s.orderTotalLabel}>{t('common.total')}</Text>
                <Text style={s.orderTotalValue}>${o.total_amount}</Text>
              </View>
            </Card>
          )}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.background },
  tabBar: { flexDirection: 'row', gap: spacing.xs, paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.sm },
  tabChip: { paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.full, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  tabChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabChipText: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  tabChipTextActive: { color: '#fff' },
  dateRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
  clearBtn: { padding: 12 },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: spacing.xl, fontSize: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  rowTitle: { fontSize: 15, fontWeight: '700', color: colors.dark },
  rowSubtitle: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  rowDate: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  rowPrice: { fontSize: 14, fontWeight: '700', color: colors.dark },
  orderHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  orderNumber: { fontSize: 14, fontWeight: '700', color: colors.dark },
  itemsList: { paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border, gap: spacing.xs },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  itemThumb: { width: 28, height: 28, borderRadius: radius.sm },
  itemThumbFallback: { backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  itemName: { flex: 1, fontSize: 12, color: colors.dark },
  itemPrice: { fontSize: 12, fontWeight: '600', color: colors.dark },
  orderTotalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  orderTotalLabel: { fontSize: 13, fontWeight: '700', color: colors.dark },
  orderTotalValue: { fontSize: 13, fontWeight: '800', color: colors.dark },
});
