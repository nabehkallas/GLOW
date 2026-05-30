import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import api from '../../api/client';
import useAuthStore from '../../stores/authStore';
import { colors, spacing, radius, shadow } from '../../theme';

export default function EditProfileScreen({ navigation }) {
  const { t } = useTranslation();
  const { user, setUser } = useAuthStore();
  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await api.put('/client/profile', { name: name.trim(), phone: phone.trim() });
      setUser(res.data.data ?? res.data);
      Alert.alert('', 'تم الحفظ بنجاح', [{ text: t('common.confirm'), onPress: () => navigation.goBack() }]);
    } catch (err) {
      const errors = err.response?.data?.errors;
      const msg = errors ? Object.values(errors).flat().join('\n') : (err.response?.data?.message ?? t('common.error'));
      Alert.alert('', msg);
    } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={s.root} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        <View style={s.card}>
          <Text style={s.label}>{t('profile.name')}</Text>
          <TextInput style={s.input} value={name} onChangeText={setName} textAlign="right" />

          <Text style={s.label}>{t('profile.phone')}</Text>
          <TextInput
            style={s.input} value={phone} onChangeText={setPhone}
            keyboardType="phone-pad" textAlign="right"
            placeholder={t('auth.phonePlaceholder')} placeholderTextColor={colors.textMuted}
          />
        </View>

        <TouchableOpacity
          style={[s.btn, loading && s.btnDisabled]}
          onPress={handleSave}
          disabled={loading}
          activeOpacity={0.8}
        >
          <Text style={s.btnText}>{loading ? t('common.loading') : t('profile.saveChanges')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md },
  card: { backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md, ...shadow, marginBottom: spacing.md },
  label: { fontSize: 13, color: colors.textMuted, textAlign: 'right', marginBottom: 6, marginTop: spacing.sm },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm,
    paddingHorizontal: spacing.md, paddingVertical: 12, fontSize: 15, color: colors.dark,
  },
  btn: {
    backgroundColor: colors.primary, borderRadius: radius.sm, height: 52,
    justifyContent: 'center', alignItems: 'center',
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
