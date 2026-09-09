import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import api from '../../api/client';
import DateTimeField from '../../components/DateTimeField';
import DismissKeyboardView from '../../components/DismissKeyboardView';
import { colors, radius, spacing } from '../../theme';
import { toLocalDateTimeString } from '../../utils/datetime';

const DURATION_OPTIONS = [15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180];

function formatDuration(mins) {
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}min` : `${h}h`;
}

export default function BlockFormScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [services, setServices] = useState([]);
  const [serviceId, setServiceId] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [scheduledAt, setScheduledAt] = useState(new Date());
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/salon/services').then(({ data }) => setServices(data.data ?? data));
  }, []);

  const submit = async () => {
    if (!scheduledAt) {
      setError(t('common.somethingWrong'));
      return;
    }
    setSaving(true);
    setError('');
    try {
      await api.post('/salon/schedule-blocks', {
        starts_at: toLocalDateTimeString(scheduledAt),
        duration_minutes: durationMinutes,
        salon_service_id: serviceId ? Number(serviceId) : undefined,
        note: note || undefined,
      });
      navigation.goBack();
    } catch (e) {
      setError(e.response?.data?.message ?? t('workingHours.blockFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <DismissKeyboardView>
    <ScrollView style={s.wrap} contentContainerStyle={{ padding: spacing.md }} keyboardShouldPersistTaps="handled">
      <Text style={s.title}>{t('workingHours.blockTitle')}</Text>

      <View style={{ marginBottom: spacing.sm }}>
        <DateTimeField label={t('appointments.dateTime')} value={scheduledAt} onChange={setScheduledAt} />
      </View>

      <Field label={t('appointments.duration')}>
        <View style={s.pickerWrap}>
          <Picker selectedValue={durationMinutes} onValueChange={setDurationMinutes}>
            {DURATION_OPTIONS.map((m) => (
              <Picker.Item key={m} label={formatDuration(m)} value={m} />
            ))}
          </Picker>
        </View>
      </Field>

      <Field label={t('workingHours.blockScope')}>
        <View style={s.pickerWrap}>
          <Picker selectedValue={serviceId} onValueChange={setServiceId}>
            <Picker.Item label={t('workingHours.blockWholeSalon')} value="" />
            {services.map((sv) => (
              <Picker.Item key={sv.id} label={sv.name} value={String(sv.id)} />
            ))}
          </Picker>
        </View>
      </Field>

      <Field label={`${t('common.notes')} (${t('common.optional')})`}>
        <TextInput value={note} onChangeText={setNote} style={s.input} placeholder={t('workingHours.blockNotePlaceholder')} />
      </Field>

      {error ? <Text style={s.error}>{error}</Text> : null}

      <TouchableOpacity style={s.submitBtn} onPress={submit} disabled={saving} activeOpacity={0.85}>
        {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.submitBtnText}>{t('workingHours.blockSubmit')}</Text>}
      </TouchableOpacity>
    </ScrollView>
    </DismissKeyboardView>
  );
}

function Field({ label, children }) {
  return (
    <View style={{ marginBottom: spacing.sm }}>
      <Text style={s.label}>{label}</Text>
      {children}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.background },
  title: { fontSize: 18, fontWeight: '800', color: colors.dark, marginBottom: spacing.md },
  label: { fontSize: 12, fontWeight: '600', color: colors.dark, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.dark,
    backgroundColor: '#fff',
  },
  pickerWrap: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, backgroundColor: '#fff' },
  error: { color: '#dc2626', fontSize: 13, marginBottom: spacing.sm },
  submitBtn: { backgroundColor: colors.dark, borderRadius: radius.sm, paddingVertical: 14, alignItems: 'center', marginTop: spacing.sm, marginBottom: spacing.xl },
  submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
