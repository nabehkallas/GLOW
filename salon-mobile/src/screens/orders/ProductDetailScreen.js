import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Package, Play, Minus, Plus } from 'lucide-react-native';
import useCartStore from '../../stores/cartStore';
import PriceDisplay, { TierHints } from '../../components/PriceDisplay';
import { localizedCategory } from '../../utils/product';
import { colors, radius, spacing } from '../../theme';

function HeroVideo({ url }) {
  const player = useVideoPlayer(url, (p) => { p.loop = false; });

  useEffect(() => {
    const timeout = setTimeout(() => player.play(), 300);
    return () => clearTimeout(timeout);
  }, [player]);

  return <VideoView player={player} style={s.hero} contentFit="contain" nativeControls allowsFullscreen />;
}

export default function ProductDetailScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const { product } = route.params;
  const category = localizedCategory(product, i18n.language);
  const addItems = useCartStore((s) => s.addItems);

  const images = product.images ?? [];
  const attributes = product.attributes ?? [];
  const hasVariants = (product.variants ?? []).length > 0;
  const [activeImage, setActiveImage] = useState(0);
  const [selected, setSelected] = useState({});
  const [qty, setQty] = useState(1);

  const resolvedVariant = useMemo(() => {
    if (!hasVariants) return null;
    if (Object.keys(selected).length !== attributes.length) return null;
    return (
      (product.variants ?? []).find((v) =>
        attributes.every((attr) => (v.attribute_values ?? []).some((av) => av.attribute_id === attr.id && av.value_id === selected[attr.id]))
      ) ?? null
    );
  }, [selected, product, attributes, hasVariants]);

  const priceEntity = hasVariants ? resolvedVariant : product;
  const effectiveStock = hasVariants ? resolvedVariant?.stock : product.stock;
  const outOfStock = hasVariants ? !!resolvedVariant && resolvedVariant.stock === 0 : product.stock === 0;
  const isResolved = hasVariants ? !!resolvedVariant : true;
  const canAdd = isResolved && !outOfStock && qty > 0 && qty <= (effectiveStock ?? 0);

  const add = () => {
    if (!canAdd) return;
    addItems(product, hasVariants ? resolvedVariant : null, qty);
    navigation.goBack();
  };

  const mainItem = images[activeImage];
  const mainImage = mainItem?.url ?? product.image_url;

  return (
    <ScrollView style={s.wrap}>
      {mainItem?.type === 'video' ? (
        <HeroVideo url={mainItem.url} />
      ) : mainImage ? (
        <Image source={{ uri: mainImage }} style={s.hero} />
      ) : (
        <View style={[s.hero, s.heroFallback]}>
          <Package size={48} color={colors.border} />
        </View>
      )}

      {images.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.thumbRow}>
          {images.map((img, i) => (
            <TouchableOpacity key={img.id} onPress={() => setActiveImage(i)} style={[s.thumb, i === activeImage && s.thumbActive]}>
              {img.type === 'video' ? (
                <View style={[s.thumbImg, s.thumbVideo]}>
                  <Play size={16} color="#fff" fill="#fff" />
                </View>
              ) : (
                <Image source={{ uri: img.url }} style={s.thumbImg} />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <View style={{ padding: spacing.md }}>
        <Text style={s.name}>{product.name}</Text>
        {category ? (
          <View style={s.categoryBadge}>
            <Text style={s.categoryText}>{category}</Text>
          </View>
        ) : null}
        {product.description ? <Text style={s.description}>{product.description}</Text> : null}

        {hasVariants &&
          attributes.map((attr) => (
            <View key={attr.id} style={{ marginBottom: spacing.md }}>
              <Text style={s.attrLabel}>{attr.name}</Text>
              <View style={s.attrValues}>
                {(attr.values ?? []).map((v) => {
                  const active = selected[attr.id] === v.id;
                  if (attr.type === 'color') {
                    return (
                      <TouchableOpacity
                        key={v.id}
                        onPress={() => setSelected((sel) => ({ ...sel, [attr.id]: v.id }))}
                        style={[s.swatch, { backgroundColor: v.swatch_hex || '#ccc' }, active && s.swatchActive]}
                      />
                    );
                  }
                  return (
                    <TouchableOpacity
                      key={v.id}
                      onPress={() => setSelected((sel) => ({ ...sel, [attr.id]: v.id }))}
                      style={[s.pill, active && s.pillActive]}
                    >
                      <Text style={[s.pillText, active && s.pillTextActive]}>{v.value}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}

        {hasVariants && !isResolved ? (
          <Text style={s.hint}>{t('orders.selectOptions')}</Text>
        ) : outOfStock ? (
          <Text style={s.hintDanger}>{t('orders.combinationOutOfStock')}</Text>
        ) : (
          <>
            <View style={s.priceRow}>
              <PriceDisplay entity={priceEntity} qty={qty} size="lg" />
              <View style={s.stepper}>
                <TouchableOpacity onPress={() => setQty((q) => Math.max(1, q - 1))} style={s.stepBtn}>
                  <Minus size={16} color={colors.primary} />
                </TouchableOpacity>
                <Text style={s.stepValue}>{qty}</Text>
                <TouchableOpacity onPress={() => setQty((q) => Math.min(effectiveStock, q + 1))} disabled={qty >= effectiveStock} style={[s.stepBtn, s.stepBtnFilled]}>
                  <Plus size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
            <TierHints entity={priceEntity} />
          </>
        )}

        <TouchableOpacity style={[s.addBtn, !canAdd && s.addBtnDisabled]} onPress={add} disabled={!canAdd} activeOpacity={0.85}>
          <Text style={s.addBtnText}>{t('common.add')}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.background },
  hero: { width: '100%', height: 280 },
  heroFallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' },
  thumbRow: { padding: spacing.sm, gap: spacing.sm, backgroundColor: '#f8fafc' },
  thumb: { width: 52, height: 52, borderRadius: radius.sm, borderWidth: 2, borderColor: 'transparent', overflow: 'hidden' },
  thumbActive: { borderColor: colors.primary },
  thumbImg: { width: '100%', height: '100%' },
  thumbVideo: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.dark },
  name: { fontSize: 19, fontWeight: '800', color: colors.dark, marginBottom: spacing.xs },
  categoryBadge: { alignSelf: 'flex-start', backgroundColor: '#fff1eb', borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 3, marginBottom: spacing.sm },
  categoryText: { fontSize: 11, fontWeight: '600', color: '#c2410c' },
  description: { fontSize: 13, color: colors.textMuted, marginBottom: spacing.md, lineHeight: 19 },
  attrLabel: { fontSize: 12, fontWeight: '600', color: colors.textMuted, marginBottom: spacing.xs },
  attrValues: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  swatch: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: colors.border },
  swatchActive: { borderColor: colors.primary },
  pill: { paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border },
  pillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  pillText: { fontSize: 13, color: colors.dark },
  pillTextActive: { color: '#fff' },
  hint: { fontSize: 12, color: colors.textMuted, marginBottom: spacing.md },
  hintDanger: { fontSize: 12, color: '#dc2626', marginBottom: spacing.md },
  priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border, marginBottom: spacing.md },
  price: { fontSize: 22, fontWeight: '800', color: colors.primary },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  stepBtn: { width: 30, height: 30, borderRadius: radius.sm, backgroundColor: '#fff1eb', alignItems: 'center', justifyContent: 'center' },
  stepBtnFilled: { backgroundColor: colors.primary },
  stepValue: { fontSize: 15, fontWeight: '700', color: colors.dark, minWidth: 24, textAlign: 'center' },
  addBtn: { backgroundColor: colors.primary, borderRadius: radius.sm, paddingVertical: 14, alignItems: 'center', marginBottom: spacing.xl },
  addBtnDisabled: { opacity: 0.4 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
