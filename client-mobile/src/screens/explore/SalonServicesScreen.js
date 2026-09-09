import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Clock } from 'lucide-react-native';
import { colors, spacing, radius, shadow, fonts } from '../../theme';

export default function SalonServicesScreen({ route, navigation }) {
  const { t } = useTranslation();
  const { salonId, services } = route.params;

  // AvailableSlotsScreen defaults its service selector to services[0], so
  // booking a specific service means putting that one first in the list.
  const bookService = (svc) => navigation.navigate('AvailableSlots', {
    salonId,
    services: [svc, ...services.filter((s) => s.id !== svc.id)],
  });

  return (
    <ScrollView style={s.root} contentContainerStyle={s.content}>
      {services.map((svc) => (
        <TouchableOpacity key={svc.id} style={s.card} activeOpacity={0.85} onPress={() => bookService(svc)}>
          <View style={s.meta}>
            <View style={s.pricePill}>
              <Text style={s.priceText}>{t('salons.price', { amount: svc.price })}</Text>
            </View>
            <View style={s.durationRow}>
              <Clock size={12} color={colors.textMuted} strokeWidth={1.75} />
              <Text style={s.duration}>{svc.duration_minutes} د</Text>
            </View>
          </View>
          <Text style={s.name}>{svc.name}</Text>
          {svc.description ? <Text style={s.description}>{svc.description}</Text> : null}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.sm },
  card: {
    backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md,
    ...shadow,
  },
  name: { fontFamily: fonts.bodySemibold, fontSize: 15, color: colors.dark, textAlign: 'right', marginBottom: 4 },
  description: { fontFamily: fonts.body, fontSize: 13, color: colors.textMuted, textAlign: 'right', lineHeight: 20 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: 8 },
  pricePill: { backgroundColor: colors.primary + '22', paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full },
  priceText: { fontFamily: fonts.bodySemibold, color: colors.primaryDark, fontSize: 13, writingDirection: 'ltr' },
  durationRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  duration: { fontFamily: fonts.body, color: colors.textMuted, fontSize: 12 },
});
