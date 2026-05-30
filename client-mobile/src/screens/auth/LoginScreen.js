import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert, Image, Dimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import useAuthStore from '../../stores/authStore';
import LanguageToggle from '../../components/LanguageToggle';
import { colors, spacing, radius } from '../../theme';

const { height } = Dimensions.get('window');
const logo = require('../../../assets/logo.png');

export default function LoginScreen({ navigation }) {
  const { t } = useTranslation();
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return;
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      const msg = err.message === 'not_client'
        ? t('auth.loginError')
        : t('auth.loginError');
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={s.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="light" />

      <ScrollView
        bounces={false}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
      >
        {/* Dark top — logo + language toggle */}
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

        {/* White form card */}
        <View style={s.formWrap}>
          <Text style={s.title}>{t('auth.login')}</Text>
          <Text style={s.subtitle}>{t('auth.welcomeBack')}</Text>

          <TextInput
            style={s.input}
            placeholder={t('auth.email')}
            placeholderTextColor={colors.textMuted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            textAlign="right"
          />

          <TextInput
            style={s.input}
            placeholder={t('auth.password')}
            placeholderTextColor={colors.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            textAlign="right"
          />

          <TouchableOpacity
            style={[s.btn, loading && s.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Text style={s.btnText}>{loading ? t('common.loading') : t('auth.login')}</Text>
          </TouchableOpacity>

          <View style={s.divider}>
            <View style={s.dividerLine} />
            <Text style={s.dividerText}>{t('auth.or')}</Text>
            <View style={s.dividerLine} />
          </View>

          <TouchableOpacity
            style={s.secondaryBtn}
            onPress={() => navigation.navigate('Register')}
            activeOpacity={0.8}
          >
            <Text style={s.secondaryBtnText}>{t('auth.register')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.dark },

  scrollContent: { flexGrow: 1 },

  top: {
    height: height * 0.38,
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
  title: {
    fontSize: 26, fontWeight: '800', color: colors.dark,
    textAlign: 'right', marginBottom: 4,
  },
  subtitle: {
    fontSize: 14, color: colors.textMuted,
    textAlign: 'right', marginBottom: spacing.lg,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1.5, borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: 14,
    fontSize: 15, color: colors.dark,
    marginBottom: spacing.sm,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  btn: {
    backgroundColor: colors.primary, borderRadius: radius.md,
    height: 54, justifyContent: 'center', alignItems: 'center',
    marginTop: spacing.sm,
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 8, elevation: 5,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
  divider: {
    flexDirection: 'row', alignItems: 'center',
    marginVertical: spacing.md, gap: spacing.sm,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { color: colors.textMuted, fontSize: 13 },
  secondaryBtn: {
    borderWidth: 1.5, borderColor: colors.dark, borderRadius: radius.md,
    height: 54, justifyContent: 'center', alignItems: 'center',
  },
  secondaryBtnText: { color: colors.dark, fontSize: 15, fontWeight: '700' },
});
