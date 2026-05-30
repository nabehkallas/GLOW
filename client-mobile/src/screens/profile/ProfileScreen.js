import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Image, Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../api/client';
import useAuthStore from '../../stores/authStore';
import LanguageToggle from '../../components/LanguageToggle';
import { colors, spacing, radius } from '../../theme';

const logo = require('../../../assets/logo.png');

const NAV_ITEMS = [
  { key: 'editProfile',    icon: '✏️',  screen: 'EditProfile' },
  { key: 'myReviews',      icon: '⭐',  screen: 'MyReviews' },
  { key: 'notifications',  icon: '🔔',  screen: 'NotificationsModal', titleKey: 'notifications.title' },
];

export default function ProfileScreen({ navigation }) {
  const { t } = useTranslation();
  const { user, logout } = useAuthStore();
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    api.get('/client/analytics')
      .then((res) => setAnalytics(res.data.data ?? res.data))
      .catch(() => {});
  }, []);

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      if (window.confirm(t('auth.logout') + '?')) logout();
    } else {
      Alert.alert('', 'هل تريد تسجيل الخروج؟', [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('auth.logout'), style: 'destructive', onPress: logout },
      ]);
    }
  };

  const initial = user?.name?.charAt(0)?.toUpperCase() ?? '?';

  return (
    <View style={s.root}>
      <StatusBar style="light" />

      {/* Dark header */}
      <SafeAreaView style={s.header} edges={['top']}>
        {/* Centered logo + title */}
        <View style={s.headerTop}>
          <View style={s.headerInner}>
            <Image source={logo} style={s.headerLogo} resizeMode="contain" />
          </View>
          <Text style={s.headerTitle}>{t('profile.title')}</Text>
        </View>

        {/* Avatar + user info — centered */}
        <View style={s.userRow}>
          <View style={s.userInfo}>
            <Text style={s.userName}>{user?.name}</Text>
            <Text style={s.userEmail}>{user?.email}</Text>
          </View>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{initial}</Text>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Stats */}
        <View style={s.statsRow}>
          <View style={s.stat}>
            <Text style={s.statValue}>{analytics?.total_appointments ?? '—'}</Text>
            <Text style={s.statLabel}>{t('profile.totalAppointments')}</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.stat}>
            <Text style={s.statValue}>
              {analytics?.total_spent ? analytics.total_spent : '—'}
            </Text>
            <Text style={s.statLabel}>
              {analytics?.total_spent ? 'ل.س ' + t('profile.totalSpent') : t('profile.totalSpent')}
            </Text>
          </View>
        </View>

        {/* Nav */}
        <View style={s.navCard}>
          {NAV_ITEMS.map(({ key, icon, screen, titleKey }, i) => (
            <TouchableOpacity
              key={key}
              style={s.navRow}
              onPress={() => navigation.navigate(screen)}
              activeOpacity={0.7}
            >
              <Text style={s.chevron}>›</Text>
              <Text style={s.navLabel}>{t(titleKey ?? `profile.${key}`)}</Text>
              <View style={s.navIcon}>
                <Text style={{ fontSize: 18 }}>{icon}</Text>
              </View>
            </TouchableOpacity>
          ))}

          {/* Language toggle */}
          <View style={s.langRow}>
            <LanguageToggle />
            <Text style={s.navLabel}>اللغة / Language</Text>
            <View style={s.navIcon}>
              <Text style={{ fontSize: 18 }}>🌐</Text>
            </View>
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Text style={s.logoutText}>{t('auth.logout')}</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },

  header: { backgroundColor: colors.dark, paddingBottom: spacing.md, alignItems: 'center' },
  headerTop: { alignItems: 'center', marginBottom: spacing.sm, width: '100%' },
  headerInner: { height: 70, overflow: 'hidden', width: '100%', alignItems: 'center', justifyContent: 'center' },
  headerLogo: { width: '100%', height: 210 },
  headerTitle: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.6)', letterSpacing: 0.5 },

  userRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: colors.primary,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.25)',
  },
  avatarText: { color: '#fff', fontSize: 24, fontWeight: '800' },
  userInfo: { flex: 1 },
  userName: { fontSize: 18, fontWeight: '700', color: '#fff', textAlign: 'right' },
  userEmail: { fontSize: 13, color: 'rgba(255,255,255,0.6)', textAlign: 'right', marginTop: 2 },

  scroll: { padding: spacing.md },

  statsRow: {
    flexDirection: 'row', backgroundColor: '#fff',
    borderRadius: radius.md, padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  stat: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: colors.border, marginVertical: 4 },
  statValue: { fontSize: 24, fontWeight: '900', color: colors.primary },
  statLabel: { fontSize: 11, color: colors.textMuted, marginTop: 4, textAlign: 'center' },

  navCard: {
    backgroundColor: '#fff', borderRadius: radius.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
    marginBottom: spacing.md,
  },
  navRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingVertical: 16,
    borderBottomWidth: 1, borderColor: colors.border,
  },
  langRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingVertical: 12,
  },
  navIcon: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: colors.background,
    justifyContent: 'center', alignItems: 'center',
  },
  navLabel: { flex: 1, fontSize: 15, color: colors.dark, fontWeight: '500', textAlign: 'right', marginHorizontal: spacing.sm },
  chevron: { fontSize: 22, color: colors.textMuted },

  logoutBtn: {
    height: 52, borderRadius: radius.md,
    borderWidth: 1.5, borderColor: '#ef4444',
    justifyContent: 'center', alignItems: 'center',
  },
  logoutText: { color: '#ef4444', fontWeight: '700', fontSize: 15 },
});
