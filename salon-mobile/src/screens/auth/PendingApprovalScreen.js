import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import useAuthStore from '../../stores/authStore';
import { colors, radius, spacing } from '../../theme';

// Mirrors salon-web's ProtectedRoute: a newly-registered salon is 'pending'
// until an admin approves it, or 'rejected' if they don't. Nothing in
// MainTabs is safe to show until then, so this screen fully replaces it.
export default function PendingApprovalScreen() {
  const { t } = useTranslation();
  const { salon, logout } = useAuthStore();
  const rejected = salon?.status === 'rejected';

  return (
    <SafeAreaView style={s.wrap}>
      <View style={s.content}>
        <Text style={[s.title, rejected && s.titleRejected]}>
          {rejected ? t('protected.rejectedTitle') : t('protected.awaitingTitle')}
        </Text>
        <Text style={s.message}>
          {rejected ? (salon?.rejection_reason ?? t('protected.contactSupport')) : t('protected.awaitingMessage')}
        </Text>
        <TouchableOpacity style={s.button} onPress={logout} activeOpacity={0.85}>
          <Text style={s.buttonText}>{t('common.logout')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  title: { fontSize: 20, fontWeight: '800', color: '#b45309', marginBottom: spacing.sm, textAlign: 'center' },
  titleRejected: { color: '#dc2626' },
  message: { fontSize: 14, color: colors.textMuted, textAlign: 'center', marginBottom: spacing.xl },
  button: { backgroundColor: colors.primary, borderRadius: radius.sm, paddingVertical: 12, paddingHorizontal: spacing.xl },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
