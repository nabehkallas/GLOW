import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../theme';

// @react-native-community/datetimepicker has no working web implementation,
// so this .web.js file (picked up automatically by Metro's platform
// extension resolution for web builds) renders a real HTML date/time input
// instead — DateTimeField.js (this file's native counterpart) is used as-is
// on iOS/Android.
function pad(n) {
  return String(n).padStart(2, '0');
}

function toInputValue(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function DateTimeField({ label, value, onChange }) {
  const handleChange = (e) => {
    const v = e.target.value; // "YYYY-MM-DDTHH:mm"
    if (!v) return;
    const [datePart, timePart] = v.split('T');
    const [y, m, d] = datePart.split('-').map(Number);
    const [hh, mm] = timePart.split(':').map(Number);
    onChange(new Date(y, m - 1, d, hh, mm));
  };

  return (
    <View>
      <Text style={s.label}>{label}</Text>
      <input
        type="datetime-local"
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
