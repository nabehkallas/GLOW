import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Package, Minus, Plus, Search, X } from 'lucide-react-native';
import api from '../../api/client';
import Card from '../../components/Card';
import DismissKeyboardView from '../../components/DismissKeyboardView';
import RecentSearchChips from '../../components/RecentSearchChips';
import PriceDisplay from '../../components/PriceDisplay';
import StatusBadge from '../../components/StatusBadge';
import OrderTimeline from '../../components/OrderTimeline';
import useCartStore from '../../stores/cartStore';
import useRecentSearches from '../../utils/useRecentSearches';
import { localizedCategory } from '../../utils/product';
import { colors, radius, spacing } from '../../theme';

export default function OrdersHomeScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const [tab, setTab] = useState('shop');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');
  const totalCount = useCartStore((s) => s.totalCount());
  const totalAmount = useCartStore((s) => s.totalAmount());
  const getQuantity = useCartStore((s) => s.getQuantity);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const { terms: recentSearches, logSearch } = useRecentSearches('product');

  const load = useCallback(() => {
    setLoading(true);
    return Promise.all([api.get('/salon/products'), api.get('/salon/orders')])
      .then(([p, o]) => {
        setProducts(p.data.data ?? p.data);
        setOrders(o.data.data ?? o.data);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      load();
      if (route.params?.placed) {
        setSuccessMsg(t('orders.orderPlaced'));
        setTab('orders');
        navigation.setParams({ placed: undefined });
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [route.params?.placed])
  );

  const categories = useMemo(() => {
    const cats = [...new Set(products.map((p) => localizedCategory(p, i18n.language)).filter(Boolean))];
    const list = ['all', ...cats.sort()];
    if (products.some((p) => p.has_offer)) list.push('__on_offer__');
    if (products.some((p) => p.has_price_breaks)) list.push('__price_breaks__');
    return list;
  }, [products, i18n.language]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products.filter((p) => {
      const matchesCategory =
        activeCategory === 'all' ? true :
        activeCategory === '__on_offer__' ? p.has_offer :
        activeCategory === '__price_breaks__' ? p.has_price_breaks :
        localizedCategory(p, i18n.language) === activeCategory;
      return matchesCategory && (!term || p.name.toLowerCase().includes(term));
    });
  }, [products, activeCategory, search, i18n.language]);

  const categoryLabel = (cat) =>
    cat === 'all' ? t('orders.all') :
    cat === '__on_offer__' ? t('orders.onOfferFilter') :
    cat === '__price_breaks__' ? t('orders.priceBreaksFilter') :
    cat;

  const cancelOrder = (order) => {
    const isDirect = order.status === 'pending';
    const message = isDirect ? '' : t('orders.requestCancelConfirm', { status: t('status.' + order.status) });
    Alert.alert(t('orders.cancelConfirm'), message, [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.confirm'),
        style: 'destructive',
        onPress: async () => {
          try {
            const { data } = await api.patch(`/salon/orders/${order.id}/cancel`);
            const updated = data.data ?? data;
            setOrders((prev) => prev.map((o) => (o.id === order.id ? updated : o)));
          } catch (e) {
            Alert.alert(t('common.somethingWrong'), e.response?.data?.message ?? '');
          }
        },
      },
    ]);
  };

  const requestReturn = (orderId) => {
    Alert.alert(t('orders.requestReturnConfirm'), '', [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.confirm'),
        onPress: async () => {
          try {
            const { data } = await api.patch(`/salon/orders/${orderId}/request-return`);
            const updated = data.data ?? data;
            setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
          } catch (e) {
            Alert.alert(t('common.somethingWrong'), e.response?.data?.message ?? '');
          }
        },
      },
    ]);
  };

  return (
    <DismissKeyboardView>
    <SafeAreaView edges={['top']} style={s.wrap}>
      <View style={s.tabBar}>
        {['shop', 'orders'].map((key) => (
          <TouchableOpacity key={key} onPress={() => setTab(key)} style={s.tabItem}>
            <Text style={[s.tabText, tab === key && s.tabTextActive]}>
              {key === 'shop' ? t('orders.shop') : t('orders.myOrders')}
            </Text>
            {tab === key && <View style={s.tabIndicator} />}
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'shop' && (
        <>
          <View style={s.searchRow}>
            <Search size={16} color={colors.textMuted} />
            <TextInput
              style={s.searchInput}
              value={search}
              onChangeText={setSearch}
              onBlur={() => logSearch(search)}
              placeholder={t('orders.searchPlaceholder')}
              placeholderTextColor={colors.textMuted}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')} hitSlop={8}>
                <X size={16} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>
          {!search && <RecentSearchChips terms={recentSearches} onSelect={setSearch} />}
        </>
      )}

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.xl }} />
      ) : tab === 'shop' ? (
        <>
          <FlatList
            data={filtered}
            keyExtractor={(p) => String(p.id)}
            keyboardShouldPersistTaps="handled"
            numColumns={2}
            columnWrapperStyle={{ gap: spacing.sm }}
            contentContainerStyle={{ padding: spacing.md, gap: spacing.sm, paddingBottom: totalCount > 0 ? 90 : spacing.md }}
            ListHeaderComponent={
              categories.length > 1 ? (
                <FlatList
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  data={categories}
                  keyExtractor={(c) => c}
                  contentContainerStyle={{ gap: spacing.xs, paddingBottom: spacing.sm }}
                  renderItem={({ item: cat }) => (
                    <TouchableOpacity onPress={() => setActiveCategory(cat)} style={[s.catChip, activeCategory === cat && s.catChipActive]}>
                      <Text style={[s.catChipText, activeCategory === cat && s.catChipTextActive]}>
                        {categoryLabel(cat)}
                      </Text>
                    </TouchableOpacity>
                  )}
                />
              ) : null
            }
            ListEmptyComponent={<Text style={s.empty}>{t('orders.noProducts')}</Text>}
            renderItem={({ item: p }) => (
              <ProductCard
                product={p}
                qty={getQuantity(p.id, null)}
                onSetQty={(v) => updateQuantity(p.id, null, v)}
                onPress={() => navigation.navigate('ProductDetail', { product: p })}
              />
            )}
          />

          {totalCount > 0 && (
            <TouchableOpacity style={s.cartBar} onPress={() => navigation.navigate('Cart')} activeOpacity={0.9}>
              <View>
                <Text style={s.cartBarCount}>{t('orders.items', { count: totalCount })}</Text>
                <Text style={s.cartBarTotal}>{t('common.total')}: ${totalAmount.toFixed(2)}</Text>
              </View>
              <View style={s.cartBarBtn}>
                <Text style={s.cartBarBtnText}>{t('orders.viewCart')}</Text>
              </View>
            </TouchableOpacity>
          )}
        </>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(o) => String(o.id)}
          contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}
          ListHeaderComponent={
            successMsg ? (
              <View style={s.successBanner}>
                <Text style={s.successText}>{successMsg}</Text>
              </View>
            ) : null
          }
          ListEmptyComponent={<Text style={s.empty}>{t('orders.noOrders')}</Text>}
          renderItem={({ item: o }) => (
            <Card>
              <View style={s.orderHeader}>
                <Text style={s.orderNumber}>{t('orders.orderNumber', { id: o.id })}</Text>
                <StatusBadge status={o.status} />
              </View>
              <OrderTimeline status={o.status} />
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
                    <View style={{ flex: 1 }}>
                      <Text style={s.itemName}>{item.product?.name ?? `#${item.product_id}`} × {item.quantity}</Text>
                      {item.variant ? (
                        <Text style={s.itemVariant}>{(item.variant.attribute_values ?? []).map((av) => av.value).join(' / ')}</Text>
                      ) : null}
                    </View>
                    <Text style={s.itemPrice}>${item.unit_price}</Text>
                  </View>
                ))}
              </View>
              {o.notes ? <Text style={s.orderNotes}>{o.notes}</Text> : null}
              {o.return_reason ? <Text style={s.orderNotes}>{t('orders.returnReason')}: {o.return_reason}</Text> : null}
              {o.cancellation_reason ? <Text style={s.orderNotes}>{t('orders.cancelReason')}: {o.cancellation_reason}</Text> : null}
              <View style={s.orderTotalRow}>
                <Text style={s.orderTotalLabel}>{t('common.total')}</Text>
                <Text style={s.orderTotalValue}>${o.total_amount}</Text>
              </View>
              {(o.status === 'pending' || o.can_request_cancel) && (
                <TouchableOpacity style={s.cancelBtn} onPress={() => cancelOrder(o)} activeOpacity={0.8}>
                  <Text style={s.cancelBtnText}>{t('orders.cancelOrder')}</Text>
                </TouchableOpacity>
              )}
              {o.status === 'delivered' && o.can_request_return && (
                <TouchableOpacity style={s.cancelBtn} onPress={() => requestReturn(o.id)} activeOpacity={0.8}>
                  <Text style={s.cancelBtnText}>{t('orders.requestReturn')}</Text>
                </TouchableOpacity>
              )}
              {o.status === 'return_requested' && (
                <View style={s.returnPendingBanner}>
                  <Text style={s.returnPendingText}>{t('orders.returnPending')}</Text>
                </View>
              )}
              {o.status === 'cancellation_requested' && (
                <View style={s.returnPendingBanner}>
                  <Text style={s.returnPendingText}>{t('orders.cancelPending')}</Text>
                </View>
              )}
            </Card>
          )}
        />
      )}
    </SafeAreaView>
    </DismissKeyboardView>
  );
}

