import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView, Image, Dimensions } from 'react-native';
import { ScrollView as GHScrollView } from 'react-native-gesture-handler';
import { useTranslation } from 'react-i18next';
import { useVideoPlayer, VideoView } from 'expo-video';
import { ShoppingBag, Play, X } from 'lucide-react-native';
import { colors, spacing, radius } from '../theme';
import { resolvePrice, originalPriceOf } from '../utils/pricing';

const { width } = Dimensions.get('window');
const GALLERY_WIDTH = width - spacing.md * 2;

function GalleryVideo({ url }) {
  const player = useVideoPlayer(url, (p) => { p.loop = false; });
  return <VideoView player={player} style={s.hero} contentFit="cover" nativeControls allowsFullscreen />;
}

// A native video player (AVPlayerViewController on iOS, with its own gesture
// recognizers for controls/fullscreen/scrubbing) is expensive to keep mounted
// and, per a real-device repro, can leave the app's touch handling degraded
// elsewhere even after this screen closes. Only the slide actually being
// viewed gets a real player; every other video slide — including ones the
// user hasn't scrolled to yet — shows the same static thumbnail used in the
// product cards and admin's gallery, with a real player mounted only once
// it becomes active (and unmounted again the moment it isn't).
function GalleryItem({ item, isActive }) {
  if (item.type !== 'video') {
    return <Image source={{ uri: item.url }} style={s.hero} resizeMode="cover" />;
  }
  if (!isActive) {
    return (
      <View style={[s.hero, s.videoPlaceholder]}>
        <Play size={40} color="#fff" fill="#fff" />
      </View>
    );
  }
  return <GalleryVideo url={item.url} />;
}

// Swipe-based (react-native-gesture-handler's ScrollView, under a correctly-
// configured GestureHandlerRootView — see App.js and
// [[media_carousel_gesture_fix_2026_09_03]] for the long path to get here).
// The product card, by contrast, deliberately shows only the single main
// image (product.image_url, set in admin) with no gallery/slider at all —
// don't add multi-image browsing back to the card without being asked.
function Gallery({ images }) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (images.length === 0) {
    return (
      <View style={[s.hero, s.heroPlaceholder]}>
        <ShoppingBag size={50} color="#fff" strokeWidth={1.5} style={{ opacity: 0.5 }} />
      </View>
    );
  }
  if (images.length === 1) {
    return <GalleryItem item={images[0]} isActive />;
  }

  const onScroll = (e) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / GALLERY_WIDTH);
    setActiveIndex(index);
  };

  return (
    <View>
      <GHScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} onMomentumScrollEnd={onScroll}>
        {images.map((img, i) => (
          <GalleryItem key={img.id} item={img} isActive={i === activeIndex} />
        ))}
      </GHScrollView>
      <View style={s.dots} pointerEvents="none">
        {images.map((_, i) => (
          <View key={i} style={[s.dot, i === activeIndex && s.dotActive]} />
        ))}
      </View>
    </View>
  );
}

