import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Image, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { StatusBar } from 'expo-status-bar';
import { Scissors, Star, Heart, HeartCrack } from 'lucide-react-native';
import api from '../../api/client';
import useFavoriteStore from '../../stores/favoriteStore';
import { colors, spacing, radius, shadow } from '../../theme';

const logo = require('../../../assets/logo.png');

function FavCard({ salon, onPress }) {
  const toggle = useFavoriteStore((s) => s.toggle);
  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.9}>
      <View style={s.imageWrap}>
        {salon.logo_url
          ? <Image source={{ uri: salon.logo_url }} style={s.image} resizeMode="cover" />
          : <View style={[s.image, { backgroundColor: '#e0e0e0', justifyContent: 'center', alignItems: 'center' }]}>
              <Scissors size={26} color={colors.textMuted} strokeWidth={1.5} />
            </View>
        }
      </View>
      <View style={s.info}>
        <Text style={s.name} numberOfLines={1}>{salon.name}</Text>
        <Text style={s.city}>{salon.city}</Text>
        {salon.average_rating && (
          <View style={s.ratingRow}>
            <Star size={12} color={colors.primary} fill={colors.primary} strokeWidth={1.75} />
            <Text style={s.rating}>{salon.average_rating}</Text>
          </View>
        )}
      </View>
      <TouchableOpacity onPress={() => toggle(salon.id)} style={s.heart}>
        <Heart size={22} color={colors.primary} fill={colors.primary} strokeWidth={1.75} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

export default function FavoritesScreen({ navigation }) {
  const { t } = useTranslation();
  const ids = useFavoriteStore((s) => s.ids);
  const [salons, setSalons] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetch = useCallback(async () => {
    try {
      const res = await api.get('/client/favorites');
      setSalons(res.data.data ?? []);
    } catch {}
  }, []);

  useEffect(() => { fetch(); }, [fetch, ids.length]);

  const onRefresh = async () => { setRefreshing(true); await fetch(); setRefreshing(false); };

  return (
    <View style={s.root}>
      <StatusBar style="light" />

      <SafeAreaView style={s.headerSafe} edges={['top']}>
        <View style={s.headerInner}>
          <Image source={logo} style={s.headerLogo} resizeMode="contain" />
        </View>
      </SafeAreaView>

      <FlatList
        data={salons}
        keyExtractor={(i) => String(i.id)}
        renderItem={({ item }) => (
          <FavCard
            salon={item}
            onPress={() => navigation.navigate('SalonDetail', { salonId: item.id })}
          />
        )}
        contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          <View style={s.empty}>
            <HeartCrack size={44} color={colors.textMuted} strokeWidth={1.5} style={{ marginBottom: spacing.md }} />
            <Text style={s.emptyText}>{t('favorites.empty')}</Text>
          </View>
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  headerSafe: { backgroundColor: colors.dark },
  headerInner: { height: 70, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  headerLogo: { width: '100%', height: 210 },
  list: { padding: spacing.md, gap: 12 },
  card: {
    backgroundColor: colors.card, borderRadius: radius.md, flexDirection: 'row',
    alignItems: 'center', overflow: 'hidden', ...shadow,
  },
  imageWrap: {},
  image: { width: 80, height: 80 },
  info: { flex: 1, padding: spacing.sm, alignItems: 'flex-end' },
  name: { fontSize: 15, fontWeight: '700', color: colors.dark },
  city: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  ratingRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4, marginTop: 4 },
  rating: { fontSize: 13, color: colors.dark },
  heart: { padding: spacing.sm },
  empty: { paddingTop: 80, alignItems: 'center' },
  emptyText: { color: colors.textMuted, fontSize: 15, textAlign: 'center' },
});
