import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import api from '../../api/client';
import { colors, spacing, radius, shadow } from '../../theme';

function Row({ label, value }) {
  return (
    <View style={s.row}>
      <Text style={s.rowValue}>{value}</Text>
      <Text style={s.rowLabel}>{label}</Text>
    </View>
  );
}

export default function BookingConfirmScreen({ route, navigation }) {
  const { t } = useTranslation();
  const { salonId, service, date, slot } = route.params;
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await api.post('/client/appointments', {
        salon_service_id: service.id,
        scheduled_at: `${date} ${slot.time}`,
        notes: notes.trim() || null,
      });
      Alert.alert(t('booking.success'), t('booking.successMsg'), [
        { text: t('common.confirm'), onPress: () => navigation.navigate('Appointments') },
      ]);
    } catch (err) {
      const msg = err.response?.data?.message ?? t('common.error');
      Alert.alert('', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={s.root} contentContainerStyle={s.content}>
      <Text style={s.title}>{t('booking.title')}</Text>

      <View style={s.card}>
        <Row label={t('booking.service')} value={service.name} />
        <Row label={t('booking.date')} value={date} />
        <Row label={t('booking.time')} value={slot.time} />
        <Row label={t('booking.duration')} value={`${service.duration_minutes} دقيقة`} />
        <Row label={t('booking.price')} value={`${service.price} ل.س`} />
      </View>

      <TextInput
        style={s.notes}
        placeholder={t('booking.notesPlaceholder')}
        placeholderTextColor={colors.textMuted}
        value={notes}
        onChangeText={setNotes}
        multiline
        numberOfLines={3}
        textAlign="right"
        textAlignVertical="top"
      />

      <TouchableOpacity
        style={[s.btn, loading && s.btnDisabled]}
        onPress={handleConfirm}
        disabled={loading}
        activeOpacity={0.8}
      >
        <Text style={s.btnText}>{loading ? t('common.loading') : t('booking.confirm')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md },
  title: { fontSize: 20, fontWeight: '800', color: colors.dark, textAlign: 'right', marginBottom: spacing.md },
  card: { backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md, ...shadow, marginBottom: spacing.md },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderColor: colors.border,
  },
  rowLabel: { fontSize: 14, color: colors.textMuted },
  rowValue: { fontSize: 14, fontWeight: '600', color: colors.dark },
  notes: {
    backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md,
    minHeight: 90, fontSize: 14, color: colors.dark, ...shadow, marginBottom: spacing.md,
  },
  btn: {
    backgroundColor: colors.primary, borderRadius: radius.sm, height: 52,
    justifyContent: 'center', alignItems: 'center',
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
