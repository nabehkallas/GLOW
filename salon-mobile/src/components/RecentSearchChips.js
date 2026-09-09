import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, radius, spacing } from '../theme';

export default function RecentSearchChips({ terms, onSelect }) {
  const { t } = useTranslation();
  if (!terms?.length) return null;

  return (
    <View style={s.wrap}>
      <Text style={s.label}>{t('common.recentSearches')}</Text>
      <View style={s.row}>
        {terms.map((term) => (
          <TouchableOpacity key={term} style={s.chip} onPress={() => onSelect(term)} activeOpacity={0.8}>
            <Text style={s.chipText}>{term}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { marginBottom: spacing.sm },
  label: { fontSize: 11, color: colors.textMuted, marginBottom: 6, paddingHorizontal: spacing.md },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, paddingHorizontal: spacing.md },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipText: { fontSize: 12, fontWeight: '600', color: colors.dark },
});
