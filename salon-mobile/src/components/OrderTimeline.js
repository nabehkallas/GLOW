import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '../theme';

const STEPS = ['pending', 'confirmed', 'shipped', 'delivered'];

export default function OrderTimeline({ status }) {
  const { t } = useTranslation();

  if (status === 'cancelled' || status === 'failed' || status === 'returned') {
    return (
      <Text style={[s.terminal, { color: status === 'returned' ? '#b45309' : '#dc2626' }]}>
        {t('status.' + status)}
      </Text>
    );
  }

  const activeIndex = STEPS.indexOf(status);

  return (
    <View style={s.row}>
      {STEPS.map((step, i) => {
        const done = i <= activeIndex;
        return (
          <View key={step} style={s.step}>
            <View style={s.lineRow}>
              <View style={[s.line, i === 0 && s.lineHidden, done && s.lineDone]} />
              <View style={[s.dot, done && s.dotDone]} />
              <View style={[s.line, i === STEPS.length - 1 && s.lineHidden, i < activeIndex && s.lineDone]} />
            </View>
            <Text style={[s.label, done && s.labelDone]}>{t('status.' + step)}</Text>
          </View>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  terminal: { fontSize: 12, fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  step: { flex: 1, alignItems: 'center' },
  lineRow: { flexDirection: 'row', alignItems: 'center', width: '100%' },
  line: { flex: 1, height: 2, backgroundColor: colors.border },
  lineHidden: { opacity: 0 },
  lineDone: { backgroundColor: colors.green },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.border },
  dotDone: { backgroundColor: colors.green },
  label: { fontSize: 10, color: colors.textMuted, marginTop: 4, textAlign: 'center' },
  labelDone: { color: colors.dark, fontWeight: '700' },
});
