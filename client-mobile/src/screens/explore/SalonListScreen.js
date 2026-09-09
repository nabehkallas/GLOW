import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet,
  Image, RefreshControl, Dimensions, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';
import { Search, Map, List, Heart, Star, MapPin, Scissors, ChevronDown, Check } from 'lucide-react-native';
import api from '../../api/client';
import useFavoriteStore from '../../stores/favoriteStore';
import NotificationBell from '../../components/NotificationBell';
import RecentSearchChips from '../../components/RecentSearchChips';
import useRecentSearches from '../../hooks/useRecentSearches';
import SalonMapView from './SalonMapView';
import { colors, spacing, radius, fonts } from '../../theme';

const logo = require('../../../assets/logo.png');

const { width } = Dimensions.get('window');
const CARD_W = (width - spacing.md * 2 - 12) / 2;

// Known cities get a proper Arabic label; anything else falls back to the raw
// (likely Latin-script) value so a new/unmapped city never breaks — it just
// displays untranslated, exactly like before this map existed.
const CITY_LABELS = {
  Algiers: 'الجزائر العاصمة',
  Beirut: 'بيروت',
  Damascus: 'دمشق',
  Aleppo: 'حلب',
  Homs: 'حمص',
  Latakia: 'اللاذقية',
  Tartus: 'طرطوس',
};
const cityLabel = (city) => CITY_LABELS[city] ?? city;
const isKnownCity = (city) => Object.prototype.hasOwnProperty.call(CITY_LABELS, city);

function CityPickerModal({ visible, cities, selected, onSelect, onClose }) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (visible) setQuery('');
  }, [visible]);

  const options = [{ id: '', label: t('salons.allCities') }, ...cities.map((c) => ({ id: c, label: cityLabel(c) }))];
  const filtered = query.trim()
    ? options.filter((o) => o.label.toLowerCase().includes(query.trim().toLowerCase()))
    : options;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <TouchableOpacity style={s.modalBackdrop} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={s.modalSheet} onPress={() => {}}>
          <View style={s.modalHandle} />
          <Text style={s.modalTitle}>{t('salons.selectCity')}</Text>

          {cities.length > 5 && (
            <View style={s.modalSearchWrap}>
              <Search size={14} color={colors.textMuted} strokeWidth={1.75} />
              <TextInput
                style={s.modalSearchInput}
                value={query}
                onChangeText={setQuery}
                placeholder={t('salons.search')}
                placeholderTextColor={colors.textMuted}
                textAlign="right"
              />
            </View>
          )}

          <FlatList
            data={filtered}
            keyExtractor={(i) => i.id}
            style={{ maxHeight: 360 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={s.modalRow}
                onPress={() => { onSelect(item.id); onClose(); }}
              >
                <Text
                  style={[s.modalRowText, selected === item.id && s.modalRowTextActive]}
                  writingDirection={item.id && !isKnownCity(item.id) ? 'ltr' : undefined}
                >
                  {item.label}
                </Text>
                {selected === item.id && <Check size={16} color={colors.primary} strokeWidth={1.75} />}
              </TouchableOpacity>
            )}
            ListEmptyComponent={<Text style={s.modalEmptyText}>{t('common.noData')}</Text>}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

/* ─── Skeleton ─────────────────────────────────────── */
function SkeletonCard() {
  return (
    <View style={[s.card, { width: CARD_W }]}>
      <View style={{ height: 170, backgroundColor: '#dde2e1', borderTopLeftRadius: radius.md, borderTopRightRadius: radius.md }} />
      <View style={s.cardBody}>
        <View style={{ height: 13, backgroundColor: '#dde2e1', borderRadius: 6, width: '75%', marginBottom: 8 }} />
        <View style={{ height: 11, backgroundColor: '#dde2e1', borderRadius: 6, width: '45%' }} />
      </View>
    </View>
  );
}

