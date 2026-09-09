import React, { useState } from 'react';
import { View, Text, Switch, ScrollView, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Wallet } from 'lucide-react-native';
import api from '../../api/client';
import Card from '../../components/Card';
import useAuthStore from '../../stores/authStore';
import { colors, radius, spacing } from '../../theme';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const { salon, updateSalon } = useAuthStore();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const toggleBalanceManagement = async () => {
    const next = !salon?.balance_management_enabled;
    setSaving(true);
    setError('');
    try {
      await api.patch('/salon/settings', { balance_management_enabled: next });
      updateSalon({ balance_management_enabled: next });
    } catch {
      setError(t('settings.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={s.wrap} contentContainerStyle={{ padding: spacing.md }}>
      <Card>
        <View style={s.row}>
          <View style={s.iconWrap}>
            <Wallet size={18} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.rowTitle}>{t('settings.balanceManagementTitle')}</Text>
            <Text style={s.rowDesc}>{t('settings.balanceManagementDescription')}</Text>
          </View>
          <Switch
            value={!!salon?.balance_management_enabled}
            onValueChange={toggleBalanceManagement}
            disabled={saving}
            trackColor={{ true: colors.primary, false: colors.border }}
          />
        </View>
        {error ? <Text style={s.error}>{error}</Text> : null}
      </Card>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.background },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: '#fff1eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: { fontSize: 14, fontWeight: '700', color: colors.dark },
  rowDesc: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  error: { color: '#dc2626', fontSize: 12, marginTop: spacing.sm },
});