export default function ProductModal({ visible, product, onClose, onAdd }) {
  const { t, i18n } = useTranslation();
  const category = product ? (i18n.language === 'ar' ? product.category_ar : product.category_en) || product.category_en || product.category_ar : null;
  const [selected, setSelected] = useState({});
  const [qty, setQty] = useState(1);

  useEffect(() => {
    if (visible) { setSelected({}); setQty(1); }
  }, [visible, product?.id]);

  const attributes = product?.attributes ?? [];
  const hasVariants = (product?.variants ?? []).length > 0;

  const resolvedVariant = useMemo(() => {
    if (!product || !hasVariants) return null;
    if (Object.keys(selected).length !== attributes.length) return null;
    return (product.variants ?? []).find((v) =>
      attributes.every((attr) => (v.attribute_values ?? []).some((av) => av.attribute_id === attr.id && av.value_id === selected[attr.id]))
    ) ?? null;
  }, [selected, product, attributes, hasVariants]);

  if (!product) return null;

  const images = product.images?.length > 0
    ? product.images
    : (product.image_url ? [{ id: 'main', url: product.image_url }] : []);

  const isResolved = hasVariants ? !!resolvedVariant : true;
  const priceEntity = hasVariants ? resolvedVariant : product;
  const effectiveStock = hasVariants ? resolvedVariant?.stock : product.stock;
  const outOfStock = hasVariants ? (!!resolvedVariant && resolvedVariant.stock === 0) : product.stock <= 0;
  const canAdd = isResolved && !outOfStock && qty > 0 && qty <= (effectiveStock ?? 0);

  const add = () => {
    if (!canAdd) return;
    onAdd(product, hasVariants ? resolvedVariant : null, qty);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={s.sheet} onPress={() => {}}>
          <View style={s.handle} />
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={s.galleryWrap}>
              <Gallery images={images} />
            </View>

            <View style={s.body}>
              <View style={s.headerRow}>
                <Text style={s.title} numberOfLines={2}>{product.name}</Text>
                <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <X size={18} color={colors.textMuted} strokeWidth={1.75} />
                </TouchableOpacity>
              </View>

              {category && (
                <View style={s.categoryChip}>
                  <Text style={s.categoryText}>{category}</Text>
                </View>
              )}

              {product.description ? <Text style={s.description}>{product.description}</Text> : null}

              {hasVariants && attributes.map((attr) => (
                <View key={attr.id} style={s.attrBlock}>
                  <Text style={s.attrLabel}>{attr.name}</Text>
                  <View style={s.chipRow}>
                    {(attr.values ?? []).map((v) => {
                      const active = selected[attr.id] === v.id;
                      return attr.type === 'color' ? (
                        <TouchableOpacity
                          key={v.id}
                          onPress={() => setSelected((sel) => ({ ...sel, [attr.id]: v.id }))}
                          style={[s.swatch, { backgroundColor: v.swatch_hex || '#ccc' }, active && s.swatchActive]}
                        />
                      ) : (
                        <TouchableOpacity
                          key={v.id}
                          onPress={() => setSelected((sel) => ({ ...sel, [attr.id]: v.id }))}
                          style={[s.chip, active && s.chipActive]}
                        >
                          <Text style={[s.chipText, active && s.chipTextActive]}>{v.value}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ))}

              {hasVariants && !isResolved ? (
                <Text style={s.hint}>{t('store.selectOptions')}</Text>
              ) : outOfStock ? (
                <Text style={s.hintError}>{hasVariants ? t('store.combinationOutOfStock') : t('store.outOfStock')}</Text>
              ) : (
                <>
                  <View style={s.priceRow}>
                    <View style={s.priceGroup}>
                      <Text style={s.priceText}>{t('salons.price', { amount: resolvePrice(priceEntity, qty).toFixed(2) })}</Text>
                      {resolvePrice(priceEntity, qty) < originalPriceOf(priceEntity) && (
                        <Text style={s.priceOriginal}>{t('salons.price', { amount: originalPriceOf(priceEntity).toFixed(2) })}</Text>
                      )}
                      {priceEntity?.is_offer_active && (
                        <View style={s.saleTag}>
                          <Text style={s.saleTagText}>{t('store.saleTag')}</Text>
                        </View>
                      )}
                    </View>
                    <View style={s.stepper}>
                      <TouchableOpacity style={s.stepBtn} onPress={() => setQty((q) => Math.max(1, q - 1))}>
                        <Text style={s.stepBtnText}>−</Text>
                      </TouchableOpacity>
                      <Text style={s.qty}>{qty}</Text>
                      <TouchableOpacity
                        style={[s.stepBtn, qty >= effectiveStock && s.stepBtnDisabled]}
                        disabled={qty >= effectiveStock}
                        onPress={() => setQty((q) => Math.min(effectiveStock, q + 1))}
                      >
                        <Text style={s.stepBtnText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  {(priceEntity?.price_tiers ?? []).filter((tr) => tr.price != null).length > 0 && (
                    <Text style={s.tierHint}>
                      {t('store.tierHintLabel')} {priceEntity.price_tiers.filter((tr) => tr.price != null).map((tr) => `${tr.min_quantity}+: $${Number(tr.price).toFixed(2)}`).join(' · ')}
                    </Text>
                  )}
                </>
              )}
            </View>
          </ScrollView>

          <View style={s.footer}>
            <TouchableOpacity style={[s.addBtn, !canAdd && s.addBtnDisabled]} disabled={!canAdd} onPress={add}>
              <Text style={[s.addBtnText, !canAdd && s.addBtnTextDisabled]}>{`+ ${t('store.addToCart')}`}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, maxHeight: '90%', overflow: 'hidden' },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginVertical: spacing.sm },

  galleryWrap: { paddingHorizontal: spacing.md },
  hero: { width: GALLERY_WIDTH, height: 200, borderRadius: radius.md },
  heroPlaceholder: { backgroundColor: colors.dark, justifyContent: 'center', alignItems: 'center' },
  videoPlaceholder: { backgroundColor: colors.dark, justifyContent: 'center', alignItems: 'center' },
  dots: {
    position: 'absolute', bottom: 10, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'center', gap: 6,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.5)' },
  dotActive: { backgroundColor: '#fff' },

  body: { padding: spacing.md },
  headerRow: { flexDirection: 'row-reverse', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.sm },
  title: { flex: 1, fontSize: 17, fontWeight: '800', color: colors.dark, textAlign: 'right' },

  categoryChip: {
    alignSelf: 'flex-end', backgroundColor: '#fff3ec', borderRadius: radius.full,
    paddingHorizontal: 10, paddingVertical: 4, marginTop: 8,
  },
  categoryText: { fontSize: 12, fontWeight: '600', color: colors.primary },
  description: { fontSize: 13, color: colors.textMuted, textAlign: 'right', marginTop: spacing.sm, lineHeight: 20 },

  attrBlock: { marginTop: spacing.md },
  attrLabel: { fontSize: 13, fontWeight: '600', color: colors.dark, textAlign: 'right', marginBottom: 8 },
  chipRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.full, borderWidth: 1.5, borderColor: colors.border, backgroundColor: '#fff' },
  chipActive: { backgroundColor: colors.dark, borderColor: colors.dark },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.dark },
  chipTextActive: { color: '#fff' },
  swatch: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: colors.border },
  swatchActive: { borderColor: colors.primary },

  hint: { fontSize: 12, color: colors.textMuted, textAlign: 'right', marginTop: spacing.md },
  hintError: { fontSize: 12, color: '#ef4444', textAlign: 'right', marginTop: spacing.md },
  priceRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: spacing.md, paddingTop: spacing.sm, borderTopWidth: 1, borderColor: colors.border,
  },
  priceGroup: { flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', gap: 6 },
  priceText: { fontSize: 18, fontWeight: '800', color: colors.primary, writingDirection: 'ltr' },
  priceOriginal: { fontSize: 12, color: colors.textMuted, textDecorationLine: 'line-through', writingDirection: 'ltr' },
  saleTag: { backgroundColor: '#dcfce7', borderRadius: radius.full, paddingHorizontal: 6, paddingVertical: 1 },
  saleTagText: { fontSize: 9, fontWeight: '700', color: '#15803d' },
  tierHint: { fontSize: 11, color: colors.textMuted, textAlign: 'right', marginTop: spacing.xs },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, justifyContent: 'center', alignItems: 'center' },
  stepBtnDisabled: { opacity: 0.4 },
  stepBtnText: { fontSize: 18, fontWeight: '700', color: colors.dark },
  qty: { fontSize: 15, fontWeight: '700', color: colors.dark, minWidth: 22, textAlign: 'center' },

  footer: { padding: spacing.md, borderTopWidth: 1, borderColor: colors.border },
  addBtn: { backgroundColor: colors.dark, borderRadius: radius.sm, paddingVertical: 14, alignItems: 'center' },
  addBtnDisabled: { backgroundColor: colors.border },
  addBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  addBtnTextDisabled: { color: colors.textMuted },
});