/* ─── Salon Card ────────────────────────────────────── */
function SalonCard({ salon, onPress }) {
  const { t } = useTranslation();
  const toggle = useFavoriteStore((s) => s.toggle);
  const isFav = useFavoriteStore((s) => s.isFavorite(salon.id));

  return (
    <TouchableOpacity style={[s.card, { width: CARD_W }]} onPress={onPress} activeOpacity={0.9}>
      {/* Image zone */}
      <View style={s.imageWrap}>
        {salon.logo_url
          ? <Image source={{ uri: salon.logo_url }} style={s.image} resizeMode="cover" />
          : (
            <View style={s.imagePlaceholder}>
              <View style={s.placeholderInner} />
              <Scissors size={30} color="#fff" strokeWidth={1.75} style={{ opacity: 0.45 }} />
            </View>
          )
        }

        {/* Bottom gradient overlay */}
        <View style={s.imageOverlay} />

        {/* Favorite heart — top left (RTL = "start") */}
        <TouchableOpacity
          style={s.heart}
          onPress={() => toggle(salon.id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Heart size={15} color={colors.primary} fill={isFav ? colors.primary : 'transparent'} strokeWidth={1.75} />
        </TouchableOpacity>

        {/* Rating — top right */}
        {salon.average_rating != null && (
          <View style={s.ratingBadge}>
            <Star size={11} color="#fff" fill="#fff" strokeWidth={1.75} />
            <Text style={s.ratingText}>{salon.average_rating}</Text>
          </View>
        )}

        {/* Name over image */}
        <View style={s.nameOverlay}>
          <Text style={s.overlayName} numberOfLines={1}>{salon.name}</Text>
          <Text
            style={s.overlayCity}
            numberOfLines={1}
            writingDirection={salon.city && !isKnownCity(salon.city) ? 'ltr' : undefined}
          >
            {cityLabel(salon.city)}
          </Text>
        </View>
      </View>

      {/* Distance row (only when known) */}
      {salon.distance_km != null && (
        <View style={s.distanceRow}>
          <MapPin size={12} color={colors.green} strokeWidth={1.75} />
          <Text style={s.distanceText}>{salon.distance_km} {t('salons.km')}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

/* ─── Screen ────────────────────────────────────────── */
export default function SalonListScreen({ navigation }) {
  const { t } = useTranslation();
  const [salons, setSalons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');
  const [cities, setCities] = useState([]);
  const [cityPickerOpen, setCityPickerOpen] = useState(false);
  const [coords, setCoords] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'map'
  const { terms: recentSearches, logSearch } = useRecentSearches('salon');

  useEffect(() => {
    Location.requestForegroundPermissionsAsync().then(({ status }) => {
      if (status === 'granted') {
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
          .then((loc) => setCoords({ lat: loc.coords.latitude, lng: loc.coords.longitude }));
      }
    });
  }, []);

  useEffect(() => {
    api.get('/client/salons/cities').then((res) => setCities(res.data.data ?? [])).catch(() => {});
  }, []);

  const fetchSalons = useCallback(async () => {
    try {
      const params = {};
      if (search) params.search = search;
      if (city)   params.city   = city;
      if (coords) { params.lat = coords.lat; params.lng = coords.lng; }
      const res = await api.get('/client/salons', { params });
      setSalons(res.data.data ?? []);
    } catch {}
  }, [search, city, coords]);

  useEffect(() => {
    setLoading(true);
    fetchSalons().finally(() => setLoading(false));
  }, [fetchSalons]);

  const onRefresh = async () => { setRefreshing(true); await fetchSalons(); setRefreshing(false); };

  const ListHeader = (
    <View>
      {/* Search bar + city filter, side by side */}
      <View style={s.filterRow}>
        <View style={s.searchCard}>
          <TextInput
            style={s.searchInput}
            placeholder={t('salons.search')}
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

        <TouchableOpacity style={s.cityDropdown} onPress={() => setCityPickerOpen(true)} activeOpacity={0.8}>
          <MapPin size={17} color={city ? colors.primary : colors.textMuted} strokeWidth={1.75} />
          <ChevronDown size={13} color={colors.textMuted} strokeWidth={1.75} />
        </TouchableOpacity>
      </View>
      {!search && <RecentSearchChips terms={recentSearches} onSelect={setSearch} />}
    </View>
  );

  const data = loading ? [1, 2, 3, 4] : salons;

  return (
    <View style={s.root}>
      <StatusBar style="light" />

      {/* Top header */}
      <SafeAreaView style={s.headerSafe} edges={['top']}>
        <View style={s.headerInner}>
          <Image source={logo} style={s.headerLogo} resizeMode="contain" />
          <View style={s.bellWrap}>
            <NotificationBell navigation={navigation} />
          </View>
          <TouchableOpacity
            style={s.toggleWrap}
            onPress={() => setViewMode((m) => (m === 'list' ? 'map' : 'list'))}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {viewMode === 'list'
              ? <Map size={18} color="#fff" strokeWidth={1.75} />
              : <List size={18} color="#fff" strokeWidth={1.75} />
            }
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {viewMode === 'map' ? (
        <SalonMapView
          salons={salons}
          coords={coords}
          onSelectSalon={(salon) => navigation.navigate('SalonDetail', { salonId: salon.id })}
        />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => String(item.id ?? item)}
          numColumns={2}
          columnWrapperStyle={s.row}
          contentContainerStyle={s.list}
          ListHeaderComponent={ListHeader}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          renderItem={({ item }) =>
            loading
              ? <SkeletonCard />
              : <SalonCard
                  salon={item}
                  onPress={() => navigation.navigate('SalonDetail', { salonId: item.id })}
                />
          }
          ListEmptyComponent={
            !loading && (
              <View style={s.empty}>
                <Search size={40} color={colors.textMuted} strokeWidth={1.5} />
                <Text style={s.emptyText}>{t('salons.noSalons')}</Text>
              </View>
            )
          }
        />
      )}

      <CityPickerModal
        visible={cityPickerOpen}
        cities={cities}
        selected={city}
        onSelect={setCity}
        onClose={() => setCityPickerOpen(false)}
      />
    </View>
  );
}

/* ─── Styles ────────────────────────────────────────── */
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },

  /* Header */
  headerSafe: { backgroundColor: colors.dark },
  headerInner: {
    height: 70,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLogo: {
    width: '100%',
    height: 210,
  },
  bellWrap: {
    position: 'absolute',
    right: spacing.md,
  },
  toggleWrap: {
    position: 'absolute',
    left: spacing.md,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  /* Search + city filter row */
  filterRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  searchCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 14,
    fontFamily: fonts.body,
    color: colors.dark,
    textAlign: 'right',
  },
  searchIconWrap: {
    marginLeft: spacing.sm,
    opacity: 0.5,
  },

  /* City dropdown — icon-only, matches search bar height */
  cityDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 50,
    height: 50,
    borderRadius: radius.md,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: colors.border,
    gap: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },

  /* City picker modal */
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#fff', borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: spacing.md, maxHeight: '70%' },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: spacing.sm },
  modalTitle: { fontFamily: fonts.headingSemibold, fontSize: 17, color: colors.dark, textAlign: 'right', marginBottom: spacing.sm },
  modalSearchWrap: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 8,
    backgroundColor: colors.background, borderRadius: radius.sm,
    paddingHorizontal: 12, marginBottom: spacing.sm,
  },
  modalSearchInput: { flex: 1, paddingVertical: 10, fontSize: 14, fontFamily: fonts.body, color: colors.dark },
  modalEmptyText: { fontFamily: fonts.body, color: colors.textMuted, fontSize: 14, textAlign: 'center', paddingVertical: spacing.lg },
  modalRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 14, borderBottomWidth: 1, borderColor: '#f1f1f1',
  },
  modalRowText: { fontFamily: fonts.body, fontSize: 14, color: colors.dark },
  modalRowTextActive: { fontFamily: fonts.bodySemibold, color: colors.primaryDark },

  /* Grid */
  list: { paddingHorizontal: spacing.md, paddingBottom: spacing.xl },
  row: { justifyContent: 'space-between', marginBottom: 12 },

  /* Card */
  card: {
    backgroundColor: '#fff',
    borderRadius: radius.md,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
  },
  imageWrap: { position: 'relative' },
  image: { width: '100%', height: 170 },

  imagePlaceholder: {
    width: '100%',
    height: 170,
    backgroundColor: colors.dark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderInner: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.primary,
    opacity: 0.18,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: 90,
    backgroundColor: 'rgba(38,50,56,0.72)',
  },

  heart: {
    position: 'absolute',
    top: 10, left: 10,
    width: 32, height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  ratingBadge: {
    position: 'absolute',
    top: 10, right: 10,
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(0,0,0,0.52)',
    borderRadius: radius.full,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  ratingText: { color: '#fff', fontSize: 11, fontFamily: fonts.bodyBold },

  nameOverlay: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
  },
  overlayName: {
    color: '#fff',
    fontSize: 13,
    fontFamily: fonts.bodySemibold,
    textAlign: 'right',
  },
  overlayCity: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 11,
    fontFamily: fonts.body,
    textAlign: 'right',
    marginTop: 2,
  },

  cardBody: { padding: spacing.sm },

  distanceRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  distanceText: { fontSize: 12, color: colors.green, fontFamily: fonts.bodyBold, writingDirection: 'ltr' },

  empty: { paddingTop: 60, alignItems: 'center', gap: spacing.sm },
  emptyText: { fontFamily: fonts.body, color: colors.textMuted, fontSize: 15, textAlign: 'center' },
});
