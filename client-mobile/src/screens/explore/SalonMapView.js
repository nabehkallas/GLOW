import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { useTranslation } from 'react-i18next';
import { Scissors, Star } from 'lucide-react-native';
import { colors, radius, spacing } from '../../theme';

const DAMASCUS = { latitude: 33.5138, longitude: 36.2765 };

export default function SalonMapView({ salons, coords, onSelectSalon }) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState(null);

  const pins = useMemo(
    () => salons.filter((s) => s.latitude != null && s.longitude != null),
    [salons]
  );

  const initialRegion = {
    latitude: coords?.lat ?? DAMASCUS.latitude,
    longitude: coords?.lng ?? DAMASCUS.longitude,
    latitudeDelta: coords ? 0.08 : 1.2,
    longitudeDelta: coords ? 0.08 : 1.2,
  };

  return (
    <View style={s.root}>
      <MapView
        style={s.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={initialRegion}
        showsUserLocation={!!coords}
        showsMyLocationButton={false}
        onPress={() => setSelected(null)}
      >
        {pins.map((salon) => (
          <Marker
            key={salon.id}
            coordinate={{ latitude: Number(salon.latitude), longitude: Number(salon.longitude) }}
            onPress={(e) => {
              e.stopPropagation();
              setSelected(salon);
            }}
          >
            <View style={[s.pin, selected?.id === salon.id && s.pinActive]}>
              <Scissors size={14} color="#fff" strokeWidth={1.75} />
            </View>
          </Marker>
        ))}
      </MapView>

      {selected && (
        <TouchableOpacity
          style={s.card}
          activeOpacity={0.9}
          onPress={() => onSelectSalon(selected)}
        >
          {selected.logo_url ? (
            <Image source={{ uri: selected.logo_url }} style={s.cardImage} />
          ) : (
            <View style={[s.cardImage, s.cardImagePlaceholder]}>
              <Scissors size={22} color="#fff" strokeWidth={1.75} style={{ opacity: 0.6 }} />
            </View>
          )}
          <View style={s.cardBody}>
            <Text style={s.cardName} numberOfLines={1}>{selected.name}</Text>
            <View style={s.cardMetaRow}>
              {selected.average_rating != null && (
                <View style={s.cardRatingWrap}>
                  <Star size={11} color={colors.primary} fill={colors.primary} strokeWidth={1.75} />
                  <Text style={s.cardMeta}>{selected.average_rating} ·</Text>
                </View>
              )}
              <Text style={s.cardMeta} numberOfLines={1}>
                {selected.city}
                {selected.distance_km != null ? ` · ${selected.distance_km} ${t('salons.km')}` : ''}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  map: { flex: 1 },

  pin: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.dark,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  pinActive: { backgroundColor: colors.primary },
  pinText: { fontSize: 14, color: '#fff' },

  card: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.md,
    backgroundColor: '#fff',
    borderRadius: radius.md,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  cardImage: { width: 64, height: 64 },
  cardImagePlaceholder: { backgroundColor: colors.dark, justifyContent: 'center', alignItems: 'center' },
  cardBody: { flex: 1, padding: spacing.sm, justifyContent: 'center' },
  cardName: { fontSize: 14, fontWeight: '700', color: colors.dark, textAlign: 'right' },
  cardMetaRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  cardRatingWrap: { flexDirection: 'row-reverse', alignItems: 'center', gap: 3 },
  cardMeta: { fontSize: 12, color: colors.textMuted, marginTop: 4, textAlign: 'right' },
});
