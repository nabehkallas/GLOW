import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { radius } from '../theme';

const STATUS_COLORS = {
  pending: { bg: '#fff3e0', fg: '#c2410c' },
  confirmed: { bg: '#dbeafe', fg: '#1d4ed8' },
  completed: { bg: '#dcfce7', fg: '#15803d' },
  delivered: { bg: '#dcfce7', fg: '#15803d' },
  shipped: { bg: '#f3e8ff', fg: '#7e22ce' },
  cancelled: { bg: '#fee2e2', fg: '#b91c1c' },
  failed: { bg: '#e2e8f0', fg: '#334155' },
  returned: { bg: '#fef3c7', fg: '#92400e' },
  cancellation_requested: { bg: '#ffe0d1', fg: '#c2410c' },
  return_requested: { bg: '#fef3c7', fg: '#92400e' },
};

export default function StatusBadge({ status }) {
  const { t } = useTranslation();
  const c = STATUS_COLORS[status] ?? { bg: '#f1f5f9', fg: '#475569' };

  return (
    <View style={[s.badge, { backgroundColor: c.bg }]}>
      <Text style={[s.text, { color: c.fg }]}>{t('status.' + status, { defaultValue: status })}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
  },
});
