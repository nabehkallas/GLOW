import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Scissors, Users, Image as ImageIcon, History, User, Settings, LogOut, ChevronRight } from 'lucide-react-native';
import useAuthStore from '../../stores/authStore';
import LanguageToggle from '../../components/LanguageToggle';
import { colors, radius, spacing } from '../../theme';

export default function MoreHomeScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const logout = useAuthStore((s) => s.logout);

  const items = [
    { key: 'services', icon: Scissors, label: t('nav.services'), screen: 'Services' },
    { key: 'clients', icon: Users, label: t('nav.clients'), screen: 'Clients' },
    { key: 'media', icon: ImageIcon, label: t('nav.media'), screen: 'Media' },
    { key: 'history', icon: History, label: t('nav.history'), screen: 'History' },
    { key: 'profile', icon: User, label: t('nav.profile'), screen: 'Profile' },
    { key: 'settings', icon: Settings, label: t('nav.settings'), screen: 'Settings' },
  ];

  const confirmLogout = () => {
    Alert.alert(t('common.logout'), t('common.logoutConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.logout'), style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <SafeAreaView edges={['top']} style={s.wrap}>
    <ScrollView contentContainerStyle={{ padding: spacing.md }}>
      <View style={s.headerRow}>
        <Text style={s.title}>{t('tabs.more')}</Text>
        <LanguageToggle />
      </View>

      <View style={s.grid}>
        {items.map(({ key, icon: Icon, label, screen }) => (
          <TouchableOpacity
            key={key}
            style={s.item}
            activeOpacity={0.8}
            onPress={() => navigation.navigate(screen ?? 'ComingSoon', screen ? undefined : { title: label })}
          >
            <View style={s.itemIcon}>
              <Icon size={22} color={colors.dark} />
            </View>
            <Text style={s.itemLabel}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={s.logoutRow} onPress={confirmLogout} activeOpacity={0.8}>
        <LogOut size={18} color="#dc2626" />
        <Text style={s.logoutText}>{t('common.logout')}</Text>
        <ChevronRight size={16} color="#dc2626" />
      </TouchableOpacity>
    </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.background },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg },
  title: { fontSize: 20, fontWeight: '800', color: colors.dark },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  item: {
    flexBasis: '47%',
    flexGrow: 1,
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.lg,
  },
  itemIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemLabel: { fontSize: 13, fontWeight: '600', color: colors.dark },
  logoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    backgroundColor: '#fef2f2',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#fecaca',
    padding: spacing.md,
  },
  logoutText: { flex: 1, fontSize: 14, fontWeight: '700', color: '#dc2626' },
});
