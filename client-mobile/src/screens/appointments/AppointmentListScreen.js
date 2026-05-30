import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const logo = require('../../../assets/logo.png');
import { useTranslation } from 'react-i18next';
import { StatusBar } from 'expo-status-bar';
import api from '../../api/client';
import { colors, spacing, radius } from '../../theme';

const STATUS_META = {
  pending:   { color: '#f59e0b', bg: '#fef3c7', label: 'في الانتظار' },
  confirmed: { color: colors.green, bg: '#d1fae5', label: 'مؤكد' },
  completed: { color: '#64748b', bg: '#f1f5f9', label: 'مكتمل' },
  cancelled: { color: '#ef4444', bg: '#fee2e2', label: 'ملغي' },
};

function AppointmentCard({ appt, onPress }) {
  const { t } = useTranslation();
  const meta = STATUS_META[appt.status] ?? STATUS_META.pending;
  const date = appt.scheduled_at?.slice(0, 10);
  const time = appt.scheduled_at?.slice(11, 16);

  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.88}>
      {/* Left accent bar */}
      <View style={[s.accent, { backgroundColor: meta.color }]} />

      <View style={s.cardContent}>
        <View style={s.cardTop}>
          <View style={[s.badge, { backgroundColor: meta.bg }]}>
            <Text style={[s.badgeText, { color: meta.color }]}>{meta.label}</Text>
          </View>
          <Text style={s.salonName} numberOfLines={1}>{appt.salon?.name ?? '—'}</Text>
        </View>

        <Text style={s.svcName}>{appt.service?.name ?? '—'}</Text>

        <View style={s.cardBottom}>
          {appt.service?.price && (
            <Text style={s.price}>{appt.service.price} ل.س</Text>
          )}
          <View style={s.dateWrap}>
            <Text style={s.time}>{time}</Text>
            <Text style={s.date}>{date}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function AppointmentListScreen({ navigation }) {
  const { t } = useTranslation();
  const [tab, setTab] = useState('upcoming');
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetch = useCallback(async () => {
    try {
      const res = await api.get('/client/appointments', { params: { status: tab } });
      setAppointments(res.data.data ?? []);
    } catch {} finally { setLoading(false); }
  }, [tab]);

  useEffect(() => { setLoading(true); fetch(); }, [fetch]);
  const onRefresh = async () => { setRefreshing(true); await fetch(); setRefreshing(false); };

  return (
    <View style={s.root}>
      <StatusBar style="light" />
      <SafeAreaView style={s.headerSafe} edges={['top']}>
        <View style={s.headerInner}>
          <Image source={logo} style={s.headerLogo} resizeMode="contain" />
        </View>
        <Text style={s.pageTitle}>{t('appointments.title')}</Text>
      </SafeAreaView>

      <View style={s.tabRow}>
        {[
          { key: 'upcoming', label: t('appointments.upcoming') },
          { key: 'past',     label: t('appointments.past') },
        ].map(({ key, label }) => (
          <TouchableOpacity
            key={key}
            style={[s.tabBtn, tab === key && s.tabBtnActive]}
            onPress={() => setTab(key)}
          >
            <Text style={[s.tabText, tab === key && s.tabTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={appointments}
        keyExtractor={(i) => String(i.id)}
        renderItem={({ item }) => (
          <AppointmentCard
            appt={item}
            onPress={() => navigation.navigate('AppointmentDetail', { appointmentId: item.id })}
          />
        )}
        contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          !loading && (
            <View style={s.empty}>
              <Text style={{ fontSize: 48, marginBottom: spacing.sm }}>📅</Text>
              <Text style={s.emptyText}>
                {tab === 'upcoming' ? t('appointments.noUpcoming') : t('appointments.noPast')}
              </Text>
            </View>
          )
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  headerSafe: { backgroundColor: colors.dark, alignItems: 'center', paddingBottom: spacing.sm },
  headerInner: { height: 70, overflow: 'hidden', width: '100%', alignItems: 'center', justifyContent: 'center' },
  headerLogo: { width: '100%', height: 210 },
  pageTitle: { fontSize: 15, fontWeight: '600', color: 'rgba(255,255,255,0.7)', letterSpacing: 0.5 },
  tabRow: {
    flexDirection: 'row', backgroundColor: '#fff',
    marginHorizontal: spacing.md, marginTop: spacing.md,
    borderRadius: radius.md, padding: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  tabBtn: { flex: 1, paddingVertical: 10, borderRadius: radius.sm, alignItems: 'center' },
  tabBtnActive: { backgroundColor: colors.dark },
  tabText: { color: colors.textMuted, fontWeight: '600', fontSize: 14 },
  tabTextActive: { color: '#fff' },
  list: { padding: spacing.md, gap: 12 },
  card: {
    backgroundColor: '#fff', borderRadius: radius.md, flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  accent: { width: 5 },
  cardContent: { flex: 1, padding: spacing.md },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  salonName: { fontSize: 15, fontWeight: '700', color: colors.dark, flex: 1, textAlign: 'right', marginLeft: 8 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full },
  badgeText: { fontSize: 11, fontWeight: '700' },
  svcName: { fontSize: 13, color: colors.textMuted, textAlign: 'right', marginBottom: spacing.sm },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  price: { fontSize: 14, fontWeight: '700', color: colors.primary, writingDirection: 'ltr' },
  dateWrap: { alignItems: 'flex-end' },
  date: { fontSize: 12, color: colors.textMuted, writingDirection: 'ltr' },
  time: { fontSize: 14, fontWeight: '700', color: colors.dark, writingDirection: 'ltr' },
  empty: { paddingTop: 60, alignItems: 'center' },
  emptyText: { color: colors.textMuted, fontSize: 15, textAlign: 'center' },
});
