import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TextInput, Switch, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Plus } from 'lucide-react-native';
import api from '../../api/client';
import Card from '../../components/Card';
import DismissKeyboardView from '../../components/DismissKeyboardView';
import { colors, radius, spacing } from '../../theme';

const defaultSchedule = Array.from({ length: 7 }, (_, i) => ({
  day_of_week: i,
  is_closed: i === 0 || i === 6,
  open_time: '09:00',
  close_time: '18:00',
}));

export default function WorkingHoursScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [schedule, setSchedule] = useState(defaultSchedule);
  const [blocks, setBlocks] = useState([]);
  const [loadingBlocks, setLoadingBlocks] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.get('/salon/working-hours').then(({ data }) => {
      if (data.length > 0) {
        setSchedule(defaultSchedule.map((d) => data.find((r) => r.day_of_week === d.day_of_week) ?? d));
      }
    });
  }, []);

  const loadBlocks = useCallback(() => {
    setLoadingBlocks(true);
    return api
      .get('/salon/schedule-blocks')
      .then(({ data }) => setBlocks(data.data ?? data))
      .finally(() => setLoadingBlocks(false));
  }, []);

  // Refresh the blocks list whenever this screen regains focus (e.g. after
  // creating a new block via the modal form).
  useFocusEffect(
    useCallback(() => {
      loadBlocks();
    }, [loadBlocks])
  );

  const update = (idx, field, value) => {
    setSchedule((prev) => prev.map((d, i) => (i === idx ? { ...d, [field]: value } : d)));
  };

  const save = async () => {
    setSaving(true);
    setMessage('');
    try {
      await api.post('/salon/working-hours', { schedule });
      setMessage(t('workingHours.savedOk'));
    } catch {
      setMessage(t('workingHours.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const removeBlock = (block) => {
    Alert.alert(t('common.delete'), '', [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          await api.delete(`/salon/schedule-blocks/${block.id}`);
          loadBlocks();
        },
      },
    ]);
  };

  return (
    <DismissKeyboardView>
    <ScrollView style={s.wrap} contentContainerStyle={{ padding: spacing.md }} keyboardShouldPersistTaps="handled">
      <Text style={s.title}>{t('workingHours.title')}</Text>

      <Card style={{ marginBottom: spacing.md, padding: 0 }}>
        {schedule.map((day, i) => (
          <View key={i} style={[s.dayRow, i > 0 && s.dayRowBorder]}>
            <View style={s.dayHeader}>
              <Text style={s.dayName}>{t(`days.${day.day_of_week}`)}</Text>
              <View style={s.closedRow}>
                <Text style={s.closedLabel}>{t('workingHours.closed')}</Text>
                <Switch
                  value={day.is_closed}
                  onValueChange={(v) => update(i, 'is_closed', v)}
                  trackColor={{ true: colors.green, false: colors.border }}
                />
              </View>
            </View>
            {!day.is_closed && (
              <View style={s.timeRow}>
                <TextInput
                  value={day.open_time}
                  onChangeText={(v) => update(i, 'open_time', v)}
                  placeholder="09:00"
                  style={s.timeInput}
                />
                <Text style={s.toText}>{t('workingHours.to')}</Text>
                <TextInput
                  value={day.close_time}
                  onChangeText={(v) => update(i, 'close_time', v)}
                  placeholder="18:00"
                  style={s.timeInput}
                />
              </View>
            )}
          </View>
        ))}
      </Card>

      <View style={s.saveRow}>
        <TouchableOpacity style={s.saveBtn} onPress={save} disabled={saving} activeOpacity={0.85}>
          {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.saveBtnText}>{t('workingHours.saveSchedule')}</Text>}
        </TouchableOpacity>
        {message ? <Text style={s.message}>{message}</Text> : null}
      </View>

      <View style={s.blocksHeader}>
        <Text style={[s.title, { fontSize: 16, marginBottom: 0 }]}>{t('workingHours.blockedTimes')}</Text>
        <TouchableOpacity onPress={() => navigation.navigate('BlockForm')} style={s.addBtn} activeOpacity={0.8}>
          <Plus size={16} color="#fff" />
        </TouchableOpacity>
      </View>
      {loadingBlocks ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.md }} />
      ) : blocks.length === 0 ? (
        <Text style={s.empty}>{t('workingHours.noBlocks')}</Text>
      ) : (
        blocks.map((b) => (
          <Card key={b.id} style={{ marginTop: spacing.sm }}>
            <View style={s.blockRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.rowTitle}>{new Date(b.starts_at.replace(' ', 'T')).toLocaleString()}</Text>
                <Text style={s.rowSubtitle}>
                  {b.duration_minutes} min{b.service?.name ? ` · ${b.service.name}` : ''}
                </Text>
                {b.note ? <Text style={s.rowSubtitle}>{b.note}</Text> : null}
              </View>
              <TouchableOpacity onPress={() => removeBlock(b)}>
                <Text style={s.removeText}>{t('common.delete')}</Text>
              </TouchableOpacity>
            </View>
          </Card>
        ))
      )}
    </ScrollView>
    </DismissKeyboardView>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.background },
  title: { fontSize: 20, fontWeight: '800', color: colors.dark, marginBottom: spacing.md },
  dayRow: { padding: spacing.md },
  dayRowBorder: { borderTopWidth: 1, borderTopColor: colors.border },
  dayHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dayName: { fontSize: 14, fontWeight: '700', color: colors.dark },
  closedRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  closedLabel: { fontSize: 13, color: colors.textMuted },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  timeInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    fontSize: 13,
    color: colors.dark,
    backgroundColor: '#fff',
    minWidth: 70,
    textAlign: 'center',
  },
  toText: { fontSize: 13, color: colors.textMuted },
  blocksHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  addBtn: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  saveBtn: { backgroundColor: colors.primary, borderRadius: radius.sm, paddingVertical: 12, paddingHorizontal: spacing.lg },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  message: { fontSize: 13, color: colors.textMuted, flexShrink: 1 },
  empty: { color: colors.textMuted, fontSize: 13, marginTop: spacing.sm },
  blockRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  rowTitle: { fontSize: 14, fontWeight: '600', color: colors.dark },
  rowSubtitle: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  removeText: { color: '#dc2626', fontSize: 13, fontWeight: '600' },
});
