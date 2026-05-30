import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet,
  Image, RefreshControl, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';
import api from '../../api/client';
import useFavoriteStore from '../../stores/favoriteStore';
import NotificationBell from '../../components/NotificationBell';
import { colors, spacing, radius } from '../../theme';

const logo = require('../../../assets/logo.png');

const { width } = Dimensions.get('window');
const CARD_W = (width - spacing.md * 2 - 12) / 2;
const CITIES = ['دمشق', 'حلب', 'حمص', 'اللاذقية', 'طرطوس'];

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
              <Text style={s.placeholderText}>✂</Text>
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
          <Text style={{ fontSize: 15, lineHeight: 19 }}>{isFav ? '❤️' : '🤍'}</Text>
        </TouchableOpacity>

        {/* Rating — top right */}
        {salon.average_rating != null && (
          <View style={s.ratingBadge}>
            <Text style={s.ratingText}>⭐ {salon.average_rating}</Text>
          </View>
        )}

        {/* Name over image */}
        <View style={s.nameOverlay}>
          <Text style={s.overlayName} numberOfLines={1}>{salon.name}</Text>
          <Text style={s.overlayCity} numberOfLines={1}>{salon.city}</Text>
        </View>
      </View>

      {/* Distance row (only when known) */}
      {salon.distance_km != null && (
        <View style={s.distanceRow}>
          <Text style={s.distanceDot}>📍</Text>
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
  const [coords, setCoords] = useState(null);

  useEffect(() => {
    Location.requestForegroundPermissionsAsync().then(({ status }) => {
      if (status === 'granted') {
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
          .then((loc) => setCoords({ lat: loc.coords.latitude, lng: loc.coords.longitude }));
      }
    });
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
      {/* Search bar */}
      <View style={s.searchCard}>
        <TextInput
          style={s.searchInput}
          placeholder={t('salons.search')}
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
          textAlign="right"
          returnKeyType="search"
        />
        <View style={s.searchIconWrap}>
          <Text style={{ fontSize: 15 }}>🔍</Text>
        </View>
      </View>

      {/* City filter chips */}
      <FlatList
        horizontal
        data={[{ id: '', label: t('common.all') }, ...CITIES.map((c) => ({ id: c, label: c }))]}
        keyExtractor={(i) => i.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.chips}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[s.chip, city === item.id && s.chipActive]}
            onPress={() => setCity(item.id)}
          >
            <Text style={[s.chipText, city === item.id && s.chipTextActive]}>{item.label}</Text>
          </TouchableOpacity>
        )}
      />
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
        </View>
      </SafeAreaView>

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
              <Text style={s.emptyEmoji}>🔍</Text>
              <Text style={s.emptyText}>{t('salons.noSalons')}</Text>
            </View>
          )
        }
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

  /* Search */
  searchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: radius.md,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
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
    color: colors.dark,
    textAlign: 'right',
  },
  searchIconWrap: {
    marginLeft: spacing.sm,
    opacity: 0.5,
  },

  /* City chips */
  chips: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: radius.full,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  chipActive: {
    backgroundColor: colors.dark,
    borderColor: colors.dark,
  },
  chipText: { fontSize: 13, color: colors.dark, fontWeight: '600' },
  chipTextActive: { color: '#fff', fontWeight: '700' },

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
    backgroundColor: '#263238',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderInner: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.primary,
    opacity: 0.18,
  },
  placeholderText: {
    fontSize: 36,
    opacity: 0.45,
    color: '#fff',
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
    backgroundColor: 'rgba(0,0,0,0.52)',
    borderRadius: radius.full,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  ratingText: { color: '#fff', fontSize: 11, fontWeight: '700' },

  nameOverlay: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
  },
  overlayName: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
  },
  overlayCity: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 11,
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
  distanceDot: { fontSize: 11 },
  distanceText: { fontSize: 12, color: colors.green, fontWeight: '700', writingDirection: 'ltr' },

  empty: { paddingTop: 60, alignItems: 'center', gap: spacing.sm },
  emptyEmoji: { fontSize: 48 },
  emptyText: { color: colors.textMuted, fontSize: 15, textAlign: 'center' },
});
