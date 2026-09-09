import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius } from '../theme';

export default function TimeField({ label, value, onChange }) {
  return (
    <View>
      <Text style={s.label}>{label}</Text>
      <input
        type="time"
        value={value || ''}
        onChange={(e) => onChange(e.target.value || null)}
        style={{
          border: `1px solid ${colors.border}`,
          borderRadius: radius.sm,
          padding: 12,
          fontSize: 14,
          color: colors.dark,
          backgroundColor: '#fff',
          width: '100%',
          boxSizing: 'border-box',
          fontFamily: 'inherit',
        }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  label: { fontSize: 12, fontWeight: '600', color: colors.dark, marginBottom: 4 },
});
