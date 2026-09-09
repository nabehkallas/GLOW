import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LineChart, BarChart } from 'react-native-gifted-charts';
import { X } from 'lucide-react-native';
import api from '../../api/client';
import Card from '../../components/Card';
import DateField from '../../components/DateField';
import { colors, radius, spacing } from '../../theme';

const DAY_INDEX = { Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6 };
const MONTH_OPTIONS = [3, 6, 12];

function pad(n) {
  return String(n).padStart(2, '0');
}
function toDateParam(d) {
  return d ? `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` : undefined;
}

export default function AnalyticsScreen() {
  const { t } = useTranslation();
  const [months, setMonths] = useState(6);
  const [dateFrom, setDateFrom] = useState(null);
  const [dateTo, setDateTo] = useState(null);
  const [data, setData] = useState(null);
  const ranged = Boolean(dateFrom && dateTo);

  useEffect(() => {
    setData(null);
    const params = ranged ? { date_from: toDateParam(dateFrom), date_to: toDateParam(dateTo) } : { months };
    api.get('/salon/analytics', { params }).then(({ data }) => setData(data));
  }, [months, dateFrom, dateTo, ranged]);

  return (
    <ScrollView style={s.wrap} contentContainerStyle={{ padding: spacing.md }}>
      <View style={s.headerRow}>
        <Text style={s.title}>{t('nav.analytics')}</Text>
        {!ranged && (
          <View style={s.monthTabs}>
            {MONTH_OPTIONS.map((m) => (
              <TouchableOpacity key={m} onPress={() => setMonths(m)} style={[s.monthTab, months === m && s.monthTabActive]}>
                <Text style={[s.monthTabText, months === m && s.monthTabTextActive]}>{m}m</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <View style={s.dateRow}>
        <View style={{ flex: 1 }}>
          <DateField label={t('appointments.dateFrom')} value={dateFrom} onChange={setDateFrom} />
        </View>
        <View style={{ flex: 1 }}>
          <DateField label={t('appointments.dateTo')} value={dateTo} onChange={setDateTo} />
        </View>
        {(dateFrom || dateTo) && (
          <TouchableOpacity
            onPress={() => {
              setDateFrom(null);
              setDateTo(null);
            }}
            style={s.clearBtn}
            hitSlop={8}
          >
            <X size={16} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {!data ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.xl }} />
      ) : (
        <>
          <View style={s.statsGrid}>
            <StatCard label={t('analytics.totalAppointments')} value={data.overview.total_appointments} />
            <StatCard label={t('analytics.pendingAppointments')} value={data.overview.pending_appointments} color="#ea580c" />
            <StatCard label={t('analytics.confirmedAppointments')} value={data.overview.confirmed_appointments} color="#2563eb" />
            <StatCard label={t('analytics.cancelledAppointments')} value={data.overview.cancelled_appointments} color="#dc2626" />
            <StatCard label={t('analytics.thisMonthRevenue')} value={`$${data.overview.this_month_revenue}`} color={colors.green} />
            <StatCard label={t('analytics.totalSpentOnProducts')} value={`$${data.overview.total_spent_on_products}`} />
          </View>

          {data.monthly_revenue?.length > 0 && (
            <Card style={s.chartCard}>
              <Text style={s.cardTitle}>{t('analytics.monthlyRevenue')}</Text>
              <LineChart
                data={data.monthly_revenue.map((m) => ({ value: m.revenue, label: m.label.slice(5) }))}
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

          {data.monthly_appointments?.length > 0 && (
            <Card style={s.chartCard}>
              <Text style={s.cardTitle}>{t('analytics.monthlyAppointments')}</Text>
              <BarChart
                data={data.monthly_appointments.map((m) => ({ value: m.count, label: m.label.slice(5) }))}
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

          {data.busiest_days?.length > 0 && (
            <Card style={s.chartCard}>
              <Text style={s.cardTitle}>{t('analytics.busiestDays')}</Text>
              <BarChart
                data={data.busiest_days.map((d) => ({ value: d.count, label: t(`days.${DAY_INDEX[d.day]}`).slice(0, 3) }))}
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

          {data.top_services?.length > 0 && (
            <Card style={s.listCard}>
              <Text style={s.cardTitle}>{t('analytics.topServices')}</Text>
              {data.top_services.map((sv, i) => (
                <View key={i} style={s.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.rowTitle}>{sv.name}</Text>
                    <Text style={s.rowSubtitle}>{sv.count} {t('analytics.bookings')}</Text>
                  </View>
                  <Text style={s.rowAmount}>${sv.revenue}</Text>
                </View>
              ))}
            </Card>
          )}

          {Object.keys(data.orders_summary ?? {}).length > 0 && (
            <Card style={s.listCard}>
              <Text style={s.cardTitle}>{t('analytics.ordersSummary')}</Text>
              {Object.values(data.orders_summary).map((row, i) => (
                <View key={i} style={s.row}>
                  <Text style={s.rowTitle}>{t('status.' + row.status, { defaultValue: row.status })}</Text>
                  <Text style={s.rowSubtitle}>{row.count}</Text>
                  <Text style={s.rowAmount}>${row.total}</Text>
                </View>
              ))}
            </Card>
          )}

          {data.recent_appointments?.length > 0 && (
            <Card style={[s.listCard, { marginBottom: spacing.xl }]}>
              <Text style={s.cardTitle}>{t('analytics.recentAppointments')}</Text>
              {data.recent_appointments.map((a) => (
                <View key={a.id} style={s.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.rowTitle}>{a.source === 'manual' ? a.client_name : a.client?.name ?? '—'}</Text>
                    <Text style={s.rowSubtitle}>{a.service?.name ?? t('appointments.other')} · {new Date(a.scheduled_at).toLocaleDateString()}</Text>
                  </View>
                </View>
              ))}
            </Card>
          )}
        </>
      )}
    </ScrollView>
  );
}

function StatCard({ label, value, color = colors.dark }) {
  return (
    <View style={s.statCard}>
      <Text style={s.statLabel} numberOfLines={1}>{label}</Text>
      <Text style={[s.statValue, { color }]}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.background },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  dateRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, marginBottom: spacing.md },
  clearBtn: { padding: 12 },
  title: { fontSize: 20, fontWeight: '800', color: colors.dark },
  monthTabs: { flexDirection: 'row', gap: 4, backgroundColor: colors.card, borderRadius: radius.full, padding: 3, borderWidth: 1, borderColor: colors.border },
  monthTab: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.full },
  monthTabActive: { backgroundColor: colors.primary },
  monthTabText: { fontSize: 12, fontWeight: '700', color: colors.textMuted },
  monthTabTextActive: { color: '#fff' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  statCard: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
  },
  statLabel: { fontSize: 11, color: colors.textMuted, marginBottom: 4 },
  statValue: { fontSize: 17, fontWeight: '800' },
  chartCard: { marginBottom: spacing.md, paddingVertical: spacing.md },
  cardTitle: { fontSize: 14, fontWeight: '700', color: colors.dark, marginBottom: spacing.sm },
  listCard: { marginBottom: spacing.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  rowTitle: { fontSize: 13, fontWeight: '600', color: colors.dark },
  rowSubtitle: { fontSize: 12, color: colors.textMuted },
  rowAmount: { fontSize: 13, fontWeight: '700', color: colors.dark },
});
