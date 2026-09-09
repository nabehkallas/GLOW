import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, radius, spacing } from '../theme';

// entity = a product or a resolved variant object from the API (both carry
// is_offer_active, offer_price, price_tiers, and either original_price+price
// (variant) or just price (product, always the base)).
export function resolvePrice(entity, qty = 1) {
  if (!entity) return 0;
  if (entity.is_offer_active) return Number(entity.offer_price);
  const tiers = entity.price_tiers || [];
  const tier = tiers
    .filter((t) => qty >= t.min_quantity && t.price != null)
    .sort((a, b) => b.min_quantity - a.min_quantity)[0];
  if (tier) return Number(tier.price);
  return Number(entity.original_price ?? entity.price);
}

export function originalPriceOf(entity) {
  return Number(entity?.original_price ?? entity?.price ?? 0);
}

export default function PriceDisplay({ entity, qty = 1, size = 'base' }) {
  const { t } = useTranslation();
  const price = resolvePrice(entity, qty);
  const original = originalPriceOf(entity);
  const discounted = price < original;

  return (
    <View style={s.row}>
      <Text style={size === 'lg' ? s.priceLg : s.price}>${price.toFixed(2)}</Text>
      {discounted ? <Text style={s.original}>${original.toFixed(2)}</Text> : null}
      {entity?.is_offer_active ? (
        <View style={s.tag}>
          <Text style={s.tagText}>{t('orders.saleTag')}</Text>
        </View>
      ) : null}
    </View>
  );
}

export function TierHints({ entity }) {
  const { t } = useTranslation();
  const tiers = (entity?.price_tiers ?? []).filter((tr) => tr.price != null);
  if (tiers.length === 0) return null;
  return (
    <Text style={s.tierHint}>
      {t('orders.tierHintLabel')} {tiers.map((tr) => `${tr.min_quantity}+: $${Number(tr.price).toFixed(2)}`).join(' · ')}
    </Text>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', gap: 6 },
  price: { fontSize: 13, fontWeight: '800', color: colors.primary },
  priceLg: { fontSize: 22, fontWeight: '800', color: colors.primary },
  original: { fontSize: 11, color: colors.textMuted, textDecorationLine: 'line-through' },
  tag: { backgroundColor: '#dcfce7', borderRadius: radius.full, paddingHorizontal: 6, paddingVertical: 1 },
  tagText: { fontSize: 9, fontWeight: '700', color: '#15803d' },
  tierHint: { fontSize: 11, color: colors.textMuted, marginBottom: spacing.sm },
});
