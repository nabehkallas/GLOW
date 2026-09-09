import React, { useState } from 'react';
import { View, Text, Image, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { Minus, Plus, Package } from 'lucide-react-native';
import api from '../../api/client';
import DismissKeyboardView from '../../components/DismissKeyboardView';
import useCartStore, { priceOf, stockOf } from '../../stores/cartStore';
import { originalPriceOf } from '../../components/PriceDisplay';
import { colors, radius, spacing } from '../../theme';

export default function CartScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { items, notes, setNotes, updateQuantity, clear, totalAmount } = useCartStore();
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');

  const placeOrder = async () => {
    if (!items.length) return;
    setPlacing(true);
    setError('');
    try {
      await api.post('/salon/orders', {
        items: items.map((i) => ({ product_id: i.product.id, product_variant_id: i.variant?.id ?? null, quantity: i.quantity })),
        notes: notes || undefined,
      });
      clear();
      navigation.navigate('OrdersHome', { placed: true });
    } catch (e) {
      setError(e.response?.data?.message ?? t('orders.failedToPlace'));
    } finally {
      setPlacing(false);
    }
  };

  if (items.length === 0) {
    return (
      <View style={s.empty}>
        <Text style={s.emptyText}>{t('orders.emptyCart')}</Text>
      </View>
    );
  }

  return (
    <DismissKeyboardView>
    <View style={s.wrap}>
      <ScrollView contentContainerStyle={{ padding: spacing.md }} keyboardShouldPersistTaps="handled">
        {items.map((item) => {
          const key = item.variant ? `v${item.variant.id}` : `p${item.product.id}`;
          const price = priceOf(item);
          const original = originalPriceOf(item.variant ?? item.product);
          const discounted = price < original;
          const maxStock = stockOf(item);
          const variantLabel = item.variant ? (item.variant.attribute_values ?? []).map((av) => av.value).join(' / ') : null;

          return (
            <View key={key} style={s.row}>
              {item.product.image_url ? (
                <Image source={{ uri: item.product.image_url }} style={s.thumb} />
              ) : (
                <View style={[s.thumb, s.thumbFallback]}>
                  <Package size={18} color={colors.border} />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={s.name} numberOfLines={1}>{item.product.name}</Text>
                {variantLabel ? <Text style={s.variant}>{variantLabel}</Text> : null}
                <View style={s.unitPriceRow}>
                  <Text style={s.unitPrice}>${price.toFixed(2)} {t('orders.each')}</Text>
                  {discounted ? <Text style={s.unitPriceOriginal}>${original.toFixed(2)}</Text> : null}
                </View>
                <View style={s.stepper}>
                  <TouchableOpacity onPress={() => updateQuantity(item.product.id, item.variant?.id, item.quantity - 1)} style={s.stepBtn}>
                    <Minus size={14} color="#c2410c" />
                  </TouchableOpacity>
                  <Text style={s.stepValue}>{item.quantity}</Text>
                  <TouchableOpacity
                    onPress={() => updateQuantity(item.product.id, item.variant?.id, item.quantity + 1)}
                    disabled={item.quantity >= maxStock}
                    style={s.stepBtn}
                  >
                    <Plus size={14} color="#c2410c" />
                  </TouchableOpacity>
                </View>
              </View>
              <Text style={s.lineTotal}>${(price * item.quantity).toFixed(2)}</Text>
            </View>
          );
        })}

        <Text style={s.label}>{t('orders.notes')}</Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder={t('orders.notesPlaceholder')}
          style={s.input}
          multiline
          textAlignVertical="top"
        />
      </ScrollView>

      <View style={s.footer}>
        {error ? <Text style={s.error}>{error}</Text> : null}
        <View style={s.totalRow}>
          <Text style={s.totalLabel}>{t('common.total')}</Text>
          <Text style={s.totalValue}>${totalAmount().toFixed(2)}</Text>
        </View>
        <TouchableOpacity style={s.placeBtn} onPress={placeOrder} disabled={placing} activeOpacity={0.85}>
          {placing ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.placeBtnText}>{t('orders.placeOrder')}</Text>}
        </TouchableOpacity>
      </View>
    </View>
    </DismissKeyboardView>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.background },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  emptyText: { color: colors.textMuted, fontSize: 14 },
  row: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md, alignItems: 'flex-start' },
  thumb: { width: 48, height: 48, borderRadius: radius.sm },
  thumbFallback: { backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 13, fontWeight: '700', color: colors.dark },
  variant: { fontSize: 11, color: colors.textMuted },
  unitPriceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 2 },
  unitPrice: { fontSize: 11, color: colors.textMuted },
  unitPriceOriginal: { fontSize: 10, color: colors.textMuted, textDecorationLine: 'line-through' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.xs },
  stepBtn: { width: 24, height: 24, borderRadius: radius.sm, backgroundColor: '#fff1eb', alignItems: 'center', justifyContent: 'center' },
  stepValue: { fontSize: 13, fontWeight: '700', color: colors.dark, minWidth: 20, textAlign: 'center' },
  lineTotal: { fontSize: 13, fontWeight: '700', color: colors.dark },
  label: { fontSize: 12, fontWeight: '600', color: colors.dark, marginBottom: spacing.xs, marginTop: spacing.sm },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.dark,
    backgroundColor: '#fff',
    height: 70,
  },
  footer: { padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.card },
  error: { color: '#dc2626', fontSize: 12, marginBottom: spacing.xs },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  totalLabel: { fontSize: 14, fontWeight: '700', color: colors.dark },
  totalValue: { fontSize: 16, fontWeight: '800', color: colors.dark },
  placeBtn: { backgroundColor: colors.primary, borderRadius: radius.sm, paddingVertical: 14, alignItems: 'center' },
  placeBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
