import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, radius, shadow, spacing } from '../theme';

export default function Card({ children, style }) {
  return <View style={[s.card, style]}>{children}</View>;
}

const s = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...shadow,
  },
});
