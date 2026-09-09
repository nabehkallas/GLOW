import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Modal, TextInput } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Clock as ClockIcon, Plus, UserPlus, Ban, Search, X } from 'lucide-react-native';
import api from '../../api/client';
import Card from '../../components/Card';
import DismissKeyboardView from '../../components/DismissKeyboardView';
import RecentSearchChips from '../../components/RecentSearchChips';
import StatusBadge from '../../components/StatusBadge';
import useRecentSearches from '../../utils/useRecentSearches';
import { colors, radius, spacing } from '../../theme';

const STATUS_KEYS = ['pending', 'cancellation_requested', 'confirmed', 'completed', 'cancelled'];

export default function AppointmentListScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const [status, setStatus] = useState('pending');
  const [search, setSearch] = useState('');
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showChoice, setShowChoice] = useState(false);
  const { terms: recentSearches, logSearch } = useRecentSearches('appointment');

  const load = useCallback((s, q) => {
    setLoading(true);
    return api
      .get('/salon/appointments', { params: { status: s, search: q || undefined } })
      .then(({ data }) => setAppointments(data.data ?? data))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => load(status, search), search ? 300 : 0);
    return () => clearTimeout(timeout);
  }, [status, search, load]);

  // Refresh whenever this screen regains focus (e.g. returning from the detail screen after an action).
  // Also consumes a `status` param from cross-tab navigation (e.g. the Dashboard's Pending KPI card),
  // then clears it so a later, unrelated tab switch doesn't force it back.
  useFocusEffect(
    useCallback(() => {
      if (route.params?.status && route.params.status !== status) {
        navigation.setParams({ status: undefined });
        setStatus(route.params.status);
      } else {
        load(status, search);
      }
    }, [route.params?.status, status, search, load, navigation])
  );

  const pickWalkIn = () => {
    setShowChoice(false);
    navigation.navigate('WalkInForm');
  };

  const pickBlock = () => {
    setShowChoice(false);
    navigation.navigate('BlockForm');
  };

  return (
    <DismissKeyboardView>
    <SafeAreaView edges={['top']} style={s.wrap}>
      <View style={s.headerRow}>
        <Text style={s.title}>{t('appointments.title')}</Text>
        <View style={s.headerActions}>
          <TouchableOpacity onPress={() => setShowChoice(true)} style={s.addBtn} activeOpacity={0.8}>
            <Plus size={18} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('WorkingHours')} style={s.hoursBtn} activeOpacity={0.8}>
            <ClockIcon size={16} color={colors.dark} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={s.searchRow}>
        <Search size={16} color={colors.textMuted} />
        <TextInput
          style={s.searchInput}
          value={search}
          onChangeText={setSearch}
          onBlur={() => logSearch(search)}
          placeholder={t('appointments.searchPlaceholder')}
          placeholderTextColor={colors.textMuted}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')} hitSlop={8}>
            <X size={16} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {!search && <RecentSearchChips terms={recentSearches} onSelect={setSearch} />}

      <View style={s.tabs}>
        {STATUS_KEYS.map((k) => (
          <TouchableOpacity
            key={k}
            onPress={() => setStatus(k)}
            style={[s.tab, status === k && s.tabActive]}
            activeOpacity={0.8}
          >
            <Text style={[s.tabText, status === k && s.tabTextActive]}>{t('status.' + k)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.xl }} />
      ) : appointments.length === 0 ? (
        <Text style={s.empty}>{t('appointments.noAppointments', { status: t('status.' + status) })}</Text>
      ) : (
        <FlatList
          data={appointments}
          keyExtractor={(a) => String(a.id)}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: spacing.md, paddingTop: 0, gap: spacing.sm }}
          renderItem={({ item: a }) => (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => navigation.navigate('AppointmentDetail', { appointment: a, status })}
            >
              <Card>
                <View style={s.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.rowTitle}>{a.source === 'manual' ? a.client_name : a.client?.name ?? '—'}</Text>
                    <Text style={s.rowSubtitle}>
                      {a.service?.name ?? (a.source === 'manual' ? t('appointments.other') : '—')}
                    </Text>
                    <Text style={s.rowDate}>{new Date(a.scheduled_at).toLocaleString()}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 6 }}>
                    <StatusBadge status={a.status} />
                    <Text style={s.rowPrice}>${a.price_at_booking}</Text>
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          )}
        />
      )}

      <Modal visible={showChoice} transparent animationType="fade" onRequestClose={() => setShowChoice(false)}>
        <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={() => setShowChoice(false)}>
          <View style={s.sheet} onStartShouldSetResponder={() => true}>
            <Text style={s.sheetTitle}>{t('workingHours.choiceTitle')}</Text>
            <TouchableOpacity style={s.sheetOption} onPress={pickWalkIn} activeOpacity={0.8}>
              <UserPlus size={20} color={colors.primary} />
              <Text style={s.sheetOptionText}>{t('workingHours.choiceWalkIn')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.sheetOption} onPress={pickBlock} activeOpacity={0.8}>
              <Ban size={20} color={colors.textMuted} />
              <Text style={s.sheetOptionText}>{t('workingHours.choiceBlock')}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
    </DismissKeyboardView>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.background },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  title: { fontSize: 20, fontWeight: '800', color: colors.dark },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hoursBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.sm,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: { flex: 1, fontSize: 14, color: colors.dark, height: '100%' },
  tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
  tab: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabText: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  tabTextActive: { color: '#fff' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  rowTitle: { fontSize: 15, fontWeight: '700', color: colors.dark },
  rowSubtitle: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  rowDate: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  rowPrice: { fontSize: 14, fontWeight: '700', color: colors.dark },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: spacing.xl, fontSize: 14 },
  overlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.card, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: spacing.lg },
  sheetTitle: { fontSize: 15, fontWeight: '700', color: colors.dark, marginBottom: spacing.md },
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  sheetOptionText: { fontSize: 14, fontWeight: '600', color: colors.dark },
});
