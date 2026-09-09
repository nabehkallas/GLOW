import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Image, TextInput, Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { ShoppingBag, ShoppingCart } from 'lucide-react-native';
import api from '../../api/client';
import useCartStore, { keyFor } from '../../stores/cartStore';
import { colors, spacing, radius } from '../../theme';
import { resolvePrice, originalPriceOf } from '../../utils/pricing';

function CartRow({ item }) {
  const { t } = useTranslation();
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const { product, variant, quantity } = item;
  const entity = variant ?? product;
  const price = resolvePrice(entity, quantity);
  const original = originalPriceOf(entity);
  const discounted = price < original;
  const stock = variant ? variant.stock : product.stock;
  const variantLabel = variant ? (variant.attribute_values ?? []).map((av) => av.value).join(' / ') : null;

  return (
    <View style={s.row}>
      {product.image_url
        ? <Image source={{ uri: product.image_url }} style={s.image} />
        : <View style={[s.image, s.imagePlaceholder]}><ShoppingBag size={22} color="#fff" strokeWidth={1.5} style={{ opacity: 0.6 }} /></View>
      }
      <View style={s.rowBody}>
        <Text style={s.name} numberOfLines={1}>{product.name}</Text>
        {variantLabel && <Text style={s.variantLabel} numberOfLines={1}>{variantLabel}</Text>}
        <View style={s.priceRow}>
          <Text style={s.price}>{t('salons.price', { amount: price.toFixed(2) })}</Text>
          {discounted && <Text style={s.priceOriginal}>{t('salons.price', { amount: original.toFixed(2) })}</Text>}
        </View>

        <View style={s.stepper}>
          <TouchableOpacity style={s.stepBtn} onPress={() => updateQuantity(product.id, variant?.id, quantity - 1)}>
            <Text style={s.stepBtnText}>−</Text>
          </TouchableOpacity>
          <Text style={s.qty}>{quantity}</Text>
          <TouchableOpacity
            style={[s.stepBtn, quantity >= stock && s.stepBtnDisabled]}
            disabled={quantity >= stock}
            onPress={() => updateQuantity(product.id, variant?.id, quantity + 1)}
          >
            <Text style={s.stepBtnText}>+</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.removeBtn} onPress={() => removeItem(product.id, variant?.id)}>
            <Text style={s.removeText}>{t('store.remove')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export default function CartScreen({ navigation }) {
  const { t } = useTranslation();
  const items = useCartStore((s) => s.items);
  const clear = useCartStore((s) => s.clear);
  const totalAmount = useCartStore((s) => s.totalAmount());
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const checkout = async () => {
    setSubmitting(true);
    try {
      await api.post('/client/orders', {
        items: items.map((i) => ({ product_id: i.product.id, product_variant_id: i.variant?.id ?? null, quantity: i.quantity })),
        notes: notes || undefined,
      });
      clear();
      Alert.alert(t('store.orderSuccess'), t('store.orderSuccessMsg'), [
        { text: t('common.confirm'), onPress: () => navigation.navigate('StoreOrders') },
      ]);
    } catch (err) {
      Alert.alert(t('common.error'), err.response?.data?.message ?? t('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <View style={s.empty}>
        <ShoppingCart size={44} color={colors.textMuted} strokeWidth={1.5} style={{ marginBottom: spacing.sm }} />
        <Text style={s.emptyTitle}>{t('store.cartEmpty')}</Text>
        <Text style={s.emptyMsg}>{t('store.cartEmptyMsg')}</Text>
      </View>
    );
  }

  return (
    <View style={s.root}>
      <FlatList
        data={items}
        keyExtractor={(i) => keyFor(i.product.id, i.variant?.id)}
        renderItem={({ item }) => <CartRow item={item} />}
        contentContainerStyle={s.list}
        ListFooterComponent={
          <View style={s.notesWrap}>
            <Text style={s.notesLabel}>{t('store.notes')}</Text>
            <TextInput
              style={s.notesInput}
              value={notes}
              onChangeText={setNotes}
              placeholder={t('store.notesPlaceholder')}
              placeholderTextColor={colors.textMuted}
              multiline
              textAlign="right"
            />
          </View>
        }
      />

      <View style={s.footer}>
        <View style={s.totalRow}>
          <Text style={s.totalLabel}>{t('store.total')}</Text>
          <Text style={s.totalValue}>{t('salons.price', { amount: totalAmount.toFixed(2) })}</Text>
        </View>
        <Text style={s.paymentNote}>{t('store.checkoutPayment')}</Text>
        <TouchableOpacity style={s.checkoutBtn} onPress={checkout} disabled={submitting}>
          <Text style={s.checkoutText}>{submitting ? t('common.loading') : t('store.checkout')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.md, gap: 12 },

  row: {
    flexDirection: 'row', backgroundColor: '#fff', borderRadius: radius.md, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  image: { width: 84, height: 84 },
  imagePlaceholder: { backgroundColor: colors.dark, justifyContent: 'center', alignItems: 'center' },
  rowBody: { flex: 1, padding: spacing.sm },
  name: { fontSize: 14, fontWeight: '700', color: colors.dark, textAlign: 'right' },
  variantLabel: { fontSize: 12, color: colors.textMuted, textAlign: 'right', marginTop: 1 },
  priceRow: { flexDirection: 'row-reverse', alignItems: 'baseline', gap: 6, marginTop: 2 },
  price: { fontSize: 13, color: colors.primary, fontWeight: '700', textAlign: 'right', writingDirection: 'ltr' },
  priceOriginal: { fontSize: 11, color: colors.textMuted, textDecorationLine: 'line-through', writingDirection: 'ltr' },

  stepper: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 10 },
  stepBtn: {
    width: 26, height: 26, borderRadius: 13, backgroundColor: colors.background,
    borderWidth: 1, borderColor: colors.border, justifyContent: 'center', alignItems: 'center',
  },
  stepBtnDisabled: { opacity: 0.4 },
  stepBtnText: { fontSize: 16, fontWeight: '700', color: colors.dark },
  qty: { fontSize: 14, fontWeight: '700', color: colors.dark, minWidth: 20, textAlign: 'center' },
  removeBtn: { marginLeft: 'auto' },
  removeText: { fontSize: 12, color: '#ef4444', fontWeight: '600' },

  notesWrap: { marginTop: 8 },
  notesLabel: { fontSize: 13, fontWeight: '600', color: colors.dark, textAlign: 'right', marginBottom: 6 },
  notesInput: {
    backgroundColor: '#fff', borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    padding: spacing.sm, fontSize: 13, color: colors.dark, minHeight: 70, textAlignVertical: 'top',
  },

  footer: {
    backgroundColor: '#fff', padding: spacing.md, borderTopWidth: 1, borderColor: colors.border,
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  totalLabel: { fontSize: 15, fontWeight: '700', color: colors.dark },
  totalValue: { fontSize: 17, fontWeight: '800', color: colors.primary, writingDirection: 'ltr' },
  paymentNote: { fontSize: 12, color: colors.textMuted, textAlign: 'right', marginBottom: 10 },
  checkoutBtn: { backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: 15, alignItems: 'center' },
  checkoutText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background, padding: spacing.lg },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.dark, marginBottom: 4 },
  emptyMsg: { fontSize: 13, color: colors.textMuted, textAlign: 'center' },
});
