import React, { useCallback, useLayoutEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Plus } from 'lucide-react-native';
import api from '../../api/client';
import Card from '../../components/Card';
import { colors, radius, spacing } from '../../theme';

export default function ServicesListScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    return api
      .get('/salon/services')
      .then(({ data }) => setServices(data.data ?? data))
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={() => navigation.navigate('ServiceForm')} style={s.headerAddBtn} activeOpacity={0.8} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Plus size={20} color="#fff" />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const destroy = (service) => {
    Alert.alert(t('services.deleteConfirm'), '', [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          await api.delete(`/salon/services/${service.id}`);
          setServices((prev) => prev.filter((sv) => sv.id !== service.id));
        },
      },
    ]);
  };

  return (
    <View style={s.wrap}>
      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.xl }} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: spacing.md, gap: spacing.sm }}>
          {services.length === 0 ? (
            <Text style={s.empty}>{t('services.noServices')}</Text>
          ) : (
            services.map((sv) => (
              <Card key={sv.id} style={{ marginBottom: spacing.sm }}>
                <View style={s.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.name}>{sv.name}</Text>
                    {sv.category ? (
                      <View style={s.categoryBadge}>
                        <Text style={s.categoryText}>{sv.category}</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={s.price}>${sv.price}</Text>
                </View>
                <Text style={s.meta}>
                  {sv.duration_minutes} {t('services.min')}
                  {sv.description ? ` · ${sv.description}` : ''}
                </Text>
                {(sv.available_from || sv.available_until) && (
                  <Text style={s.available}>
                    {t('services.availableLabel')}: {sv.available_from ?? '—'} – {sv.available_until ?? '—'}
                  </Text>
                )}
                <View style={s.actionsRow}>
                  <TouchableOpacity style={s.actionBtn} onPress={() => navigation.navigate('ServiceForm', { service: sv })} activeOpacity={0.8}>
                    <Text style={s.actionText}>{t('common.edit')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[s.actionBtn, s.deleteBtn]} onPress={() => destroy(sv)} activeOpacity={0.8}>
                    <Text style={s.deleteText}>{t('common.delete')}</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.background },
  headerAddBtn: { paddingHorizontal: 16 },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: spacing.xl, fontSize: 14 },
  row: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  name: { fontSize: 15, fontWeight: '700', color: colors.dark },
  categoryBadge: { alignSelf: 'flex-start', backgroundColor: '#fff1eb', borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 2, marginTop: 4 },
  categoryText: { fontSize: 11, fontWeight: '700', color: '#c2410c' },
  price: { fontSize: 16, fontWeight: '800', color: colors.primary },
  meta: { fontSize: 12, color: colors.textMuted, marginTop: spacing.xs },
  available: { fontSize: 11, color: '#c2410c', marginTop: 4 },
  actionsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  actionBtn: { paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.sm, backgroundColor: colors.background },
  actionText: { fontSize: 12, fontWeight: '600', color: colors.dark },
  deleteBtn: { backgroundColor: '#fef2f2' },
  deleteText: { fontSize: 12, fontWeight: '600', color: '#dc2626' },
});
