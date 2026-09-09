import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { LineChart, BarChart } from 'react-native-gifted-charts';
import { DollarSign, CalendarDays, Clock, Star, ShoppingCart, Pencil } from 'lucide-react-native';
import api from '../../api/client';
import useAuthStore from '../../stores/authStore';
import AvatarViewer from '../../components/AvatarViewer';
import Card from '../../components/Card';
import StatusBadge from '../../components/StatusBadge';
import { colors, radius, spacing } from '../../theme';

export default function DashboardScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { salon, updateSalon } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);

  const load = useCallback(() => {
    return Promise.all([api.get('/salon/analytics'), api.get('/salon/orders')]).then(([a, o]) => {
      setStats(a.data);
      setOrders((o.data.data ?? o.data).slice(0, 5));
    });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load().finally(() => setRefreshing(false));
  };

  const changeLogo = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (result.canceled) return;

    const asset = result.assets[0];
    setUploadingLogo(true);
    const form = new FormData();
    form.append('image', {
      uri: asset.uri,
      name: asset.fileName ?? 'logo.jpg',
      type: asset.mimeType ?? 'image/jpeg',
    });

    try {
      const res = await api.post('/salon/profile/logo', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      updateSalon({ logo_url: res.data.logo_url ?? null });
    } catch {
      // non-critical, user can retry
    } finally {
      setUploadingLogo(false);
    }
  };

  if (!stats) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const ov = stats.overview ?? {};
  const initial = salon?.name?.charAt(0)?.toUpperCase() ?? '?';

  const revenueChartData = (stats.monthly_revenue ?? []).map((m) => ({ value: m.revenue, label: m.label.slice(5) }));
  const topServicesData = (stats.top_services ?? []).slice(0, 5).map((sv) => ({
    value: sv.appointments_count ?? 0,
    label: (sv.name ?? '').slice(0, 8),
  }));
  const busiestDaysData = (stats.busiest_days ?? []).map((d) => ({ value: d.count, label: t(`days.${dayIndex(d.day)}`).slice(0, 3) }));

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.background }}>
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={s.scroll}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      <View style={s.header}>
        <TouchableOpacity onPress={() => setAvatarOpen(true)} activeOpacity={0.8} style={s.logoWrap}>
          {salon?.logo_url ? (
            <Image source={{ uri: salon.logo_url }} style={s.logo} />
          ) : (
            <View style={[s.logo, s.logoFallback]}>
              <Text style={s.logoInitial}>{initial}</Text>
            </View>
          )}
          <View style={s.logoEditBadge}>
            {uploadingLogo ? <ActivityIndicator size="small" color="#fff" /> : <Pencil size={12} color="#fff" />}
          </View>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>{t('dashboard.title')}</Text>
          {salon?.name ? <Text style={s.subtitle}>{salon.name}</Text> : null}
        </View>
      </View>

      <View style={s.kpiGrid}>
        <View style={[s.kpiCard, s.kpiHero]}>
          <View style={s.kpiTopRow}>
            <Text style={s.kpiHeroLabel}>{t('dashboard.thisMonthRevenue')}</Text>
            <DollarSign size={16} color="rgba(255,255,255,0.85)" />
          </View>
          <Text style={s.kpiHeroValue}>${ov.this_month_revenue ?? 0}</Text>
        </View>

        <KpiCard icon={CalendarDays} label={t('dashboard.totalAppointments')} value={ov.total_appointments ?? 0} />

        <TouchableOpacity
          style={[s.kpiCard, s.kpiPending]}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('Schedule', { screen: 'AppointmentList', params: { status: 'pending' } })}
        >
          <View style={s.kpiTopRow}>
            <Text style={s.kpiPendingLabel}>{t('dashboard.pending')}</Text>
            <Clock size={16} color="#ea580c" />
          </View>
          <Text style={s.kpiPendingValue}>{ov.pending_appointments ?? 0}</Text>
        </TouchableOpacity>

        <KpiCard icon={Star} label={t('dashboard.avgRating')} value={salon?.average_rating ?? '—'} />
      </View>

      {revenueChartData.length > 1 && (
        <Card style={s.chartCard}>
          <Text style={s.cardTitle}>{t('dashboard.thisMonthRevenue')}</Text>
          <LineChart
            data={revenueChartData}
            height={160}
            color={colors.primary}
            thickness={2.5}
            areaChart
            startFillColor={colors.primary}
            endFillColor={colors.primary}
            startOpacity={0.25}
            endOpacity={0.02}
            hideRules
            hideYAxisText
            xAxisColor={colors.border}
            yAxisColor={colors.border}
            initialSpacing={8}
            noOfSections={3}
          />
        </Card>
      )}

      {topServicesData.length > 0 && (
        <Card style={s.chartCard}>
          <Text style={s.cardTitle}>{t('dashboard.topServices')}</Text>
          <BarChart
            data={topServicesData}
            height={160}
            frontColor={colors.green}
            barWidth={22}
            spacing={18}
            hideRules
            hideYAxisText
            xAxisColor={colors.border}
            yAxisColor={colors.border}
            noOfSections={3}
          />
        </Card>
      )}

      {busiestDaysData.length > 0 && (
        <Card style={s.chartCard}>
          <Text style={s.cardTitle}>{t('dashboard.busiestDays')}</Text>
          <BarChart
            data={busiestDaysData}
            height={160}
            frontColor={colors.dark}
            barWidth={22}
            spacing={18}
            hideRules
            hideYAxisText
            xAxisColor={colors.border}
            yAxisColor={colors.border}
            noOfSections={3}
          />
        </Card>
      )}

      <Card style={s.listCard}>
        <View style={s.listHeader}>
          <View style={s.listHeaderTitle}>
            <ShoppingCart size={16} color={colors.textMuted} />
            <Text style={s.cardTitle}>{t('dashboard.recentOrders')}</Text>
          </View>
        </View>
        {orders.length === 0 ? (
          <Text style={s.empty}>{t('dashboard.noData')}</Text>
        ) : (
          orders.map((o) => (
            <View key={o.id} style={s.row}>
              <View style={{ flex: 1 }}>
                <Text style={s.rowTitle}>#{o.id}</Text>
                <Text style={s.rowSubtitle}>{(o.items?.length ?? 0)} items</Text>
              </View>
              <StatusBadge status={o.status} />
              <Text style={s.rowAmount}>${o.total_amount}</Text>
            </View>
          ))
        )}
      </Card>

      {stats.recent_appointments?.length > 0 && (
        <Card style={[s.listCard, { marginBottom: spacing.xl }]}>
          <Text style={s.cardTitle}>{t('dashboard.recentAppointments')}</Text>
          {stats.recent_appointments.map((a) => (
            <View key={a.id} style={s.row}>
              <View style={{ flex: 1 }}>
                <Text style={s.rowTitle}>{a.client?.name ?? a.client_name ?? '—'}</Text>
                <Text style={s.rowSubtitle}>{a.service?.name ?? '—'} · {new Date(a.scheduled_at).toLocaleDateString()}</Text>
              </View>
              <StatusBadge status={a.status} />
            </View>
          ))}
        </Card>
      )}
    </ScrollView>
    <AvatarViewer
      visible={avatarOpen}
      imageUrl={salon?.logo_url}
      initial={initial}
      uploading={uploadingLogo}
      onClose={() => setAvatarOpen(false)}
      onUpload={changeLogo}
    />
    </SafeAreaView>
  );
}

