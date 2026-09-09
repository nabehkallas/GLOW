import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRoute } from '@react-navigation/native';
import api from '../../api/client';
import Card from '../../components/Card';
import StatusBadge from '../../components/StatusBadge';
import { colors, radius, spacing } from '../../theme';

export default function ClientDetailScreen() {
  const { t } = useTranslation();
  const route = useRoute();
  const client = route.params.client;
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const req =
      client.type === 'app'
        ? api.get(`/salon/clients/app/${client.user_id}`)
        : api.get('/salon/clients/walkin', { params: { name: client.name } });
    req.then(({ data }) => setDetail(data.data ?? data)).finally(() => setLoading(false));
  }, [client]);

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }
  if (!detail) return null;

  return (
    <ScrollView style={s.wrap} contentContainerStyle={{ padding: spacing.md }}>
      <View style={s.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={s.name}>{detail.name}</Text>
          {detail.email ? <Text style={s.meta}>{detail.email}</Text> : null}
          {detail.phone ? <Text style={s.meta}>{detail.phone}</Text> : null}
        </View>
        <View style={[s.typeBadge, detail.type === 'app' ? s.typeBadgeApp : s.typeBadgeWalkin]}>
          <Text style={[s.typeBadgeText, detail.type === 'app' ? s.typeBadgeTextApp : s.typeBadgeTextWalkin]}>
            {detail.type === 'app' ? t('clients.app') : t('clients.walkIn')}
          </Text>
        </View>
      </View>

      <View style={s.statsGrid}>
        <MiniStat label={t('clients.totalVisits')} value={detail.stats.total_visits} />
        <MiniStat label={t('clients.completed')} value={detail.stats.completed_visits} color={colors.green} />
        <MiniStat label={t('clients.cancelled')} value={detail.stats.cancelled_visits} color="#dc2626" />
        <MiniStat label={t('clients.upcoming')} value={detail.stats.pending_visits} color="#2563eb" />
      </View>
      <Card style={{ marginTop: spacing.sm, marginBottom: spacing.md }}>
        <Text style={s.statLabel}>{t('clients.totalSpent')}</Text>
        <Text style={[s.bigValue, { color: colors.green }]}>${detail.stats.total_spent.toFixed(2)}</Text>
      </Card>

      {detail.stats.first_visit ? (
        <View style={s.timelineRow}>
          <Text style={s.timelineText}>
            {t('clients.firstVisit')}: <Text style={s.timelineStrong}>{new Date(detail.stats.first_visit).toLocaleDateString()}</Text>
          </Text>
          <Text style={s.timelineText}>
            {t('clients.lastVisit')}: <Text style={s.timelineStrong}>{new Date(detail.stats.last_visit).toLocaleDateString()}</Text>
          </Text>
        </View>
      ) : null}

      <Text style={s.sectionTitle}>{t('clients.history')}</Text>
      {detail.appointments.length === 0 ? (
        <Text style={s.empty}>{t('clients.noHistory')}</Text>
      ) : (
        <View style={{ gap: spacing.sm, marginBottom: spacing.xl }}>
          {detail.appointments.map((a) => (
            <Card key={a.id}>
              <View style={s.apptRow}>
                <View style={{ flex: 1 }}>
                  <Text style={s.apptService}>{a.service?.name ?? t('appointments.other')}</Text>
                  <Text style={s.apptDate}>{new Date(a.scheduled_at).toLocaleString()}</Text>
                  {a.notes ? <Text style={s.apptNotes}>"{a.notes}"</Text> : null}
                </View>
                <View style={{ alignItems: 'flex-end', gap: 6 }}>
                  <StatusBadge status={a.status} />
                  {a.price_at_booking > 0 ? <Text style={s.apptPrice}>${a.price_at_booking}</Text> : null}
                </View>
              </View>
            </Card>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function MiniStat({ label, value, color = colors.dark }) {
  return (
    <View style={s.statCard}>
      <Text style={s.statLabel}>{label}</Text>
      <Text style={[s.statValue, { color }]}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginBottom: spacing.md },
  name: { fontSize: 18, fontWeight: '800', color: colors.dark },
  meta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full },
  typeBadgeApp: { backgroundColor: '#dbeafe' },
  typeBadgeWalkin: { backgroundColor: '#fff1eb' },
  typeBadgeText: { fontSize: 11, fontWeight: '700' },
  typeBadgeTextApp: { color: '#2563eb' },
  typeBadgeTextWalkin: { color: '#c2410c' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
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
  bigValue: { fontSize: 24, fontWeight: '800', marginTop: 4 },
  timelineRow: { flexDirection: 'row', gap: spacing.lg, marginBottom: spacing.md },
  timelineText: { fontSize: 12, color: colors.textMuted },
  timelineStrong: { color: colors.dark, fontWeight: '700' },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: colors.dark, marginBottom: spacing.sm },
  empty: { fontSize: 13, color: colors.textMuted, marginBottom: spacing.xl },
  apptRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  apptService: { fontSize: 14, fontWeight: '700', color: colors.dark },
  apptDate: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  apptNotes: { fontSize: 12, color: colors.textMuted, fontStyle: 'italic', marginTop: 4 },
  apptPrice: { fontSize: 13, fontWeight: '700', color: colors.dark },
});
