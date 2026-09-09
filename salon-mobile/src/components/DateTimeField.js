import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors, radius, spacing } from '../theme';

const isIOS = Platform.OS === 'ios';

// Two independent fields (date, time), each opening its own single native
// dialog on tap — deliberately not chained (picking a date auto-opening the
// time picker was unreliable on Android), so there's no sequencing to get
// wrong. `value`/`onChange` still deal in a single combined Date, matching
// the same external contract as before.
//
// iOS uses the "spinner" display so the wheel appears directly on the first
// tap (the default "compact" display needs a second tap on a little pill to
// actually open it). Spinner mode has no built-in close gesture and fires
// onChange continuously while scrolling, so it needs an explicit Done button
// and must not auto-close on every tick — Android's native dialog already
// closes itself, so that behavior is left untouched.
export default function DateTimeField({ label, value, onChange }) {
  const { t } = useTranslation();
  const [showDate, setShowDate] = useState(false);
  const [showTime, setShowTime] = useState(false);
  const current = value ?? new Date();

  const handleDateChange = (event, selectedDate) => {
    if (!isIOS) setShowDate(false);
    if (event.type !== 'set' || !selectedDate) return;
    const combined = new Date(current);
    combined.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
    onChange(combined);
  };

  const handleTimeChange = (event, selectedTime) => {
    if (!isIOS) setShowTime(false);
    if (event.type !== 'set' || !selectedTime) return;
    const combined = new Date(current);
    combined.setHours(selectedTime.getHours(), selectedTime.getMinutes(), 0, 0);
    onChange(combined);
  };

  return (
    <View>
      <Text style={s.label}>{label}</Text>
      <View style={s.row}>
        <TouchableOpacity style={[s.field, { flex: 1 }]} onPress={() => setShowDate(true)} activeOpacity={0.8}>
          <Text style={s.text}>{current.toLocaleDateString()}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.field, { flex: 1 }]} onPress={() => setShowTime(true)} activeOpacity={0.8}>
          <Text style={s.text}>{current.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
        </TouchableOpacity>
      </View>

      {showDate && (
        <View>
          <DateTimePicker value={current} mode="date" display={isIOS ? 'spinner' : 'default'} onChange={handleDateChange} />
          {isIOS && (
            <TouchableOpacity style={s.doneBtn} onPress={() => setShowDate(false)} activeOpacity={0.8}>
              <Text style={s.doneBtnText}>{t('common.confirm')}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
      {showTime && (
        <View>
          <DateTimePicker value={current} mode="time" is24Hour={false} display={isIOS ? 'spinner' : 'default'} onChange={handleTimeChange} />
          {isIOS && (
            <TouchableOpacity style={s.doneBtn} onPress={() => setShowTime(false)} activeOpacity={0.8}>
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
  row: { flexDirection: 'row', gap: spacing.sm },
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
