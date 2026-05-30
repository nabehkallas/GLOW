import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Image, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { StatusBar } from 'expo-status-bar';
import api from '../../api/client';
import useFavoriteStore from '../../stores/favoriteStore';
import { colors, spacing, radius, shadow } from '../../theme';

function FavCard({ salon, onPress }) {
  const toggle = useFavoriteStore((s) => s.toggle);
  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.9}>
      <View style={s.imageWrap}>
        {salon.logo_url
          ? <Image source={{ uri: salon.logo_url }} style={s.image} resizeMode="cover" />
          : <View style={[s.image, { backgroundColor: '#e0e0e0', justifyContent: 'center', alignItems: 'center' }]}>
              <Text style={{ fontSize: 28 }}>💇</Text>
            </View>
        }
      </View>
      <View style={s.info}>
        <Text style={s.name} numberOfLines={1}>{salon.name}</Text>
        <Text style={s.city}>{salon.city}</Text>
        {salon.average_rating && <Text style={s.rating}>⭐ {salon.average_rating}</Text>}
      </View>
      <TouchableOpacity onPress={() => toggle(salon.id)} style={s.heart}>
        <Text style={{ fontSize: 22 }}>❤️</Text>
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
    <SafeAreaView style={s.root}>
      <StatusBar style="dark" />
      <Text style={s.title}>{t('favorites.title')}</Text>

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
            <Text style={{ fontSize: 48, marginBottom: spacing.md }}>💔</Text>
            <Text style={s.emptyText}>{t('favorites.empty')}</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  title: { fontSize: 22, fontWeight: '800', color: colors.dark, padding: spacing.md, textAlign: 'right' },
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
  rating: { fontSize: 13, color: colors.dark, marginTop: 4 },
  heart: { padding: spacing.sm },
  empty: { paddingTop: 80, alignItems: 'center' },
  emptyText: { color: colors.textMuted, fontSize: 15, textAlign: 'center' },
});
