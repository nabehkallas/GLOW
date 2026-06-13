import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert, Image, Dimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import useAuthStore from '../../stores/authStore';
import LanguageToggle from '../../components/LanguageToggle';
import { colors, spacing, radius } from '../../theme';

const { height } = Dimensions.get('window');
const logo = require('../../../assets/logo.png');

export default function RegisterScreen({ navigation }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [loading, setLoading] = useState(false);

  const set = (key) => (val) => setForm((f) => ({ ...f, [key]: val }));

  const handleRegister = async () => {
    const { name, email, phone, password } = form;
    if (!name || !email || !phone || !password) {
      const msg = t('common.error');
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('', msg);
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/register/client', { name, email, phone, password });
      const { token, user } = res.data;
      await AsyncStorage.setItem('token', token);
      useAuthStore.setState({ token, user });
    } catch (err) {
      const errors = err.response?.data?.errors;
      const msg = errors
        ? Object.values(errors).flat().join('\n')
        : (err.response?.data?.message ?? t('common.error'));
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('', msg);
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { key: 'name',     label: t('auth.name'),     keyboard: 'default',       auto: 'words' },
    { key: 'email',    label: t('auth.email'),    keyboard: 'email-address', auto: 'none' },
    { key: 'phone',    label: t('auth.phone'),    keyboard: 'phone-pad',     auto: 'none', placeholder: t('auth.phonePlaceholder') },
    { key: 'password', label: t('auth.password'), keyboard: 'default',       secure: true },
  ];

  return (
    <KeyboardAvoidingView
      style={s.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={s.top}>
          <SafeAreaView edges={['top']} style={s.topSafe}>
            <View style={s.langWrap}>
              <LanguageToggle />
            </View>
            <View style={s.logoWrap}>
              <Image source={logo} style={s.logo} resizeMode="contain" />
            </View>
          </SafeAreaView>
        </View>

        <View style={s.formWrap}>
          <View style={s.card}>
            <Text style={s.title}>{t('auth.register')}</Text>
            <Text style={s.subtitle}>{t('auth.startBooking')}</Text>

            {fields.map(({ key, label, keyboard, auto, secure, placeholder }) => (
              <TextInput
                key={key}
                style={s.input}
                placeholder={placeholder ?? label}
                placeholderTextColor={colors.textMuted}
                value={form[key]}
                onChangeText={set(key)}
                keyboardType={keyboard}
                autoCapitalize={auto ?? 'words'}
                secureTextEntry={!!secure}
                textAlign="right"
              />
            ))}

            <TouchableOpacity
              style={[s.btn, loading && s.btnDisabled]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.85}
            >
              <Text style={s.btnText}>{loading ? t('common.loading') : t('auth.register')}</Text>
            </TouchableOpacity>

            <View style={s.divider}>
              <View style={s.dividerLine} />
              <Text style={s.dividerText}>{t('auth.hasAccount')}</Text>
              <View style={s.dividerLine} />
            </View>

            <TouchableOpacity
              style={s.secondaryBtn}
              onPress={() => navigation.goBack()}
              activeOpacity={0.8}
            >
              <Text style={s.secondaryBtnText}>{t('auth.login')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.dark },

  scroll: { flexGrow: 1 },

  top: {
    height: height * 0.28,
    backgroundColor: colors.dark,
  },
  topSafe: { flex: 1 },
  langWrap: {
    alignItems: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  logoWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  logo: { width: '100%', height: 330 },

  formWrap: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    minHeight: height * 0.72,
    padding: spacing.lg,
  },
  card: { paddingTop: spacing.sm },
  title: { fontSize: 26, fontWeight: '800', color: colors.dark, textAlign: 'right', marginBottom: 4 },
  subtitle: { fontSize: 14, color: colors.textMuted, textAlign: 'right', marginBottom: spacing.lg },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: 14,
    fontSize: 15, color: colors.dark, marginBottom: spacing.sm,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  btn: {
    backgroundColor: colors.primary, borderRadius: radius.md,
    height: 54, justifyContent: 'center', alignItems: 'center', marginTop: spacing.sm,
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 8, elevation: 5,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: spacing.md, gap: spacing.sm },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { color: colors.textMuted, fontSize: 13 },
  secondaryBtn: {
    borderWidth: 1.5, borderColor: colors.dark, borderRadius: radius.md,
    height: 54, justifyContent: 'center', alignItems: 'center',
  },
  secondaryBtnText: { color: colors.dark, fontSize: 15, fontWeight: '700' },
});