function dayIndex(name) {
  return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(name);
}

function KpiCard({ icon: Icon, label, value }) {
  return (
    <View style={s.kpiCard}>
      <View style={s.kpiTopRow}>
        <Text style={s.kpiLabel}>{label}</Text>
        {Icon && <Icon size={16} color={colors.textMuted} />}
      </View>
      <Text style={s.kpiValue}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  scroll: { padding: spacing.md, paddingTop: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg },
  logoWrap: { width: 56, height: 56 },
  logo: { width: 56, height: 56, borderRadius: radius.md },
  logoFallback: { backgroundColor: colors.dark, alignItems: 'center', justifyContent: 'center' },
  logoInitial: { color: '#fff', fontSize: 22, fontWeight: '900' },
  logoEditBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.dark,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  title: { fontSize: 20, fontWeight: '800', color: colors.dark },
  subtitle: { fontSize: 13, color: colors.textMuted },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  kpiCard: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  kpiHero: { backgroundColor: colors.primary, borderColor: colors.primary },
  kpiPending: { backgroundColor: '#fff7ed', borderColor: '#fed7aa' },
  kpiTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  kpiLabel: { fontSize: 12, color: colors.textMuted },
  kpiHeroLabel: { fontSize: 12, color: 'rgba(255,255,255,0.85)' },
  kpiPendingLabel: { fontSize: 12, color: '#c2410c' },
  kpiValue: { fontSize: 20, fontWeight: '800', color: colors.dark },
  kpiHeroValue: { fontSize: 22, fontWeight: '800', color: '#fff' },
  kpiPendingValue: { fontSize: 20, fontWeight: '800', color: '#c2410c' },
  chartCard: { marginBottom: spacing.md, paddingVertical: spacing.md },
  cardTitle: { fontSize: 14, fontWeight: '700', color: colors.dark, marginBottom: spacing.sm },
  listCard: { marginBottom: spacing.md },
  listHeader: { marginBottom: spacing.xs },
  listHeaderTitle: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  rowTitle: { fontSize: 14, fontWeight: '600', color: colors.dark },
  rowSubtitle: { fontSize: 12, color: colors.textMuted },
  rowAmount: { fontSize: 14, fontWeight: '700', color: colors.dark },
  empty: { fontSize: 13, color: colors.textMuted, paddingVertical: spacing.sm },
});