function ProductCard({ product: p, qty, onSetQty, onPress }) {
  const { t, i18n } = useTranslation();
  const hasVariants = (p.variants ?? []).length > 0;
  const category = localizedCategory(p, i18n.language);

  return (
    <View style={s.productCard}>
      <TouchableOpacity activeOpacity={0.85} onPress={onPress}>
        {p.image_url ? (
          <Image source={{ uri: p.image_url }} style={s.productImage} />
        ) : (
          <View style={[s.productImage, s.productImageFallback]}>
            <Package size={28} color={colors.border} />
          </View>
        )}
      </TouchableOpacity>
      <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={{ padding: spacing.sm }}>
        {category ? (
          <View style={s.productCategory}>
            <Text style={s.productCategoryText}>{category}</Text>
          </View>
        ) : null}
        <Text style={s.productName} numberOfLines={1}>{p.name}</Text>
        <View style={s.productFooter}>
          <PriceDisplay entity={p} qty={qty || 1} />
          {hasVariants ? (
            <TouchableOpacity onPress={onPress} style={s.chooseBtn}>
              <Text style={s.chooseBtnText}>{t('orders.chooseOptions')}</Text>
            </TouchableOpacity>
          ) : qty === 0 ? (
            <TouchableOpacity
              onPress={(e) => { e.stopPropagation?.(); onSetQty(1); }}
              disabled={p.stock === 0}
              style={[s.addSmallBtn, p.stock === 0 && s.addSmallBtnDisabled]}
            >
              <Text style={s.addSmallBtnText}>{p.stock === 0 ? t('orders.outOfStock') : t('common.add')}</Text>
            </TouchableOpacity>
          ) : (
            <View style={s.qtyStepper}>
              <TouchableOpacity onPress={(e) => { e.stopPropagation?.(); onSetQty(qty - 1); }} style={s.qtyBtn}>
                <Minus size={12} color="#c2410c" />
              </TouchableOpacity>
              <Text style={s.qtyValue}>{qty}</Text>
              <TouchableOpacity onPress={(e) => { e.stopPropagation?.(); onSetQty(qty + 1); }} disabled={qty >= p.stock} style={[s.qtyBtn, s.qtyBtnFilled]}>
                <Plus size={12} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.background },
  tabBar: { flexDirection: 'row', paddingHorizontal: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.card },
  tabItem: { paddingVertical: spacing.sm, marginEnd: spacing.lg },
  tabText: { fontSize: 14, fontWeight: '600', color: colors.textMuted },
  tabTextActive: { color: colors.dark },
  tabIndicator: { height: 2, backgroundColor: colors.green, marginTop: 6, borderRadius: 1 },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.sm,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: { flex: 1, fontSize: 14, color: colors.dark, height: '100%' },
  catChip: { paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.full, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, marginEnd: spacing.xs },
  catChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  catChipText: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  catChipTextActive: { color: '#fff' },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: spacing.xl, fontSize: 14 },
  productCard: { flex: 1, backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  productImage: { width: '100%', height: 110 },
  productImageFallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' },
  productCategory: { alignSelf: 'flex-start', backgroundColor: '#fff1eb', borderRadius: radius.full, paddingHorizontal: 6, paddingVertical: 1, marginBottom: 4 },
  productCategoryText: { fontSize: 9, fontWeight: '700', color: '#c2410c' },
  productName: { fontSize: 12, fontWeight: '700', color: colors.dark },
  productFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.xs },
  productPrice: { fontSize: 13, fontWeight: '800', color: colors.primary },
  chooseBtn: { backgroundColor: colors.primary, borderRadius: radius.sm, paddingHorizontal: 8, paddingVertical: 5 },
  chooseBtnText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  addSmallBtn: { backgroundColor: colors.primary, borderRadius: radius.sm, paddingHorizontal: 10, paddingVertical: 5 },
  addSmallBtnDisabled: { opacity: 0.4 },
  addSmallBtnText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  qtyStepper: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  qtyBtn: { width: 22, height: 22, borderRadius: radius.sm, backgroundColor: '#fff1eb', alignItems: 'center', justifyContent: 'center' },
  qtyBtnFilled: { backgroundColor: colors.primary },
  qtyValue: { fontSize: 12, fontWeight: '700', color: colors.dark, minWidth: 16, textAlign: 'center' },
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
  cartBarCount: { color: '#fff', fontSize: 13, fontWeight: '600' },
  cartBarTotal: { color: 'rgba(255,255,255,0.8)', fontSize: 11 },
  cartBarBtn: { backgroundColor: colors.primary, borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: 8 },
  cartBarBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  successBanner: { backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0', borderRadius: radius.sm, padding: spacing.sm, marginBottom: spacing.sm },
  successText: { color: '#15803d', fontSize: 13 },
  orderHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  orderNumber: { fontSize: 14, fontWeight: '700', color: colors.dark },
  itemsList: { marginTop: spacing.md, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border, gap: spacing.xs },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  itemThumb: { width: 28, height: 28, borderRadius: radius.sm },
  itemThumbFallback: { backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  itemName: { fontSize: 12, color: colors.dark },
  itemVariant: { fontSize: 10, color: colors.textMuted },
  itemPrice: { fontSize: 12, fontWeight: '600', color: colors.dark },
  orderNotes: { fontSize: 11, color: colors.textMuted, fontStyle: 'italic', marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  orderTotalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  orderTotalLabel: { fontSize: 13, fontWeight: '700', color: colors.dark },
  orderTotalValue: { fontSize: 13, fontWeight: '800', color: colors.dark },
  cancelBtn: { marginTop: spacing.sm, borderWidth: 1, borderColor: '#fecaca', borderRadius: radius.sm, paddingVertical: 10, alignItems: 'center' },
  cancelBtnText: { color: '#dc2626', fontSize: 13, fontWeight: '600' },
  returnPendingBanner: { marginTop: spacing.sm, backgroundColor: '#fff7ed', borderRadius: radius.sm, paddingVertical: 10, alignItems: 'center' },
  returnPendingText: { color: '#f59e0b', fontSize: 13, fontWeight: '600' },
});
