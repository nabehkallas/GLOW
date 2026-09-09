import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../theme';

function pad(n) {
  return String(n).padStart(2, '0');
}

function toInputValue(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export default function DateField({ label, value, onChange }) {
  const handleChange = (e) => {
    const v = e.target.value; // "YYYY-MM-DD"
    if (!v) return;
    const [y, m, d] = v.split('-').map(Number);
    onChange(new Date(y, m - 1, d));
  };

  return (
    <View>
      <Text style={s.label}>{label}</Text>
      <input
        type="date"
        value={value ? toInputValue(value) : ''}
        onChange={handleChange}
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
