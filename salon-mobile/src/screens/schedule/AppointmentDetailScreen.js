import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute } from '@react-navigation/native';
import api from '../../api/client';
import Card from '../../components/Card';
import DismissKeyboardView from '../../components/DismissKeyboardView';
import StatusBadge from '../../components/StatusBadge';
import { colors, radius, spacing } from '../../theme';

export default function AppointmentDetailScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const { appointment: initial, status } = route.params;

  const [appointment, setAppointment] = useState(initial);
  const [completing, setCompleting] = useState(false);
  const [price, setPrice] = useState(String(initial.price_at_booking ?? ''));
  const [notes, setNotes] = useState(initial.notes ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const clientName = appointment.source === 'manual' ? appointment.client_name : appointment.client?.name ?? '—';
  const serviceName = appointment.service?.name ?? (appointment.source === 'manual' ? t('appointments.other') : '—');

  const runAction = async (verb, failMessageKey) => {
    setSaving(true);
    setError('');
    try {
      await api.patch(`/salon/appointments/${appointment.id}/${verb}`);
      navigation.goBack();
    } catch (e) {
      setError(e.response?.data?.message ?? t(failMessageKey));
    } finally {
      setSaving(false);
    }
  };

  const confirmCancel = () => {
    Alert.alert(t('appointments.cancelConfirm'), '', [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.confirm'), style: 'destructive', onPress: () => runAction('cancel', 'appointments.cancelFailed') },
    ]);
  };

  const confirmApproveCancellation = () => {
    Alert.alert(t('appointments.approveCancellationConfirm'), '', [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.confirm'), style: 'destructive', onPress: () => runAction('approve-cancellation', 'appointments.approveCancellationFailed') },
    ]);
  };

  const submitComplete = async () => {
    setSaving(true);
    setError('');
    try {
      await api.patch(`/salon/appointments/${appointment.id}/complete`, {
        price_at_booking: price === '' ? undefined : Number(price),
        notes: notes === '' ? null : notes,
      });
      navigation.goBack();
    } catch (e) {
      setError(e.response?.data?.message ?? t('appointments.completeFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <DismissKeyboardView>
    <ScrollView style={s.wrap} contentContainerStyle={{ padding: spacing.md }} keyboardShouldPersistTaps="handled">
      <Card style={{ marginBottom: spacing.md }}>
        <View style={s.headerRow}>
          <Text style={s.name}>{clientName}</Text>
          <StatusBadge status={appointment.status ?? status} />
        </View>

        <Detail label={t('common.service')} value={serviceName} />
        <Detail label={t('appointments.scheduledAt')} value={new Date(appointment.scheduled_at).toLocaleString()} />
        <Detail label={t('common.price')} value={`$${appointment.price_at_booking}`} />
        {appointment.client_phone ? <Detail label={t('appointments.clientPhone')} value={appointment.client_phone} /> : null}
        {appointment.notes ? <Detail label={t('common.notes')} value={appointment.notes} /> : null}
        {appointment.cancellation_reason ? <Detail label={t('appointments.cancellationReason')} value={appointment.cancellation_reason} /> : null}
      </Card>

      {error ? <Text style={s.error}>{error}</Text> : null}

      {completing ? (
        <Card>
          <Text style={s.sectionTitle}>{t('appointments.completeTitle')}</Text>
          <Field label={t('common.price')}>
            <TextInput value={price} onChangeText={setPrice} keyboardType="decimal-pad" style={s.input} />
          </Field>
          <Field label={t('common.notes')}>
            <TextInput value={notes} onChangeText={setNotes} style={[s.input, { height: 80 }]} multiline textAlignVertical="top" />
          </Field>
          <View style={s.actionsRow}>
            <TouchableOpacity style={[s.btn, s.btnGreen]} onPress={submitComplete} disabled={saving} activeOpacity={0.85}>
              {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.btnText}>{t('common.complete')}</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={[s.btn, s.btnGhost]} onPress={() => setCompleting(false)} disabled={saving}>
              <Text style={s.btnGhostText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </Card>
      ) : (
        <View style={s.actionsRow}>
          {status === 'pending' && (
            <>
              <TouchableOpacity style={[s.btn, s.btnBlue]} onPress={() => runAction('confirm', 'appointments.confirmFailed')} disabled={saving} activeOpacity={0.85}>
                {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.btnText}>{t('common.confirm')}</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={[s.btn, s.btnRed]} onPress={confirmCancel} disabled={saving} activeOpacity={0.85}>
                <Text style={s.btnText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
            </>
          )}
          {status === 'confirmed' && (
            <>
              <TouchableOpacity style={[s.btn, s.btnGreen]} onPress={() => setCompleting(true)} disabled={saving} activeOpacity={0.85}>
                <Text style={s.btnText}>{t('common.complete')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.btn, s.btnRed]} onPress={confirmCancel} disabled={saving} activeOpacity={0.85}>
                <Text style={s.btnText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
            </>
          )}
          {status === 'cancellation_requested' && (
            <>
              <TouchableOpacity style={[s.btn, s.btnGreen]} onPress={() => runAction('deny-cancellation', 'appointments.denyCancellationFailed')} disabled={saving} activeOpacity={0.85}>
                {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.btnText}>{t('appointments.denyCancellation')}</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={[s.btn, s.btnRed]} onPress={confirmApproveCancellation} disabled={saving} activeOpacity={0.85}>
                <Text style={s.btnText}>{t('appointments.approveCancellation')}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}
    </ScrollView>
    </DismissKeyboardView>
  );
}

function Detail({ label, value }) {
  return (
    <View style={s.detailRow}>
      <Text style={s.detailLabel}>{label}</Text>
      <Text style={s.detailValue}>{value}</Text>
    </View>
  );
}

function Field({ label, children }) {
  return (
    <View style={{ marginBottom: spacing.sm }}>
      <Text style={s.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.background },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  name: { fontSize: 17, fontWeight: '800', color: colors.dark },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  detailLabel: { fontSize: 13, color: colors.textMuted },
  detailValue: { fontSize: 13, fontWeight: '600', color: colors.dark },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: colors.dark, marginBottom: spacing.sm },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: colors.dark, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.dark,
    backgroundColor: '#fff',
  },
  actionsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  btn: { flex: 1, paddingVertical: 12, borderRadius: radius.sm, alignItems: 'center' },
  btnBlue: { backgroundColor: '#2563eb' },
  btnGreen: { backgroundColor: colors.green },
  btnRed: { backgroundColor: '#dc2626' },
  btnGhost: { backgroundColor: 'transparent' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  btnGhostText: { color: colors.textMuted, fontWeight: '600', fontSize: 14 },
  error: { color: '#dc2626', fontSize: 13, marginBottom: spacing.sm },
});
