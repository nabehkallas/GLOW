import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet,
  Image, RefreshControl, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { StatusBar } from 'expo-status-bar';
import { Search, Package, ShoppingBag, Minus, Plus } from 'lucide-react-native';
import api from '../../api/client';
import useCartStore from '../../stores/cartStore';
import ProductModal from '../../components/ProductModal';
import RecentSearchChips from '../../components/RecentSearchChips';
import useRecentSearches from '../../hooks/useRecentSearches';
import { resolvePrice, originalPriceOf } from '../../utils/pricing';
import { colors, spacing, radius } from '../../theme';

const logo = require('../../../assets/logo.png');

const { width } = Dimensions.get('window');
const CARD_W = (width - spacing.md * 2 - 12) / 2;

function localizedCategory(p, lang) {
  return (lang === 'ar' ? p.category_ar : p.category_en) || p.category_en || p.category_ar;
}

function ProductCard({ product, onPress }) {
  const { t } = useTranslation();
  const addItem = useCartStore((s) => s.addItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const hasVariants = (product.variants ?? []).length > 0;
  const qtyInCart = useCartStore((s) => s.items.find((i) => i.product.id === product.id && !i.variant)?.quantity ?? 0);
  const outOfStock = !hasVariants && (product.stock <= 0 || qtyInCart >= product.stock);
  const price = resolvePrice(product, qtyInCart || 1);
  const original = originalPriceOf(product);
  const discounted = price < original;

  return (
    <View style={[s.card, { width: CARD_W }]}>
      <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={s.imageWrap}>
        {product.image_url ? (
          <Image source={{ uri: product.image_url }} style={s.image} resizeMode="cover" />
        ) : (
          <View style={s.imagePlaceholder}>
            <ShoppingBag size={30} color="#fff" strokeWidth={1.5} style={{ opacity: 0.45 }} />
          </View>
        )}
        {!hasVariants && product.stock <= 0 && (
          <View style={s.outOfStockBadge} pointerEvents="none">
            <Text style={s.outOfStockText}>{t('store.outOfStock')}</Text>
          </View>
        )}
      </TouchableOpacity>

      <View style={s.cardBody}>
        <TouchableOpacity onPress={onPress} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={s.name} numberOfLines={1}>{product.name}</Text>
          <View style={s.priceRow}>
            <Text style={s.price} numberOfLines={1}>{t('salons.price', { amount: price.toFixed(2) })}</Text>
            {discounted && (
              <Text style={s.priceOriginal} numberOfLines={1}>{t('salons.price', { amount: original.toFixed(2) })}</Text>
            )}
            {product.is_offer_active && (
              <View style={s.saleTag}>
                <Text style={s.saleTagText}>{t('store.saleTag')}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        {hasVariants ? (
          <TouchableOpacity style={s.addBtn} onPress={onPress}>
            <Text style={s.addBtnText}>{t('store.chooseOptions')}</Text>
          </TouchableOpacity>
        ) : qtyInCart === 0 ? (
          <TouchableOpacity
            style={[s.addBtn, outOfStock && s.addBtnDisabled]}
            disabled={outOfStock}
            onPress={() => addItem(product)}
          >
            <Text style={[s.addBtnText, outOfStock && s.addBtnTextDisabled]}>
              {outOfStock ? t('store.outOfStock') : `+ ${t('store.addToCart')}`}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={s.qtyStepper}>
            <TouchableOpacity style={s.qtyBtn} onPress={() => updateQuantity(product.id, null, qtyInCart - 1)}>
              <Minus size={14} color={colors.primary} />
            </TouchableOpacity>
            <Text style={s.qtyValue}>{qtyInCart}</Text>
            <TouchableOpacity
              style={[s.qtyBtn, s.qtyBtnFilled]}
              disabled={qtyInCart >= product.stock}
              onPress={() => updateQuantity(product.id, null, qtyInCart + 1)}
            >
              <Plus size={14} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

export default function StoreListScreen({ navigation }) {
  const { t, i18n } = useTranslation();
  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [modalProduct, setModalProduct] = useState(null);
  const totalCount = useCartStore((s) => s.totalCount());
  const totalAmount = useCartStore((s) => s.totalAmount());
  const addItems = useCartStore((s) => s.addItems);
  const { terms: recentSearches, logSearch } = useRecentSearches('product');

  const categories = useMemo(
    () => [...new Set(products.map((p) => localizedCategory(p, i18n.language)).filter(Boolean))],
    [products, i18n.language]
  );

  const fetchProducts = useCallback(async () => {
    try {
      const params = {};
      if (search) params.search = search;
      if (category === '__on_offer__') params.filter = 'on_offer';
      else if (category === '__price_breaks__') params.filter = 'price_breaks';
      else if (category) params.category = category;
      const res = await api.get('/client/products', { params });
      setProducts(res.data.data ?? []);
      setMeta(res.data.meta ?? {});
    } catch {}
  }, [search, category]);

  useEffect(() => {
    setLoading(true);
    fetchProducts().finally(() => setLoading(false));
  }, [fetchProducts]);

  const onRefresh = async () => { setRefreshing(true); await fetchProducts(); setRefreshing(false); };

  const ListHeader = (
    <View>
      <View style={s.searchCard}>
        <TextInput
          style={s.searchInput}
          placeholder={t('store.search')}
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
          onBlur={() => logSearch(search)}
          textAlign="right"
          returnKeyType="search"
        />
        <View style={s.searchIconWrap}>
          <Search size={16} color={colors.textMuted} strokeWidth={1.75} />
        </View>
      </View>

      {!search && <RecentSearchChips terms={recentSearches} onSelect={setSearch} />}

      {categories.length > 0 && (
        <FlatList
          horizontal
          data={[
            { id: '', label: t('common.all') },
            ...categories.map((c) => ({ id: c, label: c })),
            ...(meta.has_offers ? [{ id: '__on_offer__', label: t('store.onOfferFilter') }] : []),
            ...(meta.has_price_breaks ? [{ id: '__price_breaks__', label: t('store.priceBreaksFilter') }] : []),
          ]}
          keyExtractor={(i) => i.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.chips}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[s.chip, category === item.id && s.chipActive]}
              onPress={() => setCategory(item.id)}
            >
              <Text style={[s.chipText, category === item.id && s.chipTextActive]}>{item.label}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );

  return (
    <View style={s.root}>
      <StatusBar style="light" />

      <SafeAreaView style={s.headerSafe} edges={['top']}>
        <View style={s.headerInner}>
          <Image source={logo} style={s.headerLogo} resizeMode="contain" />
          <TouchableOpacity style={s.ordersWrap} onPress={() => navigation.navigate('StoreOrders')}>
            <Package size={22} color="#fff" strokeWidth={1.75} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <FlatList
        data={loading ? [] : products}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        columnWrapperStyle={s.row}
        contentContainerStyle={[s.list, totalCount > 0 && { paddingBottom: 90 }]}
        ListHeaderComponent={ListHeader}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            onPress={() => setModalProduct(item)}
          />
        )}
        ListEmptyComponent={
          !loading && (
            <View style={s.empty}>
              <ShoppingBag size={40} color={colors.textMuted} strokeWidth={1.5} />
              <Text style={s.emptyText}>{t('store.noProducts')}</Text>
            </View>
          )
        }
      />

      <ProductModal
        visible={!!modalProduct}
        product={modalProduct}
        onClose={() => setModalProduct(null)}
        onAdd={(product, variant, qty) => addItems(product, variant, qty)}
      />

      {totalCount > 0 && (
        <TouchableOpacity style={s.cartBar} onPress={() => navigation.navigate('Cart')} activeOpacity={0.9}>
          <View>
            <Text style={s.cartBarCount}>{t('store.items', { count: totalCount })}</Text>
            <Text style={s.cartBarTotal}>{t('store.total')}: {t('salons.price', { amount: totalAmount.toFixed(2) })}</Text>
          </View>
          <View style={s.cartBarBtn}>
            <Text style={s.cartBarBtnText}>{t('store.viewCart')}</Text>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },

  headerSafe: { backgroundColor: colors.dark },
  headerInner: { height: 70, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  headerLogo: { width: '100%', height: 210 },
  ordersWrap: { position: 'absolute', left: spacing.md, width: 34, height: 34, justifyContent: 'center', alignItems: 'center' },

  searchCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: radius.md, marginHorizontal: spacing.md, marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 3,
  },
  searchInput: { flex: 1, paddingVertical: 14, fontSize: 14, color: colors.dark, textAlign: 'right' },
  searchIconWrap: { marginLeft: spacing.sm, opacity: 0.5 },

  chips: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: spacing.sm },
  chip: {
    paddingHorizontal: 18, paddingVertical: 9, borderRadius: radius.full,
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  chipActive: { backgroundColor: colors.dark, borderColor: colors.dark },
  chipText: { fontSize: 13, color: colors.dark, fontWeight: '600' },
  chipTextActive: { color: '#fff', fontWeight: '700' },

  list: { paddingHorizontal: spacing.md, paddingBottom: spacing.xl },
  row: { justifyContent: 'space-between', marginBottom: 12 },

  card: {
    backgroundColor: '#fff', borderRadius: radius.md, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 5,
  },
  imageWrap: { position: 'relative' },
  image: { width: '100%', height: 130 },
  imagePlaceholder: { width: '100%', height: 130, backgroundColor: colors.dark, justifyContent: 'center', alignItems: 'center' },
  outOfStockBadge: {
    position: 'absolute', top: 8, left: 8, right: 8,
    backgroundColor: 'rgba(0,0,0,0.65)', borderRadius: radius.sm, paddingVertical: 4, alignItems: 'center',
  },
  outOfStockText: { color: '#fff', fontSize: 10, fontWeight: '700' },

  cardBody: { padding: spacing.sm },
  name: { fontSize: 13, fontWeight: '700', color: colors.dark, textAlign: 'right', marginBottom: 4 },
  priceRow: { flexDirection: 'row-reverse', alignItems: 'baseline', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  price: { fontSize: 13, fontWeight: '700', color: colors.primary, textAlign: 'right', writingDirection: 'ltr' },
  priceOriginal: { fontSize: 11, color: colors.textMuted, textDecorationLine: 'line-through', writingDirection: 'ltr' },
  saleTag: { backgroundColor: '#dcfce7', borderRadius: radius.full, paddingHorizontal: 6, paddingVertical: 1 },
  saleTagText: { fontSize: 9, fontWeight: '700', color: '#15803d' },

  addBtn: { backgroundColor: colors.dark, borderRadius: radius.sm, paddingVertical: 8, alignItems: 'center' },
  addBtnDisabled: { backgroundColor: colors.border },
  addBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  addBtnTextDisabled: { color: colors.textMuted },

  qtyStepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  qtyBtn: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  qtyBtnFilled: { backgroundColor: colors.primary, borderColor: colors.primary },
  qtyValue: { fontSize: 13, fontWeight: '700', color: colors.dark, minWidth: 18, textAlign: 'center' },

  empty: { paddingTop: 60, alignItems: 'center', gap: spacing.sm },
  emptyText: { color: colors.textMuted, fontSize: 15, textAlign: 'center' },

  cartBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.dark,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cartBarCount: { color: '#fff', fontSize: 13, fontWeight: '600', textAlign: 'right' },
  cartBarTotal: { color: 'rgba(255,255,255,0.8)', fontSize: 11, textAlign: 'right' },
  cartBarBtn: { backgroundColor: colors.primary, borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: 8 },
  cartBarBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
});
