import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import api from '../../api/client';
import { colors, spacing, radius, shadow } from '../../theme';

const STATUS_COLOR = {
  pending: '#ffa726',
  confirmed: colors.green,
  completed: '#90a4ae',
  cancelled: '#ef5350',
};

function Row({ label, value }) {
  return (
    <View style={s.row}>
      <Text style={s.rowValue}>{value ?? '—'}</Text>
      <Text style={s.rowLabel}>{label}</Text>
    </View>
  );
}

export default function AppointmentDetailScreen({ route, navigation }) {
  const { t } = useTranslation();
  const { appointmentId } = route.params;
  const [appt, setAppt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    api.get(`/client/appointments/${appointmentId}`)
      .then((res) => setAppt(res.data.data ?? res.data))
      .finally(() => setLoading(false));
  }, []);

  const handleCancel = () => {
    Alert.alert('', t('appointments.cancelConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('appointments.cancel'), style: 'destructive', onPress: async () => {
          setCancelling(true);
          try {
            await api.patch(`/client/appointments/${appointmentId}/cancel`);
            setAppt((prev) => ({ ...prev, status: 'cancelled' }));
          } catch (err) {
            Alert.alert('', err.response?.data?.message ?? t('common.error'));
          } finally { setCancelling(false); }
        },
      },
    ]);
  };

  if (loading) {
    return <View style={s.center}><ActivityIndicator color={colors.primary} /></View>;
  }

  if (!appt) return null;

  const canCancel = ['pending', 'confirmed'].includes(appt.status);
  const canReview = appt.status === 'completed';
  const color = STATUS_COLOR[appt.status] ?? colors.textMuted;

  return (
    <ScrollView style={s.root} contentContainerStyle={s.content}>
      <View style={[s.badge, { backgroundColor: color + '22', alignSelf: 'flex-end' }]}>
        <Text style={[s.badgeText, { color }]}>{t(`appointments.status.${appt.status}`)}</Text>
      </View>

      <View style={s.card}>
        <Row label={t('appointments.salon')} value={appt.salon?.name} />
        <Row label={t('appointments.service')} value={appt.service?.name} />
        <Row label={t('booking.date')} value={appt.scheduled_at?.slice(0, 10)} />
        <Row label={t('booking.time')} value={appt.scheduled_at?.slice(11, 16)} />
        <Row label={t('booking.price')} value={appt.service?.price ? `${appt.service.price} ل.س` : null} />
        <Row label={t('booking.duration')} value={appt.service?.duration_minutes ? `${appt.service.duration_minutes} دقيقة` : null} />
        {appt.notes && <Row label={t('appointments.notes')} value={appt.notes} />}
      </View>

      {canReview && (
        <TouchableOpacity
          style={[s.btn, { backgroundColor: colors.green }]}
          onPress={() => navigation.navigate('WriteReview', { appointmentId, salonId: appt.salon_id })}
          activeOpacity={0.8}
        >
          <Text style={s.btnText}>{t('appointments.leaveReview')}</Text>
        </TouchableOpacity>
      )}

      {canCancel && (
        <TouchableOpacity
          style={[s.btn, { backgroundColor: '#ef5350' }, cancelling && { opacity: 0.6 }]}
          onPress={handleCancel}
          disabled={cancelling}
          activeOpacity={0.8}
        >
          <Text style={s.btnText}>{cancelling ? t('common.loading') : t('appointments.cancel')}</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.md },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  badge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: radius.full },
  badgeText: { fontWeight: '700', fontSize: 13 },
  card: { backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md, ...shadow },
  row: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 10, borderBottomWidth: 1, borderColor: colors.border,
  },
  rowLabel: { fontSize: 14, color: colors.textMuted },
  rowValue: { fontSize: 14, fontWeight: '600', color: colors.dark, flex: 1, textAlign: 'right', marginLeft: 12 },
  btn: { borderRadius: radius.sm, height: 52, justifyContent: 'center', alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
