import React, { useState, useEffect, useCallback, useLayoutEffect } from 'react';
import {
  View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { ShoppingBag, ChevronLeft } from 'lucide-react-native';
import api from '../../api/client';
import { colors, spacing, radius } from '../../theme';

const STEPS = ['pending', 'confirmed', 'shipped', 'delivered'];

function Timeline({ status }) {
  const { t } = useTranslation();

  const isSpecial = ['cancelled', 'failed', 'returned', 'return_requested', 'cancellation_requested'].includes(status);
  if (isSpecial) {
    const dotStyle =
      status === 'failed' ? s.dotFailed :
      status === 'returned' || status === 'return_requested' ? s.dotReturned :
      status === 'cancellation_requested' ? s.dotReturned :
      s.dotCancelled;
    return (
      <View style={s.timelineWrap}>
        <View style={s.step}>
          <View style={[s.dot, dotStyle]} />
          <View style={s.stepText}>
            <Text style={s.stepLabel}>{t(`store.status.${status}`)}</Text>
          </View>
        </View>
      </View>
    );
  }

  const activeIndex = STEPS.indexOf(status);

  return (
    <View style={s.timelineWrap}>
      {STEPS.map((step, i) => {
        const done = i <= activeIndex;
        return (
          <View key={step} style={s.step}>
            <View style={s.dotCol}>
              <View style={[s.dot, done && s.dotDone]} />
              {i < STEPS.length - 1 && <View style={[s.line, i < activeIndex && s.lineDone]} />}
            </View>
            <View style={s.stepText}>
              <Text style={[s.stepLabel, done && s.stepLabelDone]}>{t(`store.status.${step}`)}</Text>
              {i === activeIndex && (
                <Text style={s.stepSub}>{t(`store.timeline.${step}`)}</Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

export default function StoreOrderDetailScreen({ route, navigation }) {
  const { t } = useTranslation();
  const { orderId } = route.params;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [requestingReturn, setRequestingReturn] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ paddingHorizontal: 16 }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ChevronLeft size={24} color="#fff" strokeWidth={1.75} />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  useEffect(() => {
    // Intercepts every way this screen can be dismissed — header button tap,
    // iOS swipe-back gesture, Android hardware back — not just the button's
    // onPress above (which the gesture/hardware paths never go through).
    // Always land on the orders list deterministically, regardless of how
    // deep or shallow this screen's stack is. Without this, gesture/hardware
    // back falls through to the default goBack(), which can bubble to the
    // tab navigator's own switch-history and strand this tab with no way back.
    let allowNext = false;
    return navigation.addListener('beforeRemove', (e) => {
      if (allowNext) return;
      e.preventDefault();
      allowNext = true;
      navigation.popTo('StoreOrders');
    });
  }, [navigation]);

  const fetchOrder = useCallback(async () => {
    try {
      const res = await api.get(`/client/orders/${orderId}`);
      setOrder(res.data.data);
    } catch {} finally { setLoading(false); }
  }, [orderId]);

  useEffect(() => { fetchOrder(); }, [fetchOrder]);

  const cancelOrder = () => {
    const isDirect = order.status === 'pending';
    const message = isDirect
      ? t('store.cancelConfirm')
      : t('store.requestCancelConfirm', { status: t(`store.status.${order.status}`) });
    Alert.alert(t('store.cancelOrder'), message, [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.confirm'),
        style: 'destructive',
        onPress: async () => {
          setCancelling(true);
          try {
            const res = await api.patch(`/client/orders/${orderId}/cancel`);
            setOrder(res.data.data);
          } catch (err) {
            Alert.alert(t('common.error'), err.response?.data?.message ?? t('common.error'));
          } finally {
            setCancelling(false);
          }
        },
      },
    ]);
  };

  const requestReturn = () => {
    Alert.alert(t('store.requestReturn'), t('store.requestReturnConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.confirm'),
        onPress: async () => {
          setRequestingReturn(true);
          try {
            const res = await api.patch(`/client/orders/${orderId}/request-return`);
            setOrder(res.data.data);
          } catch (err) {
            Alert.alert(t('common.error'), err.response?.data?.message ?? t('common.error'));
          } finally {
            setRequestingReturn(false);
          }
        },
      },
    ]);
  };

  if (loading || !order) {
    return (
      <View style={s.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={s.root} contentContainerStyle={s.content}>
      <View style={s.card}>
        <Text style={s.orderNum}>{t('store.orderNumber', { id: order.id })}</Text>
        <Timeline status={order.status} />
      </View>

      <View style={s.card}>
        {order.items.map((item) => (
          <View key={item.id} style={s.itemRow}>
            {item.product?.image_url
              ? <Image source={{ uri: item.product.image_url }} style={s.itemImage} />
              : <View style={[s.itemImage, s.itemImagePlaceholder]}><ShoppingBag size={18} color="#fff" strokeWidth={1.5} style={{ opacity: 0.6 }} /></View>
            }
            <View style={s.itemBody}>
              <Text style={s.itemName} numberOfLines={1}>{item.product?.name ?? '—'}</Text>
              {item.variant && (
                <Text style={s.itemVariant} numberOfLines={1}>{(item.variant.attribute_values ?? []).map((av) => av.value).join(' / ')}</Text>
              )}
              <Text style={s.itemMeta}>{item.quantity} × {t('salons.price', { amount: item.unit_price })}</Text>
            </View>
            <Text style={s.itemSubtotal}>{t('salons.price', { amount: item.subtotal })}</Text>
          </View>
        ))}

        <View style={s.totalRow}>
          <Text style={s.totalLabel}>{t('store.total')}</Text>
          <Text style={s.totalValue}>{t('salons.price', { amount: order.total_amount })}</Text>
        </View>

        {order.notes ? (
          <Text style={s.notes}>{order.notes}</Text>
        ) : null}
      </View>

      {(order.status === 'pending' || order.can_request_cancel) && (
        <TouchableOpacity style={s.cancelBtn} onPress={cancelOrder} disabled={cancelling}>
          <Text style={s.cancelText}>{cancelling ? t('common.loading') : t('store.cancelOrder')}</Text>
        </TouchableOpacity>
      )}

      {order.status === 'delivered' && order.can_request_return && (
        <TouchableOpacity style={s.cancelBtn} onPress={requestReturn} disabled={requestingReturn}>
          <Text style={s.cancelText}>{requestingReturn ? t('common.loading') : t('store.requestReturn')}</Text>
        </TouchableOpacity>
      )}

      {order.status === 'return_requested' && (
        <View style={[s.card, { backgroundColor: '#fff7ed' }]}>
          <Text style={{ color: '#f59e0b', fontSize: 13, fontWeight: '600', textAlign: 'center' }}>
            {t('store.returnPending')}
          </Text>
        </View>
      )}

      {order.status === 'cancellation_requested' && (
        <View style={[s.card, { backgroundColor: '#fff7ed' }]}>
          <Text style={{ color: '#f59e0b', fontSize: 13, fontWeight: '600', textAlign: 'center' }}>
            {t('store.cancelPending')}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: 12, paddingBottom: spacing.xl },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },

  card: {
    backgroundColor: '#fff', borderRadius: radius.md, padding: spacing.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  orderNum: { fontSize: 14, fontWeight: '700', color: colors.dark, textAlign: 'right', writingDirection: 'ltr', marginBottom: spacing.sm },

  timelineWrap: { marginTop: 4 },
  step: { flexDirection: 'row-reverse', minHeight: 46 },
  dotCol: { alignItems: 'center', width: 24 },
  dot: { width: 14, height: 14, borderRadius: 7, backgroundColor: colors.border },
  dotDone: { backgroundColor: colors.green },
  dotCancelled: { backgroundColor: '#ef4444' },
  dotFailed: { backgroundColor: '#64748b' },
  dotReturned: { backgroundColor: '#f59e0b' },
  line: { width: 2, flex: 1, backgroundColor: colors.border, marginVertical: 2 },
  lineDone: { backgroundColor: colors.green },
  stepText: { flex: 1, marginRight: 10, paddingBottom: 12 },
  stepLabel: { fontSize: 13, fontWeight: '600', color: colors.textMuted, textAlign: 'right' },
  stepLabelDone: { color: colors.dark, fontWeight: '700' },
  stepSub: { fontSize: 12, color: colors.primary, textAlign: 'right', marginTop: 2 },

  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderColor: '#f1f1f1' },
  itemImage: { width: 44, height: 44, borderRadius: radius.sm },
  itemImagePlaceholder: { backgroundColor: colors.dark, justifyContent: 'center', alignItems: 'center' },
  itemBody: { flex: 1, paddingHorizontal: spacing.sm },
  itemName: { fontSize: 13, fontWeight: '700', color: colors.dark, textAlign: 'right' },
  itemVariant: { fontSize: 11, color: colors.textMuted, textAlign: 'right', marginTop: 1 },
  itemMeta: { fontSize: 12, color: colors.textMuted, textAlign: 'right', marginTop: 2, writingDirection: 'ltr' },
  itemSubtotal: { fontSize: 13, fontWeight: '700', color: colors.dark, writingDirection: 'ltr' },

  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderColor: '#f1f1f1' },
  totalLabel: { fontSize: 14, fontWeight: '700', color: colors.dark },
  totalValue: { fontSize: 16, fontWeight: '800', color: colors.primary, writingDirection: 'ltr' },
  notes: { marginTop: spacing.sm, fontSize: 13, color: colors.textMuted, textAlign: 'right' },

  cancelBtn: { borderWidth: 1.5, borderColor: '#ef4444', borderRadius: radius.md, paddingVertical: 14, alignItems: 'center' },
  cancelText: { color: '#ef4444', fontSize: 14, fontWeight: '700' },
});
