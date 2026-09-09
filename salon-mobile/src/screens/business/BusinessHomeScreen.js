import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BarChart3, Wallet, Star, ChevronRight } from 'lucide-react-native';
import useAuthStore from '../../stores/authStore';
import { colors, radius, spacing } from '../../theme';

export default function BusinessHomeScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { salon } = useAuthStore();

  const items = [
    { key: 'analytics', icon: BarChart3, label: t('nav.analytics'), screen: 'Analytics' },
    ...(salon?.balance_management_enabled ? [{ key: 'balance', icon: Wallet, label: t('nav.balance'), screen: 'Balance' }] : []),
    { key: 'reviews', icon: Star, label: t('nav.reviews'), screen: 'Reviews' },
  ];

  return (
    <SafeAreaView edges={['top']} style={s.wrap}>
    <ScrollView contentContainerStyle={{ padding: spacing.md }}>
      <Text style={s.title}>{t('tabs.business')}</Text>
      {items.map(({ key, icon: Icon, label, screen }) => (
        <TouchableOpacity
          key={key}
          style={s.item}
          activeOpacity={0.8}
          onPress={() => navigation.navigate(screen)}
        >
          <View style={s.itemIcon}>
            <Icon size={20} color={colors.primary} />
          </View>
          <Text style={s.itemLabel}>{label}</Text>
          <ChevronRight size={18} color={colors.textMuted} />
        </TouchableOpacity>
      ))}
    </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.background },
  title: { fontSize: 20, fontWeight: '800', color: colors.dark, marginBottom: spacing.md },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  itemIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: '#fff1eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.dark },
});
