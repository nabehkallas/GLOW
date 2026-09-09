import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute } from '@react-navigation/native';
import api from '../../api/client';
import DismissKeyboardView from '../../components/DismissKeyboardView';
import TimeField from '../../components/TimeField';
import { colors, radius, spacing } from '../../theme';

export default function ServiceFormScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const editing = route.params?.service ?? null;

  const [name, setName] = useState(editing?.name ?? '');
  const [category, setCategory] = useState(editing?.category ?? '');
  const [price, setPrice] = useState(editing ? String(editing.price) : '');
  const [durationMinutes, setDurationMinutes] = useState(editing ? String(editing.duration_minutes) : '');
  const [availableFrom, setAvailableFrom] = useState(editing?.available_from ?? null);
  const [availableUntil, setAvailableUntil] = useState(editing?.available_until ?? null);
  const [description, setDescription] = useState(editing?.description ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!name || !price || !durationMinutes) {
      setError(t('common.somethingWrong'));
      return;
    }
    setSaving(true);
    setError('');
    const payload = {
      name,
      category: category || null,
      price: Number(price),
      duration_minutes: Number(durationMinutes),
      available_from: availableFrom || null,
      available_until: availableUntil || null,
      description: description || null,
    };
    try {
      if (editing) await api.put(`/salon/services/${editing.id}`, payload);
      else await api.post('/salon/services', payload);
      navigation.goBack();
    } catch (e) {
      setError(e.response?.data?.message ?? t('common.somethingWrong'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <DismissKeyboardView>
    <ScrollView style={s.wrap} contentContainerStyle={{ padding: spacing.md }} keyboardShouldPersistTaps="handled">
      <Text style={s.title}>{editing ? t('services.editService') : t('services.newService')}</Text>

      <Field label={t('common.name')}>
        <TextInput value={name} onChangeText={setName} style={s.input} />
      </Field>

      <Field label={t('common.category')}>
        <TextInput value={category} onChangeText={setCategory} style={s.input} placeholder={t('services.categoryPlaceholder')} />
      </Field>

      <Field label={t('services.priceDollar')}>
        <TextInput value={price} onChangeText={setPrice} keyboardType="decimal-pad" style={s.input} />
      </Field>

      <Field label={t('services.durationMinutes')}>
        <TextInput value={durationMinutes} onChangeText={setDurationMinutes} keyboardType="number-pad" style={s.input} />
      </Field>

      <View style={s.timeRow}>
        <View style={{ flex: 1 }}>
          <TimeField label={t('services.availableFrom')} value={availableFrom} onChange={setAvailableFrom} />
        </View>
        <View style={{ flex: 1 }}>
          <TimeField label={t('services.availableUntil')} value={availableUntil} onChange={setAvailableUntil} />
        </View>
      </View>
      <Text style={s.hint}>{t('services.availableFromHint')}</Text>

      <Field label={t('common.description')}>
        <TextInput
          value={description}
          onChangeText={setDescription}
          style={[s.input, { height: 80 }]}
          multiline
          textAlignVertical="top"
        />
      </Field>

      {error ? <Text style={s.error}>{error}</Text> : null}

      <TouchableOpacity style={s.submitBtn} onPress={submit} disabled={saving} activeOpacity={0.85}>
        {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.submitBtnText}>{t('common.save')}</Text>}
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
  timeRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: 4 },
  hint: { fontSize: 11, color: colors.textMuted, marginBottom: spacing.sm },
  error: { color: '#dc2626', fontSize: 13, marginBottom: spacing.sm },
  submitBtn: { backgroundColor: colors.primary, borderRadius: radius.sm, paddingVertical: 14, alignItems: 'center', marginTop: spacing.sm, marginBottom: spacing.xl },
  submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
