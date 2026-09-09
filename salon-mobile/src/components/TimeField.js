import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import DateTimePicker from '@react-native-community/datetimepicker';
import { X } from 'lucide-react-native';
import { colors, radius, spacing } from '../theme';

const isIOS = Platform.OS === 'ios';

// Single time-only field (native picker), value/onChange work with "HH:MM"
// strings — see TimeField.web.js for the web counterpart (a plain HTML time input).
// iOS uses "spinner" display (opens on the first tap, no second tap on a
// compact pill) with an explicit Done button, since spinner mode has no
// built-in close gesture (Android's native dialog already closes itself).
function toDate(hhmm) {
  const d = new Date();
  if (hhmm) {
    const [h, m] = hhmm.split(':').map(Number);
    d.setHours(h, m, 0, 0);
  } else {
    d.setHours(9, 0, 0, 0);
  }
  return d;
}

function toHHMM(date) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export default function TimeField({ label, value, onChange, placeholder }) {
  const { t } = useTranslation();
  const [show, setShow] = useState(false);

  const handleChange = (event, selectedDate) => {
    if (!isIOS) setShow(false);
    if (event.type !== 'set' || !selectedDate) return;
    onChange(toHHMM(selectedDate));
  };

  return (
    <View>
      <Text style={s.label}>{label}</Text>
      <View style={s.row}>
        <TouchableOpacity style={[s.field, { flex: 1 }]} onPress={() => setShow(true)} activeOpacity={0.8}>
          <Text style={value ? s.text : s.placeholder}>{value || placeholder || '—'}</Text>
        </TouchableOpacity>
        {value ? (
          <TouchableOpacity onPress={() => onChange(null)} style={s.clearBtn} hitSlop={8}>
            <X size={16} color={colors.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>
      {show && (
        <View>
          <DateTimePicker value={toDate(value)} mode="time" is24Hour={false} display={isIOS ? 'spinner' : 'default'} onChange={handleChange} />
          {isIOS && (
            <TouchableOpacity style={s.doneBtn} onPress={() => setShow(false)} activeOpacity={0.8}>
              <Text style={s.doneBtnText}>{t('common.confirm')}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  label: { fontSize: 12, fontWeight: '600', color: colors.dark, marginBottom: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  field: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  text: { fontSize: 14, color: colors.dark },
  placeholder: { fontSize: 14, color: colors.textMuted },
  clearBtn: { padding: 6 },
  doneBtn: { alignSelf: 'flex-end', paddingVertical: 8, paddingHorizontal: spacing.md },
  doneBtnText: { color: colors.primary, fontSize: 15, fontWeight: '700' },
});
