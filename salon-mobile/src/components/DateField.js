import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors, radius, spacing } from '../theme';

const isIOS = Platform.OS === 'ios';

// Single date-only field (native picker) — see DateField.web.js for the web
// counterpart (a plain HTML date input, picked up automatically by Metro).
// iOS uses "spinner" display so the wheel opens on the first tap instead of
// needing a second tap on the default "compact" pill; spinner mode has no
// built-in close gesture, so it gets an explicit Done button (Android's
// native dialog already closes itself and is left untouched).
export default function DateField({ label, value, onChange }) {
  const { t } = useTranslation();
  const [show, setShow] = useState(false);
  const current = value ?? new Date();

  const handleChange = (event, selectedDate) => {
    if (!isIOS) setShow(false);
    if (event.type !== 'set' || !selectedDate) return;
    onChange(selectedDate);
  };

  return (
    <View>
      <Text style={s.label}>{label}</Text>
      <TouchableOpacity style={s.field} onPress={() => setShow(true)} activeOpacity={0.8}>
        <Text style={s.text}>{current.toLocaleDateString()}</Text>
      </TouchableOpacity>
      {show && (
        <View>
          <DateTimePicker value={current} mode="date" display={isIOS ? 'spinner' : 'default'} onChange={handleChange} />
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
  field: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  text: { fontSize: 14, color: colors.dark },
  doneBtn: { alignSelf: 'flex-end', paddingVertical: 8, paddingHorizontal: spacing.md },
  doneBtnText: { color: colors.primary, fontSize: 15, fontWeight: '700' },
});
