import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, spacing } from '../theme';

export default function ComingSoonScreen({ route }) {
  const { t } = useTranslation();
  const title = route?.params?.title;

  return (
    <View style={s.wrap}>
      {title ? <Text style={s.title}>{title}</Text> : null}
      <Text style={s.text}>{t('common.comingSoon')}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.dark,
    marginBottom: spacing.sm,
  },
  text: {
    fontSize: 14,
    color: colors.textMuted,
  },
});
