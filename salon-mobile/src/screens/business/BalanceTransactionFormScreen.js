import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import api from '../../api/client';
import DateField from '../../components/DateField';
import DismissKeyboardView from '../../components/DismissKeyboardView';
import { colors, radius, spacing } from '../../theme';

const IN_CATS = ['product_sale', 'other'];
const OUT_CATS = ['salaries', 'maintenance', 'supplies', 'other'];

function pad(n) {
  return String(n).padStart(2, '0');
}
function toDateParam(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function BalanceTransactionFormScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [type, setType] = useState('in');
  const [category, setCategory] = useState(IN_CATS[0]);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date());
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const cats = type === 'in' ? IN_CATS : OUT_CATS;

  useEffect(() => {
    setCategory(cats[0]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  const submit = async () => {
    if (!amount || Number(amount) <= 0) {
      setError(t('balance.form.validationAmount'));
      return;
    }
    setSaving(true);
    setError('');
    try {
      await api.post('/salon/balance/transactions', {
        type,
        category,
        amount: Number(amount),
        date: toDateParam(date),
        comment: comment || undefined,
      });
      navigation.goBack();
    } catch (e) {
      setError(e.response?.data?.message ?? t('balance.form.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <DismissKeyboardView>
    <ScrollView style={s.wrap} contentContainerStyle={{ padding: spacing.md }} keyboardShouldPersistTaps="handled">
      <View style={s.typeRow}>
        {['in', 'out'].map((tp) => (
          <TouchableOpacity
            key={tp}
            style={[s.typeBtn, type === tp && (tp === 'in' ? s.typeBtnIn : s.typeBtnOut)]}
            onPress={() => setType(tp)}
            activeOpacity={0.85}
          >
            <Text style={[s.typeBtnText, type === tp && (tp === 'in' ? s.typeTextIn : s.typeTextOut)]}>
              {tp === 'in' ? t('balance.form.income') : t('balance.form.expense')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Field label={t('balance.form.category')}>
        <View style={s.pickerRow}>
          {cats.map((c) => (
            <TouchableOpacity key={c} onPress={() => setCategory(c)} style={[s.catChip, category === c && s.catChipActive]}>
              <Text style={[s.catChipText, category === c && s.catChipTextActive]}>{t(`balance.categories.${c}`)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Field>

      <Field label={t('balance.form.amount')}>
        <TextInput value={amount} onChangeText={setAmount} keyboardType="decimal-pad" style={s.input} placeholder="0" />
      </Field>

      <Field label={t('balance.form.date')}>
        <DateField value={date} onChange={setDate} />
      </Field>

      <Field label={`${t('balance.form.comment')} (${t('common.optional')})`}>
        <TextInput
          value={comment}
          onChangeText={setComment}
          style={[s.input, { height: 70 }]}
          multiline
          textAlignVertical="top"
          placeholder={t('balance.form.commentPlaceholder')}
        />
      </Field>

      {error ? <Text style={s.error}>{error}</Text> : null}

      <TouchableOpacity style={s.saveBtn} onPress={submit} disabled={saving} activeOpacity={0.85}>
        {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.saveBtnText}>{t('common.save')}</Text>}
      </TouchableOpacity>
    </ScrollView>
    </DismissKeyboardView>
  );
}

function Field({ label, children }) {
  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={s.label}>{label}</Text>
      {children}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.background },
  typeRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  typeBtn: { flex: 1, paddingVertical: 12, borderRadius: radius.md, borderWidth: 2, borderColor: colors.border, alignItems: 'center' },
  typeBtnIn: { borderColor: colors.green, backgroundColor: '#f0fdf4' },
  typeBtnOut: { borderColor: '#dc2626', backgroundColor: '#fef2f2' },
  typeBtnText: { fontSize: 14, fontWeight: '700', color: colors.textMuted },
  typeTextIn: { color: colors.green },
  typeTextOut: { color: '#dc2626' },
  label: { fontSize: 12, fontWeight: '600', color: colors.dark, marginBottom: spacing.xs },
  pickerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  catChip: { paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border, backgroundColor: '#fff' },
  catChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  catChipText: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  catChipTextActive: { color: '#fff' },
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
  error: { color: '#dc2626', fontSize: 13, marginBottom: spacing.sm },
  saveBtn: { backgroundColor: colors.primary, borderRadius: radius.sm, paddingVertical: 14, alignItems: 'center', marginTop: spacing.xs, marginBottom: spacing.xl },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
