import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { LineChart } from 'react-native-gifted-charts';
import { Plus } from 'lucide-react-native';
import api from '../../api/client';
import Card from '../../components/Card';
import { colors, radius, spacing } from '../../theme';

function fmt(n) {
  return '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function pad(n) {
  return String(n).padStart(2, '0');
}
function isoDate(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function todayStr() {
  return isoDate(new Date());
}

const PRESETS = ['today', 'week', 'month', 'year', 'all'];

function presetRange(key) {
  const now = new Date();
  if (key === 'today') return [todayStr(), todayStr()];
  if (key === 'week') {
    const start = new Date(now);
    start.setDate(start.getDate() - start.getDay());
    return [isoDate(start), todayStr()];
  }
  if (key === 'month') return [isoDate(new Date(now.getFullYear(), now.getMonth(), 1)), todayStr()];
  if (key === 'year') return [isoDate(new Date(now.getFullYear(), 0, 1)), todayStr()];
  return ['', ''];
}

export default function BalanceScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [summary, setSummary] = useState(null);
  const [history, setHistory] = useState(null);
  const [txns, setTxns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [preset, setPreset] = useState('all');
  const [deletingId, setDeletingId] = useState(null);

  const load = useCallback(() => {
    const [dateFrom, dateTo] = presetRange(preset);
    const params = { ...(dateFrom && { date_from: dateFrom }), ...(dateTo && { date_to: dateTo }) };
    setLoading(true);
    Promise.all([
      api.get('/salon/balance/summary', { params }),
      api.get('/salon/balance/transactions', { params }),
      api.get('/salon/balance/history', { params: { months: 6 } }),
    ])
      .then(([sum, tx, hist]) => {
        setSummary(sum.data);
        setTxns(tx.data.data ?? tx.data);
        setHistory(hist.data);
      })
      .finally(() => setLoading(false));
  }, [preset]);

  useEffect(() => {
    load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const removeTxn = (id) => {
    Alert.alert(t('common.delete'), '', [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          setDeletingId(id);
          try {
            await api.delete(`/salon/balance/transactions/${id}`);
            load();
          } finally {
            setDeletingId(null);
          }
        },
      },
    ]);
  };

  return (
    <ScrollView style={s.wrap} contentContainerStyle={{ padding: spacing.md }}>
      <View style={s.headerRow}>
        <Text style={s.title}>{t('nav.balance')}</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => navigation.navigate('BalanceTransactionForm')} activeOpacity={0.85}>
          <Plus size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={s.presets}>
        {PRESETS.map((p) => (
          <TouchableOpacity key={p} onPress={() => setPreset(p)} style={[s.presetBtn, preset === p && s.presetBtnActive]}>
            <Text style={[s.presetText, preset === p && s.presetTextActive]}>{t(`balance.filters.presets.${p}`)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading || !summary ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.xl }} />
      ) : (
        <>
          <View style={s.summaryGrid}>
            <SummaryCard label={t('balance.summary.totalIncome')} value={fmt(summary.total_income)} color={colors.green} />
            <SummaryCard label={t('balance.summary.totalExpenses')} value={fmt(summary.total_expenses)} color="#dc2626" />
            <SummaryCard
              label={t('balance.summary.netBalance')}
              value={fmt(summary.net_balance)}
              color={summary.net_balance >= 0 ? colors.dark : '#dc2626'}
            />
          </View>
          <Text style={s.breakdown}>
            {t('balance.summary.breakdown', {
              appointments: fmt(summary.appointment_income),
              manual: fmt(summary.manual_income),
            })}
          </Text>

          {history?.length > 0 && (
            <Card style={s.chartCard}>
              <Text style={s.cardTitle}>{t('balance.history.title')}</Text>
              <LineChart
                data={history.map((h) => ({ value: h.income, label: h.month.slice(5) }))}
                secondaryData={history.map((h) => ({ value: h.expenses }))}
                secondaryLineConfig={{ color: '#dc2626', thickness: 2.5 }}
                height={160}
                color={colors.green}
                thickness={2.5}
                hideRules
                hideYAxisText
                xAxisColor={colors.border}
                yAxisColor={colors.border}
                initialSpacing={8}
                noOfSections={3}
              />
              <View style={s.legendRow}>
                <LegendDot color={colors.green} label={t('balance.summary.totalIncome')} />
                <LegendDot color="#dc2626" label={t('balance.summary.totalExpenses')} />
              </View>
            </Card>
          )}

          <Card style={{ marginBottom: spacing.xl }}>
            <Text style={s.cardTitle}>{t('balance.table.type')}</Text>
            {txns.length === 0 ? (
              <Text style={s.empty}>{t('balance.table.noTransactions')}</Text>
            ) : (
              txns.map((row) => (
                <View key={row.id} style={s.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.rowTitle}>{t(`balance.categories.${row.category}`, { defaultValue: row.category })}</Text>
                    <Text style={s.rowSubtitle}>
                      {new Date(row.date).toLocaleDateString()}
                      {row.comment ? ` · ${row.comment}` : ''}
                    </Text>
                  </View>
                  <Text style={[s.rowAmount, { color: row.type === 'in' ? colors.green : '#dc2626' }]}>
                    {row.type === 'out' ? '-' : '+'}{fmt(row.amount)}
                  </Text>
                  <TouchableOpacity onPress={() => removeTxn(row.id)} disabled={deletingId === row.id}>
                    <Text style={s.removeText}>{deletingId === row.id ? '…' : '✕'}</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </Card>
        </>
      )}
    </ScrollView>
  );
}

function SummaryCard({ label, value, color }) {
  return (
    <View style={s.summaryCard}>
      <Text style={[s.summaryValue, { color }]} numberOfLines={1}>{value}</Text>
      <Text style={s.summaryLabel}>{label}</Text>
    </View>
  );
}

function LegendDot({ color, label }) {
  return (
    <View style={s.legendItem}>
      <View style={[s.dot, { backgroundColor: color }]} />
      <Text style={s.legendText}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.background },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  title: { fontSize: 20, fontWeight: '800', color: colors.dark },
  addBtn: { width: 36, height: 36, borderRadius: radius.full, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  presets: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.md },
  presetBtn: { paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.full, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  presetBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  presetText: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  presetTextActive: { color: '#fff' },
  summaryGrid: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xs },
  summaryCard: { flex: 1, backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.sm, alignItems: 'center' },
  summaryValue: { fontSize: 15, fontWeight: '800' },
  summaryLabel: { fontSize: 10, color: colors.textMuted, marginTop: 2, textAlign: 'center' },
  breakdown: { fontSize: 11, color: colors.textMuted, marginBottom: spacing.md },
  chartCard: { marginBottom: spacing.md, paddingVertical: spacing.md },
  cardTitle: { fontSize: 14, fontWeight: '700', color: colors.dark, marginBottom: spacing.sm },
  legendRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: colors.textMuted },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  rowTitle: { fontSize: 13, fontWeight: '600', color: colors.dark },
  rowSubtitle: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  rowAmount: { fontSize: 13, fontWeight: '700' },
  removeText: { color: colors.textMuted, fontSize: 14, paddingHorizontal: 4 },
  empty: { fontSize: 13, color: colors.textMuted, paddingVertical: spacing.sm },
});
