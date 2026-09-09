import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import useAuthStore from '../../stores/authStore';
import DismissKeyboardView from '../../components/DismissKeyboardView';
import LanguageToggle from '../../components/LanguageToggle';
import { colors, radius, spacing } from '../../theme';

const { height } = Dimensions.get('window');
const logo = require('../../../assets/logo.png');

export default function LoginScreen({ navigation }) {
  const { t } = useTranslation();
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email || !password) return;
    setError('');
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (e) {
      if (e.message === 'not_salon') setError(t('auth.salonOnly'));
      else if (e.response?.status === 422 || e.response?.status === 401) setError(t('auth.invalidCredentials'));
      else setError(e.response?.data?.message ?? t('auth.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <DismissKeyboardView>
      <ScrollView bounces={false} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
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
          <Text style={s.title}>{t('auth.signIn')}</Text>
          <Text style={s.subtitle}>{t('auth.salonPortal')}</Text>

          <TextInput
            style={s.input}
            placeholder={t('auth.email')}
            placeholderTextColor={colors.textMuted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={s.input}
            placeholder={t('auth.password')}
            placeholderTextColor={colors.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {error ? <Text style={s.error}>{error}</Text> : null}

          <TouchableOpacity style={[s.btn, loading && s.btnDisabled]} onPress={submit} disabled={loading} activeOpacity={0.85}>
            <Text style={s.btnText}>{loading ? t('auth.pleaseWait') : t('auth.signIn')}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Register')} style={s.footerLink} activeOpacity={0.7}>
            <Text style={s.footerLinkText}>
              {t('auth.noAccount')} <Text style={s.footerLinkAccent}>{t('auth.registerLink')}</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      </DismissKeyboardView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.dark },
  scrollContent: { flexGrow: 1 },
  top: { height: height * 0.38, backgroundColor: colors.dark },
  topSafe: { flex: 1 },
  langWrap: { alignItems: 'flex-start', paddingHorizontal: spacing.md, paddingTop: spacing.sm },
  logoWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  logo: { width: '100%', height: 390 },
  formWrap: {
    flex: 1,
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: spacing.lg,
    paddingTop: spacing.md,
    minHeight: height * 0.62,
  },
  title: { fontSize: 26, fontWeight: '800', color: colors.dark, marginBottom: 4 },
  subtitle: { fontSize: 14, color: colors.textMuted, marginBottom: spacing.lg },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.dark,
    marginBottom: spacing.sm,
  },
  error: { color: '#dc2626', fontSize: 13, marginBottom: spacing.sm },
  btn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  footerLink: { alignItems: 'center', marginTop: spacing.lg },
  footerLinkText: { fontSize: 13, color: colors.textMuted },
  footerLinkAccent: { color: colors.primary, fontWeight: '700' },
});
