import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import api from '../../api/client';
import { colors, spacing, radius } from '../../theme';

const { width } = Dimensions.get('window');

/* ─── Date helpers ──────────────────────────────────── */
function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}
function fmtDate(date) { return date.toISOString().split('T')[0]; }
function fmtDay(date)  { return date.toLocaleDateString('ar-SY', { weekday: 'short' }); }
function fmtNum(date)  { return date.getDate(); }
function fmtMonth(date){ return date.toLocaleDateString('ar-SY', { month: 'short' }); }

/* ─── Screen ────────────────────────────────────────── */
export default function AvailableSlotsScreen({ route, navigation }) {
  const { t } = useTranslation();
  const { salonId, services } = route.params;

  const [selectedService, setSelectedService] = useState(services[0] ?? null);
  const [selectedDate, setSelectedDate]       = useState(new Date());
  const [selectedSlot, setSelectedSlot]       = useState(null);
  const [slots, setSlots]                     = useState([]);
  const [loading, setLoading]                 = useState(false);

  const dates = Array.from({ length: 14 }, (_, i) => addDays(new Date(), i));

  useEffect(() => {
    navigation.setOptions({ title: 'حجز موعد' });
  }, []);

  useEffect(() => {
    if (!selectedService) return;
    setLoading(true);
    setSelectedSlot(null);
    api
      .get(`/client/salons/${salonId}/available-slots`, {
        params: { date: fmtDate(selectedDate), service_id: selectedService.id },
      })
      .then((res) => setSlots((res.data.slots ?? []).filter((sl) => sl.available)))
      .catch(() => setSlots([]))
      .finally(() => setLoading(false));
  }, [selectedService, selectedDate]);

  const handleNext = () => {
    if (!selectedSlot || !selectedService) return;
    navigation.navigate('BookingConfirm', {
      salonId,
      service: selectedService,
      date: fmtDate(selectedDate),
      slot: selectedSlot,
    });
  };

  const canConfirm = !!selectedSlot && !!selectedService;

  return (
    <View style={s.root}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* ── Service selector ───────────────────────── */}
        <Text style={s.sectionLabel}>{t('slots.selectService')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.hScroll}
          contentContainerStyle={s.hScrollContent}>
          {services.map((svc) => {
            const active = selectedService?.id === svc.id;
            return (
              <TouchableOpacity
                key={svc.id}
                style={[s.svcCard, active && s.svcCardActive]}
                onPress={() => setSelectedService(svc)}
                activeOpacity={0.85}
              >
                <Text style={[s.svcName, active && s.svcNameActive]} numberOfLines={1}>
                  {svc.name}
                </Text>
                <View style={s.svcMeta}>
                  <Text style={[s.svcDuration, active && { color: 'rgba(255,255,255,0.8)' }]}>
                    ⏱ {svc.duration_minutes} د
                  </Text>
                  <Text style={[s.svcPrice, active && { color: '#fff' }]}>
                    {svc.price} ل.س
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── Date selector ──────────────────────────── */}
        <Text style={s.sectionLabel}>{t('slots.selectDate')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.hScroll}
          contentContainerStyle={s.hScrollContent}>
          {dates.map((d, i) => {
            const active = fmtDate(d) === fmtDate(selectedDate);
            return (
              <TouchableOpacity
                key={i}
                style={[s.dateChip, active && s.dateChipActive]}
                onPress={() => setSelectedDate(d)}
                activeOpacity={0.85}
              >
                <Text style={[s.dateDay, active && s.dateDayActive]}>{fmtDay(d)}</Text>
                <Text style={[s.dateNum, active && s.dateNumActive]}>{fmtNum(d)}</Text>
                <Text style={[s.dateMonth, active && s.dateMonthActive]}>{fmtMonth(d)}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── Time slots ─────────────────────────────── */}
        <Text style={s.sectionLabel}>{t('slots.selectTime')}</Text>

        {loading ? (
          <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: spacing.xl }} />
        ) : slots.length === 0 ? (
          <View style={s.noSlotsWrap}>
            <Text style={s.noSlotsEmoji}>🕐</Text>
            <Text style={s.noSlotsText}>{t('slots.noSlots')}</Text>
          </View>
        ) : (
          <View style={s.slotsGrid}>
            {slots.map((slot) => {
              const active = selectedSlot?.time === slot.time;
              return (
                <TouchableOpacity
                  key={slot.time}
                  style={[s.slotChip, active && s.slotChipActive]}
                  onPress={() => setSelectedSlot(slot)}
                  activeOpacity={0.85}
                >
                  <Text style={[s.slotTime, active && s.slotTimeActive]}>
                    {slot.time}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Bottom spacer so content clears the sticky footer */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── Sticky confirm footer ───────────────────── */}
      <SafeAreaView edges={['bottom']} style={s.footer}>
        <TouchableOpacity
          style={[s.confirmBtn, !canConfirm && s.confirmBtnDisabled]}
          onPress={handleNext}
          disabled={!canConfirm}
          activeOpacity={0.85}
        >
          <Text style={s.confirmBtnText}>
            {canConfirm
              ? `${t('common.confirm')} — ${selectedSlot?.time} · ${selectedService?.name}`
              : t('common.confirm')}
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

/* ─── Styles ────────────────────────────────────────── */
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md },

  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.dark,
    textAlign: 'right',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    letterSpacing: 0.3,
  },

  hScroll: { marginHorizontal: -spacing.md },
  hScrollContent: { paddingHorizontal: spacing.md, gap: 10 },

  /* Service cards */
  svcCard: {
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    borderRadius: radius.md,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: colors.border,
    minWidth: 130,
    alignItems: 'flex-end',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  svcCardActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.35,
    elevation: 5,
  },
  svcName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.dark,
    textAlign: 'right',
    marginBottom: 6,
  },
  svcNameActive: { color: '#fff' },
  svcMeta: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: spacing.sm,
  },
  svcPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
    writingDirection: 'ltr',
  },
  svcDuration: {
    fontSize: 12,
    color: colors.textMuted,
  },

  /* Date chips */
  dateChip: {
    width: 60,
    paddingVertical: 12,
    borderRadius: radius.md,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 1,
  },
  dateChipActive: {
    backgroundColor: colors.dark,
    borderColor: colors.dark,
  },
  dateDay: { fontSize: 11, color: colors.textMuted, fontWeight: '600' },
  dateDayActive: { color: 'rgba(255,255,255,0.65)' },
  dateNum: { fontSize: 22, fontWeight: '900', color: colors.dark, lineHeight: 28 },
  dateNumActive: { color: '#fff' },
  dateMonth: { fontSize: 10, color: colors.textMuted, fontWeight: '500', marginTop: 1 },
  dateMonthActive: { color: 'rgba(255,255,255,0.65)' },

  /* Slot grid — 4 per row */
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: spacing.xs,
  },
  slotChip: {
    width: (width - spacing.md * 2 - 30) / 4,
    paddingVertical: 13,
    borderRadius: radius.sm,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  slotChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.3,
    elevation: 4,
  },
  slotTime: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.dark,
    writingDirection: 'ltr',
  },
  slotTimeActive: { color: '#fff' },

  /* Empty state */
  noSlotsWrap: { paddingTop: spacing.xl, alignItems: 'center', gap: spacing.sm },
  noSlotsEmoji: { fontSize: 44 },
  noSlotsText: { color: colors.textMuted, fontSize: 15, textAlign: 'center' },

  /* Confirm footer */
  footer: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 12,
  },
  confirmBtn: {
    height: 54,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  confirmBtnDisabled: {
    backgroundColor: '#cfd8dc',
    shadowOpacity: 0,
    elevation: 0,
  },
  confirmBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
});

