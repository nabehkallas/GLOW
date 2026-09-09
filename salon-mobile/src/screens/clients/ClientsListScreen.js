import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Search } from 'lucide-react-native';
import api from '../../api/client';
import Card from '../../components/Card';
import DismissKeyboardView from '../../components/DismissKeyboardView';
import RecentSearchChips from '../../components/RecentSearchChips';
import useRecentSearches from '../../utils/useRecentSearches';
import { colors, radius, spacing } from '../../theme';

export default function ClientsListScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { terms: recentSearches, logSearch } = useRecentSearches('client');

  const load = useCallback(() => {
    setLoading(true);
    return api
      .get('/salon/clients')
      .then(({ data }) => setClients(data.data ?? data))
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return term ? clients.filter((c) => c.name.toLowerCase().includes(term)) : clients;
  }, [clients, search]);

  const totalClients = clients.length;
  const appClients = clients.filter((c) => c.type === 'app').length;
  const walkInClients = clients.filter((c) => c.type === 'walkin').length;
  const totalRevenue = clients.reduce((sum, c) => sum + c.total_spent, 0);

  return (
    <DismissKeyboardView>
    <View style={s.wrap}>
      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.xl }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(c, i) => `${c.type}-${c.user_id ?? c.name}-${i}`}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: spacing.md, gap: spacing.sm }}
          ListHeaderComponent={
            <>
              <View style={s.statsGrid}>
                <StatCard label={t('clients.totalClients')} value={totalClients} />
                <StatCard label={t('clients.appClients')} value={appClients} color="#2563eb" />
                <StatCard label={t('clients.walkInClients')} value={walkInClients} color="#c2410c" />
                <StatCard label={t('clients.totalRevenue')} value={`$${totalRevenue.toFixed(2)}`} color={colors.green} />
              </View>
              <View style={s.searchRow}>
                <Search size={16} color={colors.textMuted} />
                <TextInput
                  style={s.searchInput}
                  value={search}
                  onChangeText={setSearch}
                  onBlur={() => logSearch(search)}
                  placeholder={t('clients.searchPlaceholder')}
                  placeholderTextColor={colors.textMuted}
                />
              </View>
              {!search && <RecentSearchChips terms={recentSearches} onSelect={setSearch} />}
            </>
          }
          ListEmptyComponent={<Text style={s.empty}>{t('clients.empty')}</Text>}
          renderItem={({ item: c }) => (
            <TouchableOpacity activeOpacity={0.85} onPress={() => navigation.navigate('ClientDetail', { client: c })}>
              <Card>
                <View style={s.row}>
                  <View style={s.avatar}>
                    <Text style={s.avatarText}>{c.name.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={s.nameRow}>
                      <Text style={s.name} numberOfLines={1}>{c.name}</Text>
                      <View style={[s.typeBadge, c.type === 'app' ? s.typeBadgeApp : s.typeBadgeWalkin]}>
                        <Text style={[s.typeBadgeText, c.type === 'app' ? s.typeBadgeTextApp : s.typeBadgeTextWalkin]}>
                          {c.type === 'app' ? t('clients.app') : t('clients.walkIn')}
                        </Text>
                      </View>
                    </View>
                    <Text style={s.meta}>
                      {t('clients.visits', { count: c.total_visits })} · {new Date(c.last_visit).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text style={s.spent}>${c.total_spent.toFixed(2)}</Text>
                </View>
              </Card>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
    </DismissKeyboardView>
  );
}

function StatCard({ label, value, color = colors.dark }) {
  return (
    <View style={s.statCard}>
      <Text style={s.statLabel}>{label}</Text>
      <Text style={[s.statValue, { color }]}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.background },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.sm },
  statCard: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  statLabel: { fontSize: 11, color: colors.textMuted, marginBottom: 4 },
  statValue: { fontSize: 18, fontWeight: '800' },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  searchInput: { flex: 1, fontSize: 14, color: colors.dark, height: '100%' },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: spacing.xl, fontSize: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.dark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { flex: 1, fontSize: 14, fontWeight: '700', color: colors.dark },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.full },
  typeBadgeApp: { backgroundColor: '#dbeafe' },
  typeBadgeWalkin: { backgroundColor: '#fff1eb' },
  typeBadgeText: { fontSize: 10, fontWeight: '700' },
  typeBadgeTextApp: { color: '#2563eb' },
  typeBadgeTextWalkin: { color: '#c2410c' },
  meta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  spent: { fontSize: 14, fontWeight: '800', color: colors.dark },
});
